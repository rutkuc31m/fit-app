/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    // Dynamic semantic colors used in Checkin.jsx (field-specific coloring)
    ...["lime", "coral", "amber", "cyan"].flatMap((c) => [
      `text-${c}`, `bg-${c}`, `border-${c}`, `accent-${c}`
    ])
  ],
  theme: {
    extend: {
      colors: {
        // structure
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

        // semantic accents
        lime:    "#d4ff3a", // muscle / protein / target / achieved
        limed:   "#9bc41a",
        coral:   "#ff4d6d", // heart / cardio / loss / effort
        corald:  "#c42348",
        amber:   "#ffb454", // energy / fuel / present / calories
        amberd:  "#c47f20",
        cyan:    "#5ec8ff", // hydration / time / recovery
        cyand:   "#2b8fc9",

        // system
        warn:    "#ff7a3d",
        danger:  "#ff3d3d",

        // legacy aliases (remove after migration)
        signal:  "#d4ff3a",
        signald: "#9bc41a",
        cool:    "#5ec8ff"
      },
      fontFamily: {
        mono:    ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans:    ["'Bricolage Grotesque'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Fraunces'", "'Bricolage Grotesque'", "Georgia", "serif"]
      },
      borderRadius: { xl: "14px", lg: "10px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,255,58,.08), 0 0 60px -20px rgba(212,255,58,.5), inset 0 1px 0 rgba(255,255,255,.04)"
      }
    }
  },
  plugins: []
};
