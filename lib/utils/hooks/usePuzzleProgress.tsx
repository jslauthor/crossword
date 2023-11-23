import { PuzzleType } from 'app/page';
import localForage from 'localforage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAsyncQueue from './useAsyncQueue';
import { useUser } from '@clerk/nextjs';
import { useThrottle } from './useThrottle';

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

export const usePuzzleProgress = (puzzle: PuzzleType, isInitialized = true) => {
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
  const answerIndexStorageKey = useMemo(
    () => `puzzle-${puzzle.id}-answer-index`,
    [puzzle],
  );
  const elapsedTimeStorageKey = useMemo(
    () => `puzzle-${puzzle.id}-time`,
    [puzzle],
  );

  // TODO: Use singleton for throttled hook
  // TODO: Use the right throttled

  const saveToServer = useCallback(() => {
    const save = async () => {
      console.log('saving!');
      const state = await localForage.getItem(characterPositionStorageKey);
      const time = await localForage.getItem(elapsedTimeStorageKey);
      const index = await localForage.getItem(answerIndexStorageKey);

      // We need to wait until all values are available before saving
      // And there needs to be an authenticated user
      if (user == null || state == null || time == null || index == null)
        return;

      await fetch(`/api/progress/puzzle/${puzzle.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          state,
          time,
          index,
        } as PrismaJson.ProgressType),
      });
    };
    save();
  }, [
    answerIndexStorageKey,
    characterPositionStorageKey,
    elapsedTimeStorageKey,
    puzzle.id,
    user,
  ]);

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

  const addAnswerIndex = useCallback(
    (answerIndex: number[]) => {
      add({
        id: answerIndexStorageKey,
        task: () =>
          localForage.setItem(answerIndexStorageKey, {
            timestamp: Date.now(),
            value: answerIndex,
          }),
      });
      setAnswerIndex(answerIndex);
      saveToServerDebounced();
    },
    [add, answerIndexStorageKey, saveToServerDebounced],
  );

  const addTime = useCallback(
    (elapsedTime: number) => {
      console.log(elapsedTime);
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

  useEffect(() => {
    // We initialize the array with the max safe integer
    // Each integer will map to the index of the character in the record solution
    // Since bitwise operations only work on 32 bit integers, we need to split the array into chunks of 32
    const indices = Array.from(
      { length: Math.ceil(puzzle.record.solution.length / 32) },
      () => Number.MAX_SAFE_INTEGER >>> 0,
    );

    for (const [index, cell] of puzzle.record.solution.entries()) {
      if (cell !== '#') {
        const chunk = Math.floor(index / 32);
        const bit = index % 32;
        indices[chunk] &= ~(1 << bit);
      }
    }

    setAnswerIndex(indices);
  }, [puzzle.record.solution]);

  // Load previous state from local storage and compare to server data
  useEffect(() => {
    if (isInitialized === false || hasRetrievedGameState === true) return;

    const retrieveGameState = async () => {
      const state = await getItem<Float32Array>(
        characterPositionStorageKey,
        puzzle.progress
          ? {
              value: new Float32Array(
                Object.values(puzzle.progress.data.state.value ?? []),
              ),
              timestamp: puzzle.progress.data.state.timestamp ?? 0,
            }
          : undefined,
      );
      if (state != null) {
        addCharacterPosition(state);
      }

      const index = await getItem<number[]>(
        answerIndexStorageKey,
        puzzle.progress
          ? {
              value: puzzle.progress.data.index.value ?? [],
              timestamp: puzzle.progress.data.index.timestamp ?? 0,
            }
          : undefined,
      );
      if (index != null) {
        addAnswerIndex(index);
      }

      const time = await getItem<number>(
        elapsedTimeStorageKey,
        puzzle.progress
          ? {
              value: puzzle.progress.data.time.value ?? 0,
              timestamp: puzzle.progress.data.time.timestamp ?? 0,
            }
          : undefined,
      );
      if (time != null) {
        addTime(time);
      }

      setHasRetrievedGameState(true);
    };
    retrieveGameState();
  }, [
    addAnswerIndex,
    addCharacterPosition,
    addTime,
    answerIndexStorageKey,
    characterPositionStorageKey,
    elapsedTimeStorageKey,
    hasRetrievedGameState,
    isInitialized,
    puzzle.progress,
  ]);

  return {
    addCharacterPosition,
    addAnswerIndex,
    addTime,
    elapsedTime,
    characterPositionArray,
    answerIndex,
    hasRetrievedGameState,
    saveToServer,
  };
};
