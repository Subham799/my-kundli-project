import { create } from "zustand";
import { fetchKundliChart, fetchKundliChartFast, fetchKundliEngines } from "../api/kundliApi";

// ═══════════════════════════════════════════════════════════════
// computeMasterConclusion(data)
// Kisi bhi user ke API data se LIVE calculate hota hai
// ZERO hardcoding — planets, houses, sav, dasha se compute
// ═══════════════════════════════════════════════════════════════
const PLANET_HINDI = {
  Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु",
};
const RASHI_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const PLANET_ORDER = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
const LAGNA_LORD = {
  Mesha:"Ma",Vrishabha:"Ve",Mithuna:"Me",Karka:"Mo",
  Simha:"Su",Kanya:"Me",Tula:"Ve",Vrischika:"Ma",
  Dhanu:"Ju",Makara:"Sa",Kumbha:"Sa",Meena:"Ju",
};
const LAGNA_DESC = {
  "मेष":"मेष लग्न — कर्मठ, साहसी, नेतृत्वकारी। स्वतंत्र विचारक।",
  "वृषभ":"वृषभ लग्न — स्थिर, भौतिकवादी, कला-प्रेमी।",
  "मिथुन":"मिथुन लग्न — बुद्धिमान, वाचाल, बहुमुखी। व्यापार में प्रवीण।",
  "कर्क":"कर्क लग्न — भावुक, मातृ-प्रेमी, घर-परिवार केंद्रित।",
  "सिंह":"सिंह लग्न — ओजस्वी, नेतृत्वकारी, आत्मविश्वासी।",
  "कन्या":"कन्या लग्न — विश्लेषक, सेवाभावी, विवेकी।",
  "तुला":"तुला लग्न — संतुलित, सौंदर्यप्रेमी, न्यायप्रिय।",
  "वृश्चिक":"वृश्चिक लग्न — रहस्यमय, दृढ़, परिवर्तनशील।",
  "धनु":"धनु लग्न — दार्शनिक, आशावादी, धर्मपरायण।",
  "मकर":"मकर लग्न — महत्वाकांक्षी, अनुशासित, व्यावहारिक।",
  "कुंभ":"कुंभ लग्न — मानवीय, वैज्ञानिक, स्वतंत्र विचारक।",
  "मीन":"मीन लग्न — आध्यात्मिक, भावुक, कलात्मक।",
};

const ageGroupLabel = (y) =>
  y<=12?"बाल्यकाल":y<=20?"किशोरावस्था":y<=30?"युवावस्था":
  y<=40?"प्रौढ़ता प्रारंभ":y<=55?"मध्यावस्था":"परिपक्व आयु";

const riskLabelFn = (r) =>
  r>=70?"अत्यंत उच्च":r>=50?"उच्च":r>=30?"मध्यम":r>=15?"निम्न":"न्यूनतम";

// Extract dosha tags from functionalNature string (api.py sets this)
const getDosh = (fn) => {
  const p=[];
  if(/Trishadaya|trishadaya/i.test(fn)) p.push("त्रिशडाय");
  if(/Badhakesh|badhakesh/i.test(fn))   p.push("बाधकेश");
  if(/Maraka|maraka/i.test(fn))          p.push("मारक");
  if(/Malefic|malefic/i.test(fn) && !/Functional/i.test(fn)) p.push("पापी");
  return p.join(" · ") || null;
};

