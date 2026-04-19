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
        // structure — iOS dark
        bg:       "#000000",
        bg2:      "#0a0a0b",
        surface:  "#1c1c1e",
        surface2: "#2c2c2e",
        line:     "#38383a",
        line2:    "#48484a",
        ink:      "#f5f5f7",
        ink2:     "#a1a1a6",
        mute:     "#6d6d70",
        mute2:    "#48484a",

        // semantic accents — warm dawn palette
        lime:    "#4ade80", // fresh emerald — achievement / muscle / protein / target
        limed:   "#22c55e",
        coral:   "#fb7185", // rose — loss / heart / cardio / effort
        corald:  "#e11d48",
        amber:   "#fbbf24", // gold — energy / fuel / now / streak
        amberd:  "#d97706",
        cyan:    "#7dd3fc", // sky — hydration / time / recovery
        cyand:   "#38bdf8",

        // extra hues
        yellow:  "#fde047", // sun
        purple:  "#c4b5fd", // lavender / sleep
        blue:    "#60a5fa", // data / measurement

        // system states
        warn:    "#fbbf24",
        danger:  "#fb7185",

        // legacy aliases
        signal:  "#4ade80",
        signald: "#22c55e",
        cool:    "#7dd3fc"
      },
      fontFamily: {
        mono:    ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans:    ["'Bricolage Grotesque'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Fraunces'", "'Bricolage Grotesque'", "Georgia", "serif"]
      },
      borderRadius: { xl: "16px", lg: "12px", "2xl": "22px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(48,209,88,.12), 0 20px 60px -20px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)"
      }
    }
  },
  plugins: []
};
