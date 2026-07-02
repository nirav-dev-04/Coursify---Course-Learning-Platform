/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enables toggleable dark mode
  theme: {
    extend: {
      colors: {
        'brand-purple': 'var(--color-purple)',
        'brand-purple-hover': 'var(--color-purple-dk)',
        'brand-charcoal': 'var(--color-black)',
        'brand-charcoal-hover': '#2D2F31',
        'brand-grey': 'var(--color-gray-lt)',
        'brand-gold': 'var(--color-yellow)',
        'brand-bg': 'var(--color-bg)',
        'brand-white': 'var(--color-white)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-premium': 'linear-gradient(135deg, #A435F0 0%, #8710D8 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
