/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#1f2228',
        },
        x: {
          dark: '#1f2228',
          white: '#ffffff',
          muted: 'rgba(255, 255, 255, 0.5)',
          border: 'rgba(255, 255, 255, 0.1)',
          borderStrong: 'rgba(255, 255, 255, 0.2)',
          surface: 'rgba(255, 255, 255, 0.03)',
          surfaceHover: 'rgba(255, 255, 255, 0.08)'
        }
      },
      letterSpacing: {
        'xai': '1.4px',
      },
      fontFamily: {
        'mono': ['GeistMono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Noto Sans Mono CJK SC"', '"PingFang SC"', '"Microsoft YaHei"', 'monospace'],
        'sans': ['universalSans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans CJK SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
