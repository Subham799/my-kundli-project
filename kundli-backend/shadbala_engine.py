"""KundliMaker Shadbala engine v1.
Component breakdown is explicit. Some sub-rules are approximations documented in output.
"""
import swisseph as swe
from datetime import timedelta

PLANETS = ['Su','Mo','Ma','Me','Ju','Ve','Sa']
HINDI = {'Su':'सूर्य','Mo':'चंद्र','Ma':'मंगल','Me':'बुध','Ju':'गुरु','Ve':'शुक्र','Sa':'शनि'}
RASHI = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन']
VARGAS = ['D1','D2','D3','D7','D9','D12','D30']
NATURAL = {'Su':60.0,'Mo':51.43,'Ve':42.86,'Ju':34.29,'Me':25.71,'Ma':17.14,'Sa':8.57}
EPHEM = {'Su':swe.SUN,'Mo':swe.MOON,'Ma':swe.MARS,'Me':swe.MERCURY,'Ju':swe.JUPITER,'Ve':swe.VENUS,'Sa':swe.SATURN}
EXALT_POINT = {'Su':10.0,'Mo':33.0,'Ma':298.0,'Me':165.0,'Ju':95.0,'Ve':357.0,'Sa':200.0}
OWN = {'Su':{4},'Mo':{3},'Ma':{0,7},'Me':{2,5},'Ju':{8,11},'Ve':{1,6},'Sa':{9,10}}
MOOL = {'Su':{4},'Mo':set(),'Ma':{0},'Me':{5},'Ju':{8},'Ve':{6},'Sa':{10}}
FRIENDS = {'Su':{'Mo','Ma','Ju'},'Mo':{'Su','Me'},'Ma':{'Su','Mo','Ju'},'Me':{'Su','Ve'},'Ju':{'Su','Mo','Ma'},'Ve':{'Me','Sa'},'Sa':{'Me','Ve'}}
ENEMIES = {'Su':{'Ve','Sa'},'Mo':set(),'Ma':{'Me'},'Me':{'Mo'},'Ju':{'Me','Ve'},'Ve':{'Su','Mo'},'Sa':{'Su','Mo','Ma'}}
MALE = {'Su','Ma','Ju'}
FEM_NEUT = {'Mo','Ve','Me','Sa'}
MIN_SHADBALA = {'Su':390,'Mo':360,'Ma':300,'Me':420,'Ju':390,'Ve':330,'Sa':300}
MIN_STHANA = {'Su':165,'Me':165,'Ju':165,'Mo':133,'Ve':133,'Ma':96,'Sa':96}

