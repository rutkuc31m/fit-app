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

        // semantic accents — Apple Fitness / iOS Health
        lime:    "#30d158", // green — achievement / muscle / protein / target
        limed:   "#248a3d",
        coral:   "#ff375f", // red/pink — loss / heart / cardio / effort (Move)
        corald:  "#c9254c",
        amber:   "#ff9f0a", // orange — energy / fuel / now / streak
        amberd:  "#c87009",
        cyan:    "#64d2ff", // cyan — hydration / time / recovery (Stand)
        cyand:   "#2ba4d6",

        // extra Apple system hues
        yellow:  "#ffd60a", // sun / energy-bright
        purple:  "#bf5af2", // sleep / mind
        blue:    "#0a84ff", // data / measurement

        // system states
        warn:    "#ff9500",
        danger:  "#ff453a",

        // legacy aliases (remapped to new green)
        signal:  "#30d158",
        signald: "#248a3d",
        cool:    "#64d2ff"
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
