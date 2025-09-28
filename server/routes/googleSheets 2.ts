import { Router } from 'express';
import { storage } from '../storage';
import { googleSheetsService } from '../services/googleSheetsService';

const router = Router();

// GET /api/google-sheet-link/:userId
router.get('/link/:userId', async (req, res) => {
  try {
    const link = await storage.getGoogleSheetLink(req.params.userId);
    res.json(link || null);
  } catch (error) {
    console.error('Error fetching Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nel caricamento del link Google Sheet' });
  }
});

// POST /api/google-sheet-link
router.post('/link', async (req, res) => {
  try {
    const { userId, sheetUrl } = req.body;
    if (!userId || !sheetUrl) {
      return res.status(400).json({ error: 'UserId e sheetUrl sono richiesti' });
    }
    const link = await storage.saveGoogleSheetLink(userId, sheetUrl);
    res.json(link);
  } catch (error) {
    console.error('Error saving Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nel salvataggio del link Google Sheet' });
  }
});

// DELETE /api/google-sheet-link/:userId
router.delete('/link/:userId', async (req, res) => {
  try {
    const success = await storage.deleteGoogleSheetLink(req.params.userId);
    if (success) {
      res.json({ message: 'Link eliminato con successo' });
    } else {
      res.status(404).json({ error: 'Link non trovato' });
    }
  } catch (error) {
    console.error('Error deleting Google Sheet link:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione del link Google Sheet' });
  }
});

// POST /api/import-google-sheet
router.post('/import', async (req, res) => {
  try {
    const { userId, sheetUrl } = req.body;
    if (!userId || !sheetUrl) {
      return res.status(400).json({ error: 'UserId e sheetUrl sono richiesti' });
    }

    const result = await googleSheetsService.importFromGoogleSheet({ userId, sheetUrl });
    res.json(result);
  } catch (error) {
    console.error('Error importing Google Sheet:', error);
    res.status(500).json({ error: error.message || 'Errore nell\'importazione del Google Sheet' });
  }
});

export default router;
