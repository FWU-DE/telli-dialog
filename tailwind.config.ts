import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  prefix: '',
  safelist: ['whitespace-pre-wrap'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      screens: {
        xs: '480px',
      },
      listStyleType: {
        square: 'square',
        roman: 'upper-roman',
      },
      boxShadow: {
        '3xl': '0 4px 9px 0px rgba(0, 41, 102, 0.2)',
        'modal-blur': '0px 0px 80px rgba(0, 41, 102, 0.1)',
        dropdown: '0px 4px 10px 0px rgba(0, 41, 102, 0.10);',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'main-black': 'rgba(0, 0, 0, 1)',
        'dark-gray': '#333333',
        'light-gray': '#f5f5f5',
        'semilight-gray': '#fafafa',
        coral: '#e94d52',
        'gray-50': '#F7F7F7',
        'gray-100': '#999999',
        'gray-200': '#E5E5E5',
        'gray-300': '#CDCDCD',
        'gray-600': '#9B9B9B',
        'vidis-hover-green': 'rgba(108, 233, 215, 1)',
        'vidis-hover-purple': 'rgba(70, 33, 126, 1)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'rgba(255, 255, 255, 1)',
        'primary-text': 'rgba(255, 255, 255, 1)',
        primary: 'rgba(70, 33, 126, 1)',
        'secondary-text': 'rgba(70, 33, 126, 1)',
        secondary: 'rgba(108, 233, 215, 1)',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        '1': '1px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'enterprise-full': '999px',
        'enterprise-md': '12px',
        'enterprise-sm': '6px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        hide: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideIn: {
          from: {
            transform: 'translateX(calc(100% + var(--viewport-padding)))',
          },
          to: { transform: 'translateX(0)' },
        },
        swipeOut: {
          from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
          to: { transform: 'translateX(calc(100% + var(--viewport-padding)))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        hide: 'hide 100ms ease-in',
        slideIn: 'slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        swipeOut: 'swipeOut 100ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
