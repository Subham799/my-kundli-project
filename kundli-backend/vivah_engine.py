"""
vivah_engine.py v1.0
Complete Vivah (Marriage) Analysis Engine
All from D1 data only.

9 Modules:
  1. Saptam Bhav Analysis
  2. Mangalik Dosha
  3. Vivah Vilamb (Delay)
  4. Prem Vivah Yoga
  5. Vivah Vichchhed (Divorce risk)
  6. Jeevanasathi Swabhaav (Partner nature)
  7. Avivahit Yoga (Unmarried risk)
  8. Vivah Kaal (Timing)
  9. Daampatya Sukh Index
"""
from typing import Dict, List, Optional

RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"]
PLANET_HI = {"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि","Ra":"राहु","Ke":"केतु"}
SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"]
KROOR = {"Ma","Sa","Ra","Ke","Su"}
SHUBH  = {"Ju","Ve","Mo","Me"}
NEECH  = {"Su":6,"Mo":7,"Ma":3,"Me":11,"Ju":9,"Ve":5,"Sa":0}

def _h(pl,c): return int(pl.get(c,{}).get("house",0))
def _r(pl,c):
    p=pl.get(c,{})
    # Try numeric index first
    ri=p.get("rashi_index",p.get("rashi_num"))
    if ri is not None:
        try:
            ri=int(ri)
            if ri>=1: ri-=1   # convert 1-based to 0-based
            return max(0,min(11,ri))
        except: pass
    # Fallback: try rashi name string
    rname=p.get("rashi","").strip()
    RASHI_MAP={"मेष":0,"वृषभ":1,"मिथुन":2,"कर्क":3,"सिंह":4,"कन्या":5,
               "तुला":6,"वृश्चिक":7,"धनु":8,"मकर":9,"कुंभ":10,"मीन":11,
               "Aries":0,"Taurus":1,"Gemini":2,"Cancer":3,"Leo":4,"Virgo":5,
               "Libra":6,"Scorpio":7,"Sagittarius":8,"Capricorn":9,"Aquarius":10,"Pisces":11}
    if rname in RASHI_MAP: return RASHI_MAP[rname]
    return 0  # safe default
def _sav(sav,h): return sav[h-1] if sav and 1<=h<=12 else 0
def _bav(bav,p,r):
    c=bav.get(p,[]);return int(c[r]) if c and 0<=r<12 else 0
def _retro(pl,c):
    p=pl.get(c,{})
    val=p.get("retrograde") or p.get("Retrograde") or p.get("is_retro")
    if isinstance(val,bool): return val
    if isinstance(val,str): return val.strip().lower() in ("true","yes","1")
    if isinstance(val,(int,float)): return val==1
    return False
def _get_full_degree(pl,p):
    """Returns full ecliptic longitude (0-360°). Uses 'longitude' or 'full_degree' if available,
    else calculates from rashi (0-based) * 30 + degree_within_sign."""
    pdata=pl.get(p)
    if not pdata: return None
    # Prefer pre-calculated full longitude
    lon=pdata.get("longitude") or pdata.get("full_degree")
    if lon is not None:
        try: return float(lon)
        except: pass
    # Calculate from rashi + degree
    deg=pdata.get("degree")
    if deg is None: return None
    try:
        deg=float(deg)
        # Get rashi 0-based index
        ri=_r(pl,p)
        return ri*30.0 + deg
    except: return None
def _angular_dist(d1,d2):
    diff=abs(d1-d2)%360
    return min(diff,360-diff)
