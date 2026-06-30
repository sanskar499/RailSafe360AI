import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import locomotiveRoutes from './routes/locomotiveRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import fireRoutes from './routes/fireRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// Load environmental configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON Parsers
app.use(cors());
app.use(express.json());

// Boot Database
await connectDB();

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Operational',
    system: 'RailSafe360 API Core',
    databaseMode: global.isMockDB ? 'JSON Fallback Local DB' : 'MongoDB Atlas Connection',
    timestamp: new Date().toISOString()
  });
});

// Register Module Routing
app.use('/api/auth', authRoutes);
app.use('/api/locomotives', locomotiveRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fire-prevention', fireRoutes);
app.use('/api/health-intel', healthRoutes);

// Register Global Exception Catcher
app.use(errorHandler);

// Boot Express Server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log(`📡 RailSafe360 Portal Server running on Port: ${PORT}`);
    console.log(`🔌 Mode: ${process.env.NODE_ENV || 'Development'}`);
    console.log(`💾 DB Engine: ${global.isMockDB ? 'Persistent JSON Files' : 'MongoDB Atlas'}`);
    console.log('======================================================\n');
  });
}

export default app;
