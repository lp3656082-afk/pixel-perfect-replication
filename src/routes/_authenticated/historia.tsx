import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { friendly, uploadMedia, useList, useRemove, useSave, type Row } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { ConfirmDelete, EmptyState, ErrorNote, FilePick, Lightbox, Loading, MediaImage, PageHeader, Placeholder } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/historia")({
  head: () => ({
    meta: [
      { title: "Línea de tiempo · Nuestra historia" },
      { name: "description", content: "Nuestra historia, momento a momento." },
      { property: "og:title", content: "Línea de tiempo" },
      { property: "og:description", content: "Nuestra historia, momento a momento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Timeline,
});

export const MEMORY_CATEGORIES = ["Inicio", "Salida", "Viaje", "Cita", "Sorpresa", "Aniversario", "Superamos juntos", "Cotidiano"];
type Memory = Row<"memories">;

function Timeline() {
  const { data: memories, isLoading, error, refetch } = useList("memories");
  const { data: photos = [] } = useList("photos");
  const { data: places = [] } = useList("places");
  const remove = useRemove("memories");
  const [year, setYear] = useState("all");
  const [cat, setCat] = useState("all");
  const [fav, setFav] = useState(false);
  const [editing, setEditing] = useState<Partial<Memory> | null>(null);
  const [detail, setDetail] = useState<Memory | null>(null);
  const [lb, setLb] = useState<number | null>(null);

  const years = useMemo(() => [...new Set((memories ?? []).map((m) => m.happened_on.slice(0, 4)))], [memories]);
  const list = (memories ?? []).filter((m) =>
    (year === "all" || m.happened_on.startsWith(year)) && (cat === "all" || m.category === cat) && (!fav || m.is_favorite));
  const photosOf = (id: string) => photos.filter((p) => p.memory_id === id);
  const placeName = (id?: string | null) => places.find((p) => p.id === id)?.name;
  const detailPhotos = detail ? photosOf(detail.id) : [];

  return (
    <main>
      <PageHeader eyebrow="Momento a momento" title="Nuestra historia">
        <p>Un libro visual que seguimos escribiendo juntos.</p>
        <Button className="mt-6 rounded-full" onClick={() => setEditing({ happened_on: new Date().toISOString().slice(0, 10) })}><Plus /> Añadir recuerdo</Button>
      </PageHeader>

      <div className="mx-auto mb-10 flex max-w-3xl flex-wrap items-center justify-center gap-2 px-4">
        <select aria-label="Filtrar por año" value={year} onChange={(e) => setYear(e.target.value)} className="h-9 rounded-full border bg-card px-3 text-sm">
          <option value="all">Todos los años</option>{years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select aria-label="Filtrar por categoría" value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 rounded-full border bg-card px-3 text-sm">
          <option value="all">Todas las categorías</option>{MEMORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <Button variant={fav ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFav(!fav)} aria-pressed={fav}>
          <Heart className={fav ? "fill-current" : ""} /> Favoritos
        </Button>
      </div>

      {isLoading ? <Loading /> : error ? <ErrorNote error={error} retry={refetch} /> : !list.length ? (
        <EmptyState>{memories?.length ? "Ningún recuerdo con estos filtros." : "Aquí empezará nuestra historia. Añade el primer recuerdo."}</EmptyState>
      ) : (
        <ol className="relative mx-auto max-w-5xl px-4">
          <span aria-hidden className="absolute bottom-0 left-6 top-0 w-px bg-gold/50 md:left-1/2" />
          {list.map((m, i) => {
            const ph = photosOf(m.id)[0];
            return (
              <li key={m.id} className={`relative mb-10 animate-rise pl-12 md:w-1/2 md:pl-0 ${i % 2 ? "md:ml-auto md:pl-10" : "md:pr-10"}`}>
                <span aria-hidden className={`absolute left-[18px] top-6 h-3 w-3 rounded-full border-2 border-gold bg-card md:top-6 ${i % 2 ? "md:-left-1.5" : "md:left-auto md:-right-1.5"}`} />
                <article className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                  <button className="block w-full text-left" onClick={() => setDetail(m)} aria-label={`Ver ${m.title}`}>
                    {ph ? <MediaImage path={ph.storage_path} alt={ph.alt_text} className="aspect-[16/10] w-full" /> : <Placeholder className="aspect-[16/10] w-full" />}
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-widest text-gold">{fmtDate(m.happened_on)}{m.category && ` · ${m.category}`}</p>
                      <h2 className="mt-1 flex items-center gap-2 text-2xl text-wine">{m.title}{m.is_favorite && <Heart className="h-4 w-4 fill-primary text-primary" aria-label="Favorito" />}</h2>
                      {m.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{m.description}</p>}
                      {placeName(m.place_id) && <p className="mt-2 flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{placeName(m.place_id)}</p>}
                    </div>
                  </button>
                  <div className="flex justify-end gap-1 border-t px-3 py-1">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditing(m)}><Pencil /></Button>
                    <ConfirmDelete what="este recuerdo" onConfirm={() => remove.mutate(m.id)} />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="font-display text-3xl text-wine">{detail?.title}</DialogTitle>
          <p className="text-sm text-gold">{fmtDate(detail?.happened_on)}{placeName(detail?.place_id) && ` · ${placeName(detail?.place_id)}`}</p>
          {detail?.description && <p className="whitespace-pre-line">{detail.description}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {detailPhotos.map((p, i) => (
              <button key={p.id} onClick={() => setLb(i)} aria-label="Ampliar foto"><MediaImage path={p.storage_path} alt={p.alt_text} className="aspect-square w-full rounded-lg" /></button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Lightbox items={detailPhotos.map((p) => ({ path: p.storage_path, alt: p.alt_text, caption: p.title ?? undefined }))} index={lb} onClose={() => setLb(null)} />
      {editing && <MemoryForm initial={editing} places={places} onClose={() => setEditing(null)} />}
    </main>
  );
}

function MemoryForm({ initial, places, onClose }: { initial: Partial<Memory>; places: Row<"places">[]; onClose: () => void }) {
  const save = useSave("memories", "Recuerdo guardado");
  const qc = useQueryClient();
  const [v, setV] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.title?.trim() || !v.happened_on) return toast.error("Título y fecha son obligatorios.");
    setBusy(true);
    try {
      const saved = await save.mutateAsync({
        id: v.id, title: v.title.trim(), happened_on: v.happened_on, description: v.description || null,
        category: v.category || null, is_favorite: !!v.is_favorite, place_id: v.place_id || null,
      });
      for (const f of files) {
        const path = await uploadMedia(f, "memories");
        const { error } = await supabase.from("photos").insert({ storage_path: path, memory_id: saved.id, place_id: saved.place_id, taken_on: saved.happened_on, title: saved.title, alt_text: `Foto de ${saved.title}` });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["photos"] });
      onClose();
    } catch (err) {
      toast.error(friendly(err as Error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle className="font-display text-2xl text-wine">{v.id ? "Editar recuerdo" : "Nuevo recuerdo"}</DialogTitle>
        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="t">Título *</Label><Input id="t" required value={v.title ?? ""} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label htmlFor="d">Fecha *</Label><Input id="d" type="date" required value={v.happened_on ?? ""} onChange={(e) => setV({ ...v, happened_on: e.target.value })} /></div>
            <div><Label htmlFor="c">Categoría</Label>
              <select id="c" value={v.category ?? ""} onChange={(e) => setV({ ...v, category: e.target.value })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
                <option value="">—</option>{MEMORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div><Label htmlFor="ds">Descripción</Label><Textarea id="ds" rows={4} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <div><Label htmlFor="pl">Lugar</Label>
            <select id="pl" value={v.place_id ?? ""} onChange={(e) => setV({ ...v, place_id: e.target.value })} className="h-9 w-full rounded-md border bg-card px-2 text-sm">
              <option value="">Sin lugar</option>{places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={!!v.is_favorite} onCheckedChange={(c) => setV({ ...v, is_favorite: c })} /> Recuerdo favorito</label>
          <FilePick multiple accept="image/*,video/mp4" label={files.length ? `${files.length} archivo(s) listos` : "Añadir fotos o videos cortos"} onFiles={setFiles} />
          <Button type="submit" className="w-full rounded-full" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
