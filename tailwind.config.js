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
          dark: 'var(--bg-primary)',
          white: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          border: 'var(--border-color)',
          borderStrong: 'var(--border-strong)',
          surface: 'var(--surface-color)',
          surfaceHover: 'var(--surface-hover)',
          accent: 'var(--accent-color)',
          accentText: 'var(--accent-text)',
        },
        apple: {
          blue: '#0071e3',
          dark: '#1d1d1f',
          light: '#f5f5f7',
          black: '#000000',
        }
      },
      boxShadow: {
        'apple': '0 8px 30px rgba(0, 0, 0, 0.22)',
      },
      letterSpacing: {
        'xai': '1.4px',
      },
      fontFamily: {
        'mono': ['GeistMono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Noto Sans Mono CJK SC"', '"PingFang SC"', '"Microsoft YaHei"', 'monospace'],
        'sans': ['"SF Pro Display"', '"SF Pro Text"', 'universalSans', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
