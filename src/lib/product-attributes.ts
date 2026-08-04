export const productAttributeGroups = [
  {
    key: "harinas",
    label: "Tipos de harina y base",
    attributes: [
      { code: "masa_madre", label: "100% Masa Madre" },
      { code: "harina_integral", label: "Harina Integral / Grano Entero" },
      { code: "harina_centeno", label: "Harina de Centeno" },
      { code: "harina_espelta", label: "Harina de Espelta / Granos Antiguos" },
      { code: "harina_piedra", label: "Harina Molida a la Piedra" },
      { code: "multicereales", label: "Mezcla Multicereales / Semillas" },
    ],
  },
  {
    key: "dietas",
    label: "Dietas y estilo de vida",
    attributes: [
      { code: "vegano", label: "Apto para Veganos (sin ingredientes de origen animal)" },
      { code: "sin_lactosa", label: "Sin Lactosa (deslactosado / sin lácteos)" },
      { code: "sin_azucar", label: "Sin Azúcares Añadidos" },
      { code: "fermentacion_lenta", label: "Fermentación Lenta (mínimo 24h)" },
    ],
  },
] as const;

export const productAttributeCodes = productAttributeGroups.flatMap((group) => group.attributes.map((attribute) => attribute.code));
export type ProductAttributeCode = (typeof productAttributeCodes)[number];
