import express from 'express';
import {
  getLocomotives,
  getLocomotiveByIdOrNo,
  createLocomotive,
  updateLocoMetrics,
  getAlerts,
  resolveAlert,
  addServiceHistory
} from '../controllers/locomotiveController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getLocomotives);
router.get('/alerts', protect, getAlerts);
router.put('/alerts/:id/resolve', protect, authorize('Admin', 'Inspector'), resolveAlert);
router.get('/:idOrNo', protect, getLocomotiveByIdOrNo);
router.post('/', protect, authorize('Admin'), createLocomotive);
router.put('/:id/metrics', protect, authorize('Admin', 'Inspector', 'Maintenance Technician'), updateLocoMetrics);
router.post('/:id/history', protect, authorize('Admin', 'Inspector', 'Maintenance Technician'), addServiceHistory);

export default router;
