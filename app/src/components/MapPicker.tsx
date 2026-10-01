import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { DEFAULT_CENTER, locate } from '../lib/geo';
import type { LatLng } from '../lib/types';
import { Spinner, toast } from './ui';

const pin = (cls: string) =>
  L.divIcon({ className: '', html: `<div class="pin ${cls}"></div>`, iconSize: [30, 30], iconAnchor: [15, 34] });
const BUYER_PIN = pin('pin-buyer');
const STORE_PIN = pin('pin-store');

export interface MapPickerProps {
  value: LatLng | null;
  onChange?: (p: LatLng) => void;
  /** Titik toko (pin hitam), mis. saat pembeli memilih lokasi */
  store?: LatLng;
  /** Radius jangkauan dalam km garis lurus */
  radiusKm?: number;
  height?: string;
  showLocate?: boolean;
  /** Langsung minta GPS saat peta dibuka bila value kosong */
  autoLocate?: boolean;
}

function Recenter({ to }: { to: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.setView([to.lat, to.lng], Math.max(map.getZoom(), 16), { animate: true });
  }, [to, map]);
  return null;
}

function ClickToMove({ onChange }: { onChange?: (p: LatLng) => void }) {
  useMapEvents({ click: e => onChange?.({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function MapPicker({
  value, onChange, store, radiusKm, height = 'h-64', showLocate = true, autoLocate = false,
}: MapPickerProps) {
  const [locating, setLocating] = useState(false);
  const [recenterTo, setRecenterTo] = useState<LatLng | null>(null);
  const initial = useMemo(() => value ?? store ?? DEFAULT_CENTER, []); // eslint-disable-line react-hooks/exhaustive-deps

  const useGps = async () => {
    setLocating(true);
    try {
      const p = await locate();
      onChange?.({ lat: p.lat, lng: p.lng });
      setRecenterTo({ lat: p.lat, lng: p.lng });
      if (p.accuracy > 100) toast('Lokasi kurang akurat, geser pin ke titik yang tepat');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (autoLocate && !value && onChange) useGps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200">
      <MapContainer
        center={[initial.lat, initial.lng]}
        zoom={value || store ? 15 : 12}
        className={`${height} w-full`}
        attributionControl
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {store && <Marker position={[store.lat, store.lng]} icon={STORE_PIN} />}
        {store && radiusKm ? (
          <Circle
            center={[store.lat, store.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#e8590c', weight: 1.5, fillOpacity: 0.06 }}
          />
        ) : null}
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={BUYER_PIN}
            draggable={!!onChange}
            eventHandlers={{
              dragend: e => {
                const ll = (e.target as L.Marker).getLatLng();
                onChange?.({ lat: ll.lat, lng: ll.lng });
              },
            }}
          />
        )}
        <ClickToMove onChange={onChange} />
        <Recenter to={recenterTo} />
      </MapContainer>
      {showLocate && onChange && (
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="btn absolute right-2 bottom-2 z-[400] bg-white text-stone-800 shadow-md"
        >
          {locating ? <Spinner className="h-4 w-4" /> : '📍'} Pakai lokasi saya
        </button>
      )}
    </div>
  );
}
