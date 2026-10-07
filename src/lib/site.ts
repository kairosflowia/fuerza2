export const site = {
  name: "FUERZA",
  description: "Obrador de masa madre",
  locale: "es_ES",
} as const;

/** Datos de contacto públicos (los mismos que ya mostraba el pie de página). */
export const contact = {
  phone: "+34 697 697 697",
  email: "hola@fuerza.com",
  location: "Avilés, Asturias",
} as const;

/**
 * Perfiles sociales. Las URL reales aún no están confirmadas: mientras el
 * href sea "#" el enlace se muestra igual que antes, sin inventar perfiles.
 */
export const socialProfiles = [
  { network: "instagram", label: "Instagram", href: "#" },
  { network: "facebook", label: "Facebook", href: "#" },
  { network: "youtube", label: "YouTube", href: "#" },
  { network: "tiktok", label: "TikTok", href: "#" },
] as const;
