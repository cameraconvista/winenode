import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { validateEnvironment } from "./config/env";

neonConfig.webSocketConstructor = ws;

// Valida configurazione ambiente
const config = validateEnvironment();

const pool = new Pool({ connectionString: config.DATABASE_URL });
export const db = drizzle({ client: pool, schema });