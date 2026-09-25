import pyarrow.parquet as pq, json
from collections import defaultdict
BYTES={'F32':4,'F16':2,'BF16':2,'F8_E4M3':1,'I8':1,'I64':8,'U8':1,'U32':4,'I32':4,'I16':2,'F64':8,'F8_E8M0':1,'BOOL':1,'U16':2,'Q4':0.5,'F8_E5M2':1,'U64':8,'C64':8,'F4':0.5,'F6_E2M3':0.75}
LABS={'deepseek-ai','moonshotai','meta-llama','Qwen','mistralai','google','microsoft','nvidia','zai-org','THUDM','tiiuae','bigscience','EleutherAI','openai','xai-org','MiniMaxAI','stepfun-ai','baidu','tencent','ByteDance-Seed','inclusionAI','Snowflake','databricks','allenai','ibm-granite','CohereForAI','CohereLabs','facebook','stabilityai','black-forest-labs','Wan-AI','Lightricks','genmo','hunyuanvideo-community','THUDM','LGAI-EXAONE','upstage','XiaomiMiMo','meituan-longcat','rednote-hilab','openbmb','internlm','OpenGVLab','ai21labs','Alibaba-NLP','huggingface','HuggingFaceTB','apple','amazon','Salesforce','01-ai','swiss-ai','arcee-ai','PrimeIntellect','NousResearch'}
t=pq.read_table('hf_models.parquet',columns=['id','author','createdAt','safetensors','pipeline_tag','downloadsAllTime','likes'])
m=defaultdict(lambda: defaultdict(float)); lab_q=defaultdict(lambda:(0,'')); cum=defaultdict(float)
video=[]; labmodels=[]
for r in t.to_pylist():
    c=r['createdAt']
    if c is None: continue
    ym=c.strftime('%Y-%m'); q=f"{c.year}Q{(c.month-1)//3+1}"
    pt=r['pipeline_tag'] or ''
    grp=('text' if pt in('text-generation','image-text-to-text','text2text-generation','any-to-any') else
         'image' if pt in('text-to-image','image-to-image') else
         'video' if pt in('text-to-video','image-to-video','video-to-video') else 'other')
    m[ym]['n']+=1; m[ym]['n_'+grp]+=1
    st=r['safetensors']
    if st and st.get('parameters'):
        b=0;p=0
        for k,v in st['parameters'].items():
            if v: b+=v*BYTES.get(k,2); p+=v
        if p>4e12 or b>1e13: continue
        m[ym]['bytes']+=b; m[ym]['bytes_'+grp]+=b; m[ym]['st']+=1
        if r['author'] in LABS and grp in('text',) :
            if p>lab_q[q][0]: lab_q[q]=(p,r['id'])
        if r['author'] in LABS and p>=1e11: labmodels.append((c.strftime('%Y-%m-%d'),r['id'],round(p/1e9),r['downloadsAllTime'],grp))
        if grp=='video' and (r['downloadsAllTime'] or 0)>5000: video.append((c.strftime('%Y-%m-%d'),r['id'],round(p/1e9,1),r['downloadsAllTime']))
out={'monthly':{k:dict(v) for k,v in sorted(m.items())},'lab_max_by_q':dict(sorted(lab_q.items())),'lab_big':sorted(labmodels),'video':sorted(video)}
json.dump(out,open('hf_monthly2.json','w'),indent=0)
c=0
for k in sorted(m):
    v=m[k]; c+=v['bytes']
    if k>='2022-01': print(k,int(v['n']),'txt',int(v['n_text']),'img',int(v['n_image']),'vid',int(v['n_video']),'| TB new',round(v['bytes']/1e12),'cum PB',round(c/1e15,2),'| vid TB',round(v['bytes_video']/1e12,1))
print()
for q,(p,i) in sorted(lab_q.items()):
    if q>='2019': print(q,round(p/1e9),i)
print(len(labmodels))
for x in sorted(labmodels): print(x)
print('VIDEO'); 
for x in sorted(video): print(x)
