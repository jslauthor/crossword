'use client';

import { PuzzleType } from 'app/page';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SolutionCell } from 'types/types';
import { PuzzleProps } from 'components/pages/PuzzlePage';
import {
  CHARACTER_POSITIONS_KEY,
  DRAFT_MODES_KEY,
  GAME_STATE_KEY,
  TIME_KEY,
  VALIDATIONS_KEY,
  createInitialYDoc,
  initializeAnswerIndex,
  invertAtlas,
  updateAnswerIndex as mutateAnswerIndex,
  verifyAnswerIndex,
} from '../puzzle';
import localforage from 'localforage';
import { nanoid } from 'nanoid';
import { useUser, useAuth } from '@clerk/nextjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';

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

export const usePuzzleProgress = (
  puzzle: PuzzleType,
  atlas: PuzzleProps['characterTextureAtlasLookup'],
  isInitialized = true,
) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [anonCacheId, setAnonCacheId] = useState<string | null>(null);
  // Always initialize the document with reasonable defaults
  const [doc, setDoc] = useState<Y.Doc>(createInitialYDoc(puzzle));
  const [indexDb, setIndexDb] = useState<IndexeddbPersistence | null>(null);
  const [partykit, setPartykit] = useState<YPartyKitProvider | null>(null);
  const [hasRetrievedState, setHasRetrievedState] = useState<boolean>(false);

  const initState = useCallback(() => {
    // Set the initial state
    setElapsedTime(doc.getMap(GAME_STATE_KEY).get(TIME_KEY) as number);
    const positions = new Float32Array(
      doc.getMap(GAME_STATE_KEY).get(CHARACTER_POSITIONS_KEY) as number[],
    );

    setCharacterPositionArray(positions);
    setCellValidationArray(
      new Uint16Array(
        doc.getMap(GAME_STATE_KEY).get(VALIDATIONS_KEY) as number[],
      ),
    );
    setCellDraftModeArray(
      new Uint16Array(
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
  }, [atlas, doc, puzzle.record.solution]);

  // Create local cache to store offline progress. This will always be anonymous
  // but will be merged with the user cache when the user logs in
  useEffect(() => {
    const initializeLocalCache = async () => {
      const anonCacheId = await getLocalCacheId(puzzle.id);
      setAnonCacheId(anonCacheId);
    };
    initializeLocalCache();
  }, [puzzle, doc]);

  // Setup indexdb yjs provider for local storage
  useEffect(() => {
    if (anonCacheId != null) {
      const db = new IndexeddbPersistence(anonCacheId, doc);
      db.once('synced', () => {
        initState();
        setIndexDb(db);
      });

      return () => {
        db.destroy();
      };
    }
  }, [anonCacheId, doc, initState]);

  // Initialize the server after local cache is synced
  useEffect(() => {
    if (user?.id == null || indexDb == null || isInitialized === false) return;

    let ypartyProvider: YPartyKitProvider | null = null;

    const initialize = async () => {
      const token = await getToken();
      const ypartyProvider: YPartyKitProvider = new YPartyKitProvider(
        process.env.NEXT_PUBLIC_PARTYKIT_URL!,
        `${user.id}:${puzzle.id}`,
        doc,
        {
          params: {
            clerkId: user.id,
            puzzleId: puzzle.id,
            token,
          },
          connect: token != null,
        },
      );
      ypartyProvider.once('synced', () => {
        initState();
        setPartykit(ypartyProvider);
      });
      initState();
    };

    initialize();

    return () => {
      ypartyProvider?.disconnect();
    };
  }, [doc, getToken, indexDb, initState, isInitialized, puzzle.id, user?.id]);

  useEffect(() => {
    // disconnect from server if the user is no longer logged in
    if (user?.id == null && partykit != null) {
      partykit.disconnect();
      setPartykit(null);
    }
  }, [partykit, user?.id]);

  // Observe the document for changes and update the state
  useEffect(() => {
    doc?.getMap(GAME_STATE_KEY).observe((event) => {
      event.keysChanged.forEach((key) => {
        switch (key) {
          case CHARACTER_POSITIONS_KEY:
            setCharacterPositionArray(
              new Float32Array(
                event.target.get(CHARACTER_POSITIONS_KEY) as number[],
              ),
            );
            break;
          case VALIDATIONS_KEY:
            setCellValidationArray(
              new Uint16Array(event.target.get(VALIDATIONS_KEY) as number[]),
            );
            break;
          case DRAFT_MODES_KEY:
            setCellDraftModeArray(
              new Uint16Array(event.target.get(DRAFT_MODES_KEY) as number[]),
            );
            break;
          case TIME_KEY:
            setElapsedTime(event.target.get(TIME_KEY) as number);
            break;
          default:
            break;
        }
      });
    });
  }, [doc]);

  // const socket = usePartySocket({
  //   host: process.env.NEXT_PUBLIC_PARTYKIT_URL,
  //   room: 'hello',
  //   onMessage(event) {
  //     console.log(event);
  //   },
  // });
  // socket.send('hello from client');

  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  const [autocheckEnabled, setAutocheckEnabled] = useState<boolean>(false);
  const [draftModeEnabled, setDraftModeEnabled] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>();
  const [answerIndex, setAnswerIndex] = useState<number[]>([]);
  const [characterPositions, setCharacterPositionArray] =
    useState<Float32Array>();

  // This can be one of three values:
  // 0 = default
  // 1 = error
  // 2 = verified (cannot change letter later)
  const [validations, setCellValidationArray] = useState<Uint16Array>();

  // Is the cell in draft mode or default?
  // 0 = default
  // 1 = draft
  const [draftModes, setCellDraftModeArray] = useState<Uint16Array>();

  // Check if the puzzle is solved when the answer index changes
  useEffect(() => {
    if (verifyAnswerIndex(answerIndex)) {
      setAutocheckEnabled(false);
      setDraftModeEnabled(false);
      setIsPuzzleSolved(true);
    }
  }, [answerIndex]);

  const addCellValidation = useCallback(
    (validations: Uint16Array) => {
      doc
        ?.getMap(GAME_STATE_KEY)
        .set(VALIDATIONS_KEY, Y.Array.from(Array.from(validations)));
    },
    [doc],
  );

  const addAutocheckEnabled = useCallback(
    (autoCheck: boolean) => {
      if (isPuzzleSolved || validations == null) return;
      if (autoCheck === true) {
        // Iterate through answer index and update validations
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
    [
      isPuzzleSolved,
      validations,
      addCellValidation,
      puzzle.record.solution,
      answerIndex,
    ],
  );

  const addDraftModeEnabled = useCallback(
    (draftModeEnabled: boolean) => {
      if (isPuzzleSolved) return;
      setDraftModeEnabled(draftModeEnabled);
    },
    [isPuzzleSolved],
  );

  const addCellDraftMode = useCallback(
    (draftModes: Uint16Array) => {
      doc
        ?.getMap(GAME_STATE_KEY)
        .set(DRAFT_MODES_KEY, Y.Array.from(Array.from(draftModes)));
    },
    [doc],
  );

  const addCharacterPosition = useCallback(
    (characterPositions: Float32Array) => {
      doc
        ?.getMap(GAME_STATE_KEY)
        .set(
          CHARACTER_POSITIONS_KEY,
          Y.Array.from(Array.from(characterPositions)),
        );
    },
    [doc],
  );

  const addTime = useCallback(
    (time: number) => {
      if (elapsedTime == null) return;
      // Always take the larger of the two times since multiple
      // clients can be on the page longer
      doc?.getMap(GAME_STATE_KEY).set(TIME_KEY, Math.max(time, elapsedTime));
    },
    [doc, elapsedTime],
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
          const newValidations = new Uint16Array(validations);
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
          const newDraftModes = new Uint16Array(draftModes);
          newDraftModes[index * 2] = draftModeEnabled ? 1 : 0;

          addCellDraftMode(newDraftModes);
        }

        setAnswerIndex(newAnswerIndex);
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
      if (validations[selectedIndex * 2] !== 2) {
        updateAnswerIndex(
          puzzle.record.solution[selectedIndex],
          selectedIndex,
          key.toUpperCase(),
        );
        const newArray = new Float32Array([...characterPositions]);
        newArray[selectedIndex * 2] = x;
        newArray[selectedIndex * 2 + 1] = y;
        addCharacterPosition(newArray);
        return true;
      }

      return false;
    },
    [
      validations,
      updateAnswerIndex,
      puzzle.record.solution,
      characterPositions,
      addCharacterPosition,
    ],
  );

  return {
    isPuzzleSolved,
    addCharacterPosition,
    addTime,
    elapsedTime,
    addCellValidation,
    addCellDraftMode,
    autocheckEnabled,
    addAutocheckEnabled,
    draftModeEnabled,
    addDraftModeEnabled,
    updateCharacterPosition,
    validations,
    draftModes,
    characterPositions,
    hasRetrievedState,
  };
};
