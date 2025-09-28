import { pgTable, serial, integer, decimal, varchar } from 'drizzle-orm/pg-core';
import { z } from 'zod';

/**
 * Tabella wines - Catalogo vini con inventario e informazioni fornitore
 * Contiene tutti i vini disponibili con scorte, prezzi e metadati
 */
export const wines = pgTable('wines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'rosso', 'bianco', 'bollicine', 'rosato'
  supplier: varchar('supplier', { length: 255 }).notNull(), // TODO: Normalizzare a 'fornitore' in fase futura
  inventory: integer('inventory').notNull().default(3),
  minStock: integer('min_stock').notNull().default(2),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  vintage: varchar('vintage', { length: 10 }),
  region: varchar('region', { length: 255 }),
  description: varchar('description', { length: 1000 }),
  userId: varchar('user_id', { length: 255 }),
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
 * Alias per compatibilità naming - PREPARAZIONE MIGRAZIONE FUTURA
 * @deprecated Usa 'supplier' per coerenza con schema database
 * Questi alias facilitano la migrazione graduale supplier/fornitore
 */
export type WineSupplierField = Wine['supplier'];
export type InsertWineSupplierField = InsertWine['supplier'];

// Schema di validazione Zod per Wine
export const WineSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  type: z.enum(['rosso', 'bianco', 'bollicine', 'rosato']),
  supplier: z.string().min(1).max(255),
  inventory: z.number().int().min(0),
  minStock: z.number().int().min(0),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prezzo deve essere un numero decimale valido'),
  vintage: z.string().max(10).nullable(),
  region: z.string().max(255).nullable(),
  description: z.string().max(1000).nullable(),
  userId: z.string().max(255).nullable(),
});

// Schema di validazione Zod per InsertWine
export const InsertWineSchema = z.object({
  name: z.string().min(1, 'Nome è obbligatorio').max(255),
  type: z.enum(['rosso', 'bianco', 'bollicine', 'rosato'], {
    message: 'Tipo deve essere: rosso, bianco, bollicine o rosato'
  }),
  supplier: z.string().min(1, 'Fornitore è obbligatorio').max(255),
  inventory: z.number().int().min(0, 'Inventario non può essere negativo').default(3),
  minStock: z.number().int().min(0, 'Stock minimo non può essere negativo').default(2),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prezzo deve essere un numero decimale valido'),
  vintage: z.string().max(10).nullable().optional(),
  region: z.string().max(255).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  userId: z.string().max(255).nullable().optional(),
});
