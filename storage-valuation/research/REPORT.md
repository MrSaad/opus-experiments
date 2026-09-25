# Storage in the AI era: are SNDK, STX and WDC undervalued for the next 3–5 years?

*Prepared Sept 25, 2026. Prices as of the Sept 23, 2026 close. Fundamentals through fiscal 2026 (year ended July 3, 2026) plus September-quarter (fiscal Q1 2027) guidance. Independent analysis from primary filings and alternative data. Not investment advice.*

Open `../index.html` for the interactive version, which has charts, an adjustable valuation model and a storage calculator.

---

## 1. Bottom line

**The demand thesis (bigger models, bigger outputs, open-source proliferation → more storage) is largely right, and the data behind it is stronger than most people assume. But after a 4–17× rally in 12 months, the stocks already price in a lot of that demand.** Over 3–5 years the question is less whether demand grows and more whether today's record pricing and margins hold as supply catches up.

| | Western Digital (WDC) | Seagate (STX) | Sandisk (SNDK) |
|---|---|---|---|
| Price (Sep 23, 2026) | $473.69 | $923.86 | $1,816.57 |
| 12-month change | +330% | +305% | +1,607% |
| P/E on run-rate EPS (FQ1 guide × 4) | 29.7× | 31.9× | 9.9× |
| **Likely (base) case, 5-yr annualized** | **+10%** | **+7%** | **+6%** |
| Bear / bull, 5-yr annualized | −15% / +33% | −16% / +29% | −15% / +29% |
| Probability-weighted, 5-yr | +14% (25/50/25) | +11% (25/50/25) | +9% (25/40/35) |
| My read | Most balanced risk/reward | Best business, priced for it | Highest torque, cyclical: keep position small |

These returns come from the transparent model in `assets/model.js`, with the assumptions listed in section 6. "Undervalued" in the classic margin-of-safety sense doesn't describe any of them today:

- **WDC and STX** are fairly valued to modestly attractive *if* management's mid-20s exabyte growth continues and margins hold in the high 50s. At ~30× run-rate earnings there is little room for a digestion year.
- **SNDK** looks cheap (~10× run-rate EPS, ~8× EV/EBIT, ~10% FCF yield), but its 84% gross margin is almost twice the best level in NAND history. The cheapness is the market pricing a mean reversion. Unlike past cycles, contracts floor roughly half to two-thirds of its bits.

## 2. Where the companies are

**Sandisk** (spun out of WD in Feb 2025 at ~$36): FY26 revenue $20.2B (+175%). June-quarter revenue was $8.97B at an 84.6% gross margin and a 78.5% GAAP operating margin; a year earlier it was $1.90B at 26%. The growth was mostly *price*: FY26 exabytes grew mid-teens while revenue per GB rose ~150% in Datacenter and ~180% in Edge (10-K MD&A). Datacenter went from 12% to 38% of bits. It signed eight "New Business Model" (NBM) contracts worth at least $93.9B at floor prices (RPO $91.1B), with $16.5B of financial guarantees and a weighted duration of more than 4 years. It has no debt and $4.8B of cash, bought back $4.5B of stock in one quarter, and has $15.5B still authorized. September-quarter guidance: revenue $10.3–10.8B, gross margin 83–85%, EPS $44–46.

**Seagate**: FY26 revenue $12.2B (+34%) on 789 EB (+33%; FY24 was 398 EB). June-quarter non-GAAP gross margin was 52.7%, the 13th straight quarter of expansion. HAMR is ~40% of nearline exabytes, and Mozaic 4+ (44TB) is ramping at the two largest cloud providers. Nearline supply is "allocated into calendar 2028," with contracts that fix configuration and pricing for all of CY2027. Record FY26 FCF of $3.1B; debt fell from ~$5B to ~$2.4B by September. September-quarter guidance: $4.1B revenue (+56% YoY), ~50% operating margin, EPS $7.30.

**Western Digital** (pure-play HDD since the spin): FY26 revenue $12.9B (+36%) on ~872 EB; Cloud is 89% of revenue. June-quarter non-GAAP gross margin 54.4%, operating margin 44.2%. Per the 10-K, FY26 exabytes rose 25% and **ASP per exabyte rose 8%**; in the June quarter, price per TB was up high-teens YoY while cost per TB fell ~8%. It holds an LTA through CY2029 and is negotiating 2029–2031. It is net cash and returned $3.1B in FY26. Guidance: $4.1B revenue, 55–56% gross margin, EPS $4.00.

