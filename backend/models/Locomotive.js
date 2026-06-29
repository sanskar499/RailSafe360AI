import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const LocomotiveSchema = new mongoose.Schema({
  locoNo: { type: String, required: true, unique: true },
  model: { type: String, required: true, enum: ['WAP7', 'WAP5', 'WAG9', 'WAG7', 'WDM', 'WDG'] },
  manufacturingYear: { type: Number, required: true },
  status: { type: String, default: 'Healthy', enum: ['Healthy', 'Maintenance Soon', 'Critical'] },
  currentShed: { type: String, default: 'Jamalpur' },
  driver: { type: String, default: 'Unassigned' },
  health: { type: Number, default: 100 },
  battery: { type: Number, default: 100 }, // in %
  brake: { type: Number, default: 100 }, // in %
  tractionMotor: { type: Number, default: 100 }, // in %
  gpsStatus: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  rfStatus: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  kavachStatus: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Override'] },
  maintenanceStatus: { type: String, default: 'Operational', enum: ['Operational', 'Scheduled', 'Under Inspection', 'Under Repair', 'Out of Service'] },
  images: [{ type: String }],
  history: [{
    date: { type: String },
    type: { type: String },
    remarks: { type: String },
    technician: { type: String }
  }]
}, { timestamps: true });

let Locomotive;

export const getLocomotiveModel = () => {
  if (global.isMockDB) {
    return createMockModel('Locomotive');
  }
  if (!Locomotive) {
    Locomotive = mongoose.models.Locomotive || mongoose.model('Locomotive', LocomotiveSchema);
  }
  return Locomotive;
};
