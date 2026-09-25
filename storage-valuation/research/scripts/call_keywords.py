"""Count themed keywords in each earnings-call transcript (calls/<co>_<fy><q>.txt)."""
import glob, re, json
kw = {'AI': (r'\bAI\b', 0), 'inference': (r'inferenc', re.I), 'agentic': (r'agentic', re.I), 'training': (r'\btraining\b', re.I),
      'video': (r'\bvideo', re.I), 'open source': (r'open[- ]source', re.I), 'physical AI': (r'physical AI', re.I),
      'KV cache': (r'KV[- ]cache', re.I), 'LTA/NBM': (r'\b(LTA|LTAs|long-term agreement|NBM|NBMs|new business model)', re.I),
      'visibility': (r'visibility', re.I), 'pricing': (r'pric(e|ing)', re.I), 'supply discipline': (r'disciplin', re.I),
      'allocation': (r'allocat', re.I), 'tight supply': (r'(tight|shortage|constrain)', re.I),
      # exclude WD's "AI Data Cycle" marketing phrase and "refresh cycle"/"qualification cycle" product usages
      'cyclical': (r'(?<!data )(?<!refresh )(?<!qualification )(?<!adoption )(?<!purchase )\bcycl|\bboom|\bbust', re.I),
      'neocloud': (r'neo ?cloud', re.I), 'sovereign': (r'sovereign', re.I), 'HAMR': (r'HAMR|Mozaic', 0), 'exabyte': (r'exabyte|\bEB\b', 0)}
res = {}
for f in sorted(glob.glob('calls/*_20*.txt')):
    n = f.split('/')[-1][:-4]; t = open(f).read()
    res[n] = {'words': len(t.split()), **{k: len(re.findall(p, t, fl)) for k, (p, fl) in kw.items()}}
json.dump(res, open('call_keywords.json', 'w'), indent=1)
for n, r in res.items(): print(n, r['words'], 'cyc', r['cyclical'], 'price', r['pricing'], 'open', r['open source'], 'AI', r['AI'])
