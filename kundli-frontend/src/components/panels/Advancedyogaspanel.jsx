/**
 * AdvancedYogasPanel.jsx
 * =======================
 * Batch 4 — Indu Lagna + Advanced Yogas (FINAL PANEL)
 *
 * Refactoring Applied (v1.1):
 *   [Fix ④] SutraCard{} local component REMOVED — replaced with CardBlock from shared/ui.
 *           SutraCard had: GlassCard + label + formula + desc + note + children.
 *           CardBlock has: icon + title + badge (collapsible) + children.
 *           Migration: label→badge, color→accent, desc+formula+note go inside children.
 *           2 call-sites updated: Debt Trap, (other SutraCard instances inline).
 */

import { useState } from "react";
import {
  StatusPill, EmptyState, GlassCard, ProgressBar,
  RiskRing, CollapsibleSection, StrengthBar, CardBlock
} from "../shared/ui";
import { HI, C } from "../shared/designTokens";
import useKundliStore from "../../store/useKundliStore";
const useAdvancedYogas = () =>
  useKundliStore(s => s.chartData?.enginesData?.advanced_yogas ?? null);

// ─── Helpers ─────────────────────────────────────────────
const qColor = (level) => ({
  elite: C.cyan, ultra_rich: C.cyan, crorepati: C.cyan,
  wealthy: C.green, strong: C.green, good: C.green,
  saver: C.cyan, normal: C.amber, average: C.amber,
  moderate: C.amber, struggle: C.orange, trapped: C.orange,
  overspend: C.rose, bad: C.rose, danger: C.rose,
  very_weak: C.orange, weak: C.amber,
  neech_bhang: C.cyan, uchha_bhang: C.orange,
  neech_double: C.rose, uchha_double: C.cyan,
  massive: C.cyan,
}[level] || C.amber);

const TABS = [
  { id: "classic", label: "🪔 मुख्य योग" },
  { id: "indu", label: "💰 इन्दु लग्न" },
  { id: "khar", label: "☠️ 64वाँ नवांश / खर" },
  { id: "hora", label: "☀️ D2 होरा" },
  { id: "jaimini", label: "🔱 जैमिनी + नवमांश" },
];

// [Fix ④] SutraCard{} REMOVED.
// BEFORE: <SutraCard label={x.label} color={x.color} desc={x.desc} note={x.rule} formula={...}>
// AFTER:  <CardBlock icon="⚠️" title={x.label} accent={x.color} defaultOpen={true}>
//           <div style={...}>{formula}</div>
//           <div style={...}>{x.desc}</div>
//           <div style={...}>{x.rule}</div>
//           {children}
//         </CardBlock>

function StatBox({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)",
      borderRadius: "10px", padding: "8px 14px" }}>
      <div style={{ fontWeight: 700, fontSize: "1.2rem", color: color || C.amber }}>{value}</div>
      <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>{label}</div>
    </div>
  );
}


// ════════ CLASSIC / ADDITIONAL YOGAS TAB ═══════════════════
// Basis: the user-supplied rule set in the request.  The UI reports
// rule-matches/evidence only; it does not turn them into guaranteed results.

const CLASSIC_CODES = ["Su","Mo","Ma","Me","Ju","Ve","Sa"];
const CLASSIC_NAMES = {
  Su:"सूर्य", Mo:"चंद्र", Ma:"मंगल", Me:"बुध", Ju:"गुरु", Ve:"शुक्र", Sa:"शनि",
  Ra:"राहु", Ke:"केतु"
};
const MAHA_MAP = [
  ["Ruchaka Yoga","Ma"],
  ["Bhadra Yoga","Me"],
  ["Hamsa Yoga","Ju"],
  ["Malavya Yoga","Ve"],
  ["Shasha Yoga","Sa"],
];
const DUSTHANA = new Set([6,8,12]);
const KENDRA = new Set([1,4,7,10]);
const TRIKONA = new Set([1,5,9]);
const BENEFIC_HOUSES = new Set([1,2,4,5,7,9,10,11]);

function cSign(p){ return jnPlanetSign(p,"D1"); }
function cHouseFromSign(sign,lagna){ return jnHouseFromSign(sign,lagna); }
function cHouseMap(chart){
  const lagna = jnLagnaSign(chart);
  const map = {};
  CLASSIC_CODES.concat(["Ra","Ke"]).forEach(code => {
    const sign = cSign(chart?.planets?.[code]);
    map[code] = cHouseFromSign(sign, lagna);
  });
  return map;
}
function cLordForHouse(lagna, house){
  if(lagna === null || house == null) return null;
  return JN_SIGN_LORDS[(lagna + house - 1) % 12] || null;
}
function cLordMap(lagna){
  const out={};
  for(let h=1; h<=12; h++) out[h]=cLordForHouse(lagna,h);
  return out;
}
function cDignity(code, sign){
  if(sign === null || sign === undefined) return "—";
  if(JN_EXALT[code] === sign) return "उच्च";
  if(JN_NEECHA[code] === sign) return "नीच";
  if(JN_SIGN_LORDS[sign] === code) return "स्वराशि";
  return "सामान्य";
}
function cPlanetName(code){ return CLASSIC_NAMES[code] || code; }
function cPlanetList(codes){ return codes.filter(Boolean).map(cPlanetName).join(", ") || "—"; }
function cSameHouse(a,b,houseMap){ return houseMap[a] != null && houseMap[a] === houseMap[b]; }
function cParashariAspect(fromCode, toHouse, houseMap){
  const h = houseMap[fromCode];
  if(h == null || toHouse == null) return false;
  const distance = ((toHouse - h + 12) % 12) + 1;
  if(distance === 7) return true;
  if(fromCode === "Ma" && (distance === 4 || distance === 8)) return true;
  if(fromCode === "Ju" && (distance === 5 || distance === 9)) return true;
  if(fromCode === "Sa" && (distance === 3 || distance === 10)) return true;
  return false;
}
function cRelationship(a,b,houseMap){
  if(!a || !b || a===b) return false;
  if(cSameHouse(a,b,houseMap)) return true;
  const hb = houseMap[b];
  const ha = houseMap[a];
  return cParashariAspect(a,hb,houseMap) || cParashariAspect(b,ha,houseMap);
}
function cExchange(lordA,lordB,houseMap, lordMap){
  if(!lordA || !lordB || lordA===lordB) return false;
  const hA = Object.keys(lordMap).find(h => lordMap[h]===lordA);
  const hB = Object.keys(lordMap).find(h => lordMap[h]===lordB);
  if(!hA || !hB) return false;
  const aHouse = Number(hA), bHouse = Number(hB);
  return houseMap[lordA] === bHouse && houseMap[lordB] === aHouse;
}
function cOwnerRelation(houseA,houseB,lagna,houseMap,lordMap){
  const a=lordMap[houseA], b=lordMap[houseB];
  return {
    lordA:a, lordB:b,
    relationship:cRelationship(a,b,houseMap),
    exchange:cExchange(a,b,houseMap,lordMap),
    hit: cRelationship(a,b,houseMap) || cExchange(a,b,houseMap,lordMap),
  };
}
function cPlanetsInHouse(houseMap, house, codes=CLASSIC_CODES.concat(["Ra","Ke"])){ return codes.filter(c=>houseMap[c]===house); }
function cHousesFromPlanet(code,houseMap){
  const h=houseMap[code];
  if(h==null) return [];
  return [1,4,7,10,5,9,11,6,8,12].map(n=>({house:n,active:cParashariAspect(code, n, houseMap)})).filter(x=>x.active).map(x=>x.house);
}

