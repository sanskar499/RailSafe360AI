import { getLocomotiveModel } from '../models/Locomotive.js';
import { getMaintenanceModel } from '../models/Maintenance.js';
import { getIncidentModel } from '../models/Incident.js';
import {
  getLocoDiagnosisModel,
  getDigitalTwinStateModel,
  getSparePartPredictionModel,
  getIncidentReplayModel,
  getKnowledgeArticleModel
} from '../models/HealthIntelligence.js';

// Loco Doctor diagnostics rules
const evaluateLocoDiagnosis = (locoNo, thermal, sensor, electrical, vibration) => {
  const { tractionMotor, transformer, battery, brake, electricalPanel } = thermal;
  const { smokeStatus } = sensor;
  const { current, voltage } = electrical;

  let possibleFault = 'Nominal Performance';
  let probability = 0;
  let severity = 'Safe';
  let rootCause = 'All systems operating within acceptable thermal and electrical margins.';
  let recommendations = ['Continue standard schedule inspections.', 'Log nominal log files.'];
  let estimatedDowntime = 0;
  let estimatedRepairCost = 0;
  let engineerSkillRequired = 'Standard Technician';

  // Winding / Bearing wear check
  if (tractionMotor > 90 || vibration > 60) {
    possibleFault = 'Traction Motor Bearing Fatigue & Winding Wear';
    probability = Math.min(Math.round((tractionMotor / 120) * 95), 100);
    severity = 'High';
    rootCause = 'Cooling blower blockage or severe bearings lubrication loss causing frictional core heating.';
    recommendations = [
      'Perform urgent bearing grease flushing.',
      'Check cooling fan belt and electrical contactor.',
      'Test motor air gap clearances.'
    ];
    estimatedDowntime = 3.5;
    estimatedRepairCost = 18500;
    engineerSkillRequired = 'Senior Electrical Fitter';
  }
  // Transformer insulation check
  else if (transformer > 82 || (current > 380 && transformer > 70)) {
    possibleFault = 'Transformer Winding Insulation Breakdown';
    probability = Math.min(Math.round((transformer / 110) * 92), 100);
    severity = 'Critical';
    rootCause = 'Winding insulation paper degradation or transformer oil level depletion leading to internal arcing.';
    recommendations = [
      'Isolate transformer primary supply.',
      'Extract oil sample for dissolved gas analysis (DGA).',
      'Test winding insulation resistance (Megger test).'
    ];
    estimatedDowntime = 8.0;
    estimatedRepairCost = 42000;
    engineerSkillRequired = 'Transformer Core Specialist';
  }
  // Cell thermal runaway check
  else if (battery > 55) {
    possibleFault = 'Auxiliary Battery Cell Thermal Runaway';
    probability = Math.min(Math.round((battery / 80) * 85), 100);
    severity = 'Medium';
    rootCause = 'Auxiliary battery bank overcharging or dry cell conditions leading to electrolyte breakdown.';
    recommendations = [
      'Measure cell terminal voltages.',
      'Verify battery charger controller cutoff relay.',
      'Replenish cell distilled water levels.'
    ];
    estimatedDowntime = 2.0;
    estimatedRepairCost = 9500;
    engineerSkillRequired = 'Battery Bank Technician';
  }
  // Brake block seizure
  else if (brake > 90) {
    possibleFault = 'Brake Rigging Block Seizure';
    probability = Math.min(Math.round((brake / 110) * 90), 100);
    severity = 'Medium';
    rootCause = 'Brake pipe release cylinder return spring failure or mechanical linkage jamming.';
    recommendations = [
      'Check brake block pad wear limits.',
      'Verify brake cylinder exhaust pressure.',
      'Lubricate rigging guide pins.'
    ];
    estimatedDowntime = 1.5;
    estimatedRepairCost = 4500;
    engineerSkillRequired = 'Mechanical Fitter';
  }
  // Panel short-circuit indicators
  else if (electricalPanel > 70 && current > 350) {
    possibleFault = 'Electrical Panel Cable Short Circuit';
    probability = Math.min(Math.round((electricalPanel / 95) * 96), 100);
    severity = 'Critical';
    rootCause = 'Cable insulation chafing or loose bolted terminal connectors causing resistive high heating.';
    recommendations = [
      'Perform micro-ohm resistance contact test.',
      'Inspect panel wire harness routes.',
      'Tighten all contact terminals to specifications.'
    ];
    estimatedDowntime = 4.0;
    estimatedRepairCost = 22000;
    engineerSkillRequired = 'Control Panel Expert';
  }
  // Smoke triggers
  if (smokeStatus !== 'No Smoke') {
    possibleFault = smokeStatus === 'Heavy Smoke' ? 'ACTIVE FIRE HAZARD IN CABIN' : 'Cabinet Combustion Warning';
    probability = smokeStatus === 'Heavy Smoke' ? 100 : 75;
    severity = smokeStatus === 'Heavy Smoke' ? 'Critical' : 'High';
    rootCause = smokeStatus === 'Heavy Smoke' ? 'Critical arcing or insulation fire in primary cabinet.' : 'Smoldering dust or oil accumulation on resistors.';
    recommendations = [
      'De-energize main circuit breakers immediately.',
      'Discharge visual smoke dampers and verify CO2 canisters.',
      'Mark locomotive out of service and tow to heavy repairs shop.'
    ];
    estimatedDowntime = 24.0;
    estimatedRepairCost = 125000;
    engineerSkillRequired = 'Emergency Operations Engineer';
  }

  return {
    possibleFault,
    probability,
    severity,
    rootCause,
    recommendations,
    estimatedDowntime,
    estimatedRepairCost,
    engineerSkillRequired
  };
};

