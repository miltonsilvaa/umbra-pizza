/** Mesma paleta do painel web (frontend/src/app/globals.css). */
export const colors = {
  background: "#09090B",
  surface: "#1D1D2E",
  surfaceHover: "#26263A",
  line: "#2C2C42",
  brand: "#7C3AED",
  brandPressed: "#6D28D9",
  success: "#3FFFA3",
  warning: "#FBA92C",
  foreground: "#FAFAFA",
  muted: "#A1A1AA",
} as const;

export const radius = { sm: 8, md: 12, lg: 16 } as const;

/** Altura mínima de toque — garçom usa o app em pé, com pressa. */
export const TOUCH_HEIGHT = 52;
