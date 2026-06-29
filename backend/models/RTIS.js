import mongoose from 'mongoose';
import { createMockModel } from '../config/db.js';

const RTISSchema = new mongoose.Schema({
  locoNo: { type: String, required: true, unique: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, required: true },
  direction: { type: String, required: true },
  lastStation: { type: String, required: true },
  nextStation: { type: String, required: true },
  eta: { type: String, required: true },
  signalAspect: { type: String, enum: ['Red', 'Yellow', 'Green'], default: 'Green' },
  movementTimeline: [{
    station: { type: String },
    time: { type: String },
    status: { type: String }
  }]
}, { timestamps: true });

let RTIS;

export const getRTISModel = () => {
  if (global.isMockDB) {
    return createMockModel('RTIS');
  }
  if (!RTIS) {
    RTIS = mongoose.models.RTIS || mongoose.model('RTIS', RTISSchema);
  }
  return RTIS;
};
