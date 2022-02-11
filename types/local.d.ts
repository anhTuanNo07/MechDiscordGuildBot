export interface WebhookEvent<TEventName extends string, TData extends Record<string, any>> {
  event: TEventName
  params: TData
  txHash: string
  blockNumber: number
  blockTime: string
  txIndex: number
  from: string
  to: string
}

export interface GuildCreatedData {
  guildId: string
  guildMaster: string
  sigNonce: string
  bool: boolean
}

export interface GuildMasterChangedData {
  guildId: string
  oldMaster: string
  newMaster: string
}

export interface RequestToJoinData {
  guildId: string
  memberAddress: string
}

export interface RequestCanceledData {
  guildId: string
  memberAddress: string
}

export interface JoinedData {
  guildId: string
  memberAddress: string
}

export interface OutOfGuildData {
  guildId: string
  memberAddress: string
}

export interface GuildHallContributedData {
  guildId: string
  member: string
  amountMaterial: string
}

export interface GuildHallUpgradedData {
  guildId: string
  level: number
  completedTime: string
}

export type UnifiedWebhookEvent =
  | WebhookEvent<'GuildCreated', GuildCreatedData>
  | WebhookEvent<'GuildMasterChanged', GuildMasterChangedData>
  | WebhookEvent<'RequestToJoin', RequestToJoinData>
  | WebhookEvent<'RequestCanceled', RequestCanceledData>
  | WebhookEvent<'Joined', JoinedData>
  | WebhookEvent<'OutOfGuild', OutOfGuildData>
  | WebhookEvent<'GuildHallContributed', GuildHallContributedData>
  | WebhookEvent<'GuildHallUpgraded', GuildHallUpgradedData>
