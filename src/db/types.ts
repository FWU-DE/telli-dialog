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
  primaryHoverColor: string;
  primaryHoverTextColor: string;
  chatMessageBackgroundColor: string;
  buttonPrimaryTextColor: string;
};

export const DEFAULT_DESIGN_CONFIGURATION: DesignConfiguration = {
 primaryColor: 'rgba(70, 33, 126, 1)', // vidis-purple
 primaryTextColor: 'rgba(70, 33, 126, 1)', // primary-text
 secondaryColor: 'rgba(108, 233, 215, 1)', // vidis-hover-green
 secondaryTextColor: 'rgba(238, 238, 238, 1)', // secondary-text
 secondaryDarkColor: 'rgba(68, 209, 189, 1)', // secondary-dark
 primaryHoverColor: 'rgba(226, 251, 247, 1)', // primary with slight opacity for hover
 primaryHoverTextColor: 'rgba(70, 33, 126, 1)', // primary with slight opacity for hover
 chatMessageBackgroundColor: 'rgba(245, 245, 245, 1)', // chat-message-background
 buttonPrimaryTextColor: 'rgba(255, 255, 255, 1)', // button-primary-text
};

// export const SL_DESIGN_CONFIGURATION: DesignConfiguration = {
//   "primaryColor": "rgba(1, 45, 90, 1)", // vidis-purple
//   "primaryTextColor": "rgba(1, 45, 90, 1)", // primary-text
//   "secondaryColor": "rgba(212, 237, 251, 1)", // vidis-hover-green
//   "secondaryTextColor": "rgba(1, 45, 90, 1)", // secondary-text
//   "primaryHoverColor": "rgba(1, 45, 90, 1)", // primary with slight opacity for hover
//   "primaryHoverTextColor": "rgba(255, 255, 255, 1)", // primary with slight opacity for hover
//   "chatMessageBackgroundColor": "rgba(212, 237, 251, 1)", // chat-message-background
//   "buttonPrimaryTextColor": "rgba(255, 255, 255, 1)", // button-primary-text
// };

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
