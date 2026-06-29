import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Activity,
  Battery,
  Shield,
  MapPin,
  RefreshCw,
  X,
  Radio,
  FileCheck
} from 'lucide-react';

export const Locomotives: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locos, setLocos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('locoNo');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Register Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocoNo, setNewLocoNo] = useState('');
  const [newModel, setNewModel] = useState('WAP7');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDriver, setNewDriver] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchLocomotives = async () => {
    try {
      setIsLoading(true);
      const data = await api.locomotives.getAll({ search, model, status });
      setLocos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocomotives();
  }, [search, model, status, sortBy, order]);

  const handleRegisterLoco = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      await api.locomotives.create({
        locoNo: newLocoNo,
        model: newModel,
        manufacturingYear: newYear,
        driver: newDriver || 'Unassigned'
      });
      setIsModalOpen(false);
      setNewLocoNo('');
      setNewDriver('');
      fetchLocomotives();
    } catch (err: any) {
      setModalError(err.message || 'Failed to commission locomotive.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Locomotive Fleet Registry</h2>
          <p className="text-sm text-slate-400">
            Monitor and manage all diesel/electric locomotives commissioned at ELS Jamalpur
          </p>
        </div>
        
        {user?.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white shadow-lg shadow-railway-blue/20 transition-all border border-railway-blue-light/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Commission Locomotive
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800/40 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Locomotive Number or Pilot Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-sm focus:outline-none focus:border-railway-gold transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-sm focus:outline-none text-slate-300"
          >
            <option value="">All Models</option>
            <option value="WAP7">WAP7 (Passenger)</option>
            <option value="WAP5">WAP5 (Passenger)</option>
            <option value="WAG9">WAG9 (Freight)</option>
            <option value="WAG7">WAG7 (Freight)</option>
            <option value="WDM">WDM (Diesel)</option>
            <option value="WDG">WDG (Diesel)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-850 text-sm focus:outline-none text-slate-300"
          >
            <option value="">All Health Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Maintenance Soon">Needs Maintenance</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
        </div>
      ) : locos.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center text-slate-500 border border-slate-800/40">
          No locomotives found matching the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locos.map((loco) => (
            <div
              key={loco._id}
              onClick={() => navigate(`/locomotives/${loco.locoNo}`)}
              className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/10 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                      {loco.model}
                    </span>
                    <h3 className="text-xl font-bold font-mono mt-1 text-white">Loco #{loco.locoNo}</h3>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold
                    ${loco.status === 'Healthy' ? 'bg-green-500/15 text-green-400' : loco.status === 'Critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {loco.status}
                  </span>
                </div>

                {/* Substats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-850/80 mb-4 text-xs">
                  <div>
                    <span className="text-slate-450">Traction Pilot</span>
                    <div className="font-semibold text-slate-200 truncate mt-0.5">{loco.driver}</div>
                  </div>
                  <div>
                    <span className="text-slate-450">Health Index</span>
                    <div className="font-bold font-mono mt-0.5 text-railway-gold">{loco.health}%</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-slate-400">
                      <Activity className="mr-1.5 h-3.5 w-3.5 text-slate-550" /> Traction Motor
                    </span>
                    <span className="font-mono text-slate-200">{loco.tractionMotor}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-slate-400">
                      <Battery className="mr-1.5 h-3.5 w-3.5 text-slate-550" /> Aux Battery
                    </span>
                    <span className="font-mono text-slate-200">{loco.battery}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-slate-400">
                      <Shield className="mr-1.5 h-3.5 w-3.5 text-slate-550" /> Kavach System
                    </span>
                    <span className={`font-semibold font-mono uppercase ${loco.kavachStatus === 'Active' ? 'text-green-500' : 'text-red-500'}`}>
                      {loco.kavachStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-850/40 text-[11px] text-slate-500 font-mono">
                <span className="flex items-center">
                  <Radio className="mr-1.5 h-3 w-3" /> RF: {loco.rfStatus}
                </span>
                <span className="flex items-center">
                  <FileCheck className="mr-1.5 h-3 w-3" /> {loco.maintenanceStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commissioning Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit text-lg font-bold text-white">Commission New Locomotive</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterLoco} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Locomotive Number</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 30210"
                  value={newLocoNo}
                  onChange={(e) => setNewLocoNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Model</label>
                  <select
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none text-slate-300"
                  >
                    <option value="WAP7">WAP7</option>
                    <option value="WAP5">WAP5</option>
                    <option value="WAG9">WAG9</option>
                    <option value="WAG7">WAG7</option>
                    <option value="WDM">WDM</option>
                    <option value="WDG">WDG</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Mfg Year</label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2030}
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Assigned Driver</label>
                <input
                  type="text"
                  placeholder="E.g., Amit Sharma"
                  value={newDriver}
                  onChange={(e) => setNewDriver(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white font-semibold text-sm transition-colors border border-railway-blue-light/10"
              >
                Add Locomotive
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
