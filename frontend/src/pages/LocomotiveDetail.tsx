import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Line } from 'react-chartjs-2';
import {
  Train,
  ArrowLeft,
  Activity,
  Battery,
  Shield,
  Radio,
  FileCheck,
  RefreshCw,
  Plus,
  Sliders,
  History
} from 'lucide-react';

export const LocomotiveDetail: React.FC = () => {
  const { idOrNo } = useParams<{ idOrNo: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loco, setLoco] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Slider inputs for interactive telemetry tuning
  const [healthSlider, setHealthSlider] = useState(100);
  const [batterySlider, setBatterySlider] = useState(100);
  const [brakeSlider, setBrakeSlider] = useState(100);
  const [motorSlider, setMotorSlider] = useState(100);
  const [gpsSlider, setGpsSlider] = useState('Active');
  const [rfSlider, setRfSlider] = useState('Active');
  const [kavachSlider, setKavachSlider] = useState('Active');

  const [isUpdating, setIsUpdating] = useState(false);

  // Mobile Scan Simulator modal states
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [motorCheck, setMotorCheck] = useState(true);
  const [brakeCheck, setBrakeCheck] = useState(true);
  const [kavachCheck, setKavachCheck] = useState(true);
  const [inspectionRemarks, setInspectionRemarks] = useState('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  const fetchLocoDetails = async () => {
    try {
      setIsLoading(true);
      const data = await api.locomotives.getOne(idOrNo || '');
      setLoco(data);

      setHealthSlider(data.health);
      setBatterySlider(data.battery);
      setBrakeSlider(data.brake);
      setMotorSlider(data.tractionMotor);
      setGpsSlider(data.gpsStatus);
      setRfSlider(data.rfStatus);
      setKavachSlider(data.kavachStatus);

      const alertData = await api.locomotives.getAlerts(data.locoNo);
      setAlerts(alertData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocoDetails();
  }, [idOrNo]);

  const handleUpdateTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loco) return;
    setIsUpdating(true);
    try {
      const updated = await api.locomotives.updateMetrics(loco._id, {
        health: healthSlider,
        battery: batterySlider,
        brake: brakeSlider,
        tractionMotor: motorSlider,
        gpsStatus: gpsSlider,
        rfStatus: rfSlider,
        kavachStatus: kavachSlider
      });
      setLoco(updated);
      
      // Refresh alert logs
      const alertData = await api.locomotives.getAlerts(loco.locoNo);
      setAlerts(alertData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loco) return;
    setIsSubmittingAudit(true);
    try {
      const summaryNotes = `Mobile Audit Scan: Motor Winding=${motorCheck ? 'PASS' : 'FAIL'}, Brakes Cylinder=${brakeCheck ? 'PASS' : 'FAIL'}, Kavach Sync=${kavachCheck ? 'PASS' : 'FAIL'}. ${inspectionRemarks}`;
      const updated = await api.locomotives.addHistory(loco._id, {
        type: 'Mobile Audit',
        remarks: summaryNotes,
        technician: user?.name || 'Mobile Inspector'
      });
      setLoco(updated);
      
      // Reset form
      setInspectionRemarks('');
      setMotorCheck(true);
      setBrakeCheck(true);
      setKavachCheck(true);
      setIsScanModalOpen(false);
    } catch (err) {
      console.error('Error submitting mobile audit:', err);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  if (isLoading || !loco) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  // QR code url
  const qrUrl = `${window.location.origin}/locomotives/${loco.locoNo}`;

  // Chart telemetry mock data representing historical speed or pressure
  const motorTempHistory = {
    labels: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    datasets: [
      {
        label: 'Traction Motor Temp (°C)',
        data: [54, 58, 62, 70, 78, 68, 60, 58, 55],
        borderColor: '#fad126',
        backgroundColor: 'rgba(250, 209, 38, 0.05)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Return Navigation */}
      <button
        onClick={() => navigate('/locomotives')}
        className="flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Return to Fleet Registry
      </button>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Info & QR (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                {loco.model}
              </span>
              <h2 className="text-2xl font-bold font-mono mt-1 text-white">Loco #{loco.locoNo}</h2>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold
              ${loco.status === 'Healthy' ? 'bg-green-500/15 text-green-400' : loco.status === 'Critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {loco.status}
            </span>
          </div>

          <div className="space-y-3 text-xs border-t border-slate-800/80 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Driver</span>
              <span className="font-semibold text-slate-200">{loco.driver}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Commission Year</span>
              <span className="font-semibold text-slate-200 font-mono">{loco.manufacturingYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Primary Loco Shed</span>
              <span className="font-semibold text-slate-200">{loco.currentShed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Servicing Status</span>
              <span className="font-semibold text-railway-gold font-mono">{loco.maintenanceStatus}</span>
            </div>
          </div>

          {/* QR Code Container */}
          <div 
            onClick={() => setIsScanModalOpen(true)}
            className="border-t border-slate-800/80 pt-6 flex flex-col items-center text-center space-y-3 cursor-pointer group"
          >
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-railway-gold transition-colors font-mono">
              Loco ID QR Beacon
            </h4>
            <div className="p-3 bg-white rounded-2xl shadow-xl transition-transform group-hover:scale-105 duration-200 border-2 border-transparent group-hover:border-railway-gold">
              <QRCodeSVG value={qrUrl} size={130} />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsScanModalOpen(true);
              }}
              className="text-[10px] text-railway-gold font-bold hover:text-railway-gold-light underline focus:outline-none"
            >
              Simulate Mobile QR Scan
            </button>
            <p className="text-[10px] text-slate-500 leading-snug">
              Scan from mobile or click above to retrieve inspection sheets and log active telemetry immediately.
            </p>
          </div>
        </div>

        {/* Live Gauges & Graph (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-slate-800/40 text-center">
              <Activity className="mx-auto h-5 w-5 text-emerald-500 mb-2" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Motor Temp</div>
              <div className="text-lg font-bold font-mono text-white mt-1">{loco.tractionMotor}°C</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800/40 text-center">
              <Battery className="mx-auto h-5 w-5 text-blue-500 mb-2" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Aux Battery</div>
              <div className="text-lg font-bold font-mono text-white mt-1">{loco.battery}%</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800/40 text-center">
              <Shield className="mx-auto h-5 w-5 text-amber-500 mb-2" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Brakes Wear</div>
              <div className="text-lg font-bold font-mono text-white mt-1">{loco.brake}%</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-slate-800/40 text-center">
              <Radio className="mx-auto h-5 w-5 text-indigo-500 mb-2" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Kavach Link</div>
              <div className="text-lg font-bold font-mono text-white mt-1 uppercase">{loco.kavachStatus}</div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800/40 bg-slate-900/20">
            <h3 className="font-semibold text-xs tracking-wide font-outfit uppercase mb-4 text-slate-400">
              Historical Bogie Temperature Graph (Winding TM-1)
            </h3>
            <div className="h-60">
              <Line
                data={motorTempHistory}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af', font: { size: 9 } } },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 9 } } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sliders for Simulation & Log Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Telemetry Tune (Admin/Technician/Inspector only) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40">
          <div className="flex items-center space-x-2 mb-5">
            <Sliders className="h-5 w-5 text-railway-gold" />
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Telemetry Controller</h3>
          </div>

          {(user?.role === 'Admin' || user?.role === 'Maintenance Technician' || user?.role === 'Inspector') ? (
            <form onSubmit={handleUpdateTelemetry} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>General Health</span>
                  <span className="font-mono text-railway-gold">{healthSlider}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={healthSlider}
                  onChange={(e) => setHealthSlider(parseInt(e.target.value))}
                  className="w-full accent-railway-gold h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Motor Health</span>
                  <span className="font-mono text-railway-gold">{motorSlider}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={motorSlider}
                  onChange={(e) => setMotorSlider(parseInt(e.target.value))}
                  className="w-full accent-railway-gold h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Brake Pipe integrity</span>
                  <span className="font-mono text-railway-gold">{brakeSlider}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brakeSlider}
                  onChange={(e) => setBrakeSlider(parseInt(e.target.value))}
                  className="w-full accent-railway-gold h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Battery Charge</span>
                  <span className="font-mono text-railway-gold">{batterySlider}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={batterySlider}
                  onChange={(e) => setBatterySlider(parseInt(e.target.value))}
                  className="w-full accent-railway-gold h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Kavach Link</label>
                  <select
                    value={kavachSlider}
                    onChange={(e) => setKavachSlider(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs focus:outline-none text-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">RF Link</label>
                  <select
                    value={rfSlider}
                    onChange={(e) => setRfSlider(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs focus:outline-none text-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-colors flex items-center justify-center text-white"
              >
                {isUpdating ? 'Transmitting...' : 'Transmit Telemetry'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-550 leading-relaxed py-6 text-center">
              Write permission denied. Telemetry tuning is locked to Admin, Inspector, or Maintenance Technician roles.
            </p>
          )}
        </div>

        {/* Maintenance Log History (2 Cols) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-railway-gold" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">Locomotive Service History</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Archive Logs</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {loco.history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No historical maintenance services recorded for this locomotive unit.
              </div>
            ) : (
              loco.history.map((h: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-450">
                    <span className="bg-slate-850 border border-slate-750 px-2 py-0.5 rounded text-slate-300 font-bold">{h.type}</span>
                    <span>{h.date}</span>
                  </div>
                  <p className="text-xs text-slate-300">{h.remarks}</p>
                  <div className="text-[10px] text-railway-gold font-semibold">Assigned Tech: {h.technician}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simulated Mobile Handset Scan Modal Overlay */}
      {isScanModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col h-[580px] text-slate-100">
            {/* Phone header mockup */}
            <div className="bg-slate-950 px-4 py-3 flex justify-between items-center border-b border-slate-850">
              <div className="flex items-center space-x-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
                <span className="text-[9px] text-slate-400 font-bold font-mono tracking-wider">LIVE MOBILE INSPECTOR</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono font-semibold">5G 📶 94% 🔋</span>
            </div>

            {/* Phone body content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="text-center space-y-1">
                <div className="text-[9px] font-bold text-railway-gold uppercase font-mono tracking-widest">Inspection Audit Sheet</div>
                <h3 className="text-lg font-bold text-white font-mono">Locomotive #{loco.locoNo}</h3>
                <p className="text-[9px] text-slate-400 uppercase font-mono">{loco.model} &bull; ELS JAMALPUR</p>
              </div>

              {/* Status parameters */}
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-850 space-y-2 text-[11px] font-mono">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">GENERAL HEALTH:</span>
                  <span className={`font-bold ${loco.health >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{loco.health}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">MOTOR TEMP:</span>
                  <span className="text-slate-350">{loco.tractionMotor}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">BRAKES PIPE PRESSURE:</span>
                  <span className="text-slate-350">{loco.brake}% integrity</span>
                </div>
              </div>

              {/* Checklist form */}
              <form onSubmit={handleSubmitAudit} className="space-y-4 pt-1">
                <div className="space-y-2.5">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Visual & Sensor Inspections</h4>
                  
                  {/* Motor check */}
                  <div className="flex items-center justify-between bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/80">
                    <span className="text-xs text-slate-300 font-semibold">Traction Motor Winding Check</span>
                    <button
                      type="button"
                      onClick={() => setMotorCheck(!motorCheck)}
                      className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase transition-all border
                        ${motorCheck ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                    >
                      {motorCheck ? 'PASS' : 'FAIL'}
                    </button>
                  </div>

                  {/* Brake check */}
                  <div className="flex items-center justify-between bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/80">
                    <span className="text-xs text-slate-300 font-semibold">Brake Cylinder Leakage Test</span>
                    <button
                      type="button"
                      onClick={() => setBrakeCheck(!brakeCheck)}
                      className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase transition-all border
                        ${brakeCheck ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                    >
                      {brakeCheck ? 'PASS' : 'FAIL'}
                    </button>
                  </div>

                  {/* Kavach beacon check */}
                  <div className="flex items-center justify-between bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/80">
                    <span className="text-xs text-slate-300 font-semibold">Kavach RF Link Signal Sync</span>
                    <button
                      type="button"
                      onClick={() => setKavachCheck(!kavachCheck)}
                      className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase transition-all border
                        ${kavachCheck ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                    >
                      {kavachCheck ? 'PASS' : 'FAIL'}
                    </button>
                  </div>
                </div>

                {/* Remarks field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Field Inspection Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter audit logs, physical defects, or maintenance notes..."
                    value={inspectionRemarks}
                    onChange={(e) => setInspectionRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs focus:outline-none text-slate-200 placeholder-slate-650 resize-none font-sans"
                  ></textarea>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsScanModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAudit}
                    className="flex-1 py-2.5 bg-railway-blue hover:bg-railway-blue-light text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    {isSubmittingAudit ? 'Submitting...' : 'Submit Audit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
