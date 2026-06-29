import express from 'express';
import { getDashboardSummary, getAnalyticsCharts, getExportReportData } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, getDashboardSummary);
router.get('/charts', protect, getAnalyticsCharts);
router.get('/export', protect, getExportReportData);

export default router;
