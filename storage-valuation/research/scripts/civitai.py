import json, subprocess, time, datetime as dt, urllib.parse
def get(url):
    for i in range(4):
        r=subprocess.run(['curl','-sS','--max-time','60',url],capture_output=True,text=True)
        try: return json.loads(r.stdout)
        except Exception: time.sleep(3)
    return None
out={'images':{},'versions':{}}
# images by month
d=dt.datetime(2023,1,1)
while d<=dt.datetime(2026,9,20):
    ts=int(d.replace(tzinfo=dt.timezone.utc).timestamp()*1000)
    j=get(f"https://civitai.com/api/v1/images?limit=200&sort=Newest&nsfw=X&cursor={urllib.parse.quote(f'2|{ts}')}")
    if j and j.get('items'):
        it=j['items']
        ids=[x['id'] for x in it]
        vids=sum(1 for x in it if x.get('type')=='video')
        px=[(x.get('width') or 0)*(x.get('height') or 0) for x in it if x.get('type')!='video']
        vpx=[(x.get('width') or 0)*(x.get('height') or 0) for x in it if x.get('type')=='video']
        bm={}
        for x in it: bm[x.get('baseModel')]=bm.get(x.get('baseModel'),0)+1
        out['images'][d.strftime('%Y-%m-%d')]={'max_id':max(ids),'min_id':min(ids),'n':len(it),'videos':vids,'avg_px':sum(px)/max(1,len(px)),'avg_vid_px':sum(vpx)/max(1,len(vpx)),'baseModels':bm,'first_created':it[0]['createdAt']}
        print(d.date(), max(ids), vids, round(sum(px)/max(1,len(px))/1e6,2), it[0]['createdAt'], flush=True)
    else: print(d.date(),'fail',str(j)[:200])
    m=d.month+1; d=d.replace(year=d.year+(m>12), month=(m-1)%12+1)
    time.sleep(1)
json.dump(out,open('civitai.json','w'),indent=1)
# model versions sampled
for vid in list(range(1,3000001,50000))+[2950000,2980000,3000000,3020000]:
    j=get(f"https://civitai.com/api/v1/model-versions/{vid}")
    k=vid
    while (not j or 'createdAt' not in j) and k<vid+200:
        k+=7; j=get(f"https://civitai.com/api/v1/model-versions/{k}")
    if j and 'createdAt' in j:
        out['versions'][k]={'createdAt':j['createdAt'],'baseModel':j.get('baseModel')}
        print('v',k,j['createdAt'],j.get('baseModel'),flush=True)
    time.sleep(0.7)
json.dump(out,open('civitai.json','w'),indent=1)
