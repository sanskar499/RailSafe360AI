import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Wrench,
  Calendar,
  User,
  Clock,
  CheckSquare,
  Plus,
  RefreshCw,
  X,
  FileCheck,
  AlertCircle
} from 'lucide-react';

export const Maintenance: React.FC = () => {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab filter
  const [activeTab, setActiveTab] = useState<'Pending' | 'In Progress' | 'Completed' | 'Cancelled'>('Pending');

  // New Request Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locoNo, setLocoNo] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [engineer, setEngineer] = useState('');
  const [technician, setTechnician] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Editing job state
  const [remarksInput, setRemarksInput] = useState('');
  const [checklist, setChecklist] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await api.maintenance.getAll({ status: activeTab });
      setJobs(data);

      if (data.length > 0) {
        setSelectedJob(data[0]);
        setRemarksInput(data[0].remarks || '');
        setChecklist(data[0].checklist || []);
      } else {
        setSelectedJob(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const handleSelectJob = (job: any) => {
    setSelectedJob(job);
    setRemarksInput(job.remarks || '');
    setChecklist(job.checklist || []);
  };

  const handleCheckItem = (idx: number) => {
    // Only technician/admin can update checklists on active jobs
    if (selectedJob.status === 'Completed' || selectedJob.status === 'Cancelled') return;
    
    const updated = [...checklist];
    updated[idx] = { ...updated[idx], checked: !updated[idx].checked };
    setChecklist(updated);
  };

  const handleSaveChecklist = async () => {
    if (!selectedJob) return;
    try {
      const updated = await api.maintenance.updateJob(selectedJob._id, {
        checklist,
        remarks: remarksInput
      });
      setSelectedJob(updated);
      alert('Servicing checklist saved successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedJob) return;
    try {
      const updated = await api.maintenance.updateJob(selectedJob._id, {
        status,
        remarks: remarksInput,
        checklist
      });
      setSelectedJob(updated);
      fetchJobs();
      alert(`Servicing job status updated to: ${status}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.maintenance.create({
        locoNo,
        scheduleDate,
        assignedEngineer: engineer || 'Unassigned',
        technician: technician || 'Unassigned',
        remarks
      });
      setIsModalOpen(false);
      setLocoNo('');
      setScheduleDate('');
      setRemarks('');
      fetchJobs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit maintenance schedule.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Locomotive Maintenance Portal</h2>
          <p className="text-sm text-slate-400">
            Submit repair cards, log test sheets, and assign shed technicians to scheduled maintenance
          </p>
        </div>

        {(user?.role === 'Admin' || user?.role === 'Inspector') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white shadow border border-railway-blue-light/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        {['Pending', 'In Progress', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-xs font-bold uppercase rounded-t-xl transition-all border-b-2
              ${activeTab === tab
                ? 'border-railway-gold text-railway-gold bg-slate-900/40'
                : 'border-transparent text-slate-450 hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid: Job List vs details */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs List (1 Col) */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="glass-card rounded-2xl py-12 text-center text-slate-500 border border-slate-800/40 text-xs">
                No scheduled maintenance jobs found.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => handleSelectJob(job)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2
                    ${selectedJob?._id === job._id
                      ? 'bg-railway-blue/30 border-railway-gold/50 shadow'
                      : 'bg-slate-900/45 border-slate-850 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white font-mono">Loco #{job.locoNo}</span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center">
                      <Calendar className="mr-1 h-3 w-3" /> {job.scheduleDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-350 truncate">{job.remarks || 'No remarks provided.'}</p>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Tech: {job.technician}</span>
                    <span className="font-bold text-railway-gold">
                      {job.checklist.filter((c: any) => c.checked).length}/{job.checklist.length} Done
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Job Details sheet (2 Cols) */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/10 space-y-6">
                {/* Details Header */}
                <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                  <div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold font-mono">
                      SERVICING WORK SHEET
                    </span>
                    <h3 className="text-xl font-bold font-mono mt-1 text-white">Loco #{selectedJob.locoNo}</h3>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase
                    ${selectedJob.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : selectedJob.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {selectedJob.status}
                  </span>
                </div>

                {/* Scheduling Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Scheduled Date</span>
                    <div className="font-semibold text-slate-200 mt-0.5 flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-650" /> {selectedJob.scheduleDate}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Tech</span>
                    <div className="font-semibold text-slate-200 mt-0.5 flex items-center">
                      <User className="mr-1.5 h-3.5 w-3.5 text-slate-650" /> {selectedJob.technician}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Engineer</span>
                    <div className="font-semibold text-slate-200 mt-0.5 flex items-center">
                      <FileCheck className="mr-1.5 h-3.5 w-3.5 text-slate-650" /> {selectedJob.assignedEngineer}
                    </div>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Servicing Checklist</h4>
                  <div className="space-y-2">
                    {checklist.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCheckItem(idx)}
                        className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors select-none
                          ${selectedJob.status === 'Completed' || selectedJob.status === 'Cancelled' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                          ${item.checked ? 'bg-slate-900/60 border-railway-gold/30' : 'bg-slate-950/40 border-slate-900'}`}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => {}} // handled by div click
                          disabled={selectedJob.status === 'Completed' || selectedJob.status === 'Cancelled'}
                          className="rounded text-railway-gold focus:ring-railway-gold accent-railway-gold"
                        />
                        <span className={`text-xs ${item.checked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks & Image Mockup */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Technician Work Log & Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter diagnostic values, component wear reports, and remarks..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    disabled={selectedJob.status === 'Completed' || selectedJob.status === 'Cancelled'}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-railway-gold text-slate-350 disabled:opacity-85"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-850">
                  {selectedJob.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus('In Progress')}
                      className="px-4 py-2.5 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white font-semibold text-xs transition-colors"
                    >
                      Start Job
                    </button>
                  )}

                  {selectedJob.status === 'In Progress' && (
                    <button
                      onClick={() => handleUpdateStatus('Completed')}
                      className="px-4 py-2.5 rounded-xl bg-green-650 hover:bg-green-700 text-white font-semibold text-xs transition-colors"
                    >
                      Complete & Clear Loco
                    </button>
                  )}

                  {(selectedJob.status === 'Pending' || selectedJob.status === 'In Progress') && (
                    <>
                      <button
                        onClick={handleSaveChecklist}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-300 transition-colors"
                      >
                        Save Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('Cancelled')}
                        className="px-4 py-2.5 rounded-xl bg-red-650 hover:bg-red-700 text-white font-semibold text-xs transition-colors sm:ml-auto"
                      >
                        Cancel Schedule
                      </button>
                    </>
                  )}

                  {selectedJob.status === 'Completed' && (
                    <div className="text-[11px] text-green-400 font-mono flex items-center bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-lg">
                      <FileCheck className="mr-2 h-4 w-4" /> Servicing successfully archived on: {selectedJob.completionDate}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl py-32 text-center text-slate-500 border border-slate-800/40 text-xs">
                Select a scheduled maintenance job from the left pane to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-lg font-bold text-white">Create Servicing Request</h3>
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

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Locomotive Number</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 31045"
                  value={locoNo}
                  onChange={(e) => setLocoNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Scheduled Servicing Date</label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Assigned Engineer</label>
                  <input
                    type="text"
                    placeholder="Suresh Chandra"
                    value={engineer}
                    onChange={(e) => setEngineer(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Technician</label>
                  <input
                    type="text"
                    placeholder="Vikram Singh"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">General Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Reason for scheduling, known faults..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white font-semibold text-sm transition-colors border border-railway-blue-light/10"
              >
                Schedule Maintenance Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
