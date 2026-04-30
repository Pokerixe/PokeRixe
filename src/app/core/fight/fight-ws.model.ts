import { FightState } from './fight.model';

/**
 * Generic Packet Structure
 */
export type Packet<TType extends string, TData> = {
  token: string;
  type: TType;
  data: TData;
};


export type AttackData = {
  moveSlot: number;
  pokemonSlot: number;
};

export type SwitchData = {
  switchToSlotIndex: number;
};

export type JoinData = {
  userId: string;
  username: string;
};

export interface PacketMap {
  AttackPacket: AttackData;
  SwitchPacket: SwitchData;
  JoinPacket: JoinData;
  FullStatePacket: FightState;
  GameStartPacket: {};
}

export type Message = {
  [K in keyof PacketMap]: Packet<K, PacketMap[K]>
}[keyof PacketMap];
