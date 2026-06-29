import { getRTISModel } from '../models/RTIS.js';

// Pre-seeded coordinate sequences representing paths between major Indian Railway hubs
// E.g., Howrah to Jamalpur or Jamalpur to Patna routing
const SIMULATED_ROUTES = {
  "HWH-JMP-PTA": [
    { name: "Howrah Jn", lat: 22.5828, lng: 88.3429, dist: 0 },
    { name: "Barddhaman Jn", lat: 23.2384, lng: 87.8614, dist: 95 },
    { name: "Rampurhat Jn", lat: 24.1627, lng: 87.7796, dist: 200 },
    { name: "Bhagalpur Jn", lat: 25.2443, lng: 87.0125, dist: 350 },
    { name: "Jamalpur Shed", lat: 25.3134, lng: 86.4952, dist: 400 },
    { name: "Kiul Jn", lat: 25.2494, lng: 86.2238, dist: 445 },
    { name: "Patna Jn", lat: 25.6022, lng: 85.1376, dist: 570 }
  ],
  "NDLS-JMP-HWH": [
    { name: "New Delhi", lat: 28.6418, lng: 77.2198, dist: 0 },
    { name: "Kanpur Central", lat: 26.4719, lng: 80.3475, dist: 440 },
    { name: "Prayagraj Jn", lat: 25.4496, lng: 81.8291, dist: 635 },
    { name: "Deen Dayal Upadhyaya", lat: 25.2818, lng: 83.1192, dist: 780 },
    { name: "Patna Jn", lat: 25.6022, lng: 85.1376, dist: 1000 },
    { name: "Jamalpur Shed", lat: 25.3134, lng: 86.4952, dist: 1170 },
    { name: "Howrah Jn", lat: 22.5828, lng: 88.3429, dist: 1570 }
  ]
};

// Interpolates lat/lng between stations based on distance percentage
const interpolateRoute = (route, percentProgress) => {
  const numSegments = route.length - 1;
  const targetSegmentFloat = percentProgress * numSegments;
  const segmentIdx = Math.min(Math.floor(targetSegmentFloat), numSegments - 1);
  const localPercent = targetSegmentFloat - segmentIdx;

  const startNode = route[segmentIdx];
  const endNode = route[segmentIdx + 1];

  const lat = startNode.lat + (endNode.lat - startNode.lat) * localPercent;
  const lng = startNode.lng + (endNode.lng - startNode.lng) * localPercent;

  return {
    lat,
    lng,
    lastStation: startNode.name,
    nextStation: endNode.name,
    eta: `${Math.ceil((1 - localPercent) * 90)} mins`
  };
};

export const getRTISTelemetry = async (req, res, next) => {
  try {
    const RTIS = getRTISModel();
    const telemetry = await RTIS.find();

    // Dynamically simulate movement updates every time the endpoint is read (using time offset)
    const timeMs = Date.now();
    const cycleTime = 120000; // 2 minutes cycle for a full loop
    const progress = (timeMs % cycleTime) / cycleTime;

    const simulatedData = telemetry.map(t => {
      // Map loco to a specific route based on locoNo ending digit
      const isEven = parseInt(t.locoNo) % 2 === 0;
      const routeKey = isEven ? "HWH-JMP-PTA" : "NDLS-JMP-HWH";
      const route = SIMULATED_ROUTES[routeKey];
      
      const loc = interpolateRoute(route, progress);

      // Speed oscillations and signal changes
      let speed = 90 + Math.sin(timeMs / 10000) * 25;
      let signalAspect = 'Green';
      
      if (speed < 75) {
        signalAspect = 'Yellow';
      } else if (speed > 105) {
        speed = 105; // Max limit
      }

      // Signal violation SPAD check triggers under specific mock coordinates
      if (progress > 0.4 && progress < 0.43) {
        signalAspect = 'Red';
        speed = 12; // slow speed warning
      }

      return {
        ...t.toObject ? t.toObject() : t,
        lat: loc.lat,
        lng: loc.lng,
        speed: Math.round(speed),
        lastStation: loc.lastStation,
        nextStation: loc.nextStation,
        eta: loc.eta,
        signalAspect,
        direction: isEven ? 'North-West' : 'South-East'
      };
    });

    res.json(simulatedData);
  } catch (error) {
    next(error);
  }
};

