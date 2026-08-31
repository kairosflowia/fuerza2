"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("admin route error", error);
  }, [error]);

  return (
    <ErrorState
      title="No hemos podido cargar esta sección"
      description={`Vuelve a intentarlo. Si el problema continúa, avisa al equipo con esta referencia: ${error.digest ?? "sin referencia"}.`}
      action={<Button onClick={reset}>Volver a intentarlo</Button>}
    />
  );
}
