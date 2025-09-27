import express from 'express';
import cors from 'cors';
import { storage } from './storage';
import { validateEnvironment } from './config/env';
import winesRouter from './routes/wines';
import googleSheetsRouter from './routes/googleSheets';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', asyncHandler(async (req, res) => {
  // Test database connectivity
  await storage.getWines();
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
}));

// Routes
app.use('/api/wines', winesRouter);
app.use('/api/google-sheet', googleSheetsRouter);

// Suppliers API
app.get('/api/suppliers', asyncHandler(async (req, res) => {
  const suppliers = await storage.getSuppliers();
  res.json(suppliers);
}));

// Error handling middleware (deve essere alla fine)
app.use(notFoundHandler);
app.use(errorHandler);

// Valida configurazione ambiente
const config = validateEnvironment();

app.listen(config.PORT, () => {
  console.log(`Server API avviato sulla porta ${config.PORT}`);
});