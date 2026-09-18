import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

// Tokens extraidos del <script id="tailwind-config"> de las plantillas
// estaticas DUCA-T / SIECA. Se fusionan con el resto de tu config existente:
// si tu proyecto ya tiene un tailwind.config.ts, copia solo el bloque
// `theme.extend` de aqui dentro del tuyo (no reemplaces el archivo completo
// si ya tienes otras extensiones, plugins, o rutas de `content`).
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "inverse-primary": "#b7c4fe",
        "surface-variant": "#e4e2e2",
        primary: "#101f4f",
        "on-error-container": "#93000a",
        outline: "#767680",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed": "#cee5ff",
        "surface-container-highest": "#e4e2e2",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#001d33",
        "tertiary-container": "#363839",
        "error-container": "#ffdad6",
        "secondary-container": "#70bcff",
        "on-tertiary-fixed": "#1a1c1c",
        "on-primary-container": "#929fd7",
        "on-surface": "#1b1c1c",
        "on-tertiary-fixed-variant": "#454747",
        "on-tertiary-container": "#a0a1a2",
        error: "#ba1a1a",
        secondary: "#00639b",
        background: "#fbf9f8",
        "inverse-surface": "#303031",
        "surface-container-high": "#e9e8e7",
        "primary-fixed": "#dce1ff",
        "on-secondary-container": "#004b77",
        "on-background": "#1b1c1c",
        "secondary-fixed-dim": "#96ccff",
        tertiary: "#212323",
        "surface-container-low": "#f5f3f3",
        "primary-container": "#283566",
        "surface-tint": "#4f5c8f",
        "surface-dim": "#dbdad9",
        "on-primary": "#ffffff",
        "on-secondary-fixed-variant": "#004a76",
        "surface-bright": "#fbf9f8",
        "on-error": "#ffffff",
        "on-primary-fixed": "#071748",
        "outline-variant": "#c6c5d0",
        "on-secondary": "#ffffff",
        surface: "#fbf9f8",
        "tertiary-fixed-dim": "#c6c6c7",
        "surface-container": "#efeded",
        "primary-fixed-dim": "#b7c4fe",
        "on-surface-variant": "#45464f",
        "tertiary-fixed": "#e2e2e2",
        "on-primary-fixed-variant": "#374476",
        "inverse-on-surface": "#f2f0f0",
        "sieca-blue": "#3288C8",
        "sieca-gray-bg": "#F8F8F8",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
      },
      spacing: {
        gutter: "1.5rem",
        "container-margin": "2rem",
        "field-stack": "1rem",
        "section-gap": "2.5rem",
      },
      fontFamily: {
        "table-header": ["Open Sans", "sans-serif"],
        "body-sm": ["Open Sans", "sans-serif"],
        "button-text": ["Open Sans", "sans-serif"],
        "label-bold": ["Open Sans", "sans-serif"],
        "body-md": ["Open Sans", "sans-serif"],
        "step-indicator": ["Open Sans", "sans-serif"],
      },
      fontSize: {
        "table-header": ["13px", { lineHeight: "18px", fontWeight: "600" }],
        "body-sm": ["12px", { lineHeight: "18px", fontWeight: "400" }],
        "button-text": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "label-bold": ["14px", { lineHeight: "20px", fontWeight: "700" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "step-indicator": ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;
