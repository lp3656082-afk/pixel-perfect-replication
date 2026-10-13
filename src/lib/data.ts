import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type TableName = Exclude<keyof Tables, "profiles" | "user_roles" | "invites">;
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];

export const ORDER: Record<TableName, { col: string; asc: boolean }> = {
  settings: { col: "id", asc: true },
  albums: { col: "created_at", asc: true },
  places: { col: "visited_on", asc: false },
  memories: { col: "happened_on", asc: true },
  photos: { col: "created_at", asc: false },
  letters: { col: "written_on", asc: false },
  love_notes: { col: "created_at", asc: false },
  special_dates: { col: "on_date", asc: true },
  future_items: { col: "created_at", asc: false },
};

export function useList<T extends TableName>(table: T) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const o = ORDER[table];
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(o.col, { ascending: o.asc, nullsFirst: false });
      if (error) throw error;
      return data as unknown as Row<T>[];
    },
  });
}

export function useSave<T extends TableName>(table: T, label = "Guardado") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Insert<T> & { id?: string }) => {
      const { id, ...rest } = values as Record<string, unknown>;
      const q = id
        ? supabase.from(table).update(rest as never).eq("id", id as never)
        : supabase.from(table).insert(rest as never);
      const { data, error } = await q.select().single();
      if (error) throw error;
      return data as unknown as Row<T>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success(label);
    },
    onError: (e: Error) => toast.error(friendly(e)),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast.success("Eliminado");
    },
    onError: (e: Error) => toast.error(friendly(e)),
  });
}

export function friendly(e: { message?: string }) {
  const m = e.message ?? "";
  if (/row-level security|permission/i.test(m)) return "No tienes permiso para hacer esto.";
  if (/fetch|network/i.test(m)) return "Sin conexión. Revisa tu internet e inténtalo de nuevo.";
  return m || "Algo salió mal.";
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

/** Signed URL (1h) for a private file in the media bucket. */
export function useMediaUrl(path?: string | null) {
  return useQuery({
    queryKey: ["media-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("media").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

/** Resize images in the browser before upload so pages load fast. */
export async function optimizeImage(file: File, max = 2000): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const body = isVideo ? file : await optimizeImage(file);
  const ext = body.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, body, { contentType: body.type || file.type, upsert: false });
  if (error) throw error;
  return path;
}
