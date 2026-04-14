/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:       "#0c0e0d",
        bg2:      "#0f1213",
        surface:  "#15181a",
        surface2: "#1c2022",
        line:     "#2a2f33",
        line2:    "#363c40",
        ink:      "#e8ebe4",
        ink2:     "#a8afa6",
        mute:     "#6b7280",
        mute2:    "#4a5056",
        signal:   "#d4ff3a",
        signald:  "#9bc41a",
        warn:     "#ff7a3d",
        cool:     "#5ec8ff"
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["'Instrument Sans'", "system-ui", "-apple-system", "sans-serif"]
      },
      borderRadius: { xl: "14px", lg: "10px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,255,58,.08), 0 0 60px -20px rgba(212,255,58,.5), inset 0 1px 0 rgba(255,255,255,.04)"
      }
    }
  },
  plugins: []
};
