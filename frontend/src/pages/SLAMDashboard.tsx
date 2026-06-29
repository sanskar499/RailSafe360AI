import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  Compass,
  Cpu,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

export const SLAMDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);

  const fetchShedData = async () => {
    try {
      const data = await api.telemetry.getSLAM();
      setTelemetry(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShedData();
    const interval = setInterval(fetchShedData, 200); // 5 Hz polling for smooth pathing coordinates
    return () => clearInterval(interval);
  }, []);

  // Draw simulated SLAM mapping on canvas
  useEffect(() => {
    if (!telemetry || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Workshop bays outline
    telemetry.bays.forEach((bay: any) => {
      ctx.fillStyle = 'rgba(7, 42, 67, 0.15)';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(bay.x, bay.y, bay.w, bay.h);
      ctx.fill();
      ctx.stroke();

      // Label track
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(bay.name.toUpperCase(), bay.x + 10, bay.y + 20);
      ctx.fillText(`RAIL TRACK: ${bay.track}`, bay.x + 10, bay.y + 40);
    });

    // Draw Static Obstacles
    telemetry.obstacles.forEach((obs: any) => {
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.r, 0, 2 * Math.PI);
      if (obs.active) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.strokeStyle = '#ef4444';
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.strokeStyle = '#475569';
      }
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Label obstacle
      ctx.fillStyle = obs.active ? '#fca5a5' : '#94a3b8';
      ctx.font = '7px sans-serif';
      ctx.fillText(obs.name, obs.x - 25, obs.y + obs.r + 10);
    });

    // Draw Robot Lidar Sweep Scan
    const rx = telemetry.robot.x;
    const ry = telemetry.robot.y;
    const range = telemetry.robot.sensorRange;
    const time = Date.now();

    ctx.strokeStyle = 'rgba(217, 179, 16, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rx, ry, range, 0, 2 * Math.PI);
    ctx.stroke();

    // Radar sweep line animation
    const angle = (time / 1000) % (2 * Math.PI);
    ctx.strokeStyle = 'rgba(217, 179, 16, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(angle) * range, ry + Math.sin(angle) * range);
    ctx.stroke();

    // Lidar ray intersections with active obstacles
    telemetry.obstacles.forEach((obs: any) => {
      const dx = obs.x - rx;
      const dy = obs.y - ry;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If within sweep range, draw point detection line
      if (distance < range) {
        ctx.strokeStyle = obs.active ? 'rgba(239, 68, 68, 0.6)' : 'rgba(50, 140, 193, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(obs.x, obs.y);
        ctx.stroke();
      }
    });

    // Draw Robot marker
    ctx.fillStyle = '#D9B310';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rx, ry, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw Heading arrow
    const rad = (telemetry.robot.heading * Math.PI) / 180;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(rad) * 14, ry + Math.sin(rad) * 14);
    ctx.stroke();

  }, [telemetry]);

  if (isLoading || !telemetry) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header details */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">Shed Indoor SLAM Mapping</h2>
          <p className="text-sm text-slate-400">
            Simultaneous Localization and Mapping &bull; Autonomous inspection robot sweeps ELS Jamalpur
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <HelpCircle className="mr-2 h-4 w-4 text-railway-gold" />
            {showExplanation ? 'Hide SLAM Info' : 'Show SLAM Info'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Visualizer (2 Cols) */}
        <div className="lg:col-span-2 h-[560px] glass-card rounded-3xl p-4 border border-slate-800/40 bg-slate-950 flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono border-b border-slate-900 pb-2">
            <span>MAP VIEW: MAIN WORKSHOP FLOORPLAN</span>
            <span className="text-railway-gold">LIDAR: 10 Hz &bull; ACTIVE RESOLUTION: 2 CM</span>
          </div>

          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-950/80 rounded-2xl border border-slate-900 mt-2">
            <canvas
              ref={canvasRef}
              width={750}
              height={440}
              className="max-w-full max-h-full block rounded-xl"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3 border-t border-slate-900 pt-2">
            <span>Grid cell size: 40px (1.5m equivalent)</span>
            <span className="flex items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-railway-gold mr-1.5"></span> Inspection Rover-1
            </span>
          </div>
        </div>

        {/* Rover telemetry logs (1 Col) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-railway-gold animate-pulse" />
              <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase">SLAM Core Telemetry</h3>
            </div>

            {/* Diagnostics details */}
            <div className="space-y-3.5 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-900 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Robot Status:</span>
                <span className={`font-bold ${telemetry.robot.status.includes('Avoidance') ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>
                  {telemetry.robot.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. Coordinates:</span>
                <span className="text-white font-bold">X: {telemetry.robot.x} cm, Y: {telemetry.robot.y} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Heading Angle:</span>
                <span className="text-white font-bold">{telemetry.robot.heading}&deg;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IMU Confidence:</span>
                <span className="text-green-400 font-bold">{telemetry.sensors.imuConfidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SLAM Status:</span>
                <span className="text-emerald-500 font-bold">{telemetry.sensors.slamStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Features Detected:</span>
                <span className="text-railway-gold font-bold">{telemetry.sensors.keypointsDetected} points</span>
              </div>
            </div>
          </div>

          {/* Legend instructions */}
          <div className="space-y-3 text-xs border-t border-slate-800/80 pt-4">
            <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Map Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="h-3 w-3 bg-slate-800 border border-slate-700 rounded mr-2 flex-shrink-0"></span>
                <span className="text-slate-400">Maintenance & Inspection Bay Area</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-slate-700 mr-2 flex-shrink-0"></span>
                <span className="text-slate-400">Static Obstacle (Lathe crossings, pillars)</span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500 mr-2 flex-shrink-0"></span>
                <span className="text-slate-450">Active Obstacle (Safety threat alert)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation text section */}
      {showExplanation && (
        <div className="glass-card rounded-3xl p-6 border border-slate-800/40 space-y-4">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-railway-gold" />
            <h3 className="font-semibold text-sm tracking-wide font-outfit uppercase text-white">
              Why SLAM is useful inside Locomotive Sheds
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-350 leading-relaxed">
            <div className="space-y-3">
              <p>
                <strong>1. Autonomous Inspection of Undercarriages:</strong> Electric locomotives have critical bogie gears, traction cables, and air brakes underneath the chassis. Autonomous rovers equipped with SLAM scan pits under tracks, registering wear patterns, gas leaks, or loose pins without requiring personnel to crawl beneath high-voltage assemblies.
              </p>
              <p>
                <strong>2. Dynamic Obstacle Navigation:</strong> Unlike structured warehouses, loco sheds are active industrial environments. Cranes transport heavy components, workers relocate tool carts, and locomotives enter bays. SLAM enables navigation systems to map obstacles on-the-fly and plan paths around them.
              </p>
            </div>
            <div className="space-y-3">
              <p>
                <strong>3. Mapping track assets:</strong> Locomotives are large metallic targets. When parked in bays, they act as temporary structural obstacles. SLAM allows autonomous guided vehicles (AGVs) carrying bogies or traction components to update their map representations automatically, localizing bays that are occupied or open.
              </p>
              <p>
                <strong>4. High-Precision Indoor Positioning:</strong> Metal roofs, massive steel gantries, and transformer coils create high magnetic interference and shield satellite signals, rendering GPS completely unusable inside loco sheds. SLAM combined with LiDAR and IMU sensors provides precise millimeter-level localization.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
