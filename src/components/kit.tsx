import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Heart, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { useMediaUrl } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MediaImage({ path, alt, className }: { path?: string | null; alt: string; className?: string }) {
  const { data: url, isLoading, isError } = useMediaUrl(path);
  if (!path || isError) return <Placeholder className={className} />;
  if (isLoading || !url) return <div className={cn("animate-pulse bg-muted", className)} aria-label="Cargando imagen" />;
  if (/\.(mp4|mov|webm)$/i.test(path))
    return <video src={url} className={cn("object-cover", className)} controls playsInline aria-label={alt} />;
  return <img src={url} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", className)} />;
}

export function Placeholder({ className, label = "Aquí irá una foto nuestra" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 bg-secondary/70 text-muted-foreground", className)}>
      <Heart className="h-6 w-6 text-blush" aria-hidden />
      <span className="px-3 text-center font-display text-sm italic">{label}</span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-3xl animate-rise px-4 pb-8 pt-10 text-center md:pt-16">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      <h1 className="mt-3 text-4xl text-wine md:text-6xl">{title}</h1>
      {children && <div className="mt-4 text-muted-foreground">{children}</div>}
    </header>
  );
}

export function ConfirmDelete({ onConfirm, what = "esto", children }: { onConfirm: () => void; what?: string; children?: ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" aria-label={`Eliminar ${what}`}>
            <Trash2 />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {what}?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción es definitiva y no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FilePick({ onFiles, multiple, busy, label = "Elegir fotos", accept = "image/*" }: {
  onFiles: (f: File[]) => void; multiple?: boolean; busy?: boolean; label?: string; accept?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ring/50 bg-card/60 px-4 py-4 text-sm text-accent-foreground transition hover:bg-accent/60", busy && "pointer-events-none opacity-60")}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      {busy ? "Subiendo…" : label}
      <input type="file" className="sr-only" accept={accept} multiple={multiple}
        onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = ""; }} />
    </label>
  );
}

export function Lightbox({ items, index, onClose }: {
  items: { path: string; alt: string; caption?: string }[]; index: number | null; onClose: () => void;
}) {
  const [i, setI] = useState(index ?? 0);
  useEffect(() => { if (index !== null) setI(index); }, [index]);
  useEffect(() => {
    if (index === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % items.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, items.length, onClose]);
  if (index === null || !items[i]) return null;
  const it = items[i];
  return (
    <div role="dialog" aria-modal="true" aria-label="Vista ampliada" className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-foreground/90 p-4" onClick={onClose}>
      <button className="absolute right-4 top-4 rounded-full bg-card/20 p-2 text-primary-foreground" aria-label="Cerrar" onClick={onClose}><X /></button>
      <div className="max-h-[80vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <MediaImage path={it.path} alt={it.alt} className="max-h-[80vh] w-auto rounded-lg object-contain" />
      </div>
      {it.caption && <p className="mt-4 font-display text-xl text-primary-foreground">{it.caption}</p>}
      {items.length > 1 && (
        <div className="mt-4 flex gap-4" onClick={(e) => e.stopPropagation()}>
          <Button variant="secondary" size="icon" aria-label="Anterior" onClick={() => setI((i - 1 + items.length) % items.length)}><ChevronLeft /></Button>
          <span className="self-center text-sm text-primary-foreground/80">{i + 1} / {items.length}</span>
          <Button variant="secondary" size="icon" aria-label="Siguiente" onClick={() => setI((i + 1) % items.length)}><ChevronRight /></Button>
        </div>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-md rounded-2xl border border-dashed bg-card/60 p-8 text-center font-display text-lg italic text-muted-foreground">{children}</div>;
}

export function Loading() {
  return <div className="flex justify-center py-16" role="status" aria-label="Cargando"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

export function ErrorNote({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center text-sm">
      <p>No pudimos cargar esto. {(error as Error)?.message?.includes("fetch") ? "Revisa tu conexión." : ""}</p>
      {retry && <Button variant="outline" className="mt-3" onClick={retry}>Reintentar</Button>}
    </div>
  );
}
