"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { Button, Card } from "@/components/ui";
import { Drawer } from "@/components/ui/dialog";

import { FamilyForm } from "./catalog-forms";

type Family = { id: string; name: string; slug: string; description: string | null; color_key: string; display_order: number; status: string };

export function FamilyManager({ families }: { families: Family[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const handleSaved = useCallback(() => router.refresh(), [router]);

  return (
    <>
      <Button ref={triggerRef} variant="secondary" onClick={() => setOpen(true)}>Categorías</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Categorías" returnFocusRef={triggerRef} className="family-manager-drawer">
        <div className="family-manager">
          {families.map((family) => (
            <Card key={family.id}>
              <details>
                <summary><strong>{family.name}</strong> · {family.status}</summary>
                <FamilyForm defaults={family} onSaved={handleSaved} />
              </details>
            </Card>
          ))}
          <h3>Nueva categoría</h3>
          <FamilyForm onSaved={handleSaved} />
        </div>
      </Drawer>
    </>
  );
}
