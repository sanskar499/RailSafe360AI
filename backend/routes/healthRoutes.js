import express from 'express';
import {
  getLocoHealthStatus,
  triggerFaultOverride,
  getSparePartsPredictions,
  getKnowledgeArticles,
  getIncidentReplays
} from '../controllers/healthController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/knowledge', protect, getKnowledgeArticles);
router.get('/spare-parts', protect, getSparePartsPredictions);
router.get('/loco/:locoNo', protect, getLocoHealthStatus);
router.post('/fault/:locoNo', protect, authorize('Admin', 'Inspector', 'Maintenance Technician'), triggerFaultOverride);
router.get('/replay/:locoNo', protect, getIncidentReplays);

export default router;
