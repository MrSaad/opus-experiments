import json, datetime as dt
def D(s): return dt.date.fromisoformat(s)
def series(g, tags, since='2022-06-01'):
    # returns dict end->value for quarterly durations, derived from latest-filed values
    for tag in tags:
        if tag not in g: continue
        vals=g[tag]['units'].get('USD') or g[tag]['units'].get('shares')
        # latest filed per (start,end)
        best={}
        for v in vals:
            if 'start' not in v: continue
            k=(v['start'],v['end'])
            if k not in best or v['filed']>best[k]['filed']: best[k]=v
        q={}; ann={}; ytd={}
        for (s,e),v in best.items():
            days=(D(e)-D(s)).days
            if 80<=days<=100: q[e]=(s,v['val'])
            elif 350<=days<=380: ann[e]=(s,v['val'])
            elif 170<=days<=190 or 260<=days<=285: ytd[(s,e)]=v['val']
        # derive Q4 = annual - 9mo ytd
        for e,(s,val) in ann.items():
            if e in q: continue
            nine=[ (k,v2) for k,v2 in ytd.items() if k[0]==s and 260<=(D(k[1])-D(s)).days<=285]
            if nine:
                k,v2=nine[0]; q[e]=(k[1],val-v2)
        # derive Q2/Q3 from ytd if missing
        for (s,e),val in ytd.items():
            if e in q: continue
            prev=[(k,v2) for k,v2 in ytd.items() if k[0]==s and k[1]<e]
            prev=sorted(prev,key=lambda x:x[0][1])
            if prev:
                k,v2=prev[-1]; q[e]=(k[1],val-v2)
            else:
                # 6mo ytd minus Q1
                q1=[ (qe,qv) for qe,qv in q.items() if qv[0]==s]
                if q1: q[e]=(q1[0][0],val-q1[0][1][1])
        out={e:v[1] for e,v in q.items() if e>=since}
        if out: return dict(sorted(out.items())), tag
    return {},None
def instant(g,tags,since='2022-06-01'):
    for tag in tags:
        if tag not in g: continue
        vals=list(g[tag]['units'].values())[0]
        best={}
        for v in vals:
            if 'start' in v: continue
            if v['end'] not in best or v['filed']>best[v['end']]['filed']: best[v['end']]=v
        out={e:v['val'] for e,v in best.items() if e>=since}
        if out: return dict(sorted(out.items())),tag
    return {},None
res={}
for c,n in [('0002023554','SNDK'),('0001137789','STX'),('0000106040','WDC')]:
    g=json.load(open(f'facts_{c}.json'))['facts']['us-gaap']
    r={}
    r['revenue']=series(g,['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues'])
    r['gross_profit']=series(g,['GrossProfit'])
    r['cogs']=series(g,['CostOfGoodsAndServicesSold','CostOfRevenue'])
    r['op_income']=series(g,['OperatingIncomeLoss'])
    r['net_income']=series(g,['NetIncomeLoss'])
    r['ocf']=series(g,['NetCashProvidedByUsedInOperatingActivities','NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'])
    r['capex']=series(g,['PaymentsToAcquirePropertyPlantAndEquipment'])
    r['rnd']=series(g,['ResearchAndDevelopmentExpense','ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'])
    r['buyback']=series(g,['PaymentsForRepurchaseOfCommonStock'])
    r['dil_shares']=series(g,['WeightedAverageNumberOfDilutedSharesOutstanding'])
    r['cash']=instant(g,['CashAndCashEquivalentsAtCarryingValue'])
    r['debt_lt']=instant(g,['LongTermDebtNoncurrent'])
    r['debt_cur']=instant(g,['LongTermDebtCurrent'])
    r['inventory']=instant(g,['InventoryNet'])
    r['equity']=instant(g,['StockholdersEquity'])
    res[n]={k:{'tag':v[1],'data':v[0]} for k,v in r.items()}
    print('=====',n)
    for k,v in r.items():
        print(k,v[1]); 
        for e,val in list(v[0].items())[-12:]: print('   ',e, round(val/1e6,1))
json.dump(res,open('xbrl_quarterly.json','w'),indent=1)
