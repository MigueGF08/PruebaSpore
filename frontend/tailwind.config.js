module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff49db',
          blue: '#00f0ff',
          purple: '#8a2be2',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 240, 255, 0.35)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      'synthwave',
      'cyberpunk',
      'dark',
    ],
  },
  corePlugins: {
    preflight: false, // Mantener el estilo actual deshabilitando el reset de Tailwind
  },
};
