'use client';

import { PuzzleType } from 'types/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SolutionCell } from 'types/types';
import {
  CHARACTER_POSITIONS_KEY,
  DRAFT_MODES_KEY,
  GAME_STATE_KEY,
  GUESSES_KEY,
  PuzzleStats,
  TIME_KEY,
  VALIDATIONS_KEY,
  createInitialYDoc,
  getPuzzleStats,
  initializeAnswerIndex,
  invertAtlas,
  updateAnswerIndex as mutateAnswerIndex,
  verifyAnswerIndex as testAnswerIndex,
} from '../puzzle';
import localforage from 'localforage';
import { nanoid } from 'nanoid';
import { useUser, useAuth } from '@clerk/nextjs';
import { IndexeddbPersistence } from 'lib/utils/y-indexeddb';
import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';
import { AtlasType } from '../atlas';
import memoizeOne from 'memoize-one';

const verifyAnswerIndex = memoizeOne(testAnswerIndex);

const AUTO_NEXT_KEY = 'auto-next';

const ANONYMOUS_PLAYER_STORAGE_KEY = 'anonymous-player-key';
const getLocalCacheId = async (puzzleId: string) => {
  let anonymousKey = await localforage.getItem<string>(
    ANONYMOUS_PLAYER_STORAGE_KEY,
  );
  if (anonymousKey == null) {
    anonymousKey = nanoid();
    await localforage.setItem(ANONYMOUS_PLAYER_STORAGE_KEY, anonymousKey);
  }

  return `${anonymousKey}:${puzzleId}`;
};

