import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookHeart, CalendarHeart, Gift, Images, Mail, MapPin, Shuffle, Sparkles } from "lucide-react";
import { useList, useSettings } from "@/lib/data";
import { daysUntil, elapsed, fmtDate, nextOccurrence } from "@/lib/dates";
import { MediaImage, Placeholder } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio · Nuestra historia" },
      { name: "description", content: "El corazón de nuestra historia." },
      { property: "og:title", content: "Inicio · Nuestra historia" },
      { property: "og:description", content: "El corazón de nuestra historia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const SECTIONS = [
  { to: "/historia", label: "Nuestra historia", icon: BookHeart },
  { to: "/recuerdos", label: "Nuestros recuerdos", icon: Images },
  { to: "/mapa", label: "Nuestro mapa", icon: MapPin },
  { to: "/cartas", label: "Cartas para ti", icon: Mail },
  { to: "/fechas", label: "Fechas especiales", icon: CalendarHeart },
] as const;

function Home() {
  const { data: s } = useSettings();
  const { data: memories = [] } = useList("memories");
  const { data: photos = [] } = useList("photos");
  const { data: dates = [] } = useList("special_dates");
  const [now, setNow] = useState(() => new Date());
  const [random, setRandom] = useState<(typeof memories)[number] | null>(null);
  const [surprise, setSurprise] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const start = s?.started_at ? new Date(s.started_at) : null;
  const tz = s?.timezone ?? "America/Bogota";
  const e = start ? elapsed(start, now, tz) : null;

  const upcoming = useMemo(() => {
    const list = dates.map((d) => ({ ...d, next: nextOccurrence(d.on_date, d.repeats_yearly) }));
    if (start) list.push({ id: "aniv", title: "Nuestro aniversario", kind: "aniversario", on_date: s!.started_at!.slice(0, 10), repeats_yearly: true, notes: null, next: nextOccurrence(start.toISOString().slice(0, 10), true) } as never);
    return list.map((d) => ({ ...d, days: daysUntil(d.next) })).filter((d) => d.days >= 0).sort((a, b) => a.days - b.days).slice(0, 3);
  }, [dates, start, s]);

  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const onThisDay = memories.filter((m) => m.happened_on.slice(5) === md && m.happened_on.slice(0, 4) !== String(now.getFullYear()));
  const isAnniv = start && start.toISOString().slice(5, 10) === md;
  const photoFor = (id: string) => photos.find((p) => p.memory_id === id)?.storage_path;

  return (
    <main>
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 md:grid-cols-2 md:pt-16">
        <div className="animate-rise">
          <div className="relative mx-auto w-full max-w-sm rotate-[-2deg] bg-card p-3 pb-10 shadow-polaroid">
            {s?.hero_photo_path
              ? <MediaImage path={s.hero_photo_path} alt={`${s.his_name} y ${s.her_name}`} className="aspect-[4/5] w-full" />
              : <Placeholder className="aspect-[4/5] w-full" label="Sube nuestra foto favorita desde Administración" />}
            <p className="absolute bottom-2 left-0 right-0 text-center font-script text-2xl text-wine">nosotros</p>
          </div>
        </div>
        <div className="animate-rise text-center md:text-left" style={{ animationDelay: ".2s" }}>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Nuestra historia</p>
          <h1 className="mt-2 font-script text-7xl text-wine md:text-8xl">{s?.his_name ?? "Luis"} & {s?.her_name ?? "Jeisy"}</h1>
          {start ? (
            <>
              <p className="mt-2 font-display text-xl italic">Juntos desde el {fmtDate(s!.started_at)}</p>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-live="polite">
                {[["años", e!.years], ["meses", e!.months], ["días", e!.days], ["horas", e!.hours], ["min", e!.minutes], ["seg", e!.seconds]].map(([l, v]) => (
                  <div key={l} className="rounded-xl border bg-card/70 py-3 text-center">
                    <div className="font-display text-3xl text-wine tabular-nums">{v}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{e!.totalDays.toLocaleString("es-CO")} días eligiéndonos.</p>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
              Comenzamos un 30 de julio. Configura el año exacto en Administración para activar el contador.
            </p>
          )}
        </div>
      </section>

      {(isAnniv || onThisDay.length > 0) && (
        <section className="mx-auto mt-14 max-w-4xl px-4">
          <div className="rounded-2xl bg-wine-gradient p-6 text-primary-foreground shadow-soft">
            <p className="flex items-center gap-2 font-display text-2xl"><Sparkles className="h-5 w-5" />{isAnniv ? "¡Feliz aniversario!" : "Un día como hoy"}</p>
            {onThisDay.map((m) => <p key={m.id} className="mt-2">{fmtDate(m.happened_on)} — {m.title}</p>)}
          </div>
        </section>
      )}

      <blockquote className="mx-auto mt-20 max-w-3xl px-6 text-center font-display text-2xl italic leading-relaxed text-wine md:text-3xl">
        “Nuestra historia no es perfecta porque no tenga dificultades, sino porque es nuestra y seguimos escribiéndola juntos.”
      </blockquote>

      <section className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-3 px-4 md:grid-cols-5">
        {SECTIONS.map(({ to, label, icon: I }) => (
          <Link key={to} to={to} className="group rounded-2xl border bg-card/70 p-5 text-center transition hover:-translate-y-1 hover:shadow-soft">
            <I className="mx-auto h-6 w-6 text-gold transition group-hover:text-primary" aria-hidden />
            <span className="mt-3 block font-display text-lg">{label}</span>
          </Link>
        ))}
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-4 px-4 md:grid-cols-3">
        <div className="paper rounded-2xl p-6 shadow-soft md:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Un pequeño recordatorio</p>
          <p className="mt-3 font-display text-2xl italic">{s?.reminder_phrase || "Entre millones de personas, qué bonito coincidir contigo."}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="rounded-full" disabled={!memories.length} onClick={() => setRandom(memories[Math.floor(Math.random() * memories.length)])}>
              <Shuffle /> Recuérdame un momento bonito
            </Button>
            <Button variant="outline" className="rounded-full bg-card" onClick={() => setSurprise(true)}><Gift /> Un mensaje sorpresa</Button>
          </div>
          {!memories.length && <p className="mt-2 text-xs text-muted-foreground">Agrega recuerdos en “Nuestra historia” para usar este botón.</p>}
        </div>
        <div className="rounded-2xl border bg-card/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Lo que viene</p>
          {upcoming.length ? upcoming.map((d) => (
            <div key={d.id} className="mt-4 flex items-baseline justify-between gap-2">
              <span className="font-display text-lg">{d.title}</span>
              <span className="shrink-0 text-sm text-wine">{d.days === 0 ? "¡Hoy!" : `en ${d.days} días`}</span>
            </div>
          )) : <p className="mt-3 text-sm text-muted-foreground">Sin fechas próximas. <Link to="/fechas" className="underline">Añadir una</Link></p>}
        </div>
      </section>

      <Dialog open={!!random} onOpenChange={(o) => !o && setRandom(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle className="font-display text-3xl text-wine">{random?.title}</DialogTitle>
          {random && <MediaImage path={photoFor(random.id)} alt={random.title} className="aspect-[4/3] w-full rounded-lg" />}
          <p className="text-sm text-gold">{fmtDate(random?.happened_on)}</p>
          {random?.description && <p className="whitespace-pre-line">{random.description}</p>}
        </DialogContent>
      </Dialog>
      <Dialog open={surprise} onOpenChange={setSurprise}>
        <DialogContent className="paper max-w-md text-center">
          <DialogTitle className="sr-only">Mensaje sorpresa</DialogTitle>
          <Sparkles className="mx-auto h-8 w-8 animate-twinkle text-gold" />
          <p className="animate-unfold font-display text-2xl italic text-wine">{s?.surprise_message || "Te quiero más de lo que estas palabras alcanzan a decir."}</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
