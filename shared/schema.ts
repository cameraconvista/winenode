import { pgTable, serial, integer, decimal, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Tabella wines - Catalogo vini con inventario e informazioni fornitore
 * Contiene tutti i vini disponibili con scorte, prezzi e metadati
 */
export const wines = pgTable('wines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'rosso', 'bianco', 'bollicine', 'rosato'
  supplier: varchar('supplier', { length: 255 }).notNull(),
  inventory: integer('inventory').notNull().default(3),
  minStock: integer('min_stock').notNull().default(2),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  vintage: varchar('vintage', { length: 10 }),
  region: varchar('region', { length: 255 }),
  description: varchar('description', { length: 1000 }),
  userId: varchar('user_id', { length: 255 }),
});

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
 * Tipo Wine - Rappresenta un vino completo con tutti i campi dal database
 * Utilizzato per operazioni di lettura e visualizzazione
 */
export type Wine = typeof wines.$inferSelect;

/**
 * Tipo InsertWine - Rappresenta i dati necessari per inserire un nuovo vino
 * Campi opzionali e default gestiti automaticamente da Drizzle
 */
export type InsertWine = typeof wines.$inferInsert;

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