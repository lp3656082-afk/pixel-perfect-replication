import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Pencil, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { friendly, uploadMedia, useList, useRemove, useSave, type Row } from "@/lib/data";
import { fmtDate } from "@/lib/dates";
import { ConfirmDelete, EmptyState, FilePick, Lightbox, Loading, MediaImage, PageHeader, Placeholder } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/recuerdos")({
  head: () => ({
    meta: [
      { title: "Recuerdos · Nuestra historia" },
      { name: "description", content: "Nuestras fotografías favoritas." },
      { property: "og:title", content: "Nuestros recuerdos" },
      { property: "og:description", content: "Nuestras fotografías favoritas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Gallery,
});

type Photo = Row<"photos">;

function Gallery() {
  const qc = useQueryClient();
  const { data: photos, isLoading } = useList("photos");
  const { data: albums = [] } = useList("albums");
  const { data: memories = [] } = useList("memories");
  const saveAlbum = useSave("albums", "Álbum guardado");
  const savePhoto = useSave("photos", "Foto actualizada");
  const removePhoto = useRemove("photos");
  const removeAlbum = useRemove("albums");
  const [album, setAlbum] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const [edit, setEdit] = useState<Photo | null>(null);
  const [newAlbum, setNewAlbum] = useState("");

  const list = (photos ?? []).filter((p) => album === "all" || (album === "fav" ? p.is_favorite : p.album_id === album));

  const upload = async (files: File[]) => {
    setBusy(true);
    try {
      for (const f of files) {
        const path = await uploadMedia(f, "gallery");
        const { error } = await supabase.from("photos").insert({ storage_path: path, album_id: album !== "all" && album !== "fav" ? album : null, title: f.name.replace(/\.[^.]+$/, "") });
        if (error) throw error;
      }
      toast.success(files.length > 1 ? `${files.length} fotos subidas` : "Foto subida");
      qc.invalidateQueries({ queryKey: ["photos"] });
    } catch (e) { toast.error(friendly(e as Error)); } finally { setBusy(false); }
  };

  const replace = async (p: Photo, f: File) => {
    try {
      const path = await uploadMedia(f, "gallery");
      await savePhoto.mutateAsync({ id: p.id, storage_path: path });
      await supabase.storage.from("media").remove([p.storage_path]);
      setEdit({ ...p, storage_path: path });
    } catch (e) { toast.error(friendly(e as Error)); }
  };

  const del = async (p: Photo) => {
    await removePhoto.mutateAsync(p.id);
    supabase.storage.from("media").remove([p.storage_path]);
    setEdit(null);
  };

  const cover = (a: Row<"albums">) => photos?.find((p) => p.id === a.cover_photo_id)?.storage_path ?? photos?.find((p) => p.album_id === a.id)?.storage_path;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <PageHeader eyebrow="Galería" title="Nuestros recuerdos" />
      <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
        <AlbumChip active={album === "all"} onClick={() => setAlbum("all")} label="Todas" />
        <AlbumChip active={album === "fav"} onClick={() => setAlbum("fav")} label="Favoritas" />
        {albums.map((a) => (
          <button key={a.id} onClick={() => setAlbum(a.id)} className={`group relative w-32 shrink-0 overflow-hidden rounded-xl border text-left ${album === a.id ? "ring-2 ring-primary" : ""}`}>
            <MediaImage path={cover(a)} alt={`Portada de ${a.name}`} className="aspect-square w-full" />
            <span className="bg-veil absolute inset-0" />
            <span className="absolute bottom-2 left-2 right-2 font-display text-sm leading-tight text-primary-foreground">{a.name}</span>
          </button>
        ))}
        <form className="flex w-40 shrink-0 flex-col justify-center gap-2" onSubmit={(e) => { e.preventDefault(); if (newAlbum.trim()) saveAlbum.mutate({ name: newAlbum.trim() }, { onSuccess: () => setNewAlbum("") }); }}>
          <Input placeholder="Nuevo álbum" value={newAlbum} onChange={(e) => setNewAlbum(e.target.value)} aria-label="Nombre del nuevo álbum" className="bg-card" />
          <Button size="sm" variant="outline" type="submit"><Plus /> Crear</Button>
        </form>
      </div>
      {album !== "all" && album !== "fav" && (
        <div className="mb-4 flex justify-end">
          <ConfirmDelete what="este álbum (las fotos se conservan)" onConfirm={() => { removeAlbum.mutate(album); setAlbum("all"); }}>
            <Button variant="ghost" size="sm">Eliminar álbum</Button>
          </ConfirmDelete>
        </div>
      )}
      <FilePick multiple busy={busy} onFiles={upload} label="Subir fotos desde el celular o computador" />

      <div className="mt-8">
        {isLoading ? <Loading /> : !list.length ? <EmptyState>Aún no hay fotos aquí. Sube la primera.</EmptyState> : (
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {list.map((p, i) => (
              <figure key={p.id} className={`mb-4 break-inside-avoid bg-card p-2 pb-3 shadow-polaroid transition hover:rotate-0 ${i % 3 === 0 ? "rotate-[-1deg]" : i % 3 === 1 ? "rotate-[1deg]" : ""}`}>
                <button className="block w-full" onClick={() => setLb(i)} aria-label={`Ampliar ${p.title ?? "foto"}`}>
                  <MediaImage path={p.storage_path} alt={p.alt_text} className="w-full" />
                </button>
                <figcaption className="mt-2 flex items-start justify-between gap-1 px-1">
                  <span><span className="block font-display text-base leading-tight">{p.title}</span>{p.taken_on && <span className="text-xs text-muted-foreground">{fmtDate(p.taken_on)}</span>}</span>
                  <span className="flex shrink-0">
                    <button aria-label={p.is_favorite ? "Quitar de favoritas" : "Marcar favorita"} onClick={() => savePhoto.mutate({ id: p.id, is_favorite: !p.is_favorite } as never)} className="p-1"><Heart className={`h-4 w-4 ${p.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button>
                    <button aria-label="Editar foto" onClick={() => setEdit(p)} className="p-1"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
      <Lightbox items={list.map((p) => ({ path: p.storage_path, alt: p.alt_text, caption: p.title ?? undefined }))} index={lb} onClose={() => setLb(null)} />

      {edit && (
        <Dialog open onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogTitle className="font-display text-2xl text-wine">Editar foto</DialogTitle>
            <MediaImage path={edit.storage_path} alt={edit.alt_text} className="max-h-60 w-full rounded-lg" />
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault();
              savePhoto.mutate({ id: edit.id, title: edit.title, taken_on: edit.taken_on || null, description: edit.description, alt_text: edit.alt_text || "Fotografía de Luis y Jeisy", album_id: edit.album_id || null, memory_id: edit.memory_id || null, tags: edit.tags } as never, { onSuccess: () => setEdit(null) });
            }}>
              <div><Label htmlFor="pt">Título</Label><Input id="pt" value={edit.title ?? ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
              <div><Label htmlFor="pd">Fecha</Label><Input id="pd" type="date" value={edit.taken_on ?? ""} onChange={(e) => setEdit({ ...edit, taken_on: e.target.value })} /></div>
              <div><Label htmlFor="pds">Descripción</Label><Textarea id="pds" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <div><Label htmlFor="pa">Texto alternativo</Label><Input id="pa" value={edit.alt_text} onChange={(e) => setEdit({ ...edit, alt_text: e.target.value })} /></div>
              <div><Label htmlFor="ptag">Etiquetas (separadas por coma)</Label><Input id="ptag" value={edit.tags.join(", ")} onChange={(e) => setEdit({ ...edit, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="pal">Álbum</Label><select id="pal" className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={edit.album_id ?? ""} onChange={(e) => setEdit({ ...edit, album_id: e.target.value })}><option value="">Ninguno</option>{albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                <div><Label htmlFor="pm">Recuerdo</Label><select id="pm" className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={edit.memory_id ?? ""} onChange={(e) => setEdit({ ...edit, memory_id: e.target.value })}><option value="">Ninguno</option>{memories.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="rounded-full">Guardar</Button>
                {edit.album_id && <Button type="button" variant="outline" onClick={() => saveAlbum.mutate({ id: edit.album_id!, cover_photo_id: edit.id } as never)}><Star /> Usar como portada</Button>}
                <label className="inline-flex cursor-pointer items-center rounded-md border px-3 text-sm">Reemplazar<input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && replace(edit, e.target.files[0])} /></label>
                <ConfirmDelete what="esta foto" onConfirm={() => del(edit)}><Button type="button" variant="ghost" className="text-destructive">Eliminar</Button></ConfirmDelete>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}

function AlbumChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`w-32 shrink-0 overflow-hidden rounded-xl border ${active ? "ring-2 ring-primary" : ""}`}>
      <Placeholder className="aspect-square w-full" label={label} />
    </button>
  );
}
