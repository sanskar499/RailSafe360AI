import { getLocomotiveModel } from '../models/Locomotive.js';
import { getMaintenanceModel } from '../models/Maintenance.js';
import { getIncidentModel } from '../models/Incident.js';
import {
  getFireSensorModel,
  getFireAlertModel,
  getHazardPredictionModel,
  getThermalReadingModel,
  getEmergencyActionModel
} from '../models/FirePrevention.js';

// Rule-Based Hazard Prediction Engine logic
const runHazardPrediction = (thermal, sensor, electrical) => {
  const { tractionMotor, transformer, battery, brake, electricalPanel } = thermal;
  const { smokeStatus } = sensor;
  const { current, voltage } = electrical;

  let probability = 0;
  let causes = [];
  let actions = [];
  let severity = 'Safe';

  // 1. Thermal Checks
  if (tractionMotor > 90) {
    probability += 25;
    causes.push('Traction Motor Overheating (exceeded 90°C)');
    actions.push('Inspect traction motor cooling fan and blowers');
  }
  if (transformer > 85) {
    probability += 25;
    causes.push('Transformer Core Winding Overheat (exceeded 85°C)');
    actions.push('Check transformer insulation level and oil temperature');
  }
  if (battery > 60) {
    probability += 15;
    causes.push('Battery Cell Overheating (exceeded 60°C)');
    actions.push('Verify auxiliary charging voltage and inspect electrolyte levels');
  }
  if (brake > 95) {
    probability += 10;
    causes.push('Brake Block Friction Overheat');
    actions.push('Inspect brake shoe alignment and brake cylinder release');
  }
  if (electricalPanel > 75) {
    probability += 20;
    causes.push('Electrical Cabinet Panel Overheat');
    actions.push('Inspect cable harness connections for loose electrical contacts');
  }

  // 2. Electrical Checks
  const power = (current * voltage) / 1000; // in kW
  if (current > 400 && (tractionMotor > 80 || electricalPanel > 70)) {
    probability += 30;
    causes.push('High Current Load + Elevated Temperature (Short Circuit Sign)');
    actions.push('Isolate high-power circuits and check transformer bushings');
  }

  // 3. Smoke Checks
  if (smokeStatus === 'Light Smoke') {
    probability += 50;
    causes.push('Light Smoke detected in Cabinet/Auxiliary unit');
    actions.push('Activate visual inspection and prepare fire extinguishers');
  } else if (smokeStatus === 'Heavy Smoke') {
    probability = 100;
    causes.push('CRITICAL: Heavy Smoke detected inside Locomotive cabin!');
    actions.push('Deploy automatic fire suppression, shut breakers, and isolate locomotive immediately');
  }

  // Base thermal probability addition
  if (probability === 0) {
    const avgThermal = (tractionMotor + transformer + battery + brake + electricalPanel) / 5;
    probability = Math.round((avgThermal / 100) * 15);
  }

  probability = Math.min(Math.max(probability, 0), 100);

  // Severity classification
  if (probability >= 90 || smokeStatus === 'Heavy Smoke') {
    severity = 'Critical';
  } else if (probability >= 70 || smokeStatus === 'Light Smoke' || tractionMotor > 90 || transformer > 85) {
    severity = 'High';
  } else if (probability >= 45 || battery > 60) {
    severity = 'Medium';
  } else if (probability >= 20) {
    severity = 'Low';
  } else {
    severity = 'Safe';
  }

  return {
    probability,
    possibleCause: causes.join(' | ') || 'No anomalous thermal or electrical signs detected.',
    suggestedAction: actions.join(', ') || 'Maintain nominal scheduling checks.',
    severity
  };
};

