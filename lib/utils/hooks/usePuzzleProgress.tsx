'use client';

import { PuzzleType } from 'app/page';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameState, SolutionCell } from 'types/types';
import { PuzzleProps } from 'components/pages/PuzzlePage';
import {
  CACHE_ID_KEY,
  CHARACTER_POSITIONS_KEY,
  DRAFT_MODES_KEY,
  GAME_STATE_KEY,
  TIME_KEY,
  VALIDATIONS_KEY,
  createInitialState,
  createInitialYDoc,
  initializeAnswerIndex,
  invertAtlas,
  updateAnswerIndex as mutateAnswerIndex,
  verifyAnswerIndex,
} from '../puzzle';
import localforage from 'localforage';
import { nanoid } from 'nanoid';
import { useUser } from '@clerk/nextjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';

const ANONYMOUS_PLAYER_STORAGE_KEY = 'anonymous-player-key';

// Manual memoziation
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
  gameState: GameState = createInitialState(puzzle),
) => {
  const { user } = useUser();
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [hasRetrievedState, setHasRetrievedState] = useState<boolean>(false);

  // Generate a cache id for the user
  useEffect(() => {
    if (user?.id == null) {
      const getCacheId = async () => {
        setCacheId(await getLocalCacheId(puzzle.id));
      };
      getCacheId();
    } else {
      setCacheId(`${user?.id}:${puzzle.id}`);
    }
  }, [puzzle.id, user?.id]);

  // Initialize the local and server documents
  useEffect(() => {
    if (cacheId == null || isInitialized === false) return;

    let ypartyProvider: YPartyKitProvider | null = null;

    const initialize = async () => {
      const yDoc = createInitialYDoc(cacheId, puzzle);
      const indexdb = new IndexeddbPersistence(cacheId, yDoc);
      setDoc(yDoc);
      const initState = () => {
        // Reset the cache id
        yDoc.getText(CACHE_ID_KEY).delete(0, yDoc.getText(CACHE_ID_KEY).length);
        yDoc.getText(CACHE_ID_KEY).insert(0, cacheId);

        // Set the initial state
        setElapsedTime(yDoc.getMap(GAME_STATE_KEY).get(TIME_KEY) as number);
        const positions = new Float32Array(
          yDoc.getMap(GAME_STATE_KEY).get(CHARACTER_POSITIONS_KEY) as number[],
        );
        setCharacterPositionArray(positions);
        setCellValidationArray(
          new Uint16Array(
            yDoc.getMap(GAME_STATE_KEY).get(VALIDATIONS_KEY) as number[],
          ),
        );
        setCellDraftModeArray(
          new Uint16Array(
            yDoc.getMap(GAME_STATE_KEY).get(DRAFT_MODES_KEY) as number[],
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
      };
      indexdb.once('synced', async () => {
        if (user?.id != null && cacheId.includes(user.id)) {
          const ypartyProvider = new YPartyKitProvider(
            process.env.NEXT_PUBLIC_PARTYKIT_URL!,
            cacheId,
            yDoc,
          );
          ypartyProvider.once('synced', () => {
            initState();
          });
        }

        initState();
      });
    };

    initialize();

    return () => {
      ypartyProvider?.disconnect();
    };
  }, [atlas, cacheId, isInitialized, puzzle, user?.id]);

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
  const [elapsedTime, setElapsedTime] = useState<number>(gameState.time);
  const [answerIndex, setAnswerIndex] = useState<number[]>([]);
  const [characterPositions, setCharacterPositionArray] =
    useState<Float32Array>(gameState.characterPositions);

  // This can be one of three values:
  // 0 = default
  // 1 = error
  // 2 = verified (cannot change letter later)
  const [validations, setCellValidationArray] = useState<Uint16Array>(
    gameState.validations,
  );

  // Is the cell in draft mode or default?
  // 0 = default
  // 1 = draft
  const [draftModes, setCellDraftModeArray] = useState<Uint16Array>(
    gameState.draftModes,
  );

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
      if (isPuzzleSolved) return;
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

        const newValidations = new Uint16Array(validations);
        if (autocheckEnabled) {
          // 2 = correct
          // 1 = incorrect
          newValidations[index * 2] = isCorrect ? 2 : 1;
        } else {
          // 0 = default
          newValidations[index * 2] = 0;
        }

        const newDraftModes = new Uint16Array(draftModes);
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
      draftModes,
      validations,
      draftModeEnabled,
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
