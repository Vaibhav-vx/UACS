import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Map as MapIcon, Shield, Layers, MapPin } from 'lucide-react';
import { messagesApi } from '../api';

const { BaseLayer } = LayersControl;

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ZONE_COORDS = {
  'North District': [19.21, 72.85],
  'South District': [18.93, 72.83],
  'East District':  [19.08, 72.92],
  'West District':  [19.12, 72.82],
  'Central Zone':   [19.03, 72.85],
  'General':        [19.07, 72.87],
};

export default function SituationMapCard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapSize, setMapSize] = useState('medium'); // small, medium, large

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await messagesApi.getAll('active');
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard map alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 60000);
    return () => clearInterval(iv);
  }, []);

  const sizeClasses = {
    small: 'map-card-small',
    medium: 'map-card-medium',
    large: 'map-card-large'
  };

  const alertIcon = (urgency) => L.divIcon({
    html: `<div class="map-alert-icon ${urgency}">${urgency === 'critical' ? '🚨' : '⚠️'}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
  });

  return (
    <div className={`glass-card overflow-hidden transition-all duration-500 map-card-resizable ${sizeClasses[mapSize]} relative shadow-2xl border-0`}>
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-surface/80 backdrop-blur-md border border-theme-border shadow-lg pointer-events-auto">
          <Shield className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider">{loading ? 'Loading Map...' : 'Live Situation Overview'}</span>
        </div>
        
        <div className="flex items-center gap-1 p-1 rounded-xl bg-theme-surface/80 backdrop-blur-md border border-theme-border shadow-lg pointer-events-auto">
          <button 
            onClick={() => setMapSize('small')}
            className={`p-1.5 rounded-lg transition-colors ${mapSize === 'small' ? 'bg-accent text-white' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Small View"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMapSize('medium')}
            className={`p-1.5 rounded-lg transition-colors ${mapSize === 'medium' ? 'bg-accent text-white' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Medium View"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMapSize('large')}
            className={`p-1.5 rounded-lg transition-colors ${mapSize === 'large' ? 'bg-accent text-white' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Large View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <MapContainer center={[19.07, 72.87]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <BaseLayer checked name="World Labels (Professional)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </BaseLayer>
          
          <BaseLayer name="Standard Map (Street Detail)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          <BaseLayer name="Satellite Imagery (Live Look)">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>

          <BaseLayer name="Detailed Terrain (Geographic)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
        </LayersControl>
        
        {alerts.map(alert => {
          const pos = ZONE_COORDS[alert.target_zone] || ZONE_COORDS['General'];
          const color = alert.urgency === 'critical' ? '#ef4444' : '#f97316';
          return (
            <div key={alert.id}>
              <Circle 
                center={pos} 
                radius={1000} 
                pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }} 
              />
              <Marker position={pos} icon={alertIcon(alert.urgency)}>
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
                    <p className="text-[10px] text-theme-secondary line-clamp-2">{alert.master_content}</p>
                    <div className="mt-2 text-[8px] font-bold uppercase text-theme-dim">Zone: {alert.target_zone}</div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>

      <style>{`
        .map-alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          filter: drop-shadow(0 0 4px rgba(0,0,0,0.3));
        }
        .map-alert-icon.critical {
          background: #ef4444;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          border: 2px solid white;
          animation: map-bounce 2s infinite;
        }
        @keyframes map-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
