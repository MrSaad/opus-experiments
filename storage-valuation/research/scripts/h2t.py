import sys,re,html,glob,os
from html.parser import HTMLParser
def h2t(s):
    s=re.sub(r'(?is)<(script|style).*?</\1>','',s)
    s=re.sub(r'(?i)<br\s*/?>','\n',s)
    s=re.sub(r'(?i)</(p|div|tr|h\d|li|table)>','\n',s)
    s=re.sub(r'(?i)</t[dh]>',' | ',s)
    s=re.sub(r'<[^>]+>','',s)
    s=html.unescape(s).replace('\xa0',' ')
    s=re.sub(r'[ \t]+',' ',s)
    s=re.sub(r'\n\s*\n+','\n',s)
    return s
for f in sys.argv[1:]:
    t=h2t(open(f,encoding='utf-8',errors='ignore').read())
    open(f.rsplit('.',1)[0]+'.txt','w').write(t)