**Context for those margins.** From 2009 to 2024, Seagate's gross margin ranged 14–31% and WD's 18–37%. NAND (legacy SanDisk 2008–2015 plus the new Sandisk) ranged 2–47%. Every prior peak was followed by a price war within 1–3 years. Current margins sit far outside every historical range, and that is the central fact for valuation.

## 3. Testing the thesis

### 3a. "Models are getting larger": true, and fast

From Hugging Face's full registry (3.09M public models, parameter counts from safetensors metadata, Sep 24, 2026 snapshot):

- Largest first-party open-weight release: Llama 3.1 405B (Jul 2024) → DeepSeek-V3 685B (Dec 2024) → Kimi K2 1.03T (Jul 2025) → DeepSeek-V4-Pro 1.6T (Apr 2026) → **Kimi K3 2.78T (Jun 2026)** → Qwen3.8 2.4T (Aug 2026). That is ~6.9× in 23 months, or a doubling roughly every 8 months.
- New weights uploaded per month went from ~0.18 PB (mid-2024) to ~1.4–1.8 PB (Jul–Aug 2026).
- **Scale check:** all public weights on the Hub total ~15 PB. The HDD industry ships ~1,900 EB a year, more than 100,000× that; WD alone ships 15 PB about every 9 minutes. Model weights are not a meaningful storage load. Bigger models matter *indirectly*, through training data, checkpoints (≈14 bytes/param with optimizer state, so ~39 TB per checkpoint of a 2.78T model, and runs save hundreds) and KV cache.

### 3b. "Outputs are getting bigger (4K video)": true per item, small in aggregate so far

Bytes per unit of output: a 500-token text answer ≈ 2 KB; a 1024² PNG ≈ 1.5 MB; 10 s of 1080p ≈ 10 MB; 10 s of 4K ≈ 50 MB; a 10 s 4K ProRes master ≈ 880 MB. A 4K clip is ~25,000× a text answer.

In aggregate: **one billion 10-second 4K clips per day, all retained, with 1.5× storage overhead, is ~27 EB/yr**, about 1.4% of annual HDD shipments and ~7% of one year's shipment *growth*. (The calculator on the site lets you change every input.) AI video output is a real incremental driver, but it would need to grow 10×+ before it drives the industry by itself.

**The larger channels the thesis leaves out:**

1. **KV cache / persistent context.** DeepSeek-V3-style models produce ~70 KB of KV state per token (MLA: 576 dims × 61 layers × 2 bytes); dense 405B-class models produce ~0.5 MB/token. At Google's 3,200T tokens/month, that is on the order of 220 EB of KV state *generated* every month, more than all the hard drives shipped. Very little is kept, but agentic workloads increasingly persist context rather than recompute it. This is why Sandisk projects a 1 ZB "persistent KV store" installed base by 2030, and why Seagate published a KV-tiering paper with SK hynix. This channel favors flash first and HDD second.
2. **Retention: "data compounds."** Hyperscalers now keep inputs, outputs, logs and context as future training data. In WD CEO Irving Tan's words: "While compute cycles can be reused, data compounds."
3. **Video training data for world models and physical AI.** Video-tagged datasets on Hugging Face went from ~400/month (late 2024) to ~8,000/month (2026). WD says one autonomous-vehicle customer's 2027 exabyte demand "increased multiple-fold."
4. **The capex wave itself.** Big-5 US cloud capex (from their own cash-flow statements) was $181.5B in Q2 2026, versus $55.6B in Q2 2024.

### 3c. "Open source compounds everything": yes on Hugging Face, no longer on Civitai

- **Civitai** (sequential model-version and image IDs sampled against creation dates): model uploads went from zero to ~110k versions/month by late 2024, then **flattened at ~90–100k/month**. Image posting fell from ~5.7M/month (2025) to ~3.1M/month (2026 YTD). Civitai was a good 2023–24 proxy but now reflects one community's saturation.
- **Hugging Face**: ~90–120k new models/month; text-to-video models went from ~50/month (late 2024) to 300–770/month (2026); public dataset bytes grew from 5.2 PB (end of 2024) to 27.5 PB (Aug 2026).
- **Usage:** open models carry roughly a third of OpenRouter tokens, led by DeepSeek and Qwen.
- **Management view:** open source was mentioned on exactly one call in two years. WD's CEO, answering a question about China, said open-source frontier models are "going to be good for the overall industry" because they proliferate deployments, and "the requirement for storage is just going to compound."

