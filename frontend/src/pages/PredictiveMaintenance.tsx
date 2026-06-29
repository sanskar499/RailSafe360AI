import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Flame,
  Activity,
  Battery,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';

export const PredictiveMaintenance: React.FC = () => {
  // Inputs
  const [motorTemp, setMotorTemp] = useState<number>(65);
  const [brakePressure, setBrakePressure] = useState<number>(5.0);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(110);
  const [wheelRotation, setWheelRotation] = useState<number>(1000);
  const [vibration, setVibration] = useState<number>(2.0);

  // Outputs
  const [result, setResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    try {
      const data = await api.telemetry.predictive({
        motorTemp,
        brakePressure,
        batteryVoltage,
        wheelRotation,
        vibration
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate predictive diagnostic.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetInputs = () => {
    setMotorTemp(65);
    setBrakePressure(5.0);
    setBatteryVoltage(110);
    setWheelRotation(1000);
    setVibration(2.0);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header details */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Predictive AI Diagnostics</h2>
          <p className="text-sm text-slate-400">
            Simulate traction/bogie anomalies using automated classifier logic for preemptive maintenance scheduling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Input Form (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-900 pb-3">
            <Cpu className="h-5 w-5 text-railway-gold" />
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase">Telemetry Input Node</h3>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4">
            {/* Winding WAP7 Traction Temp */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-450 uppercase">
                <span>Traction Motor Winding Temp</span>
                <span className="font-mono text-white">{motorTemp} &deg;C</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                value={motorTemp}
                onChange={(e) => setMotorTemp(parseInt(e.target.value))}
                className="w-full accent-railway-gold h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>30&deg;C (Cold)</span>
                <span>120&deg;C (Overheat)</span>
              </div>
            </div>

            {/* Brake Pipe Pressure */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-450 uppercase">
                <span>Brake Pipe (BP) Pressure</span>
                <span className="font-mono text-white">{brakePressure.toFixed(1)} kg/cm&sup2;</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.1"
                value={brakePressure}
                onChange={(e) => setBrakePressure(parseFloat(e.target.value))}
                className="w-full accent-railway-gold h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>2.0 kg (Leaks)</span>
                <span>6.0 kg (Overcharge)</span>
              </div>
            </div>

            {/* Battery Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-450 uppercase">
                <span>Aux Control Battery Voltage</span>
                <span className="font-mono text-white">{batteryVoltage} V</span>
              </div>
              <input
                type="range"
                min="70"
                max="130"
                value={batteryVoltage}
                onChange={(e) => setBatteryVoltage(parseInt(e.target.value))}
                className="w-full accent-railway-gold h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>70V (Drain)</span>
                <span>130V (Surge)</span>
              </div>
            </div>

            {/* Bogie Vibration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-450 uppercase">
                <span>Bogie Vibration Amplitude</span>
                <span className="font-mono text-white">{vibration.toFixed(1)} mm/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="6.0"
                step="0.1"
                value={vibration}
                onChange={(e) => setVibration(parseFloat(e.target.value))}
                className="w-full accent-railway-gold h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>0.5 mm/s (Smooth)</span>
                <span>6.0 mm/s (Axle wear)</span>
              </div>
            </div>

            {/* Wheel Rotation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-450 uppercase">
                <span>Wheel Rotation Speed</span>
                <span className="font-mono text-white">{wheelRotation} RPM</span>
              </div>
              <input
                type="range"
                min="0"
                max="1800"
                step="50"
                value={wheelRotation}
                onChange={(e) => setWheelRotation(parseInt(e.target.value))}
                className="w-full accent-railway-gold h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>0 RPM (Stopped)</span>
                <span>1800 RPM (High speed)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetInputs}
                className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 transition-colors border border-slate-850 flex items-center justify-center"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </button>
              <button
                type="submit"
                disabled={isEvaluating}
                className="py-2.5 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white text-xs font-semibold border border-railway-blue-light/10 shadow flex items-center justify-center transition-colors"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="animate-spin mr-1.5 h-3.5 w-3.5" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5 text-railway-gold" />
                    AI Evaluate
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Diagnostic Outputs (2 Cols) */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/10 space-y-6 h-full flex flex-col justify-between">
              <div>
                {/* Status Header */}
                <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                  <div>
                    <span className="text-[10px] bg-railway-blue/20 text-railway-blue-light px-2 py-0.5 rounded font-bold font-mono">
                      DIAGNOSTIC CLASSIFIER OUTPUT
                    </span>
                    <h3 className="text-lg font-bold font-outfit mt-1 text-white">AI Evaluation Summary</h3>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase
                    ${result.status === 'Healthy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : result.status === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {result.status}
                  </span>
                </div>

                {/* Score gauge & diagnostic notes */}
                <div className="flex flex-col md:flex-row items-center md:space-x-8 py-6">
                  {/* circular gauge */}
                  <div className="relative flex flex-col items-center justify-center h-32 w-32 border-4 border-slate-800 rounded-full bg-slate-900/50 mb-6 md:mb-0">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Health Index</span>
                    <span className="text-3xl font-extrabold font-mono text-white mt-0.5">{result.healthScore}%</span>
                  </div>

                  {/* Bullet diagnostics list */}
                  <div className="space-y-3 flex-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sensor Flag Logs</h4>
                    <ul className="space-y-2">
                      {result.diagnostics.map((diag: string, idx: number) => (
                        <li key={idx} className="flex items-start text-xs text-slate-350 leading-relaxed">
                          <AlertTriangle className="h-4 w-4 mr-2 text-railway-gold flex-shrink-0 mt-0.5" />
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendation card */}
              <div className="border-t border-slate-850 pt-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-railway-gold animate-pulse" />
                  Prescriptive Recommendations
                </h4>
                <div className="p-4 bg-slate-950/70 border border-slate-900 rounded-2xl text-xs text-slate-300 leading-relaxed">
                  {result.recommendation}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl py-32 text-center text-slate-500 border border-slate-800/40 text-xs h-full flex items-center justify-center">
              Adjust telemetry values in the left panel and click 'AI Evaluate' to compile recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
