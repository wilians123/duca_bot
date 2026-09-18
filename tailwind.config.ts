import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

// Tokens del sistema de diseño ducas-bot-ui.html
// Restaurados los borderRadius estándar de Tailwind + tokens del boceto añadidos.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Tokens del boceto ducas-bot-ui.html ──
        ink: {
          DEFAULT: "#0F1C33",
          2: "#31415C",
          3: "#64748B",
        },
        "line-color": {
          DEFAULT: "#DCE3EE",
          soft: "#EAEFF6",
        },
        "surface-ui": {
          DEFAULT: "#FFFFFF",
          2: "#F5F7FC",
          3: "#EEF1F8",
        },
        "app-bg": "#F2F5FA",
        "brand-primary": {
          DEFAULT: "#4F46E5",
          ink: "#372FB5",
          soft: "#ECEBFD",
        },
        "brand-teal": {
          DEFAULT: "#0E7C91",
          soft: "#E1F3F7",
        },
        "brand-ok": {
          DEFAULT: "#0F9D6E",
          soft: "#E3F6EF",
        },
        "brand-warn": {
          DEFAULT: "#B4700B",
          soft: "#FBF0DC",
        },
        "brand-danger": {
          DEFAULT: "#C4304C",
          soft: "#FBE8EC",
        },
        // ── Tokens legacy (conservados para compatibilidad con los componentes anteriores) ──
        "inverse-primary": "#b7c4fe",
        "surface-variant": "#e4e2e2",
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
        "on-primary-container": "#929fd7",
        "on-surface": "#1b1c1c",
        error: "#ba1a1a",
        secondary: "#00639b",
        "inverse-surface": "#303031",
        "surface-container-high": "#e9e8e7",
        "primary-fixed": "#dce1ff",
        "on-secondary-container": "#004b77",
        "on-background": "#1b1c1c",
        "surface-container-low": "#f5f3f3",
        "primary-container": "#283566",
        "surface-dim": "#dbdad9",
        "on-primary": "#ffffff",
        "surface-bright": "#fbf9f8",
        "on-error": "#ffffff",
        "on-primary-fixed": "#071748",
        "outline-variant": "#c6c5d0",
        "on-secondary": "#ffffff",
        "surface-container": "#efeded",
        "primary-fixed-dim": "#b7c4fe",
        "on-surface-variant": "#45464f",
        "inverse-on-surface": "#f2f0f0",
        "sieca-blue": "#3288C8",
        "sieca-gray-bg": "#F8F8F8",
      },
      // ── borderRadius — Tailwind estándar restaurado ──
      // (Quitados los overrides incorrectos que pisaban lg/xl/full)
      borderRadius: {
        "r-sm": "6px",
        "r-md": "10px",
        "r-lg": "14px",
        "r-xl": "20px",
      },
      spacing: {
        gutter: "1.5rem",
        "container-margin": "2rem",
        "field-stack": "1rem",
        "section-gap": "2.5rem",
        sidebar: "272px",
        "sidebar-min": "76px",
        topbar: "60px",
      },
      fontFamily: {
        // Tipografías del boceto (prioridad)
        sans: ['"Fira Sans"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        mono: ['"Fira Code"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        // Legacy
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
      boxShadow: {
        "sh-1": "0 1px 2px rgba(15,28,51,.06)",
        "sh-2": "0 4px 14px rgba(15,28,51,.08)",
        "sh-3": "0 18px 40px rgba(15,28,51,.16)",
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;
