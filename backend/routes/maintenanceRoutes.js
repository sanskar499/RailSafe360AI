import express from 'express';
import {
  getMaintenanceJobs,
  getMaintenanceJobById,
  createMaintenanceRequest,
  updateMaintenanceJob
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Small fix: map getMaintenanceJobById instead of typos
router.get('/', protect, getMaintenanceJobs);
router.get('/:id', protect, getMaintenanceJobById);
router.post('/', protect, authorize('Admin', 'Inspector'), createMaintenanceRequest);
router.put('/:id', protect, authorize('Admin', 'Maintenance Technician'), updateMaintenanceJob);

export default router;
