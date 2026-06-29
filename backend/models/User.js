import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector'] },
  employeeId: { type: String, required: true, unique: true },
  currentShed: { type: String, default: 'Jamalpur' }
}, { timestamps: true });

let User;

export const getUserModel = () => {
  if (global.isMockDB) {
    return createMockModel('User');
  }
  if (!User) {
    User = mongoose.models.User || mongoose.model('User', UserSchema);
  }
  return User;
};
