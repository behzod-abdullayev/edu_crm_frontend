import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        brand: {
          primary:       'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary:     'var(--brand-secondary)',
          accent:        'var(--brand-accent)',
        },
        bg: {
          page:              'var(--bg-page)',
          surface:           'var(--bg-surface)',
          'surface-hover':   'var(--bg-surface-hover)',
          'surface-secondary': 'var(--bg-surface-secondary)',
          overlay:           'var(--bg-overlay)',
          sidebar:           'var(--bg-sidebar)',
          'sidebar-item-hover':   'var(--bg-sidebar-item-hover)',
          'sidebar-item-active':  'var(--bg-sidebar-item-active)',
        },
        text: {
          primary:         'var(--text-primary)',
          secondary:       'var(--text-secondary)',
          muted:           'var(--text-muted)',
          inverse:         'var(--text-inverse)',
          'on-brand':      'var(--text-on-brand)',
          sidebar:         'var(--text-sidebar)',
          'sidebar-active': 'var(--text-sidebar-active)',
        },
        border: {
          default: 'var(--border-default)',
          strong:  'var(--border-strong)',
          focus:   'var(--border-focus)',
        },
        success: {
          bg:     'var(--success-bg)',
          border: 'var(--success-border)',
          text:   'var(--success-text)',
          solid:  'var(--success-solid)',
        },
        warning: {
          bg:     'var(--warning-bg)',
          border: 'var(--warning-border)',
          text:   'var(--warning-text)',
          solid:  'var(--warning-solid)',
        },
        error: {
          bg:     'var(--error-bg)',
          border: 'var(--error-border)',
          text:   'var(--error-text)',
          solid:  'var(--error-solid)',
        },
        info: {
          bg:     'var(--info-bg)',
          border: 'var(--info-border)',
          text:   'var(--info-text)',
          solid:  'var(--info-solid)',
        },
        role: {
          student: 'var(--role-student)',
          teacher: 'var(--role-teacher)',
          admin:   'var(--role-admin)',
          owner:   'var(--role-owner)',
        },
        // shadcn/ui compatible
        background: 'var(--bg-page)',
        foreground:  'var(--text-primary)',
        primary: {
          DEFAULT:    'var(--brand-primary)',
          foreground: 'var(--text-on-brand)',
        },
        secondary: {
          DEFAULT:    'var(--bg-surface-secondary)',
          foreground: 'var(--text-secondary)',
        },
        muted: {
          DEFAULT:    'var(--bg-surface-hover)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT:    'var(--brand-accent)',
          foreground: 'var(--text-on-brand)',
        },
        destructive: {
          DEFAULT:    'var(--error-solid)',
          foreground: 'var(--text-inverse)',
        },
        card: {
          DEFAULT:    'var(--bg-surface)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT:    'var(--bg-surface)',
          foreground: 'var(--text-primary)',
        },
        input:   'var(--border-default)',
        ring:    'var(--border-focus)',
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full:  'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      spacing: {
        'sidebar':          'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed)',
        'header':           'var(--header-height)',
        'header-mobile':    'var(--header-height-mobile)',
        'bottom-nav':       'var(--bottom-nav-height)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer:      'shimmer 2s linear infinite',
        fadeIn:       'fadeIn 200ms ease forwards',
        slideUp:      'slideUp 250ms ease forwards',
        slideIn:      'slideIn 250ms ease forwards',
        slideInRight: 'slideInRight 250ms ease forwards',
        countUp:      'countUp 400ms ease forwards',
        scaleIn:      'scaleIn 150ms ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
