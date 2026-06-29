import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  Plus,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export const Incidents: React.FC = () => {
  const { user } = useAuth();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Report state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locoNo, setLocoNo] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Brake Failure');
  const [priority, setPriority] = useState('High');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Timeline update state
  const [statusUpdate, setStatusUpdate] = useState('');
  const [remarksInput, setRemarksInput] = useState('');

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await api.incidents.getAll();
      setIncidents(data);
      if (data.length > 0) {
        setSelectedIncident(data[0]);
      } else {
        setSelectedIncident(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.incidents.report({
        locoNo,
        title,
        type,
        priority,
        description
      });
      setIsModalOpen(false);
      setLocoNo('');
      setTitle('');
      setDescription('');
      fetchIncidents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit incident report.');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !statusUpdate) return;
    try {
      const updated = await api.incidents.update(selectedIncident._id, {
        status: statusUpdate,
        remarks: remarksInput || `Status updated to ${statusUpdate}`
      });
      setSelectedIncident(updated);
      setRemarksInput('');
      fetchIncidents();
      alert('Incident timeline updated successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Shed Incident Desk</h2>
          <p className="text-sm text-slate-400">
            Log safety failures (Kavach, brakes, motors) and track real-time resolution timelines
          </p>
        </div>

        {(user?.role === 'Admin' || user?.role === 'Loco Engineer') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl bg-red-650 hover:bg-red-700 text-white shadow border border-red-500/20 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            File Failure Incident
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List (1 Col) */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-400">Reported logs</h3>
            {incidents.length === 0 ? (
              <div className="glass-card rounded-2xl py-12 text-center text-slate-500 border border-slate-800/40 text-xs">
                No incidents reported in registry.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc._id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2
                    ${selectedIncident?._id === inc._id
                      ? 'bg-red-500/10 border-red-500/50 shadow'
                      : 'bg-slate-900/45 border-slate-850 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white font-mono">Loco #{inc.locoNo}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase
                      ${inc.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : inc.priority === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {inc.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{inc.title}</h4>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                    <span>Type: {inc.type}</span>
                    <span className={`font-bold ${inc.status === 'Resolved' ? 'text-green-500' : 'text-amber-500'}`}>
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details & Timeline (2 Cols) */}
          <div className="lg:col-span-2">
            {selectedIncident ? (
              <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/10 space-y-6">
                {/* Header detail */}
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded font-bold font-mono">
                      FAIL REPORT LOG
                    </span>
                    <h3 className="text-xl font-bold font-mono mt-1 text-white">Loco #{selectedIncident.locoNo}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase
                    ${selectedIncident.status === 'Resolved' ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-amber-500/15 text-amber-450 border border-amber-500/25'}`}>
                    {selectedIncident.status}
                  </span>
                </div>

                {/* Description details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900 space-y-2 text-xs">
                    <div className="font-semibold text-slate-200 text-sm">{selectedIncident.title}</div>
                    <p className="text-slate-350 leading-relaxed">{selectedIncident.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-2 border-t border-slate-900">
                      <span>Reporter: {selectedIncident.reporterName} ({selectedIncident.reporterId})</span>
                      <span>Type: {selectedIncident.type}</span>
                    </div>
                  </div>
                </div>

                {/* Incident Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Timeline</h4>
                  <div className="relative pl-6 border-l border-slate-800 space-y-4 text-xs">
                    {selectedIncident.timeline.map((step: any, idx: number) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-slate-750">
                          <Clock className="h-2.5 w-2.5 text-railway-gold" />
                        </span>
                        <div>
                          <div className="flex justify-between font-semibold">
                            <span className="text-slate-200">Status: {step.status}</span>
                            <span className="text-slate-450 font-mono">{step.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.remarks}</p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Logged by: {step.updatedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Update Timeline Form (Admins, Techs, Inspectors only) */}
                {selectedIncident.status !== 'Resolved' && (
                  <div className="border-t border-slate-850 pt-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update Incident Status</h4>
                    
                    {(user?.role === 'Admin' || user?.role === 'Inspector' || user?.role === 'Maintenance Technician') ? (
                      <form onSubmit={handleUpdateStatus} className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Change Status</label>
                            <select
                              required
                              value={statusUpdate}
                              onChange={(e) => setStatusUpdate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none"
                            >
                              <option value="">Select status...</option>
                              <option value="Investigating">Investigating</option>
                              <option value="Resolved">Resolved (Closes Ticket)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Update Note</label>
                            <input
                              type="text"
                              required
                              placeholder="Remarks to append to timeline..."
                              value={remarksInput}
                              onChange={(e) => setRemarksInput(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-slate-750 font-bold text-xs transition-colors"
                        >
                          Append Timeline Log
                        </button>
                      </form>
                    ) : (
                      <p className="text-xs text-slate-550 leading-relaxed text-center py-2">
                        Timeline editing is restricted to Admin, Inspector, or Maintenance Technician roles.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card rounded-3xl py-32 text-center text-slate-500 border border-slate-800/40 text-xs">
                Select an incident report from the left pane to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-lg font-bold text-white">File Failure Incident Report</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Locomotive Number</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 27084"
                  value={locoNo}
                  onChange={(e) => setLocoNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of failure..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Failure Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs focus:outline-none text-slate-355"
                  >
                    <option value="Brake Failure">Brake Failure</option>
                    <option value="RF Failure">RF Failure</option>
                    <option value="GPS Failure">GPS Failure</option>
                    <option value="RFID Failure">RFID Failure</option>
                    <option value="Motor Failure">Motor Failure</option>
                    <option value="Traction Failure">Traction Failure</option>
                    <option value="Communication Failure">Communication Failure</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs focus:outline-none text-slate-355"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide technical logs, speed at failure, and environment description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-650 hover:bg-red-750 text-white font-semibold text-sm transition-colors border border-red-500/20"
              >
                File Failure Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
