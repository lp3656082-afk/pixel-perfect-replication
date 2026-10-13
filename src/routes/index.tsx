import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaImage } from "@/components/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nuestra historia · Luis & Jeisy" },
      { name: "description", content: "Un espacio privado para nuestra historia de amor." },
      { property: "og:title", content: "Nuestra historia" },
      { property: "og:description", content: "Un espacio privado y especial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const { data } = useQuery({
    queryKey: ["welcome"],
    queryFn: async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return { signedIn: false as const };
      const { data: settings } = await supabase.from("settings").select("*").maybeSingle();
      return { signedIn: true as const, settings };
    },
  });
  const settings = data?.signedIn ? data.settings : null;
  const his = settings?.his_name ?? "Luis";
  const her = settings?.her_name ?? "Jeisy";

  const open = () => {
    setOpening(true);
    setTimeout(() => navigate({ to: data?.signedIn ? "/inicio" : "/auth" }), 700);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {[...Array(14)].map((_, i) => (
        <span key={i} aria-hidden className="absolute h-1 w-1 animate-twinkle rounded-full bg-gold"
          style={{ top: `${(i * 37) % 95}%`, left: `${(i * 53) % 97}%`, animationDelay: `${i * 0.4}s` }} />
      ))}
      <article className={`paper relative w-full max-w-md animate-unfold rounded-sm p-8 text-center shadow-soft transition duration-700 md:p-12 ${opening ? "scale-95 opacity-0" : ""}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-wine-gradient" aria-hidden />
        {settings?.hero_photo_path && (
          <div className="mx-auto mb-6 w-48 rotate-[-2deg] bg-card p-2 pb-6 shadow-polaroid">
            <MediaImage path={settings.hero_photo_path} alt={`${his} y ${her}`} className="aspect-square w-full" />
          </div>
        )}
        <p className="font-display text-xl italic text-muted-foreground">
          {settings?.welcome_message ?? `Tengo algo que hice pensando en ti, ${her}`}
        </p>
        <h1 className="mt-6 flex items-center justify-center gap-3 font-script text-6xl text-wine">
          {his} <Heart className="h-6 w-6 fill-primary text-primary" aria-label="y" /> {her}
        </h1>
        <p className="mt-6 text-sm text-muted-foreground">Entre millones de personas, qué bonito coincidir contigo.</p>
        <Button onClick={open} size="lg" className="mt-8 rounded-full bg-wine-gradient px-8 shadow-soft">
          Abrir nuestro mundo
        </Button>
        {data && !data.signedIn && <p className="mt-4 text-xs text-muted-foreground">Este espacio es privado. Necesitarás iniciar sesión.</p>}
      </article>
    </main>
  );
}
