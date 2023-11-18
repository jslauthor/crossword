import { PuzzleType } from 'app/page';
import localForage from 'localforage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useAsyncQueue from './useAsyncQueue';
import { CharacterRecord } from '../puzzle';

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  record: CharacterRecord,
  isInitialized = true,
) => {
  const { add } = useAsyncQueue({ concurrency: 1 });

  const [answerIndex, setAnswerIndex] = useState<number[]>([]);
  const [characterPositionArray, setCharacterPositionArray] =
    useState<Float32Array>(
      Float32Array.from(new Array(record.solution.length * 2).fill(-1)),
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

  const addCharacterPosition = useCallback(
    (characterPositionArray: Float32Array) => {
      add({
        id: characterPositionStorageKey,
        task: () =>
          localForage.setItem(
            characterPositionStorageKey,
            characterPositionArray,
          ),
      });
      setCharacterPositionArray(characterPositionArray);
    },
    [add, characterPositionStorageKey],
  );

  const addAnswerIndex = useCallback(
    (answerIndex: number[]) => {
      add({
        id: answerIndexStorageKey,
        task: () => localForage.setItem(answerIndexStorageKey, answerIndex),
      });
      setAnswerIndex(answerIndex);
    },
    [add, answerIndexStorageKey],
  );

  useEffect(() => {
    // We initialize the array with the max safe integer
    // Each integer will map to the index of the character in the record solution
    // Since bitwise operations only work on 32 bit integers, we need to split the array into chunks of 32
    const indices = Array.from(
      { length: Math.ceil(record.solution.length / 32) },
      () => Number.MAX_SAFE_INTEGER >>> 0,
    );

    for (const [index, cell] of record.solution.entries()) {
      if (cell !== '#') {
        const chunk = Math.floor(index / 32);
        const bit = index % 32;
        indices[chunk] &= ~(1 << bit);
      }
    }

    setAnswerIndex(indices);
  }, [record.solution]);

  // Load previous state from local storage and compare to server data
  useEffect(() => {
    if (isInitialized === false || hasRetrievedGameState === true) return;

    const retrieveGameState = async () => {
      const state = (await localForage.getItem(
        characterPositionStorageKey,
      )) as Float32Array;
      const index = (await localForage.getItem(
        answerIndexStorageKey,
      )) as number[];
      if (state != null && index != null) {
        setCharacterPositionArray(state);
        setAnswerIndex(index);
      }
      setHasRetrievedGameState(true);
    };
    retrieveGameState();
  }, [
    answerIndexStorageKey,
    characterPositionStorageKey,
    hasRetrievedGameState,
    isInitialized,
  ]);

  return {
    addCharacterPosition,
    addAnswerIndex,
    characterPositionArray,
    answerIndex,
    hasRetrievedGameState,
  };
};
