import json, subprocess, time
def get(url):
    for i in range(3):
        r=subprocess.run(['curl','-sS','--max-time','60',url],capture_output=True,text=True)
        try: return json.loads(r.stdout)
        except Exception: time.sleep(2)
d=json.load(open('civitai.json'))
pts=[]
for vid,v in d['versions'].items():
    j=get(f"https://civitai.com/api/v1/images?limit=20&modelVersionId={vid}&sort=Oldest&nsfw=X")
    if j and j.get('items'):
        # take earliest image by createdAt
        it=sorted(j['items'],key=lambda x:x['createdAt'])[0]
        pts.append((it['createdAt'],it['id'],it.get('type'),it.get('width'),it.get('height')))
        print(vid,it['createdAt'],it['id'],flush=True)
    time.sleep(0.6)
# latest version id: binary search upward
lo=3020056; hi=4000000
while hi-lo>500:
    mid=(lo+hi)//2
    ok=False
    for k in range(mid,mid+60,7):
        j=get(f"https://civitai.com/api/v1/model-versions/{k}")
        if j and 'createdAt' in j: ok=True; break
    if ok: lo=mid
    else: hi=mid
    time.sleep(0.4)
j=get(f"https://civitai.com/api/v1/model-versions/{lo}")
print('latest version ~',lo, j.get('createdAt') if j else None)
d['image_pts']=sorted(pts); d['latest_version']=(lo, j.get('createdAt') if j else None)
json.dump(d,open('civitai.json','w'),indent=1)