function YogaResult({name, present, rule, evidence, tone=C.cyan}){
  return <div style={{padding:"9px 10px",borderRadius:9,background:present?"rgba(34,197,94,.07)":"rgba(255,255,255,.025)",border:`1px solid ${present?C.green+"30":"rgba(255,255,255,.07)"}`}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
      <div style={{...HI,fontWeight:800,fontSize:".75rem",color:present?(tone||C.green):"rgba(255,255,255,.72)"}}>{name}</div>
      <span style={{...HI,fontSize:".62rem",fontWeight:800,color:present?C.green:"rgba(255,255,255,.35)"}}>{present?"✓ मौजूद":"○ नहीं मिला"}</span>
    </div>
    <div style={{...HI,fontSize:".64rem",lineHeight:1.45,color:"rgba(255,255,255,.46)",marginTop:4}}>{rule}</div>
    {evidence && <div style={{...HI,fontSize:".66rem",lineHeight:1.45,color:present?"rgba(255,255,255,.72)":"rgba(255,255,255,.4)",marginTop:5}}>{evidence}</div>}
  </div>;
}

function SectionTitle({children}){
  return <div style={{...HI,fontWeight:800,fontSize:".82rem",color:C.amber,marginBottom:8}}>{children}</div>;
}

function ClassicYogasTab(){
  const chart = useKundliStore(s => s.chartData);
  if(!chart?.planets) return <EmptyState icon="🪔" message="योग विश्लेषण के लिए D1 डेटा उपलब्ध नहीं" />;

  const planets=chart.planets||{};
  const lagna=jnLagnaSign(chart);
  const houseMap=cHouseMap(chart);
  const lordMap=cLordMap(lagna);
  const signs=Object.fromEntries(CLASSIC_CODES.concat(["Ra","Ke"]).map(code=>[code,cSign(planets[code])]));
  const names=(codes)=>cPlanetList(codes);
  const planetHouse=(code)=>houseMap[code];
  const lord=(h)=>lordMap[h];
  const relation=(a,b)=>cRelationship(a,b,houseMap);
  const exchange=(a,b)=>cExchange(a,b,houseMap,lordMap);
  const houseDesc=(h)=> h==null?"—":`${h}वाँ भाव`;

  // User-supplied chart-specific rules.
  const fifthPlanets=cPlanetsInHouse(houseMap,5);
  const budhaditya=cSameHouse("Su","Me",houseMap) && planetHouse("Su")===5;
  const technical5=fifthPlanets.includes("Ra") && fifthPlanets.includes(lord(1)) && fifthPlanets.includes(lord(9));
  const moonAlone8=planetHouse("Mo")===8 && cPlanetsInHouse(houseMap,8).filter(c=>c!=="Mo").length===0;
  const guruSupportsMoon = planetHouse("Ju")===8 || cParashariAspect("Ju",8,houseMap);
  const sunRahu5 = planetHouse("Su")===5 && planetHouse("Ra")===5;

  // Raj Yoga / Dhana Yoga.
  const rajPairs=[[1,4],[1,5],[1,9],[4,5],[4,9],[7,5],[7,9],[10,5],[10,9]];
  const rajHits=rajPairs.filter(([a,b])=>cOwnerRelation(a,b,lagna,houseMap,lordMap).hit);
  const dhanaPairs=[[1,2],[1,5],[1,9],[1,11],[2,5],[2,9],[2,11],[5,9],[5,11],[9,11]];
  const dhanaHits=dhanaPairs.filter(([a,b])=>cOwnerRelation(a,b,lagna,houseMap,lordMap).hit);
  const mahaPairs=[];
  for(let i=0;i<=11;i++) for(let j=i+1;j<=11;j++){
    const a=i+1,b=j+1;
    if(!BENEFIC_HOUSES.has(a)||!BENEFIC_HOUSES.has(b)) continue;
    if(exchange(lord(a),lord(b))) mahaPairs.push([a,b]);
  }

  // Panch Mahapurusha.
  const mahaHits=MAHA_MAP.map(([name,code])=>({name,code,present:KENDRA.has(planetHouse(code)) && [JN_SIGN_LORDS[signs[code]]===code, JN_EXALT[code]===signs[code]].some(Boolean)})).filter(x=>x.present);

  // Vipreet / Dainya / Khala exchange signals.
  const vipreetPairs=[[6,8],[6,12],[8,12]];
  const vipreetHits=vipreetPairs.filter(([a,b])=>exchange(lord(a),lord(b)));
  const dainyaHits=[];
  for(const d of [6,8,12]) for(let h=1;h<=12;h++){
    if(h===d) continue;
    if(exchange(lord(d),lord(h))) dainyaHits.push([d,h]);
  }
  const khalaHits=[];
  for(const h of [1,2,4,5,7,9,10,11]) if(exchange(lord(3),lord(h))) khalaHits.push([3,h]);

  const neecha=CLASSIC_CODES.filter(code=>JN_NEECHA[code]===signs[code]);
  const neechaSupport=neecha.filter(code=>{
    const h=planetHouse(code);
    if(h==null) return false;
    // Evidence-only basic checks: exalted sign lord/support or a kendra from Lagna.
    return KENDRA.has(h) || cParashariAspect("Ju",h,houseMap) || cSameHouse("Ju",code,houseMap);
  });

  // Chandra yogas.
  const moonHouse=planetHouse("Mo");
  const relativeHouse=(targetCode,baseCode)=>{
    const a=houseMap[baseCode], b=houseMap[targetCode];
    if(a==null||b==null) return null;
    return ((b-a+12)%12)+1;
  };
  const gaja=relativeHouse("Ju","Mo") && KENDRA.has(relativeHouse("Ju","Mo"));
  const sunaphaCodes=CLASSIC_CODES.filter(c=>c!=="Su" && relativeHouse(c,"Mo")===2);
  const anaphaCodes=CLASSIC_CODES.filter(c=>c!=="Su" && relativeHouse(c,"Mo")===12);
  const durudharaCodes=[...sunaphaCodes,...anaphaCodes];

  // Sun yogas.
  const vesiCodes=CLASSIC_CODES.filter(c=>c!=="Mo" && relativeHouse(c,"Su")===2);
  const vasiCodes=CLASSIC_CODES.filter(c=>c!=="Mo" && relativeHouse(c,"Su")===12);
  const ubhayaCodes=[...vesiCodes,...vasiCodes];

  const saraswati = ["Me","Ju","Ve"].every(c=>{
    const h=planetHouse(c); return h!=null && (KENDRA.has(h)||TRIKONA.has(h));
  });

  // Maraka candidates + strength/evidence as supplied by the user.
  const marakaLords=[lord(2),lord(7)].filter(Boolean);
  const marakaOccupants=[...new Set([...cPlanetsInHouse(houseMap,2),...cPlanetsInHouse(houseMap,7)])];
  const marakaCandidates=[...new Set([...marakaLords,...marakaOccupants])];
  const marakaRows=marakaCandidates.map(code=>({
    code,
    house:planetHouse(code),
    sign:signs[code],
    dignity:cDignity(code,signs[code]),
    inTrikona:TRIKONA.has(planetHouse(code)),
    inKendra:KENDRA.has(planetHouse(code)),
    inDusthana:DUSTHANA.has(planetHouse(code)),
    severe: cDignity(code,signs[code])==="नीच" && DUSTHANA.has(planetHouse(code)),
  }));

  return <div className="space-y-3">
    <GlassCard className="p-3">
      <SectionTitle>आपकी कुंडली में मौजूद अन्य विशिष्ट योग</SectionTitle>
      <div className="space-y-2">
        <YogaResult
          name="बुधादित्य योग (Budhaditya Yoga)"
          present={budhaditya}
          rule="नियम: 5वें भाव में सूर्य और बुध की युति।"
          evidence={budhaditya ? `सूर्य + बुध दोनों ${houseDesc(planetHouse("Su"))} में हैं; sign: ${JN_RASHI[signs.Su] || "—"}.` : `वर्तमान D1 में सूर्य ${houseDesc(planetHouse("Su"))} और बुध ${houseDesc(planetHouse("Me"))} में हैं।`}
        />
        <YogaResult
          name="तकनीकी एवं शोध योग (Technical & Innovation Yoga)"
          present={technical5}
          rule="नियम: 5वें भाव में राहु के साथ लग्नेश और भाग्येश (9th lord) की उपस्थिति।"
          evidence={`5वें भाव के ग्रह: ${names(fifthPlanets)}; लग्नेश: ${cPlanetName(lord(1))}; भाग्येश: ${cPlanetName(lord(9))}.`}
        />
        <YogaResult
          name="केमद्रुम भंग (Kemadruma Bhanga)"
          present={moonAlone8 && guruSupportsMoon}
          rule="दिया गया नियम: 8वें भाव में अकेला चंद्रमा हो, लेकिन गुरु/शुभ समर्थन से चंद्रमा को बल मिले।"
          evidence={moonAlone8 ? `चंद्रमा 8वें भाव में अकेला है; गुरु समर्थन: ${guruSupportsMoon?"हाँ":"नहीं"}.` : `चंद्रमा ${houseDesc(planetHouse("Mo"))} में है; 8वें भाव का अकेला-चंद्रमा पैटर्न नहीं मिला।`}
        />
        <YogaResult
          name="अरिष्ट / 5वें भाव का हल्का बाधक प्रभाव"
          present={sunRahu5}
          rule="दिया गया नियम: 5वें भाव में सूर्य + राहु की युति से शिक्षा/निर्णय में overthinking या distraction का संकेत।"
          evidence={sunRahu5 ? "सूर्य और राहु दोनों 5वें भाव में हैं।" : `सूर्य ${houseDesc(planetHouse("Su"))}, राहु ${houseDesc(planetHouse("Ra"))} में हैं।`}
          tone={C.orange}
        />
      </div>
    </GlassCard>

    <GlassCard className="p-3">
      <SectionTitle>शुभ योग एवं राजयोग</SectionTitle>
      <div className="space-y-2">
        <YogaResult
          name="राजयोग"
          present={rajHits.length>0}
          rule="केंद्र (1,4,7,10) और त्रिकोण (1,5,9) भावेशों के संबंध, युति/दृष्टि/राशि परिवर्तन।"
          evidence={rajHits.length ? rajHits.map(([a,b])=>`${a}वें–${b}वें भावेश`).join(", ")+" के बीच संबंध मिला।" : "दिए गए संबंध नियम के अनुसार कोई जोड़ा नहीं मिला।"}
        />
        <YogaResult
          name="धन योग (Dhana Yoga)"
          present={dhanaHits.length>0}
          rule="1,2,5,9,11 के स्वामियों के बीच संबंध; विशेष रूप से 2/11 का 5/9 से संबंध।"
          evidence={dhanaHits.length ? dhanaHits.map(([a,b])=>`${a}वें–${b}वें भावेश`).join(", ")+" का संबंध मिला।" : "दिए गए धन योग संबंध नियम के अनुसार कोई जोड़ा नहीं मिला।"}
        />
        <YogaResult
          name="महा योग (Maha Yoga)"
          present={mahaPairs.length>0}
          rule="शुभ भावों 1,2,4,5,7,9,10,11 के स्वामियों का आपसी राशि परिवर्तन।"
          evidence={mahaPairs.length ? mahaPairs.map(([a,b])=>`${a}↔${b}`).join(", ") : "कोई शुभ-भावेश exchange नहीं मिला।"}
        />
      </div>

      <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:7}}>
        <div style={{...HI,fontSize:".66rem",color:"rgba(255,255,255,.5)",padding:"7px 8px",background:"rgba(255,255,255,.025)",borderRadius:7}}>लग्नेश: <b style={{color:"rgba(255,255,255,.8)"}}>{cPlanetName(lord(1))}</b></div>
        <div style={{...HI,fontSize:".66rem",color:"rgba(255,255,255,.5)",padding:"7px 8px",background:"rgba(255,255,255,.025)",borderRadius:7}}>5वेंश: <b style={{color:"rgba(255,255,255,.8)"}}>{cPlanetName(lord(5))}</b></div>
        <div style={{...HI,fontSize:".66rem",color:"rgba(255,255,255,.5)",padding:"7px 8px",background:"rgba(255,255,255,.025)",borderRadius:7}}>9वेंश: <b style={{color:"rgba(255,255,255,.8)"}}>{cPlanetName(lord(9))}</b></div>
        <div style={{...HI,fontSize:".66rem",color:"rgba(255,255,255,.5)",padding:"7px 8px",background:"rgba(255,255,255,.025)",borderRadius:7}}>10वेंश: <b style={{color:"rgba(255,255,255,.8)"}}>{cPlanetName(lord(10))}</b></div>
      </div>
    </GlassCard>

    <GlassCard className="p-3">
      <SectionTitle>प्रमुख शास्त्रीय योग</SectionTitle>
      <div className="space-y-2">
        {MAHA_MAP.map(([name,code])=><YogaResult key={name} name={`${name}`} present={mahaHits.some(x=>x.code===code)} rule="ग्रह अपनी स्वराशि/उच्च राशि में केंद्र (1,4,7,10) में हो।" evidence={`ग्रह: ${cPlanetName(code)} · ${houseDesc(planetHouse(code))} · ${JN_RASHI[signs[code]]||"—"} · ${cDignity(code,signs[code])}.`} />)}
        <YogaResult name="विपरीत राजयोग (Vipreet Raj Yoga)" present={vipreetHits.length>0} rule="6th, 8th, 12th के स्वामियों का आपसी संबंध/राशि परिवर्तन।" evidence={vipreetHits.length?vipreetHits.map(([a,b])=>`${a}↔${b}`).join(", "):"कोई mutual exchange नहीं मिला।"} />
        <YogaResult name="नीचभंग राजयोग (Neechabhanga)" present={neechaSupport.length>0} rule="पहले नीच ग्रह पहचाना जाता है; उसके बाद supplied support checks से भंग का evidence दिखाया गया है।" evidence={neecha.length?`नीच ग्रह: ${cPlanetList(neecha)}; support evidence: ${neechaSupport.length?cPlanetList(neechaSupport):"नहीं मिला"}. पूर्ण नीचभंग के सभी शास्त्रीय उप-नियम इस panel में final-claim के रूप में नहीं माने गए हैं।`:"कोई नीच ग्रह नहीं मिला।"} tone={C.orange} />
        <YogaResult name="गजकेसरी योग" present={Boolean(gaja)} rule="चंद्रमा से गुरु 1,4,7,10 में।" evidence={gaja?`गुरु चंद्रमा से ${relativeHouse("Ju","Mo")}वें स्थान पर है।`:"गुरु चंद्रमा से केंद्र में नहीं है।"} />
        <YogaResult name="सुनफा योग" present={sunaphaCodes.length>0} rule="चंद्रमा से 2रे भाव में ग्रह।" evidence={sunaphaCodes.length?`2रे से: ${cPlanetList(sunaphaCodes)}`:"चंद्रमा से 2रे में ग्रह नहीं।"} />
        <YogaResult name="अनफा योग" present={anaphaCodes.length>0} rule="चंद्रमा से 12वें भाव में ग्रह।" evidence={anaphaCodes.length?`12वें से: ${cPlanetList(anaphaCodes)}`:"चंद्रमा से 12वें में ग्रह नहीं।"} />
        <YogaResult name="दुरुधरा योग" present={sunaphaCodes.length>0 && anaphaCodes.length>0} rule="चंद्रमा से 2रे और 12वें दोनों ओर ग्रह।" evidence={durudharaCodes.length?`2रा: ${cPlanetList(sunaphaCodes)} · 12वाँ: ${cPlanetList(anaphaCodes)}`:"दोनों ओर ग्रह नहीं मिले।"} />
        <YogaResult name="वेशि योग" present={vesiCodes.length>0} rule="सूर्य से 2रे भाव में ग्रह।" evidence={vesiCodes.length?`सूर्य से 2रे: ${cPlanetList(vesiCodes)}`:"सूर्य से 2रे में ग्रह नहीं।"} />
        <YogaResult name="वोशि योग" present={vasiCodes.length>0} rule="सूर्य से 12वें भाव में ग्रह।" evidence={vasiCodes.length?`सूर्य से 12वें: ${cPlanetList(vasiCodes)}`:"सूर्य से 12वें में ग्रह नहीं।"} />
        <YogaResult name="उभयचरी योग" present={vesiCodes.length>0 && vasiCodes.length>0} rule="सूर्य से 2रे और 12वें दोनों ओर ग्रह।" evidence={`2रा: ${cPlanetList(vesiCodes)} · 12वाँ: ${cPlanetList(vasiCodes)}`} />
        <YogaResult name="सरस्वती योग" present={saraswati} rule="बुध, गुरु और शुक्र का केंद्र/त्रिकोण में स्थित होना; supplied rule-set में बलवान स्थिति अपेक्षित है।" evidence={`बुध: ${houseDesc(planetHouse("Me"))} · गुरु: ${houseDesc(planetHouse("Ju"))} · शुक्र: ${houseDesc(planetHouse("Ve"))}.`} />
      </div>
    </GlassCard>

    <GlassCard className="p-3">
      <SectionTitle>अशुभ योग / संघर्ष संकेत</SectionTitle>
      <div className="space-y-2">
        <YogaResult name="अरिष्ट योग" present={Boolean(cOwnerRelation(1,6,lagna,houseMap,lordMap).hit || cOwnerRelation(1,8,lagna,houseMap,lordMap).hit || cOwnerRelation(1,12,lagna,houseMap,lordMap).hit)} rule="लग्नेश का 6,8,12 के भावेशों से संबंध; अथवा 6/8/12 भावेशों का परस्पर संबंध।" evidence={`लग्नेश: ${cPlanetName(lord(1))}; 6/8/12 भावेश: ${cPlanetName(lord(6))}, ${cPlanetName(lord(8))}, ${cPlanetName(lord(12))}.`} tone={C.orange} />
        <YogaResult name="दैन्य योग" present={dainyaHits.length>0} rule="6/8/12 के भावेश का किसी अन्य शुभ भावेश के साथ राशि परिवर्तन।" evidence={dainyaHits.length?dainyaHits.map(([a,b])=>`${a}↔${b}`).join(", "):"कोई ऐसा exchange नहीं मिला।"} tone={C.orange} />
        <YogaResult name="खल योग" present={khalaHits.length>0} rule="3रे भावेश का किसी अन्य शुभ भावेश के साथ राशि परिवर्तन।" evidence={khalaHits.length?khalaHits.map(([a,b])=>`${a}↔${b}`).join(", "):"कोई ऐसा exchange नहीं मिला।"} tone={C.orange} />
      </div>
    </GlassCard>

    <GlassCard className="p-3">
      <SectionTitle>मारक ग्रह: भाव, बल और स्थिति</SectionTitle>
      <div className="space-y-2">
        <div style={{...HI,fontSize:".67rem",color:"rgba(255,255,255,.5)",lineHeight:1.5,marginBottom:6}}>उम्मीदवार: 2nd/7th lord और 2nd/7th में स्थित ग्रह। दशा/अंतर्दशा/प्रत्यंतर और गोचर के साथ पढ़ा जाएगा।</div>
        {marakaRows.length ? marakaRows.map(x=><div key={x.code} style={{display:"grid",gridTemplateColumns:"70px 1fr auto",gap:8,alignItems:"center",padding:"7px 8px",borderRadius:7,background:x.severe?"rgba(244,63,94,.08)":"rgba(255,255,255,.025)"}}>
          <div style={{...HI,fontWeight:800,fontSize:".7rem",color:"rgba(255,255,255,.8)"}}>{cPlanetName(x.code)}</div>
          <div style={{...HI,fontSize:".64rem",color:"rgba(255,255,255,.5)"}}>{houseDesc(x.house)} · {JN_RASHI[x.sign]||"—"} · {x.dignity}</div>
          <div style={{...HI,fontSize:".6rem",fontWeight:800,color:x.severe?C.rose:(x.inDusthana?C.orange:x.inTrikona?C.green:C.amber)}}>{x.severe?"नीच + त्रिक":x.inDusthana?"त्रिक":x.inTrikona?"त्रिकोण":"मिश्र"}</div>
        </div>):<div style={{...HI,fontSize:".68rem",color:"rgba(255,255,255,.45)"}}>मारक candidates उपलब्ध नहीं।</div>}
      </div>
    </GlassCard>

    <div style={{...HI,fontSize:".67rem",lineHeight:1.5,color:"rgba(255,255,255,.38)",padding:"7px 9px",background:"rgba(255,255,255,.025)",borderRadius:6}}>
      नोट: इस tab में user-supplied सूत्रों के आधार पर rule-match और evidence दिखाया जाता है। यह software-side संकेत हैं; “100% फल”, “निश्चित मृत्यु”, “निश्चित गरीबी” जैसे निष्कर्ष स्वतः नहीं दिए जाते।
    </div>
  </div>;
}



