import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Nuestra historia" },
      { name: "description", content: "Acceso privado a nuestra historia." },
      { property: "og:title", content: "Entrar · Nuestra historia" },
      { property: "og:description", content: "Acceso privado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/inicio" }); });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres.");
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/inicio" });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/inicio" } });
        if (error) throw error;
        if (data.session) navigate({ to: "/inicio" });
        else setSent(true);
      }
    } catch (err) {
      const m = (err as Error).message;
      toast.error(/Invalid login/i.test(m) ? "Correo o contraseña incorrectos." : m);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error("No se pudo iniciar con Google.");
    if (r.redirected) return;
    navigate({ to: "/inicio" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="paper w-full max-w-sm animate-rise rounded-sm p-8 shadow-soft">
        <h1 className="text-center text-4xl text-wine">{mode === "in" ? "Bienvenida de vuelta" : "Crear acceso"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Este espacio es privado y solo para nosotros.</p>
        {sent ? (
          <p className="mt-8 text-center font-display text-lg italic">Te enviamos un correo. Confírmalo para entrar.</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div><Label htmlFor="em">Correo</Label><Input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card" /></div>
              <div><Label htmlFor="pw">Contraseña</Label><Input id="pw" type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-card" /></div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">{busy ? "Un momento…" : mode === "in" ? "Entrar" : "Crear cuenta"}</Button>
            </form>
            <Button variant="outline" onClick={google} className="mt-3 w-full rounded-full bg-card">Continuar con Google</Button>
            <button className="mt-6 w-full text-center text-sm text-accent-foreground underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "¿Primera vez? Crear cuenta" : "Ya tengo cuenta"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
