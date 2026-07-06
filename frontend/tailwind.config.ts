import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF', mid: '#DBEAFE' },
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2' },
        purple: { DEFAULT: '#7C3AED', light: '#EDE9FE' },
        teal: { DEFAULT: '#0891B2', light: '#E0F7FA' },
        orange: { DEFAULT: '#EA580C', light: '#FFF7ED' },
        surface: { DEFAULT: '#FFFFFF', 2: '#F8FAFC' },
        bg: '#F1F5F9',
        border: { DEFAULT: '#E2E8F0', light: '#F1F5F9' },
        text: { primary: '#0F172A', secondary: '#475569', muted: '#94A3B8' },
      },
      borderRadius: { card: '12px', sm: '8px', xs: '6px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 10px 30px rgba(0,0,0,0.12)',
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'sans-serif'] },
      width: { sidebar: '220px' },
      height: { topbar: '64px' },
    },
  },
  plugins: [],
} satisfies Config
