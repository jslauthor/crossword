import { PuzzleType } from 'app/page';
import { useCallback, useEffect, useState } from 'react';
import { SolutionCell } from 'types/types';
import { PuzzleProps } from 'components/pages/PuzzlePage';
import { useMutation, useStorage } from 'liveblocks.config';
import {
  invertAtlas,
  updateAnswerIndex as mutateAnswerIndex,
  verifyAnswerIndex,
} from '../puzzle';

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  atlas: PuzzleProps['characterTextureAtlasLookup'],
  isInitialized = true,
) => {
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // TODO: You need to build the anserIndex when this is first set
  const characterPositions = useStorage(
    (root) => root.state.characterPositions,
  );
  // Is the cell in draft mode or default?
  // 0 = default
  // 1 = draft
  const draftModes = useStorage((root) => root.state.draftModes);
  // This can be one of three values:
  // 0 = default
  // 1 = error
  // 2 = verified (cannot change letter later)
  const validations = useStorage((root) => root.state.validations);
  const elapsedTime = useStorage((root) => root.state.time);

  const [autocheckEnabled, setAutocheckEnabled] = useState<boolean>(false);
  const [draftModeEnabled, setDraftModeEnabled] = useState<boolean>(false);
  const [answerIndex, setAnswerIndex] = useState<number[]>([]);

  const [hasRetrievedGameState, setHasRetrievedGameState] =
    useState<boolean>(false);

  const addCellValidation = useMutation(({ storage }, newValidations) => {
    storage.get('state').set('validations', newValidations);
  }, []);

  // Check if the puzzle is solved when the answer index changes
  useEffect(() => {
    if (verifyAnswerIndex(answerIndex)) {
      setIsPuzzleSolved(true);
    }
  }, [answerIndex]);

  const addAutocheckEnabled = useCallback(
    (autoCheck: boolean) => {
      if (autoCheck === true) {
        // Iterate through answer index and update cellValidationArray
        const newCellValidationArray = new Uint16Array(validations);
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
        addCellValidation(newCellValidationArray);
      }
      setAutocheckEnabled(autoCheck);
    },
    [addCellValidation, answerIndex, puzzle.record.solution, validations],
  );

  const addDraftModeEnabled = useCallback((draftModeEnabled: boolean) => {
    setDraftModeEnabled(draftModeEnabled);
  }, []);

  const addCellDraftMode = useMutation(({ storage }, newDraftModes) => {
    storage.get('state').set('draftModes', newDraftModes);
  }, []);

  const addCharacterPosition = useMutation(
    ({ storage }, newCharacterPositions) => {
      storage.get('state').set('characterPositions', newCharacterPositions);
    },
    [],
  );

  const addTime = useMutation(({ storage }, newTime) => {
    storage.get('state').set('time', newTime);
  }, []);

  useEffect(() => {
    if (isInitialized === false || characterPositions != null) return;

    const index = mutateAnswerIndex(
      puzzle.answerIndex.slice(),
      invertAtlas(atlas),
      characterPositions,
      puzzle.record.solution,
    );
    setAnswerIndex(index);
    setHasRetrievedGameState(true);
  }, [
    atlas,
    characterPositions,
    isInitialized,
    puzzle.answerIndex,
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

        const newValidations = validations.slice();
        if (autocheckEnabled) {
          // 2 = correct
          // 1 = incorrect
          newValidations[index * 2] = isCorrect ? 2 : 1;
        } else {
          // 0 = default
          newValidations[index * 2] = 0;
        }

        const newDraftModes = draftModes.slice();
        newDraftModes[index * 2] = draftModeEnabled ? 1 : 0;

        addCellDraftMode(newDraftModes);
        addCellValidation(newValidations);

        setAnswerIndex(newAnswerIndex);
      }
    },
    [
      addCellDraftMode,
      addCellValidation,
      answerIndex,
      autocheckEnabled,
      draftModeEnabled,
      draftModes,
      validations,
    ],
  );

  const updateCharacterPosition = useCallback(
    (selectedIndex: number, key: string, x: number, y: number) => {
      if (validations[selectedIndex * 2] !== 2) {
        updateAnswerIndex(
          puzzle.record.solution[selectedIndex],
          selectedIndex,
          key.toUpperCase(),
        );
        const newArray = characterPositions.slice();
        newArray[selectedIndex * 2] = x;
        newArray[selectedIndex * 2 + 1] = y;
        addCharacterPosition(newArray);
        return true;
      }

      return false;
    },
    [
      addCharacterPosition,
      characterPositions,
      puzzle.record.solution,
      updateAnswerIndex,
      validations,
    ],
  );

  return {
    isPuzzleSolved,
    addCharacterPosition,
    addTime,
    elapsedTime,
    characterPositions,
    hasRetrievedGameState,
    validations,
    addCellValidation,
    draftModes,
    addCellDraftMode,
    autocheckEnabled,
    addAutocheckEnabled,
    draftModeEnabled,
    addDraftModeEnabled,
    updateCharacterPosition,
  };
};
