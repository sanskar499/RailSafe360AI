import { getMaintenanceModel } from '../models/Maintenance.js';
import { getLocomotiveModel } from '../models/Locomotive.js';

export const getMaintenanceJobs = async (req, res, next) => {
  try {
    const Maintenance = getMaintenanceModel();
    const { status, locoNo, assignedEngineer, technician } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (locoNo) filter.locoNo = locoNo;
    if (assignedEngineer) filter.assignedEngineer = assignedEngineer;
    if (technician) filter.technician = technician;

    const jobs = await Maintenance.find(filter).sort({ scheduleDate: 1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceJobById = async (req, res, next) => {
  try {
    const Maintenance = getMaintenanceModel();
    const job = await Maintenance.findById(req.params.id);
    if (!job) {
      res.status(404);
      throw new Error('Maintenance schedule not found');
    }
    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const Maintenance = getMaintenanceModel();
    const Locomotive = getLocomotiveModel();
    const { locoNo, scheduleDate, assignedEngineer, technician, remarks, checklistItems } = req.body;

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive with number ${locoNo} not found`);
    }

    // Default checklist items if none provided
    const defaultChecklist = checklistItems || [
      { item: 'Kavach calibration and beacon range tests', checked: false },
      { item: 'Traction motor insulation and winding temperature log', checked: false },
      { item: 'Air brake pressure valve and cylinder inspection', checked: false },
      { item: 'Battery voltage, load test, and acid gravity check', checked: false },
      { item: 'RTIS GPS transmitter and radio-frequency link diagnostic', checked: false }
    ];

    const newJob = await Maintenance.create({
      locoNo,
      requestDate: new Date().toISOString().split('T')[0],
      scheduleDate,
      assignedEngineer: assignedEngineer || 'Unassigned',
      technician: technician || 'Unassigned',
      status: 'Pending',
      checklist: defaultChecklist,
      remarks: remarks || '',
      images: []
    });

    // Update Locomotive maintenance status
    await Locomotive.findOneAndUpdate({ locoNo }, { maintenanceStatus: 'Scheduled' });

    res.status(201).json(newJob);
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceJob = async (req, res, next) => {
  try {
    const Maintenance = getMaintenanceModel();
    const Locomotive = getLocomotiveModel();
    const { id } = req.params;
    const { status, remarks, checklist, technician, assignedEngineer, completionDate } = req.body;

    const job = await Maintenance.findById(id);
    if (!job) {
      res.status(404);
      throw new Error('Maintenance job not found');
    }

    const updatedData = {
      remarks: remarks !== undefined ? remarks : job.remarks,
      technician: technician || job.technician,
      assignedEngineer: assignedEngineer || job.assignedEngineer
    };

    if (status) {
      updatedData.status = status;
      if (status === 'Completed') {
        updatedData.completionDate = completionDate || new Date().toISOString().split('T')[0];
      }
    }

    if (checklist) {
      updatedData.checklist = checklist;
    }

    const updatedJob = await Maintenance.findByIdAndUpdate(id, updatedData, { new: true });

    // Sync maintenance status to Locomotive
    let locoStatus = 'Operational';
    if (updatedJob.status === 'In Progress') {
      locoStatus = 'Under Repair';
    } else if (updatedJob.status === 'Pending') {
      locoStatus = 'Scheduled';
    } else if (updatedJob.status === 'Completed') {
      locoStatus = 'Operational';

      // Record in Locomotive history log
      const loco = await Locomotive.findOne({ locoNo: updatedJob.locoNo });
      if (loco) {
        const historyLog = {
          date: updatedJob.completionDate,
          type: 'Preventive Maintenance',
          remarks: `Maintenance completed. Checklist items resolved. Remarks: ${updatedJob.remarks}`,
          technician: updatedJob.technician
        };
        await Locomotive.findOneAndUpdate(
          { locoNo: updatedJob.locoNo },
          {
            maintenanceStatus: 'Operational',
            health: 100, // Restore health to 100 after complete maintenance
            battery: 100,
            brake: 100,
            tractionMotor: 100,
            $push: { history: historyLog }
          }
        );
      }
    } else if (updatedJob.status === 'Cancelled') {
      locoStatus = 'Operational';
    }

    if (updatedJob.status !== 'Completed') {
      await Locomotive.findOneAndUpdate({ locoNo: updatedJob.locoNo }, { maintenanceStatus: locoStatus });
    }

    res.json(updatedJob);
  } catch (error) {
    next(error);
  }
};
