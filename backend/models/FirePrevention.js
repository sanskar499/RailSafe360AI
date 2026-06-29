import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

// 1. Fire Sensor Schema
const FireSensorSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  smokeStatus: { type: String, default: 'No Smoke', enum: ['No Smoke', 'Light Smoke', 'Heavy Smoke'] },
  thermalSensorStatus: { type: String, default: 'Normal' },
  electricalSensorStatus: { type: String, default: 'Normal' }
}, { timestamps: true });

// 2. Fire Alert Schema
const FireAlertSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  alertType: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, required: true, enum: ['Safe', 'Low', 'Medium', 'High', 'Critical'] },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// 3. Hazard Prediction Schema
const HazardPredictionSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  probability: { type: Number, default: 0 },
  possibleCause: { type: String, default: 'None' },
  suggestedAction: { type: String, default: 'None' }
}, { timestamps: true });

// 4. Thermal Reading Schema
const ThermalReadingSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  tractionMotor: { type: Number, default: 45 },
  transformer: { type: Number, default: 40 },
  battery: { type: Number, default: 25 },
  brake: { type: Number, default: 35 },
  electricalPanel: { type: Number, default: 30 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// 5. Emergency Action Schema
const EmergencyActionSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  actionTaken: { type: String, required: true },
  engineerNotified: { type: String, default: 'Unassigned' },
  maintenanceTicketCreated: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Exports
export const getFireSensorModel = () => {
  if (global.isMockDB) return createMockModel('FireSensor');
  return mongoose.models.FireSensor || mongoose.model('FireSensor', FireSensorSchema);
};

export const getFireAlertModel = () => {
  if (global.isMockDB) return createMockModel('FireAlert');
  return mongoose.models.FireAlert || mongoose.model('FireAlert', FireAlertSchema);
};

export const getHazardPredictionModel = () => {
  if (global.isMockDB) return createMockModel('HazardPrediction');
  return mongoose.models.HazardPrediction || mongoose.model('HazardPrediction', HazardPredictionSchema);
};

export const getThermalReadingModel = () => {
  if (global.isMockDB) return createMockModel('ThermalReading');
  return mongoose.models.ThermalReading || mongoose.model('ThermalReading', ThermalReadingSchema);
};

export const getEmergencyActionModel = () => {
  if (global.isMockDB) return createMockModel('EmergencyAction');
  return mongoose.models.EmergencyAction || mongoose.model('EmergencyAction', EmergencyActionSchema);
};
