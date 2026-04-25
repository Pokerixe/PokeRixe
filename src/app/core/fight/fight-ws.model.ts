import { FightState } from './fight.model';

export type ClientAttackMessage = {
  type: 'attack';
  moveSlot: number;
  pokemonSlot: number;
};

export type ClientSwitchMessage = {
  type: 'switch';
  switchToSlotIndex: number;
};

export type ClientMessage = ClientAttackMessage | ClientSwitchMessage;

export type WaitingOpponentMessage = { type: 'waiting_opponent' };

export type FullStateMessage = {
  type: 'full_state';
  payload: FightState;
};

export type ErrorMessage = {
  type: 'error';
  message: string;
};

export type ServerMessage = WaitingOpponentMessage | FullStateMessage | ErrorMessage;
