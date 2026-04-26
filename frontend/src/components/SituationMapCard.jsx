import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Map as MapIcon, Shield, Layers, MapPin, X, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import { messagesApi, nasaApi } from '../api';
import toast from 'react-hot-toast';
import { ZONE_COORDS } from '../constants';

const { BaseLayer } = LayersControl;

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});


export default function SituationMapCard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapSize, setMapSize] = useState('medium'); // small, medium, large
  const [nasaEvents, setNasaEvents] = useState([]);
  const [clickPos, setClickPos] = useState(null);
  const [pinTitle, setPinTitle] = useState('');
  const [pinDesc, setPinDesc] = useState('');
  const [pinUrgency, setPinUrgency] = useState('critical');
  const [submitting, setSubmitting] = useState(false);

  function MapEvents() {
    useMapEvents({
      click(e) {
        setClickPos(e.latlng);
      },
    });
    return null;
  }

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [msgRes, nasaRes] = await Promise.all([
          messagesApi.getAll('active'),
          nasaApi.getEvents(30).catch(() => ({ data: { events: [] } }))
        ]);
        setAlerts(msgRes.data);
        setNasaEvents(nasaRes.data.events || []);
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

  const nasaIcon = (categories) => {
    const catId = categories[0]?.id?.toLowerCase() || '';
    let emoji = '🌍';
    if (catId.includes('fire')) emoji = '🔥';
    if (catId.includes('storm')) emoji = '🌪️';
    if (catId.includes('flood')) emoji = '🌊';
    if (catId.includes('volcano')) emoji = '🌋';
    if (catId.includes('earthquake')) emoji = '🫨';
    return L.divIcon({
      html: `<div class="map-nasa-icon">${emoji}</div>`,
      className: 'custom-div-icon',
      iconSize: [22, 22],
    });
  };

  const handlePinSubmit = async () => {
    if (!pinTitle || !pinDesc) return toast.error('Please fill all fields');
    setSubmitting(true);
    try {
      await messagesApi.create({
        title: `[PIN] ${pinTitle}`,
        master_content: pinDesc,
        urgency: pinUrgency,
        target_zone: 'General',
        channels: ['website', 'sms'],
        languages: ['en'],
        lat: clickPos.lat,
        lng: clickPos.lng,
        status: 'active'
      });
      toast.success('Location alert pinned & broadcasted!');
      setClickPos(null);
      setPinTitle('');
      setPinDesc('');
      // Refresh
      const msgRes = await messagesApi.getAll('active');
      setAlerts(msgRes.data);
    } catch (err) {
      toast.error('Failed to pin alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`glass-card overflow-hidden transition-all duration-500 map-card-resizable ${sizeClasses[mapSize]} relative shadow-2xl border-0`}>


      {/* Map Size Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-theme-surface/90 backdrop-blur-xl border-2 border-theme-border shadow-2xl pointer-events-auto hover:border-accent/50 transition-colors">
          <button 
            onClick={() => setMapSize('small')}
            className={`p-2 rounded-xl transition-all ${mapSize === 'small' ? 'bg-accent text-white shadow-lg scale-110' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Small View"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setMapSize('medium')}
            className={`p-2 rounded-xl transition-all ${mapSize === 'medium' ? 'bg-accent text-white shadow-lg scale-110' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Medium View"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setMapSize('large')}
            className={`p-2 rounded-xl transition-all ${mapSize === 'large' ? 'bg-accent text-white shadow-lg scale-110' : 'hover:bg-theme-hover text-theme-muted'}`}
            title="Large View"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
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
        
        <MapEvents />

        {clickPos && (
          <Marker position={clickPos} icon={L.divIcon({ html: '📍', className: 'text-2xl' })}>
            <Popup minWidth={250}>
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-tighter">
                  <AlertTriangle className="w-4 h-4" /> Rapid Alert Pin
                </div>
                <input 
                  autoFocus
                  placeholder="Alert Title (e.g. Building Collapse)" 
                  className="w-full bg-theme-hover p-2 rounded-lg text-xs font-bold border border-theme-border"
                  value={pinTitle}
                  onChange={e => setPinTitle(e.target.value)}
                />
                <textarea 
                  placeholder="Short description / Instructions..." 
                  className="w-full bg-theme-hover p-2 rounded-lg text-xs h-20 border border-theme-border"
                  value={pinDesc}
                  onChange={e => setPinDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPinUrgency('critical')}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold ${pinUrgency === 'critical' ? 'bg-red-600 text-white' : 'bg-theme-hover text-theme-muted'}`}
                  >
                    CRITICAL
                  </button>
                  <button 
                    onClick={() => setPinUrgency('high')}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold ${pinUrgency === 'high' ? 'bg-orange-600 text-white' : 'bg-theme-hover text-theme-muted'}`}
                  >
                    HIGH
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setClickPos(null)}
                    className="flex-1 py-2 bg-theme-hover rounded-xl text-[10px] font-bold"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handlePinSubmit}
                    disabled={submitting}
                    className="flex-1 py-2 bg-accent text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2"
                  >
                    {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    DISPATCH
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {alerts.map(alert => {
          const pos = alert.lat && alert.lng ? [alert.lat, alert.lng] : (ZONE_COORDS[alert.target_zone] || ZONE_COORDS['General']);
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

        {/* NASA Events */}
        {nasaEvents.map(event => {
          const geometry = event.geometry[event.geometry.length - 1];
          if (!geometry || !Array.isArray(geometry.coordinates)) return null;
          const pos = [geometry.coordinates[1], geometry.coordinates[0]];
          return (
            <Marker key={event.id} position={pos} icon={nasaIcon(event.categories)}>
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-[10px] text-blue-600 uppercase mb-1">NASA: {event.categories[0]?.title}</div>
                  <h4 className="font-bold text-xs mb-1">{event.title}</h4>
                  <div className="text-[8px] text-theme-muted">{new Date(geometry.date).toLocaleDateString()}</div>
                </div>
              </Popup>
            </Marker>
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
        .map-nasa-icon {
          background: #1e3a8a;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid #60a5fa;
          font-size: 12px;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
        }
        @keyframes map-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
