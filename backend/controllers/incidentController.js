import { getIncidentModel } from '../models/Incident.js';
import { getLocomotiveModel } from '../models/Locomotive.js';
import { getAlertModel } from '../models/Alert.js';

export const getIncidents = async (req, res, next) => {
  try {
    const Incident = getIncidentModel();
    const { status, locoNo, priority } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (locoNo) filter.locoNo = locoNo;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

export const getIncidentById = async (req, res, next) => {
  try {
    const Incident = getIncidentModel();
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      res.status(404);
      throw new Error('Incident report not found');
    }
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

export const reportIncident = async (req, res, next) => {
  try {
    const Incident = getIncidentModel();
    const Locomotive = getLocomotiveModel();
    const Alert = getAlertModel();
    const { locoNo, title, type, priority, description } = req.body;

    const loco = await Locomotive.findOne({ locoNo });
    if (!loco) {
      res.status(404);
      throw new Error(`Locomotive ${locoNo} not found`);
    }

    const reporterName = req.user ? req.user.name : 'Loco Pilot';
    const reporterId = req.user ? req.user.employeeId : 'PILOT-999';

    const newIncident = await Incident.create({
      locoNo,
      reporterId,
      reporterName,
      title,
      type,
      priority,
      description,
      status: 'Open',
      timeline: [
        {
          status: 'Open',
          time: new Date().toLocaleString(),
          remarks: `Incident reported by ${reporterName}: ${description}`,
          updatedBy: reporterName
        }
      ]
    });

    // Automatically trigger a critical/high alert for the locomotive depending on priority
    if (priority === 'Critical' || priority === 'High') {
      await Alert.create({
        locoNo,
        code: `INC-${type.substring(0, 3).toUpperCase()}`,
        message: `Reported incident: ${title}. Reporter notes: ${description}`,
        priority,
        type: type.includes('Failure') ? 'Mechanical' : 'Communication',
        timestamp: new Date().toISOString(),
        resolved: false
      });

      // Downgrade locomotive status
      await Locomotive.findOneAndUpdate(
        { locoNo },
        { 
          status: priority === 'Critical' ? 'Critical' : 'Maintenance Soon',
          gpsStatus: type === 'GPS Failure' ? 'Inactive' : loco.gpsStatus,
          rfStatus: type === 'RF Failure' ? 'Inactive' : loco.rfStatus,
          kavachStatus: type === 'RFID Failure' ? 'Inactive' : loco.kavachStatus
        }
      );
    }

    res.status(201).json(newIncident);
  } catch (error) {
    next(error);
  }
};

export const updateIncident = async (req, res, next) => {
  try {
    const Incident = getIncidentModel();
    const Locomotive = getLocomotiveModel();
    const { id } = req.params;
    const { status, remarks } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    const updaterName = req.user ? req.user.name : 'System Inspector';

    const updatedTimeline = [
      ...incident.timeline,
      {
        status: status || incident.status,
        time: new Date().toLocaleString(),
        remarks: remarks || `Status updated to ${status}`,
        updatedBy: updaterName
      }
    ];

    const updatedIncident = await Incident.findByIdAndUpdate(
      id,
      {
        status: status || incident.status,
        timeline: updatedTimeline
      },
      { new: true }
    );

    // If resolved, check if we need to restore locomotive health status
    if (status === 'Resolved') {
      const LocomotiveModel = getLocomotiveModel();
      const loco = await LocomotiveModel.findOne({ locoNo: incident.locoNo });
      if (loco) {
        // Restore active sensor status
        await LocomotiveModel.findOneAndUpdate(
          { locoNo: incident.locoNo },
          {
            status: 'Healthy',
            gpsStatus: 'Active',
            rfStatus: 'Active',
            kavachStatus: 'Active',
            $push: {
              history: {
                date: new Date().toISOString().split('T')[0],
                type: 'Incident Resolution',
                remarks: `Resolved incident INC-${incident.type}: ${remarks}`,
                technician: updaterName
              }
            }
          }
        );
      }
    }

    res.json(updatedIncident);
  } catch (error) {
    next(error);
  }
};
