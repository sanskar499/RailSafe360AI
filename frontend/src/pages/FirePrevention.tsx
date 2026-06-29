import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Flame,
  Activity,
  Zap,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sliders,
  History,
  TrendingUp,
  Cpu,
  Thermometer,
  ShieldX
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const FirePrevention: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Fleet selection states
  const [locomotives, setLocomotives] = useState<any[]>([]);
  const [selectedLocoNo, setSelectedLocoNo] = useState<string>('');
  const [statusData, setStatusData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Simulation Sliders states
  const [motorTemp, setMotorTemp] = useState(50);
  const [transformerTemp, setTransformerTemp] = useState(45);
  const [batteryTemp, setBatteryTemp] = useState(30);
  const [brakeTemp, setBrakeTemp] = useState(35);
  const [panelTemp, setPanelTemp] = useState(28);
  const [smokeLevel, setSmokeLevel] = useState('No Smoke');
  const [currentDraw, setCurrentDraw] = useState(300);
  const [voltage, setVoltage] = useState(390);

  // Fetch initial fleet and static analytics
  const initPage = async () => {
    try {
      setIsLoading(true);
      const fleet = await api.locomotives.getAll();
      setLocomotives(fleet);
      
      const analytics = await api.firePrevention.getAnalytics();
      setAnalyticsData(analytics);

      if (fleet.length > 0) {
        setSelectedLocoNo(fleet[0].locoNo);
      }
    } catch (e) {
      console.error('Error initializing Fire Prevention page:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch telemetry status and timeline for chosen loco
  const fetchLocoFireStatus = async (locoNo: string) => {
    if (!locoNo) return;
    try {
      const data = await api.firePrevention.getStatus(locoNo);
      setStatusData(data);

      // Sync simulator sliders with actual DB state
      setMotorTemp(data.thermal.tractionMotor);
      setTransformerTemp(data.thermal.transformer);
      setBatteryTemp(data.thermal.battery);
      setBrakeTemp(data.thermal.brake);
      setPanelTemp(data.thermal.electricalPanel);
      setSmokeLevel(data.sensor.smokeStatus);
      setCurrentDraw(data.electrical.current);
      setVoltage(data.electrical.voltage);

      const timeline = await api.firePrevention.getTimeline(locoNo);
      setTimelineData(timeline);
    } catch (e) {
      console.error(`Error loading fire status for Loco #${locoNo}:`, e);
    }
  };

  useEffect(() => {
    initPage();
  }, []);

  useEffect(() => {
    if (selectedLocoNo) {
      fetchLocoFireStatus(selectedLocoNo);
    }
  }, [selectedLocoNo]);

  // Handle sensor overrides (sliders change)
  const handleSensorChange = async (updates: any) => {
    if (!selectedLocoNo || !statusData) return;
    try {
      // Optimistically update slider UI inputs
      if (updates.tractionMotor !== undefined) setMotorTemp(updates.tractionMotor);
      if (updates.transformer !== undefined) setTransformerTemp(updates.transformer);
      if (updates.battery !== undefined) setBatteryTemp(updates.battery);
      if (updates.brake !== undefined) setBrakeTemp(updates.brake);
      if (updates.electricalPanel !== undefined) setPanelTemp(updates.electricalPanel);
      if (updates.smokeStatus !== undefined) setSmokeLevel(updates.smokeStatus);
      if (updates.current !== undefined) setCurrentDraw(updates.current);
      if (updates.voltage !== undefined) setVoltage(updates.voltage);

      // Submit sensor values payload
      await api.firePrevention.overrideSensors(selectedLocoNo, {
        tractionMotor: updates.tractionMotor !== undefined ? updates.tractionMotor : motorTemp,
        transformer: updates.transformer !== undefined ? updates.transformer : transformerTemp,
        battery: updates.battery !== undefined ? updates.battery : batteryTemp,
        brake: updates.brake !== undefined ? updates.brake : brakeTemp,
        electricalPanel: updates.electricalPanel !== undefined ? updates.electricalPanel : panelTemp,
        smokeStatus: updates.smokeStatus || smokeLevel,
        current: updates.current !== undefined ? updates.current : currentDraw,
        voltage: updates.voltage !== undefined ? updates.voltage : voltage
      });

      // Refetch DB values to sync
      const refreshed = await api.firePrevention.getStatus(selectedLocoNo);
      setStatusData(refreshed);

      const timeline = await api.firePrevention.getTimeline(selectedLocoNo);
      setTimelineData(timeline);
    } catch (e) {
      console.error('Error override fire sensors:', e);
    }
  };

  if (isLoading || !statusData || !analyticsData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  // Calculate dynamic recommendations based on current sensor triggers
  const getAIRecommendations = () => {
    const recs = [];
    const { thermal, sensor, electrical, severity } = statusData;

    if (thermal.tractionMotor > 90) {
      recs.push({ text: 'Inspect WAP/WAG traction motor cooling blower & ventilation grids.', priority: 'High' });
    }
    if (thermal.transformer > 85) {
      recs.push({ text: 'Perform oil temperature and insulation test on Transformer core windings.', priority: 'High' });
    }
    if (thermal.battery > 60) {
      recs.push({ text: 'Inspect auxiliary battery compartment; check charger voltage loops.', priority: 'Medium' });
    }
    if (thermal.brake > 95) {
      recs.push({ text: 'Inspect mechanical brake block gap adjustments and pressure valve release.', priority: 'Low' });
    }
    if (thermal.electricalPanel > 75) {
      recs.push({ text: 'Conduct visual inspection of primary electrical panel harness joints for loose contacts.', priority: 'High' });
    }
    if (electrical.current > 400 && (thermal.tractionMotor > 80 || thermal.electricalPanel > 70)) {
      recs.push({ text: 'High current loading with elevated heat detected. Reduce traction motor current draw.', priority: 'Critical' });
    }
    if (sensor.smokeStatus !== 'No Smoke') {
      recs.push({ text: 'Deploy onboard fire safety dampers and isolate battery isolation switches.', priority: 'Critical' });
    }

    if (severity === 'Critical') {
      recs.push({ text: 'Locomotive is marked OUT OF SERVICE. Shut down auxiliary power and isolate cab immediately.', priority: 'Critical' });
    }

    if (recs.length === 0) {
      recs.push({ text: 'No critical hazards detected. Continue nominal schedules and audits.', priority: 'Safe' });
    }

    return recs;
  };

  const recommendations = getAIRecommendations();

  // Color mappings based on risk level
  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'Safe': return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', progress: 'bg-green-500' };
      case 'Low': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-400' };
      case 'Medium': return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', progress: 'bg-orange-500' };
      case 'High': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', progress: 'bg-red-500' };
      case 'Critical': return { bg: 'bg-red-950/20', border: 'border-red-500', text: 'text-red-500 animate-pulse', progress: 'bg-red-650 animate-pulse' };
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', progress: 'bg-slate-500' };
    }
  };

  const riskTheme = getRiskColor(statusData.severity);

  // Charts Config
  const trendChartData = {
    labels: analyticsData.monthlyTrends.labels,
    datasets: [
      {
        label: 'Monthly Fire Risk Alerts Logged',
        data: analyticsData.monthlyTrends.data,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const componentChartData = {
    labels: analyticsData.overheatedComponents.map((c: any) => c.name),
    datasets: [
      {
        label: 'Overheating Events Count',
        data: analyticsData.overheatedComponents.map((c: any) => c.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">AI Fire Prevention & Hazard Detection</h2>
          <p className="text-sm text-slate-400">
            Real-time thermal monitoring, electrical health analytics, smoke sirens, and automatic isolation workflows
          </p>
        </div>

        {/* Locomotive Selector */}
        <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl self-start">
          <span className="text-xs text-slate-400 font-semibold font-mono">LOCOMOTIVE:</span>
          <select
            value={selectedLocoNo}
            onChange={(e) => setSelectedLocoNo(e.target.value)}
            className="bg-transparent text-xs font-bold text-railway-gold focus:outline-none cursor-pointer"
          >
            {locomotives.map(l => (
              <option key={l._id} value={l.locoNo} className="bg-slate-950 text-white">
                Loco #{l.locoNo} ({l.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency Global Alert if Critical */}
      {statusData.severity === 'Critical' && (
        <div className="p-4 bg-red-950/60 border-2 border-red-500 rounded-2xl flex items-center space-x-3 text-red-200 animate-pulse">
          <ShieldX className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">
            <strong>CRITICAL FIRE ALARM TRIGGERED</strong> &bull; Loco #{statusData.locoNo} has been automatically marked 
            <span className="bg-red-900 px-2 py-0.5 rounded font-mono font-bold mx-1.5">OUT OF SERVICE</span> 
            due to severe overheating / smoke detection logs. Circuit breakers tripped, and assigned technicians have been dispatched!
          </div>
        </div>
      )}

      {/* Top dashboard summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fire Risk score Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-72">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Fire Risk Score</span>
            <span className="text-[10px] text-slate-500 font-mono">UPDATED: JUST NOW</span>
          </div>

          <div className="flex items-center justify-around py-4">
            <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-slate-800/50 bg-slate-900/40">
              <div className="text-center">
                <span className={`text-3xl font-extrabold font-mono ${riskTheme.text}`}>
                  {statusData.prediction.probability}%
                </span>
                <span className="text-[10px] text-slate-450 uppercase block font-semibold mt-0.5">RISK PROBABILITY</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold">
                Risk Level: 
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ml-2 ${riskTheme.bg} ${riskTheme.text} border ${riskTheme.border}`}>
                  {statusData.severity.toUpperCase()}
                </span>
              </div>
              <div className="text-[10px] text-slate-450 leading-relaxed font-mono">
                LOCO STATUS: <span className={statusData.maintenanceStatus === 'Out of Service' ? 'text-red-500 font-bold' : 'text-slate-300'}>{statusData.maintenanceStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div className={`h-full rounded-full transition-all duration-300 ${riskTheme.progress}`} style={{ width: `${statusData.prediction.probability}%` }}></div>
          </div>
        </div>

        {/* Smoke Sensor status card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-72">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Smoke Detection System</span>
            <span className="text-[10px] text-slate-500 font-mono">SENSOR: SD-401</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center border transition-all duration-300
              ${statusData.sensor.smokeStatus === 'Heavy Smoke' ? 'bg-red-500/20 border-red-500 animate-bounce' : statusData.sensor.smokeStatus === 'Light Smoke' ? 'bg-amber-500/20 border-amber-500 animate-pulse' : 'bg-slate-900/60 border-slate-800'}`}>
              <Flame className={`h-8 w-8 ${statusData.sensor.smokeStatus !== 'No Smoke' ? 'text-red-500' : 'text-slate-500'}`} />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs text-slate-500 font-mono block">SMOKE READING</span>
              <span className={`text-base font-extrabold tracking-wide uppercase ${statusData.sensor.smokeStatus !== 'No Smoke' ? 'text-red-500' : 'text-green-400'}`}>
                {statusData.sensor.smokeStatus}
              </span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-2.5">
            Automatic fire suppression loops: {statusData.sensor.smokeStatus === 'Heavy Smoke' ? 'DEPLOYED' : 'ARMED'}
          </div>
        </div>

        {/* Hazard Prediction Engine card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-72">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Hazard Prediction Engine</span>
            <span className="text-[10px] text-slate-500 font-mono">AI DIAGNOSTIC: OK</span>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-3 py-3 text-xs">
            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-900 space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Predicted Cause</span>
              <p className="text-slate-200 font-medium leading-relaxed truncate">{statusData.prediction.possibleCause}</p>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-900 space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Suggested Corrective Action</span>
              <p className="text-railway-gold font-medium leading-relaxed truncate">{statusData.prediction.suggestedAction}</p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-2.5">
            Kavach SIL-4 Risk Rating: {statusData.severity}
          </div>
        </div>
      </div>

      {/* Main grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Thermal Monitor + Electrical Health (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thermal Monitoring Grid */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
              <Thermometer className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Thermal Sensors Monitoring</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Traction Motor */}
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-900 text-center space-y-2">
                <span className="text-[8px] font-bold text-slate-450 uppercase block font-mono">Traction Motor</span>
                <div className={`text-2xl font-bold font-mono ${statusData.thermal.tractionMotor > 90 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {statusData.thermal.tractionMotor}°C
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Limit: 90°C</div>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-mono text-green-400 block border border-slate-850">
                  Trend: Steady
                </span>
              </div>

              {/* Transformer */}
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-900 text-center space-y-2">
                <span className="text-[8px] font-bold text-slate-450 uppercase block font-mono">Transformer Winding</span>
                <div className={`text-2xl font-bold font-mono ${statusData.thermal.transformer > 85 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {statusData.thermal.transformer}°C
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Limit: 85°C</div>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-mono text-green-400 block border border-slate-850">
                  Trend: Steady
                </span>
              </div>

              {/* Battery cell */}
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-900 text-center space-y-2">
                <span className="text-[8px] font-bold text-slate-450 uppercase block font-mono">Battery Cells</span>
                <div className={`text-2xl font-bold font-mono ${statusData.thermal.battery > 60 ? 'text-amber-500 animate-pulse' : 'text-white'}`}>
                  {statusData.thermal.battery}°C
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Limit: 60°C</div>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-mono text-green-400 block border border-slate-850">
                  Trend: Steady
                </span>
              </div>

              {/* Brakes */}
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-900 text-center space-y-2">
                <span className="text-[8px] font-bold text-slate-450 uppercase block font-mono">Brake Cylinder</span>
                <div className={`text-2xl font-bold font-mono ${statusData.thermal.brake > 95 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {statusData.thermal.brake}°C
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Limit: 95°C</div>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-mono text-green-400 block border border-slate-850">
                  Trend: Steady
                </span>
              </div>

              {/* Electrical panel */}
              <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-900 text-center space-y-2">
                <span className="text-[8px] font-bold text-slate-450 uppercase block font-mono">Electrical Cabinet</span>
                <div className={`text-2xl font-bold font-mono ${statusData.thermal.electricalPanel > 75 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {statusData.thermal.electricalPanel}°C
                </div>
                <div className="text-[9px] text-slate-500 font-mono">Limit: 75°C</div>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded font-mono text-green-400 block border border-slate-850">
                  Trend: Steady
                </span>
              </div>
            </div>
          </div>

          {/* Electrical Health monitoring */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
              <Zap className="h-5 w-5 text-railway-gold" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Electrical Health Diagnostics</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Current Draw</span>
                <div className="text-base font-bold font-mono text-white mt-1">{statusData.electrical.current} A</div>
              </div>
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Aux Voltage</span>
                <div className="text-base font-bold font-mono text-white mt-1">{statusData.electrical.voltage} V</div>
              </div>
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Power Draw</span>
                <div className="text-base font-bold font-mono text-white mt-1">{statusData.electrical.power} kW</div>
              </div>
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Cable Health</span>
                <div className={`text-base font-bold font-mono mt-1 ${statusData.electrical.cableHealth >= 80 ? 'text-green-400' : 'text-red-500'}`}>{statusData.electrical.cableHealth}%</div>
              </div>
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Fuses</span>
                <span className={`text-[10px] font-bold uppercase mt-1.5 block ${statusData.electrical.fuseStatus === 'Operational' ? 'text-green-500' : 'text-red-500'}`}>
                  {statusData.electrical.fuseStatus}
                </span>
              </div>
              <div className="bg-slate-900/40 rounded-2xl p-3 border border-slate-900 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Circuit Breaker</span>
                <span className={`text-[10px] font-bold uppercase mt-1.5 block ${statusData.electrical.breakerStatus === 'Closed' ? 'text-green-500' : 'text-red-500'}`}>
                  {statusData.electrical.breakerStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI Recommendations + Interactive Simulator (1 Col) */}
        <div className="space-y-6">
          {/* AI Recommendation panel */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-[300px]">
            <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
              <Cpu className="h-5 w-5 text-railway-gold animate-pulse" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">AI Safety Recommendations</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/60">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono mt-0.5
                    ${rec.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : rec.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : rec.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-green-500/10 text-green-400'}`}>
                    {rec.priority}
                  </span>
                  <p className="text-xs text-slate-300 leading-normal">{rec.text}</p>
                </div>
              ))}
            </div>

            <div className="text-[9px] text-slate-500 font-mono text-right pt-2 border-t border-slate-850">
              Generated using Expert Rule Logic
            </div>
          </div>

          {/* Interactive simulator controls */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-850 pb-3">
              <Sliders className="h-5 w-5 text-railway-gold" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Sensor Simulator Panel</h3>
            </div>

            <div className="space-y-3.5">
              {/* Traction motor */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Traction Motor</span>
                  <span className="font-mono text-railway-gold">{motorTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={motorTemp}
                  onChange={(e) => handleSensorChange({ tractionMotor: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-railway-gold"
                />
              </div>

              {/* Transformer */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Transformer</span>
                  <span className="font-mono text-railway-gold">{transformerTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="110"
                  value={transformerTemp}
                  onChange={(e) => handleSensorChange({ transformer: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-railway-gold"
                />
              </div>

              {/* Battery temp */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Battery</span>
                  <span className="font-mono text-railway-gold">{batteryTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={batteryTemp}
                  onChange={(e) => handleSensorChange({ battery: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-railway-gold"
                />
              </div>

              {/* Electrical current */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Load Current</span>
                  <span className="font-mono text-railway-gold">{currentDraw} A</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="500"
                  value={currentDraw}
                  onChange={(e) => handleSensorChange({ current: parseInt(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-railway-gold"
                />
              </div>

              {/* Smoke levels dropdown override */}
              <div className="space-y-1 pt-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase font-mono">Smoke Status Selector</label>
                <select
                  value={smokeLevel}
                  onChange={(e) => handleSensorChange({ smokeStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs focus:outline-none text-slate-300 font-mono"
                >
                  <option value="No Smoke">No Smoke (Clear)</option>
                  <option value="Light Smoke">Light Smoke (Warning)</option>
                  <option value="Heavy Smoke">Heavy Smoke (Critical Hazard)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Fire Incident Timeline & Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Log (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-[380px]">
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-3">
            <History className="h-5 w-5 text-railway-gold" />
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Fire Incident Timeline</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3">
            {timelineData.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                No active fire events or safety isolations logged for this locomotive.
              </div>
            ) : (
              timelineData.map((event, idx) => (
                <div key={idx} className="p-3 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-450">
                    <span className="bg-slate-800 border border-slate-750 px-2 py-0.5 rounded text-slate-200 font-bold uppercase">{event.type}</span>
                    <span>{new Date(event.time).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-350">{event.remarks}</p>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>SECTOR: {event.sensor}</span>
                    <span>ENGINEER: {event.assigned}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Fire Risk Trends Chart (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20 h-[380px]">
          <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-400 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-4.5 w-4.5 text-red-500" />
            Shed Fire Alerts Trends
          </h3>
          <div className="h-64">
            <Line
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 0, max: 40, ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  x: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Components Overheating (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20 h-[380px]">
          <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-400 mb-4 flex items-center">
            <Activity className="mr-2 h-4.5 w-4.5 text-railway-gold" />
            Component Hotspots Breakdown
          </h3>
          <div className="h-64">
            <Bar
              data={componentChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { min: 0, max: 60, ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  x: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
