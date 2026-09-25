"""Assemble every dataset the site uses into data/data.js (window.DATA = {...}).

Inputs are the raw pulls made by the other scripts in this folder (SEC XBRL company
facts, Nasdaq price history, Hugging Face hub-stats parquet aggregates, Civitai API
samples, Form 4 XML, earnings-call keyword counts). Run from the scratch directory
that holds those raw files:  python3 build_data.py <out_dir>
"""
import json, sys, datetime as dt, csv, os

OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
D = dt.date.fromisoformat
X = json.load(open('xbrl_quarterly.json'))


def q(co, k):
    return X[co][k]['data']


# ---------------------------------------------------------------- quarterly financials
def fin(co, start='2023-09-01'):
    rev = q(co, 'revenue')
    gp = q(co, 'gross_profit') if X[co]['gross_profit']['data'] else None
    cogs = q(co, 'cogs')
    oi = q(co, 'op_income'); ocf = q(co, 'ocf'); capex = q(co, 'capex')
    rows = []
    for e in sorted(rev):
        if e < start:
            continue
        r = rev[e]
        g = gp[e] if gp and e in gp else (r - cogs[e] if e in cogs else None)
        rows.append(dict(end=e, rev=round(r / 1e6), gm=round(g / r * 100, 1) if g is not None else None,
                         opm=round(oi[e] / r * 100, 1) if e in oi else None,
                         fcf=round((ocf[e] - capex[e]) / 1e6) if e in ocf and e in capex else None))
    return rows


fins = {c: fin(c) for c in ['SNDK', 'STX', 'WDC']}
# SNDK early quarters: GrossProfit exists from Dec-2023
# Next-quarter guidance midpoints (non-GAAP GM), fiscal Q1 FY27 (quarter ending ~Oct 2, 2026)
guide = {
    'SNDK': dict(end='2026-10-02', rev=10550, gm=84.0, eps=45.0),
    'STX': dict(end='2026-10-02', rev=4100, gm=57.0, eps=7.30),
    'WDC': dict(end='2026-10-02', rev=4100, gm=55.5, eps=4.00),
}

# ---------------------------------------------------------------- exabytes & $/TB (HDD)
stx_eb = {'2024-06-28': 114, '2024-09-27': 137.5, '2024-12-27': 151, '2025-03-28': 144, '2025-06-27': 162.4,
          '2025-10-03': 181.5, '2026-01-02': 190, '2026-04-03': 199, '2026-07-03': 218}
# WDC total EB delivered; FY25 quarters back-solved from disclosed YoY growth of FY26 quarters
wdc_eb = {'2024-09-27': round(204 / 1.23, 1), '2024-12-27': round(215 / 1.22, 1), '2025-03-28': round(222 / 1.34, 1),
          '2025-06-27': 190, '2025-10-03': 204, '2026-01-02': 215, '2026-04-03': 222, '2026-07-03': 231}
eb = {}
for co, m in [('STX', stx_eb), ('WDC', wdc_eb)]:
    rev = q(co, 'revenue')
    eb[co] = [dict(end=e, eb=v, usd_tb=round(rev[e] / 1e6 / v, 2)) for e, v in sorted(m.items())]

# ---------------------------------------------------------------- prices (weekly sample)
px = {}
for t in ['SNDK', 'STX', 'WDC']:
    rows = json.load(open(f'px/{t}.json'))['data']['tradesTable']['rows']
    rows = [(dt.datetime.strptime(r['date'], '%m/%d/%Y').date().isoformat(), float(r['close'].replace('$', '').replace(',', ''))) for r in rows]
    rows.sort()
    rows = [r for r in rows if r[0] >= '2023-01-01']
    samp = rows[::5]
    if samp[-1] != rows[-1]:
        samp.append(rows[-1])
    px[t] = samp

# ---------------------------------------------------------------- long-run annual gross margin
longrun = {
    'STX': [["FY09", 14.4], ["FY10", 28.1], ["FY11", 19.6], ["FY12", 31.4], ["FY13", 27.5], ["FY14", 28.0], ["FY15", 27.7], ["FY16", 23.4], ["FY17", 29.5], ["FY18", 30.1], ["FY19", 28.2], ["FY20", 27.0], ["FY21", 27.3], ["FY22", 29.7], ["FY23", 18.3], ["FY24", 23.4], ["FY25", 35.2], ["FY26", 45.6]],
    'WDC': [["FY09", 17.9], ["FY10", 24.4], ["FY11", 18.8], ["FY12", 29.2], ["FY13", 28.4], ["FY14", 28.8], ["FY15", 29.0], ["FY16", 26.4], ["FY17", 31.8], ["FY18", 37.3], ["FY19", 22.6], ["FY20", 22.6], ["FY21", 26.7], ["FY22", 31.3], ["FY23", 22.2], ["FY24", 28.1], ["FY25", 38.8], ["FY26", 48.9]],
    # NAND: legacy SanDisk Corp (calendar years, CIK 1000180) then new Sandisk (fiscal years)
    'NAND': [["2008", 1.9], ["2009", 36.0], ["2010", 46.9], ["2011", 43.1], ["2012", 33.3], ["2013", 46.5], ["2014", 46.3], ["2015", 40.6], ["FY23", 7.1], ["FY24", 16.1], ["FY25", 30.1], ["FY26", 71.5]],
}

