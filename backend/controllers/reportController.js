import { getLocomotiveModel } from '../models/Locomotive.js';
import { getMaintenanceModel } from '../models/Maintenance.js';
import { getAlertModel } from '../models/Alert.js';
import { getIncidentModel } from '../models/Incident.js';
import { getUserModel } from '../models/User.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const Locomotive = getLocomotiveModel();
    const Maintenance = getMaintenanceModel();
    const Alert = getAlertModel();
    const Incident = getIncidentModel();
    const User = getUserModel();

    // Aggregations
    const totalLocos = await Locomotive.countDocuments();
    const healthyLocos = await Locomotive.countDocuments({ status: 'Healthy' });
    const criticalLocos = await Locomotive.countDocuments({ status: 'Critical' });
    const soonLocos = await Locomotive.countDocuments({ status: 'Maintenance Soon' });
    const underMaintenance = await Locomotive.countDocuments({
      maintenanceStatus: { $in: ['Under Inspection', 'Under Repair', 'Scheduled'] }
    });

    const activeAlerts = await Alert.countDocuments({ resolved: false });
    const openIncidents = await Incident.countDocuments({ status: 'Open' });
    
    // Count engineers (User roles: Admin, Loco Engineer, Maintenance Technician, Inspector)
    const totalEngineers = await User.countDocuments({
      role: { $in: ['Loco Engineer', 'Maintenance Technician', 'Inspector'] }
    });

    // Mock constants for realistic Indian Railways dashboards
    const todaysInspections = Math.round(totalLocos * 0.15) + 1;
    const maintenanceCost = 284500; // in INR (mock)

    res.json({
      totalLocos,
      healthyLocos,
      criticalLocos,
      soonLocos,
      underMaintenance,
      activeAlerts,
      openIncidents,
      totalEngineers,
      todaysInspections,
      maintenanceCost
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsCharts = async (req, res, next) => {
  try {
    // Return structured chart datasets for Chart.js
    res.json({
      maintenanceTrends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        scheduled: [12, 19, 15, 22, 18, 25],
        unscheduled: [4, 7, 3, 8, 5, 6]
      },
      failureAnalytics: {
        labels: ['Brake Failure', 'RF Failure', 'GPS Failure', 'Motor Failure', 'Electrical Sparking'],
        counts: [14, 8, 5, 12, 3]
      },
      componentHealth: {
        labels: ['Battery', 'Brakes', 'Traction Motors', 'Kavach Beacon Receiver', 'RTIS Transponder'],
        healthPercent: [92, 88, 85, 96, 94]
      },
      safetyScores: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        scores: [98.5, 99.2, 97.8, 99.6]
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getExportReportData = async (req, res, next) => {
  try {
    const { type, range } = req.query; // type: daily/weekly/monthly, range: date
    const Locomotive = getLocomotiveModel();
    const Maintenance = getMaintenanceModel();
    const Incident = getIncidentModel();

    const locos = await Locomotive.find();
    const servicing = await Maintenance.find();
    const incidents = await Incident.find();

    let title = `${type ? type.toUpperCase() : 'DAILY'} SYSTEM STATUS REPORT`;
    let timestamp = new Date().toLocaleString();

    let data = {
      title,
      timestamp,
      summary: {
        fleetSize: locos.length,
        operationalRate: `${Math.round((locos.filter(l => l.status === 'Healthy').length / locos.length) * 100)}%`,
        activeIncidents: incidents.filter(i => i.status !== 'Resolved').length,
        completedServices: servicing.filter(s => s.status === 'Completed').length
      },
      locomotiveReport: locos.map(l => ({
        locoNo: l.locoNo,
        model: l.model,
        health: `${l.health}%`,
        kavach: l.kavachStatus,
        maintenance: l.maintenanceStatus,
        status: l.status
      })),
      maintenanceReport: servicing.map(s => ({
        locoNo: s.locoNo,
        scheduleDate: s.scheduleDate,
        assignedTo: s.technician,
        status: s.status,
        remarks: s.remarks || 'N/A'
      })),
      incidentReport: incidents.map(i => ({
        locoNo: i.locoNo,
        type: i.type,
        priority: i.priority,
        status: i.status,
        date: i.createdAt
      }))
    };

    res.json(data);
  } catch (error) {
    next(error);
  }
};
