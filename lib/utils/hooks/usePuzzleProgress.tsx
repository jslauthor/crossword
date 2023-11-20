import { PuzzleType } from 'app/page';
import localForage from 'localforage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAsyncQueue from './useAsyncQueue';
import { CharacterRecord } from '../puzzle';

export const usePuzzleProgress = (puzzle: PuzzleType, isInitialized = true) => {
  // TODO: Write api route to save progress to server periodically (should be authenticated)
  // TODO: If server has newer data, overwrite local storage

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

  const addCharacterPosition = useCallback(
    (characterPositionArray: Float32Array) => {
      add({
        id: characterPositionStorageKey,
        task: () =>
          localForage.setItem(characterPositionStorageKey, {
            timestamp: Date.now(),
            characterPositionArray,
          }),
      });
      setCharacterPositionArray(characterPositionArray);
    },
    [add, characterPositionStorageKey],
  );

  const addAnswerIndex = useCallback(
    (answerIndex: number[]) => {
      add({
        id: answerIndexStorageKey,
        task: () =>
          localForage.setItem(answerIndexStorageKey, {
            timestamp: Date.now(),
            answerIndex,
          }),
      });
      setAnswerIndex(answerIndex);
    },
    [add, answerIndexStorageKey],
  );

  const addTime = useCallback(
    (elapsedTime: number) => {
      add({
        id: elapsedTimeStorageKey,
        task: () =>
          localForage.setItem(elapsedTimeStorageKey, {
            timestamp: Date.now(),
            time: elapsedTime,
          }),
      });
      setElapsedTime(elapsedTime);
    },
    [add, elapsedTimeStorageKey],
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
      const cItem = (await localForage.getItem(
        characterPositionStorageKey,
      )) as { characterPositionArray: Float32Array };
      if (cItem != null) {
        setCharacterPositionArray(cItem.characterPositionArray);
      }

      const aItem = (await localForage.getItem(answerIndexStorageKey)) as {
        answerIndex: number[];
      };
      if (aItem != null) {
        setAnswerIndex(aItem.answerIndex);
      }

      const tItem = (await localForage.getItem(elapsedTimeStorageKey)) as {
        time: number;
      };
      if (tItem != null) {
        setElapsedTime(tItem.time);
      }
      setHasRetrievedGameState(true);
    };
    retrieveGameState();
  }, [
    answerIndexStorageKey,
    characterPositionStorageKey,
    elapsedTimeStorageKey,
    hasRetrievedGameState,
    isInitialized,
  ]);

  return {
    addCharacterPosition,
    addAnswerIndex,
    addTime,
    elapsedTime,
    characterPositionArray,
    answerIndex,
    hasRetrievedGameState,
  };
};