export function computeMasterConclusion(data) {
  if (!data) return null;

  const planets = data.planets || {};
  const houses  = data.houses  || [];
  const sav     = data.sav     || [];
  const meta    = data.meta    || {};
  const dasha   = data.dasha   || {};

  // savByHouse[0..11] = AV score of house 1..12
  // houses[i].av should already be per-house (lagna=h1)
  const savByHouse = Array(12).fill(0);
  if (houses.length) {
    houses.forEach((h) => { savByHouse[h.num-1] = h.av ?? sav[h.num-1] ?? 0; });
  } else {
    sav.forEach((v,i) => { savByHouse[i]=v; });
  }

  // planet → house number
  const planetHouse = {};
  PLANET_ORDER.forEach((pc) => { if(planets[pc]) planetHouse[pc]=planets[pc].house||0; });

  // ── Lagnesh
  const lagnaEn     = meta.lagna || "Mesha";
  const lagnaHi     = meta.lagnaSign || RASHI_HI[meta.lagnaSignIdx??0] || "मेष";
  const lagneshCode = LAGNA_LORD[lagnaEn] || "Ma";
  const lp          = planets[lagneshCode] || {};
  const lagnesh = {
    code: lagneshCode,
    hindi: PLANET_HINDI[lagneshCode],
    house: lp.house || 0,
    rashi: lp.hindi_sign || "",
    strength: lp.strength || 0,
    functionalNature: "लग्नेश (सदा शुभ — 8/12 दोष नहीं लगता)",
  };
  const lagnaMeta = {
    rashi: lagnaHi,
    desc: (LAGNA_DESC[lagnaHi]||"") + (lp.house?` लग्नेश ${PLANET_HINDI[lagneshCode]} ${lp.house}वें भाव में।`:""),
  };

  // ── Shubh / Ashubh
  const shubhPlanets=[], ashubhPlanets=[];
  PLANET_ORDER.forEach((pc) => {
    if (!planets[pc]) return;
    const fn   = planets[pc].functionalNature || "Neutral";
    const dosh = getDosh(fn);
    if (/Yogakaraka/i.test(fn)) {
      shubhPlanets.push({code:pc, hindi:PLANET_HINDI[pc], dosha:"योगकारक"});
    } else if (/Functional Benefic/i.test(fn) || fn==="Neutral") {
      shubhPlanets.push({code:pc, hindi:PLANET_HINDI[pc], dosha:dosh||"शुभ"});
    } else {
      ashubhPlanets.push({code:pc, hindi:PLANET_HINDI[pc], dosha:dosh||"अशुभ"});
    }
  });

  // ── Risk Table — riskScore DIRECTLY from API (zero override)
  const riskTable = PLANET_ORDER.map((pc) => {
    const p   = planets[pc] || {};
    const fn  = p.functionalNature || "Neutral";
    const dosh = getDosh(fn);

    // Use API riskScore if present; else estimate from functional tags
    let risk = typeof p.riskScore==="number" ? p.riskScore : 0;
    if (!p.riskScore) {
      if (/Trishadaya/i.test(fn)) risk+=25;
      if (/Badhakesh/i.test(fn))  risk+=20;
      if (/Maraka/i.test(fn))     risk+=25;
      if (/Malefic/i.test(fn) && !/Functional/i.test(fn)) risk+=20;
      if (p.dignity==="Neecha")   risk+=15;
      if (p.maleficInfluence)     risk+=15;
      if (/Yogakaraka/i.test(fn)) risk=Math.max(0,risk-20);
    }
    risk = Math.min(100,Math.max(0,Math.round(risk)));

    return {
      code:      pc,
      hindi:     PLANET_HINDI[pc],
      house:     p.house||0,
      strength:  typeof p.strength==="number"?p.strength:50,
      risk,
      riskLabel: riskLabelFn(risk),
      dosh:      dosh||"—",
    };
  });

  // ── Special Yogas from planet.keyYogas
  const specialYogas=[];
  PLANET_ORDER.forEach((pc) => {
    (planets[pc]?.keyYogas||[]).forEach((yoga) => {
      if (!specialYogas.find((y)=>y.title===yoga))
        specialYogas.push({planet:pc, title:yoga, desc:""});
    });
  });

  // ── Yogakaraka
  const ykCode = PLANET_ORDER.find((pc)=>/Yogakaraka/i.test(planets[pc]?.functionalNature||""))||null;
  const yogakaraka = ykCode ? PLANET_HINDI[ykCode] : null;

  // ── AV Bhava Grid
  const avBhavas = houses.length
    ? houses.map((h)=>({n:h.num, rashi:h.signHindi||RASHI_HI[h.num-1]||"", av:savByHouse[h.num-1]}))
    : savByHouse.map((av,i)=>({n:i+1, rashi:RASHI_HI[i], av}));
  const avTotal = savByHouse.reduce((s,v)=>s+v,0);

  // ══════════════════════════════════════════════════════════
  // आयु सूत्र: Σ(भाव 1 → ग्रह भाव) × 7 ÷ 27 = टर्निंग वर्ष
  // ══════════════════════════════════════════════════════════
  const avTurningPoints = PLANET_ORDER
    .filter((pc)=>planets[pc] && planetHouse[pc]>=1)
    .map((pc) => {
      const h     = planetHouse[pc];
      const avSum = savByHouse.slice(0,h).reduce((s,v)=>s+v,0);
      const year  = Math.floor((avSum*7)%27);
      const fn    = planets[pc].functionalNature||"";
      const isKroor = /Malefic|Trishadaya|Badhakesh|Maraka/i.test(fn) || ["Sa","Ma","Ra","Ke"].includes(pc);
      // Build planetary reason for authenticity
      const dignity  = planets[pc]?.Dignity||planets[pc]?.dignity||"";
      const rashiHi  = planets[pc]?.RashiHindi||planets[pc]?.rashi||"";
      const fnLabel  = fn.includes("Yogakaraka") ? "योगकारक" : fn.includes("Benefic") ? "शुभ" : fn.includes("Malefic") ? "अशुभ" : fn.includes("Maraka") ? "मारक" : "";
      const dignityHi = /उच्च/.test(dignity) ? "उच्च राशि" : /नीच/.test(dignity) ? "नीच राशि" : /स्वराशि/.test(dignity) ? "स्वराशि" : "";
      const planetaryReason = [
        rashiHi   ? `${PLANET_HINDI[pc]} ${rashiHi} में` : `${PLANET_HINDI[pc]} ${h}वें भाव में`,
        dignityHi ? `(${dignityHi})` : "",
        fnLabel   ? `${fnLabel} ग्रह होने से` : "",
        isKroor   ? `इस आयु में ${PLANET_HINDI[pc]} का प्रत्यंतर सक्रिय — संभावित कष्ट/परिवर्तन`
                  : `इस आयु में ${PLANET_HINDI[pc]} दशा/गोचर शुभ — उन्नति के योग`,
      ].filter(Boolean).join(" ");
      return {
        code:     pc,
        hindi:    PLANET_HINDI[pc],
        house:    h,
        avSum,
        year,
        ageGroup: ageGroupLabel(year),
        nature:   isKroor ? "bad" : "good",
        planetaryReason,
        formula:  `Σ(1→${h})=${avSum} | ${avSum}×7=${avSum*7} | ${avSum*7}%27 = ${year}वर्ष`,
      };
    })
    .sort((a,b)=>a.year-b.year);

  // ── Aspect Dominance
  const drishti = data.drishti||{};
  const guruDrishti=[], ghatak=[];
  Object.entries(drishti).forEach(([pc,targets]) => {
    const fn=planets[pc]?.functionalNature||"";
    targets.forEach((tgt) => {
      if (pc==="Ju") guruDrishti.push(`${PLANET_HINDI[pc]} (${planetHouse[pc]||"?"}वें भाव से) → भाव ${tgt}`);
      if (["Sa","Ma","Ra"].includes(pc) && /Malefic/i.test(fn))
        ghatak.push(`${PLANET_HINDI[pc]} → भाव ${tgt} — घातक दृष्टि`);
    });
  });

  // ── Overall Score
  const highRisk  = riskTable.filter((r)=>r.risk>=50).length;
  const yogaCount = shubhPlanets.filter((p)=>p.dosha==="योगकारक").length;
  const weakCount = riskTable.filter((r)=>r.strength<40).length;
  const overallScore = Math.min(100,Math.max(0,75-highRisk*8+yogaCount*10-weakCount*5));

  // ── Auto summary
  const highRiskNames = riskTable.filter((r)=>r.risk>=50).map((r)=>r.hindi).join(", ");
  const yogaNames     = shubhPlanets.filter((p)=>p.dosha==="योगकारक").map((p)=>p.hindi).join(", ");
  const activeDasha   = (dasha.sequence||[]).find((d)=>d.active);
  const summary = [
    `${lagnaHi} लग्न कुंडली।`,
    yogaNames     ? `योगकारक: ${yogaNames}।` : "",
    highRiskNames ? `उच्च जोखिम: ${highRiskNames}।` : "",
    activeDasha   ? `${activeDasha.lord||PLANET_HINDI[activeDasha.code]} महादशा ${activeDasha.start}–${activeDasha.end} चल रही है।` : "",
  ].filter(Boolean).join(" ");

  // ── Best period / Caution
  const dashaSeq  = dasha.sequence||[];
  const futureSafe = dashaSeq.find((d)=>!d.active&&(/Yogakaraka|Benefic/i.test(planets[d.code]?.functionalNature||"")));
  const futureRisk = dashaSeq.find((d)=>!d.active&&(/Malefic|Maraka/i.test(planets[d.code]?.functionalNature||"")));
  const bestPeriod = futureSafe
    ? `${futureSafe.lord||PLANET_HINDI[futureSafe.code]} महादशा (${futureSafe.start}–${futureSafe.end})`
    : activeDasha ? `${activeDasha.lord||PLANET_HINDI[activeDasha.code]} महादशा` : "—";
  const caution = futureRisk
    ? `${futureRisk.lord||PLANET_HINDI[futureRisk.code]} महादशा (${futureRisk.start}–${futureRisk.end}) — ${getDosh(planets[futureRisk.code]?.functionalNature||"")||"सावधानी"}`
    : "कोई विशेष सावधानी नहीं";

  // ── Dasha list
  const dashaList = dashaSeq.map((d) => {
    const fn=planets[d.code]?.functionalNature||"";
    const parts=[];
    if(/Yogakaraka/i.test(fn))      parts.push("योगकारक");
    else if(/Functional Benefic/i.test(fn)) parts.push("शुभ");
    else if(/Malefic/i.test(fn))    parts.push("अशुभ");
    if(/Trishadaya/i.test(fn))      parts.push("त्रिशडाय");
    if(/Badhakesh/i.test(fn))       parts.push("बाधकेश");
    if(/Maraka/i.test(fn))          parts.push("मारक");
    return {
      code: d.code,
      hindi: d.lord||PLANET_HINDI[d.code]||d.code,
      start: d.start, end: d.end,
      active: !!d.active,
      functionalNature: parts.length?parts.join(" · "):"सामान्य",
    };
  });

  return {
    overallScore, summary, bestPeriod, caution,
    lagnesh, lagnaMeta,
    shubhPlanets, ashubhPlanets,
    riskTable,
    aspectDominance:{guruDrishti,ghatak},
    specialYogas, yogakaraka,
    avTurningPoints, avBhavas, avTotal,
    dasha: dashaList,
    // 🌟 मास्टर इंजन का एडवांस डेटा यहाँ शामिल करें
    advanced_astrology: data.enginesData?.advanced_astrology || {}
  };
}

