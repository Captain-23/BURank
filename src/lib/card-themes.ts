export const CARD_THEMES = {
  classic: {
    label: "Classic",
    background: "#18181b",
    border: "#3f3f46",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    labelText: "#71717a",
    dim: "#52525b",
  },
  "velvet-red": {
    label: "Velvet Red",
    background: "#241317",
    border: "#5a2733",
    text: "#fff1f2",
    muted: "#f2a8b5",
    labelText: "#d77a8e",
    dim: "#9c4b5b",
  },
  "sea-blue": {
    label: "Sea Blue",
    background: "#0d2029",
    border: "#1e5266",
    text: "#e6f7ff",
    muted: "#9dd6e8",
    labelText: "#68abc0",
    dim: "#417386",
  },
  evergreen: {
    label: "Evergreen",
    background: "#10211b",
    border: "#285442",
    text: "#ecfdf5",
    muted: "#a7d7c0",
    labelText: "#76b695",
    dim: "#4e8068",
  },
  "sunset-gold": {
    label: "Sunset Gold",
    background: "#281b14",
    border: "#684326",
    text: "#fff7ed",
    muted: "#f2c18f",
    labelText: "#d99a5d",
    dim: "#99683e",
  },
} as const;

export type CardTheme = keyof typeof CARD_THEMES;
export const DEFAULT_CARD_THEME: CardTheme = "classic";

export function isCardTheme(value: string): value is CardTheme {
  return value in CARD_THEMES;
}
