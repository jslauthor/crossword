import { PuzzleType } from 'app/page';
import localForage from 'localforage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAsyncQueue from './useAsyncQueue';
import { useUser } from '@clerk/nextjs';
import { useThrottle } from './useThrottle';
import { SolutionCell } from 'types/types';
import { PuzzleProps } from 'components/pages/PuzzlePage';
import { invertAtlas, updateAnswerIndex as mutateAnswerIndex } from '../puzzle';

const getItem = async <T,>(
  key: string,
  fallback: { value: T; timestamp: number } | undefined,
): Promise<T | undefined> => {
  const item = (await localForage.getItem(key)) as {
    value: T;
    timestamp: number;
  } | null;

  if (item != null) {
    if (fallback && fallback.timestamp > item.timestamp) {
      return fallback.value;
    }

    return item.value;
  }

  return fallback?.value;
};

const getNumber = (val: number) => (val > -1 ? val : undefined);

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  atlas: PuzzleProps['characterTextureAtlasLookup'],
  isInitialized = true,
) => {
  const { user } = useUser();
  const { add } = useAsyncQueue({ concurrency: 1 });

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [answerIndex, setAnswerIndex] = useState<number[]>([]);
  const [characterPositionArray, setCharacterPositionArray] =
    useState<Float32Array>(
      Float32Array.from(new Array(puzzle.record.solution.length * 2).fill(-1)),
    );

  const [hasRetrievedGameState, setHasRetrievedGameState] =
    useState<boolean>(false);
  const characterPositionStorageKey = useMemo(
    () => `puzzle-${puzzle.id}`,
    [puzzle],
  );
  const elapsedTimeStorageKey = useMemo(
    () => `puzzle-${puzzle.id}-time`,
    [puzzle],
  );

  const saveToServer = useCallback(() => {
    const save = async () => {
      const state = (await localForage.getItem(
        characterPositionStorageKey,
      )) as PrismaJson.ProgressType['state'];
      const time = (await localForage.getItem(
        elapsedTimeStorageKey,
      )) as PrismaJson.ProgressType['time'];

      // We need to wait until all values are available before saving
      // And there needs to be an authenticated user
      if (user == null || state == null || time == null) return;

      await fetch(`/api/progress/puzzle/${puzzle.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          state,
          time,
        } as PrismaJson.ProgressType),
      });
    };
    save();
  }, [characterPositionStorageKey, elapsedTimeStorageKey, puzzle.id, user]);

  // Debounce saving to server
  const [saveToServerDebounced] = useThrottle(saveToServer, 5000);

  const addCharacterPosition = useCallback(
    (characterPositionArray: Float32Array) => {
      add({
        id: characterPositionStorageKey,
        task: () =>
          localForage.setItem(characterPositionStorageKey, {
            timestamp: Date.now(),
            value: characterPositionArray,
          }),
      });
      setCharacterPositionArray(characterPositionArray);
      saveToServerDebounced();
    },
    [add, characterPositionStorageKey, saveToServerDebounced],
  );

  const addTime = useCallback(
    (elapsedTime: number) => {
      add({
        id: elapsedTimeStorageKey,
        task: () =>
          localForage.setItem(elapsedTimeStorageKey, {
            timestamp: Date.now(),
            value: elapsedTime,
          }),
      });
      setElapsedTime(elapsedTime);
      saveToServerDebounced();
    },
    [add, elapsedTimeStorageKey, saveToServerDebounced],
  );

  // Load previous state from local storage and compare to server data
  useEffect(() => {
    if (isInitialized === false || hasRetrievedGameState === true) return;

    const retrieveGameState = async () => {
      /**
       * Compare local and server state and merge if needed
       */
      const localState = (await localForage.getItem(
        characterPositionStorageKey,
      )) as {
        value: Float32Array;
        timestamp: number;
      } | null;
      const serverState = puzzle.progress
        ? {
            value: new Float32Array(
              Object.values(puzzle.progress.data.state.value ?? []),
            ),
            timestamp: puzzle.progress.data.state.timestamp ?? 0,
          }
        : undefined;
      if (localState != null && serverState == null) {
        addCharacterPosition(localState.value);
        mutateAnswerIndex(
          puzzle.answerIndex,
          invertAtlas(atlas),
          localState.value,
          puzzle.record.solution,
        );
      } else if (localState == null && serverState != null) {
        addCharacterPosition(serverState.value);
        // no need to mutate answer index here because it's already been done by the server
      } else if (localState != null && serverState != null) {
        const updatedPosition = characterPositionArray.map((_, index) => {
          const newerState =
            serverState.timestamp > localState.timestamp
              ? serverState
              : localState;
          const olderState =
            serverState.timestamp < localState.timestamp
              ? serverState
              : localState;
          return getNumber(newerState.value[index]) ?? olderState.value[index];
        });
        addCharacterPosition(updatedPosition);
        mutateAnswerIndex(
          puzzle.answerIndex,
          invertAtlas(atlas),
          updatedPosition,
          puzzle.record.solution,
        );
      }
      setAnswerIndex(puzzle.answerIndex);

      /**
       * Grab the newer time state
       */
      let localTime = (await localForage.getItem(elapsedTimeStorageKey)) as {
        value: number;
        timestamp: number;
      } | null;

      const serverTime = puzzle.progress
        ? {
            value: puzzle.progress.data.time.value ?? 0,
            timestamp: puzzle.progress.data.time.timestamp ?? 0,
          }
        : undefined;

      if (localTime != null) {
        // Take the newer of the two
        if (serverTime && serverTime.timestamp > localTime.timestamp) {
          localTime = serverTime;
        }
        addTime(localTime.value);
      } else if (serverTime != null) {
        addTime(serverTime.value);
      }

      setHasRetrievedGameState(true);
    };
    retrieveGameState();
  }, [
    addCharacterPosition,
    addTime,
    atlas,
    characterPositionArray,
    characterPositionStorageKey,
    elapsedTimeStorageKey,
    hasRetrievedGameState,
    isInitialized,
    puzzle.answerIndex,
    puzzle.progress,
    puzzle.record.solution,
  ]);

  const updateAnswerIndex = useCallback(
    (cell: SolutionCell, index: number, letter: string) => {
      if (cell !== '#') {
        const chunk = Math.floor(index / 32);
        const bit = index % 32;
        const isCorrect =
          !(letter === '' || letter === 'BACKSPACE') &&
          cell.value.toUpperCase() === letter.toUpperCase();
        const newAnswerIndex = [...answerIndex];
        if (isCorrect) {
          // This flips the index bit to 1 (true)
          newAnswerIndex[chunk] |= 1 << bit;
        } else {
          // This flips the index bit to 0 (false)
          newAnswerIndex[chunk] &= ~(1 << bit);
        }
        setAnswerIndex(newAnswerIndex);
      }
    },
    [answerIndex],
  );

  return {
    addCharacterPosition,
    addTime,
    updateAnswerIndex,
    elapsedTime,
    characterPositionArray,
    answerIndex,
    hasRetrievedGameState,
    saveToServerDebounced,
  };
};
