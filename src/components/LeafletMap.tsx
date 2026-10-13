import { useEffect, useRef } from "react";
import L from "leaflet";

export type MapPoint = { id: string; lat: number; lng: number; name: string };

const heart = L.divIcon({
  className: "heart-marker",
  html: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1.5"><path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.6 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.4h2C13.8 6.1 15.2 5 17.2 5c3.5 0 5.6 3.6 4.3 6.7C19.5 16.4 12 21 12 21z"/></svg>',
  iconSize: [30, 30], iconAnchor: [15, 28],
});
const pin = L.divIcon({ className: "heart-marker", html: '<div style="width:16px;height:16px;border-radius:9999px;background:currentColor;border:3px solid white"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

export default function LeafletMap({ points, onSelect, onPick, picked, focus }: {
  points: MapPoint[]; onSelect: (id: string) => void; onPick?: (lat: number, lng: number) => void;
  picked?: { lat: number; lng: number } | null; focus?: { lat: number; lng: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    const m = L.map(el.current!, { zoomControl: true }).setView([4.65, -74.08], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    m.on("click", (e) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
    map.current = m;
    layer.current = L.layerGroup().addTo(m);
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    const g = layer.current!;
    g.clearLayers();
    points.forEach((p) => L.marker([p.lat, p.lng], { icon: heart, title: p.name, alt: p.name, keyboard: true }).on("click", () => onSelect(p.id)).addTo(g));
    if (picked) L.marker([picked.lat, picked.lng], { icon: pin }).addTo(g);
    if (points.length && !picked && !focus) map.current!.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 13 });
  }, [points, picked, onSelect, focus]);

  useEffect(() => { if (focus) map.current?.setView([focus.lat, focus.lng], 15); }, [focus]);

  return <div ref={el} className="h-full w-full" role="application" aria-label="Mapa de nuestros lugares" />;
}
