import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a1321",
        navy: "#0f1e35",
        emerald: "#113b34",
        gold: "#d5b36a",
        parchment: "#f4ecdc",
        blush: "#c66d63"
      },
      fontFamily: {
        display: ["var(--font-cormorant)"],
        body: ["var(--font-manrope)"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(213,179,106,0.2), 0 20px 70px rgba(0,0,0,0.35)",
        panel: "0 20px 50px rgba(5,14,30,0.22)"
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 15% 20%, rgba(213,179,106,0.11), transparent 45%), radial-gradient(circle at 85% 10%, rgba(198,109,99,0.09), transparent 38%), radial-gradient(circle at 50% 100%, rgba(17,59,52,0.16), transparent 55%)"
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        sheen: "sheen 7s linear infinite",
        rise: "rise 700ms ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        sheen: {
          "0%": { transform: "translateX(-120%) rotate(12deg)" },
          "100%": { transform: "translateX(220%) rotate(12deg)" }
        },
        rise: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
