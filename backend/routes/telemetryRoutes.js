import express from 'express';
import {
  getRTISTelemetry,
  getSLAMShedMap,
  analyzePredictiveMaintenance
} from '../controllers/telemetryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/rtis', protect, getRTISTelemetry);
router.get('/slam', protect, getSLAMShedMap);
router.post('/predictive', protect, analyzePredictiveMaintenance);

export default router;