// SLAM Shed Simulation coordinates (Jamalpur Shed Layout)
// Grid layout representing bays, tracks, crane paths, and robot position
export const getSLAMShedMap = async (req, res, next) => {
  try {
    const time = Date.now();
    const cycle = 40000; // 40 seconds loop
    const t = (time % cycle) / cycle;

    // Robot path: rectangle traversal in the Jamalpur Shed layout
    let rx = 100;
    let ry = 100;
    let heading = 0; // heading angle in degrees

    if (t < 0.25) {
      // Phase 1: Move right along Bay 1 Track
      const p = t / 0.25;
      rx = 100 + p * 600;
      ry = 100;
      heading = 90;
    } else if (t < 0.5) {
      // Phase 2: Move down across bays
      const p = (t - 0.25) / 0.25;
      rx = 700;
      ry = 100 + p * 300;
      heading = 180;
    } else if (t < 0.75) {
      // Phase 3: Move left along Bay 3 Track
      const p = (t - 0.5) / 0.25;
      rx = 700 - p * 600;
      ry = 400;
      heading = 270;
    } else {
      // Phase 4: Move up back to start
      const p = (t - 0.75) / 0.25;
      rx = 100;
      ry = 400 - p * 300;
      heading = 0;
    }

    // Dynamic obstacle simulation (Obstacle detected near crane crossing)
    const obstacleDistance = 15 + Math.sin(time / 2000) * 10; // in cm
    const obstacleDetected = obstacleDistance < 12;

    res.json({
      shedName: "Electric Loco Shed, Jamalpur",
      dimensions: { width: 800, height: 500 },
      robot: {
        x: Math.round(rx),
        y: Math.round(ry),
        heading,
        status: obstacleDetected ? "Obstacle Avoidance Active" : "Navigating Tracks",
        sensorRange: 80 // Lidar sweep range in cm
      },
      sensors: {
        lidarHz: 10,
        imuConfidence: 99.4,
        slamStatus: "SLAM Localized",
        keypointsDetected: 142
      },
      bays: [
        { name: "Heavy Maintenance Bay 1", x: 80, y: 80, w: 640, h: 80, track: "Track 1" },
        { name: "Inspection & Light Repair Bay 2", x: 80, y: 200, w: 640, h: 80, track: "Track 2" },
        { name: "Traction Motor Overhaul Bay 3", x: 80, y: 320, w: 640, h: 80, track: "Track 3" }
      ],
      obstacles: [
        { name: "Wheel Lathe Crossing", x: 400, y: 100, r: 25, active: obstacleDetected },
        { name: "Gantry Crane Stanchion", x: 500, y: 260, r: 15, active: false }
      ]
    });
  } catch (error) {
    next(error);
  }
};

// AI Predictive Maintenance Simulator
// Validates parameters and triggers rule-based predictive recommendations
export const analyzePredictiveMaintenance = async (req, res, next) => {
  try {
    const { motorTemp, brakePressure, batteryVoltage, wheelRotation, vibration } = req.body;

    // Validate inputs
    if (
      motorTemp === undefined ||
      brakePressure === undefined ||
      batteryVoltage === undefined ||
      wheelRotation === undefined ||
      vibration === undefined
    ) {
      res.status(400);
      throw new Error('All sensor parameters must be provided: motorTemp, brakePressure, batteryVoltage, wheelRotation, vibration');
    }

    const t = parseFloat(motorTemp); // °C (typical 45-75°C, max 100°C)
    const p = parseFloat(brakePressure); // kg/cm² (typical 5.0 kg/cm², limit 3.5 - 5.5)
    const v = parseFloat(batteryVoltage); // V (typical 110V DC in locos, limit 90 - 125)
    const r = parseFloat(wheelRotation); // RPM (typical 800-1200 RPM, max 1600)
    const vib = parseFloat(vibration); // mm/s (typical 1.5 - 3.0 mm/s, limit 4.5)

    let healthScore = 100;
    let diagnosis = [];
    let recommendation = "";
    let outputStatus = "Healthy";

    // Motor Temperature Diagnostic
    if (t > 90) {
      healthScore -= 30;
      diagnosis.push("Critical traction motor winding temperature detected.");
      outputStatus = "Critical";
    } else if (t > 78) {
      healthScore -= 15;
      diagnosis.push("Elevated motor temperature - potential stator ventilation blockage.");
      if (outputStatus !== "Critical") outputStatus = "Maintenance Soon";
    }

    // Brake Pressure Diagnostic
    if (p < 4.0 || p > 5.5) {
      healthScore -= 25;
      diagnosis.push("Brake Pipe (BP) pressure out of standard operating bounds (4.8 - 5.2 kg/cm²).");
      outputStatus = "Critical";
    } else if (p < 4.5) {
      healthScore -= 10;
      diagnosis.push("Minor brake pipe leak detected - inspect reservoir check valve.");
      if (outputStatus !== "Critical") outputStatus = "Maintenance Soon";
    }

    // Battery Voltage Diagnostic
    if (v < 92 || v > 120) {
      healthScore -= 20;
      diagnosis.push("Loco auxiliary control battery voltage critical.");
      outputStatus = "Critical";
    } else if (v < 100) {
      healthScore -= 8;
      diagnosis.push("Battery under voltage warning - inspect alternator charging output.");
      if (outputStatus !== "Critical") outputStatus = "Maintenance Soon";
    }

    // Vibration Diagnostic
    if (vib > 4.5) {
      healthScore -= 30;
      diagnosis.push("Extreme bogie vibration - axle bearing degradation likely.");
      outputStatus = "Critical";
    } else if (vib > 3.0) {
      healthScore -= 12;
      diagnosis.push("Bogie housing vibration above baseline - check suspension spring coils.");
      if (outputStatus !== "Critical") outputStatus = "Maintenance Soon";
    }

    // Calculate final score bounds
    healthScore = Math.max(0, healthScore);

    // Formulate comprehensive maintenance recommendation
    if (outputStatus === "Critical") {
      recommendation = "IMMEDIATE sheds-in inspection scheduled. Request emergency locomotive relief. Restrict operations to under 30 km/h under Kavach restrictions.";
    } else if (outputStatus === "Maintenance Soon") {
      recommendation = "Schedule Trip Inspection (TI) or Schedule A (IA) within 72 hours. Inspect traction motor cooling blowers and replace brake valve washers.";
    } else {
      recommendation = "All parameters nominal. WAP/WAG traction systems and RTIS beacon transponders operating within standard tolerance. Continue normal operations.";
    }

    res.json({
      healthScore,
      status: outputStatus,
      diagnostics: diagnosis.length > 0 ? diagnosis : ["All sub-systems operational."],
      recommendation,
      evaluatedAt: new Date().toLocaleString()
    });
  } catch (error) {
    next(error);
  }
};
