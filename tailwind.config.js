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
        ibm: {
          background: 'var(--bg-background)',
          layer: 'var(--bg-layer-01)',
          layerHover: 'var(--bg-layer-02)',
          text: 'var(--text-primary)',
          textSecondary: 'var(--text-secondary)',
          textPlaceholder: 'var(--text-placeholder)',
          textOnColor: 'var(--text-on-color)',
          border: 'var(--border-subtle)',
          borderStrong: 'var(--border-strong)',
          primary: 'var(--interactive-primary)',
          primaryHover: 'var(--interactive-hover)',
          secondary: 'var(--interactive-secondary)',
          secondaryHover: 'var(--interactive-secondary-hover)',
          danger: 'var(--danger)',
          dangerHover: 'var(--danger-hover)',
        }
      },
      boxShadow: {
        'apple': '0 8px 30px rgba(0, 0, 0, 0.22)',
      },
      letterSpacing: {
        'xai': '1.4px',
      },
      fontFamily: {
        'mono': ['"IBM Plex Mono"', 'Menlo', 'Courier', 'monospace', '"PingFang SC"', '"Microsoft YaHei"'],
        'sans': ['"IBM Plex Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif', '"PingFang SC"', '"Microsoft YaHei"'],
      }
    },
  },
  plugins: [],
}
