import express from 'express';
import { getIncidents, getIncidentById, reportIncident, updateIncident } from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncidentById);
router.post('/', protect, authorize('Admin', 'Loco Engineer'), reportIncident);
router.put('/:id', protect, authorize('Admin', 'Inspector', 'Maintenance Technician'), updateIncident);

export default router;
