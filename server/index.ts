/**
 * Server Entry Point
 * Gestisce avvio, segnali di terminazione e graceful shutdown
 */

import { app } from './app';
import { validateEnvironment } from './config/env';

// Valida configurazione ambiente
const config = validateEnvironment();

// Avvia server
const server = app.listen(config.PORT, () => {
  console.log(`✅ Server WineNode avviato sulla porta ${config.PORT}`);
  console.log(`🌐 Health check: http://localhost:${config.PORT}/api/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n📡 Ricevuto segnale ${signal}, avvio graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Errore durante chiusura server:', err);
      process.exit(1);
    }
    
    console.log('✅ Server chiuso correttamente');
    process.exit(0);
  });
  
  // Force shutdown dopo 10 secondi
  setTimeout(() => {
    console.error('⚠️ Force shutdown dopo timeout');
    process.exit(1);
  }, 10000);
};

// Gestione segnali di terminazione
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});