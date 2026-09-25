import json, subprocess, time, re, os
import xml.etree.ElementTree as ET
UA="Research Bot research@example.com"
def get(url):
    return subprocess.run(['curl','-sS','-A',UA,url],capture_output=True).stdout
res={}
for c,n in [('0002023554','SNDK'),('0001137789','STX'),('0000106040','WDC')]:
    d=json.load(open(f'subs_{c}.json')); r=d['filings']['recent']
    rows=[]
    for i in range(len(r['form'])):
        if r['form'][i]=='4' and r['filingDate'][i]>='2025-09-25':
            acc=r['accessionNumber'][i]; doc=r['primaryDocument'][i]
            # primary doc is xsl-rendered path; raw xml is basename
            xmlname=doc.split('/')[-1]
            url=f"https://www.sec.gov/Archives/edgar/data/{int(c)}/{acc.replace('-','')}/{xmlname}"
            fn=f"f4/{n}_{acc}.xml"
            if not os.path.exists(fn):
                open(fn,'wb').write(get(url)); time.sleep(0.12)
            try:
                root=ET.parse(fn).getroot()
            except Exception as e:
                continue
            owner=root.findtext('.//reportingOwner/reportingOwnerId/rptOwnerName')
            title=root.findtext('.//reportingOwnerRelationship/officerTitle') or ('Director' if root.findtext('.//reportingOwnerRelationship/isDirector') in ('1','true') else '')
            for t in root.findall('.//nonDerivativeTable/nonDerivativeTransaction'):
                code=t.findtext('.//transactionCoding/transactionCode')
                sh=float(t.findtext('.//transactionAmounts/transactionShares/value') or 0)
                px=float(t.findtext('.//transactionAmounts/transactionPricePerShare/value') or 0)
                date=t.findtext('.//transactionDate/value')
                ad=t.findtext('.//transactionAmounts/transactionAcquiredDisposedCode/value')
                rows.append(dict(owner=owner,title=title,code=code,shares=sh,price=px,value=sh*px,date=date,ad=ad))
    res[n]=rows
    S=sum(x['value'] for x in rows if x['code']=='S'); P=sum(x['value'] for x in rows if x['code']=='P')
    print(n,'form4 txns',len(rows),'open-mkt sales $M',round(S/1e6,1),'purchases $M',round(P/1e6,2))
    from collections import defaultdict
    by=defaultdict(float)
    for x in rows:
        if x['code']=='S': by[(x['owner'],x['title'])]+=x['value']
    for k,v in sorted(by.items(),key=lambda x:-x[1])[:6]: print('   ',k,round(v/1e6,1))
json.dump(res,open('form4.json','w'))