# ---------------------------------------------------------------- hyperscaler capex
hc = json.load(open('hyperscaler_capex.json'))['by_cal_q']
capex = [dict(q=k, **{n: round(v / 1e9, 1) for n, v in hc[k].items()}) for k in sorted(hc) if '2021Q1' <= k <= '2026Q2']

# ---------------------------------------------------------------- tokens
tokens = [dict(d='2024-05', v=9.7, note='Google I/O 2024'), dict(d='2025-05', v=480, note='Google I/O 2025'),
          dict(d='2025-07', v=980, note='Alphabet Q2-25 call'), dict(d='2025-10', v=1300, note='Alphabet Q3-25 call'),
          dict(d='2026-05', v=3200, note='Google I/O 2026')]

# ---------------------------------------------------------------- open-weight frontier (first-party labs, HF createdAt)
frontier = [
    ('2019-11-05', 'GPT-2 XL', 1.5), ('2021-06-04', 'GPT-J', 6), ('2022-04-01', 'GPT-NeoX', 20),
    ('2022-05-19', 'BLOOM', 176), ('2023-02-24', 'LLaMA-65B', 65), ('2023-08-28', 'Falcon-180B', 180),
    ('2024-04-16', 'Mixtral 8x22B', 141), ('2024-04-21', 'Snowflake Arctic', 482), ('2024-07-16', 'Llama 3.1 405B', 406),
    ('2024-12-25', 'DeepSeek-V3', 685), ('2025-04-02', 'Llama 4 Maverick', 402), ('2025-07-11', 'Kimi K2', 1026),
    ('2025-10-02', 'Ling-1T', 1000), ('2026-01-01', 'Kimi K2.5', 1027), ('2026-02-11', 'GLM-5', 754),
    ('2026-04-22', 'DeepSeek-V4-Pro', 1599), ('2026-06-13', 'Kimi K3', 2780), ('2026-08-08', 'Qwen3.8-2.4T', 2446)]
frontier = [dict(d=a, name=b, b=c) for a, b, c in frontier]

# ---------------------------------------------------------------- HF monthly
hm = json.load(open('hf_monthly2.json'))['monthly']
hd = json.load(open('hf_datasets_monthly.json'))
hf = []
cum_m = cum_d = 0
for k in sorted(set(hm) | set(hd)):
    m = hm.get(k, {}); d = hd.get(k, {})
    cum_m += m.get('bytes', 0); cum_d += d.get('bytes', 0)
    if k < '2022-06' or k > '2026-08':
        continue
    hf.append(dict(m=k, models=int(m.get('n', 0)), video_models=int(m.get('n_video', 0)),
                   weights_tb=round(m.get('bytes', 0) / 1e12), cum_weights_pb=round(cum_m / 1e15, 2),
                   datasets=int(d.get('n', 0)), data_tb=round(d.get('bytes', 0) / 1e12), cum_data_pb=round(cum_d / 1e15, 2)))

# ---------------------------------------------------------------- Civitai (sequential IDs as cumulative counters)
cv = json.load(open('civitai.json'))
versions = sorted((v['createdAt'][:10], int(k)) for k, v in cv['versions'].items())
versions.append(('2026-09-24', 3355700))
images = sorted({p[0][:10]: p[1] for p in cv['image_pts']}.items())
images.append(('2026-09-25', 143738949))
# keep monotone points only
def mono(pts):
    out = []
    for d, v in sorted(pts):
        if not out or v > out[-1][1]:
            out.append((d, v))
    return out
civitai = dict(versions=mono(versions), images=mono(images))

# ---------------------------------------------------------------- earnings-call keywords
kw = json.load(open('call_keywords.json'))

# ---------------------------------------------------------------- insider sales by month ($M)
f4 = json.load(open('form4.json'))
ins = {}
for co, rows in f4.items():
    mm = {}
    for x in rows:
        if x['code'] == 'S' and x['date']:
            mm[x['date'][:7]] = mm.get(x['date'][:7], 0) + x['value']
    ins[co] = {k: round(v / 1e6, 1) for k, v in sorted(mm.items())}

DATA = dict(asof='2026-09-25', fins=fins, guide=guide, eb=eb, px=px, longrun=longrun, capex=capex,
            tokens=tokens, frontier=frontier, hf=hf, civitai=civitai, kw=kw, insider=ins)
os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, 'data.js'), 'w') as f:
    f.write('// Generated by research/scripts/build_data.py - all figures sourced in research/SOURCES.md\n')
    f.write('window.DATA = ' + json.dumps(DATA, separators=(',', ':')) + ';\n')
print('ok', os.path.getsize(os.path.join(OUT, 'data.js')))
