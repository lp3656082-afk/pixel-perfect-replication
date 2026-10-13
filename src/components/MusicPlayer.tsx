import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Volume2, VolumeX } from "lucide-react";

/** Discreet player. Starts only when the user presses play. Supports direct audio URLs or YouTube/Spotify embeds. */
export function MusicPlayer({ url }: { url?: string | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.6);
  const [muted, setMuted] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  useEffect(() => { if (ref.current) { ref.current.volume = vol; ref.current.muted = muted; } }, [vol, muted]);
  if (!url) return null;
  const embed = toEmbed(url);

  if (embed) {
    return (
      <div className="fixed bottom-4 right-4 z-[600]">
        {showEmbed && <iframe title="Nuestra canción" src={embed} className="mb-2 h-20 w-72 rounded-xl shadow-soft" allow="autoplay; encrypted-media" />}
        <button onClick={() => setShowEmbed(!showEmbed)} className="glass ml-auto flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-wine shadow-soft">
          <Music className="h-4 w-4" /> {showEmbed ? "Ocultar canción" : "Nuestra canción"}
        </button>
      </div>
    );
  }

  return (
    <div className="glass fixed bottom-4 right-4 z-[600] flex items-center gap-2 rounded-full border px-3 py-2 shadow-soft">
      <audio ref={ref} src={url} loop preload="none" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button aria-label={playing ? "Pausar canción" : "Reproducir nuestra canción"} className="rounded-full bg-primary p-2 text-primary-foreground"
        onClick={() => (playing ? ref.current?.pause() : ref.current?.play().catch(() => {}))}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button aria-label={muted ? "Activar sonido" : "Silenciar"} onClick={() => setMuted(!muted)} className="p-1 text-wine">
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input aria-label="Volumen" type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-20 accent-primary" />
    </div>
  );
}

function toEmbed(url: string) {
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1`;
  const sp = url.match(/open\.spotify\.com\/(track|playlist|album)\/(\w+)/);
  if (sp) return `https://open.spotify.com/embed/${sp[1]}/${sp[2]}`;
  return null;
}
