import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const AlertSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  code: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  type: { type: String, enum: ['Kavach', 'Mechanical', 'Signal', 'Communication', 'Electrical'], required: true },
  timestamp: { type: String, required: true },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

let Alert;

export const getAlertModel = () => {
  if (global.isMockDB) {
    return createMockModel('Alert');
  }
  if (!Alert) {
    Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
  }
  return Alert;
};
