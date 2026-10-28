/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0f131d',
        'surface-dim': '#0a0d16',
        'surface-bright': '#353944',
        'surface-container-lowest': '#060910',
        'surface-container-low': '#111622',
        'surface-container': '#181f2f',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2e384f',
        primary: '#38bdf8',
        'primary-container': '#0369a1',
        'on-primary': '#082f49',
        tertiary: '#f87171',
        'tertiary-container': '#991b1b',
        secondary: '#c084fc',
        'secondary-container': '#6b21a8',
        outline: '#64748b',
        'outline-variant': '#334155',
        'on-surface': '#f1f5f9',
        'on-surface-variant': '#94a3b8',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'wolf-red': '#ef4444',
        'village-blue': '#38bdf8',
        'witch-purple': '#c084fc',
        'amber-glow': '#f59e0b',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
        space: ['Space Grotesk', 'monospace'],
        game: ['Rajdhani', 'sans-serif'],
        display: ['Orbitron', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
