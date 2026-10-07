"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon } from "@/components/ui/icons";

export function CheckoutTopBar() {
  const router = useRouter();

  return (
    <header className="catalog-topbar">
      <button type="button" className="catalog-topbar__back" aria-label="Volver a la pantalla anterior" onClick={() => router.back()}>
        <ArrowLeftIcon />
      </button>
      <Link href="/" className="catalog-topbar__logo" aria-label="FUERZA, volver al inicio">
        <Image src="/illustrations/fuerza-stacked.svg" alt="FUERZA, obrador de masa madre" width={163} height={80} priority />
      </Link>
      <span className="catalog-topbar__spacer" aria-hidden="true" />
    </header>
  );
}
