import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  Wifi,
  Compass,
  AlertOctagon,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Train,
  RefreshCw
} from 'lucide-react';

export const KavachDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Fleet list state
  const [locomotives, setLocomotives] = useState<any[]>([]);
  const [selectedLoco, setSelectedLoco] = useState<any>(null);
  const [isLocosLoading, setIsLocosLoading] = useState(true);

  // Simulated cab state variables
  const [speed, setSpeed] = useState(60);
  const [maxAllowedSpeed, setMaxAllowedSpeed] = useState(80);
  const [signalAspect, setSignalAspect] = useState<'Green' | 'Yellow' | 'Red'>('Green');
  
  // Systems
  const [gpsStatus, setGpsStatus] = useState<'Active' | 'Inactive'>('Active');
  const [rfStatus, setRfStatus] = useState<'Active' | 'Inactive'>('Active');
  const [rfidStatus, setRfidStatus] = useState<'Active' | 'Inactive'>('Active');
  const [brakeStatus, setBrakeStatus] = useState<'Released' | 'Service Brake' | 'Emergency Braking'>('Released');
  const [brakePressure, setBrakePressure] = useState(5.0); // 5 kg/cm² is full release
  
  // Alarms
  const [collisionRisk, setCollisionRisk] = useState(false);
  const [overspeedWarning, setOverspeedWarning] = useState(false);
  const [spadWarning, setSpadWarning] = useState(false);
  const [protectionStatus, setProtectionStatus] = useState('ACTIVE - RUNNING');
  const [healthIndicator, setHealthIndicator] = useState<'Green' | 'Yellow' | 'Red'>('Green');

  const [activeScenario, setActiveScenario] = useState<string>('nominal');
  
  // Live Track Progression coordinates
  const [trackProgress, setTrackProgress] = useState(0);
  const [lastBeaconScanned, setLastBeaconScanned] = useState('None');

  const timerRef = useRef<any>(null);

  // Load locomotives on startup
  const fetchLocos = async () => {
    try {
      setIsLocosLoading(true);
      const data = await api.locomotives.getAll();
      setLocomotives(data);
      if (data.length > 0) {
        handleSelectLoco(data[0]);
      }
    } catch (e) {
      console.error('Error fetching fleet registry for Kavach:', e);
    } finally {
      setIsLocosLoading(false);
    }
  };

  useEffect(() => {
    fetchLocos();
    return () => stopSimulation();
  }, []);

  const handleSelectLoco = (loco: any) => {
    stopSimulation();
    setSelectedLoco(loco);
    
    // Scale max speed limit based on model classes
    let limit = 80;
    if (loco.model === 'WAP7') limit = 130;
    else if (loco.model === 'WAP5') limit = 110;
    else if (loco.model === 'WAG9') limit = 100;
    else if (loco.model === 'WAG7') limit = 85;
    else if (loco.model === 'WDM') limit = 90;
    else if (loco.model === 'WDG') limit = 75;
    setMaxAllowedSpeed(limit);

    // Initial state based on locomotive stats
    setGpsStatus(loco.gpsStatus);
    setRfStatus(loco.rfStatus);
    setRfidStatus(loco.kavachStatus);

    // Speed setting
    const startSpeed = loco.status === 'Critical' ? 0 : Math.round(limit * 0.7);
    setSpeed(startSpeed);

    // Reset alarms
    setCollisionRisk(false);
    setOverspeedWarning(false);
    setSpadWarning(false);
    setBrakeStatus('Released');
    setBrakePressure(5.0);
    setSignalAspect('Green');
    setTrackProgress(0);
    setLastBeaconScanned('None');

    if (loco.status === 'Critical') {
      setHealthIndicator('Red');
      setProtectionStatus('CRITICAL FAULT DETECTED');
    } else if (loco.status === 'Maintenance Soon') {
      setHealthIndicator('Yellow');
      setProtectionStatus('RESTRICTED SPEED ENFORCED');
    } else {
      setHealthIndicator('Green');
      setProtectionStatus('ACTIVE - RUNNING');
    }
    setActiveScenario('nominal');
  };

  // Run live progression coordinates and Kavach signal/beacon triggers
  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (speed > 0) {
        setTrackProgress(prev => {
          const next = (prev + (speed / 200)) % 100;
          
          // Check RFID Beacon crossings
          // Beacons at 25% (Beacon #1), 50% (Beacon #2), 75% (Beacon #3)
          if (next >= 24 && next <= 26) {
            setLastBeaconScanned('RFID-BEACON-01 (Ch. 25.31)');
          } else if (next >= 49 && next <= 51) {
            setLastBeaconScanned('RFID-BEACON-02 (Ch. 25.32)');
          } else if (next >= 74 && next <= 76) {
            setLastBeaconScanned('RFID-BEACON-03 (Ch. 25.33)');
          }

          // KAVACH INTEGRATED SIGNAL ENFORCEMENT
          if (signalAspect === 'Red') {
            // SPAD warning as train approaches signal post at 85%
            if (next >= 60 && next < 75) {
              setSpadWarning(true);
              setProtectionStatus('WARNING: RED SIGNAL AHEAD (SPAD)');
              setHealthIndicator('Red');
            }
            // Automatic emergency brake intervention if not already triggered
            if (next >= 75 && next < 85 && brakeStatus !== 'Emergency Braking') {
              setBrakeStatus('Emergency Braking');
              setBrakePressure(0.0);
              setProtectionStatus('KAVACH AUTOMATIC EMERGENCY SPAD ARREST');
              setHealthIndicator('Red');
              // Halt train dynamically
              stopSimulation();
              timerRef.current = setInterval(() => {
                setSpeed(s => {
                  const val = s - 25;
                  if (val <= 0) {
                    stopSimulation();
                    setSpadWarning(false);
                    setProtectionStatus('SAFE - EMERGENCY ARREST COMPLETE');
                    return 0;
                  }
                  return val;
                });
              }, 300);
            }
          } else if (signalAspect === 'Yellow') {
            // Restricted speed zone limit (30 km/h) approaching signal post
            if (next >= 60 && next < 85) {
              const restrictedLimit = 30;
              if (speed > restrictedLimit) {
                setOverspeedWarning(true);
                setBrakeStatus('Service Brake');
                setBrakePressure(3.8);
                setProtectionStatus('RESTRICTED SPEED: YELLOW SIGNAL');
                setHealthIndicator('Yellow');
                // Apply service brake deceleration
                setSpeed(s => Math.max(s - 8, restrictedLimit));
              } else {
                setOverspeedWarning(false);
                setBrakeStatus('Released');
                setBrakePressure(5.0);
                setProtectionStatus('RESTRICTED CRUISE (30 KM/H)');
                setHealthIndicator('Yellow');
              }
            }
          }

          return next;
        });
      }
    }, 100);
    return () => clearInterval(progressInterval);
  }, [speed, signalAspect, brakeStatus, maxAllowedSpeed, selectedLoco]);

  // Stop simulation loop
  const stopSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset to default
  const resetCab = () => {
    stopSimulation();
    const limit = maxAllowedSpeed;
    setSpeed(selectedLoco?.status === 'Critical' ? 0 : Math.round(limit * 0.7));
    setSignalAspect('Green');
    setBrakeStatus('Released');
    setBrakePressure(5.0);
    setCollisionRisk(false);
    setOverspeedWarning(false);
    setSpadWarning(false);
    
    if (selectedLoco?.status === 'Critical') {
      setHealthIndicator('Red');
      setProtectionStatus('CRITICAL FAULT DETECTED');
    } else if (selectedLoco?.status === 'Maintenance Soon') {
      setHealthIndicator('Yellow');
      setProtectionStatus('RESTRICTED SPEED ENFORCED');
    } else {
      setHealthIndicator('Green');
      setProtectionStatus('ACTIVE - RUNNING');
    }
    setActiveScenario('nominal');
  };

  // Scenarios triggers
  const triggerNominalRun = () => {
    stopSimulation();
    setActiveScenario('nominal');
    timerRef.current = setInterval(() => {
      setSpeed(s => {
        const targetSpeed = Math.round(maxAllowedSpeed * 0.75);
        const diff = targetSpeed - s;
        if (Math.abs(diff) < 2) return targetSpeed;
        return s + (diff > 0 ? 2 : -2);
      });
    }, 500);
  };

  const triggerOverspeedRun = () => {
    stopSimulation();
    setActiveScenario('overspeed');
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick++;
      if (tick < 6) {
        // Accelerate past limit
        setSpeed(s => s + 8);
      } else if (tick === 6) {
        // Flash warning
        setOverspeedWarning(true);
        setProtectionStatus('WARNING: OVERSPEED DETECTED');
        setHealthIndicator('Yellow');
      } else if (tick === 8) {
        // Deploy automatic service brake
        setBrakeStatus('Service Brake');
        setBrakePressure(3.8);
        setProtectionStatus('KAVACH BRAKE INTERVENTION ACTIVE');
      } else if (tick > 8 && tick < 15) {
        // Slow down
        setSpeed(s => Math.max(s - 10, Math.round(maxAllowedSpeed * 0.65)));
      } else if (tick === 15) {
        // Clear alert
        setBrakeStatus('Released');
        setBrakePressure(5.0);
        setOverspeedWarning(false);
        setProtectionStatus('ACTIVE - RUNNING');
        setHealthIndicator('Green');
        stopSimulation();
      }
    }, 800);
  };

  const triggerSpadRun = () => {
    stopSimulation();
    setActiveScenario('spad');
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick++;
      if (tick < 4) {
        // Approach signal
        setSpeed(s => s + 4);
      } else if (tick === 4) {
        // Aspect changes to Red, warning flashes
        setSignalAspect('Red');
        setSpadWarning(true);
        setProtectionStatus('WARNING: RED SIGNAL AHEAD');
        setHealthIndicator('Red');
      } else if (tick === 6) {
        // Automatic Emergency braking
        setBrakeStatus('Emergency Braking');
        setBrakePressure(0.0); // complete dump
        setProtectionStatus('KAVACH AUTOMATIC EMERGENCY STOP');
      } else if (tick > 6) {
        // Rapidly stop
        setSpeed(s => {
          const next = s - 18;
          if (next <= 0) {
            setSpadWarning(false);
            setProtectionStatus('SAFE - EMERGENCY ARREST COMPLETE');
            stopSimulation();
            return 0;
          }
          return next;
        });
      }
    }, 800);
  };

  const triggerCollisionRun = () => {
    stopSimulation();
    setActiveScenario('collision');
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick++;
      if (tick === 3) {
        // Detect target track occupancy
        setCollisionRisk(true);
        setProtectionStatus('COLLISION ALARM: SAME TRACK OCCUPATION');
        setHealthIndicator('Red');
      } else if (tick === 5) {
        // Automatic Braking deployed
        setBrakeStatus('Emergency Braking');
        setBrakePressure(0.0);
      } else if (tick > 5) {
        setSpeed(s => {
          const next = s - 22;
          if (next <= 0) {
            setCollisionRisk(false);
            setProtectionStatus('SAFE - COLLISION THREAT AVERTED');
            stopSimulation();
            return 0;
          }
          return next;
        });
      }
    }, 800);
  };

  const triggerManualEmergency = () => {
    stopSimulation();
    setBrakeStatus('Emergency Braking');
    setBrakePressure(0.0);
    setProtectionStatus('MANUAL EMERGENCY BRAKING APPLIED');
    setHealthIndicator('Red');
    setActiveScenario('emergency');
    timerRef.current = setInterval(() => {
      setSpeed(s => {
        const next = s - 24;
        if (next <= 0) {
          stopSimulation();
          return 0;
        }
        return next;
      });
    }, 400);
  };

  if (isLocosLoading || !selectedLoco) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar with Selector */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Kavach Train Collision Avoidance</h2>
          <p className="text-sm text-slate-400">
            Cabinet Monitor DMI Simulator &bull; RFID Beacon and Radio-frequency safety protection logic
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Locomotive selector dropdown */}
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold font-mono">MONITOR LOCO:</span>
            <select
              value={selectedLoco.locoNo}
              onChange={(e) => {
                const found = locomotives.find(l => l.locoNo === e.target.value);
                if (found) handleSelectLoco(found);
              }}
              className="bg-transparent text-xs font-bold text-railway-gold focus:outline-none cursor-pointer"
            >
              {locomotives.map(l => (
                <option key={l._id} value={l.locoNo} className="bg-slate-950 text-white">
                  Loco #{l.locoNo} ({l.model})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-450 hidden sm:inline">Kavach Status:</span>
            <span className={`px-3 py-2 rounded-full text-xs font-bold font-mono tracking-wider shadow-sm
              ${healthIndicator === 'Green' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : healthIndicator === 'Yellow' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {protectionStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cab DMI Speedometer (2 Cols) */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/80 flex flex-col justify-between h-[450px]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Driver Machine Interface (DMI) &bull; LOCO #{selectedLoco.locoNo}
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-xs space-x-1.5 font-mono text-slate-350">
                <Wifi className={`h-4 w-4 ${rfStatus === 'Active' ? 'text-green-500' : 'text-red-500'}`} />
                <span>RF Comms: {rfStatus}</span>
              </div>
              <div className="flex items-center text-xs space-x-1.5 font-mono text-slate-350">
                <Compass className={`h-4 w-4 ${gpsStatus === 'Active' ? 'text-green-500' : 'text-red-500'}`} />
                <span>GPS Link: {gpsStatus}</span>
              </div>
            </div>
          </div>

          {/* Core dials and gauges */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-around py-6">
            {/* Speed display dial */}
            <div className="relative flex flex-col items-center justify-center h-48 w-48 border-4 border-slate-800 rounded-full bg-slate-900/60 shadow-inner">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Speed</span>
              <span className="text-4xl font-extrabold font-mono text-white mt-1">{speed}</span>
              <span className="text-slate-400 text-xs mt-1">KM/H</span>
              <div className="absolute bottom-4 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-mono">Limit: {maxAllowedSpeed} km/h</span>
              </div>
            </div>

            {/* Signal Aspect Display */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Signal aspect</span>
              <div className="w-16 bg-slate-900 border border-slate-800 rounded-full p-2 flex flex-col items-center space-y-3">
                <span className={`h-8 w-8 rounded-full shadow ${signalAspect === 'Green' ? 'bg-green-500 shadow-green-500/50' : 'bg-green-950 border border-green-900/40'}`}></span>
                <span className={`h-8 w-8 rounded-full shadow ${signalAspect === 'Yellow' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-amber-950 border border-amber-900/40'}`}></span>
                <span className={`h-8 w-8 rounded-full shadow ${signalAspect === 'Red' ? 'bg-red-500 shadow-red-500/50' : 'bg-red-950 border border-red-900/40'}`}></span>
              </div>
            </div>

            {/* Brakes Pressure Dial */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Brake cylinder pressure</span>
              <div className="text-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800 w-36">
                <div className="text-2xl font-bold font-mono text-railway-gold">{brakePressure.toFixed(1)}</div>
                <div className="text-[9px] text-slate-455 mt-1 uppercase font-semibold">kg / cm&sup2;</div>
                <span className={`text-[10px] font-bold uppercase mt-2 block
                  ${brakeStatus === 'Released' ? 'text-green-500' : brakeStatus === 'Service Brake' ? 'text-amber-500' : 'text-red-500'}`}>
                  {brakeStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>Kavach SIL-4 Certified Protection</span>
            <span>RFID Beacon Reader: {rfidStatus}</span>
          </div>
        </div>

        {/* Warning panel & Scenarios (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-railway-gold animate-bounce" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Warning Indicators</h3>
            </div>

            {/* Alarm warning cards */}
            <div className="space-y-3">
              {/* Overspeed Alert */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors
                ${overspeedWarning ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900/30 border-slate-850 text-slate-400'}`}>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-5 w-5 ${overspeedWarning ? 'animate-bounce text-amber-500' : 'text-slate-650'}`} />
                  <span className="text-xs font-semibold uppercase">Overspeed warning</span>
                </div>
                <span className="text-[10px] font-mono">{overspeedWarning ? 'ACTIVE' : 'STANDBY'}</span>
              </div>

              {/* SPAD warning */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors
                ${spadWarning ? 'bg-red-500/25 border-red-500 text-red-300' : 'bg-slate-900/30 border-slate-850 text-slate-400'}`}>
                <div className="flex items-center space-x-3">
                  <AlertOctagon className={`h-5 w-5 ${spadWarning ? 'animate-pulse text-red-500' : 'text-slate-650'}`} />
                  <span className="text-xs font-semibold uppercase">Signal Violation (SPAD)</span>
                </div>
                <span className="text-[10px] font-mono">{spadWarning ? 'ACTIVE' : 'STANDBY'}</span>
              </div>

              {/* Collision Risk warning */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors
                ${collisionRisk ? 'bg-red-650/30 border-red-500 text-red-400' : 'bg-slate-900/30 border-slate-850 text-slate-400'}`}>
                <div className="flex items-center space-x-3">
                  <Shield className={`h-5 w-5 ${collisionRisk ? 'animate-ping text-red-500' : 'text-slate-650'}`} />
                  <span className="text-xs font-semibold uppercase">Collision Risk</span>
                </div>
                <span className="text-[10px] font-mono">{collisionRisk ? 'CRITICAL' : 'STANDBY'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Simulation triggers */}
          <div className="border-t border-slate-850 pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Simulate Cab Scenarios</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerNominalRun}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all
                    ${activeScenario === 'nominal' ? 'bg-green-500/20 border-green-500/80 text-green-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  Nominal run
                </button>
                <button
                  onClick={triggerOverspeedRun}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all
                    ${activeScenario === 'overspeed' ? 'bg-amber-500/20 border-amber-550/80 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  Overspeed trip
                </button>
                <button
                  onClick={triggerSpadRun}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all
                    ${activeScenario === 'spad' ? 'bg-red-500/20 border-red-550/80 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  SPAD violation
                </button>
                <button
                  onClick={triggerCollisionRun}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all
                    ${activeScenario === 'collision' ? 'bg-red-500/20 border-red-550/80 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                >
                  Collision Risk
                </button>
              </div>
            </div>

            {/* Trackside Signal Override Control */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trackside Signal Override</h4>
              <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-850">
                <button
                  onClick={() => {
                    setSignalAspect('Green');
                    setSpadWarning(false);
                    setOverspeedWarning(false);
                    setBrakeStatus('Released');
                    setBrakePressure(5.0);
                    if (selectedLoco && selectedLoco.status !== 'Critical') {
                      setSpeed(Math.round(maxAllowedSpeed * 0.7));
                      setProtectionStatus('ACTIVE - RUNNING');
                      setHealthIndicator('Green');
                    }
                  }}
                  className={`flex flex-col items-center py-1.5 rounded-lg border transition-all
                    ${signalAspect === 'Green' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-950/20 border-transparent opacity-50 hover:opacity-85'}`}
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-green-500 shadow-md shadow-green-500/50 mb-1"></span>
                  <span className="text-[8px] font-bold text-green-400">GREEN</span>
                </button>
                <button
                  onClick={() => {
                    setSignalAspect('Yellow');
                    setSpadWarning(false);
                  }}
                  className={`flex flex-col items-center py-1.5 rounded-lg border transition-all
                    ${signalAspect === 'Yellow' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/20 border-transparent opacity-50 hover:opacity-85'}`}
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/50 mb-1"></span>
                  <span className="text-[8px] font-bold text-amber-400">YELLOW</span>
                </button>
                <button
                  onClick={() => {
                    setSignalAspect('Red');
                  }}
                  className={`flex flex-col items-center py-1.5 rounded-lg border transition-all
                    ${signalAspect === 'Red' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-950/20 border-transparent opacity-50 hover:opacity-85'}`}
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-red-500 shadow-md shadow-red-500/50 mb-1 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-red-400">RED</span>
                </button>
              </div>
            </div>

            <button
              onClick={triggerManualEmergency}
              className="w-full py-3 rounded-xl bg-red-650 hover:bg-red-700 text-white font-bold text-xs uppercase shadow border border-red-500/20 flex items-center justify-center transition-colors"
            >
              Manual Emergency Brake
            </button>
          </div>
        </div>
      </div>

      {/* Live Track Progress Visualizer */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-950/60 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-850 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-railway-gold animate-pulse" />
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">
              Live Track Progression Tracking
            </h3>
          </div>
          <div className="text-[10px] text-slate-450 font-mono">
            Active Beacon Scan: <span className="text-railway-gold font-bold">{lastBeaconScanned}</span>
          </div>
        </div>

        {/* Track Progression Line */}
        <div className="relative py-10 px-4 bg-slate-900/30 rounded-2xl border border-slate-900 overflow-hidden">
          {/* Railroad Track Visual representation */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800 rounded-full border-t border-slate-700"></div>
          {/* Ties (vertical lines on track) */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-4 flex justify-between pointer-events-none opacity-40">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className="w-[2px] h-full bg-slate-650"></span>
            ))}
          </div>

          {/* RFID Beacon Points */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 flex justify-between items-center pointer-events-none">
            {/* Beacon 1 at 25% */}
            <div className="absolute left-1/4 -translate-x-1/2 flex flex-col items-center">
              <span className={`h-2.5 w-2.5 rounded-full ${trackProgress > 24 && trackProgress < 26 ? 'bg-railway-gold shadow shadow-railway-gold animate-ping' : 'bg-slate-700'}`}></span>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">RFID-01</span>
            </div>
            {/* Beacon 2 at 50% */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className={`h-2.5 w-2.5 rounded-full ${trackProgress > 49 && trackProgress < 51 ? 'bg-railway-gold shadow shadow-railway-gold animate-ping' : 'bg-slate-700'}`}></span>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">RFID-02</span>
            </div>
            {/* Beacon 3 at 75% */}
            <div className="absolute left-3/4 -translate-x-1/2 flex flex-col items-center">
              <span className={`h-2.5 w-2.5 rounded-full ${trackProgress > 74 && trackProgress < 76 ? 'bg-railway-gold shadow shadow-railway-gold animate-ping' : 'bg-slate-700'}`}></span>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">RFID-03</span>
            </div>
          </div>

          {/* Trackside Signal Post at 85% */}
          <div className="absolute left-[85%] -translate-x-1/2 -top-1.5 flex flex-col items-center pointer-events-none">
            {/* Signal aspect light housing */}
            <div className="w-4 bg-slate-950 border border-slate-800 rounded-full p-0.5 flex flex-col items-center space-y-0.5 shadow-md">
              <span className={`h-2 w-2 rounded-full ${signalAspect === 'Red' ? 'bg-red-500 shadow-sm shadow-red-500 animate-pulse' : 'bg-slate-800'}`}></span>
              <span className={`h-2 w-2 rounded-full ${signalAspect === 'Yellow' ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-slate-800'}`}></span>
              <span className={`h-2 w-2 rounded-full ${signalAspect === 'Green' ? 'bg-green-500 shadow-sm shadow-green-500' : 'bg-slate-800'}`}></span>
            </div>
            {/* Metal Post */}
            <div className="w-[3px] h-10 bg-slate-700"></div>
            <span className="text-[8px] text-slate-500 font-mono mt-0.5">SIG-402</span>
          </div>

          {/* Train Indicator Marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-100 ease-linear flex flex-col items-center z-10"
            style={{ left: `calc(1.5rem + ${trackProgress}% * 0.94)` }}
          >
            {/* Cab representation */}
            <div className={`p-2.5 rounded-xl border shadow-lg flex items-center justify-center
              ${brakeStatus !== 'Released' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-railway-blue border-railway-blue-light/50 text-white'}`}>
              <Train className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-[9px] font-mono text-white mt-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
              Loco #{selectedLoco?.locoNo || '30201'} ({speed} km/h)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
