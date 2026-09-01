/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#121214',
          subtle: '#18181B',
          card: '#1A1A1A',
        },
        surface: {
          DEFAULT: '#222224',
          hover: '#2A2A2E',
          active: '#323236',
          border: '#2E2E34',
        },
        accent: {
          cyan: '#C5F5FA',
          amber: '#F8E5A5',
          white: '#FCFCFC',
          muted: '#8E8E93',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -3px rgba(197, 245, 250, 0.35)',
        'glow-amber': '0 0 25px -3px rgba(248, 229, 165, 0.35)',
        'glow-cone': '0 20px 45px -10px rgba(248, 229, 165, 0.25)',
      }
    },
  },
  plugins: [],
}
