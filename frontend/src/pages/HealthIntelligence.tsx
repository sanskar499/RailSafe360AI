import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { DigitalTwin } from '../components/DigitalTwin';
import { Line } from 'react-chartjs-2';
import {
  Cpu,
  ShieldAlert,
  Flame,
  Search,
  Activity,
  Zap,
  TrendingUp,
  RefreshCw,
  Clock,
  Briefcase,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ArrowRight,
  BookOpen,
  Sliders,
  IndianRupee,
  UserCheck,
  ShieldCheck,
  Archive,
  Compass
} from 'lucide-react';

export const HealthIntelligence: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Selected Locomotive
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedLocoNo, setSelectedLocoNo] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  // Tabs: 'command', 'doctor', 'twin', 'fire', 'knowledge', 'replay', 'spares'
  const [activeTab, setActiveTab] = useState<string>('command');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Digital Twin Selection state
  const [selectedTwinComp, setSelectedTwinComp] = useState<string | null>(null);

  // Incident Replay player state
  const [replayData, setReplayData] = useState<any>(null);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Knowledge base search
  const [knowledgeArticles, setKnowledgeArticles] = useState<any[]>([]);
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');

  // Spares recommendations
  const [spareParts, setSpareParts] = useState<any[]>([]);

  // Simulation response popup
  const [simulationResponse, setSimulationResponse] = useState<any>(null);

  // Fetch initial fleet data
  const loadFleetData = async () => {
    try {
      setIsLoading(true);
      const data = await api.locomotives.getAll();
      setFleet(data);
      if (data.length > 0) {
        setSelectedLocoNo(data[0].locoNo);
      }

      // Load static data
      const knowledge = await api.healthIntel.getKnowledge();
      setKnowledgeArticles(knowledge);

      const spares = await api.healthIntel.getSpareParts();
      setSpareParts(spares);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch specific locomotive health status
  const fetchLocoHealth = async (locoNo: string) => {
    if (!locoNo) return;
    try {
      setIsUpdating(true);
      const status = await api.healthIntel.getStatus(locoNo);
      setHealthStatus(status);

      const replay = await api.healthIntel.getReplay(locoNo);
      setReplayData(replay);
      setReplayIndex(0);
      setIsPlaying(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  useEffect(() => {
    if (selectedLocoNo) {
      fetchLocoHealth(selectedLocoNo);
      setSimulationResponse(null);
    }
  }, [selectedLocoNo]);

  // Handle fault injection simulations
  const handleSimulateFault = async (faultType: string) => {
    if (!selectedLocoNo) return;
    try {
      setIsUpdating(true);
      const res = await api.healthIntel.triggerFault(selectedLocoNo, faultType);
      setSimulationResponse(res.automatedResponse);
      
      // Refresh status details
      const status = await api.healthIntel.getStatus(selectedLocoNo);
      setHealthStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Incident Replay Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && replayData) {
      interval = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= replayData.sensorHistory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, replayData]);

  if (isLoading || !healthStatus) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  // Map Digital Twin parameters for rendering
  const twinTelemetryMap = {
    tractionMotor: {
      name: 'Traction Motor (3-Phase Asynchronous)',
      health: healthStatus.digitalTwin.tractionMotorHealth,
      temp: healthStatus.digitalTwin.tractionMotorTemp,
      rul: healthStatus.digitalTwin.tractionMotorRul,
      status: healthStatus.digitalTwin.tractionMotorHealth >= 80 ? 'Nominal' : 'Wear Warning'
    },
    transformer: {
      name: 'Main step-down Transformer core',
      health: healthStatus.digitalTwin.transformerHealth,
      temp: healthStatus.digitalTwin.transformerTemp,
      rul: healthStatus.digitalTwin.transformerRul,
      status: healthStatus.digitalTwin.transformerHealth >= 80 ? 'Nominal' : 'Insulation Failure'
    },
    battery: {
      name: 'Auxiliary lead-acid battery bank cells',
      health: healthStatus.digitalTwin.batteryHealth,
      temp: healthStatus.digitalTwin.batteryTemp,
      rul: healthStatus.digitalTwin.batteryRul,
      status: healthStatus.digitalTwin.batteryHealth >= 80 ? 'Nominal' : 'Thermal Runaway'
    },
    brakes: {
      name: 'Carbon composition air brake rigging',
      health: healthStatus.digitalTwin.brakeHealth,
      temp: healthStatus.digitalTwin.brakeTemp,
      rul: healthStatus.digitalTwin.brakeRul,
      status: healthStatus.digitalTwin.brakeHealth >= 80 ? 'Nominal' : 'Seizure Risk'
    },
    gps: {
      name: 'GPS Localization Transponder',
      health: healthStatus.digitalTwin.gpsStatus === 'Active' ? 100 : 0,
      temp: 24,
      rul: 500,
      status: healthStatus.digitalTwin.gpsStatus
    },
    rf: {
      name: 'RF Communication Link',
      health: healthStatus.digitalTwin.rfStatus === 'Active' ? 100 : 0,
      temp: 24,
      rul: 500,
      status: healthStatus.digitalTwin.rfStatus
    },
    kavach: {
      name: 'Kavach SIL-4 Cabin display console',
      health: healthStatus.digitalTwin.kavachStatus === 'Active' ? 100 : 0,
      temp: 28,
      rul: 300,
      status: healthStatus.digitalTwin.kavachStatus
    }
  };

  const currentSelectedTelemetry = selectedTwinComp
    ? twinTelemetryMap[selectedTwinComp as keyof typeof twinTelemetryMap]
    : null;

  // Filtered knowledge articles
  const filteredArticles = knowledgeArticles.filter(art =>
    art.componentName.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    art.workingPrinciple.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  // Render color styles for safety score
  const getSafetyScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-450 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-amber-450 bg-amber-500/10 border-amber-500/20';
    if (score >= 50) return 'text-orange-450 bg-orange-500/10 border-orange-500/20';
    return 'text-red-450 bg-red-950/20 border-red-500/40';
  };

  // Replay Line Chart Config
  const replayChartData = replayData && {
    labels: replayData.sensorHistory.slice(0, replayIndex + 1).map((h: any) => h.time),
    datasets: [
      {
        label: 'Traction Motor Temp (°C)',
        data: replayData.sensorHistory.slice(0, replayIndex + 1).map((h: any) => h.motorTemp),
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225,29,72,0.1)',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Vibration Freq (Hz)',
        data: replayData.sensorHistory.slice(0, replayIndex + 1).map((h: any) => h.vibration),
        borderColor: '#fbbf24',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Load Current (A)',
        data: replayData.sensorHistory.slice(0, replayIndex + 1).map((h: any) => h.current / 4), // scale down for visual fit
        borderColor: '#3b82f6',
        tension: 0.3,
        fill: false
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold tracking-tight font-outfit">Autonomous AI Loco Health Intelligence</h2>
            <span className="bg-railway-blue/20 text-railway-blue-light text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border border-railway-blue-light/10 font-mono">SIL-4 CERTIFIED</span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time digital twin rendering, diagnostic doctor engine, predictive timelines, and automatic scheduling
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start">
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-450 font-bold font-mono">SELECTED UNIT:</span>
            <select
              value={selectedLocoNo}
              onChange={(e) => setSelectedLocoNo(e.target.value)}
              className="bg-transparent text-xs font-bold text-railway-gold focus:outline-none cursor-pointer"
            >
              {fleet.map(l => (
                <option key={l._id} value={l.locoNo} className="bg-slate-950 text-white">
                  Loco #{l.locoNo} ({l.model})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchLocoHealth(selectedLocoNo)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${isUpdating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-850 pb-px">
        {[
          { id: 'command', label: 'Executive Command Center', icon: Compass },
          { id: 'twin', label: 'Interactive Digital Twin', icon: Cpu },
          { id: 'doctor', label: 'AI Digital Loco Doctor', icon: ShieldAlert },
          { id: 'fire', label: 'Smart Fire Prevention', icon: Flame },
          { id: 'knowledge', label: 'Knowledge Assistant', icon: BookOpen },
          { id: 'replay', label: 'Incident Replay', icon: Activity },
          { id: 'spares', label: 'Spare Part Predictions', icon: Archive }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTwinComp(null);
              }}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold rounded-t-xl transition-all border-t-2 border-x whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-railway-gold bg-slate-900/40 text-railway-gold border-x-slate-850'
                  : 'border-transparent border-x-transparent text-slate-400 hover:text-white hover:bg-slate-900/10'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: EXECUTIVE COMMAND CENTER */}
      {activeTab === 'command' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Health index card */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-56">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Overall Loco Health Index</span>
              <div className="flex items-center justify-around py-2">
                <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-slate-800 bg-slate-900/40">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {Math.round((healthStatus.digitalTwin.tractionMotorHealth + healthStatus.digitalTwin.transformerHealth + healthStatus.digitalTwin.batteryHealth + healthStatus.digitalTwin.brakeHealth) / 4)}%
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase block font-semibold">HEALTH RATING</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-450 font-mono">Status: <span className="font-bold text-green-400">{healthStatus.status.toUpperCase()}</span></div>
                  <div className="text-[10px] text-slate-450 font-mono">Active fault: <span className={healthStatus.diagnosis.severity !== 'Safe' ? 'text-red-400 font-bold' : 'text-slate-400'}>{healthStatus.diagnosis.severity !== 'Safe' ? 'DETECTED' : 'NONE'}</span></div>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">Computed based on 4 telemetry modules</div>
            </div>

            {/* AI Safety Score */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-56">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">AI Safety Score</span>
              <div className="flex flex-col items-center justify-center py-2 space-y-1">
                <span className={`text-4xl font-extrabold font-mono px-4 py-1.5 rounded-2xl border ${getSafetyScoreColor(healthStatus.safetyScore)}`}>
                  {healthStatus.safetyScore}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase font-mono pt-1">SIL-4 Wear Safety Index</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono text-center">Color-coded: Green (Safe) to Red (Critical Risk)</div>
            </div>

            {/* Top 5 High Risk Locos */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 lg:col-span-2 flex flex-col justify-between h-56">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Top High Risk Locomotives (Shed Queue)</span>
              <div className="space-y-2 py-2 overflow-y-auto max-h-36">
                {fleet.map(l => (
                  <div key={l._id} className="flex justify-between items-center text-xs bg-slate-900/30 p-2 rounded-xl border border-slate-900">
                    <span className="font-bold text-slate-300 font-mono">Loco #{l.locoNo} ({l.model})</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-slate-500 font-mono">Health: {l.health}%</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono
                        ${l.status === 'Critical' ? 'bg-red-500/15 text-red-400' : l.status === 'Needs Maintenance' ? 'bg-amber-500/15 text-amber-400' : 'bg-green-500/15 text-green-400'}`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fire Risk map panel */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Shed Bay Fire Risk map</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
                  <span className="text-slate-400">Bay 1 (Emergency Isolation)</span>
                  <span className="font-bold text-red-400 font-mono">High Risk</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
                  <span className="text-slate-400">Bay 2 (Heavy Repairs)</span>
                  <span className="font-bold text-amber-450 font-mono">Low Risk</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
                  <span className="text-slate-400">Bay 3 (Under Inspection)</span>
                  <span className="font-bold text-green-400 font-mono">Safe</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-xl">
                  <span className="text-slate-400">Bay 4 (Light Repairs)</span>
                  <span className="font-bold text-green-400 font-mono">Safe</span>
                </div>
              </div>
            </div>

            {/* Live RTIS Status summary */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Live RTIS & Kavach Status</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Kavach System:</span>
                  <span className={`font-bold font-mono ${healthStatus.digitalTwin.kavachStatus === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{healthStatus.digitalTwin.kavachStatus.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">GPS Link:</span>
                  <span className="font-bold font-mono text-green-500">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">RF Transceiver:</span>
                  <span className="font-bold font-mono text-green-500">ONLINE</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">vibration metric:</span>
                  <span className={`font-bold font-mono ${healthStatus.vibration > 60 ? 'text-red-400' : 'text-slate-300'}`}>{healthStatus.vibration} Hz</span>
                </div>
              </div>
            </div>

            {/* Pending Inspections & Availability */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Technicians & Bays Allocation</span>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450">Bays Available:</span>
                  <span className="font-bold font-mono text-slate-200">2 / 4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Technicians Assigned:</span>
                  <span className="font-bold font-mono text-slate-200">Vikram Singh, Amit Sharma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450">Active Incident Tickets:</span>
                  <span className="font-bold font-mono text-railway-gold">1 Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DIGITAL TWIN */}
      {activeTab === 'twin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Map Container (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <DigitalTwin
              telemetry={twinTelemetryMap}
              selectedComponent={selectedTwinComp}
              onSelectComponent={(name) => setSelectedTwinComp(name)}
            />
          </div>

          {/* Component Drawer Details (1 Col) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 h-fit min-h-[360px] flex flex-col justify-between">
            {selectedTwinComp && currentSelectedTelemetry ? (
              <div className="space-y-4">
                <div className="border-b border-slate-850 pb-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-mono">SELECTED COMPONENT</span>
                  <h3 className="text-base font-bold font-outfit text-white mt-0.5">{selectedTwinComp}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{currentSelectedTelemetry.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-center">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Health rating</span>
                    <span className={`text-xl font-bold font-mono block mt-1 ${currentSelectedTelemetry.health >= 85 ? 'text-green-400' : currentSelectedTelemetry.health >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {currentSelectedTelemetry.health}%
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-center">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block font-mono">Temperature</span>
                    <span className="text-xl font-bold font-mono block mt-1 text-white">{currentSelectedTelemetry.temp}°C</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Remaining Useful Life (RUL):</span>
                    <span className="font-mono text-railway-gold">{currentSelectedTelemetry.rul} Days</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-850 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${currentSelectedTelemetry.rul > 100 ? 'bg-green-500' : currentSelectedTelemetry.rul > 30 ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}
                      style={{ width: `${Math.min((currentSelectedTelemetry.rul / 365) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 text-xs text-slate-350 leading-relaxed">
                  <strong>Status Code:</strong> {currentSelectedTelemetry.status.toUpperCase()} &bull; Component telemetry is synchronized with central ELS telemetry nodes.
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-20">
                <Cpu className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Click on any component inside the WAP7 locomotive schematic layout above to inspect real-time digital twin state values.</p>
              </div>
            )}

            {selectedTwinComp && (
              <button
                onClick={() => {
                  let keyword = selectedTwinComp;
                  if (selectedTwinComp === 'tractionMotor') keyword = 'motor';
                  if (selectedTwinComp === 'battery') keyword = 'battery';
                  if (selectedTwinComp === 'brakes') keyword = 'brake';
                  setActiveTab('knowledge');
                  setKnowledgeSearch(keyword);
                }}
                className="w-full mt-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors border border-slate-750 flex items-center justify-center"
              >
                <BookOpen className="mr-1.5 h-4 w-4" />
                Open Engineering Repair Manual
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI DIGITAL LOCO DOCTOR & TIMELINE */}
      {activeTab === 'doctor' && (
        <div className="space-y-6">
          {/* Injected Fault Simulation Actions */}
          {user?.role === 'Admin' && (
            <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider font-mono">
                <Sliders className="h-4 w-4 text-railway-gold" />
                <span>Simulation Injectors (Admin Only)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSimulateFault('bearing_wear')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                >
                  Simulate Bearing Wear
                </button>
                <button
                  onClick={() => handleSimulateFault('insulation_breakdown')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                >
                  Simulate Insulation breakdown
                </button>
                <button
                  onClick={() => handleSimulateFault('smoke_hazard')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-950/30 hover:bg-red-950/50 text-red-500 border border-red-500/30 transition-all"
                >
                  Simulate Cabinet Smoke
                </button>
              </div>
            </div>
          )}

          {/* Fault Simulation Response Info Panel */}
          {simulationResponse && (
            <div className="p-4 bg-green-950/20 border-2 border-green-500 rounded-2xl space-y-2 text-xs text-green-200">
              <h4 className="font-bold flex items-center">
                <CheckCircle className="mr-1.5 h-4.5 w-4.5 text-green-500" />
                AUTOMATIC MAINTENANCE TICKET SCHEDULED
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-[11px] font-mono">
                <div><strong>Assigned Tech:</strong> {simulationResponse.assignedEngineer}</div>
                <div><strong>Reserved Bay:</strong> {simulationResponse.reservedBay}</div>
                <div><strong>Allocated Parts:</strong> {simulationResponse.sparePartsAllocated.join(', ')}</div>
                <div><strong>Est. Downtime:</strong> {simulationResponse.estimatedDowntime} Hours</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: AI Diagnosis Engine (2 Cols) */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Loco Doctor Diagnostics Output</span>
                <h3 className="text-base font-bold text-white mt-1">Diagnosis: {healthStatus.diagnosis.possibleFault}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">Probability</span>
                  <span className="text-2xl font-extrabold font-mono text-railway-gold block mt-1">
                    {healthStatus.diagnosis.probability}%
                  </span>
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">Severity Level</span>
                  <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded block mt-2 uppercase
                    ${healthStatus.diagnosis.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : healthStatus.diagnosis.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/15 text-green-450'}`}>
                    {healthStatus.diagnosis.severity}
                  </span>
                </div>
                <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block font-mono">Skill Required</span>
                  <span className="text-xs font-semibold text-slate-300 block mt-2">
                    {healthStatus.diagnosis.engineerSkillRequired}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/30 p-4 border border-slate-900 rounded-2xl space-y-1 text-xs">
                <strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">Estimated Repair Cost & Downtime</strong>
                <div className="flex justify-between items-center pt-1 font-mono">
                  <span className="flex items-center"><IndianRupee className="h-4 w-4 mr-1 text-green-400" /> Est. Cost: ₹{healthStatus.diagnosis.estimatedRepairCost.toLocaleString()}</span>
                  <span className="flex items-center"><Clock className="h-4 w-4 mr-1 text-railway-gold" /> Est. Repair Time: {healthStatus.diagnosis.estimatedDowntime} Hours</span>
                </div>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">Diagnostics Root Cause Analysis</strong>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-900">
                  {healthStatus.diagnosis.rootCause}
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block">AI Corrective Recommendations</strong>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {healthStatus.diagnosis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-railway-gold block mb-1">Check {idx + 1}:</span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Failure Prediction Timeline (1 Col) */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Failure Prediction Timeline</span>
              
              <div className="relative border-l border-slate-800 ml-3.5 pl-6 space-y-6 text-xs">
                {/* Stage 1 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 bg-slate-950 border-2 border-green-500 rounded-full h-5.5 w-5.5 flex items-center justify-center text-[9px] font-mono text-green-450 font-bold">1</span>
                  <div className="space-y-1">
                    <strong className="text-green-450 block font-mono">Today (Nominal status)</strong>
                    <p className="text-[11px] text-slate-500">Locomotive operating under standard constraints.</p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 bg-slate-950 border-2 border-amber-500 rounded-full h-5.5 w-5.5 flex items-center justify-center text-[9px] font-mono text-amber-450 font-bold">2</span>
                  <div className="space-y-1">
                    <strong className="text-amber-450 block font-mono">3 Days (Sensor readings increase)</strong>
                    <p className="text-[11px] text-slate-450">Traction Motor temp rises to 90°C. Bearings wear probability moves to 91%.</p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 bg-slate-950 border-2 border-orange-500 rounded-full h-5.5 w-5.5 flex items-center justify-center text-[9px] font-mono text-orange-400 font-bold">3</span>
                  <div className="space-y-1">
                    <strong className="text-orange-400 block font-mono">6 Days (Thermal limit alarm)</strong>
                    <p className="text-[11px] text-slate-450">Motor failure probability exceeds 80%. System warning logs dispatch to ELS desk.</p>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="relative">
                  <span className="absolute -left-9.5 top-0.5 bg-slate-950 border-2 border-red-500 rounded-full h-5.5 w-5.5 flex items-center justify-center text-[9px] font-mono text-red-400 font-bold">4</span>
                  <div className="space-y-1">
                    <strong className="text-red-400 block font-mono">8 Days (Automatic shutdown)</strong>
                    <p className="text-[11px] text-slate-450">Fire risk calculations critical. Kavach activates emergency brakes to arrest locomotive.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 text-center">
                <span className="text-[10px] text-slate-500 font-mono">SIL-4 Predictive Diagnosis Timeline Engine</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SMART FIRE PREVENTION ENGINE */}
      {activeTab === 'fire' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fire score dials (1 Col) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Fire Safety scoring</span>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-4 border-slate-800 bg-slate-900/40">
                <div className="text-center">
                  <span className={`text-4xl font-extrabold font-mono block ${healthStatus.fireDetails.riskPercent > 70 ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
                    {healthStatus.fireDetails.riskPercent}%
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase font-mono block font-bold mt-1">FIRE RISK</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Time to critical failure: <span className="font-bold text-railway-gold">{healthStatus.fireDetails.timeBeforeFailure}</span>
            </div>
          </div>

          {/* Fire Spread Simulation visual panel (1 Col) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Fire Spread CAD simulation</span>

            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4">
              <div className="relative w-full max-w-xs border border-slate-850 p-3.5 rounded-xl bg-slate-900/30 text-[10px] font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span>Cabinet Winding:</span>
                  <span className={healthStatus.fireDetails.spreadZones.includes('Cabinet Winding') ? 'text-red-500 font-bold animate-pulse' : 'text-green-500'}>
                    {healthStatus.fireDetails.spreadZones.includes('Cabinet Winding') ? 'COMBUSTED' : 'SAFE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Traction motor:</span>
                  <span className={healthStatus.fireDetails.spreadZones.includes('Motor Bearings') ? 'text-red-500 font-bold animate-pulse' : 'text-green-500'}>
                    {healthStatus.fireDetails.spreadZones.includes('Motor Bearings') ? 'COMBUSTED' : 'SAFE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Battery Compartment:</span>
                  <span className="text-green-500">SAFE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auxiliary Charger:</span>
                  <span className="text-green-500">SAFE</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-mono">
              Suppression response trigger status: <span className="font-bold text-slate-350">{healthStatus.fireDetails.riskPercent > 70 ? 'DEPLOYED' : 'STANDBY'}</span>
            </div>
          </div>

          {/* Immediate actions required (1 Col) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono block border-b border-slate-850 pb-2.5">Emergency response checklists</span>
            
            <div className="flex-1 py-4 overflow-y-auto space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <span className="h-2 w-2 rounded-full bg-railway-gold mt-1.5 flex-shrink-0"></span>
                <p>Isolate Winding circuit breakers immediately.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="h-2 w-2 rounded-full bg-railway-gold mt-1.5 flex-shrink-0"></span>
                <p>Recommended Technical Responder: <strong className="text-white font-mono">{healthStatus.fireDetails.recommendEngineer}</strong></p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="h-2 w-2 rounded-full bg-railway-gold mt-1.5 flex-shrink-0"></span>
                <p>Audit insulation sheets integrity in primary bays.</p>
              </div>
            </div>

            <div className="text-right text-[10px] text-slate-500 font-mono">
              Automatic fire suppression loops: ARMED
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OFFLINE KNOWLEDGE ASSISTANT */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-550" />
            <input
              type="text"
              placeholder="Search components manuals (e.g. Traction Motor, Transformer winding...)"
              value={knowledgeSearch}
              onChange={(e) => setKnowledgeSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-850 text-xs focus:outline-none focus:border-railway-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((art, idx) => (
              <div key={idx} className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
                <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white font-outfit">{art.componentName}</h4>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 font-bold uppercase">{art.maintenanceFrequency}</span>
                </div>
                
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Working Principle</span>
                    <p className="text-slate-350">{art.workingPrinciple}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Common Fault Symptoms</span>
                    {art.commonFaults.map((f: any, fIdx: number) => (
                      <div key={fIdx} className="bg-slate-900/40 p-2 rounded border border-slate-900 text-[11px]">
                        <strong>{f.name}:</strong> <span className="text-slate-450">{f.symptoms}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Inspection Steps</span>
                    <ul className="list-decimal pl-4 text-slate-350 space-y-1">
                      {art.inspectionSteps.map((step: string, sIdx: number) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Repair Guide</span>
                    <p className="text-railway-gold">{art.repairGuide}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: INCIDENT REPLAY */}
      {activeTab === 'replay' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Replay Controls & Timeline (1 Col) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-[380px]">
            <div className="space-y-4">
              <div className="border-b border-slate-850 pb-2.5">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Incident Telemetry Replay</span>
                <h3 className="text-sm font-bold text-white mt-1">{replayData ? replayData.title : 'Incident Replay'}</h3>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white transition-colors"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="text-xs font-mono">
                  Time Step: <span className="text-railway-gold font-bold">{replayData?.sensorHistory[replayIndex]?.time || 'T-0'}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-4">
                <span className="text-[9px] font-mono text-slate-550 uppercase tracking-wider block">Playback Progress bar</span>
                <input
                  type="range"
                  min="0"
                  max={replayData ? replayData.sensorHistory.length - 1 : 0}
                  value={replayIndex}
                  onChange={(e) => {
                    setReplayIndex(parseInt(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-railway-gold h-1 bg-slate-850 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {replayData && (
              <div className="space-y-2.5 text-xs border-t border-slate-850 pt-4">
                <strong className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Resolved Maintenance Actions</strong>
                <p className="text-slate-350 leading-relaxed font-mono text-[10px] bg-slate-900/40 p-2.5 border border-slate-900 rounded-xl">
                  {replayData.resolution}
                </p>
              </div>
            )}
          </div>

          {/* Replay Line Chart (2 Cols) */}
          <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20 h-[380px]">
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-400 mb-4 flex items-center">
              <Activity className="mr-2 h-4.5 w-4.5 text-red-500" />
              Incident Telemetry Line Graphs (Live replay)
            </h3>
            <div className="h-64">
              {replayChartData ? (
                <Line
                  data={replayChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                      x: { ticks: { color: '#9ca3af', font: { size: 9 } }, grid: { display: false } }
                    }
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  No replay buffers found for Locomotive #{selectedLocoNo}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SPARE PART PREDICTIONS */}
      {activeTab === 'spares' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-300 font-mono uppercase tracking-wider">Predictive Spares Allocation checklist</h3>
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">UP TO DATE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 7 Days timeframe */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-red-400 font-mono block">Next 7 Days (Critical Needs)</span>
              </div>
              <div className="space-y-3">
                {spareParts.filter(p => p.timeframe === 7).map((p, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-3 rounded-2xl border border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300 truncate">{p.partName}</span>
                      <span className="font-mono text-red-400 font-bold">{p.probability}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Needed: {p.quantityRequired}</span>
                      <span>Stock: {p.currentStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 15 Days timeframe */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-amber-450 font-mono block">Next 15 Days (Reorder Warning)</span>
              </div>
              <div className="space-y-3">
                {spareParts.filter(p => p.timeframe === 15).map((p, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-3 rounded-2xl border border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300 truncate">{p.partName}</span>
                      <span className="font-mono text-amber-500 font-bold">{p.probability}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Needed: {p.quantityRequired}</span>
                      <span>Stock: {p.currentStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 30 Days timeframe */}
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-green-400 font-mono block">Next 30 Days (Adequate Buffer)</span>
              </div>
              <div className="space-y-3">
                {spareParts.filter(p => p.timeframe === 30).map((p, idx) => (
                  <div key={idx} className="bg-slate-900/40 p-3 rounded-2xl border border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-300 truncate">{p.partName}</span>
                      <span className="font-mono text-green-400 font-bold">{p.probability}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Needed: {p.quantityRequired}</span>
                      <span>Stock: {p.currentStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