The mechanism by which open source helps storage is *proliferation of deployments and data owners*: neoclouds, sovereigns, enterprises and AV/robotics companies each store their own copies and their own data. It is not the size of the weights.

## 4. How management talks, and what they do

- **Visibility went from months to years.** Seagate: "booked through end of calendar 2024" (Jul 2024) → "allocated into calendar 2028" (Jul 2026). WD: "two to six-quarter agreement cycle" (Oct 2024) → an LTA to CY2029 plus negotiations for 2029–2031 (Aug 2026). Sandisk: ~3 months of visibility (by its own account) → NBMs up to 5 years, with >50% of FY27 bits and ~⅔ of FY28 committed. Customers are also posting money: Sandisk's contract liabilities rose from $25M to $1.24B and refundable deposits from $126M to $1.5B (FY26 10-K), inside the $16.5B of total guarantees.
- **"Cycle" talk faded.** At Seagate and WD, mentions fell from 6–10 per call (2024 to early 2025, when WD and Sandisk described a "mid-cycle pause") to 0–4 in 2026. Sandisk raises it mainly to argue it has been engineered away ("We want to get this kind of boom and bust out of it"). Every prior memory peak had a version of this argument, but the contracts and deposits are a genuine difference.
- **Themes rotated** from training (2024) to inference (2025) to agentic, KV cache and physical AI (2026). Pricing mentions roughly tripled at Seagate and WD between 2025 and 2026.
- **Management is conservative on guidance.** Over the last five quarters, actual revenue beat the guidance midpoint by +2–7% at Seagate and WD and +6–29% at Sandisk.
- **Projections.** Sandisk (Aug 13, 2026 Investor Day): FY28–30 revenue growth mid-to-high teens, ~80% gross margin, ~75% operating margin, ~50% adjusted FCF margin, 100% of excess cash returned; NAND TAM >$300B in CY26 (3×) and ~$500B in CY27. Seagate: nearline exabytes up mid-20s %/yr, FY27 growth above 34%, sequential revenue and margin growth every quarter of FY27, capex 4–6% of revenue. WD: exabyte demand 25%+ CAGR, cost/TB −~10%/yr, capex 4–6%. WD's Feb 2026 long-term targets (>50% gross margin, >40% operating margin, EPS >$20; verified only via secondary summaries) are largely met already on a run-rate basis.
- **Actions: insiders are selling, not buying.** In 12 months of Form 4 filings, open-market sales totaled $572M at Seagate (CEO $281M, CFO $146M), $133M at Sandisk (CEO ~$105M, nearly all in Sep 2026) and $75M at WD. Open-market purchases were zero at all three. About 65% of sale-bearing filings were 10b5-1 plans, and selling after 4–17× moves is normal diversification, but Seagate's selling accelerated to $250M in Sep 2026.

## 5. Bull and bear cases I take seriously

**Bear**
1. *Sandisk pricing momentum is decelerating.* June-quarter growth was two-thirds price. September-quarter guidance calls for "modest" price increases and flat-to-down margins. Memory stocks usually peak on pricing momentum, not on earnings.
2. *Demand destruction at the edge.* Sandisk expects phone and PC units down mid-teens in 2026; its consumer revenue fell 32% QoQ.
3. *Capex digestion.* Big-5 capex runs at ~$725B/yr. Storage lags compute, so a 2027–28 pause would reach HDD orders with a delay.
4. *Supply response.* HAMR (Seagate 5TB/disk qualification in late CY27; WD 44TB in 1H CY27 and 100TB by 2029), BiCS10 (+60% bit density), YMTC. Supply discipline has never been tested at these margins.
5. *Valuation.* At ~30× run-rate EPS, Seagate and WD need years of 20%+ growth and stable multiples.

