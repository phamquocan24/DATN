/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Enhanced responsive breakpoints
      screens: {
        'xs': '475px',     // Extra small devices
        'sm': '640px',     // Small devices (default)
        'md': '768px',     // Medium devices (default)
        'lg': '1024px',    // Large devices (default)
        'xl': '1280px',    // Extra large devices (default)
        '2xl': '1536px',   // 2X large devices (default)
        '3xl': '1920px',   // Ultra wide screens
        // Custom breakpoints
        'tablet': '640px',
        'laptop': '1024px',
        'desktop': '1280px',
        'widescreen': '1536px',
      },
      fontFamily: {
        'sans': ['BeVietnamLocal', 'Be Vietnam Pro', 'Be Vietnam', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        'vietnam': ['BeVietnamLocal', 'Be Vietnam Pro', 'Be Vietnam', 'Inter', 'sans-serif'],
        'heading': ['BeVietnamLocal', 'Be Vietnam Pro', 'Be Vietnam', 'Inter', 'sans-serif'],
        'body': ['BeVietnamLocal', 'Be Vietnam Pro', 'Be Vietnam', 'Inter', 'sans-serif'],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      // Enhanced spacing for mobile
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Custom container sizes
      maxWidth: {
        'xs': '20rem',     // 320px
        'sm': '24rem',     // 384px  
        'md': '28rem',     // 448px
        'lg': '32rem',     // 512px
        'xl': '36rem',     // 576px
        '2xl': '42rem',    // 672px
        '3xl': '48rem',    // 768px
        '4xl': '56rem',    // 896px
        '5xl': '64rem',    // 1024px
        '6xl': '72rem',    // 1152px
        '7xl': '80rem',    // 1280px
        'full': '100%',
        'mobile': '95%',   // Mobile containers
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}