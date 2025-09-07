/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'purple': '#9C27B0',
        'hover-purple': '#7B1FA2',
        'yellow': '#FFC107',
        'tertiary': '#D9D9D9',
        'quaternary': '#BFBFBF',
        'quinary': '#8C8C8C',
        'senary': '#595959',
        'septenary': '#262626',
        'octonary': '#000000',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'serif': ['Lora', 'serif'],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(to right, #9C27B0, #7B1FA2)",
      },
    },
  },
  plugins: [],
}