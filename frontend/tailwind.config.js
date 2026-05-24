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
        // structure — uncodixfied graphite
        bg:       "#0f0f0f",
        bg2:      "#141414",
        surface:  "#1a1a1a",
        surface2: "#242424",
        line:     "#2f2f2f",
        line2:    "#3a3a3a",
        ink:      "#f5f5f5",
        ink2:     "#d1d1d1",
        mute:     "#8a8a8a",
        mute2:    "#5f5f5f",

        // semantic accents — calm and functional
        lime:    "#00d4aa",
        limed:   "#00a383",
        coral:   "#ff6b9d",
        corald:  "#d94f7f",
        amber:   "#d9a441",
        amberd:  "#ad7f25",
        cyan:    "#9a9a9a",
        cyand:   "#737373",

        // extra hues
        yellow:  "#d9a441",
        purple:  "#9b8ac5",
        blue:    "#8a8a8a",

        // system states
        warn:    "#d9a441",
        danger:  "#ff6b9d",

        // legacy aliases
        signal:  "#00d4aa",
        signald: "#00a383",
        cool:    "#9a9a9a"
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans:    ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Inter Tight'", "'Inter'", "system-ui", "-apple-system", "sans-serif"]
      },
      borderRadius: { xl: "10px", lg: "8px", "2xl": "14px" },
      boxShadow: {
        glow: "0 2px 8px rgba(0,0,0,.12)"
      }
    }
  },
  plugins: []
};
