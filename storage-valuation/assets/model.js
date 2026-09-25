/* Five-year scenario model shared by the site (browser) and the report generator (Node).
 *
 * Starting point = the current run-rate: next-quarter guidance midpoint x 4 (fiscal Q1 FY27,
 * quarter ending ~Oct 2026). Each year, revenue = prior x (1 + unit growth) x (1 + price/unit change).
 * Gross margin follows an explicit path (start -> Y2 -> Y5, linear in between) rather than being
 * derived from cost/unit, because cost-down compounding with flat prices produces margins no
 * storage company has ever sustained - the margin path is the honest, debatable input.
 */
(function (root) {
  const COMPANIES = {
    SNDK: {
      name: 'Sandisk', ticker: 'SNDK', unit: 'bit', price: 1816.57, sharesOut: 146.4,
      start: { rev: 42200, gm: 84, opex: 2120, shares: 155, tax: 15, other: 0, div: 0 }, opexGrowth: 7,
      presets: {
        bull: { vol: 17, p1: 10, p2: 0, p3: -2, gm2: 84, gm5: 82, pe: 12, bb: 5 },
        base: { vol: 16, p1: 0, p2: -20, p3: -10, gm2: 74, gm5: 65, pe: 11, bb: 5 },
        bear: { vol: 14, p1: -10, p2: -40, p3: -10, gm2: 52, gm5: 48, pe: 11, bb: 2 },
      },
      probs: { bull: 25, base: 40, bear: 35 },
    },
    STX: {
      name: 'Seagate', ticker: 'STX', unit: 'exabyte', price: 923.86, sharesOut: 226.6,
      start: { rev: 16400, gm: 57, opex: 1200, shares: 231, tax: 16, other: 180, div: 2.96 }, opexGrowth: 6,
      presets: {
        bull: { vol: 27, p1: 10, p2: 4, p3: 0, gm2: 64, gm5: 68, pe: 20, bb: 2 },
        base: { vol: 21, p1: 6, p2: 0, p3: -5, gm2: 60, gm5: 58, pe: 16, bb: 1.5 },
        bear: { vol: 12, p1: 3, p2: -15, p3: -6, gm2: 44, gm5: 46, pe: 13, bb: 0.5 },
      },
      probs: { bull: 25, base: 50, bear: 25 },
    },
    WDC: {
      name: 'Western Digital', ticker: 'WDC', unit: 'exabyte', price: 473.69, sharesOut: 360.5,
      start: { rev: 16400, gm: 55.5, opex: 1580, shares: 388, tax: 17, other: 60, div: 0.6 }, opexGrowth: 6,
      presets: {
        bull: { vol: 27, p1: 10, p2: 4, p3: 0, gm2: 64, gm5: 68, pe: 20, bb: 2.5 },
        base: { vol: 21, p1: 6, p2: 0, p3: -5, gm2: 60, gm5: 58, pe: 16, bb: 2 },
        bear: { vol: 12, p1: 3, p2: -15, p3: -6, gm2: 44, gm5: 46, pe: 13, bb: 0.5 },
      },
      probs: { bull: 25, base: 50, bear: 25 },
    },
  };

  // Bear cases model a digestion year: unit growth is zero in Y2, the average is carried by the other years.
  function volPath(p, kind) {
    if (kind === 'bear') {
      const other = (p.vol * 5) / 4;
      return [other, 0, other, other, other];
    }
    return [p.vol, p.vol, p.vol, p.vol, p.vol];
  }

  function run(ticker, p, kind) {
    const c = COMPANIES[ticker], s = c.start;
    const vols = volPath(p, kind);
    const prices = [p.p1, p.p2, p.p3, p.p3, p.p3];
    const gms = [(s.gm + p.gm2) / 2, p.gm2, p.gm2 + (p.gm5 - p.gm2) / 3, p.gm2 + (2 * (p.gm5 - p.gm2)) / 3, p.gm5];
    let rev = s.rev, opex = s.opex, shares = s.shares;
    const years = [];
    for (let y = 0; y < 5; y++) {
      rev *= (1 + vols[y] / 100) * (1 + prices[y] / 100);
      opex *= 1 + c.opexGrowth / 100;
      shares *= 1 - p.bb / 100;
      const ebit = rev * (gms[y] / 100) - opex;
      const ni = (ebit - s.other) * (1 - s.tax / 100);
      years.push({ year: y + 1, rev, gm: gms[y], opm: (ebit / rev) * 100, ni, shares, eps: ni / shares });
    }
    const y3 = years[2], y5 = years[4];
    const px3 = y3.eps * p.pe, px5 = y5.eps * p.pe;
    const dy = s.div / c.price;
    return {
      years, px3, px5,
      cagr3: (Math.pow(Math.max(px3, 0) / c.price, 1 / 3) - 1 + dy) * 100,
      cagr5: (Math.pow(Math.max(px5, 0) / c.price, 1 / 5) - 1 + dy) * 100,
    };
  }

  function runRateEps(ticker) {
    const s = COMPANIES[ticker].start;
    return ((s.rev * s.gm / 100 - s.opex - s.other) * (1 - s.tax / 100)) / s.shares;
  }

  function weighted(ticker, presets, probs) {
    const c = COMPANIES[ticker];
    let tot = 0, e3 = 0, e5 = 0;
    for (const k of ['bull', 'base', 'bear']) {
      const w = probs[k] || 0; tot += w;
      const r = run(ticker, presets[k], k);
      e3 += w * r.px3; e5 += w * r.px5;
    }
    e3 /= tot || 1; e5 /= tot || 1;
    const dy = c.start.div / c.price;
    return {
      px3: e3, px5: e5,
      cagr3: (Math.pow(e3 / c.price, 1 / 3) - 1 + dy) * 100,
      cagr5: (Math.pow(e5 / c.price, 1 / 5) - 1 + dy) * 100,
    };
  }

  const api = { COMPANIES, run, runRateEps, weighted };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
