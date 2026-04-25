import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Shield, AlertTriangle, Info, Users, Navigation } from 'lucide-react';
import { messagesApi, recipientsApi } from '../api';
import { useLanguage } from '../i18n/LanguageContext';

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

const EAPS = [
  { name: 'Community Center Alpha', pos: [19.22, 72.86], capacity: 500, type: 'Medical + Food' },
  { name: 'District School B', pos: [18.94, 72.82], capacity: 300, type: 'Shelter' },
  { name: 'Central Stadium', pos: [19.03, 72.86], capacity: 2000, type: 'Mass Assembly' },
  { name: 'East Plaza Shelters', pos: [19.09, 72.93], capacity: 800, type: 'Shelter' },
];

function SetViewOnClick({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 13);
  }, [coords, map]);
  return null;
}

export default function MapPage() {
  const [alerts, setAlerts] = useState([]);
  const [zoneStats, setZoneStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => JSON.parse(localStorage.getItem('uacs_user') || '{}'));
  const isAdmin = user.role === 'admin';
  const { t } = useLanguage();
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgRes, recRes] = await Promise.all([
          messagesApi.getAll('active'),
          isAdmin ? recipientsApi.getAll() : Promise.resolve({ data: [] })
        ]);
        
        setAlerts(msgRes.data);
        
        if (isAdmin) {
          const stats = { recipientsList: recRes.data };
          recRes.data.forEach(r => {
            const z = r.zone || 'General';
            stats[z] = (stats[z] || 0) + 1;
          });
          setZoneStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const alertIcon = (urgency) => L.divIcon({
    html: `<div class="map-alert-icon ${urgency}">${urgency === 'critical' ? '🚨' : '⚠️'}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
  });

  const eapIcon = L.divIcon({
    html: `<div class="map-eap-icon">🏥</div>`,
    className: 'custom-div-icon',
    iconSize: [24, 24],
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ height: 'calc(100vh - 120px)', minHeight: '500px' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-accent" />
            {t('interactiveMap') || 'Interactive Situation Map'}
          </h1>
          <p className="text-[10px] md:text-sm text-theme-muted">{t('mapSubtitle') || 'Visualizing active alerts and evacuation points.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-theme-hover border border-theme-border">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl md:rounded-3xl overflow-hidden border border-theme-border shadow-2xl relative">
        <MapContainer center={[19.07, 72.87]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <SetViewOnClick coords={selectedZone ? ZONE_COORDS[selectedZone] : null} />

          {/* Active Alerts */}
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
                  <Popup className="custom-popup">
                    <div className="p-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${alert.urgency === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                          {alert.urgency}
                        </span>
                        <h4 className="font-bold text-sm m-0">{alert.title}</h4>
                      </div>
                      <p className="text-xs text-theme-secondary mb-2">{alert.master_content.substring(0, 100)}...</p>
                      <div className="text-[10px] text-theme-muted flex items-center justify-between">
                        <span>Zone: {alert.target_zone || 'All'}</span>
                        <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

          {/* EAPs */}
          {EAPS.map((eap, i) => (
            <Marker key={i} position={eap.pos} icon={eapIcon}>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-sm text-accent mb-1">{eap.name}</h4>
                  <p className="text-xs font-medium text-theme-secondary mb-1">Type: {eap.type}</p>
                  <p className="text-[10px] text-theme-muted mb-2">Capacity: {eap.capacity} people</p>
                  <button className="w-full py-1.5 bg-accent text-white text-[10px] font-bold rounded-md flex items-center justify-center gap-1">
                    <Navigation className="w-3 h-3" /> GET DIRECTIONS
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Recipients (Admin only) */}
          {isAdmin && zoneStats.recipientsList?.map((rec, idx) => (
            rec.lat && rec.lng && (
              <Marker key={rec.id || idx} position={[rec.lat, rec.lng]} icon={L.divIcon({
                html: `<div class="map-recipient-icon">👤</div>`,
                className: 'custom-div-icon',
                iconSize: [20, 20]
              })}>
                <Popup>
                  <div className="p-1 text-xs">
                    <div className="font-bold text-accent">{rec.name}</div>
                    <div className="text-theme-muted">{rec.phone}</div>
                    <div className="mt-1 font-medium">Zone: {rec.zone}</div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Admin Stats Overlay on Map (Heatmap markers) */}
          {isAdmin && Object.entries(ZONE_COORDS).map(([name, pos]) => (
            <div key={name}>
              {zoneStats[name] > 0 && (
                 <Marker position={[pos[0] + 0.005, pos[1] + 0.005]} icon={L.divIcon({
                   html: `<div class="zone-count-badge">${zoneStats[name]}</div>`,
                   className: 'custom-div-icon',
                   iconSize: [20, 20]
                 })}>
                   <Popup>
                     <div className="text-xs font-bold">{name}: {zoneStats[name]} Recipients</div>
                   </Popup>
                 </Marker>
              )}
            </div>
          ))}
        </MapContainer>

        {/* Legend / Overlay UI */}
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
          <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl border border-theme-border shadow-xl min-w-[140px] md:min-w-[180px]">
             <h4 className="text-[10px] md:text-xs font-bold mb-2 md:mb-3 border-b border-theme-border pb-2 uppercase tracking-wider">Map Legend</h4>
             <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <span>Critical Alert</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange-500" />
                  <span>High Alert</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                  <span className="text-xs md:text-base">🏥</span>
                  <span>Safety Point</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 text-[10px] md:text-xs">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-accent text-white text-[8px] md:text-[10px] flex items-center justify-center font-bold">12</div>
                    <span>Heatmap</span>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Zone Selector for quick jump */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000]">
          <div className="glass-card p-1.5 md:p-2 rounded-lg md:rounded-xl border border-theme-border shadow-xl flex items-center gap-2">
            <select 
              className="bg-transparent border-0 text-[10px] md:text-xs font-bold focus:ring-0 cursor-pointer p-0 pr-6"
              onChange={(e) => setSelectedZone(e.target.value)}
              value={selectedZone || ''}
            >
              <option value="">{t('jumpToZone') || 'Jump...'}</option>
              {Object.keys(ZONE_COORDS).map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
      </div>

      <style>{`
        .map-alert-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          filter: drop-shadow(0 0 4px rgba(0,0,0,0.3));
          animation: bounce 2s infinite;
        }
        .map-alert-icon.critical {
          background: #ef4444;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          border: 2px solid white;
        }
        .map-eap-icon {
          background: white;
          border-radius: 6px;
          padding: 2px;
          border: 2px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .zone-count-badge {
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 800;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .map-recipient-icon {
          background: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--accent);
          font-size: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 8px;
          width: 200px !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
