import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const MaintenanceSchema = new mongoose.Schema({
  locoNo: { type: String, required: true },
  requestDate: { type: String, required: true },
  scheduleDate: { type: String, required: true },
  assignedEngineer: { type: String, default: 'Unassigned' },
  technician: { type: String, default: 'Unassigned' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'] },
  checklist: [{
    item: { type: String },
    checked: { type: Boolean, default: false }
  }],
  remarks: { type: String, default: '' },
  images: [{ type: String }],
  completionDate: { type: String, default: '' }
}, { timestamps: true });

let Maintenance;

export const getMaintenanceModel = () => {
  if (global.isMockDB) {
    return createMockModel('Maintenance');
  }
  if (!Maintenance) {
    Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);
  }
  return Maintenance;
};