export const getLocoFirePreventionStatus = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const Locomotive = getLocomotiveModel();
    const FireSensor = getFireSensorModel();
    const FireAlert = getFireAlertModel();
    const HazardPrediction = getHazardPredictionModel();
    const ThermalReading = getThermalReadingModel();

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive #${locoNo} not found`);
    }

    // Load or create sensor record
    let sensor = await FireSensor.findOne({ locoNo });
    if (!sensor) {
      sensor = await FireSensor.create({ locoNo, smokeStatus: 'No Smoke' });
    }

    // Load or create thermal readings
    let thermal = await ThermalReading.findOne({ locoNo });
    if (!thermal) {
      thermal = await ThermalReading.create({
        locoNo,
        tractionMotor: loco.tractionMotor || 40,
        transformer: 45,
        battery: 30,
        brake: 35,
        electricalPanel: 28
      });
    }

    // Get mock electrical health details
    // WAP7/WAP5 draws ~300-380V auxiliary or main, current up to 350A
    const electrical = {
      current: loco.status === 'Critical' ? 0 : 280 + Math.floor(Math.random() * 40),
      voltage: loco.status === 'Critical' ? 0 : 380 + Math.floor(Math.random() * 15),
      cableHealth: loco.health || 95,
      fuseStatus: loco.status === 'Critical' ? 'Blown' : 'Operational',
      breakerStatus: loco.status === 'Critical' ? 'Tripped' : 'Closed'
    };
    electrical.power = Math.round((electrical.current * electrical.voltage) / 1000); // kW

    // Run prediction engine
    const predictionResult = runHazardPrediction(thermal, sensor, electrical);

    // Save/update prediction record
    let prediction = await HazardPrediction.findOne({ locoNo });
    if (!prediction) {
      prediction = await HazardPrediction.create({
        locoNo,
        probability: predictionResult.probability,
        possibleCause: predictionResult.possibleCause,
        suggestedAction: predictionResult.suggestedAction
      });
    } else {
      prediction = await HazardPrediction.findByIdAndUpdate(prediction._id, {
        probability: predictionResult.probability,
        possibleCause: predictionResult.possibleCause,
        suggestedAction: predictionResult.suggestedAction
      }, { new: true });
    }

    // Fetch alerts
    const alerts = await FireAlert.find({ locoNo, resolved: false });

    res.json({
      locoNo,
      locoId: loco._id,
      model: loco.model,
      status: loco.status,
      maintenanceStatus: loco.maintenanceStatus,
      thermal,
      sensor,
      electrical,
      prediction,
      alerts,
      severity: predictionResult.severity
    });
  } catch (error) {
    next(error);
  }
};

export const overrideLocoFireSensors = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const {
      tractionMotor,
      transformer,
      battery,
      brake,
      electricalPanel,
      smokeStatus,
      current,
      voltage,
      fuseStatus,
      breakerStatus,
      cableHealth
    } = req.body;

    const Locomotive = getLocomotiveModel();
    const FireSensor = getFireSensorModel();
    const FireAlert = getFireAlertModel();
    const ThermalReading = getThermalReadingModel();
    const EmergencyAction = getEmergencyActionModel();
    const Maintenance = getMaintenanceModel();
    const Incident = getIncidentModel();

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive #${locoNo} not found`);
    }

    // Update thermal readings
    let thermal = await ThermalReading.findOne({ locoNo });
    if (!thermal) {
      thermal = await ThermalReading.create({ locoNo });
    }
    thermal = await ThermalReading.findByIdAndUpdate(thermal._id, {
      tractionMotor: tractionMotor !== undefined ? tractionMotor : thermal.tractionMotor,
      transformer: transformer !== undefined ? transformer : thermal.transformer,
      battery: battery !== undefined ? battery : thermal.battery,
      brake: brake !== undefined ? brake : thermal.brake,
      electricalPanel: electricalPanel !== undefined ? electricalPanel : thermal.electricalPanel
    }, { new: true });

    // Update sensor readings
    let sensor = await FireSensor.findOne({ locoNo });
    if (!sensor) {
      sensor = await FireSensor.create({ locoNo });
    }
    sensor = await FireSensor.findByIdAndUpdate(sensor._id, {
      smokeStatus: smokeStatus || sensor.smokeStatus
    }, { new: true });

    // Construct mock electrical
    const electrical = {
      current: current !== undefined ? current : 300,
      voltage: voltage !== undefined ? voltage : 390,
      cableHealth: cableHealth !== undefined ? cableHealth : 90,
      fuseStatus: fuseStatus || 'Operational',
      breakerStatus: breakerStatus || 'Closed'
    };

    // Evaluate risk
    const predictionResult = runHazardPrediction(thermal, sensor, electrical);

    // If Critical, deploy Emergency Response Workflow
    if (predictionResult.severity === 'Critical' && loco.maintenanceStatus !== 'Out of Service') {
      console.log(`⚠️ Deploying Emergency response workflow for Locomotive #${locoNo}`);

      // 1. Mark Locomotive Out of Service
      await Locomotive.findByIdAndUpdate(loco._id, {
        status: 'Critical',
        maintenanceStatus: 'Out of Service',
        health: Math.min(loco.health, 40)
      });

      // 2. Create Fire Alert
      await FireAlert.create({
        locoNo,
        alertType: smokeStatus === 'Heavy Smoke' ? 'Smoke Hazard' : 'Overheat Short Circuit',
        message: `EMERGENCY ALERT: Fire Hazard Engine predicted probability of ${predictionResult.probability}%! Cause: ${predictionResult.possibleCause}`,
        severity: 'Critical',
        resolved: false
      });

      // 3. Create Emergency Action Log
      await EmergencyAction.create({
        locoNo,
        actionTaken: 'Emergency Isolation Triggered. Circuit Breakers tripped. Locomotive marked Out of Service.',
        engineerNotified: 'Amit Sharma',
        maintenanceTicketCreated: true
      });

      // 4. Create Maintenance request ticket automatically
      await Maintenance.create({
        locoNo,
        requestDate: new Date().toISOString().split('T')[0],
        scheduleDate: new Date().toISOString().split('T')[0],
        assignedEngineer: 'Suresh Chandra',
        technician: 'Vikram Singh',
        status: 'In Progress',
        checklist: [
          { item: 'Disconnect auxiliary charging loops and test short circuit breakers', checked: false },
          { item: 'Perform thermal camera sweep of traction motor and transformer', checked: false },
          { item: 'Replace damaged/chafed cable wiring harness and check insulation resistance', checked: false },
          { item: 'Verify smoke sensor calibration and reset cab ventilation fans', checked: false }
        ],
        remarks: `Auto-generated ticket due to Critical Fire Risk violation (${predictionResult.probability}% score).`
      });

      // 5. Log Incident Desk entry
      await Incident.create({
        locoNo,
        title: 'Critical Fire Hazard Detected',
        type: 'Electrical',
        priority: 'Critical',
        description: `Automated Kavach & Thermal sensor isolation triggered for Loco #${locoNo}. Anomalous values scanned: Winding TM=${thermal.tractionMotor}°C, Smoke=${sensor.smokeStatus}, Current=${electrical.current}A. Cause: ${predictionResult.possibleCause}`,
        status: 'Open',
        timeline: [
          { date: new Date().toISOString().split('T')[0], status: 'Reported', remarks: 'Triggered by AI Hazard Prediction engine.' }
        ]
      });
    }

    res.json({
      success: true,
      message: `Locomotive #${locoNo} sensors updated successfully.`,
      severity: predictionResult.severity,
      probability: predictionResult.probability
    });
  } catch (error) {
    next(error);
  }
};

