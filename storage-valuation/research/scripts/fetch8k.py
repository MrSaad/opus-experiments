import json, re, subprocess, time, os
UA="Research Bot research@example.com"
def get(url):
    return subprocess.run(['curl','-sS','-A',UA,url],capture_output=True).stdout
for c,n in [('0002023554','SNDK'),('0001137789','STX'),('0000106040','WDC')]:
    d=json.load(open(f'subs_{c}.json')); r=d['filings']['recent']
    for i in range(len(r['form'])):
        if r['form'][i]=='8-K' and '2.02' in r['items'][i] and r['filingDate'][i]>='2024-07-01':
            acc=r['accessionNumber'][i].replace('-','')
            idx=json.loads(get(f'https://www.sec.gov/Archives/edgar/data/{int(c)}/{acc}/index.json'))
            for it in idx['directory']['item']:
                nm=it['name']
                if (re.search(r'(ex99|ex-99|exhibit99|dex99|ex_99|pressrelease|press)',nm.lower()) or (n=='STX' and not nm.startswith(('stx-','R')) and nm.endswith('.htm'))) and nm.endswith('.htm') and 'index' not in nm:
                    out=f"docs/{n}_{r['filingDate'][i]}_{nm}"
                    if not os.path.exists(out):
                        open(out,'wb').write(get(f'https://www.sec.gov/Archives/edgar/data/{int(c)}/{acc}/{nm}'))
                        time.sleep(0.15)
                    print(out)