const getNumberOfEntries = memoizeOne((positions: Float32Array) => {
  return (
    positions.reduce((acc, val) => {
      return acc + (val > -1 ? 1 : 0);
    }, 0) / 2
  );
});

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  atlas?: AtlasType,
  isInitialized = true,
  openPrompt?: (isOpen: boolean) => void,
) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const numberOfCells = useMemo(
    () =>
      // Count the number of cells that are not blank ("#")
      puzzle.record.solution.filter((cell) => typeof cell.value !== 'string')
        .length,
    [puzzle.record.solution],
  );

  const [hasInteractedWithPuzzle, setHasInteractedWithPuzzle] = useState(false);
  const [anonCacheId, setAnonCacheId] = useState<string | null>(null);
  const [indexDb, setIndexDb] = useState<IndexeddbPersistence | null>(null);
  const [partykit, setPartykit] = useState<YPartyKitProvider | null>(null);
  const [hasRetrievedState, setHasRetrievedState] = useState<boolean>(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
  const [puzzleStats, setPuzzleStats] = useState<PuzzleStats | null>(null);
  const [autoNextEnabled, setAutoNextEnabled] = useState<boolean>(true);
  const [autocheckEnabled, setAutocheckEnabled] = useState<boolean>(false);
  const [draftModeEnabled, setDraftModeEnabled] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>();
  const [guesses, setGuesses] = useState<number>();
  const [answerIndex, setAnswerIndex] = useState<number[]>([]);
  const [characterPositions, setCharacterPositionArray] =
    useState<Float32Array>();

  // This can be one of three values:
  // 0 = default
  // 1 = error
  // 2 = verified (cannot change letter later)
  const [validations, setCellValidationArray] = useState<Int16Array>();

  // Is the cell in draft mode or default?
  // 0 = default
  // 1 = draft
  const [draftModes, setCellDraftModeArray] = useState<Int16Array>();

  const initState = useCallback(
    (doc: Y.Doc, atlas: AtlasType) => {
      // Set the initial state
      setElapsedTime(doc.getMap(GAME_STATE_KEY).get(TIME_KEY) as number);
      setGuesses(doc.getMap(GAME_STATE_KEY).get(GUESSES_KEY) as number);
      const positions = new Float32Array(
        doc.getMap(GAME_STATE_KEY).get(CHARACTER_POSITIONS_KEY) as number[],
      );

      setCharacterPositionArray(positions);
      setCellValidationArray(
        new Int16Array(
          doc.getMap(GAME_STATE_KEY).get(VALIDATIONS_KEY) as number[],
        ),
      );
      setCellDraftModeArray(
        new Int16Array(
          doc.getMap(GAME_STATE_KEY).get(DRAFT_MODES_KEY) as number[],
        ),
      );
      const index = mutateAnswerIndex(
        initializeAnswerIndex(puzzle.record.solution),
        invertAtlas(atlas),
        positions,
        puzzle.record.solution,
      );
      setAnswerIndex(index);
      setHasRetrievedState(true);
    },
    [puzzle.record.solution],
  );

  // Create local cache to store offline progress. This will always be anonymous
  // but will be merged with the user cache when the user logs in
  useEffect(() => {
    const initializeLocalCache = async () => {
      const autoNext = await localforage.getItem<boolean>(AUTO_NEXT_KEY);
      setAutoNextEnabled(autoNext ?? true);

      const anonCacheId = await getLocalCacheId(puzzle.id);
      setAnonCacheId(anonCacheId);
    };
    initializeLocalCache();
  }, [puzzle]);

  // Setup indexdb yjs provider for local storage
  useEffect(() => {
    if (anonCacheId != null && atlas != null && Object.keys(atlas).length > 0) {
      const db = new IndexeddbPersistence(
        anonCacheId,
        createInitialYDoc(puzzle), // Always initialize the document with reasonable defaults
      );
      db.once('synced', () => {
        initState(db.doc, atlas);
        setIndexDb(db);
      });

      return () => {
        db.destroy();
      };
    }
  }, [anonCacheId, puzzle, initState, atlas]);

  // Initialize the server after local cache is synced
  useEffect(() => {
    if (
      user?.id == null ||
      indexDb == null ||
      isInitialized === false ||
      atlas == null
    )
      return;

    let ypartyProvider: YPartyKitProvider | null = null;

    const initialize = async () => {
      const token = await getToken();
      const ypartyProvider: YPartyKitProvider = new YPartyKitProvider(
        process.env.NEXT_PUBLIC_PARTYKIT_URL!,
        `${user.id}:${puzzle.id}`,
        indexDb.doc,
        {
          params: {
            clerkId: user.id,
            puzzleId: puzzle.id,
            token,
          },
          connect: token != null,
          maxBackoffTime: 30000,
        },
      );
      ypartyProvider.on(
        'connection-error',
        (_e: any, provider: YPartyKitProvider) => {
          if (provider.wsUnsuccessfulReconnects > 5) {
            // We need to do this so we refresh the token
            // This could lead to a memory leak, so check that in the future
            provider.destroy();
            initialize();
          }
        },
      );

      ypartyProvider.once('synced', (isSynced: boolean) => {
        if (isSynced === true) {
          setHasRetrievedState(true);
          indexDb.forcePersist();
        }
      });

      setPartykit(ypartyProvider);
    };

    initialize();
    setHasRetrievedState(false);

    return () => {
      ypartyProvider?.disconnect();
    };
  }, [atlas, getToken, indexDb, initState, isInitialized, puzzle.id, user?.id]);

  useEffect(() => {
    // disconnect from server if the user is no longer logged in
    if (user?.id == null && partykit != null) {
      partykit.disconnect();
      setPartykit(null);
    }
  }, [partykit, user?.id]);

  // Observe the document for changes and update the state
  useEffect(() => {
    if (atlas == null) return;
    indexDb?.doc?.getMap(GAME_STATE_KEY).observe((event) => {
      event.keysChanged.forEach((key) => {
        switch (key) {
          case CHARACTER_POSITIONS_KEY:
            const positions = new Float32Array(
              event.target.get(CHARACTER_POSITIONS_KEY) as number[],
            );
            const index = mutateAnswerIndex(
              initializeAnswerIndex(puzzle.record.solution),
              invertAtlas(atlas),
              positions,
              puzzle.record.solution,
            );
            setCharacterPositionArray(positions);
            setAnswerIndex(index);
            break;
          case VALIDATIONS_KEY:
            setCellValidationArray(
              new Int16Array(event.target.get(VALIDATIONS_KEY) as number[]),
            );
            break;
          case DRAFT_MODES_KEY:
            setCellDraftModeArray(
              new Int16Array(event.target.get(DRAFT_MODES_KEY) as number[]),
            );
            break;
          case TIME_KEY:
            setElapsedTime(event.target.get(TIME_KEY) as number);
            break;
          case GUESSES_KEY:
            setGuesses(event.target.get(GUESSES_KEY) as number);
            break;
          default:
            break;
        }
      });
    });
  }, [atlas, indexDb?.doc, puzzle.record.solution]);

  // Check if the puzzle is solved when the answer index changes
  useEffect(() => {
    if (verifyAnswerIndex(answerIndex)) {
      setAutocheckEnabled(false);
      setDraftModeEnabled(false);
      setIsPuzzleSolved(true);
      if (elapsedTime != null && guesses != null && validations != null) {
        setPuzzleStats(
          getPuzzleStats(puzzle, elapsedTime, guesses, validations),
        );
      }
    } else {
      setIsPuzzleSolved(false);
    }
  }, [answerIndex, elapsedTime, guesses, puzzle, validations]);

  const addCellValidation = useCallback(
    (validations: Int16Array) => {
      indexDb?.doc
        ?.getMap(GAME_STATE_KEY)
        .set(VALIDATIONS_KEY, Y.Array.from(Array.from(validations)));
    },
    [indexDb?.doc],
  );

  const addAutocheckEnabled = useCallback(
    (autoCheck: boolean) => {
      if (isPuzzleSolved || validations == null) return;
      if (autoCheck === true) {
        // Iterate through answer index and update validations
        const newCellValidationArray = new Int16Array(validations);
        for (let index = 0; index < puzzle.record.solution.length; index++) {
          if (puzzle.record.solution[index].value !== '#') {
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
    [
      isPuzzleSolved,
      validations,
      addCellValidation,
      puzzle.record.solution,
      answerIndex,
    ],
  );

  const addAutoNextEnabled = useCallback(
    (autoNext: boolean) => {
      setAutoNextEnabled(autoNext);
      const save = async () => {
        await localforage.setItem<boolean>(AUTO_NEXT_KEY, autoNext);
      };
      save();
    },
    [setAutoNextEnabled],
  );

  const addDraftModeEnabled = useCallback(
    (draftModeEnabled: boolean) => {
      if (isPuzzleSolved) return;
      setDraftModeEnabled(draftModeEnabled);
    },
    [isPuzzleSolved],
  );

  const addCellDraftMode = useCallback(
    (draftModes: Int16Array) => {
      indexDb?.doc
        ?.getMap(GAME_STATE_KEY)
        .set(DRAFT_MODES_KEY, Y.Array.from(Array.from(draftModes)));
    },
    [indexDb?.doc],
  );

  const addCharacterPosition = useCallback(
    (characterPositions: Float32Array) => {
      indexDb?.doc
        ?.getMap(GAME_STATE_KEY)
        .set(
          CHARACTER_POSITIONS_KEY,
          Y.Array.from(Array.from(characterPositions)),
        );
    },
    [indexDb?.doc],
  );

  const addTime = useCallback(
    (time: number) => {
      if (elapsedTime == null) return;
      // Always take the larger of the two times since multiple
      // clients can be on the page longer
      indexDb?.doc
        ?.getMap(GAME_STATE_KEY)
        .set(TIME_KEY, Math.max(time, elapsedTime));
    },
    [indexDb?.doc, elapsedTime],
  );

  const addGuesses = useCallback(
    (newGuesses: number) => {
      if (guesses == null) return;
      // Always take the larger of the two times since multiple
      // clients can be filling in guesses faster
      indexDb?.doc
        ?.getMap(GAME_STATE_KEY)
        .set(GUESSES_KEY, Math.max(newGuesses, guesses));
    },
    [guesses, indexDb?.doc],
  );

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

        if (validations != null) {
          const newValidations = new Int16Array(validations);
          if (autocheckEnabled) {
            // 2 = correct
            // 1 = incorrect
            newValidations[index * 2] = isCorrect ? 2 : 1;
          } else {
            // 0 = default
            newValidations[index * 2] = 0;
          }
          addCellValidation(newValidations);
        }
        if (draftModes != null) {
          const newDraftModes = new Int16Array(draftModes);
          newDraftModes[index * 2] = draftModeEnabled ? 1 : 0;

          addCellDraftMode(newDraftModes);
        }

        setAnswerIndex(newAnswerIndex);
        return newAnswerIndex;
      }
    },
    [
      addCellDraftMode,
      addCellValidation,
      answerIndex,
      autocheckEnabled,
      draftModes,
      validations,
      draftModeEnabled,
    ],
  );

  const updateCharacterPosition = useCallback(
    (selectedIndex: number, key: string, x: number, y: number) => {
      if (validations == null || characterPositions == null) return false;
      if (hasInteractedWithPuzzle === false) {
        setHasInteractedWithPuzzle(true);
      }
      if (validations[selectedIndex * 2] !== 2) {
        // do not allow updating a guess that's been successfully validated
        const newIndex = updateAnswerIndex(
          puzzle.record.solution[selectedIndex].value,
          selectedIndex,
          key.toUpperCase(),
        );
        const newArray = new Float32Array([...characterPositions]);
        newArray[selectedIndex * 2] = x;
        newArray[selectedIndex * 2 + 1] = y;

        const numEntries = getNumberOfEntries(newArray);
        const newPositionIsNotBlank = x > -1 && y > -1;
        // We only want to increment guesses if the user has filled in all the cells at least once
        // If guesses is -1, then we haven't filled in all the cells yet
        // We only increment guesses if the user didn't use backspace
        if (numEntries >= numberOfCells) {
          if (guesses === -1) {
            setGuesses(0);
          } else if (newPositionIsNotBlank === true) {
            if (guesses != null) {
              addGuesses(guesses + 1);
            }
          }
          if (
            newPositionIsNotBlank === true &&
            openPrompt != null &&
            characterPositions[selectedIndex * 2] == -1 && // check if the original cell was empty
            characterPositions[selectedIndex * 2 + 1] == -1 && // check if the original cell was empty
            verifyAnswerIndex(newIndex) === false
          ) {
            openPrompt(true);
          }
        }

        addCharacterPosition(newArray);
        return true;
      }

      return false;
    },
    [
      validations,
      characterPositions,
      hasInteractedWithPuzzle,
      updateAnswerIndex,
      puzzle.record.solution,
      addCharacterPosition,
      numberOfCells,
      guesses,
      openPrompt,
      addGuesses,
    ],
  );

  return {
    isPuzzleSolved,
    addCharacterPosition,
    hasInteractedWithPuzzle,
    addTime,
    elapsedTime,
    guesses,
    addCellValidation,
    addCellDraftMode,
    autoNextEnabled,
    addAutoNextEnabled,
    autocheckEnabled,
    addAutocheckEnabled,
    draftModeEnabled,
    addDraftModeEnabled,
    updateCharacterPosition,
    validations,
    draftModes,
    characterPositions,
    hasRetrievedState,
    puzzleStats,
  };
};
