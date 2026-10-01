/* 1625 Albion Road valuation model.
 * Runs in the browser (window.AlbionModel) and in Node (module.exports) so the
 * numbers quoted in the write-up come from the same code as the calculator.
 *
 * Convention: every rent is a GROSS occupancy cost per sq ft per year
 * (base rent + additional rent), and the landlord pays all operating costs.
 * The building's own leases are "base + $17 additional rent", which behaves
 * like a semi-gross rent, so comparing gross-to-gross avoids mixing net and
 * gross figures.
 */
(function (root) {
  'use strict';

  var ADDL = 17; // additional rent $/sf charged under the in-place leases

  // Rent roll (owner's version). sf = AutoCAD measured area; billed = area in the lease.
  // base and addl are annual dollars. end = lease expiry year.
  var UNITS = [
    { id: '101', floor: 'Main', cls: 'mainFront', tenant: 'Eastside Job Service Inc.', use: 'Employment agency', sf: 757, billed: 892, base: 18589.28, addl: 15164, status: 'leased', since: 2022, start: 2022, end: 2027 },
    { id: '102', floor: 'Main', cls: 'mainFront', tenant: 'Harry Beauty Salon', use: 'Hair salon', sf: 726, billed: 800, base: 22400, addl: 13600, status: 'leased', since: 2005, start: 2022, end: 2027 },
    { id: '103', floor: 'Main', cls: 'mainFront', tenant: 'Spinex Physio Clinic', use: 'Physiotherapy', sf: 1438, billed: 1447, base: 38345.5, addl: 24599, status: 'leased', since: 2003, start: 2025, end: 2030 },
    { id: '104', floor: 'Main', cls: 'mainFront', tenant: 'Albion Martin Grove Pharmacy', use: 'Pharmacy', sf: 1410, billed: 1430, base: 42900, addl: 24310, status: 'leased', since: 2003, start: 2021, end: 2026 },
    { id: '105', floor: 'Main', cls: 'mainFront', tenant: 'Vape Denz', use: 'Vape shop', sf: 358, billed: 358, base: 19507.42, addl: 6086, status: 'leased', since: 2022, start: 2025, end: 2030 },
    { id: '106', floor: 'Main', cls: 'mainFront', tenant: 'Mama Tobey African Store Inc.', use: 'Grocery', sf: 835, billed: 968, base: 23232, addl: 16456, status: 'leased', since: 2025, start: 2025, end: 2030 },
    { id: '107', floor: 'Main', cls: 'mainFront', tenant: 'Royal Dental Care', use: 'Dentist', sf: 1471, billed: 1540, base: 44660, addl: 26180, status: 'leased', since: 2003, start: 2025, end: 2030 },
    { id: '108', floor: 'Main', cls: 'mainInterior', tenant: 'Vacant', use: '', sf: 787, billed: 787, base: 0, addl: 0, status: 'vacant' },
    { id: '109', floor: 'Main', cls: 'mainInterior', tenant: 'Vacant', use: '', sf: 501, billed: 501, base: 0, addl: 0, status: 'vacant' },
    { id: '201', floor: 'Second', cls: 'office', tenant: 'Vacant', use: '', sf: 1850, billed: 1850, base: 0, addl: 0, status: 'vacant' },
    { id: '202', floor: 'Second', cls: 'office', tenant: 'Vacant', use: "Built-out doctor's office", sf: 1480, billed: 1480, base: 0, addl: 0, status: 'vacant' },
    { id: '203', floor: 'Second', cls: 'office', tenant: 'Forward Learning Inc.', use: 'Private school', sf: 2741, billed: 2644, base: 35403.16, addl: 44948, status: 'leased', since: 2017, start: 2022, end: 2027 },
    { id: '204', floor: 'Second', cls: 'office', tenant: 'Vacant', use: 'Conference room', sf: 1002, billed: 1002, base: 0, addl: 0, status: 'vacant' },
    { id: '205', floor: 'Second', cls: 'office', tenant: 'Vacant', use: 'Apartment area', sf: 1813, billed: 1813, base: 0, addl: 0, status: 'vacant' },
    { id: 'B101', floor: 'Basement', cls: 'basement', tenant: 'Abdul', use: 'Not stated', sf: 789, billed: 789, base: 16680, addl: 0, status: 'informal', note: 'No lease' },
    { id: 'B102', floor: 'Basement', cls: 'basement', tenant: 'Vacant', use: '', sf: 750, billed: 750, base: 0, addl: 0, status: 'vacant' },
    { id: 'B103', floor: 'Basement', cls: 'basement', tenant: 'Christy Anna Owus', use: 'Storage', sf: 706, billed: 706, base: 14400, addl: 0, status: 'informal', note: 'No lease, $1,200/mo cash' },
    { id: 'B104', floor: 'Basement', cls: 'basement', tenant: 'Owner use', use: 'Storage', sf: 339, billed: 339, base: 0, addl: 0, status: 'owner' },
    { id: 'B105', floor: 'Basement', cls: 'basement', tenant: '1136987 Ontario Ltd.', use: 'Management office', sf: 284, billed: 284, base: 0, addl: 0, status: 'owner' },
    { id: 'B106', floor: 'Basement', cls: 'basement', tenant: 'Vacant', use: 'Sump pump access via 105', sf: 392, billed: 392, base: 0, addl: 0, status: 'vacant' },
    { id: 'B107', floor: 'Basement', cls: 'basement', tenant: 'Vacant', use: '', sf: 486, billed: 486, base: 0, addl: 0, status: 'vacant' },
    { id: 'B108', floor: 'Basement', cls: 'basement', tenant: 'Vacant', use: '', sf: 502, billed: 502, base: 0, addl: 0, status: 'vacant' },
    { id: 'B109/110', floor: 'Basement', cls: 'basement', tenant: 'Naveen', use: 'Personal trainer', sf: 1304, billed: 1304, base: 1304, addl: 22168, status: 'leased', since: 2025, start: 2025, end: 2030 },
    { id: 'B111', floor: 'Basement', cls: 'basement', tenant: 'Baljit Minhas (cleaner)', use: 'Storage', sf: 638, billed: 638, base: 6000, addl: 0, status: 'informal', note: 'No lease, $500/mo cash' },
    { id: 'B112', floor: 'Basement', cls: 'basement', tenant: 'Amyra Tutoring', use: 'Private tutoring', sf: 1625, billed: 1625, base: 1625, addl: 27625, status: 'leased', since: 2025, start: 2025, end: 2030 }
  ];

  var BUILDING = {
    gfa: 32278, gfaBasement: 10938, gfaMain: 10402, gfaSecond: 10938,
    leasable: 24984, common: 6717, siteSf: 34208, siteAcres: 0.79,
    assessment: 4385000, taxRate2026: 0.02301986,
    ask: 6999000, appraisal: 9330000, purchase2011: 2480000
  };

  // Owner's 2025 operating statement (no insurance line was provided).
  var OPEX_2025 = [
    ['Property tax', 98535], ['Building cleaning', 22330], ['Elevator maintenance', 860],
    ['Elevator licence', 500], ['Snow removal', 7232], ['Landscaping', 5000],
    ['Waste / garbage bin', 4200], ['Fire equipment', 730], ['Monitored security', 348],
    ['Enbridge gas', 10288], ['Hydro', 41810], ['Water', 8426], ['Repairs', 10000],
    ['Management fee (related party)', 25000]
  ];

  var CLASSES = {
    mainFront: 'Main floor, street-front',
    mainInterior: 'Main floor, interior',
    office: 'Second-floor office',
    basement: 'Basement'
  };

  var DEFAULTS = {
    // Market gross rents, $/sf/yr (base + additional rent), today's dollars
    rentMainFront: 43, rentMainInterior: 38, rentOffice: 22, rentBasement: 17,
    // Stabilized vacancy & credit loss
    vacMain: 0.05, vacOffice: 0.12, vacBasement: 0.10,
    // Cap rates by income stream (blended into one overall rate)
    capMain: 0.06, capOffice: 0.085, capBasement: 0.0925,
    capOverride: null,
    // Operating costs
    insurance: 24000, utilities: 60524, utilStabUplift: 0.20, services: 41200,
    rmPsf: 0.60, mgmtPct: 0.04, reservePsf: 0.40,
    // Lease-up of vacant + owner-occupied space
    monthsMain: 6, monthsOffice: 18, monthsBasement: 12,
    freeMain: 2, freeOffice: 4, freeBasement: 2,
    tiMain: 20, tiOffice: 12, tiBasement: 8, lcPct: 0.05, leaseTerm: 5,
    profitPct: 0.15,
    capex: 250000,
    // DCF
    discount: 0.09, exitCap: 0.0725, growth: 0.025, renewProb: 0.70,
    generalVac: 0.04, sellCost: 0.02, holdYears: 10,
    // Financing check
    ltv: 0.60, rate: 0.06, amortYears: 25, minDscr: 1.25
  };

  function marketRent(cls, A) {
    return { mainFront: A.rentMainFront, mainInterior: A.rentMainInterior, office: A.rentOffice, basement: A.rentBasement }[cls];
  }
  function vacFor(cls, A) {
    return cls === 'office' ? A.vacOffice : cls === 'basement' ? A.vacBasement : A.vacMain;
  }
  function capFor(cls, A) {
    return cls === 'office' ? A.capOffice : cls === 'basement' ? A.capBasement : A.capMain;
  }
  function monthsFor(cls, A) {
    return cls === 'office' ? [A.monthsOffice, A.freeOffice, A.tiOffice] :
      cls === 'basement' ? [A.monthsBasement, A.freeBasement, A.tiBasement] : [A.monthsMain, A.freeMain, A.tiMain];
  }
  // Area a new lease is struck on: existing tenants keep their billed area, new deals use measured area.
  function leaseArea(u) { return u.status === 'leased' ? u.billed : u.sf; }
  function gross(u) { return u.base + u.addl; }
  function sum(arr, f) { return arr.reduce(function (s, x) { return s + (f ? f(x) : x); }, 0); }
  function merge(o) { var A = {}; for (var k in DEFAULTS) A[k] = DEFAULTS[k]; for (var j in (o || {})) if (o[j] !== undefined) A[j] = o[j]; return A; }

  function ltt(price) { // Ontario LTT and Toronto MLTT, non-residential brackets (identical schedules)
    var b = [[55000, 0.005], [250000, 0.01], [400000, 0.015], [Infinity, 0.02]], t = 0, prev = 0;
    for (var i = 0; i < b.length; i++) { var top = Math.min(price, b[i][0]); if (top > prev) t += (top - prev) * b[i][1]; prev = b[i][0]; if (price <= prev) break; }
    return t;
  }

  function opexLines(A, egi, utilFactor, yearFactor) {
    yearFactor = yearFactor || 1;
    var tax = BUILDING.assessment * BUILDING.taxRate2026;
    var lines = [
      ['Realty taxes (2026 rate × frozen 2016 assessment)', tax * yearFactor],
      ['Insurance (not in owner statement; estimated)', A.insurance * yearFactor],
      ['Utilities: hydro, gas, water', A.utilities * utilFactor * yearFactor],
      ['Cleaning, snow, landscaping, waste, elevator, fire, security', A.services * yearFactor],
      ['Repairs & maintenance', A.rmPsf * BUILDING.gfa * yearFactor],
      ['Management (' + (A.mgmtPct * 100).toFixed(1) + '% of EGI)', A.mgmtPct * egi],
      ['Structural / capital reserve', A.reservePsf * BUILDING.gfa * yearFactor]
    ];
    return { lines: lines, total: sum(lines, function (l) { return l[1]; }) };
  }

  /* ---------- 1. In-place income (as the building runs today) ---------- */
  function inPlace(o) {
    var A = merge(o);
    var formal = UNITS.filter(function (u) { return u.status === 'leased'; });
    var informal = UNITS.filter(function (u) { return u.status === 'informal'; });
    var formalBase = sum(formal, function (u) { return u.base; });
    var formalAddl = sum(formal, function (u) { return u.addl; });
    var informalRent = sum(informal, function (u) { return u.base; });
    var gross = formalBase + formalAddl + informalRent;
    // 3% credit allowance on leases; 25% haircut on month-to-month cash tenancies
    var allowance = (formalBase + formalAddl) * 0.03 + informalRent * 0.25;
    var egi = gross - allowance;
    var ox = opexLines(A, egi, 1);
    var ownerOpex = sum(OPEX_2025, function (l) { return l[1]; });
    return {
      formalBase: formalBase, formalAddl: formalAddl, informalRent: informalRent, gross: gross,
      allowance: allowance, egi: egi, opex: ox, noi: egi - ox.total,
      ownerOpex: ownerOpex, ownerNoi: gross - ownerOpex, ownerNoiWithIns: gross - ownerOpex - A.insurance,
      occupiedSf: sum(UNITS.filter(function (u) { return u.status === 'leased' || u.status === 'informal'; }), function (u) { return u.sf; })
    };
  }

  /* ---------- 2. Stabilized income at market rents ---------- */
  function stabilized(o) {
    var A = merge(o);
    var byCls = {};
    Object.keys(CLASSES).forEach(function (c) { byCls[c] = { label: CLASSES[c], sf: 0, pgi: 0, vac: 0 }; });
    UNITS.forEach(function (u) {
      var r = marketRent(u.cls, A), a = leaseArea(u), b = byCls[u.cls];
      b.sf += a; b.pgi += a * r; b.vac += a * r * vacFor(u.cls, A);
    });
    var pgi = 0, vac = 0;
    Object.keys(byCls).forEach(function (c) { pgi += byCls[c].pgi; vac += byCls[c].vac; });
    var egi = pgi - vac;
    var ox = opexLines(A, egi, 1 + A.utilStabUplift);
    var noi = egi - ox.total;
    // Blend the cap rate by each stream's share of value (opex allocated by EGI share).
    var valueSum = 0;
    Object.keys(byCls).forEach(function (c) {
      var b = byCls[c]; b.egi = b.pgi - b.vac; b.noi = b.egi - ox.total * (b.egi / egi);
      b.cap = capFor(c, A); b.value = b.noi / b.cap; valueSum += b.value;
    });
    var blended = noi / valueSum;
    var cap = A.capOverride || blended;
    return { A: A, byCls: byCls, pgi: pgi, vac: vac, egi: egi, opex: ox, noi: noi, blendedCap: blended, cap: cap, value: noi / cap };
  }

  /* ---------- 3. Lease-up deductions (stabilized → as-is) ---------- */
  function leaseUp(o) {
    var A = merge(o);
    var rows = [], lost = 0, ti = 0, lc = 0;
    UNITS.filter(function (u) { return u.status === 'vacant' || u.status === 'owner'; }).forEach(function (u) {
      var m = monthsFor(u.cls, A), r = marketRent(u.cls, A);
      var annual = u.sf * r;
      var l = annual * (1 - vacFor(u.cls, A)) * (m[0] + m[1]) / 12;
      var t = u.sf * m[2];
      var c = annual * A.leaseTerm * A.lcPct;
      lost += l; ti += t; lc += c;
      rows.push({ id: u.id, cls: u.cls, sf: u.sf, rent: r, lost: l, ti: t, lc: c });
    });
    var profit = (lost + ti + lc) * A.profitPct;
    return { rows: rows, lost: lost, ti: ti, lc: lc, capex: A.capex, profit: profit, total: lost + ti + lc + A.capex + profit };
  }

  /* ---------- 4. Contract vs market (above/below-market leases) ---------- */
  function contractAdj(o) {
    var A = merge(o), rate = 0.08, start = 2026.75, rows = [], pv = 0;
    UNITS.filter(function (u) { return u.status === 'leased' || u.status === 'informal'; }).forEach(function (u) {
      var mkt = marketRent(u.cls, A) * leaseArea(u);
      var diff = gross(u) - mkt;
      // informal tenancies: assume formalized at market within one year
      var yrs = u.status === 'informal' ? 1 : Math.max(0, (u.end + 1) - start);
      var p = 0;
      for (var t = 0; t < Math.ceil(yrs); t++) { var frac = Math.min(1, yrs - t); p += diff * frac / Math.pow(1 + rate, t + 0.5); }
      pv += p;
      rows.push({ id: u.id, tenant: u.tenant, contract: gross(u), market: mkt, diff: diff, years: yrs, pv: p });
    });
    return { rows: rows, pv: pv };
  }

  /* ---------- 5. As-is value by income approach ---------- */
  function asIs(o) {
    var s = stabilized(o), lu = leaseUp(o), ca = contractAdj(o);
    return { stabilized: s, leaseUp: lu, contract: ca, value: s.value - lu.total + ca.pv };
  }

  /* ---------- 6. 10-year DCF ---------- */
  function dcf(o, price) {
    var A = merge(o), N = A.holdYears, years = [];
    var startYr = 2026.75; // Oct 1, 2026
    var occ0 = inPlace(o).occupiedSf / BUILDING.leasable;
    for (var y = 1; y <= N + 1; y++) years.push({ y: y, rev: 0, occSfYrs: 0, ti: 0, lc: 0 });

    UNITS.forEach(function (u) {
      var area = leaseArea(u), mk = marketRent(u.cls, A), m = monthsFor(u.cls, A);
      var downMonths = u.cls === 'office' ? 9 : u.cls === 'basement' ? 6 : 4;
      // timeline: list of [startTime, endTime, annualRentAtStartYear0Dollars, escalate]
      var t = 0; // years from Oct 2026
      var segs = [];
      if (u.status === 'leased') {
        var exp = (u.end + 1) - startYr; // assume expiry at Dec 31 of end year
        segs.push([0, exp, gross(u), false]);
        t = exp;
        // expected downtime on rollover
        var dt = (1 - A.renewProb) * (downMonths + m[1]) / 12;
        while (t < N + 1) {
          years[Math.min(N, Math.floor(t))].ti += area * (A.renewProb * 5 + (1 - A.renewProb) * m[2]) * Math.pow(1 + A.growth, t);
          years[Math.min(N, Math.floor(t))].lc += area * mk * Math.pow(1 + A.growth, t) * A.leaseTerm * (A.renewProb * A.lcPct / 2 + (1 - A.renewProb) * A.lcPct);
          segs.push([t + dt, t + A.leaseTerm, mk, true]);
          t += A.leaseTerm;
        }
      } else if (u.status === 'informal') {
        segs.push([0, 1, gross(u), false]);
        t = 1;
        while (t < N + 1) { segs.push([t, t + A.leaseTerm, mk, true]); t += A.leaseTerm; }
      } else { // vacant or owner-occupied: lease up
        var on = (m[0]) / 12, free = m[1] / 12;
        years[Math.min(N, Math.floor(on))].ti += u.sf * m[2] * Math.pow(1 + A.growth, on);
        years[Math.min(N, Math.floor(on))].lc += u.sf * mk * Math.pow(1 + A.growth, on) * A.leaseTerm * A.lcPct;
        t = on;
        segs.push([on + free, on + A.leaseTerm, mk, true]);
        t = on + A.leaseTerm;
        var dt2 = (1 - A.renewProb) * (downMonths + m[1]) / 12;
        while (t < N + 1) {
          years[Math.min(N, Math.floor(t))].ti += u.sf * (A.renewProb * 5 + (1 - A.renewProb) * m[2]) * Math.pow(1 + A.growth, t);
          years[Math.min(N, Math.floor(t))].lc += u.sf * mk * Math.pow(1 + A.growth, t) * A.leaseTerm * (A.renewProb * A.lcPct / 2 + (1 - A.renewProb) * A.lcPct);
          segs.push([t + dt2, t + A.leaseTerm, mk, true]);
          t += A.leaseTerm;
        }
      }
      // allocate segments to years
      segs.forEach(function (s) {
        for (var k = 0; k <= N; k++) {
          var a = Math.max(k, s[0]), b = Math.min(k + 1, s[1]);
          if (b <= a) continue;
          var rent = s[3] ? s[2] * Math.pow(1 + A.growth, s[0]) : s[2];
          var annual = s[3] ? rent * area : rent;
          years[k].rev += annual * (b - a);
          years[k].occSfYrs += u.sf * (b - a);
        }
      });
    });

    var cfs = [], rows = [];
    years.forEach(function (yr, i) {
      var g = Math.pow(1 + A.growth, i);
      var occ = yr.occSfYrs / BUILDING.leasable;
      var egi = yr.rev * (1 - A.generalVac);
      var utilFactor = 0.6 + 0.4 * occ / occ0;
      var ox = opexLines(A, egi, utilFactor, g);
      var noi = egi - ox.total;
      var capex = (i === 0 ? A.capex : 0);
      var cf = noi - yr.ti - yr.lc - capex;
      rows.push({ year: i + 1, occ: occ, gross: yr.rev, egi: egi, opex: ox.total, noi: noi, ti: yr.ti, lc: yr.lc, capex: capex, cf: cf });
    });
    var exitNoi = rows[N].noi;
    var exitValue = exitNoi / A.exitCap;
    var netExit = exitValue * (1 - A.sellCost);
    var pv = 0;
    for (var i = 0; i < N; i++) pv += rows[i].cf / Math.pow(1 + A.discount, i + 1);
    pv += netExit / Math.pow(1 + A.discount, N);
    var out = { A: A, rows: rows.slice(0, N), exitNoi: exitNoi, exitValue: exitValue, netExit: netExit, pv: pv };
    if (price) {
      var cost = price + ltt(price) * 2 + 60000;
      var flows = [-cost]; for (var j = 0; j < N; j++) flows.push(rows[j].cf + (j === N - 1 ? netExit : 0));
      out.irr = irr(flows); out.allInCost = cost; out.flows = flows;
    }
    return out;
  }

  function irr(flows) {
    var lo = -0.5, hi = 1.0;
    function npv(r) { return flows.reduce(function (s, f, i) { return s + f / Math.pow(1 + r, i); }, 0); }
    for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ---------- 7. Debt sizing on in-place NOI ---------- */
  function debt(o, price) {
    var A = merge(o), ip = inPlace(o);
    var r = A.rate / 12, n = A.amortYears * 12;
    var k = 12 * r / (1 - Math.pow(1 + r, -n)); // annual constant
    var maxByDscr = ip.noi / A.minDscr / k;
    var maxByLtv = price * A.ltv;
    var loan = Math.min(maxByDscr, maxByLtv);
    return { constant: k, maxByDscr: maxByDscr, maxByLtv: maxByLtv, loan: loan, dscrAtLtv: ip.noi / (maxByLtv * k), equity: price + ltt(price) * 2 + 60000 - loan, cashOnCash: (ip.noi - loan * k) / (price + ltt(price) * 2 + 60000 - loan) };
  }

  /* ---------- 8. Sales comparison, NOI-adjusted ---------- */
  var SALES = [
    { addr: '10 Neighbourhood Ln (Stonegate Plaza)', city: 'Toronto (S. Etobicoke)', date: '2024-10', price: 14000000, sf: 31826, built: 2018, cap: null, leased: 1.0, note: 'New 2-storey, underground parking, 100% leased' },
    { addr: '3044-3048 Dundas St W', city: 'Toronto (Junction)', date: '2025-10', price: 4500000, sf: 11839, built: 1891, cap: 0.067, leased: 1.0, note: 'Mixed-use, 2 retail units' },
    { addr: '5308 Highway 7', city: 'Vaughan', date: '2024-11', price: 5000000, sf: 13770, built: 1975, cap: 0.046, leased: 1.0, note: 'Power-of-sale (distress)' },
    { addr: '1083-1085 St Clair Ave W', city: 'Toronto', date: '2025-01', price: 3650000, sf: 10714, built: 1975, cap: 0.055, leased: 1.0, note: 'Pro-forma cap; 2 retail + 4 apartments' },
    { addr: '964-1010 Albion Rd', city: 'Toronto (N. Etobicoke)', date: '2026 (ask; sold conditionally)', price: 20000000, sf: 35230, built: null, cap: 0.0507, leased: 0.93, note: '1.80 ac, Mixed Use designation, NOI $1,014,051, net rents $29.24' }
  ];

  /* ---------- 9. Bridge from the draft appraisal's income approach ---------- */
  function appraisalBridge(o) {
    var A = merge(o), s = stabilized(o), lu = leaseUp(o), ca = contractAdj(o);
    var aNoi = 441267, aEgi = 677180, aCap = 0.05;
    var oxFix = opexLines(A, aEgi, 1 + A.utilStabUplift).total;
    var noi1 = aEgi - oxFix;
    var steps = [
      { label: 'Appraisal income approach', value: aNoi / aCap },
      { label: 'Use actual operating costs', value: noi1 / aCap },
      { label: 'Use local market rents & vacancy', value: s.noi / aCap },
      { label: 'Cap rates for this mix (' + (s.cap * 100).toFixed(2) + '%)', value: s.value },
      { label: 'Deduct lease-up costs & risk', value: s.value - (lu.total - lu.capex) },
      { label: 'Deduct roof / HVAC allowance', value: s.value - lu.total },
      { label: 'Add above-market contract rents', value: s.value - lu.total + ca.pv }
    ];
    return { steps: steps, appraisalFinal: 9330000, appraisalDca: 9830000 };
  }

  /* ---------- 10. Sensitivity grid: as-is value by cap rate × office rent ---------- */
  function grid(o, caps, officeRents) {
    return officeRents.map(function (r) {
      return caps.map(function (c) { var x = merge(o); x.rentOffice = r; x.capOverride = c; return asIs(x).value; });
    });
  }

  var api = { UNITS: UNITS, appraisalBridge: appraisalBridge, grid: grid, BUILDING: BUILDING, OPEX_2025: OPEX_2025, CLASSES: CLASSES, DEFAULTS: DEFAULTS, SALES: SALES, ADDL: ADDL,
    inPlace: inPlace, stabilized: stabilized, leaseUp: leaseUp, contractAdj: contractAdj, asIs: asIs, dcf: dcf, debt: debt, ltt: ltt, irr: irr, merge: merge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AlbionModel = api;
})(this);