export const getLocoHealthStatus = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const Locomotive = getLocomotiveModel();
    const LocoDiagnosis = getLocoDiagnosisModel();
    const DigitalTwinState = getDigitalTwinStateModel();

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive #${locoNo} not found`);
    }

    // Load or create Digital Twin State
    let twin = await DigitalTwinState.findOne({ locoNo });
    if (!twin) {
      twin = await DigitalTwinState.create({
        locoNo,
        tractionMotorHealth: loco.status === 'Critical' ? 52 : loco.status === 'Maintenance Soon' ? 75 : 97,
        tractionMotorTemp: loco.status === 'Critical' ? 92 : loco.status === 'Maintenance Soon' ? 78 : 52,
        tractionMotorRul: loco.status === 'Critical' ? 12 : loco.status === 'Maintenance Soon' ? 45 : 320,
        transformerHealth: loco.status === 'Critical' ? 48 : 88,
        transformerTemp: loco.status === 'Critical' ? 84 : 48,
        transformerRul: loco.status === 'Critical' ? 8 : 410,
        batteryHealth: 92,
        batteryTemp: 32,
        batteryRul: 150,
        brakeHealth: loco.status === 'Critical' ? 40 : 85,
        brakeTemp: loco.status === 'Critical' ? 88 : 38,
        brakeRul: loco.status === 'Critical' ? 5 : 210,
        gpsStatus: loco.gpsStatus,
        rfStatus: loco.rfStatus,
        kavachStatus: loco.kavachStatus
      });
    }

    // Load mock current settings
    const thermal = {
      tractionMotor: twin.tractionMotorTemp,
      transformer: twin.transformerTemp,
      battery: twin.batteryTemp,
      brake: twin.brakeTemp,
      electricalPanel: loco.status === 'Critical' ? 72 : 32
    };
    const sensor = {
      smokeStatus: loco.status === 'Critical' ? 'Heavy Smoke' : 'No Smoke'
    };
    const electrical = {
      current: loco.status === 'Critical' ? 420 : 290,
      voltage: loco.status === 'Critical' ? 360 : 395
    };
    const vibration = loco.status === 'Critical' ? 78 : 35; // in Hz

    // Evaluate Diagnosis
    const diagResult = evaluateLocoDiagnosis(locoNo, thermal, sensor, electrical, vibration);

    // Save/update diagnosis record
    let diagnosis = await LocoDiagnosis.findOne({ locoNo });
    if (!diagnosis) {
      diagnosis = await LocoDiagnosis.create({ locoNo, ...diagResult });
    } else {
      diagnosis = await LocoDiagnosis.findByIdAndUpdate(diagnosis._id, diagResult, { new: true });
    }

    // Calculate AI Safety Score
    // safety score takes inputs from components health and active diagnoses severity
    let score = Math.round((twin.tractionMotorHealth + twin.transformerHealth + twin.batteryHealth + twin.brakeHealth) / 4);
    if (diagResult.severity === 'Critical') {
      score = Math.min(score, 35);
    } else if (diagResult.severity === 'High') {
      score = Math.min(score, 55);
    } else if (diagResult.severity === 'Medium') {
      score = Math.min(score, 72);
    }
    score = Math.min(Math.max(score, 0), 100);

    // Fire spread details
    const fireRisk = diagResult.severity === 'Critical' ? 100 : diagResult.severity === 'High' ? 75 : diagResult.severity === 'Medium' ? 45 : 12;
    const timeBeforeFailure = diagResult.severity === 'Critical' ? '15 minutes' : diagResult.severity === 'High' ? '1.5 hours' : diagResult.severity === 'Medium' ? '8 hours' : '14 days';

    res.json({
      locoNo,
      status: loco.status,
      maintenanceStatus: loco.maintenanceStatus,
      digitalTwin: twin,
      diagnosis,
      safetyScore: score,
      vibration,
      fireDetails: {
        riskPercent: fireRisk,
        timeBeforeFailure,
        criticalComponent: diagResult.severity !== 'Safe' ? diagResult.possibleFault : 'None',
        recommendEngineer: diagResult.engineerSkillRequired,
        spreadZones: diagResult.severity === 'Critical' ? ['Cabinet Winding', 'Motor Bearings'] : diagResult.severity === 'High' ? ['Cabinet Winding'] : []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const triggerFaultOverride = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const { faultType } = req.body; // 'bearing_wear', 'insulation_breakdown', 'smoke_hazard'

    const Locomotive = getLocomotiveModel();
    const DigitalTwinState = getDigitalTwinStateModel();
    const LocoDiagnosis = getLocoDiagnosisModel();
    const Maintenance = getMaintenanceModel();
    const Incident = getIncidentModel();

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive #${locoNo} not found`);
    }

    let twin = await DigitalTwinState.findOne({ locoNo });
    if (!twin) {
      twin = await DigitalTwinState.create({ locoNo });
    }

    // Set values depending on chosen fault scenario
    let updates = {};
    let diagPayload = {};
    let reservedBay = 'Bay 1';
    let sparePartsAllocated = [];
    let assignedEngineer = 'Amit Sharma';

    if (faultType === 'bearing_wear') {
      updates = {
        tractionMotorHealth: 45,
        tractionMotorTemp: 98,
        tractionMotorRul: 2
      };
      diagPayload = {
        possibleFault: 'Traction Motor Bearing Fatigue & Winding Wear',
        probability: 91,
        severity: 'High',
        rootCause: 'Frictional bearing heating due to severe lubricant depletion in Traction Motor housing.',
        recommendations: ['Perform urgent bearing grease flushing', 'Check cooling fan contactors', 'Tighten housing bolts'],
        estimatedDowntime: 3.5,
        estimatedRepairCost: 18500,
        engineerSkillRequired: 'Senior Electrical Fitter'
      };
      reservedBay = 'Bay 4 (Light Repairs)';
      sparePartsAllocated = ['Traction Motor Bearing TM-1', 'Lubricant Seal Ring'];
      assignedEngineer = 'Amit Sharma';
    } 
    else if (faultType === 'insulation_breakdown') {
      updates = {
        transformerHealth: 38,
        transformerTemp: 89,
        transformerRul: 1
      };
      diagPayload = {
        possibleFault: 'Transformer Winding Insulation Breakdown',
        probability: 86,
        severity: 'Critical',
        rootCause: 'Internal arcing caused by severe cellulose paper insulation decay in oil core.',
        recommendations: ['Isolate transformer primary supply', 'Extract oil sample for dissolved gas analysis', 'Test winding resistance'],
        estimatedDowntime: 8.0,
        estimatedRepairCost: 42000,
        engineerSkillRequired: 'Transformer Core Specialist'
      };
      reservedBay = 'Bay 2 (Heavy Repairs)';
      sparePartsAllocated = ['Transformer Bushing Cover', 'Dielectric Core Oil (50L)', 'Cellulose Insulation Sheets'];
      assignedEngineer = 'Suresh Chandra';
    } 
    else if (faultType === 'smoke_hazard') {
      updates = {
        tractionMotorHealth: 50,
        transformerHealth: 60,
        brakeHealth: 45,
        tractionMotorTemp: 95,
        transformerTemp: 82,
        brakeTemp: 85
      };
      diagPayload = {
        possibleFault: 'ACTIVE FIRE HAZARD IN CABIN',
        probability: 100,
        severity: 'Critical',
        rootCause: 'Resistive cabinet heating triggered thermal combustion of insulation sleeve layers.',
        recommendations: ['De-energize main circuit breakers immediately', 'Isolate battery switches', 'Evacuate cabin space'],
        estimatedDowntime: 24.0,
        estimatedRepairCost: 125000,
        engineerSkillRequired: 'Emergency Operations Engineer'
      };
      reservedBay = 'Bay 1 (Emergency Isolation)';
      sparePartsAllocated = ['Cabinet Winding Harness (60m)', 'High Power Fuse Insulators', 'CO2 Suppression Cylinders'];
      assignedEngineer = 'Vikram Singh';
    }

    // Save updates
    await DigitalTwinState.findByIdAndUpdate(twin._id, updates);
    await LocoDiagnosis.findOneAndUpdate({ locoNo }, diagPayload, { upsert: true, new: true });

    // Mark Locomotive status in DB
    await Locomotive.findByIdAndUpdate(loco._id, {
      status: diagPayload.severity === 'Critical' ? 'Critical' : 'Maintenance Soon',
      maintenanceStatus: diagPayload.severity === 'Critical' ? 'Out of Service' : 'Under Repair',
      health: Math.min(loco.health, 50)
    });

    // Auto-schedule ticket
    const ticket = await Maintenance.create({
      locoNo,
      requestDate: new Date().toISOString().split('T')[0],
      scheduleDate: new Date().toISOString().split('T')[0],
      assignedEngineer,
      technician: 'Vikram Singh',
      status: 'In Progress',
      checklist: diagPayload.recommendations.map(r => ({ item: r, checked: false })),
      remarks: `Auto-generated AI ticket for ${diagPayload.possibleFault}. Reserved: ${reservedBay}. Allocated: ${sparePartsAllocated.join(', ')}.`
    });

    // Post to Incident log
    await Incident.create({
      locoNo,
      title: `AI Health Alert: ${diagPayload.possibleFault}`,
      type: 'Electrical',
      priority: diagPayload.severity,
      description: `AI diagnostic engine automatically triggered maintenance isolation. Reserved: ${reservedBay}. Assigned tech: Vikram Singh. Root cause: ${diagPayload.rootCause}`,
      status: 'Open',
      timeline: [
        { date: new Date().toISOString().split('T')[0], status: 'Reported', remarks: 'Triggered by Autonomous AI Health Intelligence.' }
      ]
    });

    res.json({
      success: true,
      message: `Fault scenario '${faultType}' successfully injected into Locomotive #${locoNo}.`,
      automatedResponse: {
        ticketCreated: true,
        reservedBay,
        sparePartsAllocated,
        assignedEngineer,
        severity: diagPayload.severity,
        estimatedDowntime: diagPayload.estimatedDowntime
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSparePartsPredictions = async (req, res, next) => {
  try {
    const SparePart = getSparePartPredictionModel();
    let predictions = await SparePart.find({});

    // Fallback seed inside controller if list is empty
    if (predictions.length === 0) {
      const defaultSpares = [
        { partName: 'Traction Motor Bearings (TM-1)', probability: 92, timeframe: 7, quantityRequired: 4, currentStock: 1, status: 'Critical' },
        { partName: 'Dielectric Transformer Winding Oil', probability: 85, timeframe: 15, quantityRequired: 120, currentStock: 35, status: 'Reorder' },
        { partName: 'Auxiliary Battery Lead Plates', probability: 76, timeframe: 15, quantityRequired: 8, currentStock: 10, status: 'Adequate' },
        { partName: 'Kavach RF Transceiver Antennas', probability: 45, timeframe: 30, quantityRequired: 2, currentStock: 5, status: 'Adequate' },
        { partName: 'Carbon Brake Shoe Blocks WAP7', probability: 88, timeframe: 7, quantityRequired: 16, currentStock: 2, status: 'Critical' }
      ];
      for (const ds of defaultSpares) {
        await SparePart.create(ds);
      }
      predictions = await SparePart.find({});
    }

    res.json(predictions);
  } catch (error) {
    next(error);
  }
};

export const getKnowledgeArticles = async (req, res, next) => {
  try {
    const KnowledgeArticle = getKnowledgeArticleModel();
    let articles = await KnowledgeArticle.find({});

    if (articles.length === 0) {
      const defaultArticles = [
        {
          componentName: 'Traction Motor (Winding & Bearings)',
          workingPrinciple: 'Converts primary electrical energy from catenary wire into rotational mechanical torque for axel drives using a 3-Phase asynchronous induction design.',
          commonFaults: [
            { name: 'Bearing Fatigue', symptoms: 'Abnormal high-frequency vibrations above 60Hz and friction heating exceeding 90°C.' },
            { name: 'Insulation Breakdown', symptoms: 'Phase-to-ground leakage currents resulting in tripped shed circuit breakers.' }
          ],
          inspectionSteps: [
            'Conduct infrared thermal scanner sweep on motor bearing housing.',
            'Measure vibration frequencies using hand-held accelerometer sensors.',
            'Verify cooling blower fans filter cleanliness.'
          ],
          safetyPrecautions: [
            'Ensure catenary isolator switch is locked open.',
            'Discharge static charge before touching motor windings.'
          ],
          repairGuide: 'Perform bearing casing grease flush. If damage is deep, decouple axle drive, hoist motor block using gantry cranes, and replace bearing sleeves.',
          maintenanceFrequency: 'Quarterly Check (IA/IB schedules)'
        },
        {
          componentName: 'Main Transformer Oil Core',
          workingPrinciple: 'Steps down 25kV catenary AC supply to traction motor driver limits using oil-cooled copper secondary windings.',
          commonFaults: [
            { name: 'Oil Moisture Contamination', symptoms: 'Breakdown of dielectric strength (arcing inside transformer tank).' },
            { name: 'Core Sludging', symptoms: 'Reduced heat dissipation, oil temperatures exceeding 80°C under load.' }
          ],
          inspectionSteps: [
            'Extract bottom valve oil sample for gas chromatography tests.',
            'Verify silica gel color inside conservator breather tank.',
            'Log oil levels on conservator sight glass.'
          ],
          safetyPrecautions: [
            'Verify complete primary earth rod grounding.',
            'Keep hot oil away from open flames.'
          ],
          repairGuide: 'Pump transformer oil through vacuum filter machine. If winding insulation Megger resistance reads under 50 megaohms, core must be lifted and baked.',
          maintenanceFrequency: 'Semi-Annually (IC schedules)'
        },
        {
          componentName: 'Auxiliary Battery Bank cells',
          workingPrinciple: 'Provides 110V DC control voltage to cab electronics, headlight loops, and safety systems when the catenary power is disconnected.',
          commonFaults: [
            { name: 'Thermal Runaway', symptoms: 'Cell temperatures rising above 55°C, bulging casing, electrolyte boiling.' },
            { name: 'Sulphation', symptoms: 'Reduced capacity, high internal resistance, voltage drops under load.' }
          ],
          inspectionSteps: [
            'Measure individual cell voltages and specific gravity using a hydrometer.',
            'Check terminal connections for corrosion or oxidation build-up.'
          ],
          safetyPrecautions: [
            'Wear protective acid-resistant gloves and goggles.',
            'Do not short battery terminals under any circumstances.'
          ],
          repairGuide: 'Clean oxidized terminals with warm sodium bicarbonate solution. Replace weak cells reading below 1.8V under load.',
          maintenanceFrequency: 'Monthly (IA schedule)'
        },
        {
          componentName: 'Air Brakes cylinder rigging',
          workingPrinciple: 'Applies mechanical pressure onto wheels using high-pressure compressed air regulated by pilot valves.',
          commonFaults: [
            { name: 'Brake cylinder Leakage', symptoms: 'Slow drops in pressure gauges, hiss sounds in underbelly.' },
            { name: 'Rigging Seizure', symptoms: 'Brake shoes dragging on wheel treads, brake cylinder temperature above 90°C.' }
          ],
          inspectionSteps: [
            'Measure brake block gap clearances (nominal 8-12mm).',
            'Check piston stroke length during full application.'
          ],
          safetyPrecautions: [
            'Bleed pressure reservoirs completely before servicing.',
            'Use safety pins to lock rigging block before working.'
          ],
          repairGuide: 'Replace worn brake block pads. Rebuild release cylinder piston seals if pressure drop is detected.',
          maintenanceFrequency: 'Weekly (Trip inspections)'
        },
        {
          componentName: 'GPS Localization Transponder',
          workingPrinciple: 'Synchronizes coordinates with satellite networks to stream live locomotive position tracking over RTIS.',
          commonFaults: [
            { name: 'Signal Loss', symptoms: 'GPS Status shows Inactive, position freeze on RTIS.' }
          ],
          inspectionSteps: [
            'Inspect external GPS dome antenna coaxial connection.',
            'Check power supply loop voltages.'
          ],
          safetyPrecautions: [
            'Do not bend coaxial cables beyond minimum bend radius.'
          ],
          repairGuide: 'Re-tighten antenna connections. If transponder module remains dead, replace internal GPS receiver PCB.',
          maintenanceFrequency: 'Monthly'
        },
        {
          componentName: 'RF Communication Link',
          workingPrinciple: 'Establishes direct line-of-sight telemetry connections with trackside RFID beacons and stations.',
          commonFaults: [
            { name: 'Frequency Drift', symptoms: 'Intermittent RF packet drops, connection warnings on Kavach console.' }
          ],
          inspectionSteps: [
            'Verify antenna mount stability on roof.',
            'Measure RF output power using wattmeters.'
          ],
          safetyPrecautions: [
            'De-energize transmitter before working on antenna.'
          ],
          repairGuide: 'Replace damaged RF coaxial cable. Tune antenna match parameters.',
          maintenanceFrequency: 'Monthly'
        },
        {
          componentName: 'Kavach SIL-4 Cabin display console',
          workingPrinciple: 'Translates RFID beacon coordinates and signal aspects into a pilot warning display. Enforces SPAD deceleration curves.',
          commonFaults: [
            { name: 'Display Freezing', symptoms: 'Frozen screen values, warning indicators flashing red, alarm sounders active.' }
          ],
          inspectionSteps: [
            'Check DMI display harness connections.',
            'Verify serial link communications with central processor.'
          ],
          safetyPrecautions: [
            'Handle static-sensitive microprocessor boards with ESD wrist straps.'
          ],
          repairGuide: 'Perform soft reboot of Kavach console. If failures persist, replace display driver module.',
          maintenanceFrequency: 'Monthly'
        }
      ];
      for (const da of defaultArticles) {
        await KnowledgeArticle.create(da);
      }
      articles = await KnowledgeArticle.find({});
    }

    res.json(articles);
  } catch (error) {
    next(error);
  }
};

export const getIncidentReplays = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const IncidentReplay = getIncidentReplayModel();

    let replay = await IncidentReplay.findOne({ locoNo });
    if (!replay) {
      // Create mock telemetry replay data representing 2 hours before the failure
      const history = [];
      for (let i = 1; i <= 10; i++) {
        history.push({
          time: `T-${10-i}0 min`,
          motorTemp: 55 + i * 4, // rising from 59 to 95 degrees
          current: 280 + i * 15, // current draw rising
          vibration: 20 + i * 6, // vibration rising from 26Hz to 80Hz
          smoke: i === 10 ? 'Light Smoke' : 'No Smoke'
        });
      }

      replay = await IncidentReplay.create({
        locoNo,
        title: 'Thermal Overload Incident Replay',
        date: new Date().toISOString().split('T')[0],
        sensorHistory: history,
        alerts: [
          { time: 'T-30 min', message: 'Traction Motor TM-1 Winding Temp warning: 82°C' },
          { time: 'T-10 min', message: 'Vibration alert TM-1 Bearing: 74Hz (Abnormal)' },
          { time: 'T-0 min', message: 'KAVACH INTERVENTION: Emergency Shutdown due to Overheat and Cabin Smoke' }
        ],
        resolution: 'Motor bearing replaced. Cooling fans contactor replaced and re-aligned.'
      });
    }

    res.json(replay);
  } catch (error) {
    next(error);
  }
};
