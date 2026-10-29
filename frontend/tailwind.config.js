/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          '"Cascadia Code"',
          '"Fira Code"',
          'monospace'
        ],
      },
      colors: {
        apple: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          pink: '#FF2D55',
          purple: '#AF52DE',
          teal: '#5AC8FA',
          indigo: '#5856D6',
          label: 'var(--apple-label, #000000)',
          secondary: 'var(--apple-secondary, rgba(60, 60, 67, 0.65))',
          card: 'var(--apple-card, #FFFFFF)',
          border: 'var(--apple-border, rgba(60, 60, 67, 0.15))',
          'bg-grouped': 'var(--apple-bg-grouped, #F2F2F7)',
          'fill-secondary': 'rgba(120, 120, 128, 0.16)',
          'fill-quaternary': 'rgba(120, 120, 128, 0.08)',
        },
        systemBlue: { DEFAULT: '#007AFF', dark: '#0A84FF' },
        systemGreen: { DEFAULT: '#34C759', dark: '#30D158' },
        systemRed: { DEFAULT: '#FF3B30', dark: '#FF453A' },
        systemOrange: { DEFAULT: '#FF9500', dark: '#FF9F0A' },
        systemPink: { DEFAULT: '#FF2D55', dark: '#FF375F' },
        systemPurple: { DEFAULT: '#AF52DE', dark: '#BF5AF2' },
        systemTeal: { DEFAULT: '#5AC8FA', dark: '#64D2FF' },
        systemIndigo: { DEFAULT: '#5856D6', dark: '#5E5CE6' },
        systemGray: '#8E8E93',
        systemGray2: { DEFAULT: '#AEAEB2', dark: '#636366' },
        systemGray3: { DEFAULT: '#C7C7CC', dark: '#48484A' },
        systemGray4: { DEFAULT: '#D1D1D6', dark: '#3A3A3C' },
        systemGray5: { DEFAULT: '#E5E5EA', dark: '#2C2C2E' },
        systemGray6: { DEFAULT: '#F2F2F7', dark: '#1C1C1E' },
      },
      keyframes: {
        'apple-fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'apple-fade-in': 'apple-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      borderRadius: {
        'apple-xs': '4px',
        'apple-sm': '6px',
        'apple-md': '8px',
        'apple-lg': '10px',
        'apple-xl': '12px',
        'apple-2xl': '16px',
        'apple-3xl': '20px',
        'apple-4xl': '24px',
      },
      boxShadow: {
        'apple-1': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'apple-2': '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        'apple-3': '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        'apple-4': '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        'apple-5': '0 16px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}
