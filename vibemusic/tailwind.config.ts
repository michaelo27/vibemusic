import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware colour tokens. Real values live in globals.css as CSS
        // variables (light by default, `.dark` on <html> flips them), so every
        // existing `text-white/70`, `bg-ink-900` or `border-vibe-300/30` class
        // follows the theme without touching a single component.
        white: 'rgb(var(--c-fg) / <alpha-value>)',
        black: 'rgb(var(--c-inset) / <alpha-value>)',
        ink: {
          950: 'rgb(var(--c-ink-950) / <alpha-value>)',
          900: 'rgb(var(--c-ink-900) / <alpha-value>)',
          850: 'rgb(var(--c-ink-850) / <alpha-value>)',
          800: 'rgb(var(--c-ink-800) / <alpha-value>)',
          700: 'rgb(var(--c-ink-700) / <alpha-value>)',
        },
        vibe: {
          50: 'rgb(var(--c-vibe-50) / <alpha-value>)',
          100: 'rgb(var(--c-vibe-100) / <alpha-value>)',
          200: 'rgb(var(--c-vibe-200) / <alpha-value>)',
          300: 'rgb(var(--c-vibe-300) / <alpha-value>)',
          400: 'rgb(var(--c-vibe-400) / <alpha-value>)',
          500: 'rgb(var(--c-vibe-500) / <alpha-value>)',
          600: 'rgb(var(--c-vibe-600) / <alpha-value>)',
          700: 'rgb(var(--c-vibe-700) / <alpha-value>)',
        },
        aura: {
          300: 'rgb(var(--c-aura-300) / <alpha-value>)',
          400: 'rgb(var(--c-aura-400) / <alpha-value>)',
          500: 'rgb(var(--c-aura-500) / <alpha-value>)',
          600: 'rgb(var(--c-aura-600) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(87,247,182,0.18), 0 18px 60px -18px rgba(43,231,155,0.35)',
        'glow-aura': '0 0 0 1px rgba(167,139,250,0.18), 0 18px 70px -20px rgba(139,92,246,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -32px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.22,1,0.36,1) infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
