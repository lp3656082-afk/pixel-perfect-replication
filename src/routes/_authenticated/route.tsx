import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, LockKeyhole, LogOut, Menu, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { INVITE_KEY, useMembership } from "@/lib/auth";
import { useSettings } from "@/lib/data";
import { Loading } from "@/components/kit";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Gate,
});

const NAV = [
  { to: "/inicio", label: "Inicio" },
  { to: "/historia", label: "Nuestra historia" },
  { to: "/recuerdos", label: "Recuerdos" },
  { to: "/mapa", label: "Mapa" },
  { to: "/cartas", label: "Cartas" },
  { to: "/fechas", label: "Fechas" },
  { to: "/futuro", label: "Futuro" },
] as const;

const signOut = () => supabase.auth.signOut().then(() => (window.location.href = "/"));

function Gate() {
  const { data: m, isLoading, error, refetch } = useMembership();
  if (isLoading) return <Loading />;
  if (error) return <div className="p-10 text-center"><Button onClick={() => refetch()}>Reintentar</Button></div>;
  if (!m?.role) return <Onboarding />;
  return <Shell isAdmin={m.role === "admin"} />;
}

function Onboarding() {
  const qc = useQueryClient();
  const token = typeof window !== "undefined" ? localStorage.getItem(INVITE_KEY) : null;
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: hasAdmin, isLoading } = useQuery({
    queryKey: ["has-admin"],
    queryFn: async () => (await supabase.rpc("has_admin")).data ?? true,
  });
  if (isLoading) return <Loading />;
  const mode = token ? "invite" : !hasAdmin ? "first" : "private";

  const go = async () => {
    if (!name.trim()) return toast.error("Escribe tu nombre.");
    setBusy(true);
    const { error } = mode === "invite"
      ? await supabase.rpc("redeem_invite", { p_token: token!, p_name: name.trim() })
      : await supabase.rpc("claim_first_admin", { p_name: name.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    localStorage.removeItem(INVITE_KEY);
    qc.invalidateQueries();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="paper w-full max-w-md animate-rise rounded-sm p-10 text-center shadow-soft">
        <LockKeyhole className="mx-auto h-8 w-8 text-gold" aria-hidden />
        {mode === "private" ? (
          <>
            <h1 className="mt-4 text-4xl text-wine">Este espacio es privado</h1>
            <p className="mt-3 text-muted-foreground">Solo se puede entrar con una invitación. Si te la enviaron, abre de nuevo el enlace.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-4xl text-wine">{mode === "invite" ? "Tienes una invitación" : "Crea este espacio"}</h1>
            <p className="mt-3 text-muted-foreground">
              {mode === "invite" ? "Dinos cómo te llamas para entrar." : "Eres la primera persona aquí: serás quien administre la página."}
            </p>
            <Input className="mt-6 bg-card" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} aria-label="Tu nombre" />
            <Button className="mt-4 w-full rounded-full" disabled={busy} onClick={go}>{busy ? "Un momento…" : "Entrar"}</Button>
          </>
        )}
        <button onClick={signOut} className="mt-6 text-sm text-muted-foreground underline">Cerrar sesión</button>
      </div>
    </main>
  );
}

function Shell({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: s } = useSettings();
  return (
    <div className="min-h-screen pb-24">
      <header className="glass sticky top-0 z-[500] border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/inicio" className="flex items-center gap-2 font-script text-2xl text-wine">
            {s?.his_name ?? "Luis"} <Heart className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden /> {s?.her_name ?? "Jeisy"}
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-wine" activeProps={{ className: "bg-secondary text-wine" }}>{n.label}</Link>
            ))}
            {isAdmin && <Link to="/admin" aria-label="Panel de administración" className="ml-1 rounded-full p-2 text-muted-foreground hover:text-wine"><Settings className="h-4 w-4" /></Link>}
            <button onClick={signOut} aria-label="Cerrar sesión" className="rounded-full p-2 text-muted-foreground hover:text-wine"><LogOut className="h-4 w-4" /></button>
          </nav>
          <button className="rounded-full p-2 lg:hidden" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <nav className="border-t px-4 pb-4 lg:hidden" aria-label="Menú móvil" onClick={() => setOpen(false)}>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={`block rounded-lg px-3 py-3 font-display text-xl ${path === n.to ? "bg-secondary text-wine" : ""}`}>{n.label}</Link>
            ))}
            {isAdmin && <Link to="/admin" className="block rounded-lg px-3 py-3 font-display text-xl">Administración</Link>}
            <button onClick={signOut} className="block w-full rounded-lg px-3 py-3 text-left font-display text-xl text-muted-foreground">Cerrar sesión</button>
          </nav>
        )}
      </header>
      <Outlet />
      <MusicPlayer url={s?.song_url} />
    </div>
  );
}
