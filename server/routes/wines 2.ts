import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/wines
router.get('/', async (req, res) => {
  try {
    const wines = await storage.getWines();
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini' });
  }
});

// GET /api/wines/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wine = await storage.getWineById(id);
    if (!wine) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.json(wine);
  } catch (error) {
    console.error('Error fetching wine:', error);
    res.status(500).json({ error: 'Errore nel caricamento del vino' });
  }
});

// POST /api/wines
router.post('/', async (req, res) => {
  try {
    const wine = await storage.createWine(req.body);
    res.status(201).json(wine);
  } catch (error) {
    console.error('Error creating wine:', error);
    res.status(500).json({ error: 'Errore nella creazione del vino' });
  }
});

// PUT /api/wines/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wine = await storage.updateWine(id, req.body);
    if (!wine) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.json(wine);
  } catch (error) {
    console.error('Error updating wine:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del vino' });
  }
});

// DELETE /api/wines/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteWine(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vino non trovato' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wine:', error);
    res.status(500).json({ error: 'Errore nella cancellazione del vino' });
  }
});

// GET /api/wines/type/:type
router.get('/type/:type', async (req, res) => {
  try {
    const wines = await storage.getWinesByType(req.params.type);
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines by type:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini per tipo' });
  }
});

// GET /api/wines/supplier/:supplier
router.get('/supplier/:supplier', async (req, res) => {
  try {
    const wines = await storage.getWinesBySupplier(req.params.supplier);
    res.json(wines);
  } catch (error) {
    console.error('Error fetching wines by supplier:', error);
    res.status(500).json({ error: 'Errore nel caricamento dei vini per fornitore' });
  }
});

// GET /api/wines/alerts/low-stock
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const wines = await storage.getLowStockWines();
    res.json(wines);
  } catch (error) {
    console.error('Error fetching low stock wines:', error);
    res.status(500).json({ error: 'Errore nel caricamento degli avvisi scorte' });
  }
});

export default router;
