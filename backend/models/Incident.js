import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const IncidentSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  reporterId: { type: String, required: true },
  reporterName: { type: String, required: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Brake Failure', 'RF Failure', 'GPS Failure', 'RFID Failure', 'Motor Failure', 'Traction Failure', 'Communication Failure'],
    required: true
  },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Open', enum: ['Open', 'Investigating', 'Resolved'] },
  timeline: [{
    status: { type: String },
    time: { type: String },
    remarks: { type: String },
    updatedBy: { type: String }
  }]
}, { timestamps: true });

let Incident;

export const getIncidentModel = () => {
  if (global.isMockDB) {
    return createMockModel('Incident');
  }
  if (!Incident) {
    Incident = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);
  }
  return Incident;
};
