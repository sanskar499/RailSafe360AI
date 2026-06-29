import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  Train,
  Heart,
  Wrench,
  AlertOctagon,
  FileWarning,
  Users,
  Compass,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Commissioning Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocoNo, setNewLocoNo] = useState('');
  const [newModel, setNewModel] = useState('WAP7');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newDriver, setNewDriver] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const summaryData = await api.reports.getSummary();
      const charts = await api.reports.getCharts();
      const activeAlerts = await api.locomotives.getAlerts();
      
      setSummary(summaryData);
      setChartData(charts);
      setAlerts(activeAlerts.filter((a: any) => !a.resolved));
    } catch (e) {
      console.error('Error fetching dashboard summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 20000);
    return () => clearInterval(interval);
  }, []);

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
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to commission locomotive.');
    }
  };

  if (isLoading || !summary || !chartData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  // Chart configs
  const maintenanceChart = {
    labels: chartData.maintenanceTrends.labels,
    datasets: [
      {
        label: 'Scheduled Maintenance',
        data: chartData.maintenanceTrends.scheduled,
        borderColor: '#328cc1',
        backgroundColor: 'rgba(50, 140, 193, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Unscheduled Repairs',
        data: chartData.maintenanceTrends.unscheduled,
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const failureChart = {
    labels: chartData.failureAnalytics.labels,
    datasets: [
      {
        label: 'Failure Incident Counts',
        data: chartData.failureAnalytics.counts,
        backgroundColor: [
          'rgba(225, 29, 72, 0.7)',
          'rgba(217, 179, 16, 0.7)',
          'rgba(50, 140, 193, 0.7)',
          'rgba(75, 85, 99, 0.7)',
          'rgba(22, 163, 74, 0.7)'
        ],
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1
      }
    ]
  };

  const statCards = [
    { label: 'Total Locomotives', value: summary.totalLocos, icon: Train, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Healthy Fleet', value: summary.healthyLocos, icon: Heart, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Under Maintenance', value: summary.underUnderMaintenance || summary.underMaintenance, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Active Alerts', value: summary.activeAlerts, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Open Incidents', value: summary.openIncidents, icon: FileWarning, color: 'text-red-400', bg: 'bg-rose-500/10' },
    { label: 'Total Engineers', value: summary.totalEngineers, icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: "Today's Inspections", value: summary.todaysInspections, icon: Compass, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Est. Shed Expense', value: `₹${summary.maintenanceCost.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Shed Command Dashboard</h2>
          <p className="text-sm text-slate-400">
            Real-time status overview of Jamalpur Shed Locomotives, Kavach & RTIS streams
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {user?.role === 'Admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white shadow-lg shadow-railway-blue/20 transition-colors border border-railway-blue-light/10"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Commission Locomotive
            </button>
          )}
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-350 border border-slate-750"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh telemetry
          </button>
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass-card rounded-2xl p-5 flex items-center space-x-4 border border-slate-800/40
                ${theme === 'dark' ? 'bg-slate-900/40 text-white' : 'bg-white text-slate-900'}`}
            >
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{card.label}</p>
                <h4 className="text-xl font-bold font-mono mt-1">{card.value}</h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Line Chart: Maintenance Trends */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase">Maintenance Servicing Trends</h3>
            <span className="text-[10px] bg-railway-blue/20 text-railway-blue-light px-2.5 py-1 rounded-full font-bold">
              6-Month Interval
            </span>
          </div>
          <div className="h-64">
            <Line
              data={maintenanceChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'top', labels: { color: '#9ca3af', font: { size: 10 } } }
                },
                scales: {
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { size: 9 } } },
                  x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 9 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Bar Chart: Failure Analytics */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase">Failure Classification Analysis</h3>
            <span className="text-[10px] bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full font-bold">
              Total logs
            </span>
          </div>
          <div className="h-64">
            <Bar
              data={failureChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { size: 9 } } },
                  x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 9 } } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Alerts & Component Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Alerts (2 cols) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 lg:col-span-2">
          <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase mb-4">Critical Safety Warnings</h3>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All railway networks running nominal. No active warnings.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-railway-gold font-mono">Loco #{alert.locoNo}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase
                        ${alert.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {alert.priority}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-355">{alert.message}</p>
                  </div>
                  <span className="text-xs bg-slate-800 px-3 py-1 rounded font-semibold text-slate-400">
                    {alert.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Component Health percentages */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40">
          <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase mb-5">Component Health Aggregates</h3>
          <div className="space-y-4">
            {chartData.componentHealth.labels.map((lbl: string, idx: number) => {
              const score = chartData.componentHealth.healthPercent[idx];
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">{lbl}</span>
                    <span className="font-mono">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${score > 90 ? 'bg-green-500' : score > 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commissioning Modal (Quick Shortcut) */}
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold text-slate-100"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold text-slate-100"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-railway-gold text-slate-100"
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
