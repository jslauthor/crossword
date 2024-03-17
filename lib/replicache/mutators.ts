import { WriteTransaction } from 'replicache';
import { PuzzleType } from 'app/page';
import { createFloat32Array, createUint16Array } from 'lib/utils/puzzle';

export type Mutators = typeof mutators;
export const TIME_KEY = 'TIME_KEY';
export const CHARACTER_POSITION_KEY = 'CHARACTER_POSITION_KEY';
export const CELL_DRAFT_MODES_KEY = 'CELL_DRAFT_MODES_KEY';
export const CELL_VALIDATIONS_KEY = 'CELL_VALIDATIONS_KEY';

export const mutators = {
  async setTime(tx: WriteTransaction, state: PrismaJson.ProgressType['time']) {
    await tx.set(TIME_KEY, state);
  },
  async setCharacterPosition(
    tx: WriteTransaction,
    state: PrismaJson.ProgressType['state'],
  ) {
    await tx.set(CHARACTER_POSITION_KEY, state);
  },
  async setCellDraftModes(
    tx: WriteTransaction,
    state: PrismaJson.ProgressType['draftModes'],
  ) {
    await tx.set(CELL_DRAFT_MODES_KEY, state);
  },
  async setValidations(
    tx: WriteTransaction,
    state: PrismaJson.ProgressType['validations'],
  ) {
    await tx.set(CELL_VALIDATIONS_KEY, state);
  },
  // async getGameState(tx: WriteTransaction, puzzle: PuzzleType) {
  //   let gameState = await tx.get<PrismaJson.ProgressType>(GAME_STATE_KEY);
  //   // Load a fresh copy of the game state if it doesn't exist
  //   if (gameState == null) {
  //     gameState = {
  //       time: 0,
  //       state: JSON.parse(JSON.stringify(createFloat32Array(puzzle))),
  //       validations: JSON.parse(JSON.stringify(createUint16Array(puzzle))),
  //       draftModes: JSON.parse(JSON.stringify(createUint16Array(puzzle))),
  //     };
  //     await tx.set(GAME_STATE_KEY, gameState);
  //   }
  //   return gameState;
  // },
  // async mergeGameState(
  //   tx: WriteTransaction,
  //   anonymousState: PrismaJson.ProgressType,
  // ) {
  //   const state = (await tx.get(GAME_STATE_KEY)) as PrismaJson.ProgressType;
  //   const mergedState = { ...state, ...anonymousState };
  //   await tx.set(GAME_STATE_KEY, mergedState);
  // },
};
