/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          950: '#0B1426',
          900: '#0F1B2E',
          800: '#162033',
          700: '#1C2A42',
          600: '#243552',
          500: '#2E4265',
        },
        accent: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5C',
          dark: '#E55A25',
        },
        status: {
          healthy: '#00D68F',
          warning: '#FFB800',
          critical: '#FF3D71',
          info: '#0095FF',
        }
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
