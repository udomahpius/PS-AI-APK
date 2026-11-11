export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E8ECFF',
          100: '#D5DCFF',
          200: '#AEBBFF',
          300: '#8295FF',
          400: '#526BFF',
          500: '#0014A8',
          600: '#00118F',
          700: '#000B5C',
          800: '#080D3D',
          900: '#050A30',
        },
        ink: '#050A30',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};