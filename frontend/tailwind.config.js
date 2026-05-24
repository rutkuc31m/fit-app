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
        // structure — matte command UI
        bg:       "#080806",
        bg2:      "#11100d",
        surface:  "#191713",
        surface2: "#242117",
        line:     "#342f24",
        line2:    "#50483a",
        ink:      "#fff8ea",
        ink2:     "#c9bea8",
        mute:     "#827866",
        mute2:    "#5f5547",

        // semantic accents — high contrast product palette
        lime:    "#b8ff2c",
        limed:   "#89d100",
        coral:   "#ff6b6b",
        corald:  "#e63e55",
        amber:   "#ffb000",
        amberd:  "#cf7b00",
        cyan:    "#2ee9d3",
        cyand:   "#00b8ae",

        // extra hues
        yellow:  "#f7e75b",
        purple:  "#b8a6ff",
        blue:    "#6bb7ff",

        // system states
        warn:    "#ffb000",
        danger:  "#ff6b6b",

        // legacy aliases
        signal:  "#b8ff2c",
        signald: "#89d100",
        cool:    "#2ee9d3"
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans:    ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Inter Tight'", "'Inter'", "system-ui", "-apple-system", "sans-serif"]
      },
      borderRadius: { xl: "10px", lg: "8px", "2xl": "14px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(184,255,44,.12), 0 20px 60px -20px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04)"
      }
    }
  },
  plugins: []
};
