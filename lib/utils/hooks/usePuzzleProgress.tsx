import { PuzzleType } from 'app/page';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SolutionCell } from 'types/types';
import {
  createFloat32Array,
  createUint16Array,
  invertAtlas,
  verifyAnswerIndex,
} from '../puzzle';
import { usePuzzleCache } from './usePuzzleCache';
import {
  CELL_DRAFT_MODES_KEY,
  CELL_VALIDATIONS_KEY,
  CHARACTER_POSITION_KEY,
  TIME_KEY,
} from 'lib/replicache/mutators';
import { PuzzleProps } from 'components/pages/PuzzlePage';

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  atlas: PuzzleProps['characterTextureAtlasLookup'],
  isInitialized = true,
) => {
  const { replicache, hasSynced } = usePuzzleCache(puzzle.id, isInitialized);

  const invertedAtlas = useMemo(() => invertAtlas(atlas), [atlas]);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [autocheckEnabled, setAutocheckEnabled] = useState<boolean>(false);
  const [draftModeEnabled, setDraftModeEnabled] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [answerIndex, setAnswerIndex] = useState<number[]>(puzzle.answerIndex);
  const [timeIsReady, setTimeIsReady] = useState<boolean>(false);

  const initialCharacterPositionArray = useMemo(
    () => createFloat32Array(puzzle),
    [puzzle],
  );
  const [characterPositionArray, setCharacterPositionArray] =
    useState<Float32Array>(initialCharacterPositionArray);

  // This can be one of three values:
  // 0 = default
  // 1 = error
  // 2 = verified (cannot change letter later)
  const initialCellValidationsArray = useMemo(
    () => createUint16Array(puzzle),
    [puzzle],
  );
  const [cellValidationArray, setCellValidationArray] = useState<Uint16Array>(
    initialCellValidationsArray,
  );

  // Is the cell in draft mode or default?
  // 0 = default
  // 1 = draft
  const initialCellDraftModesArray = useMemo(
    () => createUint16Array(puzzle),
    [puzzle],
  );
  const [cellDraftModeArray, setCellDraftModeArray] = useState<Uint16Array>(
    initialCellDraftModesArray,
  );

  const updateTime = useCallback(
    (value: number) => {
      replicache?.mutate.setTime(value);
    },
    [replicache?.mutate],
  );

  const updateCellDraftModes = useCallback(
    (value: Uint16Array) => {
      replicache?.mutate.setCellDraftModes(JSON.parse(JSON.stringify(value)));
    },
    [replicache?.mutate],
  );

  const updateCellvalidations = useCallback(
    (value: Uint16Array) => {
      replicache?.mutate.setValidations(JSON.parse(JSON.stringify(value)));
    },
    [replicache?.mutate],
  );

  // Check if the puzzle is solved when the answer index changes
  useEffect(() => {
    if (verifyAnswerIndex(answerIndex)) {
      setIsPuzzleSolved(true);
    }
  }, [answerIndex]);

  // Update validations when autocheck is enabled
  useEffect(() => {
    if (autocheckEnabled === true) {
      // Iterate through answer index and update cellValidationArray
      const newCellValidationArray = new Uint16Array(cellValidationArray);
      for (let index = 0; index < puzzle.record.solution.length; index++) {
        if (puzzle.record.solution[index] !== '#') {
          const chunk = Math.floor(index / 32);
          const bit = index % 32;
          newCellValidationArray[index * 2] =
            ((answerIndex[chunk] >> bit) & 1) === 1 ? 2 : 1;
        } else {
          newCellValidationArray[index * 2] = 0;
        }
      }
      updateCellvalidations(newCellValidationArray);
    }
  }, [
    answerIndex,
    autocheckEnabled,
    cellValidationArray,
    puzzle.record.solution,
    updateCellvalidations,
  ]);

  const updatePuzzleMetadata = useCallback(
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

        const newCellValidationArray = new Uint16Array(cellValidationArray);
        if (autocheckEnabled) {
          // 2 = correct
          // 1 = incorrect
          newCellValidationArray[index * 2] = isCorrect ? 2 : 1;
        } else {
          // 0 = default
          newCellValidationArray[index * 2] = 0;
        }

        const newCellDraftModeArray = new Uint16Array(cellDraftModeArray);
        newCellDraftModeArray[index * 2] = draftModeEnabled ? 1 : 0;

        updateCellDraftModes(newCellDraftModeArray);
        updateCellvalidations(newCellValidationArray);
        setAnswerIndex(newAnswerIndex);
      }
    },
    [
      answerIndex,
      autocheckEnabled,
      cellDraftModeArray,
      cellValidationArray,
      draftModeEnabled,
      updateCellDraftModes,
      updateCellvalidations,
    ],
  );

  // Listen for changes to the character position array
  useEffect(() => {
    if (replicache == null) return;

    const unsubscribe = replicache.subscribe(
      async (tx) =>
        (await tx.get<PrismaJson.ProgressType['state']>(
          CHARACTER_POSITION_KEY,
        )) ?? initialCharacterPositionArray,
      (newCharacterPosition) => {
        const characterArray = new Float32Array(
          Object.values(newCharacterPosition),
        );
        setCharacterPositionArray(characterArray);
      },
    );
    return () => {
      unsubscribe();
    };
  }, [
    initialCharacterPositionArray,
    invertedAtlas,
    puzzle.record.solution,
    replicache,
    updatePuzzleMetadata,
  ]);

  // Listen for changes to the cell draft modes
  useEffect(() => {
    if (replicache == null) return;

    const unsubscribe = replicache?.subscribe(
      async (tx) =>
        (await tx.get<PrismaJson.ProgressType['draftModes']>(
          CELL_DRAFT_MODES_KEY,
        )) ?? initialCellDraftModesArray,
      (newValue) => {
        if (newValue == null) return;
        setCellDraftModeArray(new Uint16Array(Object.values(newValue)));
      },
    );
    return () => {
      unsubscribe();
    };
  }, [initialCellDraftModesArray, replicache]);

  // Listen for changes to the cell validations
  useEffect(() => {
    if (replicache == null) return;

    const unsubscribe = replicache.subscribe(
      async (tx) =>
        (await tx.get<PrismaJson.ProgressType['validations']>(
          CELL_VALIDATIONS_KEY,
        )) ?? initialCellValidationsArray,
      (newValue) => {
        if (newValue == null) return;
        setCellValidationArray(new Uint16Array(Object.values(newValue)));
      },
    );
    return () => {
      unsubscribe();
    };
  }, [initialCellValidationsArray, replicache]);

  // Listen for changes to the elapsed time
  useEffect(() => {
    if (replicache == null) return;

    const unsubscribe = replicache.subscribe(
      async (tx) =>
        (await tx.get<PrismaJson.ProgressType['time']>(TIME_KEY)) ?? 0,
      (newTime) => {
        setElapsedTime(newTime);
        if (timeIsReady === false) {
          setTimeIsReady(true);
        }
      },
    );
    return () => {
      unsubscribe();
    };
  }, [replicache, timeIsReady]);

  const updateCharacterPosition = useCallback(
    (selectedIndex: number, key: string, x: number, y: number) => {
      if (cellValidationArray[selectedIndex * 2] !== 2) {
        // Update the answer index, cell validations, and cell draft modes
        updatePuzzleMetadata(
          puzzle.record.solution[selectedIndex],
          selectedIndex,
          key.toUpperCase(),
        );
        const newArray = new Float32Array([...characterPositionArray]);
        newArray[selectedIndex * 2] = x;
        newArray[selectedIndex * 2 + 1] = y;
        replicache?.mutate.setCharacterPosition(
          JSON.parse(JSON.stringify(newArray)),
        );
        return true;
      }
      return false;
    },
    [
      cellValidationArray,
      characterPositionArray,
      puzzle.record.solution,
      replicache?.mutate,
      updatePuzzleMetadata,
    ],
  );

  return {
    isPuzzleSolved,
    elapsedTime,
    timeIsReady,
    updateTime,
    characterPositionArray,
    hasRetrievedGameState: hasSynced,
    cellValidationArray,
    cellDraftModeArray,
    autocheckEnabled,
    draftModeEnabled,
    updateCharacterPosition,
    setAutocheckEnabled,
    setDraftModeEnabled,
  };
};
