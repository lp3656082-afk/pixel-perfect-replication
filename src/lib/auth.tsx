import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Membership = { userId: string; email?: string; name?: string; role: "admin" | "collaborator" | null };

export function useMembership() {
  return useQuery({
    queryKey: ["membership"],
    queryFn: async (): Promise<Membership | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle(),
      ]);
      const role = roles?.some((r) => r.role === "admin") ? "admin" : roles?.length ? "collaborator" : null;
      return { userId: u.user.id, email: u.user.email, name: prof?.display_name, role };
    },
  });
}

export const INVITE_KEY = "nh-invite-token";
