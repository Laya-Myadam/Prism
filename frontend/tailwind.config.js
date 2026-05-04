/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Outfit'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Primary accent — electric cyan/blue (replaces green)
        prism: {
          50:  "#e8f8ff",
          100: "#c0edff",
          200: "#85d9ff",
          300: "#38bfff",
          400: "#00a8f0",
          500: "#0090d0",
          600: "#0072a8",
          700: "#005580",
          800: "#003d5c",
          900: "#002638",
          950: "#001520",
        },
        // UI surfaces — deep slate
        surface: {
          DEFAULT:   "#0f1319",   // page bg
          secondary: "#151b24",   // sidebar / navbar
          tertiary:  "#1c2535",   // cards
          elevated:  "#212d3d",   // hover states / elevated cards
          overlay:   "#263042",   // modals / popovers
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.07)",
          strong:  "rgba(255,255,255,0.13)",
          accent:  "rgba(0,168,240,0.3)",
        },
        ink: {
          DEFAULT:   "#f0f4f8",
          secondary: "#8a9bb0",
          tertiary:  "#546070",
          muted:     "#3a4a5a",
        },
        // Semantic
        success: { DEFAULT: "#22d3a0", dim: "rgba(34,211,160,0.12)" },
        warning: { DEFAULT: "#f59e0b", dim: "rgba(245,158,11,0.12)" },
        danger:  { DEFAULT: "#f43f5e", dim: "rgba(244,63,94,0.12)" },
        info:    { DEFAULT: "#38bfff", dim: "rgba(56,191,255,0.12)" },
      },
      borderRadius: {
        sm:  "6px",
        md:  "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.2)",
        hover:   "0 4px 24px rgba(0,0,0,0.4)",
        glow:    "0 0 20px rgba(0,168,240,0.2)",
        "glow-sm": "0 0 10px rgba(0,168,240,0.15)",
        focus:   "0 0 0 2px rgba(0,168,240,0.4)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast:   "120ms",
        base:   "200ms",
        slow:   "350ms",
        slower: "500ms",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in":     "fadeIn 0.25s ease forwards",
        "slide-up":    "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "slide-in":    "slideIn 0.25s ease forwards",
        "shimmer":     "shimmer 1.8s infinite",
        "glow-pulse":  "glowPulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        glowPulse: {
          "0%,100%": { opacity: "1", boxShadow: "0 0 8px rgba(0,168,240,0.3)" },
          "50%":     { opacity: "0.6", boxShadow: "0 0 20px rgba(0,168,240,0.6)" },
        },
      },
    },
  },
  plugins: [],
};