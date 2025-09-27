import express from 'express';
import cors from 'cors';
import { storage } from './storage';
import { validateEnvironment } from './config/env';
import winesRouter from './routes/wines';
import googleSheetsRouter from './routes/googleSheets';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connectivity
    await storage.getWines();
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Routes
app.use('/api/wines', winesRouter);
app.use('/api/google-sheet', googleSheetsRouter);

// Suppliers API
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei fornitori' });
  }
});

// Valida configurazione ambiente
const config = validateEnvironment();

app.listen(config.PORT, () => {
  console.log(`Server API avviato sulla porta ${config.PORT}`);
});