import type { Metadata } from "next";

import { DesignSystemDemo } from "./showcase";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
