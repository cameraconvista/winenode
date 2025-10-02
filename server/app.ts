import express from 'express';
import cors from 'cors';
import { storage } from './storage';
import winesRouter from './routes/wines';
import googleSheetsRouter from './routes/googleSheets';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import { requestCompatibilityMiddleware, responseCompatibilityMiddleware } from './utils/compatibility';

const app = express();

app.use(cors());
app.use(express.json());

// STEP 3 - CSP Headers per consentire WebSocket Supabase
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  );
  next();
});

// Compatibility middleware per mapping supplier/fornitore
app.use(requestCompatibilityMiddleware);
app.use(responseCompatibilityMiddleware);

// Health Check (GET/HEAD)
const healthHandler = asyncHandler(async (req, res) => {
  const startTime = process.hrtime();
  
  // Test database connectivity
  await storage.getWines();
  
  const healthData = { 
    status: 'ok',
    time: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: 'connected'
  };
  
  // HEAD request - solo headers, no body
  if (req.method === 'HEAD') {
    res.status(200).end();
  } else {
    res.json(healthData);
  }
});

app.get('/api/health', healthHandler);
app.head('/api/health', healthHandler);

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

export { app };