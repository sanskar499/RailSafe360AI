import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { getUserModel } from '../models/User.js';
import { getLocomotiveModel } from '../models/Locomotive.js';
import { getMaintenanceModel } from '../models/Maintenance.js';
import { getAlertModel } from '../models/Alert.js';
import { getRTISModel } from '../models/RTIS.js';
import { getIncidentModel } from '../models/Incident.js';
import {
  getFireSensorModel,
  getFireAlertModel,
  getHazardPredictionModel,
  getThermalReadingModel,
  getEmergencyActionModel
} from '../models/FirePrevention.js';
import {
  getLocoDiagnosisModel,
  getDigitalTwinStateModel,
  getSparePartPredictionModel,
  getIncidentReplayModel,
  getKnowledgeArticleModel
} from '../models/HealthIntelligence.js';

dotenv.config();

const seed = async () => {
  console.log('🌱 Starting Database Seeding...');
  
  // Establish connection (or toggle JSON mock database)
  await connectDB();

  const User = getUserModel();
  const Locomotive = getLocomotiveModel();
  const Maintenance = getMaintenanceModel();
  const Alert = getAlertModel();
  const RTIS = getRTISModel();
  const Incident = getIncidentModel();

  // Clear existing records in MongoDB or local JSON DB to prevent duplicate appends
  console.log('🧹 Clearing existing collections...');
  if (global.isMockDB) {
    const fs = await import('fs');
    const path = await import('path');
    const DB_DIR = path.resolve('./data/db');
    ['user', 'locomotive', 'maintenance', 'alert', 'rtis', 'incident', 'firesensor', 'firealert', 'hazardprediction', 'thermalreading', 'emergencyaction', 'locodiagnosis', 'digitaltwinstate', 'sparepartprediction', 'incidentreplay', 'knowledgearticle'].forEach(model => {
      const filePath = path.join(DB_DIR, `${model}.json`);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    });
  } else {
    await User.deleteMany({});
    await Locomotive.deleteMany({});
    await Maintenance.deleteMany({});
    await Alert.deleteMany({});
    await RTIS.deleteMany({});
    await Incident.deleteMany({});
    
    // Fire prevention models
    await getFireSensorModel().deleteMany({});
    await getFireAlertModel().deleteMany({});
    await getHazardPredictionModel().deleteMany({});
    await getThermalReadingModel().deleteMany({});
    await getEmergencyActionModel().deleteMany({});

    // Health Intel models
    await getLocoDiagnosisModel().deleteMany({});
    await getDigitalTwinStateModel().deleteMany({});
    await getSparePartPredictionModel().deleteMany({});
    await getIncidentReplayModel().deleteMany({});
    await getKnowledgeArticleModel().deleteMany({});
  }

  // 1. Seed Users
  console.log('👤 Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const sharedPassword = await bcrypt.hash('Password123', salt);

  const usersData = [
    {
      name: 'Mr.Vishwajeet rana',
      email: 'admin@railsafe.gov.in',
      password: sharedPassword,
      role: 'Admin',
      employeeId: 'EMP-ADMIN-01',
      currentShed: 'Jamalpur'
    },
    {
      name: 'Amit Sharma',
      email: 'engineer@railsafe.gov.in',
      password: sharedPassword,
      role: 'Loco Engineer',
      employeeId: 'EMP-LE-05',
      currentShed: 'Jamalpur'
    },
    {
      name: 'Vikram Singh',
      email: 'technician@railsafe.gov.in',
      password: sharedPassword,
      role: 'Maintenance Technician',
      employeeId: 'EMP-MT-12',
      currentShed: 'Jamalpur'
    },
    {
      name: 'Suresh Chandra',
      email: 'inspector@railsafe.gov.in',
      password: sharedPassword,
      role: 'Inspector',
      employeeId: 'EMP-IN-03',
      currentShed: 'Jamalpur'
    }
  ];

  for (const u of usersData) {
    await User.create(u);
  }

  // 2. Seed Locomotives
  console.log('🚂 Seeding Locomotives...');
  const locomotivesData = [
    {
      locoNo: '30201',
      model: 'WAP7',
      manufacturingYear: 2018,
      status: 'Healthy',
      currentShed: 'Jamalpur',
      driver: 'Amit Sharma',
      health: 96,
      battery: 98,
      brake: 94,
      tractionMotor: 97,
      gpsStatus: 'Active',
      rfStatus: 'Active',
      kavachStatus: 'Active',
      maintenanceStatus: 'Operational',
      images: ['https://images.unsplash.com/photo-1515165504669-4236820257a5?auto=format&fit=crop&w=800&q=80'],
      history: [
        { date: '2026-05-10', type: 'IA Inspection', remarks: 'Annual electrical diagnostic completed.', technician: 'Vikram Singh' }
      ]
    },
    {
      locoNo: '31045',
      model: 'WAP5',
      manufacturingYear: 2020,
      status: 'Maintenance Soon',
      currentShed: 'Jamalpur',
      driver: 'Rajesh Yadav',
      health: 72,
      battery: 89,
      brake: 70,
      tractionMotor: 75,
      gpsStatus: 'Active',
      rfStatus: 'Active',
      kavachStatus: 'Active',
      maintenanceStatus: 'Scheduled',
      images: ['https://images.unsplash.com/photo-1532103054090-334e6e60ab29?auto=format&fit=crop&w=800&q=80'],
      history: [
        { date: '2026-04-12', type: 'Brake Servicing', remarks: 'Replaced brake shoe alignment.', technician: 'Vikram Singh' }
      ]
    },
    {
      locoNo: '31289',
      model: 'WAG9',
      manufacturingYear: 2021,
      status: 'Healthy',
      currentShed: 'Jamalpur',
      driver: 'Unassigned',
      health: 98,
      battery: 99,
      brake: 98,
      tractionMotor: 97,
      gpsStatus: 'Active',
      rfStatus: 'Active',
      kavachStatus: 'Active',
      maintenanceStatus: 'Operational',
      images: ['https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=800&q=80'],
      history: []
    },
    {
      locoNo: '27084',
      model: 'WAG7',
      manufacturingYear: 2012,
      status: 'Critical',
      currentShed: 'Jamalpur',
      driver: 'Unassigned',
      health: 45,
      battery: 90,
      brake: 40,
      tractionMotor: 52,
      gpsStatus: 'Active',
      rfStatus: 'Inactive',
      kavachStatus: 'Inactive',
      maintenanceStatus: 'Under Repair',
      images: ['https://images.unsplash.com/photo-1519011985187-444d62641929?auto=format&fit=crop&w=800&q=80'],
      history: [
        { date: '2026-06-01', type: 'Fault Isolation', remarks: 'Radio receiver block module failure.', technician: 'Vikram Singh' }
      ]
    },
    {
      locoNo: '11005',
      model: 'WDM',
      manufacturingYear: 2015,
      status: 'Healthy',
      currentShed: 'Jamalpur',
      driver: 'Mohit Chawla',
      health: 88,
      battery: 92,
      brake: 85,
      tractionMotor: 90,
      gpsStatus: 'Active',
      rfStatus: 'Active',
      kavachStatus: 'Active',
      maintenanceStatus: 'Operational',
      images: ['https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=800&q=80'],
      history: []
    }
  ];

  for (const l of locomotivesData) {
    await Locomotive.create(l);
  }

  // 3. Seed Maintenance Schedules
  console.log('🔧 Seeding Maintenance Schedules...');
  const maintenanceData = [
    {
      locoNo: '31045',
      requestDate: '2026-06-20',
      scheduleDate: '2026-06-27',
      assignedEngineer: 'Suresh Chandra',
      technician: 'Vikram Singh',
      status: 'Pending',
      checklist: [
        { item: 'Kavach calibration and beacon range tests', checked: false },
        { item: 'Traction motor insulation and winding temperature log', checked: true },
        { item: 'Air brake pressure valve and cylinder inspection', checked: false },
        { item: 'Battery voltage, load test, and acid gravity check', checked: true },
        { item: 'RTIS GPS transmitter and radio-frequency link diagnostic', checked: false }
      ],
      remarks: 'Scheduled weekly inspection for WAP5 unit.'
    },
    {
      locoNo: '27084',
      requestDate: '2026-06-18',
      scheduleDate: '2026-06-25',
      assignedEngineer: 'Suresh Chandra',
      technician: 'Vikram Singh',
      status: 'In Progress',
      checklist: [
        { item: 'Inspect and replace RF transponder circuit unit', checked: true },
        { item: 'Recalibrate wheel brake block gaps', checked: false },
        { item: 'Test battery auxiliary charging output under load', checked: false }
      ],
      remarks: 'Unit has active critical RF communication alarm.'
    }
  ];

  for (const m of maintenanceData) {
    await Maintenance.create(m);
  }

  // 4. Seed Active Alerts
  console.log('🚨 Seeding Alerts...');
  const alertsData = [
    {
      locoNo: '27084',
      code: 'AL-RF-01',
      message: 'RF Communication failure detected: Kavach safety beacon range out of bounds.',
      priority: 'Critical',
      type: 'Kavach',
      timestamp: new Date().toISOString(),
      resolved: false
    },
    {
      locoNo: '31045',
      code: 'AL-BK-03',
      message: 'Brake cylinder response delay warning. Pressure dropping below 4.4 kg/cm².',
      priority: 'High',
      type: 'Mechanical',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false
    }
  ];

  for (const a of alertsData) {
    await Alert.create(a);
  }

  // 5. Seed RTIS Tracking
  console.log('📡 Seeding RTIS tracks...');
  const rtisData = [
    {
      locoNo: '30201',
      lat: 25.3134,
      lng: 86.4952,
      speed: 84,
      direction: 'North-West',
      lastStation: 'Bhagalpur Jn',
      nextStation: 'Jamalpur Shed',
      eta: '8 mins',
      signalAspect: 'Green',
      movementTimeline: [
        { station: 'Howrah Jn', time: '14:20', status: 'Departed' },
        { station: 'Bhagalpur Jn', time: '19:40', status: 'Departed' },
        { station: 'Jamalpur Shed', time: '21:12', status: 'Arriving' }
      ]
    },
    {
      locoNo: '31045',
      lat: 25.2494,
      lng: 86.2238,
      speed: 0,
      direction: 'Stationary',
      lastStation: 'Kiul Jn',
      nextStation: 'Jamalpur Shed',
      eta: '0 mins (Delayed)',
      signalAspect: 'Red',
      movementTimeline: [
        { station: 'Patna Jn', time: '17:15', status: 'Departed' },
        { station: 'Kiul Jn', time: '20:10', status: 'Arrived' }
      ]
    },
    {
      locoNo: '11005',
      lat: 24.1627,
      lng: 87.7796,
      speed: 98,
      direction: 'South-East',
      lastStation: 'Rampurhat Jn',
      nextStation: 'Barddhaman Jn',
      eta: '45 mins',
      signalAspect: 'Green',
      movementTimeline: [
        { station: 'Jamalpur Shed', time: '18:10', status: 'Departed' },
        { station: 'Rampurhat Jn', time: '20:30', status: 'Departed' }
      ]
    }
  ];

  for (const r of rtisData) {
    await RTIS.create(r);
  }

  // 6. Seed Incidents
  console.log('📝 Seeding Incidents...');
  const incidentsData = [
    {
      locoNo: '27084',
      reporterId: 'EMP-LE-05',
      reporterName: 'Amit Sharma',
      title: 'Traction Motor overheating under full load',
      type: 'Motor Failure',
      priority: 'High',
      description: 'TM-4 winding temperature reached 108°C on uphill grade between Kiul and Jamalpur. Shed assistance requested.',
      status: 'Open',
      timeline: [
        {
          status: 'Open',
          time: new Date(Date.now() - 7200000).toLocaleString(),
          remarks: 'Incident logged. Driver reported high heating alarms on instrument panel.',
          updatedBy: 'Amit Sharma'
        }
      ]
    }
  ];

  for (const i of incidentsData) {
    await Incident.create(i);
  }

  // 7. Seed Fire Safety baseline parameters
  console.log('🔥 Seeding Fire Safety telemetry...');
  const FireSensor = getFireSensorModel();
  const ThermalReading = getThermalReadingModel();

  const fireSensorsData = [
    { locoNo: '30201', smokeStatus: 'No Smoke', thermalSensorStatus: 'Normal', electricalSensorStatus: 'Normal' },
    { locoNo: '31045', smokeStatus: 'No Smoke', thermalSensorStatus: 'Normal', electricalSensorStatus: 'Normal' },
    { locoNo: '31289', smokeStatus: 'No Smoke', thermalSensorStatus: 'Normal', electricalSensorStatus: 'Normal' },
    { locoNo: '27084', smokeStatus: 'No Smoke', thermalSensorStatus: 'Normal', electricalSensorStatus: 'Normal' },
    { locoNo: '11005', smokeStatus: 'No Smoke', thermalSensorStatus: 'Normal', electricalSensorStatus: 'Normal' }
  ];

  const thermalReadingsData = [
    { locoNo: '30201', tractionMotor: 52, transformer: 48, battery: 28, brake: 38, electricalPanel: 32 },
    { locoNo: '31045', tractionMotor: 78, transformer: 72, battery: 42, brake: 65, electricalPanel: 58 },
    { locoNo: '31289', tractionMotor: 45, transformer: 42, battery: 25, brake: 32, electricalPanel: 28 },
    { locoNo: '27084', tractionMotor: 82, transformer: 79, battery: 44, brake: 85, electricalPanel: 72 },
    { locoNo: '11005', tractionMotor: 56, transformer: 50, battery: 31, brake: 40, electricalPanel: 34 }
  ];

  for (const fs of fireSensorsData) {
    await FireSensor.create(fs);
  }
  for (const tr of thermalReadingsData) {
    await ThermalReading.create(tr);
  }

  console.log('✅ Database Seeded Successfully!');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
