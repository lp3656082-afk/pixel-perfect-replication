import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useState } from "react";
import { ExternalLink, MapPin, Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { friendly, uploadMedia, useList, useRemove, useSave, type Row } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { ConfirmDelete, FilePick, Loading, MediaImage, PageHeader } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const LeafletMap = lazy(() => import("@/components/LeafletMap"));

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({
    meta: [
      { title: "Nuestro mapa · Nuestra historia" },
      { name: "description", content: "Los lugares que forman parte de nosotros." },
      { property: "og:title", content: "Nuestro mapa" },
      { property: "og:description", content: "Los lugares que forman parte de nosotros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

const CATS = ["Citas", "Restaurantes", "Viajes", "Paseos", "Favoritos", "Especiales"];
type Place = Row<"places">;

function MapPage() {
  const { data: places = [], isLoading } = useList("places");
  const { data: photos = [] } = useList("photos");
  const { data: memories = [] } = useList("memories");
  const remove = useRemove("places");
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Place> | null>(null);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterText, setFilterText] = useState("");

  const selected = places.find((p) => p.id === sel);
  const onSelect = useCallback((id: string) => setSel(id), []);
  const onPick = useCallback((lat: number, lng: number) => {
    if (!picking) return;
    setPicking(false);
    setForm((f) => ({ ...(f ?? {}), lat, lng }));
  }, [picking]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=es&q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setResults(j);
      if (!j.length) toast("No encontramos ese lugar.");
    } catch { toast.error("No se pudo buscar. Revisa tu conexión."); }
  };

  const list = places.filter((p) => (filterCat === "all" || p.category === filterCat) && p.name.toLowerCase().includes(filterText.toLowerCase()));
  const placePhoto = (id: string) => photos.find((p) => p.place_id === id)?.storage_path;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <PageHeader eyebrow={`${places.length} lugares juntos`} title="Nuestro mapa">
        <p>Los lugares que forman parte de nosotros.</p>
      </PageHeader>

      <form onSubmit={search} className="relative mb-3 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un lugar o dirección…" aria-label="Buscar lugar" className="bg-card" />
        <Button type="submit" aria-label="Buscar"><Search /></Button>
        <Button type="button" variant={picking ? "default" : "outline"} onClick={() => { setPicking(!picking); setForm((f) => f ?? {}); }}>
          <MapPin /> <span className="hidden sm:inline">{picking ? "Toca el mapa…" : "Marcar en el mapa"}</span>
        </Button>
        {results.length > 0 && (
          <ul className="absolute left-0 right-0 top-11 z-[700] overflow-hidden rounded-xl border bg-popover shadow-soft">
            {results.map((r) => (
              <li key={r.lat + r.lon}><button type="button" className="w-full px-4 py-3 text-left text-sm hover:bg-accent" onClick={() => {
                const lat = +r.lat, lng = +r.lon;
                setResults([]); setFocus({ lat, lng });
                setForm({ name: r.display_name.split(",")[0], lat, lng });
              }}>{r.display_name}</button></li>
            ))}
          </ul>
        )}
      </form>

      <div className="relative h-[60vh] min-h-[360px] overflow-hidden rounded-2xl border shadow-soft">
        <Suspense fallback={<Loading />}>
          {!isLoading && <LeafletMap points={places} onSelect={onSelect} onPick={onPick} picked={form?.lat != null ? { lat: form.lat, lng: form.lng! } : null} focus={focus} />}
        </Suspense>
        {selected && (
          <article className="absolute bottom-3 left-3 right-3 z-[600] mx-auto max-w-sm overflow-hidden rounded-2xl bg-card shadow-soft">
            <button className="absolute right-2 top-2 z-10 rounded-full bg-card/80 p-1" aria-label="Cerrar" onClick={() => setSel(null)}><X className="h-4 w-4" /></button>
            {placePhoto(selected.id) && <MediaImage path={placePhoto(selected.id)} alt={selected.name} className="aspect-[16/9] w-full" />}
            <div className="p-4">
              <p className="text-xs uppercase tracking-widest text-gold">{selected.category}{selected.visited_on && ` · ${fmtDate(selected.visited_on)}`}</p>
              <h2 className="text-2xl text-wine">{selected.name}</h2>
              {selected.why_special && <p className="mt-1 font-display italic">{selected.why_special}</p>}
              {selected.description && <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>}
              {memories.filter((m) => m.place_id === selected.id).map((m) => <p key={m.id} className="mt-1 text-sm">♡ {m.title}</p>)}
              <div className="mt-3 flex flex-wrap gap-2">
                <a className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}><ExternalLink className="h-3 w-3" /> Abrir en mapas</a>
                <Button size="sm" variant="outline" onClick={() => { setForm(selected); setSel(null); }}><Pencil /> Editar</Button>
                <ConfirmDelete what="este lugar" onConfirm={() => { remove.mutate(selected.id); setSel(null); }} />
              </div>
            </div>
          </article>
        )}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-3xl text-wine">Todos nuestros lugares</h2>
          <Input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filtrar…" aria-label="Filtrar por nombre" className="w-40 bg-card" />
          <select aria-label="Filtrar por categoría" value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-9 rounded-md border bg-card px-2 text-sm"><option value="all">Todas</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <Button onClick={() => setForm({})}><Plus /> Añadir</Button>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}><button onClick={() => { setSel(p.id); setFocus({ lat: p.lat, lng: p.lng }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full rounded-xl border bg-card/80 p-4 text-left transition hover:shadow-soft">
              <p className="font-display text-xl">{p.name}</p>
              <p className="text-xs text-muted-foreground">{[p.category, fmtDate(p.visited_on)].filter(Boolean).join(" · ")}</p>
            </button></li>
          ))}
          {!list.length && <p className="text-sm text-muted-foreground">Aún no hay lugares. Busca uno o márcalo en el mapa.</p>}
        </ul>
      </section>

      {form && !picking && <PlaceForm initial={form} onClose={() => setForm(null)} onPickAgain={() => setPicking(true)} />}
    </main>
  );
}

