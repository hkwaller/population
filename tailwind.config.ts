const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-gabarito)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
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
        // Legacy ish tokens, retinted to the earthy atlas palette
        'ish-cream': '#F4E8D2',
        'ish-coral': '#CC6B49',
        'ish-cobalt': '#1F6E7B',
        'ish-lime': '#8FAE3C',
        'ish-violet': '#8B5E3C',
        'ish-sun': '#E0A63C',
        'ish-mint': '#4F9E6A',
        'ish-ink': '#211812',
        // Earthy / topographic palette (parallel to POP in theme.ts — keep in sync)
        'pop-coral': '#CC6B49',
        'pop-cobalt': '#1F6E7B',
        'pop-sunshine': '#E0A63C',
        'pop-grape': '#8B5E3C',
        'pop-mint': '#4F9E6A',
        'pop-bubblegum': '#D98E77',
        'pop-ink': '#211812',
        'pop-paper': '#F4E8D2',
        'pop-sky': '#A7D4D0',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        pill: '999px',
        card: '36px',
        sticker: '24px',
      },
      boxShadow: {
        // Signature hard offset, no blur
        pop: '0 6px 0 rgba(0,0,0,0.15)',
        'pop-btn': '0 8px 0 rgba(0,0,0,0.22)',
        'pop-card': '0 12px 0 rgba(0,0,0,0.15)',
        'pop-hero': '0 14px 0 rgba(0,0,0,0.15)',
        'pop-dark': '0 8px 0 rgba(0,0,0,0.3)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  safelist: [
    {
      pattern:
        /^bg-(rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|pink)-400$/,
    },
  ],
  plugins: [require('tailwindcss-animate')],
}

export default config
