import { getLocomotiveModel } from '../models/Locomotive.js';
import { getAlertModel } from '../models/Alert.js';

export const getLocomotives = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const { search, model, status, sortBy, order } = req.query;

    let filter = {};

    if (search) {
      // Support matching locoNo or driver
      filter.$or = [
        { locoNo: { $regex: search, $options: 'i' } },
        { driver: { $regex: search, $options: 'i' } }
      ];
    }

    if (model) {
      filter.model = model;
    }

    if (status) {
      filter.status = status;
    }

    let sortObj = {};
    if (sortBy) {
      sortObj[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.locoNo = 1; // Default sort
    }

    // Call model's find with filter, then sort if applicable
    const locosQuery = Locomotive.find(filter);
    
    // Sort logic handles both Mongoose and MockQuery builder
    let locos;
    if (typeof locosQuery.sort === 'function') {
      locos = await locosQuery.sort(sortObj);
    } else {
      locos = await locosQuery;
    }

    res.json(locos);
  } catch (error) {
    next(error);
  }
};

export const getLocomotiveByIdOrNo = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const { idOrNo } = req.params;

    // Check if matching locoNo or mongodb _id
    let loco = await Locomotive.findOne({ locoNo: idOrNo });
    if (!loco) {
      loco = await Locomotive.findById(idOrNo);
    }

    if (!loco) {
      res.status(404);
      throw new Error('Locomotive not found');
    }

    res.json(loco);
  } catch (error) {
    next(error);
  }
};

export const createLocomotive = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const { locoNo, model, manufacturingYear, currentShed, driver } = req.body;

    const exists = await Locomotive.findOne({ locoNo });
    if (exists) {
      res.status(400);
      throw new Error('Locomotive number already registered');
    }

    const newLoco = await Locomotive.create({
      locoNo,
      model,
      manufacturingYear,
      currentShed: currentShed || 'Jamalpur',
      driver: driver || 'Unassigned',
      health: 100,
      battery: 100,
      brake: 100,
      tractionMotor: 100,
      gpsStatus: 'Active',
      rfStatus: 'Active',
      kavachStatus: 'Active',
      maintenanceStatus: 'Operational',
      images: ['https://images.unsplash.com/photo-1515165504669-4236820257a5?auto=format&fit=crop&w=800&q=80'],
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          type: 'Commissioning',
          remarks: 'Locomotive added to shed fleet list',
          technician: 'System Agent'
        }
      ]
    });

    res.status(201).json(newLoco);
  } catch (error) {
    next(error);
  }
};

export const updateLocoMetrics = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const { id } = req.params;
    const { health, battery, brake, tractionMotor, gpsStatus, rfStatus, kavachStatus, maintenanceStatus } = req.body;

    const loco = await Locomotive.findById(id);
    if (!loco) {
      res.status(404);
      throw new Error('Locomotive not found');
    }

    // Determine aggregate health status based on metrics
    let status = 'Healthy';
    const minMetric = Math.min(health || 100, battery || 100, brake || 100, tractionMotor || 100);
    if (minMetric < 50) {
      status = 'Critical';
    } else if (minMetric < 80) {
      status = 'Maintenance Soon';
    }

    const updatedLoco = await Locomotive.findByIdAndUpdate(id, {
      health: health !== undefined ? health : loco.health,
      battery: battery !== undefined ? battery : loco.battery,
      brake: brake !== undefined ? brake : loco.brake,
      tractionMotor: tractionMotor !== undefined ? tractionMotor : loco.tractionMotor,
      gpsStatus: gpsStatus || loco.gpsStatus,
      rfStatus: rfStatus || loco.rfStatus,
      kavachStatus: kavachStatus || loco.kavachStatus,
      maintenanceStatus: maintenanceStatus || loco.maintenanceStatus,
      status
    }, { new: true });

    res.json(updatedLoco);
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const Alert = getAlertModel();
    const { locoNo, resolved } = req.query;

    let filter = {};
    if (locoNo) filter.locoNo = locoNo;
    if (resolved !== undefined) filter.resolved = resolved === 'true';

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const Alert = getAlertModel();
    const { id } = req.params;

    const updatedAlert = await Alert.findByIdAndUpdate(id, { resolved: true }, { new: true });
    if (!updatedAlert) {
      res.status(404);
      throw new Error('Alert not found');
    }

    res.json(updatedAlert);
  } catch (error) {
    next(error);
  }
};

export const addServiceHistory = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const { id } = req.params;
    const { type, remarks, technician } = req.body;

    const loco = await Locomotive.findById(id);
    if (!loco) {
      res.status(404);
      throw new Error('Locomotive not found');
    }

    const newHistoryEntry = {
      date: new Date().toISOString().split('T')[0],
      type: type || 'Inspection',
      remarks: remarks || 'Mobile QR Code Inspection completed.',
      technician: technician || req.user?.name || 'Mobile Inspector'
    };

    const updatedHistory = [...(loco.history || []), newHistoryEntry];

    const updatedLoco = await Locomotive.findByIdAndUpdate(id, {
      history: updatedHistory
    }, { new: true });

    res.status(201).json(updatedLoco);
  } catch (error) {
    next(error);
  }
};