**Bull**
1. *Contracts with teeth.* Sandisk has $16.5B of guarantees and customers returning for a second round within a quarter. WD has LTAs toward 2031. Seagate is allocated into 2028.
2. *HDD capacity is structurally constrained.* Drive units are flat by design. Mosley: areal density gains are probably "not going to be sufficient" to meet 2028–29 demand.
3. *The NAND shortage helps HDD.* With flash prices up ~2.5×, the $/TB gap widened and enterprise arrays are shifting back to hybrid designs (WD). The usual SSD substitution threat is reversed for now.
4. *Balance sheets and capital returns.* WD is net cash, Sandisk has no debt, Seagate is deleveraging, and all three return most of their FCF.
5. *New buyer classes*: neoclouds, sovereigns, frontier labs, AV/robotics fleets.

## 6. Valuation model and scenarios

The start is the run-rate (fiscal Q1 2027 guidance × 4). Revenue = prior year × (1 + unit growth) × (1 + price change). Gross margin follows an explicit path (start → year 2 → year 5). Opex grows 6–7%/yr. Buybacks reduce the share count, and an exit P/E is applied to year-3 (FY29) and year-5 (FY31) EPS.

| Preset | Unit growth | Price Y1 / Y2 / Y3–5 | Gross margin Y2 → Y5 | Exit P/E | Buyback |
|---|---|---|---|---|---|
| HDD bull | 27%/yr | +10 / +4 / 0% | 64 → 68% | 20× | 2–2.5% |
| HDD base | 21%/yr | +6 / 0 / −5% | 60 → 58% | 16× | 1.5–2% |
| HDD bear | 12% avg (0 in Y2) | +3 / −15 / −6% | 44 → 46% | 13× | 0.5% |
| SNDK bull | 17%/yr | +10 / 0 / −2% | 84 → 82% | 12× | 5% |
| SNDK base | 16%/yr | 0 / −20 / −10% | 74 → 65% | 11× | 5% |
| SNDK bear | 14% avg | −10 / −40 / −10% | 52 → 48% | 11× | 2% |

Outputs (price and annualized return from Sep 23 prices):

| | Bear FY31 | Base FY29 | Base FY31 | Bull FY31 |
|---|---|---|---|---|
| WDC | $212 (−15%/yr) | $561 (+6%/yr) | $767 (+10%/yr) | $1,941 (+33%/yr) |
| STX | $379 (−16%/yr) | $959 (+2%/yr) | $1,295 (+7%/yr) | $3,248 (+29%/yr) |
| SNDK | $816 (−15%/yr) | $2,186 (+6%/yr) | $2,388 (+6%/yr) | $6,427 (+29%/yr) |

Why WDC ranks above STX despite the weaker technology position: the demand and presets are the same, but WD starts from a lower multiple (29.7× vs 31.9×) with higher buyback intensity and the longest contracts. Seagate's HAMR lead is real and is partly visible in its higher starting margin; if WD's HAMR ramp in 2027 slips, the ranking flips.

Why Sandisk's base case is below management's model: management guides ~80% gross margin through FY30. My base case lets price per GB fall 20% in FY28 and ~10%/yr after, on the view that contracts slow but do not stop mean reversion. If management is right (the bull preset), SNDK is the best of the three by a wide margin.

## 7. Signposts to watch

1. Sandisk's price vs. volume split each quarter. The first flat or down sequential price is the tell.
2. HDD revenue per TB YoY (now +high-teens to ~+20%). Margin expansion ends when it goes flat.
3. Hyperscaler 2027 capex guidance and the first YoY decline in quarterly capex.
4. Pricing terms on WD's 2029–31 LTAs and changes in Sandisk's deposits and contract liabilities.
5. Edge and consumer unit trends (management expects stabilization in CY27).
6. New greenfield NAND fabs or HDD unit capacity; HAMR yields during the Mozaic 5+ and WD HAMR ramps.
7. Inventory (Sandisk's rose 37% in two quarters, deliberately, it says).
8. Insider behavior: any open-market buying would be informative.

## 8. Method and limitations

See `SOURCES.md` for URLs and `scripts/` for code. Financials come from SEC XBRL company facts (latest-filed values; quarterly figures derived from YTD where needed). Call analysis covers 22 full transcripts. Alternative data: Hugging Face hub-stats parquet (models and datasets), Civitai public API ID sampling, hyperscaler capex from their own filings, Google's disclosed token counts, and Form 4 XML.

Limitations: Hugging Face counts only surviving public repos. Civitai IDs include deleted items. WD's FY25 exabyte series is back-solved from disclosed YoY growth. The Toshiba HDD exabyte estimate (~250 EB) is mine. The model is deliberately simple. Sell-side research was deliberately not used.