function PlaceForm({ initial, onClose, onPickAgain }: { initial: Partial<Place>; onClose: () => void; onPickAgain: () => void }) {
  const save = useSave("places", "Lugar guardado");
  const qc = useQueryClient();
  const [v, setV] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name?.trim()) return toast.error("Ponle un nombre al lugar.");
    if (v.lat == null || v.lng == null) return toast.error("Elige la ubicación buscando o tocando el mapa.");
    setBusy(true);
    try {
      const p = await save.mutateAsync({ id: v.id, name: v.name.trim(), lat: v.lat, lng: v.lng, category: v.category || null, visited_on: v.visited_on || null, description: v.description || null, why_special: v.why_special || null });
      for (const f of files) {
        const path = await uploadMedia(f, "places");
        const { error } = await supabase.from("photos").insert({ storage_path: path, place_id: p.id, title: p.name, alt_text: `Foto en ${p.name}` });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["photos"] });
      onClose();
    } catch (err) { toast.error(friendly(err as Error)); } finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="z-[800] max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-2xl text-wine">{v.id ? "Editar lugar" : "Nuevo lugar"}</DialogTitle>
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="n">Nombre *</Label><Input id="n" value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-xs">
            <span>{v.lat != null ? `${v.lat.toFixed(5)}, ${v.lng!.toFixed(5)}` : "Sin ubicación"}</span>
            <Button type="button" size="sm" variant="ghost" onClick={onPickAgain}><MapPin /> Elegir en el mapa</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="c">Categoría</Label><select id="c" className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={v.category ?? ""} onChange={(e) => setV({ ...v, category: e.target.value })}><option value="">—</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><Label htmlFor="vd">Fecha de visita</Label><Input id="vd" type="date" value={v.visited_on ?? ""} onChange={(e) => setV({ ...v, visited_on: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="w">Por qué es especial</Label><Textarea id="w" value={v.why_special ?? ""} onChange={(e) => setV({ ...v, why_special: e.target.value })} /></div>
          <div><Label htmlFor="ds">Descripción</Label><Textarea id="ds" value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <FilePick multiple label={files.length ? `${files.length} foto(s) listas` : "Añadir fotos del lugar"} onFiles={setFiles} />
          <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Guardando…" : "Guardar lugar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
