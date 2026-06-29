import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Navigation,
  Radio,
  RefreshCw,
  Signal,
  MapPin,
  TrendingUp
} from 'lucide-react';

// Reset marker icon path overrides to avoid asset packaging issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Helper to create futuristic animated markers
const createCustomMarker = (color: string, isPulsing = true) => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        ${isPulsing ? `<span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-${color}-400 opacity-60"></span>` : ''}
        <span class="relative inline-flex rounded-full h-4 w-4 bg-${color}-600 border-2 border-white shadow-md"></span>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to dynamically adjust map view based on active tracking
const RecenterMap: React.FC<{ coords: [number, number] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
};

export const RTISMap: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [selectedLoco, setSelectedLoco] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [centerCoords, setCenterCoords] = useState<[number, number]>([25.3134, 86.4952]); // ELS Jamalpur coords default

  const fetchTelemetry = async (initial = false) => {
    try {
      if (initial) setIsLoading(true);
      const data = await api.telemetry.getRTIS();
      setTelemetry(data);

      if (data.length > 0) {
        // Keep selected locomotive updated
        if (selectedLoco) {
          const updated = data.find((t: any) => t.locoNo === selectedLoco.locoNo);
          if (updated) setSelectedLoco(updated);
        } else {
          // Default to first active train
          setSelectedLoco(data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching RTIS telemetry:', e);
    } finally {
      if (initial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(true);
    const interval = setInterval(() => fetchTelemetry(false), 5000); // Poll telemetry every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSelectTrain = (train: any) => {
    setSelectedLoco(train);
    setCenterCoords([train.lat, train.lng]);
  };

  if (isLoading || !selectedLoco) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-railway-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-outfit">RTIS Live Train Telemetry</h2>
          <p className="text-sm text-slate-400">
            Real Time Information System &bull; Live GPS tracking of ELS Jamalpur locomotives
          </p>
        </div>
        <div className="text-xs bg-slate-800 text-railway-gold font-mono px-3 py-1.5 rounded-full flex items-center">
          <Radio className="mr-1.5 h-3.5 w-3.5 animate-pulse" /> RTIS Network Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Trains List (1 Col) */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800/40 space-y-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-400">Active Locomotives</h3>
          <div className="space-y-3">
            {telemetry.map((t) => (
              <div
                key={t.locoNo}
                onClick={() => handleSelectTrain(t)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start
                  ${selectedLoco.locoNo === t.locoNo
                    ? 'bg-railway-blue/30 border-railway-gold/50 shadow'
                    : 'bg-slate-900/45 border-slate-850 hover:border-slate-700'}`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Loco #{t.locoNo}
                  </span>
                  <div className="text-xs font-semibold mt-1 text-slate-200 truncate max-w-[120px]">{t.nextStation}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Speed: {t.speed} km/h</div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`h-2.5 w-2.5 rounded-full shadow-sm
                    ${t.signalAspect === 'Green' ? 'bg-green-500' : t.signalAspect === 'Red' ? 'bg-red-500' : 'bg-amber-500'}`}
                  ></span>
                  <span className="text-[9px] text-slate-450 font-mono">{t.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 h-[600px] rounded-3xl overflow-hidden relative border border-slate-800/60 shadow-2xl">
          <MapContainer center={centerCoords} zoom={7} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {telemetry.map((t) => {
              const markerColor = t.signalAspect === 'Green' ? 'emerald' : t.signalAspect === 'Red' ? 'red' : 'amber';
              return (
                <Marker
                  key={t.locoNo}
                  position={[t.lat, t.lng]}
                  icon={createCustomMarker(markerColor, selectedLoco.locoNo === t.locoNo)}
                  eventHandlers={{
                    click: () => handleSelectTrain(t)
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans space-y-1.5">
                      <div className="font-bold text-white">Loco #{t.locoNo}</div>
                      <div className="text-slate-400">Direction: {t.direction}</div>
                      <div className="text-slate-400">Speed: {t.speed} km/h</div>
                      <div className="text-slate-450 font-mono">Lat: {t.lat.toFixed(4)}, Lng: {t.lng.toFixed(4)}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            <RecenterMap coords={centerCoords} />
          </MapContainer>
        </div>

        {/* Selected Locomotive Diagnostic Timeline (1 Col) */}
        <div className="glass-card rounded-3xl p-5 border border-slate-800/40 space-y-5 max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800/65 pb-3">
            <div>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">
                MONITORING
              </span>
              <h4 className="text-lg font-bold font-mono text-white mt-1">Loco #{selectedLoco.locoNo}</h4>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-450">Signal:</span>
              <span className={`h-3 w-3 rounded-full
                ${selectedLoco.signalAspect === 'Green' ? 'bg-green-500' : selectedLoco.signalAspect === 'Red' ? 'bg-red-500' : 'bg-amber-500'}`}
              ></span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-900">
            <div>
              <span className="text-slate-500">Speed</span>
              <div className="font-bold font-mono text-white mt-0.5">{selectedLoco.speed} km/h</div>
            </div>
            <div>
              <span className="text-slate-500">Direction</span>
              <div className="font-bold text-slate-200 mt-0.5">{selectedLoco.direction}</div>
            </div>
            <div className="pt-2 border-t border-slate-900">
              <span className="text-slate-500">ETA Next Station</span>
              <div className="font-bold text-railway-gold mt-0.5">{selectedLoco.eta}</div>
            </div>
            <div className="pt-2 border-t border-slate-900">
              <span className="text-slate-500">GPS Status</span>
              <div className="font-bold text-green-500 mt-0.5 font-mono">ACTIVE</div>
            </div>
          </div>

          {/* Timetable timeline */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Tracking Timeline</h5>
            <div className="relative pl-6 border-l border-slate-800 space-y-4 text-xs">
              {selectedLoco.movementTimeline.map((item: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* node marker */}
                  <span className="absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-slate-750">
                    <span className="h-1.5 w-1.5 rounded-full bg-railway-gold"></span>
                  </span>
                  <div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-200">{item.station}</span>
                      <span className="text-slate-450 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 text-[10px] text-slate-500 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Latitude:</span>
              <span>{selectedLoco.lat.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Longitude:</span>
              <span>{selectedLoco.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
