"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "../ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const eligible = useRef(false);

  useEffect(() => {
    const visited = Number(localStorage.getItem("fuerza-visits") ?? "0") + 1;
    localStorage.setItem("fuerza-visits", String(visited));
    eligible.current = visited > 1;

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      if (eligible.current) setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!installEvent) return null;

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <aside className="install-prompt" aria-label="Instalar FUERZA">
      <p><strong>Lleva FUERZA contigo.</strong> Puedes instalar este portal.</p>
      <Button variant="secondary" onClick={install}>Instalar</Button>
    </aside>
  );
}

export function IOSInstallInstructions({ show = false }: { show?: boolean }) {
  if (!show) return null;

  return (
    <aside className="alert alert--information" aria-label="Instalar FUERZA en iPhone o iPad">
      <p>Pulsa Compartir y después Añadir a pantalla de inicio.</p>
    </aside>
  );
}
