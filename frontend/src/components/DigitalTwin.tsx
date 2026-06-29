import React from 'react';

interface ComponentTelemetry {
  name: string;
  health: number;
  temp: number;
  rul: number;
  status: string;
}

interface DigitalTwinProps {
  telemetry: {
    tractionMotor: ComponentTelemetry;
    transformer: ComponentTelemetry;
    battery: ComponentTelemetry;
    brakes: ComponentTelemetry;
    gps: ComponentTelemetry;
    rf: ComponentTelemetry;
    kavach: ComponentTelemetry;
  };
  selectedComponent: string | null;
  onSelectComponent: (name: string) => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  telemetry,
  selectedComponent,
  onSelectComponent
}) => {
  // Utility to determine color style objects based on health value
  const getComponentStyle = (health: number, isActive: boolean) => {
    let strokeColor = '#22c55e'; // green-500
    let fillColor = 'rgba(34, 197, 94, 0.08)';
    
    if (isActive) {
      strokeColor = '#D9B310'; // railway-gold
      fillColor = 'rgba(217, 179, 16, 0.2)';
    } else if (health < 60) {
      strokeColor = '#ef4444'; // red-500
      fillColor = 'rgba(239, 68, 68, 0.12)';
    } else if (health < 85) {
      strokeColor = '#f59e0b'; // amber-500
      fillColor = 'rgba(245, 158, 11, 0.1)';
    }

    return {
      stroke: strokeColor,
      fill: fillColor,
      strokeWidth: isActive ? '2.5' : '1.5',
      transition: 'all 0.3s ease',
      filter: isActive ? 'drop-shadow(0 0 6px rgba(217, 179, 16, 0.5))' : 'none'
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-3xl border border-slate-900 relative overflow-hidden w-full">
      <div className="absolute top-3 left-4 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
        <span>INTELLIGENT DIGITAL TWIN CAD V3.01 (WAP7 SHED BLUEPRINT)</span>
      </div>

      <div className="w-full py-6">
        <svg
          viewBox="0 0 800 300"
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="300" fill="url(#grid)" rx="16" />

          {/* Catenary overhead line */}
          <line x1="0" y1="20" x2="800" y2="20" stroke="#334155" strokeWidth="1.5" strokeDasharray="5,5" />

          {/* Tracks */}
          <line x1="0" y1="280" x2="800" y2="280" stroke="#475569" strokeWidth="6" />
          <line x1="0" y1="284" x2="800" y2="284" stroke="#1e293b" strokeWidth="2" />
          {/* Ties */}
          {Array.from({ length: 20 }).map((_, i) => (
            <line
              key={i}
              x1={20 + i * 40}
              y1="280"
              x2={20 + i * 40}
              y2="295"
              stroke="#334155"
              strokeWidth="4"
            />
          ))}

          {/* Locomotive Body Shell */}
          <rect
            x="80"
            y="70"
            width="640"
            height="160"
            rx="12"
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Driver Cab Windows */}
          {/* Cab 1 */}
          <path d="M 85,110 L 105,75 L 140,75 L 140,110 Z" fill="#172554" stroke="#334155" strokeWidth="1" />
          <circle cx="112" cy="92" r="5" fill="rgba(255,255,255,0.1)" stroke="#475569" strokeWidth="0.5" />
          {/* Cab 2 */}
          <path d="M 715,110 L 695,75 L 660,75 L 660,110 Z" fill="#172554" stroke="#334155" strokeWidth="1" />
          <circle cx="688" cy="92" r="5" fill="rgba(255,255,255,0.1)" stroke="#475569" strokeWidth="0.5" />

          {/* Roof Pantographs */}
          {/* Pantograph 1 */}
          <path
            d="M 180,70 L 210,35 L 250,35 L 220,70"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="205" y1="35" x2="255" y2="35" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="220" y1="70" x2="220" y2="20" stroke="rgba(217,179,16,0.3)" strokeWidth="1" strokeDasharray="3,3" />

          {/* Pantograph 2 */}
          <path
            d="M 620,70 L 590,35 L 550,35 L 580,70"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="585" y1="35" x2="545" y2="35" stroke="#ef4444" strokeWidth="2.5" />

          {/* Bogie Assemblies (Wheels casing) */}
          {/* Bogie 1 */}
          <rect x="120" y="225" width="180" height="30" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          {/* Bogie 2 */}
          <rect x="500" y="225" width="180" height="30" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />

          {/* Wheel structures */}
          {/* Bogie 1 wheels */}
          <circle cx="150" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="150" cy="255" r="8" fill="#64748b" />
          <circle cx="210" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="210" cy="255" r="8" fill="#64748b" />
          <circle cx="270" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="270" cy="255" r="8" fill="#64748b" />
          
          {/* Bogie 2 wheels */}
          <circle cx="530" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="530" cy="255" r="8" fill="#64748b" />
          <circle cx="590" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="590" cy="255" r="8" fill="#64748b" />
          <circle cx="650" cy="255" r="22" fill="#020617" stroke="#475569" strokeWidth="2" />
          <circle cx="650" cy="255" r="8" fill="#64748b" />

          {/* INTERACTIVE COMPONENT LAYER */}

          {/* 1. Main Transformer (Central core underbelly) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('transformer')}
          >
            <rect
              x="340"
              y="110"
              width="120"
              height="80"
              rx="8"
              style={getComponentStyle(telemetry.transformer.health, selectedComponent === 'transformer')}
            />
            <text x="400" y="150" textAnchor="middle" fill="#f8fafc" className="font-mono text-[9px] font-bold pointer-events-none uppercase">
              Transformer
            </text>
            <text x="400" y="165" textAnchor="middle" fill="#94a3b8" className="font-mono text-[8px] pointer-events-none">
              {telemetry.transformer.health}% Health
            </text>
          </g>

          {/* 2. Traction Motor (Axles area bogie 1) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('tractionMotor')}
          >
            <path
              d="M 130,205 L 290,205 L 290,225 L 130,225 Z"
              style={getComponentStyle(telemetry.tractionMotor.health, selectedComponent === 'tractionMotor')}
            />
            <text x="210" y="217" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[8px] font-bold pointer-events-none uppercase">
              Traction Motor
            </text>
          </g>

          {/* 3. Auxiliary Battery Bank */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('battery')}
          >
            <rect
              x="330"
              y="200"
              width="140"
              height="20"
              rx="4"
              style={getComponentStyle(telemetry.battery.health, selectedComponent === 'battery')}
            />
            <text x="400" y="213" textAnchor="middle" fill="#f1f5f9" className="font-mono text-[8px] font-bold pointer-events-none uppercase">
              Battery Bank
            </text>
          </g>

          {/* 4. Air Brakes System (Bogie 2 brake pads cover) */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('brakes')}
          >
            <path
              d="M 510,205 L 670,205 L 670,225 L 510,225 Z"
              style={getComponentStyle(telemetry.brakes.health, selectedComponent === 'brakes')}
            />
            <text x="590" y="217" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[8px] font-bold pointer-events-none uppercase">
              Brake Cylinder
            </text>
          </g>

          {/* 5. GPS Antenna receiver */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('gps')}
          >
            <polygon
              points="160,70 180,70 170,55"
              style={getComponentStyle(telemetry.gps.health, selectedComponent === 'gps')}
            />
            <text x="170" y="50" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[7px] font-bold pointer-events-none uppercase">
              GPS
            </text>
          </g>

          {/* 6. RF Transceiver antenna */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('rf')}
          >
            <polygon
              points="300,70 320,70 310,55"
              style={getComponentStyle(telemetry.rf.health, selectedComponent === 'rf')}
            />
            <text x="310" y="50" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[7px] font-bold pointer-events-none uppercase">
              RF
            </text>
          </g>

          {/* 7. Kavach Transponder beacon */}
          <g
            className="cursor-pointer group"
            onClick={() => onSelectComponent('kavach')}
          >
            <rect
              x="210"
              y="110"
              width="100"
              height="35"
              rx="4"
              style={getComponentStyle(telemetry.kavach.health, selectedComponent === 'kavach')}
            />
            <text x="260" y="130" textAnchor="middle" fill="#f8fafc" className="font-mono text-[8px] font-bold pointer-events-none uppercase">
              Kavach DMI
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-900 w-full">
        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span> {'>'}=85% HEALTH</span>
        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span> 60-84% HEALTH</span>
        <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-red-500 mr-1.5 animate-pulse"></span> {'<'}=59% HEALTH</span>
        <span className="flex items-center"><span className="h-2.5 w-2.5 border border-railway-gold bg-railway-gold/20 mr-1.5 animate-ping"></span> ACTIVE SELECTION</span>
      </div>
    </div>
  );
};
