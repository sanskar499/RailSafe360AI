import express from 'express';
import {
  getLocoFirePreventionStatus,
  overrideLocoFireSensors,
  getFireTimeline,
  getFireAnalytics
} from '../controllers/fireController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics', protect, getFireAnalytics);
router.get('/loco/:locoNo', protect, getLocoFirePreventionStatus);
router.post('/sensor-override/:locoNo', protect, authorize('Admin', 'Inspector', 'Maintenance Technician'), overrideLocoFireSensors);
router.get('/timeline/:locoNo', protect, getFireTimeline);

export default router;
