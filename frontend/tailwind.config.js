/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#121212",
        "surface-light": "rgba(255, 255, 255, 0.03)",
        primary: "#F9FAFB",
        secondary: "#9CA3AF",
        accent: "#06b6d4",
        "accent-glow": "rgba(6, 182, 212, 0.4)",
        "purple-neon": "#a855f7",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "rgba(255, 255, 255, 0.1)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon': '0 0 15px rgba(6, 182, 212, 0.5)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      animation: {
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s infinite alternate',
      },
      keyframes: {
        sparkle: {
          '0%, 100%': { opacity: 0, transform: 'scale(0)' },
          '50%': { opacity: 1, transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
