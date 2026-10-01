# 1625 Albion Road valuation

Static site (GitHub Pages): `index.html` + `assets/`.

- `assets/model.js`: the valuation model. Runs in the browser and in Node (`require('./assets/model.js')`).
- `assets/app.js`: renders tables, charts and the calculator from the model.
- `assets/tailwind.css`: compiled Tailwind (Solarized light by default, `.dark` on `<html>` for Solarized dark).
- `docs/`: the four source PDFs; document citations link to `docs/<file>.pdf#page=N`.

Rebuild the CSS after changing classes in `index.html` or `assets/app.js`:

```sh
npx tailwindcss@3 -c albion-valuation/tailwind.config.js -i albion-valuation/assets/tailwind.src.css -o albion-valuation/assets/tailwind.css --minify
```