// ════════ JAIMINI + NAVAMSHA RULES TAB ═════════════════════
// Source-basis: user-supplied VP Goel / Predict with Navamsha rule set.
// This panel deliberately shows evidence/flags, not guaranteed predictions.

const JN_PLANETS = ["Su","Mo","Ma","Me","Ju","Ve","Sa"];
const JN_ALL_PLANETS = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
const JN_NAMES = {Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
const JN_RASHI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const JN_SIGN_LORDS = ["Ma","Ve","Me","Mo","Su","Me","Ve","Ma","Ju","Sa","Sa","Ju"];
const JN_EXALT = {Su:0,Mo:1,Ma:9,Me:5,Ju:3,Ve:11,Sa:6};
const JN_NEECHA = {Su:6,Mo:7,Ma:3,Me:11,Ju:9,Ve:5,Sa:0};
const JN_BENEFICS = new Set(["Mo","Me","Ju","Ve"]);
const JN_MOVABLE = new Set([0,3,6,9]);
const JN_FIXED = new Set([1,4,7,10]);
const JN_DUAL = new Set([2,5,8,11]);

const jnIdx = (raw) => {
  if (typeof raw === "number") return ((raw % 12) + 12) % 12;
  if (raw && typeof raw.Idx === "number") return ((raw.Idx % 12) + 12) % 12;
  return null;
};
const jnPlanetSign = (p, key="D1") => {
  const d = p || {};
  const v = d.Vargas || d.vargas || {};
  const a = jnIdx(v[key]);
  if (a !== null) return a;
  const b = d.rashi_index ?? d.rashiIndex;
  return jnIdx(b);
};
// Read the planet's degree robustly from all formats used by the backend/bridge.
// Chara Karakas are determined from the sign-local degree (0°–30°),
// descending: highest degree = AK ... lowest degree = DK.
const jnPlanetDeg = (p) => {
  const candidates = [
    p?.SignDegree,
    p?.signDegree,
    p?.degree,
    p?.sign_degree,
    p?.Degree,
    p?.fullDegree,
    p?.full_degree,
    p?.longitude,
  ];
  for (const raw of candidates) {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      return ((n % 30) + 30) % 30;
    }
  }
  return null;
};
const jnHouseFromSign = (sign, lagna) => sign === null || lagna === null ? null : ((sign - lagna + 12) % 12) + 1;
const jnSignDistance = (from, to) => ((to - from + 12) % 12) + 1;
const jnConj = (a,b) => a !== null && b !== null && a === b;

