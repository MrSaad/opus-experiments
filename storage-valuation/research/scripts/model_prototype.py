def run(start, sc, years=5):
    R=start['rev']; sh=start['shares']; opex=start['opex']; out=[]
    for y in range(years):
        R*= (1+sc['vol'][y])*(1+sc['price'][y])
        gm=start['gm']+(sc['gm'][y]-start['gm'])
        opex*=(1+sc['opex_g'])
        ebit=R*gm-opex; ni=ebit*(1-start['tax'])-start['interest']; sh*=(1-sc['bb'])
        out.append(dict(rev=R,gm=gm,opm=ebit/R,eps=ni/sh,ni=ni,sh=sh))
    return out
def rep(name,px,start,scs,probs):
    print('=====',name,px, 'run-rate EPS', round((start['rev']*start['gm']-start['opex'])*(1-start['tax'])/start['shares'],1))
    ev3=ev5=0
    for k,sc in scs.items():
        o=run(start,sc); y3,y5=o[2],o[4]
        p3=y3['eps']*sc['pe'][0]; p5=y5['eps']*sc['pe'][1]
        c3=(p3/px)**(1/3)-1; c5=(p5/px)**(1/5)-1
        ev3+=probs[k]*p3; ev5+=probs[k]*p5
        print(f"{k:5s} Y3: rev {y3['rev']/1e3:5.1f}B gm {y3['gm']:.0%} opm {y3['opm']:.0%} eps {y3['eps']:6.1f} -> ${p3:5.0f} ({c3:+.0%}/yr) | Y5: rev {y5['rev']/1e3:5.1f}B eps {y5['eps']:6.1f} -> ${p5:5.0f} ({c5:+.0%}/yr)")
    print(f"prob-wtd Y3 ${ev3:.0f} ({(ev3/px)**(1/3)-1:+.1%}/yr)  Y5 ${ev5:.0f} ({(ev5/px)**(1/5)-1:+.1%}/yr)")
stx=dict(rev=16400,gm=0.57,opex=1200,shares=231,tax=0.16,interest=150)
wdc=dict(rev=16400,gm=0.555,opex=1580,shares=388,tax=0.17,interest=60)
hdd={
 'bull':dict(vol=[.27]*5,price=[.10,.04,0,0,0],gm=[.61,.64,.66,.67,.68],opex_g=.07,bb=.02,pe=(22,20)),
 'base':dict(vol=[.23,.22,.21,.20,.20],price=[.06,0,-.04,-.06,-.06],gm=[.59,.60,.60,.59,.58],opex_g=.06,bb=.015,pe=(17,16)),
 'bear':dict(vol=[.18,0,.10,.15,.15],price=[.03,-.15,-.10,-.05,-.05],gm=[.55,.44,.42,.45,.48],opex_g=.03,bb=.005,pe=(14,13)),
}
P={'bull':.25,'base':.5,'bear':.25}
rep('STX',923.86,stx,hdd,P)
rep('WDC',473.69,wdc,hdd,P)
snd=dict(rev=42200,gm=0.84,opex=2120,shares=155,tax=0.15,interest=-100)
ss={
 'bull':dict(vol=[.15,.17,.17,.17,.17],price=[.10,0,-.02,-.02,-.02],gm=[.85,.84,.83,.82,.82],opex_g=.08,bb=.05,pe=(12,12)),
 'base':dict(vol=[.15,.16,.16,.16,.16],price=[0,-.20,-.15,-.08,-.08],gm=[.82,.74,.68,.66,.65],opex_g=.07,bb=.05,pe=(11,11)),
 'bear':dict(vol=[.14,.10,.15,.16,.16],price=[-.10,-.40,-.20,-.05,-.05],gm=[.76,.52,.46,.47,.48],opex_g=.04,bb=.02,pe=(12,11)),
}
rep('SNDK',1816.57,snd,ss,{'bull':.25,'base':.4,'bear':.35})