def _sign(p, varga='D1'):
    try: return int(p['Vargas'][varga]['Idx']) % 12
    except Exception: return int(float(p.get('Degree',0)) // 30) % 12

def _angle(a,b):
    d = abs((float(a)%360)-(float(b)%360))
    return min(d,360-d)

def _friendship_points(code, sign):
    if sign in MOOL[code]: return 45.0,'मूलत्रिकोण'
    if sign in OWN[code]: return 30.0,'स्वराशि'
    lord = {0:'Ma',1:'Ve',2:'Me',3:'Mo',4:'Su',5:'Me',6:'Ve',7:'Ma',8:'Ju',9:'Sa',10:'Sa',11:'Ju'}[sign]
    if lord == code: return 30.0,'स्वराशि'
    if lord in FRIENDS[code]: return 15.0,'मित्र राशि'
    if lord in ENEMIES[code]: return 3.75,'शत्रु राशि'
    return 7.5,'सम राशि'

def calculate_shadbala(astro, birth_dt, lat, lon):
    # api.py's calculate_astrology uses dynamic local timezone; mirror that to UTC here.
    try:
        import pytz
        from timezonefinder import TimezoneFinder
        tzname = TimezoneFinder().timezone_at(lat=float(lat), lng=float(lon)) or 'UTC'
        local = pytz.timezone(tzname).localize(birth_dt, is_dst=False)
        utc = local.astimezone(pytz.utc)
        jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute/60 + utc.second/3600)
    except Exception:
        utc = birth_dt - timedelta(hours=5.5)
        jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute/60 + utc.second/3600)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    asc = _sign(astro.get('La',{}))
    sun = float(astro['Su']['Degree']); moon = float(astro['Mo']['Degree'])
    elong = (moon-sun)%360
    phase = min(elong,360-elong)
    waxing = elong <= 180
    try:
        geopos = (float(lon),float(lat),0.0)
        sunrise = swe.rise_trans(jd,swe.SUN,swe.CALC_RISE|swe.BIT_DISC_CENTER,geopos,0,0,swe.FLG_SWIEPH)[1][0]
        sunset = swe.rise_trans(jd,swe.SUN,swe.CALC_SET|swe.BIT_DISC_CENTER,geopos,0,0,swe.FLG_SWIEPH)[1][0]
        is_day = sunrise <= jd < sunset
        if is_day:
            third = min(2,max(0,int((jd-sunrise)/max((sunset-sunrise)/3,1e-8))))
            next_sunrise = None
        else:
            next_sunrise = swe.rise_trans(jd+0.5,swe.SUN,swe.CALC_RISE|swe.BIT_DISC_CENTER,geopos,0,0,swe.FLG_SWIEPH)[1][0]
            night_start = sunset if jd >= sunset else sunset-1
            third = min(2,max(0,int((jd-night_start)/max((next_sunrise-night_start)/3,1e-8))))
    except Exception:
        is_day = 6 <= birth_dt.hour < 18; third = (birth_dt.hour//8)%3
        sunrise = sunset = jd; next_sunrise = jd+0.5
    weekday_lords = ['Mo','Ma','Me','Ju','Ve','Sa','Su']
    day_lord = weekday_lords[birth_dt.weekday()]
    # Simplified hora sequence starting from weekday lord.
    chaldean = ['Sa','Ju','Ma','Su','Ve','Me','Mo']
    try:
        if is_day: hora_index = int((jd-sunrise)/max((sunset-sunrise)/12,1e-8))
        else:
            ns = next_sunrise or jd+0.5
            start = sunset if jd >= sunset else sunset-1
            hora_index = 12+int((jd-start)/max((ns-start)/12,1e-8))
        hora_lord = chaldean[(chaldean.index(day_lord)+max(0,hora_index))%7]
    except Exception: hora_lord = day_lord
    rows=[]
    for code in PLANETS:
        p=astro.get(code,{})
        degree=float(p.get('Degree',0)); sign=_sign(p); deg_in_sign=degree%30
        exalt=EXALT_POINT[code]; deb=(exalt+180)%360
        uchcha=max(0.0,min(60.0,_angle(degree,deb)/3.0))
        sapta=0.0; sapta_detail=[]
        for v in VARGAS:
            s=_sign(p,v); pts,dignity=_friendship_points(code,s); sapta+=pts
            sapta_detail.append({'varga':v,'sign':RASHI[s],'points':round(pts,2),'dignity':dignity})
        ojha=0.0; ojha_detail=[]
        for v in ('D1','D9'):
            s=_sign(p,v); odd=(s%2==0)
            pts=15.0 if ((code in MALE and odd) or (code in FEM_NEUT and not odd)) else 0.0
            ojha+=pts; ojha_detail.append({'varga':v,'sign':RASHI[s],'points':pts})
        house=(sign-asc)%12+1
        kendra=60.0 if house in (1,4,7,10) else 30.0 if house in (2,5,8,11) else 15.0
        drekkana_idx=int(deg_in_sign//10)
        drekkana=15.0 if ((drekkana_idx==0 and code in MALE) or (drekkana_idx==1 and code in {'Me','Sa'}) or (drekkana_idx==2 and code in {'Mo','Ve'})) else 0.0
        sthana=uchcha+sapta+ojha+kendra+drekkana
        max_house={'Ju':1,'Me':1,'Mo':4,'Ve':4,'Sa':7,'Su':10,'Ma':10}[code]
        hd=min((house-max_house)%12,(max_house-house)%12)
        dig=max(0.0,60.0*(1-hd/6.0))
        natho=60.0 if code=='Me' or (is_day and code in {'Su','Ju','Ve'}) or ((not is_day) and code in {'Mo','Ma','Sa'}) else 0.0
        benefic=code in {'Ju','Ve'} or (code=='Mo' and waxing) or code=='Me'
        paksha=phase/3.0 if benefic else 60-phase/3.0
        trib_map=({'Me':0,'Su':1,'Sa':2} if is_day else {'Mo':0,'Ma':1,'Ve':2})
        tribhaga=60.0 if code=='Ju' or trib_map.get(code)==third else 0.0
        year_lord=['Ma','Su','Ve','Me','Mo','Sa','Ju'][(birth_dt.year+1)%7]
        month_lord=['Ma','Ve','Me','Mo','Su','Sa','Ju'][(birth_dt.month-1)%7]
        varsha=15.0 if code==year_lord else 0.0; masa=30.0 if code==month_lord else 0.0
        dina=45.0 if code==day_lord else 0.0; hora=60.0 if code==hora_lord else 0.0
        try:
            eq,_=swe.calc_ut(jd,{'Su':swe.SUN,'Mo':swe.MOON,'Ma':swe.MARS,'Me':swe.MERCURY,'Ju':swe.JUPITER,'Ve':swe.VENUS,'Sa':swe.SATURN}[code],swe.FLG_SWIEPH|swe.FLG_SPEED|swe.FLG_EQUATORIAL)
            decl=float(eq[1]); speed=float(eq[3])
        except Exception: decl=0.0; speed=0.0
        ayana=30+decl*30/23.45 if code in {'Su','Ma','Ju','Ve'} else 30-decl*30/23.45 if code in {'Mo','Sa'} else 30+abs(decl)*30/23.45
        ayana=max(0,min(60,ayana)); yuddha=0.0
        kala=natho+paksha+tribhaga+varsha+masa+dina+hora+ayana+yuddha
        if code in {'Su','Mo'}: chesta=ayana; motion='अयन बल के बराबर'
        elif speed < -0.0001 or p.get('Retrograde'): chesta=60.0; motion='वक्री'
        elif abs(speed)<=0.0001: chesta=15.0; motion='विकला / स्थिर'
        else:
            avg={'Ma':0.524,'Me':1.383,'Ju':0.083,'Ve':1.2,'Sa':0.034}[code]
            ratio=speed/avg
            if ratio>1.25: chesta,motion=30.0,'अतिचर'
            elif ratio>1.0: chesta,motion=45.0,'चर'
            elif ratio>0.65: chesta,motion=30.0,'मन्द'
            else: chesta,motion=15.0,'मन्दतर'
        nais=NATURAL[code]; drik=0.0; aspects=[]
        for other in PLANETS:
            if other==code: continue
            sep=_angle(degree,float(astro.get(other,{}).get('Degree',0)))
            # Linear angular model centered on 180°; expose all non-zero contributions.
            strength=max(0.0,60.0*(1-abs(180-sep)/180))
            if strength<=0: continue
            ob=other in {'Ju','Ve'} or (other=='Mo' and waxing) or other=='Me'
            signed=strength if ob else -strength; drik+=signed
            aspects.append({'planet':other,'angle':round(sep,2),'points':round(signed,2),'nature':'शुभ' if ob else 'पाप'})
        total=sthana+dig+kala+chesta+nais+drik
        components={
          'sthana':{'label':'स्थान बल','virupas':round(sthana,2),'details':{'uchcha':round(uchcha,2),'saptavargaja':round(sapta,2),'ojhayugmarashi':round(ojha,2),'kendra':round(kendra,2),'drekkana':round(drekkana,2),'saptavargaja_details':sapta_detail,'ojhayugma_details':ojha_detail,'house':house}},
          'dig':{'label':'दिग्बल','virupas':round(dig,2),'details':{'house':house,'maximum_house':max_house}},
          'kala':{'label':'काल बल','virupas':round(kala,2),'details':{'nathonnatha':round(natho,2),'paksha':round(paksha,2),'tribhaga':round(tribhaga,2),'varsha':varsha,'masa':masa,'dina':dina,'hora':hora,'ayana':round(ayana,2),'yuddha':yuddha,'is_day':is_day,'third':third,'day_lord':day_lord,'hora_lord':hora_lord,'declination':round(decl,4)}},
          'chesta':{'label':'चेष्टा बल','virupas':round(chesta,2),'details':{'motion':motion,'speed':round(speed,6)}},
          'naisargika':{'label':'नैसर्गिक बल','virupas':round(nais,2),'details':{}},
          'drik':{'label':'दृष्टि बल','virupas':round(drik,2),'details':{'aspects':aspects}},
        }
        required = MIN_SHADBALA[code]
        component_warnings = []
        checks = [('sthana','स्थान बल',sthana,MIN_STHANA[code]),('dig','दिग्बल',dig,35),('kala','काल बल',kala,30)]
        if code in {'Ma','Me','Ju','Ve','Sa'}: checks.append(('chesta','चेष्टा बल',chesta,40))
        checks.append(('ayana','अयन बल',ayana,30))
        for key,label,received,threshold in checks:
            if received < threshold:
                component_warnings.append({'key':key,'label':label,'received':round(received,2),'threshold':threshold})
        rows.append({'code':code,'planet':HINDI[code],'sign':RASHI[sign],'sign_index':sign,'house':house,'retrograde':bool(p.get('Retrograde',False)),'total_virupas':round(total,2),'total_rupas':round(total/60,2),'required_virupas':required,'strength_percent':round(total/required*100,1),'overall_status':'Strong' if total >= required else 'Weak','overall_status_hi':'बलवान' if total >= required else 'निर्बल','component_warnings':component_warnings,'components':components})
    return {'title':'षड्बल (Shadbala)','unit':'विरूपा','rupas_divisor':60,'planets':rows,'assumptions':['Saptavargaja: natural sign-lord friendship baseline; full Panchadha Maitri can alter results.','Cheshta Bala: supplied motion-category scale, not continuous classical Cheshta Kendra.','Drik Bala: linear angular approximation; traditional aspect coefficients vary.','Yuddha Bala is zero in v1 until a planetary-war solver is added.'],'method':'KundliMaker Shadbala baseline v1; component formulas are visible for verification.'}