def _lord(lg,bh): return SIGN_LORDS[(lg+bh-1)%12]
def _pin(pl,house): return [p for p in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"] if _h(pl,p)==house]
def _aspect(pl,planet,target):
    ph=_h(pl,planet)
    if ph==0: return False
    if ((ph-1+6)%12)+1==target: return True
    if planet=="Ma" and (((ph-1+3)%12)+1==target or ((ph-1+7)%12)+1==target): return True
    if planet=="Ju" and (((ph-1+4)%12)+1==target or ((ph-1+8)%12)+1==target): return True
    if planet=="Sa" and (((ph-1+2)%12)+1==target or ((ph-1+9)%12)+1==target): return True
    return False

def _is_venus_combust(pl):
    su=_get_full_degree(pl,"Su"); ve=_get_full_degree(pl,"Ve")
    if su is None or ve is None: return False
    return _angular_dist(su,ve) < 10

def _has_jupiter_protection(pl,target_house):
    if _h(pl,"Ju") in(1,7): return True
    return _aspect(pl,"Ju",target_house)

def mangalik_pair_cancel(m1,m2):
    """Dono mangalik hain to dosha cancel — pass compute_mangalik() results of both."""
    return bool(m1.get("is_mangalik") and m2.get("is_mangalik"))

def compute_saptam_analysis(pl,sav,bav,lg,gender="male"):
    h7s=_sav(sav,7); lord7=_lord(lg,7); l7h=_h(pl,lord7)
    pin7=_pin(pl,7); k7=[p for p in pin7 if p in KROOR]; s7=[p for p in pin7 if p in SHUBH]
    ka7=[p for p in KROOR if _aspect(pl,p,7)]; sa7=[p for p in SHUBH if _aspect(pl,p,7)]
    karak="Ju" if gender.lower() in ("female","f") else "Ve"
    kh=_h(pl,karak); kr=_r(pl,karak); kb=_bav(bav,karak,kr); ks=kb>=5 and kh not in (6,8,12)
    sc=50
    if h7s>=28: sc+=15
    elif h7s<=14: sc-=20
    elif h7s<=22: sc-=10
    sc+=len(s7)*8+len(sa7)*6-len(k7)*10-len(ka7)*6
    if l7h in(6,8,12): sc-=15
    if _bav(bav,lord7,_r(pl,lord7))<=2: sc-=10
    if ks: sc+=10
    if kh in(6,8,12): sc-=10
    sc=max(0,min(100,sc))
    if sc>=70: v,c="✅ वैवाहिक जीवन सुखमय रहेगा","#22D3EE"
    elif sc>=50: v,c="🟡 सामान्य दांपत्य जीवन","#F59E0B"
    elif sc>=30: v,c="⚠️ दांपत्य में कलह संभव","#FB923C"
    else: v,c="❌ गंभीर वैवाहिक समस्या","#FB7185"
    sutras_ws = [
        {"sutra":"7वें भाव SAV ≥ 28 = विवाह भाव बलवान, सुखमय दांपत्य",
         "applied":h7s>=28, "result":f"7वें SAV = {h7s} {'✅ बलवान' if h7s>=28 else '⚠️ खतरे का क्षेत्र' if h7s<=22 else '❌ अत्यंत कमजोर' if h7s<=14 else '🟡 सामान्य'}"},
        {"sutra":"7वें SAV 14-22 = खतरे का क्षेत्र — विच्छेद की आशंका",
         "applied":14<=h7s<=22, "result":f"SAV {h7s} {'⚠️ खतरे के क्षेत्र में है' if 14<=h7s<=22 else '✅ इस क्षेत्र से बाहर'}"},
        {"sutra":"7वें SAV < 14 = अत्यंत कमजोर विवाह भाव",
         "applied":h7s<14, "result":f"SAV {h7s} {'❌ अत्यंत कमजोर' if h7s<14 else '✅ 14 से ऊपर'}"},
        {"sutra":"सप्तमेश 6/8/12 में = त्रिक — दांपत्य में भारी समस्या",
         "applied":l7h in(6,8,12), "result":f"सप्तमेश {PLANET_HI.get(lord7,lord7)} {l7h}वें भाव में {'⚠️ त्रिक स्थिति' if l7h in(6,8,12) else '✅ शुभ स्थिति'}"},
        {"sutra":"सप्तमेश BAV ≤ 2 = कमजोर — जीवनसाथी सुख में कमी",
         "applied":_bav(bav,lord7,_r(pl,lord7))<=2, "result":f"सप्तमेश BAV = {_bav(bav,lord7,_r(pl,lord7))} {'❌ अत्यंत कमजोर' if _bav(bav,lord7,_r(pl,lord7))<=2 else '✅ ठीक'}"},
        {"sutra":"7वें में 2+ पाप ग्रह = दांपत्य में गंभीर कलह",
         "applied":len(k7)>=2, "result":f"7वें में पाप ग्रह: {', '.join(PLANET_HI.get(p,p) for p in k7) if k7 else 'कोई नहीं'}"},
        {"sutra":"विवाह कारक (शुक्र/गुरु) BAV ≥ 5 = बलवान — विवाह सुखमय",
         "applied":ks, "result":f"{PLANET_HI.get(karak,karak)} BAV = {kb} {'✅ बलवान' if ks else '⚠️ कमजोर'}"},
        {"sutra":"विवाह कारक 6/8/12 में = कमजोर — विवाह में बाधा",
         "applied":kh in(6,8,12), "result":f"{PLANET_HI.get(karak,karak)} {kh}वें भाव में {'⚠️ त्रिक' if kh in(6,8,12) else '✅ शुभ'}"},
        {"sutra":"7वें पर शुभ ग्रहों की दृष्टि = रक्षाकवच",
         "applied":bool(sa7), "result":f"शुभ दृष्टि: {', '.join(PLANET_HI.get(p,p) for p in sa7) if sa7 else 'कोई नहीं'}"},
        {"sutra":"7वें पर पाप ग्रहों की दृष्टि = दांपत्य में कलह",
         "applied":bool(ka7), "result":f"पाप दृष्टि: {', '.join(PLANET_HI.get(p,p) for p in ka7) if ka7 else 'कोई नहीं'}"},
    ]
    return {"computed":True,"h7_sav":h7s,"h7_lord":lord7,"h7_lord_hi":PLANET_HI.get(lord7,lord7),
            "h7_lord_house":l7h,"lord_in_trik":l7h in(6,8,12),
            "planets_in_7":[PLANET_HI.get(p,p) for p in pin7],
            "kroor_in_7":[PLANET_HI.get(p,p) for p in k7],
            "shubh_in_7":[PLANET_HI.get(p,p) for p in s7],
            "kroor_aspects":[PLANET_HI.get(p,p) for p in ka7],
            "shubh_aspects":[PLANET_HI.get(p,p) for p in sa7],
            "vivah_karak":PLANET_HI.get(karak,karak),"karak_strong":ks,"karak_bav":kb,
            "sutras_with_status":sutras_ws,
            "score":sc,"verdict":v,"color":c}

def compute_mangalik(pl,bav):
    mh=_h(pl,"Ma"); mr=_r(pl,"Ma"); mb=_bav(bav,"Ma",mr)
    is_mg=mh in{1,4,7,8,12}
    ju_protect=_has_jupiter_protection(pl,mh)
    own=mr in(0,7); uch=mr==9; hbav=mb>=6
    # TEXT: Vakri ya ast Mangal = dosha cancel (software ki sab se badi galti)
    ma_retro = _retro(pl,"Ma")
    su_deg=_get_full_degree(pl,"Su"); ma_deg=_get_full_degree(pl,"Ma")
    if su_deg is not None and ma_deg is not None:
        ma_combust = _angular_dist(su_deg,ma_deg) < 17
    else:
        ma_combust = (_h(pl,"Su")==mh)  # fallback if degree missing
    ve_combust = _is_venus_combust(pl)
    cancelled=is_mg and (ju_protect or own or uch or hbav or ma_retro or ma_combust or ve_combust)
    if not is_mg: sev,lbl,col="none","✅ मांगलिक दोष नहीं","#22D3EE"
    elif cancelled: sev,lbl,col="cancelled","✅ मांगलिक दोष रद्द","#4ADE80"
    elif mh==7: sev,lbl,col="high","⚠️⚠️ तीव्र मांगलिक — 7वें भाव में मंगल","#FB7185"
    elif mh in(8,12): sev,lbl,col="high","⚠️ मांगलिक दोष — 8/12वें भाव","#FB923C"
    else: sev,lbl,col="mild","🟡 सामान्य मांगलिक (1/4वें भाव)","#F59E0B"
    cr=[]
    if cancelled:
        if ju_protect: cr.append("गुरु का मजबूत प्रभाव (दृष्टि/1/7वें में) — दोष रद्द")
        if own: cr.append("मंगल स्वराशि में")
        if uch: cr.append("मंगल उच्च राशि में")
        if hbav: cr.append(f"मंगल BAV {mb}≥6 (बलवान)")
        if ma_retro: cr.append("मंगल वक्री — शास्त्रानुसार दोष रद्द")
        if ma_combust: cr.append("मंगल अस्त (सूर्य के निकट <17°) — दोष रद्द")
        if ve_combust: cr.append("शुक्र अस्त — विवाह कारक प्रभावित, मांगलिक दोष का प्रभाव कम")
    sutras_ws = [
        {"sutra":"मंगल 1/4/7/8/12 में = मांगलिक दोष — विवाह में देरी/समस्या",
         "applied":is_mg, "result":f"मंगल {mh}वें भाव में {'⚠️ मांगलिक' if is_mg else '✅ मांगलिक नहीं'}"},
        {"sutra":"मंगल 7वें में = सबसे तीव्र मांगलिक दोष",
         "applied":mh==7, "result":f"मंगल {'⚠️ 7वें में — सर्वाधिक खतरनाक' if mh==7 else f'{mh}वें में'}"},
        {"sutra":"मंगल वक्री/अस्त (<17°) हो = दोष पूर्णतः रद्द (सॉफ्टवेयर अक्सर यह चूक जाते हैं)",
         "applied":ma_retro or ma_combust, "result":f"{'✅ वक्री — दोष रद्द' if ma_retro else '✅ अस्त (<17°) — दोष रद्द' if ma_combust else '❌ न वक्री न अस्त'}"},
        {"sutra":"गुरु की मंगल पर दृष्टि / गुरु 1/7वें में = दोष रद्द",
         "applied":ju_protect, "result":f"{'✅ गुरु का मजबूत प्रभाव — दोष रद्द' if ju_protect else '❌ गुरु दृष्टि/स्थान नहीं'}"},
        {"sutra":"मंगल स्वराशि (मेष/वृश्चिक) या उच्च (मकर) = दोष रद्द",
         "applied":own or uch, "result":f"{'✅ स्वराशि' if own else '✅ उच्च' if uch else '❌ न स्वराशि न उच्च'}"},
        {"sutra":"मंगल BAV ≥ 6 = बलवान, दोष का प्रभाव कम",
         "applied":hbav, "result":f"मंगल BAV = {mb} {'✅ बलवान (≥6)' if hbav else '⚠️ कमजोर'}"},
        {"sutra":"शुक्र अस्त (<10°) = विवाह कारक प्रभावित, मांगलिक का असर कम",
         "applied":ve_combust, "result":f"{'✅ शुक्र अस्त — दोष प्रभाव कम' if ve_combust else '❌ शुक्र अस्त नहीं'}"},
        {"sutra":"दोनों पार्टनर मांगलिक हों = दोष परस्पर रद्द",
         "applied":False, "result":"📌 साथी की कुंडली से मिलाएं — mangalik_pair_cancel() use करें"},
    ]
    return {"computed":True,"is_mangalik":is_mg,"severity":sev,"mars_house":mh,"mars_bav":mb,
            "label":lbl,"color":col,"cancelled":cancelled,"cancel_reasons":cr,
            "sutras_with_status":sutras_ws}

def compute_vivah_vilamb(pl,sav,bav,lg):
    h7s=_sav(sav,7); lord7=_lord(lg,7); l7h=_h(pl,lord7)
    df=[]; pf=[]
    if _h(pl,"Sa")==7: df.append("शनि 7वें भाव में — विवाह में विलंब")
    elif _aspect(pl,"Sa",7): df.append("शनि की दृष्टि 7वें पर — देरी संभव")
    if l7h in(6,8,12): df.append(f"सप्तमेश {PLANET_HI.get(lord7,'')} {l7h}वें भाव में — गंभीर विलंब")
    if _h(pl,"Ra")==7: df.append("राहु 7वें में — विचित्र परिस्थितियाँ")
    if _retro(pl,lord7): df.append(f"सप्तमेश {PLANET_HI.get(lord7,'')} वक्री — विलंब")
    if 14<=h7s<=22: df.append(f"7वें SAV {h7s} (खतरे का क्षेत्र)")
    if _h(pl,"Su")==_h(pl,"Sa"): df.append("सूर्य-शनि युति — विवाह में देरी")
    if _aspect(pl,"Ju",7): pf.append("गुरु की दृष्टि 7वें — रक्षाकवच")
    if _h(pl,"Ju") in(1,4,7,10): pf.append("गुरु केंद्र में — सहायक")
    if _bav(bav,"Ve",_r(pl,"Ve"))>=5: pf.append(f"शुक्र BAV {_bav(bav,'Ve',_r(pl,'Ve'))}≥5")
    dc=len(df)
    if dc==0: v,c,lv="✅ समय पर विवाह","#22D3EE","none"
    elif dc<=2: v,c,lv="🟡 कुछ विलंब संभव","#F59E0B","mild"
    elif dc<=4: v,c,lv="⚠️ विवाह में देरी — 28-32 वर्ष के बाद","#FB923C","moderate"
    else: v,c,lv="❌ अत्यधिक विलंब — गंभीर उपाय जरूरी","#FB7185","severe"
    sa_h=_h(pl,"Sa"); ra_h=_h(pl,"Ra")
    sa_retro_l7=_retro(pl,lord7)
    sutras_ws = [
        {"sutra":"शनि 7वें भाव में = विवाह में गंभीर विलंब (मनोवैज्ञानिक डर + over-analysis)",
         "applied":sa_h==7, "result":f"शनि {'⚠️ 7वें में — गंभीर विलंब' if sa_h==7 else f'{sa_h}वें में'}"},
        {"sutra":"शनि की 7वें पर दृष्टि = देरी संभव",
         "applied":_aspect(pl,"Sa",7) and sa_h!=7, "result":f"{'⚠️ शनि की दृष्टि 7वें पर' if _aspect(pl,'Sa',7) and sa_h!=7 else '✅ शनि की सीधी दृष्टि नहीं'}"},
        {"sutra":"सप्तमेश 6/8/12 में = विवाह में देरी और कलह",
         "applied":l7h in(6,8,12), "result":f"सप्तमेश {PLANET_HI.get(lord7,lord7)} {l7h}वें में {'⚠️ त्रिक' if l7h in(6,8,12) else '✅ शुभ'}"},
        {"sutra":"राहु 7वें में = विचित्र परिस्थितियाँ, देरी",
         "applied":ra_h==7, "result":f"राहु {'⚠️ 7वें में' if ra_h==7 else f'{ra_h}वें में'}"},
        {"sutra":"सप्तमेश वक्री = विलंब",
         "applied":sa_retro_l7, "result":f"सप्तमेश {PLANET_HI.get(lord7,lord7)} {'⚠️ वक्री — विलंब' if sa_retro_l7 else '✅ सीधा'}"},
        {"sutra":"7वें SAV 14-22 = खतरे का क्षेत्र",
         "applied":14<=h7s<=22, "result":f"SAV {h7s} {'⚠️ खतरे के क्षेत्र में (14-22)' if 14<=h7s<=22 else '✅ सुरक्षित'}"},
        {"sutra":"गुरु की 7वें पर दृष्टि / केंद्र में = रक्षाकवच, देरी कम",
         "applied":_aspect(pl,"Ju",7) or _h(pl,"Ju") in(1,4,7,10), "result":f"{'✅ गुरु की दृष्टि 7वें पर' if _aspect(pl,'Ju',7) else '✅ गुरु केंद्र में' if _h(pl,'Ju') in(1,4,7,10) else '❌ गुरु की दृष्टि/केंद्र नहीं'}"},
        {"sutra":"शुक्र BAV ≥ 5 = विवाह कारक बलवान — देरी कम",
         "applied":_bav(bav,"Ve",_r(pl,"Ve"))>=5, "result":f"शुक्र BAV = {_bav(bav,'Ve',_r(pl,'Ve'))} {'✅ बलवान' if _bav(bav,'Ve',_r(pl,'Ve'))>=5 else '⚠️ कमजोर'}"},
    ]
    return {"computed":True,"delay_factors":df,"protect_factors":pf,"delay_count":dc,
            "level":lv,"verdict":v,"color":c,
            "sutras_with_status":sutras_ws,
            "upay":["शुक्रवार शुक्र मंत्र जाप","कृष्ण जी को पीली पगड़ी पहनाएं",
                    "शिव-पार्वती पूजन","विष्णु सहस्त्रनाम नित्य पाठ"] if dc>0 else []}

def compute_prem_vivah(pl,sav,lg,gender="male"):
    l5=_lord(lg,5); l7=_lord(lg,7); l9=_lord(lg,9); l1=_lord(lg,1)
    h5=_h(pl,l5); h7l=_h(pl,l7)
    pf=[]
    if h5==7 or h7l==5: pf.append("पंचमेश 7वें या सप्तमेश 5वें — प्रेम विवाह योग")
    if _aspect(pl,l5,7): pf.append(f"पंचमेश {PLANET_HI.get(l5,l5)} की 7वें पर दृष्टि")
    if _aspect(pl,l7,5): pf.append(f"सप्तमेश {PLANET_HI.get(l7,l7)} की 5वें पर दृष्टि")
    if _h(pl,l1) in(5,7): pf.append("लग्नेश 5/7वें में")
    if _h(pl,"Ra") in(5,7): pf.append(f"राहु {_h(pl,'Ra')}वें में")
    if _h(pl,"Ve")==_h(pl,"Ma"): pf.append("शुक्र-मंगल युति — तीव्र प्रेम")
    af=[]
    if _h(pl,"Ra") in(5,7,9): af.append(f"राहु {_h(pl,'Ra')}वें भाव में — अंतर्जातीय संभव")
    if _h(pl,"Sa") in(5,7,9): af.append(f"शनि {_h(pl,'Sa')}वें भाव में — अंतर्जातीय संभव")
    has_p=len(pf)>=2; has_a=len(af)>=1 and has_p
    ju_p=_aspect(pl,"Ju",5) or _aspect(pl,"Ju",7) or _h(pl,"Ju") in(1,5,7,9)
    sutras_ws = [
        {"sutra":"पंचमेश 7वें में / सप्तमेश 5वें में = 100% प्रेम विवाह योग",
         "applied":h5==7 or h7l==5, "result":f"पंचमेश {PLANET_HI.get(l5,l5)} {h5}वें | सप्तमेश {PLANET_HI.get(l7,l7)} {h7l}वें {'✅ 5-7 का योग' if (h5==7 or h7l==5) else '❌ सीधा संबंध नहीं'}"},
        {"sutra":"पंचमेश-सप्तमेश एक-दूसरे के नक्षत्र में = 100% प्रेम विवाह",
         "applied":False, "result":"📌 नक्षत्र स्वामी की जांच D1 से नहीं होती — KP tab से verify करें"},
        {"sutra":"5-7 भाव/स्वामी में दृष्टि संबंध = प्रेम विवाह का योग",
         "applied":_aspect(pl,l5,7) or _aspect(pl,l7,5), "result":f"{'✅ दृष्टि संबंध है' if (_aspect(pl,l5,7) or _aspect(pl,l7,5)) else '❌ दृष्टि संबंध नहीं'}"},
        {"sutra":"लग्नेश 5/7वें में = प्रेम में व्यक्तिगत भागीदारी",
         "applied":_h(pl,l1) in(5,7), "result":f"लग्नेश {PLANET_HI.get(l1,l1)} {_h(pl,l1)}वें {'✅ 5/7 में' if _h(pl,l1) in(5,7) else '— इस योग में नहीं'}"},
        {"sutra":"राहु/शनि 5/7/9 भाव में = अंतर्जातीय प्रेम विवाह",
         "applied":bool(af), "result":f"{'⚠️ अंतर्जातीय योग: '+'; '.join(af) if af else '✅ सजातीय विवाह संभव'}"},
        {"sutra":"गुरु 5/7/9 भाव में / दृष्टि = परिवार की सहमति मिलेगी",
         "applied":ju_p, "result":f"{'✅ परिवार सहमति संभव' if ju_p else '⚠️ परिवार विरोध कर सकता है'}"},
        {"sutra":"7वें में मंगल मेष राशि में = प्रेम विवाह का विशेष योग",
         "applied":_h(pl,"Ma")==7 and _r(pl,"Ma")==0, "result":f"{'✅ मंगल मेष 7वें में' if _h(pl,'Ma')==7 and _r(pl,'Ma')==0 else '— यह विशेष योग नहीं'}"},
    ]
    return {"computed":True,"prem_yoga_factors":pf,"has_prem_vivah_yoga":has_p,
            "anterjatiya_factors":af,"is_anterjatiya":has_a,"family_approval":ju_p,
            "sutras_with_status":sutras_ws,
            "verdict":"✅✅ प्रेम विवाह योग प्रबल — "+("अंतर्जातीय" if has_a else "सजातीय") if has_p else "❌ प्रेम विवाह योग नहीं",
            "color":"#22D3EE" if has_p else "#94A3B8",
            "family_note":"✅ परिवार की सहमति संभव" if ju_p else "⚠️ परिवार विरोध कर सकता है"}

def compute_vivah_vichchhed(pl,sav,bav,lg):
    h7s=_sav(sav,7); lord7=_lord(lg,7); l7h=_h(pl,lord7)
    vf=[]; pf=[]
    k7=[p for p in KROOR if _h(pl,p)==7]
    if len(k7)>=2: vf.append(f"7वें में एकाधिक पाप ग्रह: {', '.join(PLANET_HI.get(p,p) for p in k7)}")
    elif k7: vf.append(f"7वें में पाप ग्रह: {', '.join(PLANET_HI.get(p,p) for p in k7)}")
    if l7h in(6,8,12): vf.append(f"सप्तमेश {PLANET_HI.get(lord7,'')} {l7h}वें — गंभीर")
    if _h(pl,"Ra")==7 and _h(pl,"Sa")==7: vf.append("राहु+शनि दोनों 7वें — विच्छेद का प्रबल योग")
    if _aspect(pl,"Sa",l7h): vf.append("शनि की सप्तमेश पर दृष्टि")
    if h7s<=14: vf.append(f"7वें SAV {h7s} (<14 अत्यंत कमजोर)")
    elif 14<h7s<=22: vf.append(f"7वें SAV {h7s} (खतरे का क्षेत्र)")
    l6=_lord(lg,6)
    # Sahi rule: DONO 6th bhav MEIN hone chahiye (sirf kisi bhi bhav mein nahi)
    if _h(pl,l6)==6 and _h(pl,lord7)==6:
        vf.append(f"षष्ठेश + सप्तमेश दोनों 6वें भाव में — न्यायिक विवाद/तलाक का प्रबल योग")
    elif _h(pl,l6)==_h(pl,lord7) and _h(pl,l6) in(6,8,12):
        vf.append(f"षष्ठेश + सप्तमेश दोनों त्रिक ({_h(pl,l6)}वें) में — संघर्ष")
    if _aspect(pl,"Ju",7) or _h(pl,"Ju")==7: pf.append("गुरु 7वें — रक्षक")
    if _aspect(pl,"Ve",7) or _h(pl,"Ve")==7: pf.append("शुक्र 7वें — सुखकारी")
    net=len(vf)-len(pf)
    if net<=0: v,c,r="✅ विवाह विच्छेद का कोई योग नहीं","#22D3EE","low"
    elif net==1: v,c,r="🟡 थोड़ा जोखिम — उपाय से ठीक","#F59E0B","mild"
    elif net==2: v,c,r="⚠️ विच्छेद की संभावना","#FB923C","moderate"
    else: v,c,r="❌ विवाह विच्छेद का प्रबल योग","#FB7185","high"
    l6=_lord(lg,6); ra_h=_h(pl,"Ra"); sa_h_v=_h(pl,"Sa")
    sutras_ws = [
        {"sutra":"षष्ठेश + सप्तमेश दोनों 6वें भाव में = न्यायिक विवाद/तलाक का सटीक योग",
         "applied":_h(pl,l6)==6 and _h(pl,lord7)==6,
         "result":f"षष्ठेश {PLANET_HI.get(l6,l6)} {_h(pl,l6)}वें | सप्तमेश {PLANET_HI.get(lord7,lord7)} {l7h}वें {'❌ दोनों 6वें में — तलाक का प्रबल योग' if _h(pl,l6)==6 and l7h==6 else '✅ दोनों 6वें में नहीं'}"},
        {"sutra":"7वें में पाप ग्रह = दांपत्य में कलह और विच्छेद का खतरा",
         "applied":bool(k7), "result":f"{'⚠️ पाप ग्रह: '+', '.join(PLANET_HI.get(p,p) for p in k7) if k7 else '✅ 7वें में कोई पाप ग्रह नहीं'}"},
        {"sutra":"राहु+शनि दोनों 7वें = विच्छेद का प्रबल योग",
         "applied":ra_h==7 and sa_h_v==7, "result":f"{'❌ राहु+शनि दोनों 7वें — अत्यंत खतरनाक' if ra_h==7 and sa_h_v==7 else '✅ राहु+शनि दोनों 7वें में नहीं'}"},
        {"sutra":"7वें SAV < 14 = अत्यंत कमजोर — तलाक की संभावना",
         "applied":h7s<14, "result":f"SAV {h7s} {'❌ 14 से कम — बहुत कमजोर' if h7s<14 else '✅ 14 से ऊपर'}"},
        {"sutra":"7वें SAV 14-22 = खतरे का क्षेत्र",
         "applied":14<=h7s<=22, "result":f"SAV {h7s} {'⚠️ खतरे के क्षेत्र में' if 14<=h7s<=22 else '✅ सुरक्षित'}"},
        {"sutra":"सप्तमेश 6/8/12 में = कमजोर — विच्छेद की आशंका",
         "applied":l7h in(6,8,12), "result":f"सप्तमेश {PLANET_HI.get(lord7,lord7)} {l7h}वें {'⚠️ त्रिक' if l7h in(6,8,12) else '✅ शुभ स्थिति'}"},
        {"sutra":"गुरु की 7वें पर दृष्टि/7वें में = रक्षक — विच्छेद रोकता है",
         "applied":_aspect(pl,"Ju",7) or _h(pl,"Ju")==7, "result":f"{'✅ गुरु की 7वें पर दृष्टि — रक्षक' if _aspect(pl,'Ju',7) else '✅ गुरु 7वें में — रक्षक' if _h(pl,'Ju')==7 else '❌ गुरु का 7वें पर प्रभाव नहीं'}"},
        {"sutra":"यदि 7वें/सप्तमेश पर शुभ ग्रह का प्रभाव न हो = कोई उपाय काम नहीं करेगा",
         "applied":not(pf), "result":f"{'⚠️ कोई शुभ सुरक्षा कारक नहीं — उपाय सीमित प्रभाव देंगे' if not pf else '✅ शुभ सुरक्षा कारक हैं'}"},
    ]
    return {"computed":True,"vichchhed_factors":vf,"protection_factors":pf,
            "risk_level":r,"verdict":v,"color":c,"h7_sav":h7s,
            "sutras_with_status":sutras_ws,
            "upay":["शुक्र की उपासना","गुरुवार गुरु पूजा","मंगल शांति पूजा"] if r in("moderate","high") else []}

def compute_jeevanasathi_swabhaav(pl,lg):
    pin7=_pin(pl,7); lord7=_lord(lg,7)
    natures={"Su":"अहंकारी पर प्रतिष्ठित — ego की समस्या","Mo":"भावुक और मूडी — पल-पल बदलता स्वभाव",
             "Ma":"⚠️ आवेगी और झगड़ालू — दांपत्य में विवाद","Me":"बुद्धिमान और हास्यप्रिय — बातूनी",
             "Ju":"गुरु जैसा ज्ञानी — मार्गदर्शक जीवनसाथी","Ve":"आकर्षक पर ईर्ष्यालु — सुंदर जीवनसाथी",
             "Sa":"वफादार और परिपक्व — उम्र में बड़े, जिम्मेदार","Ra":"⚠️ रहस्यमय — धोखे की संभावना, obsessive",
             "Ke":"आध्यात्मिक — कठिन जीवन से गुजरा"}
    icons={"Su":"☀️","Mo":"🌙","Ma":"🔴","Me":"💚","Ju":"🪐","Ve":"💕","Sa":"🪨","Ra":"🐍","Ke":"☄️"}
    descs=[]
    if not pin7:
        lh=_h(pl,lord7)
        descs.append({"planet":PLANET_HI.get(lord7,lord7),"icon":icons.get(lord7,"⭐"),
                      "nature":f"सप्तमेश {PLANET_HI.get(lord7,'')} {lh}वें भाव में — "
                               +("शुभ स्थिति" if lh in(1,4,7,10) else "त्रिक — चुनौती" if lh in(6,8,12) else "सामान्य")})
    else:
        for p in pin7:
            descs.append({"planet":PLANET_HI.get(p,p),"icon":icons.get(p,"⭐"),"nature":natures.get(p,"अज्ञात")})
    return {"computed":True,"descriptions":descs,"planets_in_7":[PLANET_HI.get(p,p) for p in pin7]}

def compute_avivahit_yoga(pl,sav,bav,lg):
    h7s=_sav(sav,7); lord7=_lord(lg,7); l7h=_h(pl,lord7)
    factors=[]
    if l7h in(6,8,12) and _bav(bav,lord7,_r(pl,lord7))<=2:
        factors.append("सप्तमेश त्रिक में + BAV ≤2")
    # NOTE: Ve+Ma in 7th = dono sambandh (2 affairs) — avivahit NAHI
    # Yeh compute_jeevanasathi_swabhaav mein handle hoga
    vh=_h(pl,"Ve")
    if vh in(5,7,9):
        kw=[p for p in KROOR if _h(pl,p)==vh and p!="Ve"]
        if kw: factors.append(f"शुक्र {vh}वें में पाप ग्रह के साथ")
    if h7s<14: factors.append(f"7वें SAV {h7s} < 14")
    risk="high" if len(factors)>=3 else "moderate" if len(factors)==2 else "low" if len(factors)==1 else "none"
    return {"computed":True,"factors":factors,"risk":risk,
            "verdict":"❌ अविवाहित रहने का प्रबल योग" if risk=="high" else "⚠️ विवाह में भारी बाधा" if risk=="moderate" else "🟡 कुछ विवाह बाधा" if risk=="low" else "✅ अविवाहित रहने का कोई योग नहीं",
            "color":"#FB7185" if risk=="high" else "#FB923C" if risk=="moderate" else "#F59E0B" if risk=="low" else "#22D3EE"}

def compute_vivah_kaal(pl,lg,current_dasha=None):
    l2=_lord(lg,2); l7=_lord(lg,7); l11=_lord(lg,11)
    key=list(dict.fromkeys([l7,l2,l11,"Ve","Ra"]+_pin(pl,7)))
    notes=[f"सप्तमेश {PLANET_HI.get(l7,l7)} की महादशा/अंतर्दशा में विवाह संभव",
           f"द्वितीयेश {PLANET_HI.get(l2,l2)} + एकादशेश {PLANET_HI.get(l11,l11)} की दशा देखें",
           "शुक्र की दशा — विवाह कारक","राहु की दशा — अचानक विवाह",
           "गोचर में गुरु+शनि का लग्न/सप्तम पर प्रभाव होने पर समय तय होता है"]
    cn=None
    if current_dasha:
        cn=(f"✅ वर्तमान दशा {PLANET_HI.get(current_dasha,current_dasha)} — विवाह के लिए अनुकूल" if current_dasha in key
            else f"⏳ वर्तमान दशा {PLANET_HI.get(current_dasha,current_dasha)} — प्रतीक्षा करें")
    return {"computed":True,"key_dashas":[PLANET_HI.get(p,p) for p in key[:6]],
            "key_dashas_codes":key[:6],"timing_notes":notes,"current_note":cn,
            "rule":"2/7/11 भाव स्वामी + शुक्र/राहु की दशा में विवाह होता है"}

def compute_daampatya_sukh(pl,sav,bav,lg):
    """Bhav-wise sutras — no hallucinated score formula."""
    h2=_sav(sav,2); h4=_sav(sav,4); h7=_sav(sav,7); h12=_sav(sav,12)
    # Build sutras per bhav
    sutras = []
    # 7th — vivah
    if h7>=28: sutras.append(f"7वाँ भाव SAV {h7} ≥ 28 — विवाह भाव बलवान, सुखमय दांपत्य")
    elif h7<=14: sutras.append(f"7वाँ भाव SAV {h7} < 14 — विवाह भाव अत्यंत कमजोर")
    elif h7<=22: sutras.append(f"7वाँ भाव SAV {h7} (14-22 खतरे का क्षेत्र) — मतभेद संभव")
    else: sutras.append(f"7वाँ भाव SAV {h7} — सामान्य")
    # 4th — ghar/maansik shanti
    if _h(pl,"Ma")==4 or _h(pl,"Sa")==4 or _h(pl,"Ra")==4:
        pa=[p for p in ["Ma","Sa","Ra","Ke"] if _h(pl,p)==4]
        sutras.append(f"4वें भाव में {', '.join(PLANET_HI.get(p,p) for p in pa)} — गृह शांति में बाधा, मानसिक तनाव")
    elif h4>=28: sutras.append(f"4वाँ भाव SAV {h4} — गृह वातावरण शांत, मानसिक सुख")
    # 12th — shaiyya sukh
    if _h(pl,"Ma")==12: sutras.append("12वें में मंगल — कामऊर्जा अधिक, झगड़े भी")
    if _h(pl,"Sa")==12: sutras.append("12वें में शनि — शैय्या सुख में विलंब/कमी")
    if h12>=28: sutras.append(f"12वाँ SAV {h12} — शैय्या सुख अनुकूल")
    elif h12<=14: sutras.append(f"12वाँ SAV {h12} — शैय्या सुख में कमी")
    # 2nd — family/savings
    if h2>=28: sutras.append(f"2रा SAV {h2} — पारिवारिक वातावरण शुभ, आपसी सहयोग")
    elif h2<=14: sutras.append(f"2रा SAV {h2} — परिवार में तनाव, धन विवाद")
    # Guru protection
    if _aspect(pl,"Ju",7) or _h(pl,"Ju")==7: sutras.append("गुरु की 7वें पर दृष्टि/स्थिति — दांपत्य रक्षक")
    # Venus
    vb=_bav(bav,"Ve",_r(pl,"Ve"))
    if vb>=6: sutras.append(f"शुक्र BAV {vb} — विवाह कारक बलवान, प्रेम स्थायी")
    elif vb<=2: sutras.append(f"शुक्र BAV {vb} — विवाह कारक कमजोर")
    return {"computed":True,"sutras":sutras,
            "h7_sav":h7,"h4_sav":h4,"h12_sav":h12,"h2_sav":h2,
            "breakdown":[{"bhav":"7वाँ (विवाह)","sav":h7},
                         {"bhav":"4वाँ (गृह शांति)","sav":h4},
                         {"bhav":"12वाँ (शैय्या)","sav":h12},
                         {"bhav":"2रा (परिवार)","sav":h2}]}


# ═══════════════════════════════════════════════════════════════
# 10. VAIDHAVYA YOGA (Widowhood risk — Stri kundli)
# ═══════════════════════════════════════════════════════════════

def compute_vaidhavya(pl, sav, bav, lg, gender="male"):
    """
    Vaidhavya yoga — mainly for stri kundli.
    Sutras from classical texts + documents.
    """
    if gender.lower() not in ("female","f","stri"):
        return {"computed":True, "applicable":False,
                "note":"वैधव्य योग स्त्री कुंडली में देखा जाता है"}

    lord6  = _lord(lg, 6)
    lord8  = _lord(lg, 8)
    lord7  = _lord(lg, 7)
    h6l_h  = _h(pl, lord6)
    h8l_h  = _h(pl, lord8)
    h7s    = _sav(sav, 7)
    h8s    = _sav(sav, 8)

    factors = []

    # Rule 1: 6th/8th lords in trik (6/8/12) = vaidhavya
    if h6l_h in (6,8,12):
        factors.append(f"षष्ठेश {PLANET_HI.get(lord6,'')} {h6l_h}वें (त्रिक) में — वैधव्य का संकेत")
    if h8l_h in (6,8,12):
        factors.append(f"अष्टमेश {PLANET_HI.get(lord8,'')} {h8l_h}वें (त्रिक) में — वैधव्य का संकेत")

    # Rule 2: Both 6th and 8th lords afflicted
    if h6l_h in (6,8,12) and h8l_h in (6,8,12):
        factors.append("षष्ठेश + अष्टमेश दोनों त्रिक में — प्रबल वैधव्य योग")

    # Rule 3: 7th + 8th both weak (8th = mangalya for women)
    if h7s < 22 and h8s < 22:
        factors.append(f"7वें SAV {h7s} + 8वें SAV {h8s} — दोनों कमजोर, मांगल्य पर खतरा")

    # Rule 4: Saptam + Saptamesh both afflicted
    k7 = [p for p in KROOR if _h(pl,p)==7]
    h7l_h = _h(pl, lord7)
    if k7 and h7l_h in (6,8,12):
        factors.append(f"7वें में पाप + सप्तमेश {h7l_h}वें — गंभीर")

    # Rule 5: Guru bal (critical for stri)
    ju_h = _h(pl, "Ju")
    ju_r = _r(pl, "Ju")
    ju_b = _bav(bav, "Ju", ju_r)
    if ju_h in (4,8,12) or ju_b <= 2:
        factors.append(f"गुरु {ju_h}वें भाव में / BAV {ju_b} — स्त्री के लिए गुरु बल कमजोर")

    # Protection
    pf = []
    if _aspect(pl,"Ju",7) or _aspect(pl,"Ju",8):
        pf.append("गुरु की 7/8वें पर दृष्टि — सुहाग रक्षक")
    if h8s >= 28:
        pf.append(f"8वें SAV {h8s} ≥ 28 — मांगल्य बलवान")

    has_risk = len(factors) >= 2
    return {
        "computed":    True,
        "applicable":  True,
        "factors":     factors,
        "protect":     pf,
        "has_risk":    has_risk,
        "verdict": "⚠️ वैधव्य योग के संकेत — गुरु पूजा करें" if has_risk else "✅ वैधव्य का कोई प्रबल योग नहीं",
        "color":   "#FB923C" if has_risk else "#22D3EE",
        "note_8th": "स्त्री कुंडली में 8वाँ भाव = सुहाग/मांगल्य का भाव। इसका बलवान होना जरूरी है।",
    }


# ═══════════════════════════════════════════════════════════════
# 11. DWI BHARYA / DWI BHARTRI YOGA (Second marriage)
# ═══════════════════════════════════════════════════════════════

def compute_dwi_vivah(pl, sav, bav, lg, gender="male"):
    """
    Second marriage indicators (Dwi Bharya/Bhartri yoga).
    """
    lord7  = _lord(lg, 7)
    lord1  = _lord(lg, 1)
    h7l_h  = _h(pl, lord7)
    h1l_h  = _h(pl, lord1)
    pin7   = _pin(pl, 7)
    k7     = [p for p in pin7 if p in KROOR]
    s7     = [p for p in pin7 if p in SHUBH]

    factors = []

    # Rule 1: Paap in 7th + no shubh
    if k7 and not s7 and not _aspect(pl,"Ju",7):
        factors.append(f"7वें में पाप ({', '.join(PLANET_HI.get(p,p) for p in k7)}) + गुरु की दृष्टि नहीं — द्विभार्या संभव")

    # Rule 2: Lagnesh in 7/8 + saptamesh nirbal
    if h1l_h in (7,8):
        lord7_bav = _bav(bav, lord7, _r(pl,lord7))
        if lord7_bav <= 3:
            factors.append(f"लग्नेश {h1l_h}वें + सप्तमेश BAV {lord7_bav} — निर्बल")

    # Rule 3: Saptamesh nirbal in trik
    if h7l_h in (6,8,12):
        factors.append(f"सप्तमेश {PLANET_HI.get(lord7,'')} {h7l_h}वें भाव में — निर्बल सप्तमेश")

    # Rule 4: Multiple paap on 7th + saptamesh
    kd7 = [p for p in KROOR if _aspect(pl,p,7)]
    if len(k7) + len(kd7) >= 3:
        factors.append(f"3+ पाप ग्रह 7वें पर — द्विविवाह का योग")

    # Rule 5: Venus + Mars both in 7th
    if _h(pl,"Ve")==7 and _h(pl,"Ma")==7:
        factors.append("शुक्र + मंगल दोनों 7वें — द्विविवाह का सूत्र")

    # Rule 6: Dwisswabhav lagna (Mithun/Kanya/Dhanu/Meen)
    if lg in (2, 5, 8, 11):  # 0-based: Mithun=2, Kanya=5, Dhanu=8, Meen=11
        factors.append(f"द्विस्वभाव लग्न ({RASHI_HI[lg]}) — बहुविवाह के सर्वाधिक केस इन्हीं लग्नों में")

    su_pati = []
    # Su Bharya/Pati yoga (good spouse)
    if _aspect(pl,"Ju",lord7) or _h(pl,"Ju")==_h(pl,lord7):
        su_pati.append(f"गुरु की सप्तमेश पर दृष्टि/युति — सुभार्या/सुपति योग")
    if h7l_h in (4,10):
        su_pati.append(f"सप्तमेश {h7l_h}वें (केंद्र) में — गुणवती/गुणवान जीवनसाथी")

    return {
        "computed":    True,
        "factors":     factors,
        "su_pati_yoga": su_pati,
        "has_risk":    len(factors) >= 2,
        "verdict": "⚠️ द्विविवाह के संकेत" if len(factors) >= 2 else "✅ द्विविवाह का कोई प्रबल योग नहीं",
        "color":   "#FB923C" if len(factors) >= 2 else "#22D3EE",
        "lagna_rashi": RASHI_HI[lg],
        "note": "द्विस्वभाव लग्न (मिथुन/कन्या/धनु/मीन) में सर्वाधिक बहुविवाह केस देखे गए हैं।",
    }


# ═══════════════════════════════════════════════════════════════
# 12. VYABHICHAR / CHARITRA YOGA (Infidelity)
# ═══════════════════════════════════════════════════════════════

def compute_vyabhichar(pl, sav, bav, lg):
    """
    Infidelity / character indicators.
    Classical sutras from documents.
    Note: These are indicators only — context matters.
    """
    lord2  = _lord(lg, 2)
    lord6  = _lord(lg, 6)
    lord7  = _lord(lg, 7)
    lord1  = _lord(lg, 1)
    lord10 = _lord(lg, 10)

    factors = []

    # Rule 1: Shukra paap ke saath lagna mein + lord connection
    ve_h = _h(pl,"Ve")
    if ve_h == 1:
        paap_with_ve = [p for p in KROOR if _h(pl,p)==1 and p!="Ve"]
        if paap_with_ve and (_h(pl,lord2)==1 or _h(pl,lord6)==1 or _h(pl,lord7)==1):
            factors.append(f"शुक्र लग्न में पाप ({', '.join(PLANET_HI.get(p,p) for p in paap_with_ve)}) + 2/6/7वें स्वामी साथ — व्यभिचार योग")

    # Rule 2: 2nd/7th/10th lord in 10th together
    h2l_h = _h(pl, lord2); h7l_h = _h(pl, lord7); h10l_h = _h(pl, lord10)
    if h2l_h == 10 and h7l_h == 10:
        factors.append(f"द्वितीयेश + सप्तमेश दोनों 10वें — व्यभिचार का सूत्र")

    # Rule 3: Shukra-Budh yutti in 7/8/10
    if _h(pl,"Ve")==_h(pl,"Me") and _h(pl,"Ve") in (7,8,10):
        factors.append(f"शुक्र-बुध युति {_h(pl,'Ve')}वें भाव में — व्यभिचार का संकेत")

    # Rule 4: Chandra+Mangal+Surya in 7th
    in7 = _pin(pl, 7)
    if "Mo" in in7 and "Ma" in in7 and "Su" in in7:
        factors.append("चंद्र+मंगल+सूर्य तीनों 7वें — प्रबल योग")
    elif "Mo" in in7 and "Ma" in in7:
        factors.append("चंद्र+मंगल 7वें — चरित्र पर संदेह")

    # Rule 5: Lagnesh paap se yukt
    h1l_h = _h(pl, lord1)
    paap_with_l1 = [p for p in KROOR if _h(pl,p)==h1l_h and p!=lord1]
    if len(paap_with_l1) >= 2:
        factors.append(f"लग्नेश {PLANET_HI.get(lord1,'')} के साथ {len(paap_with_l1)} पाप ग्रह")

    # Rule 6: Shani 2nd/12th = vyabhichar
    sa_h = _h(pl,"Sa")
    if sa_h in (2, 12):
        factors.append(f"शनि {sa_h}वें भाव में — व्यभिचार का सूत्र (शास्त्रोक्त)")

    # Protection: Guru + Navama strong
    pf = []
    ju_h = _h(pl,"Ju")
    if ju_h in (1,4,5,7,9,10) or _aspect(pl,"Ju",1) or _aspect(pl,"Ju",7):
        pf.append("गुरु का लग्न/7वें पर प्रभाव — चरित्र की रक्षा")
    h9s = _sav(sav, 9)
    if h9s >= 28:
        pf.append(f"9वें SAV {h9s} ≥ 28 — धर्म भाव बलवान, नैतिकता प्रबल")

    return {
        "computed":        True,
        "factors":         factors,
        "protect_factors": pf,
        "has_risk":        len(factors) >= 2,
        "verdict": "⚠️ चरित्र पर प्रश्नचिह्न — संकेत हैं" if len(factors) >= 2 else "✅ चरित्र योग अनुकूल",
        "color":   "#FB7185" if len(factors) >= 2 else "#22D3EE",
        "important_note": "📌 ये संकेत हैं — दशा + परिस्थिति + इच्छाशक्ति भी भूमिका निभाती है। अंतिम निर्णय आप स्वयं लें।",
    }


# ═══════════════════════════════════════════════════════════════
# 13. PREM SAMBANDH VS PREM VIVAH (Love vs Marriage)
# ═══════════════════════════════════════════════════════════════

def compute_prem_sambandh(pl, sav, lg, gender="male"):
    """
    Prem sambandh hona alag, vivah tak pahunchna alag.
    Stable love = fixed signs in 5th.
    """
    lord5 = _lord(lg, 5)
    lord7 = _lord(lg, 7)
    h5    = _h(pl, lord5)
    h7    = _h(pl, lord7)
    h5_sav = _sav(sav, 5)

    # 5th sign
    rashi5 = (lg + 4) % 12  # 5th house rashi (0-based)
    FIXED_SIGNS = {1, 4, 7, 10}  # Vrishabh, Simha, Vrishchik, Kumbha

    # Moon rashi
    mo_r = _r(pl, "Mo")

    love_strength = []
    vivah_strength = []
    breakup_risk = []

    # Love indicators
    karak = "Ve" if gender.lower() not in ("female","f") else "Ma"
    karak_h = _h(pl, karak)
    if karak_h == h5 or _h(pl,karak)==5 or _aspect(pl,karak,5):
        love_strength.append(f"प्रेम कारक ({PLANET_HI.get(karak,karak)}) का 5वें से संबंध — गहरा प्रेम")

    # Stable love = fixed sign in 5th
    if rashi5 in FIXED_SIGNS:
        love_strength.append(f"5वाँ भाव स्थिर राशि ({RASHI_HI[rashi5]}) — एक के प्रति गहरा और स्थायी प्रेम")
    elif rashi5 in (0,3,6,9):  # Char rashis
        love_strength.append(f"5वाँ भाव चर राशि ({RASHI_HI[rashi5]}) — अनेक प्रेम संबंध संभव, timepass भी")
    else:  # Dwisswabhav
        love_strength.append(f"5वाँ भाव द्विस्वभाव ({RASHI_HI[rashi5]}) — शुरुआत में तीव्र, स्थायित्व कम")

    # Moon also in fixed = chir-sthaya prem
    if mo_r in FIXED_SIGNS:
        love_strength.append(f"चंद्रमा स्थिर राशि ({RASHI_HI[mo_r]}) में — प्रेम जीवन भर नहीं भूलते")

    # Vivah tak pahunchna
    if h5 == 7 or h7 == 5:
        vivah_strength.append("पंचमेश/सप्तमेश 5-7 में — प्रेम विवाह में बदलने का योग")
    if _aspect(pl,lord5,7) or _aspect(pl,lord7,5):
        vivah_strength.append("5-7 भाव/स्वामी में दृष्टि संबंध — विवाह संभव")

    # Slow-moving planets in 5/7 = permanent
    slow = ["Sa","Ju","Ra"]
    slow_in_57 = [p for p in slow if _h(pl,p) in (5,7)]
    if slow_in_57:
        vivah_strength.append(f"धीमे ग्रह ({', '.join(PLANET_HI.get(p,p) for p in slow_in_57)}) 5/7वें में — चिरस्थायी प्रेम स्मृति")

    # Breakup risk
    ve_r = _r(pl,"Ve")
    su_r = _r(pl,"Su")
    # Shukra in Sun's nakshatra = ashaphal prem
    # Simplified check: Ve + Su in same sign
    if ve_r == su_r:
        breakup_risk.append("शुक्र + सूर्य एक राशि में — प्रेम असफल होने की संभावना (अस्त शुक्र)")
    if _aspect(pl,"Sa",5) and not _aspect(pl,"Ju",5):
        breakup_risk.append("शनि की 5वें पर दृष्टि (गुरु रक्षा नहीं) — प्रेम में बाधा")

    # Panchami + Saptami lords both weak
    l5_bav = _bav({},lord5,_r(pl,lord5)) if False else 0  # simplified
    if h5 in (6,8,12) and h7 in (6,8,12):
        breakup_risk.append("पंचमेश + सप्तमेश दोनों त्रिक में — प्रेम विवाह में सफलता कठिन")

    return {
        "computed":       True,
        "love_strength":  love_strength,
        "vivah_strength": vivah_strength,
        "breakup_risk":   breakup_risk,
        "prem_type": (
            "💪 स्थायी प्रेम — एक के प्रति दृढ़ संकल्पित" if rashi5 in FIXED_SIGNS else
            "🔄 अनेक प्रेम संबंध — Timepass की संभावना" if rashi5 in (0,3,6,9) else
            "🌗 प्रेम में उतार-चढ़ाव"
        ),
        "note": "📜 प्रेम संबंध होना और प्रेम विवाह तक पहुँचना दो अलग बातें हैं। दोनों के लिए अलग ग्रह योग चाहिए।",
    }


# ═══════════════════════════════════════════════════════════════
# 14. VIVAH BHAGYA (Lucky after marriage — Saptamesh+Navamesh)
# ═══════════════════════════════════════════════════════════════

def compute_vivah_bhagya(pl, lg):
    """Saptamesh + Navamesh ka sambandh = bhagya after marriage."""
    lord7 = _lord(lg,7); lord9 = _lord(lg,9)
    lord11 = _lord(lg,11)
    h7l = _h(pl,lord7); h9l = _h(pl,lord9)
    factors = []

    # Rule: 7th + 9th lords in conjunction or mutual aspect
    if h7l == h9l:
        factors.append(f"सप्तमेश ({PLANET_HI.get(lord7,'')}) + नवमेश ({PLANET_HI.get(lord9,'')}) एक भाव में — विवाह के बाद प्रबल भाग्योदय")
    if _aspect(pl,lord7,h9l) or _aspect(pl,lord9,h7l):
        factors.append(f"सप्तमेश-नवमेश में दृष्टि संबंध — शादी के बाद तरक्की")
    # Mitra relation (simplified)
    if lord7 in SHUBH and lord9 in SHUBH:
        factors.append(f"सप्तमेश + नवमेश दोनों शुभ — विवाह के बाद जीवन सुखमय")

    # 11th connection adds gains
    if h7l == h9l == _h(pl,lord11):
        factors.append("सप्तमेश+नवमेश+एकादशेश एक साथ — विवाह = अपार धन + भाग्य")

    # Divorce timing hint
    timing = []
    sep = [p for p in ["Sa","Ra","Ke"] if _h(pl,p)==7]
    if sep:
        timing.append(f"तलाक का समय: 7वें में {', '.join(PLANET_HI.get(p,p) for p in sep)} की दशा में")
    l7h_kroor = [p for p in KROOR if _h(pl,p)==h7l and p!=lord7]
    if l7h_kroor:
        timing.append(f"या सप्तमेश के साथ {', '.join(PLANET_HI.get(p,p) for p in l7h_kroor)} की दशा में")

    return {"computed":True,"bhagya_factors":factors,"timing_sutras":timing,
            "rule":"नियम: सप्तमेश और नवमेश (युति/दृष्टि) = विवाह बाद भाग्य। तलाक: 7वें के अलगाववादी ग्रह की दशा में।"}


# ═══════════════════════════════════════════════════════════════
# 15. DAIHI AAKRSHAN (Physical/Platonic attraction)
# ═══════════════════════════════════════════════════════════════

def compute_daihi_aakrshan(pl, lg):
    """Sharirik akarshan aur platonic love sutras."""
    factors = []
    ve_r=_r(pl,"Ve"); ma_r=_r(pl,"Ma")
    mo_r=_r(pl,"Mo"); su_h=_h(pl,"Su"); ve_h=_h(pl,"Ve")
    ju_h=_h(pl,"Ju"); mo_h=_h(pl,"Mo"); sa_h=_h(pl,"Sa"); ra_h=_h(pl,"Ra")

    AGNI = {0,4,8}   # Mesh, Simha, Dhanu
    JAL  = {3,7,11}  # Kark, Vrishchik, Meen

    # Mars+Venus in agni sign = wild
    if ve_r in AGNI and ma_r == ve_r:
        factors.append(f"मंगल+शुक्र अग्नितत्व राशि ({RASHI_HI[ve_r]}) में — अत्यंत प्रबल कामुकता")
    # Moon+Venus in jal sign = soft
    if mo_r in JAL and ve_r == mo_r:
        factors.append(f"चंद्र+शुक्र जलतत्व राशि ({RASHI_HI[ve_r]}) में — कोमल और भावनात्मक प्रेम")
    # Shani+Rahu = asvabhavik (unnatural)
    if sa_h == ra_h:
        factors.append(f"शनि+राहु {sa_h}वें भाव में युति — अप्राकृतिक आकर्षण का संकेत")
    # Platonic: Guru in 1/4/9
    if ju_h in (1,4,9):
        factors.append(f"गुरु {ju_h}वें भाव में — दिव्य/प्लेटोनिक प्रेम प्रबल, भावनात्मक लगाव")
    # Chandra+Mangal = same-sex (sensitive — indicator only)
    if mo_h == _h(pl,"Ma"):
        factors.append("चंद्र+मंगल एक भाव में — भावनाओं में तीव्रता, कभी-कभी सजातीय आकर्षण का संकेत")
    # Venus combust = frustration
    if ve_h == su_h:
        factors.append("शुक्र अस्त (सूर्य के साथ) — काम जीवन में निराशा/रुचि में कमी")
    # Shukra 12th = early romance
    if ve_h == 12:
        factors.append("शुक्र 12वें भाव में — छोटी उम्र में ही प्रेम प्रसंग")
    # Venus 10th from Moon = flirtatious
    mo_to_ve = ((ve_h - mo_h) % 12) + 1
    if mo_to_ve == 10:
        factors.append("चंद्र से 10वें शुक्र — इश्क मिजाजी स्वभाव, रोमांटिक/Flirtatious")
    # Retrograde in 7th = karmic partner
    retro_7 = [p for p in ["Sa","Ju","Ma","Me","Ve"] if _h(pl,p)==7 and _retro(pl,p)]
    if retro_7:
        factors.append(f"7वें में वक्री {', '.join(PLANET_HI.get(p,p) for p in retro_7)} — पूर्वजन्म का कर्मिक साथी, यादें सताएंगी")

    # Mercury as catalyst (Ma+Ve+Me)
    if _h(pl,"Ma")==_h(pl,"Ve") and _h(pl,"Me")==_h(pl,"Ma"):
        factors.append(f"मंगल+शुक्र+बुध एक भाव में — वासना की आग में बुध घी का काम करेगा, संयम कठिन")

    return {"computed":True,"factors":factors,
            "note":"📌 ये संकेत हैं। परिस्थिति और इच्छाशक्ति भी महत्वपूर्ण हैं।"}


# ═══════════════════════════════════════════════════════════════
# 16. KUL NIRDHARAN (Class/Family background of spouse)
# ═══════════════════════════════════════════════════════════════

def compute_kul_nirdharan(pl, bav, lg):
    """Spouse ka kul (class) — saptamesh vs lagnesh bal."""
    lord1=_lord(lg,1); lord7=_lord(lg,7)
    l1_bav=_bav(bav,lord1,_r(pl,lord1)); l7_bav=_bav(bav,lord7,_r(pl,lord7))
    l1_h=_h(pl,lord1); l7_h=_h(pl,lord7)

    # Degree-based combust (NOT same-house — that was the bug)
    su_deg=_get_full_degree(pl,"Su"); l7_deg=_get_full_degree(pl,lord7)
    l7_combust=(su_deg is not None and l7_deg is not None and _angular_dist(su_deg,l7_deg)<10)

    is_retro  = _retro(pl,lord7)
    is_neech  = _r(pl,lord7)==NEECH.get(lord7,-1)
    is_trik   = l7_h in(6,8,12)
    is_nirbal = l7_bav<=2

    # Track each weak reason separately — no blanket string
    weak_reasons=[]
    if l7_combust: weak_reasons.append(f"अस्त (सूर्य से <10°)")
    if is_retro:   weak_reasons.append("वक्री")
    if is_neech:   weak_reasons.append("नीच राशि में")
    if is_trik:    weak_reasons.append(f"{l7_h}वें (त्रिक) में")
    if is_nirbal:  weak_reasons.append(f"BAV {l7_bav} (अत्यंत कमजोर)")

    l7_weak=bool(weak_reasons)

    sutras=[]
    if l7_bav>l1_bav and not l7_weak:
        sutras.append(f"✅ सप्तमेश BAV {l7_bav} > लग्नेश BAV {l1_bav} — उच्च कुल में विवाह")
    elif l7_weak:
        sutras.append(f"⚠️ सप्तमेश {PLANET_HI.get(lord7,'')} कमजोर ({' + '.join(weak_reasons)}) — अपने से नीचे कुल में विवाह")
        if is_retro and l7_h==7:
            sutras.append(f"⚠️ 7वें में वक्री {PLANET_HI.get(lord7,'')} — जीवनसाथी झूठा निकल सकता है")
    else:
        sutras.append(f"🟡 सप्तमेश BAV {l7_bav} — समान कुल में विवाह")

    # Navamsha hint only if D1 itself confirms neech/trik
    if is_neech or is_trik:
        sutras.append("📌 नवमांश में सप्तमेश कमजोर — D9 से भी जांच करें")

    return {"computed":True,"sutras":sutras,"lord7_bav":l7_bav,"lord1_bav":l1_bav,
            "weak_reasons":weak_reasons,"l7_weak":l7_weak}


# ═══════════════════════════════════════════════════════════════
# 17. 7TH BHAV DANGEROUS COMBOS
# ═══════════════════════════════════════════════════════════════

def compute_7th_combos(pl, lg):
    """7vein bhav ke dangerous planet combinations."""
    pin7 = _pin(pl,7); sutras = []

    # Ma+Sa = partner becomes enemy
    if "Ma" in pin7 and "Sa" in pin7:
        sutras.append("⚔️ मंगल+शनि 7वें में — जीवनसाथी ही दुश्मन बन जाएगा, विरोध अत्यधिक")
    # Ma+Ve = two simultaneous affairs
    if "Ma" in pin7 and "Ve" in pin7:
        sutras.append("💔 मंगल+शुक्र 7वें में — जातक/जातिका एक साथ दो संबंध स्थापित करता है")
    # Ra+Sa = unusual relations
    if "Ra" in pin7 and "Sa" in pin7:
        sutras.append("⚠️ राहु+शनि 7वें में — निम्न वर्ग या असामान्य संबंधों की ओर आकर्षण")
    # Su in 7th = ego partner
    if "Su" in pin7:
        sutras.append("☀️ सूर्य 7वें में — अहंकारी जीवनसaathi, रिश्ते में ego का संघर्ष")
    # Ve in 7th = attractive but jealousy
    if "Ve" in pin7:
        sutras.append("💕 शुक्र 7वें में — आकर्षक जीवनसाथी लेकिन वही आकर्षण जलन का कारण बनेगा, दांपत्य फीका")
    # Sa in 7th vakri = liar
    if "Sa" in pin7 and _retro(pl,"Sa"):
        sutras.append("🪨 शनि 7वें में वक्री — जीवनसाथी झूठा, नीचे जाति में विवाह संभव")
    # Ma in Mesh in 7th = love marriage
    if "Ma" in pin7 and _r(pl,"Ma")==0:
        sutras.append("✅ मंगल मेष (स्वराशि) 7वें में — प्रेम विवाह का विशेष योग")
    # Ke in 7th = victim partner
    if "Ke" in pin7:
        sutras.append("☄️ केतु 7वें में — जीवनसाथी Victim-type, जीवन में भारी कष्ट झेला होगा, सहारे की जरूरत")
    # Mo in 7th = moody
    if "Mo" in pin7:
        sutras.append("🌙 चंद्र 7वें में — मूडी जीवनसाथी, पल-पल बदलता स्वभाव")
    # Ju in 7th = good but vaasnaa
    if "Ju" in pin7:
        sutras.append("🪐 गुरु 7वें में — ज्ञानी जीवनसाथी, लेकिन 7वाँ रजोगुण भाव है, शारीरिक इच्छाएं भी प्रबल")

    return {"computed":True,"sutras":sutras,"planets_in_7":[PLANET_HI.get(p,p) for p in pin7]}


# ═══════════════════════════════════════════════════════════════
# 18. SHUKRA SEPARATIVE CHECK
# ═══════════════════════════════════════════════════════════════

def compute_shukra_separative(pl, lg):
    """
    Shukra uchha hone ke bawajood separative ban sakta hai.
    Venus own signs: Vrishabh(1), Tula(6) — 0-based.
    """
    ve_r=_r(pl,"Ve"); ve_h=_h(pl,"Ve")
    su_h=_h(pl,"Su"); mo_h=_h(pl,"Mo")
    VENUS_RASHIS=(1,6)   # Vrishabh=1, Tula=6

    sutras=[]

    # Rule 1: Venus combust — degree-based (<10°), NOT same house
    su_deg=_get_full_degree(pl,"Su"); ve_deg=_get_full_degree(pl,"Ve")
    ve_combust=(su_deg is not None and ve_deg is not None and _angular_dist(su_deg,ve_deg)<10)
    if ve_combust:
        sutras.append(f"⚠️ शुक्र अस्त (सूर्य से <10°) — प्रेम संबंध होने पर भी सफलता नहीं, दिल टूटेगा")

    # Rule 2: Venus sandwiched Su-Mo (paapkartari) — house-based approx
    if su_h!=0 and mo_h!=0 and su_h!=mo_h:
        dist_su=(ve_h-su_h)%12
        dist_mo=(mo_h-ve_h)%12
        if dist_su<=3 and dist_mo<=3 and dist_su>0 and dist_mo>0:
            sutras.append("⚠️ शुक्र सूर्य और चंद्र के बीच — प्रेम में बाधाएं (पापकर्तरी जैसी स्थिति)")

    # Rule 3: Sun in Venus's OWN RASHI (Vrishabh/Tula) — check rashi, not house
    su_r=_r(pl,"Su")
    if su_r in VENUS_RASHIS:
        sutras.append(f"⚠️ सूर्य शुक्र की राशि ({RASHI_HI[su_r]}) में — उच्च शुक्र भी अलगाववादी बन सकता है")

    # Rule 4: Su+Ve same house AND in 5/7/9
    if su_h==ve_h and su_h in(5,7,9):
        sutras.append(f"⚠️ सूर्य+शुक्र {su_h}वें भाव में — पति/पत्नी सुख में कमी")

    return {"computed":True,"sutras":sutras}


# ═══════════════════════════════════════════════════════════════
# 19. ANTERJATIYA IMPROVED (Lords + aspects)
# ═══════════════════════════════════════════════════════════════

def compute_anterjatiya_deep(pl, lg):
    """
    Improved intercaste check — houses + lords + aspects.
    Also checks Neech Bhang (cancellation) of Shani.
    """
    lord5=_lord(lg,5); lord7=_lord(lg,7); lord9=_lord(lg,9)
    h5l=_h(pl,lord5); h7l=_h(pl,lord7); h9l=_h(pl,lord9)
    ra_h=_h(pl,"Ra"); sa_h=_h(pl,"Sa"); sa_r=_r(pl,"Sa")

    factors=[]

    # Check Ra/Sa in 5/7/9
    for p,ph in [("Ra",ra_h),("Sa",sa_h)]:
        if ph in(5,7,9):
            factors.append(f"{PLANET_HI.get(p,p)} {ph}वें (धर्म/प्रेम/विवाह) भाव में — अंतर्जातीय योग")

    # Check Ra/Sa with lords
    for p in ["Ra","Sa"]:
        ph=_h(pl,p)
        if ph in(h5l,h7l,h9l):
            factors.append(f"{PLANET_HI.get(p,p)} {ph}वें में = ५/७/९ स्वामी के साथ — अंतर्जातीय")
        if _aspect(pl,p,h5l) or _aspect(pl,p,h7l) or _aspect(pl,p,h9l):
            factors.append(f"{PLANET_HI.get(p,p)} की ५/७/९ स्वामी पर दृष्टि — अंतर्जातीय संभव")

    factors=list(set(factors))

    # ── Neech Bhang of Shani ──────────────────────────────────
    # Shani neech = Mesh(0). Neech Bhang: lord of neech rashi (Mangal) in kendra,
    # OR exaltation lord (Tula=6, lord=Shukra) in kendra from lagna/Moon
    shani_neech = (sa_r==0)  # Mesh
    shani_neech_bhang=False
    nbhang_reason=""
    if shani_neech:
        # Mars (lord of Mesh) in kendra (1/4/7/10)
        if _h(pl,"Ma") in(1,4,7,10):
            shani_neech_bhang=True
            nbhang_reason="मंगल (मेष स्वामी) केंद्र में — शनि नीच भंग"
        # Venus (Tula lord = exalt lord of Shani) in kendra
        elif _h(pl,"Ve") in(1,4,7,10):
            shani_neech_bhang=True
            nbhang_reason="शुक्र (तुला स्वामी) केंद्र में — शनि नीच भंग"
        # Exaltation lord (Saturn exalts in Tula) in kendra from Moon
        mo_h=_h(pl,"Mo")
        if mo_h and _h(pl,"Ve") in[((mo_h-1+k)%12)+1 for k in(0,3,6,9)]:
            shani_neech_bhang=True
            nbhang_reason=(nbhang_reason+" + " if nbhang_reason else "")+"चंद्र से शुक्र केंद्र में — शनि नीच भंग"

    # ── Sajatiya counters ─────────────────────────────────────
    sajatiya_factors=[]
    ju_h=_h(pl,"Ju")
    if ju_h in(5,7,9):
        sajatiya_factors.append(f"गुरु {ju_h}वें में — सजातीय/परिवार-अनुमोदित विवाह की ओर खिंचाव")
    if _aspect(pl,"Ju",h5l) or _aspect(pl,"Ju",h7l) or _aspect(pl,"Ju",h9l):
        sajatiya_factors.append("गुरु की ५/७/९ स्वामी पर दृष्टि — परिवार सहमति, सजातीय संभव")

    # ── Contradiction verdict ──────────────────────────────────
    has_anterjatiya=len(factors)>=1
    has_sajatiya=len(sajatiya_factors)>=1
    contradiction=has_anterjatiya and has_sajatiya

    if contradiction:
        if shani_neech_bhang:
            verdict=f"⚠️ विरोधाभास: अंतर्जातीय + सजातीय दोनों के संकेत हैं — लेकिन {nbhang_reason}, इसलिए शनि का अंतर्जातीय प्रभाव कमजोर। गुरु प्रभाव से सजातीय विवाह ज्यादा संभव।"
        else:
            verdict="⚠️ विरोधाभास: अंतर्जातीय + सजातीय दोनों के संकेत हैं — अन्य कारकों (दशा, D9) से निर्णय करें।"
    elif has_anterjatiya:
        if shani_neech_bhang:
            verdict=f"🟡 अंतर्जातीय संकेत हैं लेकिन {nbhang_reason} — प्रभाव कमजोर।"
        else:
            verdict="⚠️ अंतर्जातीय विवाह के प्रबल संकेत।"
    else:
        verdict="✅ अंतर्जातीय विवाह का कोई प्रबल योग नहीं — सजातीय विवाह अधिक संभव।"

    return {"computed":True,"factors":factors,"has_anterjatiya":has_anterjatiya,
            "sajatiya_factors":sajatiya_factors,"has_sajatiya":has_sajatiya,
            "contradiction":contradiction,"shani_neech_bhang":shani_neech_bhang,
            "nbhang_reason":nbhang_reason,"verdict":verdict,
            "rule":"राहु/शनि का 5/7/9 भाव या उनके स्वामियों पर प्रभाव = अंतर्जातीय/अन्य धर्म में विवाह"}


# ═══════════════════════════════════════════════════════════════
# 20. VYABHICHAR DEEP (with dasha age check note)
# ═══════════════════════════════════════════════════════════════

def compute_vyabhichar_deep(pl, sav, bav, lg, current_dasha=None, current_age=None):
    """Infidelity indicators with dasha-age safety valve."""
    lord1=_lord(lg,1); lord2=_lord(lg,2)
    lord6=_lord(lg,6); lord7=_lord(lg,7); lord10=_lord(lg,10)
    h1l=_h(pl,lord1); h10l=_h(pl,lord10)

    factors = []

    # Rule 1: Ve paap ke saath lagna mein + 2/6/7 lord saath
    ve_h=_h(pl,"Ve")
    if ve_h==1:
        pw=[p for p in KROOR if _h(pl,p)==1]
        l_lords=[l for l in [lord2,lord6,lord7] if _h(pl,l)==1]
        if pw and l_lords:
            factors.append(f"शुक्र लग्न में पाप ({', '.join(PLANET_HI.get(p,p) for p in pw)}) + 2/6/7वें स्वामी साथ")

    # Rule 2: 2nd/7th/10th lords together in 10th
    if _h(pl,lord2)==10 and _h(pl,lord7)==10:
        factors.append(f"द्वितीयेश+सप्तमेश दोनों 10वें भाव में")

    # Rule 3: Ve+Me in 7/8/10
    if _h(pl,"Ve")==_h(pl,"Me") and _h(pl,"Ve") in(7,8,10):
        factors.append(f"शुक्र+बुध {_h(pl,'Ve')}वें भाव में")

    # Rule 4: Su+Mo+Ma all in 7th
    if all(_h(pl,p)==7 for p in ["Su","Mo","Ma"]):
        factors.append("सूर्य+चंद्र+मंगल तीनों 7वें — प्रबल योग")

    # Rule 5: Lagnesh + shadesh paap se yukt
    paap_with_l1=[p for p in KROOR if _h(pl,p)==h1l and p!=lord1]
    paap_with_l6=[p for p in KROOR if _h(pl,p)==_h(pl,lord6)]
    if len(paap_with_l1)>=2 and paap_with_l6:
        factors.append(f"लग्नेश + षष्ठेश दोनों पाप ग्रहों से युक्त")

    # Rule 6: Shani 2/12 = vyabhichar
    if _h(pl,"Sa") in(2,12):
        factors.append(f"शनि {_h(pl,'Sa')}वें भाव में — शास्त्रानुसार व्यभिचार योग")

    # Rule 7: 9th bhav peedit = no dharmic fear (open shamelessness)
    h9s=_sav(sav,9); k9=[p for p in KROOR if _h(pl,p)==9]
    if k9 and h9s<22:
        factors.append(f"9वाँ भाव (धर्म) पीड़ित — समाज/धर्म का डर नहीं, खुलेआम स्वीकार करेगा")

    # Dasha safety valve
    dasha_note = None
    if factors:
        dasha_note = "⚠️ महत्वपूर्ण: यदि इन ग्रहों की दशा 'भरी जवानी' (25-45 वर्ष) में न आए, तो योग निष्फल। बचपन या बुढ़ापे की दशा में खतरा कम।"
        if current_dasha:
            dasha_note += f" वर्तमान दशा: {PLANET_HI.get(current_dasha,current_dasha)}"

    # Protection
    pf = []
    if _h(pl,"Ju") in(1,4,5,7,9,10) or _aspect(pl,"Ju",1) or _aspect(pl,"Ju",7):
        pf.append("गुरु का लग्न/7वें पर प्रभाव — चरित्र की रक्षा")
    if h9s>=28:
        pf.append(f"9वाँ SAV {h9s} ≥ 28 — धर्म भाव बलवान, नैतिकता प्रबल")

    has_risk = len(factors) >= 2
    return {"computed":True,"factors":factors,"protect_factors":pf,"dasha_note":dasha_note,
            "has_risk":has_risk,
            "color":"#FB7185" if has_risk else "#22D3EE",
            "verdict":"⚠️ चरित्र पर प्रश्नचिह्न — संकेत हैं" if has_risk else "✅ चरित्र योग अनुकूल",
            "important_note":"📌 ये संकेत हैं — दशा + परिस्थिति + इच्छाशक्ति भी भूमिका निभाती है। अंतिम निर्णय आप स्वयं लें।"}


# ═══════════════════════════════════════════════════════════════
# 21. MUHURTA ANALYSIS (Marriage timing auspiciousness)
# ═══════════════════════════════════════════════════════════════

def compute_muhurta_notes():
    """
    Vivah muhurta ke niyam — D1 se independent (lagna ka samay dekhna padega).
    Note: Ye rules muhurta ki kundli ke liye hain, birth chart ke liye nahi.
    """
    return {
        "computed": True,
        "badhir_lagnas": [
            "🔇 दिन में: तुला, वृश्चिक — बधिर लग्न (विवाह वर्जित, दरिद्रता देती है)",
            "🔇 रात में: मकर — बधिर लग्न",
        ],
        "andhi_lagnas": [
            "🙈 दिन में: सिंह, मेष, वृषभ — अंधी लग्न (अलगाव या संतानहीनता)",
            "🙈 रात में: कन्या, मिथुन, कर्क — अंधी लग्न",
        ],
        "pangu_lagnas": [
            "🦽 दिन में: कुंभ — पंगु लग्न (धन नाश, मर्यादा का नाश)",
            "🦽 रात में: मीन — पंगु लग्न",
        ],
        "kubdi_lagnas": [
            "🏚️ सुबह+शाम: सिंह, मेष, वृषभ, मकर, कुंभ, मीन — कुबड़ी लग्न (गोधूलि वेला में वर्जित)",
        ],
        "lagna_shuddhi": [
            "🚫 7वाँ भाव बिल्कुल खाली होना चाहिए — कोई भी ग्रह (शुभ/अशुभ) नहीं",
            "🚫 12वें में शनि, 10वें में मंगल, 3रे में शुक्र, लग्न में चंद्रमा + क्रूर ग्रह — वर्जित",
            "🚫 लग्नेश और सौम्य ग्रह 8वें में — अशुभ",
        ],
        "cancellations": [
            "✅ गुरु गोचर 1/4/5/9/10 में हो — सभी मुहूर्त दोष नष्ट",
            "✅ गोचर सूर्य 11वें में + चंद्रमा वर्गोत्तम लग्न में — नवमांश दोष रद्द",
            "✅ बुध लग्न से 4/5/9/10 में — खराब दोष भी शुभ होते हैं",
            "✅ 1/4/5/9/10 में गुरु = सब दोष नष्ट (सर्वश्रेष्ठ रक्षक)",
        ],
        "guru_bal_stri": [
            "स्त्री की राशि से गुरु 2/9/11/7 में = शुभ",
            "गुरु 4/8/12 में = विवाह में बाधा, पूजा से शुभ हो सकता है",
            "गुरु 1/6/8/3 में = दान से शुभ",
        ],
        "note": "📌 ये नियम विवाह के मुहूर्त की kundli के लिए हैं। जन्म कुंडली से अलग विश्लेषण करें।",
    }


# ═══════════════════════════════════════════════════════════════
# 22. CHANDRA BAL FOR MATCHMAKING
# ═══════════════════════════════════════════════════════════════

def compute_chandra_bal_vivah(pl, bav, birth_tithi=15):
    """
    Chandra ki avastha check — matchmaking ke liye critical.
    Jo software ignore karta hai usse handle karo.
    """
    mo_r = _r(pl, "Mo")
    mo_h = _h(pl, "Mo")
    mo_bav = _bav(bav, "Mo", mo_r)
    is_retro = False  # Moon never retrograde
    mo_neech = mo_r == 7  # Vrishchik
    mo_uchha = mo_r == 1  # Vrishabh

    warnings = []
    strengths = []

    # Paksha bal
    if birth_tithi <= 5:
        warnings.append("⚠️ बाल चंद्रमा (अमावस्या के पास, 1-5 तिथि) — बहुत कमजोर, BAV 7-8 भी हों तो शुभ फल नहीं")
    elif birth_tithi >= 25:
        warnings.append("⚠️ वृद्ध चंद्रमा (25-30 तिथि) — बल कम, फलादेश में कमी")
    elif birth_tithi >= 12 and birth_tithi <= 18:
        strengths.append("✅ पूर्ण/बलवान चंद्रमा (12-18 तिथि) — BAV फल दोगुना प्रभावशाली")

    # Neech/uchha
    if mo_neech:
        warnings.append(f"⚠️ चंद्रमा नीच (वृश्चिक) — मन अशांत, माता को कष्ट, BAV {mo_bav} देखें")
    if mo_uchha:
        strengths.append(f"✅ चंद्रमा उच्च (वृषभ) — मन शांत, सुख, BAV {mo_bav}")

    # Combust (approximate: Mo near Su)
    if _h(pl,"Su") == mo_h and mo_r == _r(pl,"Su"):
        warnings.append("⚠️ चंद्रमा अस्त (सूर्य के पास) — शक्तिहीन, विवाह फल में कमी")

    # BAV strength
    if mo_bav <= 2:
        warnings.append(f"⚠️ चंद्र BAV {mo_bav} — अत्यंत कमजोर, गुण मिलान पर्याप्त नहीं")
    elif mo_bav >= 6:
        strengths.append(f"✅ चंद्र BAV {mo_bav} — बलवान, भावनात्मक स्थिरता")

    # Guru raksha
    if _aspect(pl,"Ju",mo_h):
        strengths.append("✅ गुरु की चंद्र पर दृष्टि — कमजोर चंद्र का अशुभ फल कम")

    matchmaking_note = (
        "⚠️ सॉफ्टवेयर की सबसे बड़ी गलती: गुण मिलान करते समय चंद्रमा की अवस्था (बाल/वृद्ध/अस्त/नीच) "
        "को नजरअंदाज करना — यही आगे चलकर वैवाहिक कष्ट का कारण बनता है।"
    )

    return {
        "computed":          True,
        "warnings":          warnings,
        "strengths":         strengths,
        "moon_bav":          mo_bav,
        "moon_rashi":        RASHI_HI[mo_r],
        "matchmaking_note":  matchmaking_note,
    }


# ═══════════════════════════════════════════════════════════════
# 23. RAHU SAMASAPTAKA + 28th NAVAMSHA
# ═══════════════════════════════════════════════════════════════

def compute_rahu_samasaptaka(pl, lg):
    """
    Rahu ka samasaptaka (7th from each other) = vivah mein badi samasya.
    28th navamsha = lank lagana tay.
    D1 se hi calculate karo.
    """
    ra_h = _h(pl, "Ra")
    ra_r = _r(pl, "Ra")

    sutras = []

    # Rahu in 7th directly
    if ra_h == 7:
        sutras.append("⚠️ राहु 7वें भाव में — साथी धोखेबाज, रहस्यमय, या विदेशी हो सकता है")

    # Rahu opposite lagna (1-7 axis) = samasaptaka with lagna
    if ra_h == 1:
        sutras.append("⚠️ राहु लग्न में — जीवनसाथी से छिपाना, सम-सप्तक दोष")

    # 28th navamsha check (D1 degree based)
    # 28th navamsha = full degree position 27.5°-30° in any sign
    la_deg = pl.get("La", {}).get("degree", 0) if "La" in pl else 0
    for code in ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"]:
        deg = float(pl.get(code,{}).get("degree",0))  # within sign 0-30
        # 28th navamsha = 27.5° to 30°
        if 27.5 <= deg <= 30:
            sutras.append(f"⚠️ {PLANET_HI.get(code,code)} 28वें नवमांश में ({deg:.1f}°) — 'लंका' वाला नवमांश, विवाह में भारी संघर्ष")

    # Rahu-Ketu axis on 2-8 or 5-11 = relationship challenges
    if ra_h in (2,8):
        sutras.append(f"⚠️ राहु {ra_h}वें भाव में — परिवार/पार्टनर में रहस्य, छिपाव")
    if ra_h in (5,11):
        sutras.append(f"राहु {ra_h}वें भाव में — प्रेम संबंधों में राहु का रंग")

    # Dwisswabhav lagna + multiple marriages warning
    if lg in (2, 5, 8, 11):  # Mithun=2, Kanya=5, Dhanu=8, Meen=11 (0-based)
        sutras.append(f"📜 द्विस्वभाव लग्न ({RASHI_HI[lg]}) + दोनों kundli mein Rahu alignment — लग्न partner के साथ match कराएं")

    return {"computed": True, "sutras": sutras,
            "note": "📌 जब जोड़ी के दोनों की kundli mein Rahu aapas mein samasaptaka (1-7) hon — vivah ke baad asal rang dikhta hai।"}


# ═══════════════════════════════════════════════════════════════
# 24. ATTRACTION RULE (One's Mars = Other's Venus rashi)
# ═══════════════════════════════════════════════════════════════

def compute_attraction_rule(pl, lg):
    """
    Ultimate attraction rule from documents.
    Also: 11th shubh = rescue from false cases.
    Also: Vivah kaal double transit detail.
    """
    ma_r = _r(pl, "Ma")
    ve_r = _r(pl, "Ve")
    ve_h = _h(pl, "Ve")
    h11s_planets = [p for p in SHUBH if _h(pl,p)==11]

    sutras = []

    # Attraction rule
    sutras.append(
        f"💘 आकर्षण का ब्रह्मास्त्र: यदि साथी की कुंडली में शुक्र आपके मंगल की राशि "
        f"({RASHI_HI[ma_r]}) में हो, या आपका शुक्र उनके मंगल की राशि में हो — "
        "तो यह दोनों के बीच अटूट और पागलपन की हद तक शारीरिक+मानसिक आकर्षण पैदा करता है।"
    )

    # Stri ke liye prem karak = Mangal
    sutras.append(
        "📜 स्त्री कुंडली में प्रेम का कारक मंगल है, न कि शुक्र। "
        "लड़की के 5वें भाव का मंगल से संबंध = गहरा प्रेम। "
        "विवाह का कारक गुरु, लेकिन अफेयर का कारक मंगल।"
    )

    # 11th shubh = rescue from psycho/false cases
    if h11s_planets:
        sutras.append(
            f"✅ 11वें भाव में शुभ ग्रह ({', '.join(PLANET_HI.get(p,p) for p in h11s_planets)}) — "
            "झूठे आरोपों, पागल पार्टनर, या कानूनी मुसीबत से बाल-बाल बचाव। "
            "11वें में शुभ = हमेशा विजय।"
        )
    else:
        sutras.append(
            "⚠️ 11वें भाव में शुभ ग्रह नहीं — झूठे आरोप/कानूनी मामलों में "
            "अधिक सावधान रहें।"
        )

    # Double transit vivah timing
    sutras.append(
        "⏰ विवाह का डबल गोचर नियम: गुरु और शनि दोनों का एक साथ "
        "लग्न/लग्नेश/7वें भाव/सप्तमेश — इन चार में से किन्हीं दो पर प्रभाव "
        "हो तब तक विवाह नहीं होता।"
    )

    # Navamsha lagna lord dasha
    sutras.append(
        "👑 गुप्त विवाह दशा: 'नवमांश (D9) लग्न के स्वामी की दशा' में अक्सर "
        "विवाह होता है — इसे ज्योतिषी अक्सर भूल जाते हैं।"
    )

    # Shani psychology
    sutras.append(
        "🪨 शनि का मनोवैज्ञानिक सूत्र: शनि 7वें में विवाह में देरी इसलिए कराता है "
        "क्योंकि व्यक्ति के अंदर जिम्मेदारी का डर और अत्यधिक सोचने की "
        "प्रवृत्ति (Over-analysis) होती है — दुर्भाग्य नहीं, खुद की सोच।"
    )

    return {"computed": True, "sutras": sutras}


# ═══════════════════════════════════════════════════════════════
# 25. D9 BHAV HINTS (D1 se approximate — no separate tab)
# ═══════════════════════════════════════════════════════════════

def compute_d9_hints(pl, lg):
    """
    D9 ke bhav ka vivah mein arth.
    D1 se approximate hints — user ko D9 tab se verify karna chahiye.
    """
    hints = [
        {"bhav": "D9 लग्न", "arth": "विवाह में परेशानी नहीं — मजबूत D9 लग्न = विवाह बाधारहित"},
        {"bhav": "D9 2रा", "arth": "जीवनसाथी की आयु (Longevity) और पारिवारिक वाणी"},
        {"bhav": "D9 3रा", "arth": "विवाह को बचाने के लिए आप कितना प्रयास करते हैं — पाप ग्रह यहाँ = सतर्क रहते हैं"},
        {"bhav": "D9 4रा", "arth": "वैवाहिक जीवन में खुशी — D9 4था बलवान = दांपत्य आनंददायक"},
        {"bhav": "D9 5वाँ", "arth": "आपसी बौद्धिक सामंजस्य — पीड़ित = विवाह नीरस"},
        {"bhav": "D9 6ठा", "arth": "बलवान 6ठा = विवाद रहित, smooth marriage life"},
        {"bhav": "D9 7वाँ", "arth": "जीवनसाथी का चरित्र — शुभ ग्रह = गुणवान साथी"},
        {"bhav": "D9 8वाँ", "arth": "दुर्घटना, अचानक घटना और विवाहेत्तर गुप्त संबंध (Extra-marital affairs) यहाँ से देखें"},
        {"bhav": "D9 9वाँ", "arth": "धार्मिक पक्ष — पीड़ित = साथी में अविश्वास"},
        {"bhav": "D9 10वाँ", "arth": "वैवाहिक कर्तव्य निभाने की क्षमता"},
        {"bhav": "D9 11वाँ", "arth": "साथी की डिमांड्स — पाप ग्रह = अपूर्णनीय भौतिक इच्छाएं"},
        {"bhav": "D9 12वाँ", "arth": "शैय्या सुख (Physical intimacy) और कभी-कभी अलगाव"},
    ]

    # D1 se hint — specific planet check, not generic NEECH.values()
    la_d9_hint = ""
    lord7 = _lord(lg, 7)
    l7_r = _r(pl, lord7)
    l7_actual_neech = (l7_r == NEECH.get(lord7, -1))  # specific to THIS planet
    if l7_actual_neech:
        la_d9_hint = f"⚠️ D1 सप्तमेश {PLANET_HI.get(lord7,lord7)} नीच राशि में ({RASHI_HI[l7_r]}) — D9 की भी जांच करें, विवाह में कठिनाई"
    elif _retro(pl, lord7):
        la_d9_hint = f"⚠️ D1 सप्तमेश {PLANET_HI.get(lord7,lord7)} वक्री — नवमांश में स्थिति अलग होगी, D9 tab से verify करें"

    return {
        "computed":    True,
        "bhav_hints":  hints,
        "d1_hint":     la_d9_hint,
        "important":   "📌 D9 विश्लेषण के लिए कुंडली का D9 tab खोलें। ये hints केवल D1 से approximate हैं।",
    }

# ═══════════════════════════════════════════════════════════════
# 26. VIVAH SAHAM — Mathematical calculation
# लग्नेश + सप्तमेश की 'बीती हुई' राशि, अंश, कला जोड़ो
# ═══════════════════════════════════════════════════════════════

def compute_vivah_saham(planets, lg):
    """
    Vivah Saham = Lagnesh spasht + Saptamesh spasht
    Niyam: jo rashi paar kar chuka ho (beeti hui) wo lo.
    Agar Meen (index 11) mein hai to beeti = Kumbh (10).
    Jodne ke baad:
      - Kala >= 60 → 60 ghataao, 1 ansh badhao
      - Ansh >= 30 → 30 ghataao, 1 rashi badhao
      - Rashi >= 12 → 12 ghataao
    Result = beeti hui rashi → Saham uski AGLI rashi mein hai.
    """
    lord1 = _lord(lg, 1)
    lord7 = _lord(lg, 7)

    def get_deg(pl, code):
        p = pl.get(code, {})
        deg = float(p.get("degree", 0))   # 0-30 within sign
        ri  = _r(pl, code)                 # 0-based rashi index
        return ri, deg

    r1, d1 = get_deg(planets, lord1)
    r7, d7 = get_deg(planets, lord7)

    # Beeti hui rashi = current rashi index (0-based) — already past
    # Degrees split into ansh (int) and kala (minutes = fractional * 60)
    ansh1  = int(d1)
    kala1  = round((d1 - ansh1) * 60)
    ansh7  = int(d7)
    kala7  = round((d7 - ansh7) * 60)

    # Add
    total_rashi = r1 + r7
    total_ansh  = ansh1 + ansh7
    total_kala  = kala1 + kala7

    # Carry kala → ansh
    if total_kala >= 60:
        total_kala -= 60
        total_ansh += 1

    # Carry ansh → rashi
    if total_ansh >= 30:
        total_ansh -= 30
        total_rashi += 1

    # Carry rashi → wrap
    if total_rashi >= 12:
        total_rashi -= 12

    # total_rashi = beeti hui rashi → Saham is in NEXT rashi
    saham_rashi_idx = (total_rashi + 1) % 12
    saham_rashi     = RASHI_HI[saham_rashi_idx]

    sutras = [
        f"✅ विवाह सहम: {saham_rashi} राशि ({saham_rashi_idx+1} नंबर) में",
        f"📐 गणना: लग्नेश {PLANET_HI.get(lord1,lord1)} ({RASHI_HI[r1]}, {ansh1}°{kala1}') "
        f"+ सप्तमेश {PLANET_HI.get(lord7,lord7)} ({RASHI_HI[r7]}, {ansh7}°{kala7}')",
        f"⏰ विवाह कब: जब गोचर का गुरु {saham_rashi} राशि पर आए या दृष्टि डाले",
        f"⏰ या जब सप्तमेश गोचर में {saham_rashi} से गुजरे",
        "📜 सूत्र: लग्नेश + सप्तमेश की बीती हुई राशि जोड़ो → परिणाम की अगली राशि = विवाह सहम",
        "📌 महादशा/अंतर्दशा में विवाह सहम के स्वामी और सप्तमेश का संबंध बनने पर विवाह निश्चित",
    ]

    return {
        "computed":         True,
        "saham_rashi":      saham_rashi,
        "saham_rashi_idx":  saham_rashi_idx,
        "lagnesh":          PLANET_HI.get(lord1, lord1),
        "saptamesh":        PLANET_HI.get(lord7, lord7),
        "lagnesh_pos":      f"{RASHI_HI[r1]} {ansh1}°{kala1}'",
        "saptamesh_pos":    f"{RASHI_HI[r7]} {ansh7}°{kala7}'",
        "sutras":           sutras,
    }


# ═══════════════════════════════════════════════════════════════
# 27. VISH NAVAMSHA — Specific degree ranges
# सबसे गुप्त और खतरनाक दोष — डिग्री से पकड़ो
# ═══════════════════════════════════════════════════════════════

def compute_vish_navamsha(planets, lg):
    """
    Vish Navamsha degrees — if 7th lord, planet in 7th, OR karak (Ve/Ju)
    falls in these degree ranges, vivah mein bhaari samasya.

    Ranges (within sign, 0-30°):
      Mesh, Vrishabh, Kanya, Dhanu       → 0° to 3°20'   (0.0 – 3.33)
      Mithun, Simha, Tula, Kumbha        → 13°20' to 16°40' (13.33 – 16.67)
      Kark, Vrishchik, Makar, Meen       → 26°40' to 30°  (26.67 – 30.0)
    """
    GROUP_A = {0, 1, 5, 8}   # Mesh=0, Vrishabh=1, Kanya=5, Dhanu=8
    GROUP_B = {2, 4, 6, 10}  # Mithun=2, Simha=4, Tula=6, Kumbha=10
    GROUP_C = {3, 7, 9, 11}  # Kark=3, Vrishchik=7, Makar=9, Meen=11

    def is_vish(rashi_idx, degree):
        d = float(degree)
        if rashi_idx in GROUP_A and 0.0 <= d <= 3.34:
            return True
        if rashi_idx in GROUP_B and 13.33 <= d <= 16.68:
            return True
        if rashi_idx in GROUP_C and 26.67 <= d <= 30.0:
            return True
        return False

    lord7  = _lord(lg, 7)
    karak  = "Ve"   # default male; female = Ju — handled below
    pin7   = _pin(planets, 7)

    checks = []
    # Check saptamesh
    r7l = _r(planets, lord7)
    d7l = float(planets.get(lord7, {}).get("degree", 0))
    if is_vish(r7l, d7l):
        checks.append({
            "planet": PLANET_HI.get(lord7, lord7),
            "role":   "सप्तमेश",
            "rashi":  RASHI_HI[r7l],
            "degree": f"{d7l:.2f}°",
            "msg":    f"⚠️ सप्तमेश {PLANET_HI.get(lord7,lord7)} विष नवमांश में ({RASHI_HI[r7l]} {d7l:.1f}°) — विवाह में भयंकर बाधा",
        })

    # Check planets in 7th
    for p in pin7:
        rp  = _r(planets, p)
        dp  = float(planets.get(p, {}).get("degree", 0))
        if is_vish(rp, dp):
            checks.append({
                "planet": PLANET_HI.get(p, p),
                "role":   "7वें भाव में",
                "rashi":  RASHI_HI[rp],
                "degree": f"{dp:.2f}°",
                "msg":    f"⚠️ {PLANET_HI.get(p,p)} (7वें में) विष नवमांश में ({RASHI_HI[rp]} {dp:.1f}°) — दांपत्य संकट",
            })

    # Check Venus (karak)
    rv  = _r(planets, "Ve")
    dv  = float(planets.get("Ve", {}).get("degree", 0))
    if is_vish(rv, dv):
        checks.append({
            "planet": "शुक्र",
            "role":   "विवाह कारक",
            "rashi":  RASHI_HI[rv],
            "degree": f"{dv:.2f}°",
            "msg":    f"⚠️ शुक्र (विवाह कारक) विष नवमांश में ({RASHI_HI[rv]} {dv:.1f}°) — वैवाहिक सुख पर गहरा असर",
        })

    # Check Jupiter (karak for female)
    rj  = _r(planets, "Ju")
    dj  = float(planets.get("Ju", {}).get("degree", 0))
    if is_vish(rj, dj):
        checks.append({
            "planet": "गुरु",
            "role":   "स्त्री विवाह कारक",
            "rashi":  RASHI_HI[rj],
            "degree": f"{dj:.2f}°",
            "msg":    f"⚠️ गुरु विष नवमांश में ({RASHI_HI[rj]} {dj:.1f}°) — स्त्री के लिए विशेष सावधानी",
        })

    # Check Mars (Mangalik planet)
    rm  = _r(planets, "Ma")
    dm  = float(planets.get("Ma", {}).get("degree", 0))
    ma_h = _h(planets, "Ma")
    if is_vish(rm, dm) and ma_h in {1, 4, 7, 8, 12}:
        checks.append({
            "planet": "मंगल",
            "role":   "मांगलिक + विष नवमांश",
            "rashi":  RASHI_HI[rm],
            "degree": f"{dm:.2f}°",
            "msg":    f"❌ मंगल मांगलिक + विष नवमांश ({RASHI_HI[rm]} {dm:.1f}°) — यह सबसे घातक संयोग है, 100% तलाक संभव",
        })

    has_dosha = len(checks) > 0
    return {
        "computed":   True,
        "has_dosha":  has_dosha,
        "checks":     checks,
        "messages":   [c["msg"] for c in checks],
        "verdict":    "❌ विष नवमांश दोष — विवाह में गंभीर समस्या" if has_dosha else "✅ विष नवमांश दोष नहीं",
        "color":      "#FB7185" if has_dosha else "#22D3EE",
        "note":       "📜 विष नवमांश: मेष/वृष/कन्या/धनु में 0°-3°20' | मिथुन/सिंह/तुला/कुंभ में 13°20'-16°40' | कर्क/वृश्चिक/मकर/मीन में 26°40'-30°",
    }


# ═══════════════════════════════════════════════════════════════
# 28. UGRA-TEEKSHNA NAKSHATRA — 9 खतरनाक नक्षत्र
# अगर मंगल/सप्तमेश/7वें का ग्रह इनमें हो → 100% तलाक
# ═══════════════════════════════════════════════════════════════

def compute_ugra_nakshatra(planets, lg):
    """
    9 Ugra + Teekshna nakshatras — deadliest rule for divorce.
    Nakshatra index 0-26:
      Ugra: Bharani=1, Magha=9, PurvaPhalguni=10, PurvaAshadha=20, PurvaBhadrapada=25
      Teekshna/Kroor: Ardra=5, Ashlesha=8, Jyeshtha=17, Mula=18
    """
    UGRA     = {1, 9, 10, 20, 25}   # Bharani, Magha, PurvaFal, PurvaAsha, PurvaBhadra
    TEEKSHNA = {5, 8, 17, 18}       # Ardra, Ashlesha, Jyeshtha, Mula
    DANGEROUS = UGRA | TEEKSHNA

    NAK_NAMES = {
        1: "भरणी", 5: "आर्द्रा", 8: "आश्लेषा", 9: "मघा",
        10: "पूर्वाफाल्गुनी", 17: "ज्येष्ठा", 18: "मूल",
        20: "पूर्वाषाढ़ा", 25: "पूर्वाभाद्रपद",
    }

    def get_nak(pl, code):
        """Nakshatra from rashi + degree (0-26)."""
        p   = pl.get(code, {})
        ri  = _r(pl, code)          # 0-based rashi
        deg = float(p.get("degree", 0))
        total_deg = ri * 30.0 + deg  # 0–360
        nak_idx   = int(total_deg / (360/27)) % 27
        return nak_idx

    lord7  = _lord(lg, 7)
    ma_h   = _h(planets, "Ma")
    is_mg  = ma_h in {1, 4, 7, 8, 12}
    pin7   = _pin(planets, 7)

    findings = []

    # Check Mars (if Mangalik)
    ma_nak = get_nak(planets, "Ma")
    if is_mg and ma_nak in DANGEROUS:
        nak_type = "उग्र" if ma_nak in UGRA else "तीक्ष्ण"
        findings.append({
            "planet": "मंगल",
            "nakshatra": NAK_NAMES.get(ma_nak, f"नक्षत्र-{ma_nak}"),
            "type": nak_type,
            "msg": f"❌ मांगलिक मंगल {nak_type} नक्षत्र '{NAK_NAMES.get(ma_nak,'')}' में — 100% तलाक का सूत्र",
        })

    # Check Saptamesh
    l7_nak = get_nak(planets, lord7)
    if l7_nak in DANGEROUS:
        nak_type = "उग्र" if l7_nak in UGRA else "तीक्ष्ण"
        findings.append({
            "planet": f"सप्तमेश ({PLANET_HI.get(lord7,lord7)})",
            "nakshatra": NAK_NAMES.get(l7_nak, f"नक्षत्र-{l7_nak}"),
            "type": nak_type,
            "msg": f"⚠️ सप्तमेश {PLANET_HI.get(lord7,lord7)} {nak_type} नक्षत्र '{NAK_NAMES.get(l7_nak,'')}' में — विवाह में गंभीर संकट",
        })

    # Check planets in 7th house
    for p in pin7:
        p_nak = get_nak(planets, p)
        if p_nak in DANGEROUS:
            nak_type = "उग्र" if p_nak in UGRA else "तीक्ष्ण"
            findings.append({
                "planet": PLANET_HI.get(p, p),
                "nakshatra": NAK_NAMES.get(p_nak, f"नक्षत्र-{p_nak}"),
                "type": nak_type,
                "msg": f"⚠️ {PLANET_HI.get(p,p)} (7वें में) {nak_type} नक्षत्र '{NAK_NAMES.get(p_nak,'')}' में — दांपत्य विनाश",
            })

    # 2+ dangerous = 100% divorce rule
    has_severe = len(findings) >= 2
    has_any    = len(findings) >= 1

    verdict = (
        "❌❌ दो या अधिक उग्र/तीक्ष्ण नक्षत्र — 100% तलाक निश्चित (मांगलिक हो या न हो)"
        if has_severe else
        "⚠️ एक उग्र/तीक्ष्ण नक्षत्र — विवाह में गंभीर बाधा"
        if has_any else
        "✅ कोई उग्र/तीक्ष्ण नक्षत्र दोष नहीं"
    )

    sutras_ws = [
        {"sutra":"मांगलिक मंगल उग्र नक्षत्र (भरणी/मघा/पूर्वाफाल्गुनी/पूर्वाषाढ़ा/पूर्वाभाद्रपद) में = 100% तलाक",
         "applied":is_mg and ma_nak in UGRA,
         "result":f"मंगल नक्षत्र: {NAK_NAMES.get(ma_nak,str(ma_nak))} {'❌ उग्र नक्षत्र में — 100% तलाक' if (is_mg and ma_nak in UGRA) else '✅ उग्र नक्षत्र में नहीं'}"},
        {"sutra":"मांगलिक मंगल तीक्ष्ण नक्षत्र (आर्द्रा/आश्लेषा/ज्येष्ठा/मूल) में = 100% तलाक",
         "applied":is_mg and ma_nak in TEEKSHNA,
         "result":f"मंगल नक्षत्र: {NAK_NAMES.get(ma_nak,str(ma_nak))} {'❌ तीक्ष्ण नक्षत्र — 100% तलाक' if (is_mg and ma_nak in TEEKSHNA) else '✅ तीक्ष्ण नक्षत्र में नहीं'}"},
        {"sutra":"सप्तमेश उग्र/तीक्ष्ण नक्षत्र में = विवाह में गंभीर संकट",
         "applied":l7_nak in DANGEROUS,
         "result":f"सप्तमेश नक्षत्र: {NAK_NAMES.get(l7_nak,str(l7_nak))} {'⚠️ खतरनाक नक्षत्र में' if l7_nak in DANGEROUS else '✅ सुरक्षित नक्षत्र में'}"},
        {"sutra":"7वें भाव का ग्रह उग्र/तीक्ष्ण नक्षत्र में = दांपत्य विनाश",
         "applied":any(get_nak(planets,p) in DANGEROUS for p in pin7),
         "result":f"7वें के ग्रह: {', '.join(PLANET_HI.get(p,p) for p in pin7) if pin7 else 'कोई नहीं'} {'⚠️ कोई खतरनाक नक्षत्र में' if any(get_nak(planets,p) in DANGEROUS for p in pin7) else '✅ सुरक्षित'}"},
        {"sutra":"इन 3 में से कोई 2 उग्र/तीक्ष्ण में = 100% तलाक (मांगलिक हो या नहीं)",
         "applied":has_severe,
         "result":f"{'❌ 2+ ग्रह खतरनाक नक्षत्र में — तलाक निश्चित' if has_severe else '✅ 2 से कम — इतना खतरनाक नहीं'}"},
    ]
    return {
        "computed":   True,
        "findings":   findings,
        "messages":   [f["msg"] for f in findings],
        "has_severe": has_severe,
        "has_any":    has_any,
        "verdict":    verdict,
        "color":      "#FB7185" if has_severe else "#FB923C" if has_any else "#22D3EE",
        "ugra_list":  "भरणी, मघा, पूर्वाफाल्गुनी, पूर्वाषाढ़ा, पूर्वाभाद्रपद",
        "teekshna_list": "आर्द्रा, आश्लेषा, ज्येष्ठा, मूल",
        "sutras_with_status": sutras_ws,
        "note":       "📜 नियम: यदि इन 3 में से कोई भी 2 ग्रह उग्र/तीक्ष्ण नक्षत्र में हों → तलाक 100% (1) मांगलिक मंगल (2) सप्तमेश (3) 7वें में ग्रह",
    }


# ═══════════════════════════════════════════════════════════════
# 29. SASURAL KI DISHA — ससुराल की सटीक दिशा
# तीन बिंदुओं से दिशा निकालो, जो सबसे ज्यादा repeat हो वही
# ═══════════════════════════════════════════════════════════════

def compute_sasural_disha(planets, lg, gender="male"):
    """
    3 points se disha nikalo:
    1. 7th house rashi direction
    2. Planets in 7th house direction
    3. Venus (male) / Jupiter (female) se 7th rashi direction
    Jo direction sabse zyada repeat ho = sasural ki disha.

    Rashi → Direction mapping:
      1,5,9  (Mesh,Simha,Dhanu)   = Purv  (East)
      2,6,10 (Vrishabh,Kanya,Makar) = Dakshin (South)
      3,7,11 (Mithun,Tula,Kumbh)  = Paschim (West)
      4,8,12 (Kark,Vrishchik,Meen) = Uttar  (North)
    """
    DISHA_MAP = {
        0: "पूर्व ↑",   # Mesh
        1: "दक्षिण →", # Vrishabh
        2: "पश्चिम ↓", # Mithun
        3: "उत्तर ←",  # Kark
        4: "पूर्व ↑",   # Simha
        5: "दक्षिण →", # Kanya
        6: "पश्चिम ↓", # Tula
        7: "उत्तर ←",  # Vrishchik
        8: "पूर्व ↑",   # Dhanu
        9: "दक्षिण →", # Makar
        10: "पश्चिम ↓",# Kumbh
        11: "उत्तर ←", # Meen
    }

    directions = []

    # Point 1: 7th house rashi
    h7_rashi = (lg + 6) % 12
    d1 = DISHA_MAP[h7_rashi]
    directions.append(d1)

    # Point 2: Planets in 7th
    pin7 = _pin(planets, 7)
    for p in pin7:
        pr = _r(planets, p)
        directions.append(DISHA_MAP[pr])

    # Point 3: Venus (male) or Jupiter (female) se 7th
    karak = "Ju" if gender.lower() in ("female","f") else "Ve"
    karak_r = _r(planets, karak)
    karak_7th = (karak_r + 6) % 12
    d3 = DISHA_MAP[karak_7th]
    directions.append(d3)

    # Count frequency
    from collections import Counter
    freq   = Counter(directions)
    top    = freq.most_common(1)[0]
    sasural_disha = top[0]
    count  = top[1]

    details = [
        f"7वें भाव की राशि ({RASHI_HI[h7_rashi]}) → दिशा: {d1}",
    ]
    for p in pin7:
        pr = _r(planets, p)
        details.append(f"{PLANET_HI.get(p,p)} (7वें में, {RASHI_HI[pr]}) → दिशा: {DISHA_MAP[pr]}")
    details.append(f"{PLANET_HI.get(karak,karak)} से 7वां ({RASHI_HI[karak_7th]}) → दिशा: {d3}")

    return {
        "computed":      True,
        "sasural_disha": sasural_disha,
        "frequency":     count,
        "total_points":  len(directions),
        "details":       details,
        "all_directions": directions,
        "verdict":       f"🧭 ससुराल की संभावित दिशा: {sasural_disha} ({count}/{len(directions)} बिंदु)",
        "note":          "📜 नियम: 7वें भाव की राशि + 7वें के ग्रहों की राशि + कारक (शुक्र/गुरु) से 7वें की राशि — जो दिशा सबसे ज्यादा बार आए वही ससुराल की दिशा",
    }


# ═══════════════════════════════════════════════════════════════
# 30. MANGALIK + VISH YOGA (स्त्री कुंडली का घातक संयोग)
# मांगलिक + शनि-चंद्र = पति कभी केयरिंग नहीं
# ═══════════════════════════════════════════════════════════════

def compute_mangalik_vish_yoga(planets, lg, gender="male"):
    """
    Stri kundli: Mangalik + Vish Yoga (Shani+Chandra anywhere) =
    pati kabhi caring nahi, vaivahik sukh zero.
    Also: Mangalik (Ugra/Teekshna nakshatra) + non-Mangalik partner = certain divorce.
    Also: Partner dosha bhanag rules.
    """
    if gender.lower() not in ("female","f","stri"):
        return {"computed": True, "applicable": False,
                "note": "यह विश्लेषण मुख्यतः स्त्री कुंडली के लिए है"}

    ma_h  = _h(planets, "Ma")
    sa_h  = _h(planets, "Sa")
    mo_h  = _h(planets, "Mo")
    is_mg = ma_h in {1, 4, 7, 8, 12}

    findings = []

    # Vish Yoga = Shani + Chandra in same house
    vish_yoga = (sa_h == mo_h and sa_h != 0)
    if vish_yoga:
        findings.append(
            f"⚠️ विष योग (शनि+चंद्र {sa_h}वें भाव में) — पति कभी भी 'केयरिंग' नहीं होगा, वैवाहिक सुख और आनंद शून्य"
        )

    if is_mg and vish_yoga:
        findings.append(
            "❌ मांगलिक + विष योग — यह सबसे घातक संयोग है। दांपत्य जीवन में खुशी का कोई स्थान नहीं।"
        )

    # Mangalik without partner = certain issues
    if is_mg and not vish_yoga:
        findings.append(
            f"🟡 मांगलिक (मंगल {ma_h}वें भाव में) — जीवनसाथी भी मांगलिक होना चाहिए"
        )

    # Dosha bhang rules for partner
    dosha_bhang = []
    lord7 = _lord(lg, 7)
    pin7  = _pin(planets, 7)

    # Partner ke 7th mein Sun/Saturn/Rahu = Mangalik dosha cancel
    for p in ["Su", "Sa", "Ra"]:
        if _h(planets, p) == 7:
            dosha_bhang.append(
                f"✅ 7वें भाव में {PLANET_HI.get(p,p)} — साथी से मांगलिक दोष का परिहार (100% रद्द)"
            )

    # Chalit chart note
    dosha_bhang.append(
        "📜 चलित कुंडली नियम: यदि लग्न से मंगल 7वें में हो, लेकिन चलित में 6वें में खिसक जाए → दोष काफी हद तक समाप्त"
    )

    return {
        "computed":     True,
        "applicable":   True,
        "is_mangalik":  is_mg,
        "vish_yoga":    vish_yoga,
        "findings":     findings,
        "dosha_bhang":  dosha_bhang,
        "has_risk":     len(findings) >= 1,
        "verdict":      "❌ मांगलिक + विष योग — अत्यंत गंभीर" if (is_mg and vish_yoga)
                        else "⚠️ विष योग — सावधानी जरूरी" if vish_yoga
                        else "🟡 मांगलिक — साथी भी मांगलिक होना चाहिए" if is_mg
                        else "✅ मांगलिक-विष योग नहीं",
        "color":        "#FB7185" if (is_mg and vish_yoga) else "#FB923C" if vish_yoga else "#F59E0B" if is_mg else "#22D3EE",
    }


# ═══════════════════════════════════════════════════════════════
# 31. D9 SACH'CHA PREM (4th house true love check)
# D1 mein khraab + D9 4th mein kroor = talak 100%
# ═══════════════════════════════════════════════════════════════

def compute_d9_saccha_prem(planets, lg):
    """
    D9 4th house true love indicator (approximate from D1).
    We use D1 data to indicate — user must verify from actual D9.
    Logic: If multiple malefics in D1 + 4th lord is weak → no true love.
    Also checks for D9 lagna indicators.
    """
    lord4  = _lord(lg, 4)
    h4l_h  = _h(planets, lord4)
    pin4   = _pin(planets, 4)
    k4     = [p for p in pin4 if p in KROOR]
    h4_sav_approx = len([p for p in SHUBH if _h(planets,p)==4])  # rough proxy

    # D1 overall affliction
    lord7 = _lord(lg, 7)
    h7l_h = _h(planets, lord7)
    k7    = [p for p in _pin(planets,7) if p in KROOR]
    d1_bad = (h7l_h in (6,8,12)) or (len(k7) >= 2)

    findings = []

    # 4th lord in trik = emotional insecurity
    if h4l_h in (6, 8, 12):
        findings.append(
            f"⚠️ चतुर्थेश {PLANET_HI.get(lord4,lord4)} {h4l_h}वें (त्रिक) में — D9 4थे भाव में भी कठिनाई संभव, घर में सुख कम"
        )

    # Malefics in 4th
    if k4:
        findings.append(
            f"⚠️ 4वें भाव में पाप ग्रह ({', '.join(PLANET_HI.get(p,p) for p in k4)}) — "
            "D9 4था भाव भी पीड़ित हो तो जीवनसाथी का प्रेम सच्चा नहीं, केवल दिखावा/मजबूरी"
        )

    # Saturn in 1st or 4th = thorn in marriage (document sutra)
    sa_h = _h(planets, "Sa")
    if sa_h in (1, 4):
        findings.append(
            f"🪨 शनि {sa_h}वें भाव में — परिवार और दांपत्य जीवन में एक कांटा जो जीवनभर दर्द देगा (शास्त्र-सूत्र)"
        )

    # Moon in 12th = sorrow from what gives joy
    if _h(planets, "Mo") == 12:
        findings.append(
            "🌙 चंद्रमा 12वें भाव में — जिससे सबसे ज्यादा खुशी मिलती है (विवाह/साथी), वही बाद में सबसे बड़े दुख का कारण बनता है"
        )

    # D1 bad + 4th afflicted = 100% confirmed
    if d1_bad and k4:
        findings.append(
            "❌ D1 में 7वें भाव खराब + D1 4थे में पाप ग्रह → D9 भी पीड़ित होने पर दांपत्य में सच्चा प्रेम 100% अनुपस्थित"
        )

    # Protection
    pf = []
    if _aspect(planets, "Ju", 4) or _h(planets, "Ju") == 4:
        pf.append("✅ गुरु की 4वें पर दृष्टि/स्थिति — घर में सुख, D9 4था बचा रहेगा")
    if _h(planets, "Ve") == 4:
        pf.append("✅ शुक्र 4वें में — D9 4थे में भी शुभ संकेत, पारिवारिक सुख")

    return {
        "computed":  True,
        "findings":  findings,
        "protection":pf,
        "has_issue": len(findings) >= 1,
        "verdict":   "❌ D9 4था भाव पीड़ित — सच्चे प्रेम की कमी" if (d1_bad and k4)
                     else "⚠️ D9 4थे भाव की जांच करें" if findings
                     else "✅ D9 4था भाव — सच्चे प्रेम के संकेत",
        "color":     "#FB7185" if (d1_bad and k4) else "#F59E0B" if findings else "#22D3EE",
        "important": "📌 यह D1 से approximate analysis है। सटीक परिणाम के लिए D9 tab में 4थे भाव की ग्रह स्थिति देखें।",
    }


# ═══════════════════════════════════════════════════════════════
# 32. PARACETAMOL UPAY — ग्रह-वार सटीक उपाय
# बड़े पाठ = Antibiotic | खराब ग्रह का उपाय = Paracetamol
# ═══════════════════════════════════════════════════════════════

def compute_paracetamol_upay(planets, lg, gender="male"):
    """
    Identify the specific afflicting planet for 7th house/marriage
    and give targeted remedies (Paracetamol rule).
    Weight-based donation: own weight in kg, divided in 11 parts, 11 weeks.
    """
    lord7  = _lord(lg, 7)
    l7h    = _h(planets, lord7)
    l7r    = _r(planets, lord7)
    pin7   = _pin(planets, 7)
    k7     = [p for p in pin7 if p in KROOR]

    VASTU = {
        "Su": ("गुड़ (jaggery)", "रविवार सुबह", "आदित्यहृदय स्तोत्र", "नारंगी/लाल वस्त्र"),
        "Mo": ("चावल (rice)", "सोमवार सुबह", "चंद्र मंत्र 'ॐ सोम सोमाय नमः'", "सफेद वस्त्र/दूध"),
        "Ma": ("गुड़ + मसूर दाल", "मंगलवार सुबह", "हनुमान चालीसा + मंगल मंत्र", "लाल वस्त्र/मूंगा"),
        "Me": ("हरी सब्जी/मूंग", "बुधवार सुबह", "बुध मंत्र 'ॐ बुं बुधाय नमः'", "हरे वस्त्र"),
        "Ju": ("पीली दाल/हल्दी/केला", "गुरुवार सुबह", "गुरु मंत्र + विष्णुसहस्त्रनाम", "पीले वस्त्र"),
        "Ve": ("चावल + सफेद मिठाई", "शुक्रवार सुबह", "शुक्र मंत्र 'ॐ शुं शुक्राय नमः'", "सफेद/गुलाबी वस्त्र"),
        "Sa": ("काली उड़द/तेल/पेट्रोल", "शनिवार शाम", "शनि स्तोत्र + हनुमान पूजा", "काले/नीले वस्त्र"),
        "Ra": ("काली उड़द (शनि की वस्तु + संकल्प)", "शनिवार शाम", "राहु मंत्र + दुर्गा पाठ", "काले वस्त्र"),
        "Ke": ("काली उड़द (शनि की वस्तु + संकल्प)", "मंगलवार सुबह", "गणेश पूजा + केतु मंत्र", "धूसर/मिश्रित वस्त्र"),
    }

    upay_list = []

    # Main afflicting planet identification
    afflicting = []

    # 1. Neech lord7
    neech_r = NEECH.get(lord7, -1)
    if l7r == neech_r:
        afflicting.append(lord7)
        upay_list.append(f"🎯 मुख्य दोषी: सप्तमेश {PLANET_HI.get(lord7,lord7)} नीच राशि में")

    # 2. Lord7 in trik
    if l7h in (6, 8, 12):
        afflicting.append(lord7)
        upay_list.append(f"🎯 सप्तमेश {PLANET_HI.get(lord7,lord7)} {l7h}वें (त्रिक) में — यही मुख्य 'रोग' है")

    # 3. Malefics in 7th
    for p in k7:
        afflicting.append(p)
        upay_list.append(f"🎯 7वें में पाप ग्रह: {PLANET_HI.get(p,p)} — इसका उपाय 'पेरासिटामोल' है")

    # 4. Venus (karak) debilitated
    karak = "Ju" if gender.lower() in ("female","f") else "Ve"
    if _r(planets, karak) == NEECH.get(karak, -1):
        afflicting.append(karak)
        upay_list.append(f"🎯 विवाह कारक {PLANET_HI.get(karak,karak)} नीच राशि में — प्रमुख उपाय करें")

    # Build targeted remedies
    remedies = []
    seen = set()
    for p in afflicting:
        if p in seen:
            continue
        seen.add(p)
        v = VASTU.get(p, ("संबंधित वस्तु", "संबंधित वार", "ग्रह मंत्र", "संबंधित वस्त्र"))
        remedies.append({
            "planet":    PLANET_HI.get(p, p),
            "vastu":     v[0],
            "vaar":      v[1],
            "mantra":    v[2],
            "vastra":    v[3],
            "daan_rule": f"अपने वजन (किलो) के बराबर {v[0]} का दान करें — 11 भागों में बांटकर 11 सप्ताह में दान करें",
            "sankalp":   "दाहिने हाथ में जल और अक्षत (चावल) लेकर विवाह की समस्या बोलकर संकल्प लें, फिर वस्तु को 3 बार छूकर दान करें",
        })

    # General antibiotic vs paracetamol note
    upay_list.append("💊 एंटीबायोटिक (सामान्य पाठ): महामृत्युंजय, विष्णु सहस्त्रनाम — ये सहायक हैं पर मूल उपाय नहीं")
    upay_list.append("💊 पेरासिटामोल (सटीक उपाय): जो ग्रह असली दोषी है, उसी का विशेष उपाय/दान करो — यही सीधे असर करता है")

    if not afflicting:
        upay_list.append("✅ 7वें भाव में कोई प्रमुख पाप/नीच ग्रह नहीं — सामान्य गुरु पूजा पर्याप्त")

    # Mangal specific (from document)
    ma_h = _h(planets, "Ma")
    if ma_h in {1,4,7,8,12}:
        remedies.append({
            "planet":    "मंगल (मांगलिक)",
            "vastu":     "गुड़",
            "vaar":      "11 मंगलवार",
            "mantra":    "मंगल मंत्र + हनुमान चालीसा",
            "vastra":    "लाल वस्त्र",
            "daan_rule": "11 मंगलवार सुबह स्नान कर, हाथ में जल+अक्षत लेकर विवाह शांति का संकल्प लें, फिर गुड़ दान करें",
            "sankalp":   "कन्याएं 16 सोमवार का व्रत भी करें (सावन से शुरू)",
        })

    return {
        "computed":    True,
        "afflicting":  [PLANET_HI.get(p,p) for p in list(set(afflicting))],
        "upay_notes":  upay_list,
        "remedies":    remedies,
        "has_upay":    len(remedies) > 0,
        "kadwa_sach":  "⚠️ कड़वा सच: यदि 7वें भाव या सप्तमेश पर किसी भी शुभ ग्रह का प्रभाव/दृष्टि नहीं है — तो कोई भी उपाय शादी को टूटने से नहीं बचा सकता।",
    }


# ═══════════════════════════════════════════════════════════════
# 33. DANGEROUS DOSHA YOGAS (7th + 12th bhav special combos)
# ग्रहण, अंगारक, विष, श्रापित दोष
# ═══════════════════════════════════════════════════════════════

def compute_dangerous_dosha_yogas(planets, lg):
    """
    Special dangerous combinations in 7th and 12th house:
    - Grahan Dosha (Rahu/Ketu + Sun/Moon)
    - Angarak Dosha (Rahu + Mars)
    - Vish Dosha (Shani + Chandra)
    - Shrapit Dosha (Rahu + Shani)
    """
    doshas_7  = []
    doshas_12 = []

    def check_dosha(house):
        pin = _pin(planets, house)
        found = []
        # Grahan Dosha
        if ("Ra" in pin or "Ke" in pin) and "Su" in pin:
            found.append(f"☀️🐍 ग्रहण दोष (राहु/केतु + सूर्य {house}वें में) — चरित्र में दोष")
        if ("Ra" in pin or "Ke" in pin) and "Mo" in pin:
            found.append(f"🌙🐍 ग्रहण दोष (राहु/केतु + चंद्र {house}वें में) — मानसिक अशांति")
        # Angarak Dosha
        if "Ra" in pin and "Ma" in pin:
            found.append(f"🔥 अंगारक दोष (राहु + मंगल {house}वें में) — हिंसक स्वभाव, भयंकर झगड़े")
        # Vish Dosha
        if "Sa" in pin and "Mo" in pin:
            found.append(f"☠️ विष दोष (शनि + चंद्र {house}वें में) — मानसिक पीड़ा, जीवनसाथी में उदासीनता")
        # Shrapit Dosha
        if "Ra" in pin and "Sa" in pin:
            found.append(f"🔮 श्रापित दोष (राहु + शनि {house}वें में) — पूर्वजन्म का श्राप, विवाह में बाधा")
        return found

    doshas_7  = check_dosha(7)
    doshas_12 = check_dosha(12)

    results_7  = []
    results_12 = []

    for d in doshas_7:
        results_7.append(d + " — 7वें में: चरित्र में दोष, दांपत्य संघर्ष")
    for d in doshas_12:
        results_12.append(d + " — 12वें में: पति-पत्नी के बीच आत्मीयता/रोमांस खत्म, केवल समझौता")

    has_any = bool(doshas_7 or doshas_12)

    return {
        "computed":    True,
        "doshas_7th":  results_7,
        "doshas_12th": results_12,
        "has_any":     has_any,
        "verdict":     "⚠️ खतरनाक दोष योग मिले — विवाह में गंभीर संकट" if has_any else "✅ कोई खतरनाक दोष योग नहीं",
        "color":       "#FB7185" if len(doshas_7)+len(doshas_12) >= 2 else "#FB923C" if has_any else "#22D3EE",
        "note_12":     "📜 12वें भाव में ये दोष हों तो पति-पत्नी के बीच सच्ची आत्मीयता (Romance/Soul connection) नहीं रहती — शादी सिर्फ समझौते पर चलती है",
    }


# ═══════════════════════════════════════════════════════════════
# 34. SAPT-VARGA DELAY (7 D-charts में शनि की राशि frequency)
# 4-5 charts में शनि राशि = अत्यधिक विलंब
# ═══════════════════════════════════════════════════════════════

def compute_sapt_varga_delay(planets, lg, d_charts=None):
    """
    7th house cusp (saptam bhav spasht) in Shani rashis (Makar=9, Kumbha=10)
    across 7 D-charts: D1, D2, D3, D7, D9, D12, D30.
    If 4+ out of 7 fall in Makar/Kumbha → severe delay.

    d_charts: dict with keys like 'D1','D2','D3','D7','D9','D12','D30'
    Each value: 7th house rashi index (0-based).
    If d_charts not provided, uses D1 only with a note.
    """
    SHANI_RASHIS = {9, 10}  # Makar=9 (0-based), Kumbha=10
    SHANI_RASHI_NAMES = ["मकर", "कुंभ"]

    # D1 seventh house rashi
    h7_rashi_d1 = (lg + 6) % 12

    results = []
    shani_count = 0

    if d_charts:
        chart_names = ["D1", "D2", "D3", "D7", "D9", "D12", "D30"]
        for cn in chart_names:
            rashi_idx = d_charts.get(cn)
            if rashi_idx is not None:
                in_shani = rashi_idx in SHANI_RASHIS
                if in_shani:
                    shani_count += 1
                results.append({
                    "chart":  cn,
                    "rashi":  RASHI_HI[rashi_idx % 12],
                    "shani":  in_shani,
                })
        total_checked = len(results)
    else:
        # Only D1 available
        in_shani = h7_rashi_d1 in SHANI_RASHIS
        if in_shani:
            shani_count += 1
        results = [{"chart": "D1", "rashi": RASHI_HI[h7_rashi_d1], "shani": in_shani}]
        total_checked = 1

    # Verdict
    if d_charts:
        if shani_count >= 4:
            verdict = f"❌ {shani_count}/7 D-charts में 7वाँ भाव शनि राशि में — विवाह में अत्यधिक देरी निश्चित"
            color   = "#FB7185"
        elif shani_count >= 2:
            verdict = f"⚠️ {shani_count}/7 D-charts में शनि राशि — मध्यम विलंब"
            color   = "#FB923C"
        else:
            verdict = f"✅ {shani_count}/7 D-charts में शनि राशि — विलंब का यह सूत्र सक्रिय नहीं"
            color   = "#22D3EE"
    else:
        if in_shani:
            verdict = f"⚠️ D1 में 7वाँ भाव {RASHI_HI[h7_rashi_d1]} (शनि राशि) — विवाह में देरी का संकेत। अन्य D-charts भी जांचें।"
            color   = "#FB923C"
        else:
            verdict = f"✅ D1 में 7वाँ भाव {RASHI_HI[h7_rashi_d1]} — शनि राशि नहीं, इस सूत्र से देरी नहीं"
            color   = "#22D3EE"

    return {
        "computed":      True,
        "results":       results,
        "shani_count":   shani_count,
        "total_checked": total_checked,
        "verdict":       verdict,
        "color":         color,
        "note":          "📜 सप्त-वर्ग सूत्र: 7 D-charts में से 4-5 में सप्तम का मकर/कुंभ में होना = शादी में हमेशा भारी देरी। D-charts input करें सटीक परिणाम के लिए।",
    }


def compute_vivah(planets,sav,bav_charts,lagna_rashi=0,gender="male",current_dasha=None,birth_tithi=15,d_charts=None):
    try:
        return {"computed":True,"engine":"vivah_engine v2.0",
                # ── Original 25 modules ──────────────────────────
                "saptam":          compute_saptam_analysis(planets,sav,bav_charts,lagna_rashi,gender),
                "mangalik":        compute_mangalik(planets,bav_charts),
                "vilamb":          compute_vivah_vilamb(planets,sav,bav_charts,lagna_rashi),
                "prem_vivah":      compute_prem_vivah(planets,sav,lagna_rashi,gender),
                "prem_sambandh":   compute_prem_sambandh(planets,sav,lagna_rashi,gender),
                "vichchhed":       compute_vivah_vichchhed(planets,sav,bav_charts,lagna_rashi),
                "swabhaav":        compute_jeevanasathi_swabhaav(planets,lagna_rashi),
                "avivahit":        compute_avivahit_yoga(planets,sav,bav_charts,lagna_rashi),
                "vivah_kaal":      compute_vivah_kaal(planets,lagna_rashi,current_dasha),
                "daampatya_sukh":  compute_daampatya_sukh(planets,sav,bav_charts,lagna_rashi),
                "vaidhavya":       compute_vaidhavya(planets,sav,bav_charts,lagna_rashi,gender),
                "dwi_vivah":       compute_dwi_vivah(planets,sav,bav_charts,lagna_rashi,gender),
                "vyabhichar":      compute_vyabhichar_deep(planets,sav,bav_charts,lagna_rashi,current_dasha),
                "vyabhichar_basic": compute_vyabhichar(planets,sav,bav_charts,lagna_rashi),
                "vivah_bhagya":    compute_vivah_bhagya(planets,lagna_rashi),
                "daihi_aakrshan":  compute_daihi_aakrshan(planets,lagna_rashi),
                "kul_nirdharan":   compute_kul_nirdharan(planets,bav_charts,lagna_rashi),
                "combos_7th":      compute_7th_combos(planets,lagna_rashi),
                "shukra_sep":      compute_shukra_separative(planets,lagna_rashi),
                "anterjatiya":     compute_anterjatiya_deep(planets,lagna_rashi),
                "muhurta":         compute_muhurta_notes(),
                "chandra_bal":     compute_chandra_bal_vivah(planets,bav_charts,birth_tithi),
                "rahu_checks":     compute_rahu_samasaptaka(planets,lagna_rashi),
                "attraction":      compute_attraction_rule(planets,lagna_rashi),
                "d9_hints":        compute_d9_hints(planets,lagna_rashi),
                # ── New 9 modules (v2.0) ─────────────────────────
                "vivah_saham":     compute_vivah_saham(planets,lagna_rashi),
                "vish_navamsha":   compute_vish_navamsha(planets,lagna_rashi),
                "ugra_nakshatra":  compute_ugra_nakshatra(planets,lagna_rashi),
                "sasural_disha":   compute_sasural_disha(planets,lagna_rashi,gender),
                "mangalik_vish":   compute_mangalik_vish_yoga(planets,lagna_rashi,gender),
                "d9_saccha_prem":  compute_d9_saccha_prem(planets,lagna_rashi),
                "paracetamol":     compute_paracetamol_upay(planets,lagna_rashi,gender),
                "dosha_yogas":     compute_dangerous_dosha_yogas(planets,lagna_rashi),
                "sapt_varga":      compute_sapt_varga_delay(planets,lagna_rashi,d_charts),
                }
    except Exception as e:
        return {"computed":False,"error":str(e)}