function jnRashiAspect(a,b){
  if (a === null || b === null || a === b) return false;
  const adjacent = ((b-a+12)%12===1) || ((a-b+12)%12===1);
  if (JN_MOVABLE.has(a)) return JN_FIXED.has(b) && !adjacent;
  if (JN_FIXED.has(a)) return JN_MOVABLE.has(b) && !adjacent;
  if (JN_DUAL.has(a)) return JN_DUAL.has(b);
  return false;
}
function jnConnect(a,b){ return jnConj(a,b) || jnRashiAspect(a,b); }
function jnConnectLabel(a,b){
  if (jnConj(a,b)) return "युति";
  if (jnRashiAspect(a,b)) return "राशि दृष्टि";
  return "—";
}
function jnDignity(code, sign){
  if (sign === null) return "—";
  if (JN_EXALT[code] === sign) return "उच्च";
  if (JN_NEECHA[code] === sign) return "नीच";
  if (JN_SIGN_LORDS[sign] === code) return "स्वराशि";
  return "";
}
function jnLagnaSign(chart){
  return jnIdx(chart?.meta?.lagnaVargas?.D1) ?? jnPlanetSign(chart?.planets?.La,"D1") ?? jnIdx(chart?.meta?.lagnaIndex);
}
function jnVargaLagnaSign(chart,key){
  return jnIdx(chart?.meta?.lagnaVargas?.[key]) ?? jnPlanetSign(chart?.planets?.La,key);
}
function jnCard(title, children, tone=C.cyan){
  return <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${tone}25`,borderRadius:12,padding:12}}>
    <div style={{...HI,fontWeight:700,fontSize:".82rem",color:tone,marginBottom:8}}>{title}</div>{children}
  </div>;
}
function jnPill(ok,label){
  return <span style={{display:"inline-block",padding:"3px 7px",borderRadius:999,fontSize:".65rem",fontWeight:700,...HI,background:ok?"rgba(34,197,94,.12)":"rgba(148,163,184,.08)",color:ok?C.green:"rgba(255,255,255,.48)",border:`1px solid ${ok?"rgba(34,197,94,.25)":"rgba(148,163,184,.15)"}`}}>{ok?"✓ ":"○ "}{label}</span>;
}
function jnPairsRow(name, codeA, codeB, signs, extra=""){
  const a=signs?.[codeA], b=signs?.[codeB];
  const hit=jnConnect(a,b);
  return <tr><td style={{padding:"6px 4px",fontWeight:700,color:"#E2E8F0"}}>{name}</td><td style={{padding:"6px 4px",color:"#94A3B8"}}>{codeA}</td><td style={{padding:"6px 4px",color:"#94A3B8"}}>{codeB}</td><td style={{padding:"6px 4px"}}>{jnPill(hit,hit?jnConnectLabel(a,b):"असंबद्ध")}</td><td style={{padding:"6px 4px",color:"#94A3B8"}}>{extra}</td></tr>;
}

function JaiminiNavamshaTab(){
  const chart = useKundliStore(s => s.chartData);
  if (!chart?.planets) return <EmptyState icon="🔱" message="जैमिनी डेटा उपलब्ध नहीं" />;

  const planets = chart.planets || {};
  const lagna = jnLagnaSign(chart);
  const d9Lagna = jnVargaLagnaSign(chart,"D9");
  const d1 = Object.fromEntries(JN_ALL_PLANETS.map(c => [c, jnPlanetSign(planets[c],"D1")]));
  const d9 = Object.fromEntries(JN_ALL_PLANETS.map(c => [c, jnPlanetSign(planets[c],"D9")]));
  const d3 = Object.fromEntries(JN_ALL_PLANETS.map(c => [c, jnPlanetSign(planets[c],"D3")]));

  const karakaOrder = [...JN_PLANETS].sort((a,b) => {
    const da = jnPlanetDeg(planets[a]);
    const db = jnPlanetDeg(planets[b]);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return db - da;
  });
  const karakaNames = ["AK","AmK","BK","MK","PK","GK","DK"];
  const karakas = Object.fromEntries(karakaNames.map((k,i) => [k, karakaOrder[i] || null]));
  const karakaDegreeOrder = karakaOrder.map(code => ({
    code,
    degree: jnPlanetDeg(planets[code]),
  }));
  const signs = d1;
  const fifthLord = lagna===null ? null : JN_SIGN_LORDS[(lagna+4)%12];

  const rajyogaPairs = [
    ["AK + AmK","AK","AmK"],["AK + PK","AK","PK"],["AK + DK","AK","DK"],["AK + 5th Lord","AK","5L"],
    ["AmK + PK","AmK","PK"],["AmK + DK","AmK","DK"],["AmK + 5th Lord","AmK","5L"],
    ["PK + DK","PK","DK"],["PK + 5th Lord","PK","5L"],["DK + 5th Lord","DK","5L"],
  ];
  const getCode = k => k==="5L" ? fifthLord : karakas[k];
  const pairResults = rajyogaPairs.map(([name,a,b])=>({name,a:getCode(a),b:getCode(b)}));
  const moonVenus = jnConnect(signs.Mo,signs.Ve);
  const moonAspecters = JN_ALL_PLANETS.filter(c=>c!=="Mo" && jnRashiAspect(signs[c],signs.Mo));
  const amkSign = signs[karakas.AmK];
  const amkSpecial = amkSign===null || !karakas.AmK ? [] : JN_ALL_PLANETS.filter(c=>JN_BENEFICS.has(c) && [2,4,5].includes(jnHouseFromSign(signs[c],amkSign)));
  const amkAkConnect = karakas.AmK && karakas.AK ? jnConnect(signs[karakas.AmK],signs[karakas.AK]) : false;
  const vaithanika = ["Ma","Ve","Ke"].every(c=>signs[c]!==null) && [ ["Ma","Ve"],["Ma","Ke"],["Ve","Ke"] ].every(([a,b])=>{
    const d=jnSignDistance(signs[a],signs[b]);
    return d===3 || d===11;
  });
  const vargottama = JN_ALL_PLANETS.filter(c=>d1[c]!==null && d9[c]!==null && d1[c]===d9[c]);
  const neechToUch = JN_PLANETS.filter(c=>d1[c]!==null && d9[c]!==null && JN_NEECHA[c]===d1[c] && JN_EXALT[c]===d9[c]);
  const rtn = JN_ALL_PLANETS.filter(c=>d9[c]!==null && lagna!==null).map(c=>({code:c,house:jnHouseFromSign(d9[c],lagna)}));
  const rtnGood = new Set([1,4,5,7,9,10,11]);
  const rtnTrik = new Set([6,8,12]);
  const rtnGoodPlanets = rtn.filter(x=>rtnGood.has(x.house));
  const rtnTrikPlanets = rtn.filter(x=>rtnTrik.has(x.house));
  const d9Lagnesh = d9Lagna===null ? null : JN_SIGN_LORDS[d9Lagna];
  const d9LagneshSign = d9Lagnesh ? d9[d9Lagnesh] : null;
  const d9LagneshDignity = d9Lagnesh ? jnDignity(d9Lagnesh,d9LagneshSign) : "—";
  const d9SecondLord = d9Lagna===null ? null : JN_SIGN_LORDS[(d9Lagna+1)%12];
  const d9EleventhLord = d9Lagna===null ? null : JN_SIGN_LORDS[(d9Lagna+10)%12];
  const d9DhanaConnection = d9SecondLord && d9EleventhLord && jnConnect(d9[d9SecondLord],d9[d9EleventhLord]);
  const d9UpachayaOccupied = d9Lagna===null ? [] : JN_ALL_PLANETS.filter(c=>[3,6,10,11].includes(jnHouseFromSign(d9[c],d9Lagna)));

  const trinityData = ["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"].filter(c=>d1[c]!==null&&d3[c]!==null&&d9[c]!==null);
  const trinitySameHouse = trinityData.filter(c=>jnHouseFromSign(d1[c],lagna)!==null && jnHouseFromSign(d1[c],lagna)===jnHouseFromSign(d3[c],lagna) && jnHouseFromSign(d1[c],lagna)===jnHouseFromSign(d9[c],lagna));

  const derivedLagnas = {
    BL: jnIdx(chart?.meta?.bhavaLagna ?? chart?.meta?.bhava_lagna),
    HL: jnIdx(chart?.meta?.horaLagna ?? chart?.meta?.hora_lagna),
    GL: jnIdx(chart?.meta?.ghatiLagna ?? chart?.meta?.ghati_lagna ?? chart?.meta?.ghatikaLagna),
  };
  const triplePlanets = (derivedLagnas.BL!==null&&derivedLagnas.HL!==null&&derivedLagnas.GL!==null)
    ? JN_ALL_PLANETS.filter(c=>jnConnect(signs[c],derivedLagnas.BL)&&jnConnect(signs[c],derivedLagnas.HL)&&jnConnect(signs[c],derivedLagnas.GL)) : [];

  const fmtCodes = arr => arr.length ? arr.map(c=>`${c} ${JN_NAMES[c]||""}`).join(", ") : "—";

  return <div className="space-y-3">
    <div style={{fontSize:".68rem",color:"rgba(255,255,255,.45)",lineHeight:1.6,...HI}}>
      जैमिनी राशि दृष्टि + Chara Karaka संबंध + D1/D9/Vargottama/RTN evidence. यह panel केवल दिए गए सूत्रों के आधार पर rule flags दिखाता है।
    </div>

    {jnCard("10 जैमिनी राजयोग — AK / AmK / PK / DK / 5th Lord", <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:".68rem"}}><thead><tr style={{color:"#64748B",textAlign:"left"}}><th>योग</th><th>ग्रह A</th><th>ग्रह B</th><th>संबंध</th><th>नोट</th></tr></thead><tbody>
      {pairResults.map((r,i)=>jnPairsRow(r.name,r.a||"—",r.b||"—",signs,"युति या Jaimini Rashi Drishti"))}
    </tbody></table></div>)}

    {jnCard("Chara Karaka mapping", <div className="space-y-2"><div style={{fontSize:".68rem",color:"#94A3B8"}}>7-karaka mapping: प्रति राशि degree के descending क्रम से — highest = AK, lowest = DK.</div><div style={{fontSize:".63rem",color:"#64748B",padding:"6px 8px",background:"rgba(255,255,255,.025)",borderRadius:8}}>Degree order: {karakaDegreeOrder.map(x => `${x.code} ${JN_NAMES[x.code] || x.code} ${x.degree===null?"—":x.degree.toFixed(2)+"°"}`).join("  →  ")}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {karakaNames.map(k=> <div key={k} style={{background:"rgba(255,255,255,.035)",borderRadius:8,padding:8}}><div style={{color:C.cyan,fontWeight:800,fontSize:".72rem"}}>{k}</div><div style={{color:"#E2E8F0",fontWeight:700}}>{karakas[k]?`${karakas[k]} ${JN_NAMES[karakas[k]]}`:"—"}</div><div style={{color:"#64748B",fontSize:".62rem"}}>{karakas[k] && jnPlanetDeg(planets[karakas[k]])!==null ? `${jnPlanetDeg(planets[karakas[k]]).toFixed(4)}°` : "degree unavailable"}</div></div>)}
    </div><div style={{fontSize:".63rem",color:"#64748B"}}>5th Lord: {fifthLord ? `${fifthLord} ${JN_NAMES[fifthLord]}` : "डेटा उपलब्ध नहीं"}</div></div>)}

    {jnCard("विशेष जैमिनी सूत्र", <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">{jnPill(moonVenus,"Moon + Venus")} <span style={{fontSize:".64rem",color:"#94A3B8"}}>Moon aspecters: {moonAspecters.length} — {fmtCodes(moonAspecters)}</span></div>
      <div className="flex flex-wrap gap-1.5">{jnPill(amkSpecial.length>0,"AmK 2/4/5 में शुभ ग्रह")}<span style={{fontSize:".64rem",color:"#94A3B8"}}>{fmtCodes(amkSpecial)}</span></div>
      <div className="flex flex-wrap gap-1.5">{jnPill(amkAkConnect,"AmK का AK से Kendra/Trikona/11 संबंध")}</div>
      <div className="flex flex-wrap gap-1.5">{jnPill(vaithanika,"Vaithanika: Mars–Venus–Ketu 3/11 संबंध")}</div>
      <div className="flex flex-wrap gap-1.5">{jnPill(triplePlanets.length>0,"BL + HL + GL को एक ग्रह की दृष्टि")}{derivedLagnas.BL===null&&<span style={{fontSize:".63rem",color:"#64748B"}}>BL/HL/GL data उपलब्ध नहीं, इसलिए यह flag evaluate नहीं हुआ।</span>}</div>
      <div className="flex flex-wrap gap-1.5">{jnPill(trinitySameHouse.length>0,"D1 + D3 + D9 same-house alignment") }<span style={{fontSize:".63rem",color:"#64748B"}}>Source ने target-aspect calculation की exact विधि नहीं दी; यहाँ same-house evidence दिखाया गया है।</span></div>
    </div>)}

    {jnCard("Vargottama + Navamsha", <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">{jnPill(vargottama.length>0,"Vargottama planets")}</div><div style={{fontSize:".65rem",color:"#94A3B8"}}>{fmtCodes(vargottama)}</div>
      <div className="flex flex-wrap gap-1.5">{jnPill(lagna!==null&&d9Lagna!==null&&lagna===d9Lagna,"Vargottama Lagna")}</div><div style={{fontSize:".65rem",color:"#94A3B8"}}>{lagna!==null?JN_RASHI[lagna]:"—"} → D9 {d9Lagna!==null?JN_RASHI[d9Lagna]:"—"}</div>
      <div className="flex flex-wrap gap-1.5">{jnPill(neechToUch.length>0,"D1 नीच → D9 उच्च")}</div><div style={{fontSize:".65rem",color:"#94A3B8"}}>{fmtCodes(neechToUch)}</div>
    </div>)}

    {jnCard("Rashi Tulya Navamsha (RTN / Beeja Kundali)", <div className="space-y-2"><div style={{fontSize:".66rem",color:"#94A3B8"}}>D9 में planet का sign लेकर D1 Lagna से house mapping।</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div style={{background:"rgba(34,197,94,.06)",borderRadius:8,padding:8}}><div style={{color:C.green,fontWeight:700,fontSize:".7rem"}}>1,4,5,7,9,10,11 — शुभ alignment</div><div style={{fontSize:".65rem",color:"#94A3B8"}}>{rtnGoodPlanets.map(x=>`${x.code}: H${x.house}`).join(", ")||"—"}</div></div>
      <div style={{background:"rgba(244,63,94,.05)",borderRadius:8,padding:8}}><div style={{color:C.rose,fontWeight:700,fontSize:".7rem"}}>6,8,12 — त्रिक alignment</div><div style={{fontSize:".65rem",color:"#94A3B8"}}>{rtnTrikPlanets.map(x=>`${x.code}: H${x.house}`).join(", ")||"—"}</div></div>
    </div></div>)}

    {jnCard("D9 Lagnesh + D9 Dhana / Upachaya", <div className="space-y-2"><div className="flex flex-wrap gap-1.5">{jnPill(["उच्च","स्वराशि"].includes(d9LagneshDignity),`D9 Lagnesh: ${d9Lagnesh||"—"} ${d9LagneshDignity||""}`)} {jnPill(d9DhanaConnection,"2L + 11L connection in D9")} {jnPill(d9UpachayaOccupied.length>0,"D9 upachaya occupied")}</div><div style={{fontSize:".63rem",color:"#64748B"}}>{d9Lagnesh ? `${d9Lagnesh} ${JN_NAMES[d9Lagnesh]} in ${d9LagneshSign!==null?JN_RASHI[d9LagneshSign]:"—"}` : "D9 Lagnesh data unavailable"}. 2L–11L connection यहाँ computable D9-dhana indicator के रूप में दिखाया गया है; source text ने इसकी exact sub-rule नहीं दी।</div></div>)}

    {jnCard("Data-dependent rules", <div style={{fontSize:".66rem",lineHeight:1.7,color:"#94A3B8"}}>
      {derivedLagnas.BL===null || derivedLagnas.HL===null || derivedLagnas.GL===null ? "BL/HL/GL source values chart payload में नहीं मिले, इसलिए त्रिविध लग्न दृष्टि को false नहीं माना गया है। " : `BL=${JN_RASHI[derivedLagnas.BL]}, HL=${JN_RASHI[derivedLagnas.HL]}, GL=${JN_RASHI[derivedLagnas.GL]}. `}
      Argala on Lagna/AL/7th और exact D1–D3–D9 target-aspect calculation के लिए source text में आवश्यक exact computational steps नहीं दिए गए; इसलिए इन्हें unverified/partial रखा गया है, अनुमान से नहीं भरा गया।
    </div>)}
  </div>;
}

// ════════ TAB 1 — INDU LAGNA ═════════════════════════════
function InduTab({ indu_lagna, spouse_direction }) {
  if (!indu_lagna?.computed) return <EmptyState icon="💰" message="इन्दु लग्न डेटा उपलब्ध नहीं" />;
  const il = indu_lagna;
  const sd = spouse_direction;

  return (
    <div className="space-y-4">
      <div style={{
        background: il.indu_sav >= 30 ? "rgba(34,211,238,0.08)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${il.wealth_color}30`,
        borderRadius: "14px", padding: "18px", textAlign: "center",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          {["ultra_rich", "crorepati"].includes(il.wealth_level) ? "💎" :
           il.wealth_level === "wealthy" ? "💰" : "⚖️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.2rem",
          color: il.wealth_color, marginBottom: "4px" }}>
          {il.wealth_label}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.8rem", color: il.wealth_color }}>
          इन्दु लग्न: {il.indu_lagna_name}
        </div>
        <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>
          {il.wealth_description}
        </div>
      </div>

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "10px" }}>गणना विधि</div>
        <div className="flex justify-around mb-4">
          <StatBox label={`लग्न 9वें\n${il.lagna_9th_lord_name}`} value={il.kala_lagna} color={C.cyan} />
          <div style={{ alignSelf: "center", fontSize: "1.2rem", color: "rgba(255,255,255,0.3)" }}>+</div>
          <StatBox label={`चंद्र 9वें\n${il.moon_9th_lord_name}`} value={il.kala_moon} color={C.amber} />
          <div style={{ alignSelf: "center", fontSize: "1.2rem", color: "rgba(255,255,255,0.3)" }}>=</div>
          <StatBox label="योग" value={il.total_kala} color={C.green} />
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.55)",
          padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", marginBottom: "8px" }}>
          {il.total_kala} ÷ 12 → शेष {il.remainder} → चंद्र से {il.remainder} आगे = {il.indu_lagna_name}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <StatBox label="इन्दु लग्न SAV" value={il.indu_sav} color={il.wealth_color} />
          <StatBox label="थ्रेशोल्ड" value="30" color="rgba(255,255,255,0.3)" />
        </div>
        <CollapsibleSection icon="📐" title="कला संदर्भ तालिका" defaultOpen={false} color={C.amber}>
          <div className="flex flex-wrap gap-2 mt-1">
            {il.kala_reference && Object.entries(il.kala_reference).map(([p, v]) => (
              <span key={p} style={{ fontSize: "0.75rem", fontFamily: "monospace",
                color: C.amber, background: "rgba(245,158,11,0.1)", padding: "3px 8px", borderRadius: "6px" }}>
                {{"Su":"सूर्य","Mo":"चंद्र","Ma":"मंगल","Me":"बुध","Ju":"गुरु","Ve":"शुक्र","Sa":"शनि"}[p]}={v}
              </span>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
            सूर्य=30 | चंद्र=16 | मंगल=6 | बुध=8 | गुरु=10 | शुक्र=12 | शनि=1
          </div>
        </CollapsibleSection>
      </GlassCard>

      {sd?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${C.cyan}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.cyan, marginBottom: "8px" }}>💑 जीवनसाथी की दिशा</div>
          <div style={{ fontSize: "2.5rem", textAlign: "center", marginBottom: "6px" }}>{sd.direction_emoji}</div>
          <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.cyan,
            textAlign: "center", marginBottom: "6px" }}>
            {sd.spouse_direction} दिशा
          </div>
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>{sd.desc}</div>
          <div className="flex flex-wrap gap-1 mt-3">
            {sd.direction_scores && Object.entries(sd.direction_scores)
              .sort((a, b) => b[1] - a[1])
              .map(([dir, pts]) => (
                <span key={dir} style={{
                  fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px",
                  background: dir === sd.spouse_direction ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)",
                  color: dir === sd.spouse_direction ? C.cyan : "rgba(255,255,255,0.5)",
                  fontWeight: dir === sd.spouse_direction ? 700 : 400, ...HI,
                }}>
                  {dir}: {pts}
                </span>
              ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 2 — NEECH BHANG / UCHHA BHANG ══════════════
function YogasTab({ neech_uchha, debt_trap, sudden_rise }) {
  return (
    <div className="space-y-4">
      <div style={{ ...HI, fontWeight: 600, color: C.amber, fontSize: "0.85rem" }}>
        नीच-भंग / उच्च-भंग विश्लेषण
      </div>
      {neech_uchha?.length > 0 ? (
        neech_uchha.map((p, i) => (
          <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${p.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span style={{ ...HI, fontWeight: 700, color: p.color, fontSize: "1rem" }}>
                  {p.planet_name}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  {p.rashi_name} | BAV {p.bav_points}
                </span>
              </div>
              <StatusPill label={
                p.status === "neech_bhang" ? "नीच-भंग" :
                p.status === "uchha_bhang" ? "उच्च-भंग" :
                p.status === "uchha_double" ? "दोहरा उच्च" : "दोहरा नीच"
              } color={p.status.includes("bhang") || p.status === "neech_double" ? "rose" : "cyan"}
              size="sm" />
            </div>
            <div style={{ ...HI, fontSize: "0.82rem", color: p.color, fontWeight: 600, marginBottom: "4px" }}>
              {p.label}
            </div>
            <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.72)" }}>{p.description}</div>
          </GlassCard>
        ))
      ) : (
        <GlassCard className="p-4">
          <div style={{ ...HI, fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
            ⚖️ कोई असाधारण नीच/उच्च योग नहीं।
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📜 नियम
        </div>
        {[
          ["नीच + BAV 6/7/8",   "नीच-भंग — उच्च ग्रह जैसा अपार फल", C.cyan],
          ["नीच + BAV 0/1/2",   "दोहरी कमजोरी — भारी संघर्ष",        C.rose],
          ["उच्च + BAV 6/7/8",  "उच्च दोहरा — असाधारण शक्ति",         C.cyan],
          ["उच्च + BAV 0/1/2/3","उच्च-भंग — कोई लाभ नहीं",            C.orange],
        ].map(([cond, res, col]) => (
          <div key={cond} style={{ display: "flex", justifyContent: "space-between",
            padding: "5px 0", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: col }}>{cond}</span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.65)" }}>{res}</span>
          </div>
        ))}
      </GlassCard>

      {/* [Fix ④] SutraCard → CardBlock for Debt Trap */}
      {debt_trap && (
        <CardBlock
          icon={debt_trap.has_debt_trap ? "⚠️" : "✅"}
          title={debt_trap.label}
          accent={debt_trap.color}
          defaultOpen={true}
        >
          {debt_trap.desc && (
            <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", marginBottom: "8px" }}>
              {debt_trap.desc}
            </div>
          )}
          {debt_trap.rule && (
            <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)",
              padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "6px",
              marginBottom: "8px" }}>
              💡 {debt_trap.rule}
            </div>
          )}
          {debt_trap.has_debt_trap && debt_trap.trapped_planets?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {debt_trap.trapped_planets.map(p => (
                <span key={p.planet} style={{
                  fontSize: "0.75rem", color: C.orange,
                  background: "rgba(251,146,60,0.12)", padding: "3px 10px",
                  borderRadius: "12px", ...HI,
                }}>
                  {p.planet_name} — {p.position} (BAV {p.bav_pts})
                </span>
              ))}
            </div>
          )}
        </CardBlock>
      )}

      {sudden_rise && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${sudden_rise.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: sudden_rise.color, marginBottom: "8px" }}>
            {sudden_rise.label}
          </div>
          <div className="flex gap-4 mb-3">
            {[["9वां (भाग्य)", sudden_rise.h9], ["10वां (कर्म)", sudden_rise.h10],
              ["11वां (लाभ)", sudden_rise.h11]].map(([t, v]) => (
              <StatBox key={t} label={t} value={v}
                color={v === sudden_rise.h11 && sudden_rise.h11 > sudden_rise.h10 ? C.cyan : C.amber} />
            ))}
          </div>
          {sudden_rise.jump >= 0 && (
            <div style={{ ...HI, fontSize: "0.78rem",
              color: sudden_rise.jump >= 10 ? C.cyan : "rgba(255,255,255,0.65)" }}>
              उछाल: 10वें → 11वें = +{sudden_rise.jump} बिंदु
            </div>
          )}
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
            {sudden_rise.description}
          </div>
          {sudden_rise.bhagya_factor && (
            <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, marginTop: "6px" }}>
              {sudden_rise.bhagya_factor}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 3 — DHAN + VIVAH ═══════════════════════════
function DhanTab({ income_trapped, danger_zones, partner_compat }) {
  return (
    <div className="space-y-4">
      {income_trapped && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${income_trapped.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: income_trapped.color, marginBottom: "10px" }}>
            {income_trapped.label}
          </div>
          <div className="flex gap-3 mb-3">
            {[["2रा (बचत)", income_trapped.h2],
              ["11वां (आय)", income_trapped.h11],
              ["12वां (व्यय)", income_trapped.h12]].map(([t, v]) => (
              <StatBox key={t} label={t} value={v}
                color={
                  t.includes("11") && income_trapped.h11 > income_trapped.h12 ? C.cyan :
                  t.includes("2")  && income_trapped.h2 >= 28 ? C.cyan :
                  t.includes("12") && income_trapped.h12 > income_trapped.h11 ? C.rose :
                  C.amber
                } />
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>
            {income_trapped.description}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
            {income_trapped.rule}
          </div>
        </GlassCard>
      )}

      {danger_zones && (
        <>
          {danger_zones.both_danger && (
            <div style={{ ...HI, fontSize: "0.82rem", color: C.rose, padding: "8px 12px",
              background: "rgba(251,113,133,0.08)", borderRadius: "8px" }}>
              {danger_zones.combined_alert}
            </div>
          )}
          {[danger_zones.fifth_house, danger_zones.seventh_house].map((h, i) => h && (
            <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${h.color}` }}>
              <div className="flex items-center justify-between mb-2">
                <div style={{ ...HI, fontWeight: 700, color: h.color }}>{h.label}</div>
                <StatusPill
                  label={h.in_danger_zone ? "खतरा!" : h.level === "strong" ? "बलवान" : "सामान्य"}
                  color={h.in_danger_zone ? "rose" : h.level === "strong" ? "cyan" : "amber"}
                  size="sm"
                />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: h.color, marginBottom: "4px" }}>
                {h.points} <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>SAV</span>
              </div>
              {h.in_danger_zone && (
                <div style={{ ...HI, fontSize: "0.78rem", color: C.rose, marginTop: "4px" }}>
                  {h.description}
                </div>
              )}
            </GlassCard>
          ))}
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)",
            padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
            {danger_zones.rule}
          </div>
        </>
      )}

      {partner_compat?.computed !== false && (
        <GlassCard className="p-4" style={{ borderLeft: `3px solid ${partner_compat.color}` }}>
          <div style={{ ...HI, fontWeight: 700, color: C.amber, marginBottom: "8px" }}>
            🌙 साथी का मानसिक तालमेल
          </div>
          <div style={{ ...HI, fontWeight: 700, fontSize: "1rem",
            color: partner_compat.color, marginBottom: "6px" }}>
            {partner_compat.label}
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>
            {partner_compat.description}
          </div>
          <div className="space-y-1 mt-3">
            {partner_compat.scale?.map(s => (
              <div key={s.range} style={{ display: "flex", gap: "12px", fontSize: "0.72rem" }}>
                <span style={{ fontFamily: "monospace", color: C.amber, width: "48px" }}>{s.range}</span>
                <span style={{ ...HI, color: "rgba(255,255,255,0.55)" }}>→ {s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>
            {partner_compat.rule}
          </div>
        </GlassCard>
      )}
    </div>
  );
}


// ════════ TAB 4 — SUDARSHAN CHAKRA ═══════════════════════
function ChakraTab({ sudarshan_avg }) {
  if (!sudarshan_avg?.computed) return <EmptyState icon="🔯" message="सुदर्शन चक्र डेटा उपलब्ध नहीं" />;
  const sa = sudarshan_avg;
  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center" style={{ borderLeft: `3px solid ${sa.ceo_color}` }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>
          {sa.ceo_avg >= 33 ? "👑" : sa.ceo_avg >= 28 ? "💼" : "⚖️"}
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1.1rem", color: sa.ceo_color, marginBottom: "4px" }}>
          {sa.ceo_label}
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.8rem", color: sa.ceo_color }}>{sa.ceo_avg}</div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
          10वें+11वें का औसत (थ्रेशोल्ड: 30+)
        </div>
      </GlassCard>

      {!sa.has_all_three && (
        <div style={{ ...HI, fontSize: "0.78rem", color: C.orange, padding: "8px 12px",
          background: "rgba(251,146,60,0.08)", borderRadius: "8px" }}>
          ⚠️ {sa.note}
        </div>
      )}

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "10px" }}>12 भावों का औसत बल</div>
        <div className="space-y-2">
          {sa.house_data?.map(h => (
            <div key={h.house} className="flex items-center gap-2">
              <span style={{ width: "28px", fontSize: "0.75rem", textAlign: "right",
                color: h.strong ? C.cyan : h.weak ? C.rose : "rgba(255,255,255,0.5)",
                fontWeight: h.strong || h.weak ? 700 : 400 }}>
                {h.house}
              </span>
              <div style={{ flex: 1 }}>
                <StrengthBar value={(h.avg / 45) * 100}
                  color={h.strong ? C.cyan : h.weak ? C.rose : C.amber} />
              </div>
              <span style={{ width: "32px", textAlign: "right", fontSize: "0.75rem", fontWeight: 600,
                color: h.strong ? C.cyan : h.weak ? C.rose : "rgba(255,255,255,0.5)" }}>
                {h.avg}
              </span>
              {h.house === sa.best_house && <span style={{ fontSize: "0.6rem", color: C.cyan }}>★</span>}
              {h.house === sa.worst_house && <span style={{ fontSize: "0.6rem", color: C.rose }}>▼</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px",
          fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
          <span>★ सर्वश्रेष्ठ: भाव {sa.best_house}</span>
          <span>▼ कमजोर: भाव {sa.worst_house}</span>
        </div>
      </GlassCard>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontSize: "0.8rem", color: C.amber, marginBottom: "6px", fontWeight: 600 }}>
          {sa.rule}
        </div>
        {[
          ["≥33",   "CEO / IAS / मंत्री स्तर",     C.cyan],
          ["28-32", "उच्च पद / सफल व्यापारी",      C.green],
          ["22-27", "मध्यम स्तर",                   C.amber],
          ["<22",   "संघर्ष का स्तर",               C.rose],
        ].map(([r, l, c]) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between",
            padding: "4px 0", borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: c }}>{r}</span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{l}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 5 — BHAVAT BHAVAM ══════════════════════════
function BhavatTab({ bhavat_bhavam }) {
  if (!bhavat_bhavam?.length) return <EmptyState icon="🌀" message="भवत्-भवम् डेटा उपलब्ध नहीं" />;
  const struggling  = bhavat_bhavam.filter(b => b.struggle);
  const flourishing = bhavat_bhavam.filter(b => !b.struggle && b.house_pts >= 28);

  return (
    <div className="space-y-4">
      <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
        किसी भाव से 8वाँ भाव = उस भाव का संघर्ष-दर्पण।
        यदि 8वें भाव के बिंदु उस भाव से अधिक → संघर्ष।
      </div>
      {struggling.length > 0 && (
        <div>
          <div style={{ ...HI, fontWeight: 600, color: C.rose, fontSize: "0.82rem", marginBottom: "8px" }}>
            ⚠️ संघर्ष वाले क्षेत्र ({struggling.length})
          </div>
          <div className="space-y-2">
            {struggling.map(b => (
              <GlassCard key={b.house} className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ ...HI, fontWeight: 600, color: C.rose, fontSize: "0.85rem" }}>
                    {b.topic}
                  </span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                      {b.house_pts} vs {b.eighth_pts}
                    </span>
                    <StatusPill label="संघर्ष" color="rose" size="xs" />
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                  {b.house}वें SAV={b.house_pts} &lt; {b.eighth_house}वें SAV={b.eighth_pts}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      {flourishing.length > 0 && (
        <div>
          <div style={{ ...HI, fontWeight: 600, color: C.cyan, fontSize: "0.82rem", marginBottom: "8px" }}>
            ✅ बलवान क्षेत्र ({flourishing.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {flourishing.map(b => (
              <span key={b.house} style={{ fontSize: "0.75rem", color: C.cyan,
                background: "rgba(34,211,238,0.1)", padding: "4px 10px",
                borderRadius: "12px", ...HI }}>
                {b.topic}
              </span>
            ))}
          </div>
        </div>
      )}
      <CollapsibleSection icon="📋" title="सभी 12 भाव" defaultOpen={false} color={C.amber}>
        <div className="space-y-1">
          {bhavat_bhavam.map(b => (
            <div key={b.house} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "6px 8px", borderRadius: "6px",
              background: b.struggle ? "rgba(251,113,133,0.06)" : "rgba(255,255,255,0.02)" }}>
              <span style={{ ...HI, fontSize: "0.78rem",
                color: b.struggle ? C.rose : "rgba(255,255,255,0.65)" }}>
                {b.house}. {b.topic}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "0.72rem",
                color: b.struggle ? C.rose : "rgba(255,255,255,0.4)" }}>
                {b.house_pts}→{b.eighth_pts}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}


// ════════ TAB 6 — LIFE CYCLE BY RASHIS ═══════════════════
function RashiCycleTab({ life_cycle_rashis }) {
  if (!life_cycle_rashis?.computed) return <EmptyState icon="📅" message="राशि चक्र डेटा उपलब्ध नहीं" />;
  const lc = life_cycle_rashis;
  const maxScore = Math.max(...lc.scores);

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 text-center" style={{ borderLeft: `3px solid ${C.cyan}` }}>
        <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🏆</div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.cyan }}>
          {lc.best_phase?.name}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
          {lc.desc}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "12px" }}>तीन काल की शक्ति</div>
        {lc.phases?.map((phase, i) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-1">
              <div>
                <span style={{ ...HI, fontWeight: phase.is_best ? 700 : 400,
                  color: phase.is_best ? C.cyan : "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}>
                  {phase.name}
                </span>
                {phase.is_best && <StatusPill label="सर्वश्रेष्ठ" color="cyan" size="xs" />}
              </div>
              <span style={{ fontWeight: 700, color: phase.is_best ? C.cyan : C.amber }}>{phase.score}</span>
            </div>
            <ProgressBar value={phase.score} max={maxScore + 10}
              color={phase.is_best ? C.cyan : i === 1 ? C.amber : C.green} delay={i * 0.15} />
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>
              {phase.rashis} | {phase.rashi_names?.join(", ")}
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="p-4" style={{ background: "rgba(245,158,11,0.04)" }}>
        <div style={{ ...HI, fontWeight: 600, color: C.amber, marginBottom: "8px", fontSize: "0.82rem" }}>
          📐 विधि (राशि-वार विभाजन)
        </div>
        {[
          ["0-30 वर्ष",  "मीन → मिथुन (12,1,2,3 राशि)"],
          ["30-60 वर्ष", "कर्क → तुला (4,5,6,7 राशि)"],
          ["60+ वर्ष",   "वृश्चिक → कुंभ (8,9,10,11 राशि)"],
        ].map(([age, rashis]) => (
          <div key={age} style={{ display: "flex", gap: "12px", padding: "5px 0",
            borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: C.amber, width: "72px" }}>
              {age}
            </span>
            <span style={{ ...HI, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{rashis}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}


// ════════ TAB 7 — HOUSE COMPARISONS ═════════════════════════
function TulnaTab({ house_comparisons }) {
  if (!house_comparisons?.computed)
    return <EmptyState icon="⚖️" message="भाव तुलना डेटा उपलब्ध नहीं" />;

  const hc = house_comparisons;
  const rules = [
    {
      icon: "🌟", title: "सपनों की पूर्ति",
      subtitle: `3रा भाव (${hc.h3}) vs 11वां भाव (${hc.h11})`,
      ...hc.sapne_purti,
    },
    {
      icon: "🧠", title: "दिमाग vs दिल",
      subtitle: `लग्न (${hc.h1}) vs 4था भाव (${hc.h4})`,
      ...hc.dimag_dil,
    },
    {
      icon: "💍", title: "वैवाहिक जीवन में दबदबा",
      subtitle: `लग्न (${hc.h1}) vs 7वां भाव (${hc.h7})`,
      ...hc.vivah_dominance,
    },
    {
      icon: "🍀", title: "खुद की मेहनत या भाग्य?",
      subtitle: `9वां भाव (${hc.h9}) vs 10वां भाव (${hc.h10})`,
      ...hc.bhagya_mehnat,
    },
  ];

  return (
    <div className="space-y-3">
      <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
        भावों की आपसी तुलना से व्यक्तित्व और जीवन के पहलू समझें
      </div>
      {rules.map((r, i) => (
        <GlassCard key={i} className="p-4" style={{ borderLeft: `3px solid ${r.color}` }}>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: "1.6rem", flexShrink: 0 }}>{r.icon}</span>
            <div className="flex-1">
              <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: r.color, marginBottom: "2px" }}>
                {r.title}
              </div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>
                {r.subtitle}
              </div>

              {/* Visual bar comparison */}
              <div className="flex items-center gap-2 mb-3">
                {r.h3 !== undefined ? (
                  <>
                    <div style={{ flex: r.h3, height: "6px", borderRadius: "3px",
                      background: "#818CF8", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#818CF8", flexShrink: 0 }}>{r.h3}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h11}</span>
                    <div style={{ flex: r.h11, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                ) : r.h1 !== undefined && r.h4 !== undefined ? (
                  <>
                    <div style={{ flex: r.h1, height: "6px", borderRadius: "3px",
                      background: "#22D3EE", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#22D3EE", flexShrink: 0 }}>{r.h1}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h4 ?? r.h7 ?? r.h10}</span>
                    <div style={{ flex: r.h4 ?? r.h7 ?? r.h10, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                ) : (
                  <>
                    <div style={{ flex: r.h9, height: "6px", borderRadius: "3px",
                      background: "#4ADE80", opacity: 0.7 }} />
                    <span style={{ fontSize: "0.65rem", color: "#4ADE80", flexShrink: 0 }}>{r.h9}</span>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>vs</span>
                    <span style={{ fontSize: "0.65rem", color: r.color, flexShrink: 0 }}>{r.h10}</span>
                    <div style={{ flex: r.h10, height: "6px", borderRadius: "3px",
                      background: r.color, opacity: 0.7 }} />
                  </>
                )}
              </div>

              <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem", color: r.color, marginBottom: "4px" }}>
                {r.label}
              </div>
              <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                {r.desc}
              </div>
              <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
                padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                💡 {r.rule}
              </div>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}


// ════════ TAB 8 — MEGA RULES (164, 76, Black Hole, Saatvik) ══
function MegaTab({ mega_rules }) {
  if (!mega_rules?.computed)
    return <EmptyState icon="📊" message="सारांश डेटा उपलब्ध नहीं" />;

  const mr = mega_rules;

  return (
    <div className="space-y-3">

      {/* 164 Rule */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.prosperity.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>{mr.prosperity.is_prosperous ? "🌟" : "⚠️"}</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.prosperity.color }}>
              164 बिंदु — समृद्धि नियम
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              भाव 1+2+4+9+10+11
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: "1.6rem", color: mr.prosperity.color }}>
              {mr.prosperity.sum}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>/ 164</div>
          </div>
        </div>
        <StrengthBar value={Math.min(100, (mr.prosperity.sum / 250) * 100)}
          color={mr.prosperity.color} delay={0.1} />
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.prosperity.color, marginTop: "10px", marginBottom: "4px" }}>
          {mr.prosperity.label}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(mr.prosperity.house_vals).map(([h, v]) => (
            <span key={h} style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: "10px",
              background: v >= 28 ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
              color: v >= 28 ? "#22D3EE" : "rgba(255,255,255,0.5)", ...HI }}>
              {h}वां: {v}
            </span>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.prosperity.rule}
        </div>
      </GlassCard>

      {/* 76 Rule */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.debtfree.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>{mr.debtfree.is_debtfree ? "✅" : "💸"}</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.debtfree.color }}>
              76 बिंदु — कर्ज-मुक्ति नियम
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              भाव 6+8+12
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontWeight: 900, fontSize: "1.6rem", color: mr.debtfree.color }}>
              {mr.debtfree.sum}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>/ 76</div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem", color: mr.debtfree.color, marginBottom: "4px" }}>
          {mr.debtfree.label}
        </div>
        <div className="flex gap-3 mt-2">
          {Object.entries(mr.debtfree.house_vals).map(([h, v]) => (
            <div key={h} style={{ textAlign: "center", flex: 1, padding: "6px",
              background: "rgba(255,255,255,0.04)", borderRadius: "8px" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: mr.debtfree.color }}>{v}</div>
              <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{h}वां भाव</div>
            </div>
          ))}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.debtfree.rule}
        </div>
      </GlassCard>

      {/* Black Hole */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.blackhole.color}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: "1.6rem" }}>⚫</span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.blackhole.color }}>
              ब्लैक होल भाव (15 से कम बिंदु)
            </div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.blackhole.color, marginBottom: "8px" }}>
          {mr.blackhole.label}
        </div>
        {mr.blackhole.has_blackhole ? (
          <div className="space-y-2">
            {mr.blackhole.black_holes.map((bh, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: "8px",
                background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)" }}>
                <div style={{ ...HI, fontSize: "0.82rem", color: "#FB7185", fontWeight: 600 }}>
                  {bh.warning}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...HI, fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
            सभी भावों में 15+ बिंदु — कोई खतरनाक क्षेत्र नहीं।
          </div>
        )}
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          marginTop: "8px", padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.blackhole.rule}
        </div>
      </GlassCard>

      {/* Saatvik vs Dikhawa */}
      <GlassCard className="p-4" style={{ borderLeft: `3px solid ${mr.saatvik.color}` }}>
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: "2rem" }}>
            {mr.saatvik.type === "saatvik" ? "🙏" : mr.saatvik.type === "dikhawa" ? "✨" : "⚖️"}
          </span>
          <div>
            <div style={{ ...HI, fontWeight: 700, fontSize: "0.9rem", color: mr.saatvik.color }}>
              सात्विक vs दिखावा
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
              आंतरिक (1,4,5,7,9,10) vs बाहरी (2,3,6,8,11,12)
            </div>
          </div>
        </div>
        <div className="flex gap-3 mb-3">
          <div style={{ flex: 1, textAlign: "center", padding: "8px",
            background: "rgba(74,222,128,0.08)", borderRadius: "8px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#4ADE80" }}>
              {mr.saatvik.internal_sum}
            </div>
            <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>आंतरिक</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "8px",
            background: "rgba(192,132,252,0.08)", borderRadius: "8px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.4rem", color: "#C084FC" }}>
              {mr.saatvik.external_sum}
            </div>
            <div style={{ ...HI, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>बाहरी</div>
          </div>
        </div>
        <div style={{ ...HI, fontWeight: 700, fontSize: "0.85rem",
          color: mr.saatvik.color, marginBottom: "4px" }}>
          {mr.saatvik.label}
        </div>
        <div style={{ ...HI, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
          {mr.saatvik.desc}
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
          padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          💡 {mr.saatvik.rule}
        </div>
      </GlassCard>

    </div>
  );
}


// ════════ TAB — KHAR / 64TH NAVAMSHA ════════════════════════
function Khar64NavamsaTab({ khar_64th_navamsa }) {
  const data = khar_64th_navamsa;

  if (!data?.computed) {
    return <EmptyState icon="☠️" message="64वें नवांश / खर का डेटा उपलब्ध नहीं" />;
  }

  const dualPlanets = Array.isArray(data.dual_sign_planets) ? data.dual_sign_planets : [];
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const vishPlanets = Array.isArray(data.vish_navamsha_planets) ? data.vish_navamsha_planets : [];
  const names = (arr) => Array.isArray(arr) && arr.length ? arr.join(", ") : "—";

  const Mini = ({ label, value, tone = "normal" }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.35,
      color: tone === "bad" ? C.rose : tone === "good" ? C.cyan : "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value || "—"}
    </span>
  );

  return (
    <div className="space-y-3">
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.9rem", color: C.amber }}>
          ☠️ 64वाँ नवांश / खर
        </div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginTop: "4px", lineHeight: 1.5 }}>
          D1 द्वि-स्वभाव राशि → 1/5/9 नवांश → D9 से 4था → D3 से 8वाँ → केवल राशि-स्वामी।
        </div>
      </GlassCard>

      {/* STEP 1 + 2: show every planet in a D1 dual sign and its degree/navamsha status */}
      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>
          स्टेप 1–2 · D1 द्वि-स्वभाव राशि + 1/5/9 नवांश
        </div>
        {!dualPlanets.length ? (
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.55)" }}>कोई ग्रह द्वि-स्वभाव राशि में नहीं।</div>
        ) : (
          <div style={{ display: "grid", gap: "5px" }}>
            {dualPlanets.map((x, i) => (
              <div key={`${x.planet_code}-${i}`} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
                padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)"
              }}>
                <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,.82)" }}>
                  <b>{x.planet_name}</b> · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                </div>
                <StatusPill
                  label={x.navamsha_qualifies ? "योग्य" : "बाहर"}
                  color={x.navamsha_qualifies ? "cyan" : "rose"}
                  size="xs"
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* STEP 3 + 4: only qualifying planets */}
      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>
          स्टेप 3–4 · 64वाँ नवांश + 22वाँ द्रेष्काण + Double Khar
        </div>

        {!candidates.length ? (
          <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.55)" }}>
            कोई ग्रह 1/5/9 नवांश की शर्त पूरी नहीं करता।
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {candidates.map((x, i) => {
              const d9 = x.d9_64th_navamsha || x.d9_fourth || {};
              const d3 = x.d3_22nd_drekkana || x.d3_eighth || {};
              const isDouble = !!x.double_khar;

              return (
                <div key={`${x.planet_code}-${i}`} style={{
                  padding: "8px", borderRadius: "7px",
                  border: `1px solid ${isDouble ? "rgba(251,113,133,.28)" : "rgba(255,255,255,.08)"}`,
                  background: isDouble ? "rgba(251,113,133,.055)" : "rgba(255,255,255,.025)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan }}>
                      {x.planet_name} से खर
                    </div>
                    <StatusPill label={isDouble ? "DOUBLE KHAR" : "Single Khar"} color={isDouble ? "rose" : "cyan"} size="xs" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "5px 10px" }}>
                    <Mini label="D1" value={`${x.d1_rashi_name} · ${x.d1_sign_degree}° · नवांश ${x.navamsha_no}`} />
                    <Mini label="D9 में ग्रह" value={`${x.planet_name}: ${x.d9_rashi_name || "—"}`} />
                    <Mini label="D3 में ग्रह" value={`${x.planet_name}: ${x.d3_rashi_name || "—"}`} />
                    <Mini label="D9 से 4था (64वाँ नवांश)" value={d9.available ? `${d9.target_rashi_name} → ${d9.lord_name}` : "—"} tone="good" />
                    <Mini label="D3 से 8वाँ (22वाँ द्रेष्काण)" value={d3.available ? `${d3.target_rashi_name} → ${d3.lord_name}` : "—"} tone="good" />
                    <Mini label="64वें नवांश के स्वामी की D2 होरा" value={x.d9_khar_lord_hora?.available ? `${x.d9_khar_lord} → ${x.d9_khar_lord_hora.hora_lord} होरा · ${x.d9_khar_lord_hora.d2_rashi_name || "D2 उपलब्ध"}` : "D2 डेटा उपलब्ध नहीं"} />
                    <Mini label="22वें द्रेष्काण के स्वामी की D2 होरा" value={x.d3_khar_lord_hora?.available ? `${x.d3_khar_lord} → ${x.d3_khar_lord_hora.hora_lord} होरा · ${x.d3_khar_lord_hora.d2_rashi_name || "D2 उपलब्ध"}` : "D2 डेटा उपलब्ध नहीं"} />
                  </div>

                  {isDouble && (
                    <div style={{ ...HI, marginTop: "6px", fontSize: "0.72rem", fontWeight: 700, color: C.rose }}>
                      Double Khar: <b>{x.planet_name}</b> से <b>{x.d9_khar_lord}</b> बन रहा है
                      {x.double_khar_hora?.available && (
                        <span style={{ fontWeight: 600, color: "rgba(255,255,255,.72)" }}>
                          {` · D2 में ${x.d9_khar_lord_hora?.d2_rashi_name || x.double_khar_hora.d2_rashi_name || "होरा"}: ${x.double_khar_hora.hora_lord}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* ALL-PLANET 64TH NAVAMSHA + 22ND DREKKANA EVIDENCE */}
      {Array.isArray(data.all_planet_checks) && data.all_planet_checks.length > 0 && (
        <GlassCard className="p-3">
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>
            सभी ग्रह · 64वाँ नवांश + 22वाँ द्रेष्काण
          </div>
          <div style={{ ...HI, fontSize: "0.67rem", color: "rgba(255,255,255,.48)", marginBottom: "8px", lineHeight: 1.45 }}>
            Double Khar बने या न बने, हर ग्रह से D9 का 4था और D3 का 8वाँ केवल evidence के रूप में दिखाया गया है।
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {data.all_planet_checks.map((x, i) => {
              const d9 = x.d9_64th_navamsha || x.d9_fourth || {};
              const d3 = x.d3_22nd_drekkana || x.d3_eighth || {};
              return (
                <div key={`all-khar-${x.planet_code}-${i}`} style={{
                  padding: "7px 8px", borderRadius: "7px",
                  background: "rgba(255,255,255,.025)",
                  border: "1px solid rgba(255,255,255,.06)"
                }}>
                  <div style={{ ...HI, fontWeight: 750, fontSize: "0.73rem", color: "rgba(255,255,255,.82)", marginBottom: "5px" }}>
                    {x.planet_name} · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "4px 10px" }}>
                    <Mini label="64वाँ नवांश" value={d9.available ? `${d9.target_rashi_name} → ${d9.lord_name}` : "D9 डेटा उपलब्ध नहीं"} />
                    <Mini label="22वाँ द्रेष्काण" value={d3.available ? `${d3.target_rashi_name} → ${d3.lord_name}` : "D3 डेटा उपलब्ध नहीं"} />
                    <Mini label="Double Khar" value={x.double_khar ? `हाँ · ${x.d9_khar_lord || "—"}` : "नहीं"} />
                    <Mini label="64वें स्वामी की Hora" value={x.d9_khar_lord_hora?.available ? `${x.d9_khar_lord} → ${x.d9_khar_lord_hora.hora_lord}` : "—"} />
                    <Mini label="22वें स्वामी की Hora" value={x.d3_khar_lord_hora?.available ? `${x.d3_khar_lord} → ${x.d3_khar_lord_hora.hora_lord}` : "—"} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* VISH NAVAMSHA — INDEPENDENT RAW EVIDENCE */}
      {vishPlanets.length > 0 && (
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.rose, marginBottom: "7px" }}>
            विष नवांश · सर्प / गिद्ध / सूअर
          </div>
          <div style={{ ...HI, fontSize: "0.67rem", color: "rgba(255,255,255,.48)", marginBottom: "6px", lineHeight: 1.45 }}>
            D1 राशि के अनुसार 1/5/9 विष नवांश की raw स्थिति; साथ में भाव, स्वामित्व, प्राकृतिक कारकत्व और D2 होरा।
          </div>
          <div style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.62)", marginBottom: "8px", padding: "5px 7px", borderRadius: "6px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
            <b>विष नवांश वर्ग:</b> 1वाँ नवांश = <b>सर्प</b> · 5वाँ नवांश = <b>गिद्ध</b> · 9वाँ नवांश = <b>सूअर</b>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {vishPlanets.map((x, i) => (
              <div key={`vish-${x.planet_code}-${i}`} style={{
                padding: "7px 8px", borderRadius: "7px",
                background: "rgba(251,113,133,.045)",
                border: "1px solid rgba(251,113,133,.12)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <div style={{ ...HI, fontWeight: 800, fontSize: "0.73rem", color: C.rose }}>
                    {x.planet_name} · {x.d1_rashi_name} · {x.d1_sign_degree}° · नवांश {x.navamsha_no}
                  </div>
                  <StatusPill label={x.vish_navamsha_no ? `${x.vish_navamsha_no}वाँ · ${x.vish_category || "विष"}` : (x.vish_category || "विष")} color="rose" size="xs" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "4px 10px" }}>
                  <Mini label="D1 भाव" value={x.d1_house_name || "—"} />
                  <Mini label="D1 स्वामित्व" value={Array.isArray(x.d1_lordship_houses) && x.d1_lordship_houses.length ? x.d1_lordship_houses.join(", ") + "वां" : "—"} />
                  <Mini label="प्राकृतिक कारकत्व" value={x.natural_karakatwa || "—"} />
                  <Mini label="D2 होरा" value={x.vish_hora?.available ? `${x.vish_hora.hora_lord} होरा · ${x.vish_hora.d2_rashi_name || "—"}` : "D2 डेटा उपलब्ध नहीं"} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div style={{ ...HI, fontSize: "0.67rem", lineHeight: 1.5, color: "rgba(255,255,255,.38)", padding: "7px 9px", background: "rgba(255,255,255,.025)", borderRadius: "6px" }}>
        नोट: ये सभी entries केवल गणना/evidence हैं। Double Khar, 64वाँ नवांश, 22वाँ द्रेष्काण या विष नवांश से software स्वयं कोई अंतिम फलादेश/निर्णय नहीं देता।
      </div>

      {data.has_double_khar && (
        <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.rose}` }}>
          <div style={{ ...HI, fontSize: "0.72rem", color: "rgba(255,255,255,.5)", marginBottom: "3px" }}>
            Double Khar किन ग्रहों से बन रहा है?
          </div>
          <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.rose }}>
            {names(data.double_khar_planets)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ════════ TAB 9 — VIVAH & DIVORCE (V.P. GOEL SUTRAS) ════════
function VivahDivorceTab({ vivah_promise, divorce_separation }) {
  if (!vivah_promise || !divorce_separation)
    return <EmptyState icon="💍" message="विवाह-संबंधी डेटा उपलब्ध नहीं" />;

  const vp = vivah_promise;
  const ds = divorce_separation;
  const d1 = vp.d1 || ds.d1 || {};
  const d9 = vp.d9 || ds.d9 || {};

  const names = (arr) => Array.isArray(arr) && arr.length ? arr.join(", ") : "—";
  const yn = (v) => v ? "हाँ" : "नहीं";
  const field = (o, ...keys) => {
    for (const k of keys) if (o && o[k] != null) return o[k];
    return null;
  };

  const Mini = ({ label, value, tone = "normal" }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.3,
      color: tone === "bad" ? C.rose : tone === "good" ? C.cyan : "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value || "—"}
    </span>
  );

  const EntityRow = ({ title, data, lord = false }) => {
    if (!data) return null;
    const planet = data.planet_name || data.lagnesh_name || "—";
    const house = field(data, "house_no", "house");
    const trik = field(data, "in_trik_6_8_12", "in_trik");
    const yutiBad = field(data, "yuti_malefics");
    const yutiGood = field(data, "yuti_benefics");
    const drishtiBad = field(data, "malefic_drishti", "malefic_drishti_planets");
    const drishtiGood = field(data, "benefic_drishti", "benefic_drishti_planets");
    const retro = field(data, "is_retrograde", "is_vakri_retrograde");

    return (
      <div style={{
        display: "grid", gridTemplateColumns: "78px 1fr", gap: "8px",
        padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.055)"
      }}>
        <div style={{ ...HI, fontSize: "0.76rem", fontWeight: 700, color: C.cyan }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
          <Mini label={lord ? "ग्रह" : "स्थिति"} value={lord ? `${planet}${house ? ` · ${house} भाव` : ""}` : planet} />
          {lord && <Mini label="त्रिक" value={yn(Boolean(trik))} tone={trik ? "bad" : "normal"} />}
          {lord && <Mini label="युति पाप" value={names(yutiBad)} tone={yutiBad?.length ? "bad" : "normal"} />}
          {lord && <Mini label="युति शुभ" value={names(yutiGood)} tone={yutiGood?.length ? "good" : "normal"} />}
          <Mini label="दृष्टि पाप" value={names(drishtiBad)} tone={drishtiBad?.length ? "bad" : "normal"} />
          <Mini label="दृष्टि शुभ" value={names(drishtiGood)} tone={drishtiGood?.length ? "good" : "normal"} />
          {lord && <Mini label="वक्री" value={yn(Boolean(retro))} />}
        </div>
      </div>
    );
  };

  const HouseRow = ({ title, data, showPK = false }) => {
    if (!data) return null;
    const occ = data.planets_present || [];
    const bad = data.malefic_planets_present || [];
    const good = data.benefic_planets_present || [];
    const badDr = data.malefic_drishti || data.malefic_drishti_planets || [];
    const goodDr = data.benefic_drishti || data.benefic_drishti_planets || [];
    const pk = data.paap_kartari;
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "78px 1fr", gap: "8px",
        padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.055)"
      }}>
        <div style={{ ...HI, fontSize: "0.76rem", fontWeight: 700, color: C.amber }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>
          <Mini label="ग्रह" value={names(occ)} />
          <Mini label="पाप" value={names(bad)} tone={bad.length ? "bad" : "normal"} />
          <Mini label="शुभ" value={names(good)} tone={good.length ? "good" : "normal"} />
          <Mini label="पाप दृष्टि" value={names(badDr)} tone={badDr.length ? "bad" : "normal"} />
          <Mini label="शुभ दृष्टि" value={names(goodDr)} tone={goodDr.length ? "good" : "normal"} />
          {showPK && <Mini label="Paap Kartari" value={pk?.is_active ? `हाँ (${names(pk.previous_house_planets || pk.previous_planets)} | ${names(pk.next_house_planets || pk.next_planets)})` : "नहीं"} tone={pk?.is_active ? "bad" : "normal"} />}
        </div>
      </div>
    );
  };

  const ChartBlock = ({ chart, label }) => {
    if (!chart?.computed) return null;
    const lagna = chart.lagna || {};
    const lagnesh = chart.lagnesh || {};
    const seventh = chart.seventh_house || {};
    const seventhLord = chart.seventh_lord || {};
    const ninth = chart.ninth_house || {};
    const ninthLord = chart.house_lords?.["9"] || {};

    return (
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${label === "D1" ? C.cyan : C.amber}` }}>
        <div style={{ ...HI, fontSize: "0.9rem", fontWeight: 800, color: label === "D1" ? C.cyan : C.amber, marginBottom: "5px" }}>
          {label} <span style={{ color: "rgba(255,255,255,.5)", fontWeight: 500 }}>· लग्न {lagna.rashi_name || "—"}</span>
        </div>
        <EntityRow title="लग्न" data={{ planet_name: names(lagna.planets_present), benefic_drishti: lagna.benefic_drishti_planets, malefic_drishti: lagna.malefic_drishti_planets }} />
        {lagna.paap_kartari && <div style={{ ...HI, fontSize: "0.68rem", padding: "5px 0", color: lagna.paap_kartari.is_active ? C.rose : "rgba(255,255,255,.58)" }}>Paap Kartari: <b>{lagna.paap_kartari.is_active ? "हाँ" : "नहीं"}</b>{lagna.paap_kartari.is_active && ` · ${names(lagna.paap_kartari.previous_house_planets || lagna.paap_kartari.previous_planets)} | ${names(lagna.paap_kartari.next_house_planets || lagna.paap_kartari.next_planets)}`}</div>}
        <EntityRow title="लग्नेश" data={lagnesh} lord />
        <EntityRow title="सप्तमेश" data={seventhLord} lord />
        <EntityRow title="नवमेश" data={{ ...ninthLord, planet_name: ninthLord.planet_name }} lord />
        <HouseRow title="सप्तम भाव" data={seventh} showPK />
        <HouseRow title="नवम भाव" data={ninth} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px", paddingTop: "7px" }}>
          <Mini label="त्रिक 6" value={names(chart.sixth_house?.planets_present)} />
          <Mini label="त्रिक 8" value={names(chart.eighth_house?.planets_present)} />
          <Mini label="त्रिक 12" value={names(chart.twelfth_house?.planets_present)} />
        </div>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-3">
      <div style={{ ...HI, fontSize: "0.72rem", color: C.amber, padding: "7px 10px", background: "rgba(245,158,11,.07)", borderRadius: "7px" }}>
        केवल raw observations — ग्रह, भाव, युति, दृष्टि, त्रिक और Paap Kartari। कोई final prediction/synthesis नहीं।
      </div>
      <ChartBlock chart={d1} label="D1" />
      <ChartBlock chart={d9} label="D9" />
    </div>
  );
}

// ════════ TAB — D2 HORA ANALYSIS ═══════════════════════════
function HoraTab({ hora_analysis }) {
  const h = hora_analysis;

  // Local compact renderer for Hora rows.
  // Keep this inside HoraTab so tab switching never depends on
  // Mini being declared in another tab component.
  const Mini = ({ label, value }) => (
    <span style={{
      ...HI, fontSize: "0.68rem", lineHeight: 1.3,
      color: "rgba(255,255,255,.72)"
    }}>
      <b style={{ color: "rgba(255,255,255,.48)", fontWeight: 500 }}>{label}:</b> {value ?? "—"}
    </span>
  );
  if (!h?.computed) return <EmptyState icon="☀️" message="D2 होरा डेटा उपलब्ध नहीं" subtext="यह टैब केवल उपलब्ध D1/D2 raw data और configured Hora rules दिखाता है।" />;

  const planets = Array.isArray(h.rows) ? h.rows : [];
  const strength = Array.isArray(h.formula_2_hora_strength?.rows) ? h.formula_2_hora_strength.rows : [];
  const natureFlags = Array.isArray(h.formula_4_nature_speech?.flags) ? h.formula_4_nature_speech.flags : [];
  const houseData = Array.isArray(h.d2_house_reference?.rows) ? h.d2_house_reference.rows : [];
  const mansagariRules = Array.isArray(h.mansagari_textual_rules?.rules) ? h.mansagari_textual_rules.rules : [];
  const horaName = x => x?.hora_lord || x?.hora || x?.hora_lord_name || "—";
  const strengthName = x => x?.strength_label || x?.segment_label || x?.strength || "—";

  return (
    <div className="space-y-3">
      <GlassCard className="p-3" style={{ borderLeft: `3px solid ${C.amber}` }}>
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.9rem", color: C.amber }}>☀️ D2 होरा — Raw Analysis</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginTop: "4px", lineHeight: 1.5 }}>
          D1 राशि + डिग्री से Parashari D2 Hora, फिर Hora lord, strength और उपलब्ध textual flags।
          यह मॉड्यूल कोई अंतिम फलादेश या निर्णय नहीं देता।
        </div>
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>सूत्र 1 · बेसिक पराशरी होरा</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", padding: "6px 8px", background: "rgba(255,255,255,.03)", borderRadius: "6px", marginBottom: "8px" }}>
          विषम राशि: 0°–&lt;15° = सूर्य/सिंह, 15°–&lt;30° = चंद्र/कर्क ·
          सम राशि: 0°–&lt;15° = चंद्र/कर्क, 15°–&lt;30° = सूर्य/सिंह
        </div>
        {planets.length ? <div style={{ display: "grid", gap: "5px" }}>
          {planets.map((x, i) => (
            <div key={`${x.planet_code || x.code || "p"}-${i}`} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "6px", padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)" }}>
              <span style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.82)" }}><b>{x.planet_name || x.name || x.planet_code || "—"}</b></span>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,.55)" }}>D1 {x.rashi_name || "—"} · {x.degree ?? "—"}°</span>
              <span style={{ ...HI, fontSize: "0.68rem", color: x.parashari_hora?.hora_lord_code === "Su" ? C.amber : C.cyan }}>{horaName(x.parashari_hora)} · {x.parashari_hora?.hora_sign || "—"}</span>
            </div>
          ))}
        </div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>ग्रहवार D2 Hora data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>सूत्र 2 · होरा शक्ति</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.5)", marginBottom: "7px" }}>
          0°–5°, 5°–10°, 10°–15° तथा 15°–20°, 20°–25°, 25°–30° segments को raw strength category।
        </div>
        {strength.length ? <div className="space-y-1">{strength.map((x, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 7px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.75)" }}>{x.planet_name || "—"}</span>
            <span style={{ fontSize: "0.68rem", color: C.amber }}>{strengthName(x.strength)}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Hora strength data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>सूत्र 3 · लाभ मण्डूक / केरल होरा</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>
          Sun-contributed और Moon-contributed mapping को raw evidence के रूप में दिखाया जाएगा।
        </div>
        {planets.length ? <div style={{ display: "grid", gap: "5px" }}>{planets.map((x, i) => (
          <div key={`kerala-${i}`} style={{ padding: "6px 8px", borderRadius: "6px", background: "rgba(255,255,255,.035)" }}>
            <Mini label="ग्रह" value={x.planet_name || x.name || x.planet_code} />
            <Mini label="D1 राशि-स्वामी" value={x.rashi_lord || "—"} />
            <Mini label="Hora" value={horaName(x.parashari_hora)} />
            <Mini label="Mapped D2 राशि" value={x.kerala_hora?.mapped_rashi_name || "—"} />
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Kerala Hora mapping data उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>ग्रंथीय संदर्भ · मानसागरी Hora Rules</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>Source में दिए planetary Hora फल केवल textual reference के रूप में हैं। Software इन्हें किसी व्यक्ति पर automatic prediction नहीं लगाएगा।</div>
        {mansagariRules.length ? <div className="space-y-1">{mansagariRules.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2.6fr", gap: "7px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ ...HI, fontSize: "0.68rem", color: C.cyan }}>{x.planet || "—"}</span>
            <span style={{ ...HI, fontSize: "0.68rem", color: C.amber }}>{x.placement || "—"}</span>
            <span style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.62)" }}>{x.rule || "—"}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>Textual rules उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.amber, marginBottom: "7px" }}>सूत्र 4 · स्वभाव और वाणी Flags</div>
        <div style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.55)", marginBottom: "7px" }}>
          केवल rule-match / evidence flags। कोई निश्चित भविष्यवाणी या final decision नहीं।
        </div>
        {natureFlags.length ? <div className="space-y-1">{natureFlags.map((x, i) => (
          <div key={i} style={{ padding: "6px 8px", borderRadius: "6px", background: x.available === false ? "rgba(255,255,255,.025)" : "rgba(34,211,238,.06)" }}>
            <div style={{ ...HI, fontSize: "0.72rem", fontWeight: 700, color: x.available === false ? "rgba(255,255,255,.65)" : C.cyan }}>{x.label || x.rule || "Rule"}</div>
            {x.evidence && <div style={{ ...HI, fontSize: "0.66rem", color: "rgba(255,255,255,.5)", marginTop: "3px" }}>{x.evidence}</div>}
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>कोई configured nature/speech flag उपलब्ध नहीं।</div>}
      </GlassCard>

      <GlassCard className="p-3">
        <div style={{ ...HI, fontWeight: 800, fontSize: "0.8rem", color: C.cyan, marginBottom: "7px" }}>D2 के 12 भाव · धन के संदर्भ</div>
        {houseData.length ? <div className="space-y-1">{houseData.map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "45px 1fr", gap: "7px", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: C.amber }}>{x.house || i + 1}</span>
            <span style={{ ...HI, fontSize: "0.68rem", color: "rgba(255,255,255,.62)" }}>{x.topic || x.description || x.label || "—"}</span>
          </div>
        ))}</div> : <div style={{ ...HI, fontSize: "0.7rem", color: "rgba(255,255,255,.5)" }}>D2 house reference engine data आने पर दिखेगा।</div>}
      </GlassCard>

      <div style={{ ...HI, fontSize: "0.67rem", lineHeight: 1.5, color: "rgba(255,255,255,.38)", padding: "7px 9px", background: "rgba(255,255,255,.025)", borderRadius: "6px" }}>
        नोट: software केवल सूत्रों से निकले evidence/flags रखेगा। “100% धन लाभ”, “गरीब”, “विवाह निश्चित” जैसे final conclusions software स्वयं नहीं देगा। अंतिम व्याख्या व्यक्ति/ज्योतिषी करेगा।
      </div>
    </div>
  );
}

// ════════ MAIN COMPONENT ═════════════════════════════════
export default function AdvancedYogasPanel() {
  const data     = useAdvancedYogas();   // [Fix ⑦] prop hata, store se direct
  const [activeTab, setActiveTab] = useState("indu");

  // IMPORTANT: Phase-2 engines are asynchronous. Do NOT block the whole
  // panel while advanced_yogas is being calculated. The tab shell opens
  // immediately from the fast chart response; individual tabs render their
  // own small "data pending" state until enginesData arrives.
  const summary = data?.summary || {};
  const engineReady = Boolean(data?.computed);

  const pendingData = (
    <EmptyState
      icon="⚡"
      message={data?.error || "Advanced Yogas डेटा तैयार हो रहा है..."}
      subtext="D1 chart तुरंत उपलब्ध है; Phase 2 केवल analysis data भर रहा है।"
    />
  );

  const renderTab = () => {
    if (!engineReady) return pendingData;
    switch (activeTab) {
      case "classic":
        return <ClassicYogasTab />;
      case "indu":
        return <InduTab
          indu_lagna={data.indu_lagna}
          spouse_direction={data.spouse_direction}
        />;
      case "khar":
        return <Khar64NavamsaTab
          khar_64th_navamsa={data.khar_64th_navamsa}
        />;
      case "hora":
        return <HoraTab hora_analysis={data.hora_analysis} />;
      case "jaimini":
        return <JaiminiNavamshaTab />;

      default:       return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 style={{ ...HI, fontWeight: 700, fontSize: "1rem", color: C.amber, margin: 0 }}>
            ⚡ उन्नत योग विश्लेषण
          </h3>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            मुख्य योग · Indu Lagna · 64वाँ नवांश / खर · D2 Hora
          </p>
        </div>
        <div className="space-y-1">
          {summary?.crorepati_yoga && <StatusPill label="💎 करोड़पति योग" color="cyan" size="xs" />}
          {summary?.debt_trap      && <StatusPill label="⚠️ कर्ज जाल"     color="rose" size="xs" />}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem",
            cursor: "pointer", border: "none",
            background: activeTab === tab.id ? C.amber : "rgba(255,255,255,0.07)",
            color: activeTab === tab.id ? "#000" : "rgba(255,255,255,0.7)",
            fontWeight: activeTab === tab.id ? 700 : 400, ...HI,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}