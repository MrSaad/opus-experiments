// Build: npx tailwindcss@3 -c albion-valuation/tailwind.config.js -i albion-valuation/assets/tailwind.src.css -o albion-valuation/assets/tailwind.css --minify
// Colors are CSS variables (Solarized light on :root, Solarized dark on .dark) so the theme toggle is one class flip.
module.exports = {
  content: [__dirname + '/index.html', __dirname + '/assets/app.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--ink)',
        ink2: 'var(--ink-2)',
        muted: 'var(--muted)',
        line: 'var(--border)',
        grid: 'var(--grid)',
        accent: 'var(--accent)',
        link: 'var(--link)',
        good: 'var(--good)',
        bad: 'var(--bad)',
        warnbg: 'var(--warn-bg)',
        warnink: 'var(--warn-ink)'
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      maxWidth: { page: '1120px' }
    }
  }
};
