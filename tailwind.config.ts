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
        'ish-cream': '#FFF8EC',
        'ish-coral': '#FF4136',
        'ish-cobalt': '#0057FF',
        'ish-lime': '#C8F400',
        'ish-violet': '#7B2FFF',
        'ish-sun': '#FFD23F',
        'ish-mint': '#00E5A0',
        'ish-ink': '#0D0D0D',
        // Sticker Pop palette
        'pop-coral': '#FF5747',
        'pop-cobalt': '#2B5BFF',
        'pop-sunshine': '#FFC933',
        'pop-grape': '#8C4DFF',
        'pop-mint': '#3DDCA5',
        'pop-bubblegum': '#FF9BD2',
        'pop-ink': '#171214',
        'pop-paper': '#FFF4E4',
        'pop-sky': '#7FD8FF',
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
