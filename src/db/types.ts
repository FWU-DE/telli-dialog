import { PgTransaction } from 'drizzle-orm/pg-core';
import { conversationMessageTable, conversationTable, userTable } from './schema';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';

export type User = typeof userTable.$inferSelect;

export type ConversationModel = typeof conversationTable.$inferSelect;
export type InsertConversationModel = typeof conversationTable.$inferInsert;

export type ConversationMessageModel = typeof conversationMessageTable.$inferSelect;
export type InsertConversationMessageModel = typeof conversationMessageTable.$inferInsert;

export type DesignConfiguration = {
  primaryColor: string;
  primaryTextColor: string;
  secondaryColor: string;
  secondaryTextColor: string;
  secondaryDarkColor: string;
  secondaryLightColor: string;
  primaryHoverColor: string;
  primaryHoverTextColor: string;
  chatMessageBackgroundColor: string;
  buttonPrimaryTextColor: string;
};


export type CustomTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
};

export type LlmModelPriceMetadata =
  | {
      type: 'text' | 'embedding';
      completionTokenPrice: number;
      promptTokenPrice: number;
    }
  | {
      type: 'image';
      pricePerImage: number;
    };

export type DbTransactionObject = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

export type PgTransactionObject = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