export const getFireTimeline = async (req, res, next) => {
  try {
    const { locoNo } = req.params;
    const FireAlert = getFireAlertModel();
    const EmergencyAction = getEmergencyActionModel();

    const alerts = await FireAlert.find({ locoNo }).sort({ createdAt: -1 });
    const actions = await EmergencyAction.find({ locoNo }).sort({ createdAt: -1 });

    // Format timeline
    const timeline = [];
    alerts.forEach(a => {
      timeline.push({
        time: a.timestamp || a.createdAt,
        type: 'Sensor Alert Trigger',
        sensor: a.alertType,
        risk: a.severity,
        assigned: 'Amit Sharma',
        status: a.resolved ? 'Resolved' : 'Active',
        remarks: a.message
      });
    });

    actions.forEach(ac => {
      timeline.push({
        time: ac.timestamp || ac.createdAt,
        type: 'Emergency Action',
        sensor: 'Automated Isolation',
        risk: 'Critical',
        assigned: ac.engineerNotified,
        status: 'Isolation Activated',
        remarks: `${ac.actionTaken} (Maintenance Ticket: ${ac.maintenanceTicketCreated ? 'Yes' : 'No'})`
      });
    });

    // Sort by time descending
    timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json(timeline);
  } catch (error) {
    next(error);
  }
};

export const getFireAnalytics = async (req, res, next) => {
  try {
    // Return mock aggregate analytics
    const analytics = {
      monthlyTrends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [12, 18, 15, 24, 29, 34]
      },
      overheatedComponents: [
        { name: 'Traction Motor Winding', count: 48, percentage: 38 },
        { name: 'Transformer Winding', count: 32, percentage: 25 },
        { name: 'Electrical Cabinet Harnesses', count: 24, percentage: 19 },
        { name: 'Auxiliary Battery Cells', count: 15, percentage: 12 },
        { name: 'Mechanical Brake Blocks', count: 8, percentage: 6 }
      ],
      frequentCauses: [
        { name: 'Short Circuit / Overcurrent', count: 38 },
        { name: 'Cable Insulation Degradation', count: 28 },
        { name: 'Cooling Fan Failure', count: 18 },
        { name: 'Loose Bolted Terminals', count: 10 },
        { name: 'Battery Core Runaway', count: 6 }
      ],
      highestRiskLocos: [
        { locoNo: '27084', model: 'WAG7', score: 82, status: 'Critical' },
        { locoNo: '31045', model: 'WAP5', score: 58, status: 'Maintenance Soon' },
        { locoNo: '11005', model: 'WDM', score: 28, status: 'Healthy' }
      ],
      avgResponseTime: 4.8 // minutes from alarm to isolation
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};
