import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { INVITE_KEY } from "@/lib/auth";
import { Loading } from "@/components/kit";

export const Route = createFileRoute("/invitacion/$token")({
  head: () => ({
    meta: [
      { title: "Invitación · Nuestra historia" },
      { name: "description", content: "Tienes una invitación especial." },
      { property: "og:title", content: "Una invitación especial" },
      { property: "og:description", content: "Alguien hizo algo pensando en ti." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Invite,
});

function Invite() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (/^[a-f0-9]{48}$/.test(token)) localStorage.setItem(INVITE_KEY, token);
    navigate({ to: "/inicio" });
  }, [token, navigate]);
  return <Loading />;
}