// ═══════════════════════════════════════════════════════════════
// DEMO DATA — sirf raw data, koi masterConclusion nahi
// ═══════════════════════════════════════════════════════════════
const DEMO_HOUSES_RAW = Array.from({length:12},(_,i)=>({
  num:i+1,
  sign:["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"][i],
  signHindi:RASHI_HI[i],
  planets:[["Ju","Sa","La"],[],[],[],[],[],[],[],[],[],[],[]][i],
  category:["केंद्र+त्रिकोण","धन","उपचय","केंद्र","त्रिकोण","त्रिक","केंद्र+मारक","त्रिक","त्रिकोण","केंद्र","त्रिशडाय","त्रिक"][i],
  av:[35,24,28,31,24,27,18,30,32,29,32,25][i],
}));
// Patch houses with actual planet positions
const DEMO_PLANET_HOUSE_MAP = {Su:3,Mo:11,Ma:7,Me:4,Ju:1,Ve:5,Sa:1,Ra:4,Ke:10};
const DEMO_HOUSES = DEMO_HOUSES_RAW.map((h)=>{
  const pts = Object.entries(DEMO_PLANET_HOUSE_MAP)
    .filter(([,hnum])=>hnum===h.num).map(([pc])=>pc);
  if (h.num===1 && !pts.includes("La")) pts.unshift("La");
  return {...h, planets:pts};
});

