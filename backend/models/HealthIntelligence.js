import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

// 1. Loco Diagnosis Schema
const LocoDiagnosisSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  possibleFault: { type: String, required: true },
  probability: { type: Number, default: 0 },
  severity: { type: String, enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'], default: 'Safe' },
  rootCause: { type: String, default: 'None' },
  recommendations: [{ type: String }],
  estimatedDowntime: { type: Number, default: 0 }, // in hours
  estimatedRepairCost: { type: Number, default: 0 }, // in INR
  engineerSkillRequired: { type: String, default: 'Standard Technician' }
}, { timestamps: true });

// 2. Digital Twin State Schema
const DigitalTwinStateSchema = new mongoose.Schema({
  locoNo: { type: String, required: true, unique: true },
  tractionMotorHealth: { type: Number, default: 100 },
  tractionMotorTemp: { type: Number, default: 45 },
  tractionMotorRul: { type: Number, default: 365 }, // Remaining Useful Life in days
  transformerHealth: { type: Number, default: 100 },
  transformerTemp: { type: Number, default: 40 },
  transformerRul: { type: Number, default: 420 },
  batteryHealth: { type: Number, default: 100 },
  batteryTemp: { type: Number, default: 28 },
  batteryRul: { type: Number, default: 180 },
  brakeHealth: { type: Number, default: 100 },
  brakeTemp: { type: Number, default: 35 },
  brakeRul: { type: Number, default: 240 },
  gpsStatus: { type: String, default: 'Active' },
  rfStatus: { type: String, default: 'Active' },
  kavachStatus: { type: String, default: 'Active' }
}, { timestamps: true });

// 3. Spare Part Prediction Schema
const SparePartPredictionSchema = new mongoose.Schema({
  partName: { type: String, required: true },
  probability: { type: Number, default: 0 },
  timeframe: { type: Number, enum: [7, 15, 30], default: 7 }, // Days
  quantityRequired: { type: Number, default: 1 },
  currentStock: { type: Number, default: 0 },
  status: { type: String, enum: ['Adequate', 'Reorder', 'Critical'], default: 'Adequate' }
}, { timestamps: true });

// 4. Incident Replay Schema
const IncidentReplaySchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true },
  sensorHistory: [{
    time: { type: String },
    motorTemp: { type: Number },
    current: { type: Number },
    vibration: { type: Number },
    smoke: { type: String }
  }],
  alerts: [{
    time: { type: String },
    message: { type: String }
  }],
  resolution: { type: String, default: 'Unresolved' }
}, { timestamps: true });

// 5. Knowledge Article Schema
const KnowledgeArticleSchema = new mongoose.Schema({
  componentName: { type: String, required: true },
  workingPrinciple: { type: String, default: '' },
  commonFaults: [{
    name: { type: String },
    symptoms: { type: String }
  }],
  inspectionSteps: [{ type: String }],
  safetyPrecautions: [{ type: String }],
  repairGuide: { type: String, default: '' },
  maintenanceFrequency: { type: String, default: 'Monthly' }
}, { timestamps: true });

// Exports
export const getLocoDiagnosisModel = () => {
  if (global.isMockDB) return createMockModel('LocoDiagnosis');
  return mongoose.models.LocoDiagnosis || mongoose.model('LocoDiagnosis', LocoDiagnosisSchema);
};

export const getDigitalTwinStateModel = () => {
  if (global.isMockDB) return createMockModel('DigitalTwinState');
  return mongoose.models.DigitalTwinState || mongoose.model('DigitalTwinState', DigitalTwinStateSchema);
};

export const getSparePartPredictionModel = () => {
  if (global.isMockDB) return createMockModel('SparePartPrediction');
  return mongoose.models.SparePartPrediction || mongoose.model('SparePartPrediction', SparePartPredictionSchema);
};

export const getIncidentReplayModel = () => {
  if (global.isMockDB) return createMockModel('IncidentReplay');
  return mongoose.models.IncidentReplay || mongoose.model('IncidentReplay', IncidentReplaySchema);
};

export const getKnowledgeArticleModel = () => {
  if (global.isMockDB) return createMockModel('KnowledgeArticle');
  return mongoose.models.KnowledgeArticle || mongoose.model('KnowledgeArticle', KnowledgeArticleSchema);
};
