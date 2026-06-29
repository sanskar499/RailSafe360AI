import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  Printer,
  FileDown,
  RefreshCw,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<string>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const data = await api.reports.export(reportType);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  // Export to Excel (CSV Blob download)
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `RailSafe360 System Report - ${reportData.title}\n`;
    csvContent += `Generated: ${reportData.timestamp}\n\n`;

    // Add Summary details
    csvContent += "SUMMARY STATS\n";
    csvContent += `Fleet Size,${reportData.summary.fleetSize}\n`;
    csvContent += `Operational Rate,${reportData.summary.operationalRate}\n`;
    csvContent += `Active Incidents,${reportData.summary.activeIncidents}\n`;
    csvContent += `Completed Servicing,${reportData.summary.completedServices}\n\n`;

    // Add Fleet details
    csvContent += "LOCOMOTIVE FLEET STATUS\n";
    csvContent += "Loco Number,Model,Health Index,Kavach,Servicing,Overall Status\n";
    reportData.locomotiveReport.forEach((l: any) => {
      csvContent += `${l.locoNo},${l.model},${l.health},${l.kavach},${l.maintenance},${l.status}\n`;
    });
    csvContent += "\n";

    // Add Maintenance details
    csvContent += "MAINTENANCE SCHEDULES LOG\n";
    csvContent += "Loco Number,Schedule Date,Assigned Tech,Status,Remarks\n";
    reportData.maintenanceReport.forEach((s: any) => {
      csvContent += `${s.locoNo},${s.scheduleDate},${s.assignedTo},${s.status},${s.remarks}\n`;
    });
    csvContent += "\n";

    // Add Incident details
    csvContent += "INCIDENTS REPORT DESK\n";
    csvContent += "Loco Number,Failure Type,Priority,Status,Report Date\n";
    reportData.incidentReport.forEach((i: any) => {
      csvContent += `${i.locoNo},${i.type},${i.priority},${i.status},${i.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RailSafe360_${reportType}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !reportData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Shed Audit & Reports</h2>
          <p className="text-sm text-slate-400">
            Generate and export daily locomotive status cards, weekly servicing reports, and monthly failure logs
          </p>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-sm focus:outline-none text-slate-300 w-full sm:w-56"
          >
            <option value="daily">Daily System Summary</option>
            <option value="weekly">Weekly Servicing logs</option>
            <option value="monthly">Monthly Failure Analytics</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 py-3 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors w-full sm:w-auto text-slate-300 border border-slate-750"
          >
            <FileDown className="mr-2 h-4 w-4 text-railway-gold" />
            Export Excel (CSV)
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center px-4 py-3 text-xs font-semibold rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white shadow border border-railway-blue-light/10 w-full sm:w-auto"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Preview Panel */}
      <div className="bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl print:border-none print:shadow-none print:p-0 print:bg-transparent">
        {/* Printable Letterhead */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-200 dark:border-slate-700 pb-6 mb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest font-mono">
              OFFICIAL SYSTEM REPORT &bull; ER
            </span>
            <h1 className="text-xl font-bold font-outfit text-slate-900 dark:text-white tracking-tight">
              ELECTRIC LOCO SHED, JAMALPUR
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Eastern Railway, Indian Railways Audit Division
            </p>
          </div>

          <div className="text-left md:text-right mt-4 md:mt-0 font-mono text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <div><strong>REPORT:</strong> {reportData.title}</div>
            <div><strong>TIMESTAMP:</strong> {reportData.timestamp}</div>
            <div><strong>PORTAL:</strong> RailSafe360 v1.0</div>
          </div>
        </div>

        {/* Summary aggregate Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Fleet Size</span>
            <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{reportData.summary.fleetSize} Units</div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Operational Rate</span>
            <div className="text-xl font-bold font-mono text-green-600 dark:text-green-400 mt-1">{reportData.summary.operationalRate}</div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <span className="text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Active Incidents</span>
            <div className="text-xl font-bold font-mono text-red-650 dark:text-red-400 mt-1">{reportData.summary.activeIncidents} Logs</div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl">
            <span className="text-[9px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-wider block">Completed Servicing</span>
            <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{reportData.summary.completedServices} Jobs</div>
          </div>
        </div>

        {/* Details Table */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase tracking-wider font-mono">
              1. Locomotive Status Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-300 uppercase font-mono">
                    <th className="py-2.5 px-3">Loco No</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Health Index</th>
                    <th className="py-2.5 px-3">Kavach System</th>
                    <th className="py-2.5 px-3">Servicing Status</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.locomotiveReport.map((l: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-850 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{l.locoNo}</td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{l.model}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">{l.health}</td>
                      <td className="py-2.5 px-3 uppercase font-mono text-slate-800 dark:text-slate-200">{l.kavach}</td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{l.maintenance}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-350 uppercase tracking-wider font-mono">
              2. Maintenance Log Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-300 uppercase font-mono">
                    <th className="py-2.5 px-3">Loco No</th>
                    <th className="py-2.5 px-3">Schedule Date</th>
                    <th className="py-2.5 px-3">Assigned Tech</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.maintenanceReport.map((s: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-850 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{s.locoNo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">{s.scheduleDate}</td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{s.assignedTo}</td>
                      <td className="py-2.5 px-3 font-semibold uppercase text-slate-900 dark:text-white">{s.status}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{s.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>System Generated Audit Log &bull; No physical signature required</span>
          <span>ELS Jamalpur Division Control Center</span>
        </div>
      </div>
    </div>
  );
};