export const DEMO_DATA = {
  meta: {
    name:"Demo (sh)", dob:"04 July 1999", time:"01:00 AM", city:"Kapkote",
    lagna:"Mesha", lagnaSign:"मेष", lagnaSignIdx:0, chartType:"D1",
    lagnaFullDegree: 9.60, lagnaRashiDegree: 9.60,
    lagnaNakshatra: "अश्विनी", lagnaNakshatraPada: 3,
    sunrise: "05:42",   // Kapkote, 04 July 1999 — Swiss Ephemeris approx
  },
  planets: {
    Su:{hindi:"सूर्य",sign:"Mithuna",   hindi_sign:"मिथुन",  degree:"17.58°",fullDegree:77.58, nakshatraPada:4, house:3, dignity:"Sama",   dignityHindi:"सम",    nakshatra:"आर्द्रा",      riskScore:12,strength:60, functionalNature:"Functional Benefic",             maleficInfluence:false,aspects:[9],       keyYogas:[]},
    Mo:{hindi:"चंद्र",sign:"Kumbha",    hindi_sign:"कुंभ",   degree:"14.18°",fullDegree:314.18,nakshatraPada:3, house:11,dignity:"Sama",   dignityHindi:"सम",    nakshatra:"शतभिषा",       riskScore:8, strength:55, functionalNature:"Neutral",                        maleficInfluence:false,aspects:[5],       keyYogas:[]},
    Ma:{hindi:"मंगल",sign:"Tula",       hindi_sign:"तुला",   degree:"5.71°", fullDegree:185.71,nakshatraPada:4, house:7, dignity:"Sama",   dignityHindi:"सम",    nakshatra:"चित्रा",        riskScore:10,strength:85, functionalNature:"Yogakaraka",                     maleficInfluence:false,aspects:[1,10,2], keyYogas:["नीचभंग राजयोग (लग्नेश)"]},
    Me:{hindi:"बुध", sign:"Karka",      hindi_sign:"कर्क",   degree:"12.46°",fullDegree:102.46,nakshatraPada:3, house:4, dignity:"Shatru", dignityHindi:"शत्रु", nakshatra:"पुष्य",         riskScore:60,strength:20, functionalNature:"Malefic Trishadaya Maraka",       maleficInfluence:true, aspects:[10],      keyYogas:[]},
    Ju:{hindi:"गुरु",sign:"Mesha",      hindi_sign:"मेष",    degree:"6.98°", fullDegree:6.98,  nakshatraPada:3, house:1, dignity:"Mitra",  dignityHindi:"मित्र",  nakshatra:"अश्विनी",      riskScore:10,strength:102,functionalNature:"Functional Benefic",             maleficInfluence:false,aspects:[5,7,9],  keyYogas:["नीचभंग राजयोग (शनि युति)"]},
    Ve:{hindi:"शुक्र",sign:"Simha",     hindi_sign:"सिंह",   degree:"0.60°", fullDegree:120.60,nakshatraPada:1, house:5, dignity:"Shatru", dignityHindi:"शत्रु", nakshatra:"मघा",            riskScore:45,strength:50, functionalNature:"Malefic Maraka",                 maleficInfluence:false,aspects:[11],      keyYogas:["प्रवेश-द्वार योग (0–3°)"]},
    Sa:{hindi:"शनि", sign:"Mesha",      hindi_sign:"मेष",    degree:"20.63°",fullDegree:20.63, nakshatraPada:3, house:1, dignity:"Neecha", dignityHindi:"नीच",   nakshatra:"भरणी",           riskScore:40,strength:52, functionalNature:"Malefic Trishadaya Badhakesh",   maleficInfluence:false,aspects:[3,7,10], keyYogas:["नीचभंग राजयोग (गुरु युति)"]},
    Ra:{hindi:"राहु",sign:"Karka",      hindi_sign:"कर्क",   degree:"20.82°",fullDegree:110.82,nakshatraPada:2, house:4, dignity:"Shatru", dignityHindi:"शत्रु", nakshatra:"आश्लेषा",       riskScore:90,strength:60, functionalNature:"Malefic",                        maleficInfluence:true, aspects:[8,10,12],keyYogas:["दोगुना संगति दोष (राहु+बुध)"]},
    Ke:{hindi:"केतु",sign:"Makara",     hindi_sign:"मकर",    degree:"20.82°",fullDegree:290.82,nakshatraPada:4, house:10,dignity:"Sama",   dignityHindi:"सम",    nakshatra:"श्रवण",          riskScore:5, strength:60, functionalNature:"Neutral",                        maleficInfluence:false,aspects:[4,6,2],  keyYogas:[]},
  },
  houses: DEMO_HOUSES,
  sav: [35,24,28,31,24,27,18,30,32,29,32,25],
  dasha: {
    current:{mahadasha:"शनि",antardasha:"बुध",pratyantara:"गुरु",endDate:"2028",progressPercent:62},
    sequence:[
      {lord:"राहु", code:"Ra",start:"1999",end:"2007",years:18,active:false,pct:0},
      {lord:"गुरु", code:"Ju",start:"2007",end:"2023",years:16,active:false,pct:0},
      {lord:"शनि", code:"Sa",start:"2023",end:"2042",years:19,active:true, pct:30},
      {lord:"बुध", code:"Me",start:"2042",end:"2059",years:17,active:false,pct:0},
      {lord:"केतु",code:"Ke",start:"2059",end:"2066",years:7, active:false,pct:0},
      {lord:"शुक्र",code:"Ve",start:"2066",end:"2086",years:20,active:false,pct:0},
      {lord:"सूर्य",code:"Su",start:"2086",end:"2092",years:6, active:false,pct:0},
      {lord:"चंद्र",code:"Mo",start:"2092",end:"2102",years:10,active:false,pct:0},
      {lord:"मंगल",code:"Ma",start:"2102",end:"2109",years:7, active:false,pct:0},
    ],
  },
  drishti:{Su:[9],Mo:[5],Ma:[1,10,2],Me:[10],Ju:[5,7,9],Ve:[11],Sa:[3,7,10],Ra:[8,10,12],Ke:[4,6,2]},
  // Bhav Drishti — kaun se bhav par kaun ki drishti (document se)
  bhavDrishti: {
    1:  [{planet:"Ma",aspectType:"7वीं",nature:"पाप"}],
    2:  [{planet:"Ma",aspectType:"8वीं",nature:"पाप"},{planet:"Ke",aspectType:"5वीं",nature:"पाप"}],
    3:  [{planet:"Sa",aspectType:"3वीं",nature:"पाप"}],
    4:  [{planet:"Ke",aspectType:"7वीं",nature:"पाप"}],
    5:  [{planet:"Mo",aspectType:"7वीं",nature:"शुभ"},{planet:"Ju",aspectType:"5वीं",nature:"अमृत"}],
    6:  [{planet:"Ke",aspectType:"9वीं",nature:"पाप"}],
    7:  [{planet:"Ju",aspectType:"7वीं",nature:"अमृत"},{planet:"Sa",aspectType:"7वीं",nature:"पाप"}],
    8:  [{planet:"Ra",aspectType:"5वीं",nature:"पाप"}],
    9:  [{planet:"Su",aspectType:"7वीं",nature:"पाप"},{planet:"Ju",aspectType:"9वीं",nature:"अमृत"}],
    10: [{planet:"Ma",aspectType:"4वीं",nature:"पाप"},{planet:"Me",aspectType:"7वीं",nature:"शुभ"},{planet:"Sa",aspectType:"10वीं",nature:"पाप"},{planet:"Ra",aspectType:"7वीं",nature:"पाप"}],
    11: [{planet:"Ve",aspectType:"7वीं",nature:"शुभ"}],
    12: [{planet:"Ra",aspectType:"9वीं",nature:"पाप"}],
  },
};

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════
const useKundliStore = create((set,get) => ({
  formData:{name:"",dob:"",time:"",city:"",chartType:"D1",lat:null,lon:null},
  chartData:null, loading:false, error:null,
  enginesLoading:false,   // ← phase 2 loading indicator
  selectedPlanet:null, drawerOpen:false,
  activeTab:"planets", sidebarCollapsed:false, hoveredHouse:null,
  dashaYearType:360.0,   // 🌟 360 (सावन) या 365.2425 (सौर)

  setForm:(key,value)=>set((s)=>({formData:{...s.formData,[key]:value}})),
  resetForm:()=>set({formData:{name:"",dob:"",time:"",city:"",chartType:"D1",lat:null,lon:null}}),

 fetchChart: async (yearTypeOverride) => {
    const { formData, dashaYearType } = get();
    if (!formData.name || !formData.dob || !formData.time || !formData.city) {
      set({ error: "Please fill all required fields." });
      return;
    }
    const dyt = yearTypeOverride ?? dashaYearType;
    set({ loading: true, error: null, enginesLoading: false, dashaYearType: dyt });
    
    const payload = { ...formData, age: formData.age || 0, dasha_year_type: dyt };
    
    try {
      // ── Phase 1: Fast chart ──────
      const data = await fetchKundliChartFast(payload);
      if (!data.masterConclusion?.riskTable) {
        data.masterConclusion = computeMasterConclusion(data);
      }
      set({ chartData: data, loading: false, sidebarCollapsed: true, activeTab: "planets", enginesLoading: true });

      // ── Phase 2: Heavy engines ────
      try {
        const engResult = await fetchKundliEngines(payload);
        set((s) => {
          const newChartData = s.chartData ? { 
            ...s.chartData, 
            enginesData: engResult.enginesData || null, 
            _enginesReady: !!engResult.enginesData 
          } : s.chartData;
          
          if (newChartData) {
            newChartData.masterConclusion = computeMasterConclusion(newChartData);
          }
          return { chartData: newChartData, enginesLoading: false };
        });
      } catch (err) {
        console.error("Engines failed:", err);
        set({ enginesLoading: false });
      }
    } catch (err) {
      set({ error: err.message || "Failed to fetch chart.", loading: false, enginesLoading: false });
    }
  },

  // 🌟 दशा वर्ष प्रणाली टॉगल — 360 दिन (सावन) ↔ 365.2425 दिन (सौर)
  // Naya year type set karke chart ko usi dasha_year_type ke saath dobara fetch karta hai
  setDashaYearType: (newYearType) => {
    set({dashaYearType:newYearType});
    get().fetchChart(newYearType);
  },

  // loadDemo — masterConclusion computed LIVE from DEMO_DATA
  loadDemo: () => {
    const data = {
      ...DEMO_DATA,
      masterConclusion: computeMasterConclusion(DEMO_DATA),
      // Demo enginesData — placeholder so tabs show graceful "unavailable" state
      enginesData: {
        yogas: {
          summary: { total_yogas:4, auspicious_yogas:3, inauspicious_yogas:1 },
          raja_yogas: [
            { name:"केंद्राधिपति-त्रिकोणाधिपति राज योग", name_en:"Kendra-Trikona Raja Yoga",
              effect:"शक्ति, प्रतिष्ठा, सफलता", strength:"उच्च", planets:["Mars","Jupiter"],
              description:"मंगल लग्नेश (1,8) और गुरु त्रिकोण (9) के स्वामी युति में — मेष लग्न के लिए उत्तम योग" }
          ],
          dhana_yogas: [
            { name:"गुरु-मंगल धन योग", name_en:"Jupiter-Mars Dhana Yoga",
              effect:"धन, समृद्धि", strength:"मध्यम", planets:["Jupiter","Mars"],
              description:"गुरु और मंगल की युति धन भावों पर प्रभाव डालती है" }
          ],
          pancha_mahapurusha_yogas: [],
          chandra_yogas: [
            { name:"सुनफा योग", name_en:"Sunafa Yoga",
              effect:"बुद्धि, यश", strength:"निम्न", planets:["Venus"],
              description:"चंद्रमा से द्वितीय भाव में शुक्र" }
          ],
          neecha_bhanga_raja_yoga: [],
          viparita_raja_yogas: [],
          arishta_yogas: [
            { name:"राहु-बुध युति दोष", name_en:"Rahu-Mercury Conjunction",
              effect:"भ्रम, वाणी दोष", strength:"उच्च", planets:["Rahu","Mercury"],
              description:"4थे भाव में राहु+बुध — मानसिक अशांति, मातृ सुख में बाधा" }
          ],
          special_yogas: [],
        },
        planetary_sutras: {
          disease_analysis: {
            overall_health_status: "मध्यम",
            disease_indicators: [
              { planet:"Mercury", planet_hindi:"बुध", house:4, severity:"मध्यम",
                possible_diseases:"पेट, पाचन, त्वचा रोग",
                body_parts:["पेट","आंत","त्वचा"], remedies:["बुध मंत्र जाप","हरी सब्जियां"] },
              { planet:"Rahu", planet_hindi:"राहु", house:4, severity:"उच्च",
                possible_diseases:"मानसिक अशांति, एलर्जी",
                body_parts:["मस्तिष्क","नसें"], remedies:["राहु शांति पूजा"] },
            ]
          },
          benefits_losses: {
            planet_effects: {
              Sun:     { net_score:+8,  description:"पिता से लाभ, सरकारी कार्य में सफलता" },
              Moon:    { net_score:+5,  description:"माता सुख, मानसिक शांति" },
              Mars:    { net_score:+15, description:"योगकारक — शक्ति, साहस, सफलता" },
              Mercury: { net_score:-12, description:"बुध शत्रु राशि — वाणी दोष, व्यापार हानि" },
              Jupiter: { net_score:+18, description:"गुरु मूलत्रिकोण — ज्ञान, धन, आशीर्वाद" },
              Venus:   { net_score:-5,  description:"मारक शक्ति — विवाह में बाधा संभव" },
              Saturn:  { net_score:-8,  description:"शनि नीच — कार्य में विलम्ब" },
              Rahu:    { net_score:-18, description:"केंद्र में राहु — भ्रम, मातृ कष्ट" },
              Ketu:    { net_score:+3,  description:"10वें भाव में केतु — आध्यात्मिक उन्नति" },
            }
          },
          marak_analysis: {
            marak_planets: [
              { planet:"Venus", planet_hindi:"शुक्र", description:"2+7 स्वामी — मारक शक्ति", severity:"मध्यम" },
            ]
          },
          suffering_analysis: {
            suffering_indicators: [
              { title:"मातृ पक्ष कष्ट", description:"राहु+बुध चतुर्थ भाव — माता को स्वास्थ्य कष्ट संभव", severity:"मध्यम" }
            ]
          },
          relatives_analysis: {
            relative_effects: [
              { title:"माता", description:"चंद्र 11वें — माता जीवित व सुखी, कुंभ राशि", severity:"अच्छा" },
              { title:"पिता", description:"सूर्य 3रे भाव — पिता यात्राप्रिय, मिथुन राशि", severity:"मध्यम" },
            ]
          },
          adultery_indicators: { adultery_yogas:[] },
          lustful_indicators:  { lustful_yogas:[] },
        },
        saturn_transit: null,
        punarjanma: {
          birth_realm: { realm:"मर्त्यलोक", description:"पृथ्वी (Earth)", icon:"🌍" },
          birth_quality: { quality:"मध्यम", description:"साधारण जन्म" },
          stronger_planet:"चंद्रमा", drekkana_lord:"Su"
        },
        ashtakvarga_complete: {
          success: true,
          analysis: {
            life_prosperity: {
              total_score: 186, threshold: 164, is_prosperous: true,
              prediction_hindi: "जीवन अत्यंत सुखमय और संपन्नता से भरा रहेगा",
            },
            struggle_meter: {
              has_extreme_struggle: false,
              prediction_hindi: "सामान्य जीवन संघर्ष",
            },
            spouse_dominance: {
              dominant_person: "Native (Self)",
              description_hindi: "जातक स्वयं हावी रहेगा, अपने विचार ऊपर रखेगा।",
            },
            career_type: {
              recommended_type: "Business/Self-Employment",
              description_hindi: "व्यवसाय या स्वरोजगार के लिए अच्छा",
            },
            lucky_direction: {
              ranked_directions: [
                { rank:1, direction:"East",  points:91, recommendation:"सबसे शुभ दिशा" },
                { rank:2, direction:"South", points:87, recommendation:"दूसरी शुभ दिशा" },
                { rank:3, direction:"West",  points:79, recommendation:"avoid करें" },
                { rank:4, direction:"North", points:75, recommendation:"सबसे कम शुभ" },
              ],
            },
            age_analysis: {
              sorrow_ages: [
                { planet:"Saturn", planet_hindi:"शनि",  house:1, age:56, prediction_hindi:"56 वर्ष में कष्ट" },
                { planet:"Mars",   planet_hindi:"मंगल", house:7, age:21, prediction_hindi:"21 वर्ष में संघर्ष" },
              ],
              happiness_ages: [
                { planet:"Jupiter", planet_hindi:"गुरु", house:1, age:37, prediction_hindi:"37 वर्ष में सुख, सफलता" },
              ],
              conflict_resolution: { has_conflict: false },
            },
            business_success: {
              will_become_businessman: true, level: "highest",
              prediction_hindi: "बहुत बड़ा व्यापार स्थापित करेगा, कई लोगों को रोजगार देगा",
            },
            jupiter_override: {
              dosha_cancelled: false, jupiter_strength: 29, note: "कोई दोष नहीं",
            },
            reverse_logic_houses: {
              house_6:  { house:6,  points:22, verdict:"बहुत शुभ", prediction_hindi:"निरोगी रहेगा, कर्ज नहीं, दुश्मन कम" },
              house_8:  { house:8,  points:26, verdict:"शुभ",      prediction_hindi:"दरिद्रता नहीं होगी" },
              house_12: { house:12, points:20, verdict:"बहुत शुभ", prediction_hindi:"पैसा बर्बाद नहीं होगा" },
            },
            karma_bhagya: {
              dominant: "Karma (Hard Work)",
              house_9_points: 31, house_10_points: 33,
              prediction_hindi: "बहुत ज्यादा परिश्रम करना पड़ेगा, लाभ उस अनुपात में कम",
            },
            "8th_house_destruction": [
              { strong_house:4, points:32, relation:"माता", warning_hindi:"4वां भाव मजबूत (32 अंक) — माता को कष्ट" },
            ],
          },
        },
        comprehensive_vedic: {
          health_happiness: {
            lifelong_health: { result:"गुरु लग्न में — आजीवन स्वस्थ रहने के योग, मध्य आयु में सावधानी" },
            wealth_without_health: { result:"शुक्र 5वें — धन होगा पर स्वास्थ्य पर ध्यान दें" },
          },
          lagnesh_nature: {
            comfort_vs_work: { type:"कर्मठ (7वें भाव में मंगल)" },
            workplace_betrayal: { risk:"सामान्य — विश्वासघात की थोड़ी संभावना" },
          },
          age_of_success: { success_age: 32, description: "मंगल योगकारक — 32 वर्ष से सफलता" },
          trikona_analysis: { dominant_trikona: "धर्म त्रिकोण (1-5-9)", balance_result: "अनुकूल", clash: null },
        },
        navatara: {
          navatara_chakra: {
            taras: {
              birth_nakshatra: { number:6, name_hindi:"आर्द्रा", name_english:"Ardra" },
              vipat_tara: {
                nakshatras:[8,17,26], nakshatra_names:["पुष्य","अनुराधा","उत्तराभाद्रपद"],
                ruling_planet_hindi:"शनि", effect:"विपत्ति — टालने योग्य नक्षत्र"
              },
              pratyari_tara: {
                nakshatras:[10,19,1], nakshatra_names:["मघा","मूल","अश्विनी"],
                ruling_planet_hindi:"केतु", effect:"शारीरिक कष्ट — सावधान रहें"
              },
              vadha_tara: {
                nakshatras:[12,21,3], nakshatra_names:["उत्तरा फाल्गुनी","उत्तराषाढ़ा","कृत्तिका"],
                ruling_planet_hindi:"सूर्य", effect:"कार्य का अंत — शुभ कार्य न करें"
              },
              mitra_tara: {
                nakshatras:[13,22,4], nakshatra_names:["हस्त","श्रवण","रोहिणी"],
                effect:"मित्रवत — लाभदायक"
              },
              param_mitra_tara: {
                nakshatras:[14,23,5], nakshatra_names:["चित्रा","धनिष्ठा","मृगशिरा"],
                effect:"अति शुभ — सर्वोत्तम नक्षत्र"
              },
            },
            prohibited_items: {
              prohibited_dates:[8,17,26], lucky_dates:[2,9,11,18,20,27],
              prohibited_colors:["बहुरंगी","काला","गहरा नीला","बैंगनी"],
              lucky_colors:["मोती जैसा","सफेद","लाल"],
              prohibited_days:["शनिवार","रविवार"], lucky_days:["मंगलवार","सोमवार"],
              prohibited_plants:[{plant_hindi:"पीपल"},{plant_hindi:"नीम"}],
              lucky_plants:[{plant_hindi:"आम"},{plant_hindi:"शमी"}],
            },
            gemstone_recommendations: {
              highly_beneficial: [
                { planet:"Moon",  gemstone_hindi:"मोती",  gemstone_english:"Pearl",  reason:"चंद्र मित्र तारा में — अत्यंत लाभकारी" },
                { planet:"Mars",  gemstone_hindi:"मूंगा", gemstone_english:"Coral",  reason:"मंगल योगकारक — परम मित्र" },
              ],
              avoid: [
                { planet:"Saturn", gemstone_hindi:"नीलम", gemstone_english:"Blue Sapphire", reason:"शनि विपत् तारा में — वर्जित" },
              ],
            },
          },
          arth_trikona: {
            Sun:     { house:3,  effect_hindi:"3रे भाव — पराक्रम से धन" },
            Moon:    { house:11, effect_hindi:"11वें भाव — निरंतर आय" },
            Mars:    { house:7,  effect_hindi:"7वें भाव (योगकारक) — व्यापार से अत्यंत धन" },
            Mercury: { house:4,  effect_hindi:"4थे भाव — शत्रु राशि, व्यापार में बाधा" },
            Jupiter: { house:1,  effect_hindi:"लग्न में — शिक्षा/परामर्श से आय" },
            Venus:   { house:5,  effect_hindi:"5वें — निवेश से लाभ संभव" },
            Saturn:  { house:1,  effect_hindi:"लग्न में (नीच) — मेहनत से धन, देरी" },
            Rahu:    { house:4,  effect_hindi:"4थे — अचानक संपत्ति लाभ" },
            Ketu:    { house:10, effect_hindi:"10वें — आध्यात्मिक/तकनीकी करियर" },
          },
        },
        advanced_sutras: {
          success: true,
          analysis: {
            continuous_wealth: {
              house_10_points:33, house_11_points:35, house_12_points:20,
              continuous_wealth_flow: true,
              prediction_hindi:"धन का आगमन आसानी से बना रहेगा। कम मेहनत में भी आर्थिक स्थिति ठीक।",
            },
            rajyoga_age: {
              has_rajyoga:true, lagna_points:30, activation_age:30,
              prediction_hindi:"30 वर्ष की आयु में राजयोग शुरू होगा, प्रसिद्धि मिलेगी।",
              advice:"इस उम्र के आसपास बड़े निर्णय लें",
            },
            dream_property: {
              house_4_points:32, has_benefic_influence:true, will_get_dream_property:true,
              prediction_hindi:"ड्रीम हाउस, ड्रीम लैंड और ड्रीम वाहन अवश्य प्राप्त होगा।",
              current_status:"योग पूर्ण",
            },
            income_vs_debt: {
              house_6_points:22, house_8_points:26, house_12_points:20,
              total_sum:68, threshold:76, is_favorable:true,
              prediction_hindi:"आय अधिक — व्यय कम। (कुल 68 <= 76 ✅)",
            },
            life_graph: {
              differences: {
                "1-2":{current:30},"2-3":{current:25},"3-4":{current:28},
                "4-5":{current:32},"5-6":{current:29},"6-7":{current:22},
                "7-8":{current:27},"8-9":{current:26},"9-10":{current:31},
                "10-11":{current:33},"11-12":{current:35},
              },
              overall_trend:"भाव 11 पर शिखर (35 अंक) — जीवन उर्ध्वमुखी",
            },
          },
        },
      },
    };
    set({chartData:data,loading:false,sidebarCollapsed:true,activeTab:"planets",error:null});
    set({chartData:data,loading:false,sidebarCollapsed:true,activeTab:"planets",error:null});
  },

  selectPlanet:(code)=>set((s)=>({
    selectedPlanet:s.selectedPlanet===code?null:code,
    drawerOpen:s.selectedPlanet!==code,
  })),
  closeDrawer:()=>set({drawerOpen:false,selectedPlanet:null}),
  setActiveTab:(tab)=>set({activeTab:tab,selectedPlanet:null,drawerOpen:false}),
  toggleSidebar:()=>set((s)=>({sidebarCollapsed:!s.sidebarCollapsed})),
  hoverHouse:(houseNum)=>set({hoveredHouse:houseNum}),
  resetChart:()=>set({
    chartData:null,error:null,activeTab:"planets",
    selectedPlanet:null,drawerOpen:false,sidebarCollapsed:false,hoveredHouse:null,
  }),
}));

export default useKundliStore;

// ── Architecture v2: Sutra Topics selectors ───────────────────────────────
export const useSutraTopics = () =>
  useKundliStore(s => s.chartData?.enginesData?.nadi_jyotish?.sutra_topics ?? {});

export const useSutraTopic = (key) =>
  useKundliStore(s => s.chartData?.enginesData?.nadi_jyotish?.sutra_topics?.[key] ?? null);

// ── Batch 2 selectors ─────────────────────────────────────────────────────
export const useDailyPrediction = () =>
  useKundliStore(s => s.chartData?.enginesData?.daily_prediction ?? null);

export const useAVSutras = () =>
  useKundliStore(s => s.chartData?.enginesData?.av_sutras ?? null);

export const useDashaShani = () =>
  useKundliStore(s => s.chartData?.enginesData?.dasha_shani ?? null);

export const useChandraSurya = () =>
  useKundliStore(s => s.chartData?.enginesData?.chandra_surya ?? null);

export const useAdvancedYogas = () =>
  useKundliStore(s => s.chartData?.enginesData?.advanced_yogas ?? null);