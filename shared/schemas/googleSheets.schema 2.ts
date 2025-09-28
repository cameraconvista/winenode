import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

/**
 * Tabella google_sheet_links - Collegamenti a Google Sheets per importazione automatica
 * Memorizza URL e metadati per sincronizzazione catalogo vini da fogli esterni
 */
export const googleSheetLinks = pgTable('google_sheet_links', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sheetUrl: varchar('sheet_url', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Tipo GoogleSheetLink - Rappresenta un collegamento Google Sheets completo
 * Include metadati di creazione e aggiornamento
 */
export type GoogleSheetLink = typeof googleSheetLinks.$inferSelect;

/**
 * Tipo InsertGoogleSheetLink - Dati per creare nuovo collegamento Google Sheets
 * Timestamp gestiti automaticamente dal database
 */
export type InsertGoogleSheetLink = typeof googleSheetLinks.$inferInsert;

// Schema di validazione Zod per GoogleSheetLink
export const GoogleSheetLinkSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().min(1).max(255),
  sheetUrl: z.string().url('URL Google Sheet non valido').max(1000),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

// Schema di validazione Zod per InsertGoogleSheetLink
export const InsertGoogleSheetLinkSchema = z.object({
  userId: z.string().min(1, 'User ID è obbligatorio').max(255),
  sheetUrl: z.string().url('URL Google Sheet non valido').max(1000),
});
