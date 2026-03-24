// AdvancedAVPanel.jsx — v4 COMPLETE
// Fixed: color->col bug | Rahu/Ketu/Labhesh full 12 houses | Diptanshu complete | Health complete
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PLANET_META } from "../../constants";

const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C = {
  amber:"#F59E0B",cyan:"#22D3EE",rose:"#FB7185",green:"#4ADE80",
  purple:"#C084FC",indigo:"#818CF8",orange:"#FB923C",teal:"#2DD4BF",
  red:"#EF4444",yellow:"#FCD34D",pink:"#F472B6",blue:"#60A5FA",
};
const PH = {Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
const ORB = {Su:15,Mo:12,Ma:8,Me:7,Ju:9,Ve:7,Sa:9,Ra:9,Ke:8};

// ── Atoms ──────────────────────────────────────────────────────
function Card({children,color=C.amber,className=""}) {
  return <div className={`p-4 rounded-2xl border mb-3 ${className}`}
    style={{background:"rgba(8,12,28,.97)",borderColor:`${color}30`}}>{children}</div>;
}
function Tag({children,color=C.amber}) {
  return <span className="inline-block text-[12px] font-bold px-3 py-1 rounded-xl m-0.5"
    style={{background:`${color}18`,color,border:`1px solid ${color}35`,...HI}}>{children}</span>;
}
function SLabel({children,color=C.amber}) {
  return <div className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{color}}>
    <span className="flex-1 h-px" style={{background:`${color}30`}}/>
    <span style={HI}>{children}</span>
    <span className="flex-1 h-px" style={{background:`${color}30`}}/>
  </div>;
}
function Bar({value=0,max=100,color=C.amber}) {
  const safeVal=isNaN(value)||value==null?0:Number(value);
  const pct=Math.min(100,Math.max(0,(safeVal/max)*100));
  return <div className="flex items-center gap-2 mt-1.5">
    <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
      <motion.div className="h-full rounded-full" style={{background:color,boxShadow:`0 0 8px ${color}50`}}
        initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.9,ease:"easeOut"}}/>
    </div>
    <span className="text-[12px] font-black w-10 text-right" style={{color}}>{value}</span>
  </div>;
}
function Section({icon,title,color=C.amber,children,defaultOpen=false}) {
  const [open,setOpen]=useState(defaultOpen);
  return <div className="mb-3">
    <button onClick={()=>setOpen(o=>!o)}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
      style={{background:`${color}12`,border:`1.5px solid ${color}30`}}>
      <span className="text-[20px] flex-shrink-0">{icon}</span>
      <span className="text-[14px] font-black flex-1 text-left" style={{color,...HI}}>{title}</span>
      {open?<ChevronUp size={16} style={{color}}/>:<ChevronDown size={16} style={{color}}/>}
    </button>
    <AnimatePresence>
      {open&&<motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
        exit={{height:0,opacity:0}} transition={{duration:.22}}
        className="overflow-hidden pt-2 px-1">{children}</motion.div>}
    </AnimatePresence>
  </div>;
}

// ═══════════════════════════════════════════════════════════
// ASHTAKVARGA — 13 MODULES
// ═══════════════════════════════════════════════════════════
function AVBlock({raw,planets}) {
  const d=raw?.analysis||raw||{};
  if(!d||Object.keys(d).length<2) return <Card color={C.amber}><div className="text-slate-500 text-center py-6" style={HI}>डेटा लोड हो रहा है...</div></Card>;
  const lp=d.life_prosperity||{},sm=d.struggle_meter||{},sd=d.spouse_dominance||{};
  const ct=d.career_type||{},ld=d.lucky_direction||{},aa=d.age_analysis||{};
  const bs=d.business_success||{},jo=d.jupiter_override||{},kb=d.karma_bhagya||{};
  const rl=d.reverse_logic_houses||{},dest=d["8th_house_destruction"]||[];
  const prosScore=lp.total_score??lp.total??0;
  const isProsp=lp.is_prosperous??(prosScore>=164);
  return <>
    {/* M1 Life Prosperity */}
    <Card color={isProsp?C.cyan:C.orange}>
      <SLabel color={isProsp?C.cyan:C.orange}>MODULE 1 — जीवन समृद्धि सूचकांक</SLabel>
      <div className="flex items-center justify-between mb-2">
        <div><div className="text-[13px] text-slate-300" style={HI}>कुल AV बिंदु</div>
          <div className="text-[11px] text-slate-500" style={HI}>थ्रेशहोल्ड: 164 | {isProsp?"✅ समृद्ध":"⚠️ संघर्ष"}</div></div>
        <div className="text-[44px] font-black" style={{color:isProsp?C.cyan:C.orange}}>{prosScore}</div>
      </div>
      <Bar value={prosScore} max={330} color={isProsp?C.cyan:C.orange}/>
      <div className="mt-2 p-3 rounded-xl text-[13px]"
        style={{background:isProsp?"rgba(34,211,238,.08)":"rgba(251,146,60,.08)",color:isProsp?C.cyan:C.orange,...HI}}>
        {lp.prediction_hindi||(isProsp?"जीवन सुखमय और संपन्न रहेगा":"जीवन में संघर्ष के योग हैं")}
      </div>
    </Card>

    {/* M2+M4 */}
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Card color={sm.has_extreme_struggle?C.red:C.green} className="mb-0">
        <SLabel color={sm.has_extreme_struggle?C.red:C.green}>M2 — संघर्ष</SLabel>
        <div className="text-[16px] font-black" style={{color:sm.has_extreme_struggle?C.red:C.green,...HI}}>
          {sm.has_extreme_struggle?"उच्च संघर्ष ⚠️":"सामान्य ✅"}
        </div>
        <div className="text-[12px] text-slate-400 mt-1" style={HI}>{sm.prediction_hindi||"सामान्य जीवन संघर्ष"}</div>
        <div className="mt-2 p-2 rounded-lg" style={{background:"rgba(255,255,255,.04)"}}>
          <div className="text-[10px] text-slate-500 mb-0.5" style={HI}>💡 लॉजिक:</div>
          <div className="text-[10px] text-slate-400" style={HI}>6वें+8वें+12वें भाव के सर्वाष्टक अंक जितने कम = जीवन में उतना अधिक संघर्ष। {sm.has_extreme_struggle?"⚠️ इस कुंडली में त्रिक भाव प्रबल हैं।":"✅ त्रिक भाव सामान्य हैं।"}</div>
        </div>
      </Card>
      <Card color={C.indigo} className="mb-0">
        <SLabel color={C.indigo}>M4 — करियर</SLabel>
        <div className="text-[15px] font-black text-white" style={HI}>{ct.recommended_type||"—"}</div>
        <div className="text-[11px] text-slate-400 mt-1" style={HI}>{ct.description_hindi||""}</div>
        <div className="mt-2 p-2 rounded-lg" style={{background:"rgba(129,140,248,.06)"}}>
          <div className="text-[10px] text-slate-500 mb-0.5" style={HI}>💡 लॉजिक:</div>
          <div className="text-[10px] text-slate-400" style={HI}>10वें (करियर) + 6वें (नौकरी) + 7वें (व्यापार) भाव के अंकों की तुलना से करियर प्रकार तय होता है।</div>
        </div>
      </Card>
    </div>

    {/* M3 Spouse */}
    {sd.dominant_person&&<Card color={C.pink}>
      <SLabel color={C.pink}>MODULE 3 — जीवनसाथी प्रभाव 💑</SLabel>
      <div className="text-[18px] font-black mb-1" style={{color:C.pink,...HI}}>{sd.dominant_person}</div>
      <div className="text-[13px] text-slate-300" style={HI}>{sd.description_hindi||""}</div>
      {sd.house_1_points!=null&&sd.house_7_points!=null&&
        <div className="flex gap-4 mt-2">
          <div className="text-center"><div className="text-[22px] font-black" style={{color:C.cyan}}>{sd.house_1_points}</div><div className="text-[11px] text-slate-500" style={HI}>1वां (जातक)</div></div>
          <div className="text-[20px] text-slate-600 self-center">vs</div>
          <div className="text-center"><div className="text-[22px] font-black" style={{color:C.rose}}>{sd.house_7_points}</div><div className="text-[11px] text-slate-500" style={HI}>7वां (साथी)</div></div>
        </div>}
    </Card>}

    {/* M5 8th destruction */}
    {dest?.length>0&&<Card color={C.rose}>
      <SLabel color={C.rose}>MODULE 5 — 8वें भाव का विनाश ⚠️</SLabel>
      {dest.map((item,i)=><div key={i} className="p-3 rounded-xl mb-2"
        style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
        <div className="text-[13px] font-black text-rose-300" style={HI}>{item.warning_hindi||`${item.strong_house}वां भाव — ${item.relation||""} को कष्ट`}</div>
        {item.points&&<div className="text-[11px] text-rose-500 mt-0.5" style={HI}>{item.points} अंक</div>}
      </div>)}
    </Card>}

    {/* M6 Direction */}
    {ld.ranked_directions?.length>0&&<Card color={C.indigo}>
      <SLabel color={C.indigo}>MODULE 6 — शुभ दिशाएं 🧭</SLabel>
      <div className="grid grid-cols-4 gap-1.5">
        {ld.ranked_directions.map((dir,i)=><div key={i} className="text-center p-2.5 rounded-xl"
          style={{background:i===0?`${C.indigo}20`:"rgba(255,255,255,.04)",border:`1px solid ${i===0?C.indigo:"rgba(255,255,255,.08)"}40`}}>
          <div className="text-[18px] font-black" style={{color:i===0?C.indigo:"#475569"}}>{dir.rank}</div>
          <div className="text-[12px] font-bold" style={{color:i===0?"#fff":"#475569",...HI}}>{dir.direction}</div>
          <div className="text-[11px]" style={{color:i===0?C.indigo:"#334155"}}>{dir.points}</div>
        </div>)}
      </div>
    </Card>}

    {/* M7 Age */}
    {(aa.sorrow_ages?.length>0||aa.happiness_ages?.length>0)&&<Card color={C.orange}>
      <SLabel color={C.orange}>MODULE 7 — सुख-दुख की आयु ⏰</SLabel>
      <div className="p-2 rounded-lg mb-3" style={{background:"rgba(251,146,60,.06)",border:"1px solid rgba(251,146,60,.15)"}}>
        <div className="text-[10px] text-orange-400 font-bold mb-0.5" style={HI}>💡 लॉजिक:</div>
        <div className="text-[10px] text-slate-400" style={HI}>सर्वाष्टकवर्ग में जिस भाव में ग्रह बैठा हो, उस भाव के अंक × 7 ÷ 27 = जीवन का टर्निंग वर्ष। शुभ ग्रह = सुख, पाप ग्रह = कष्ट।</div>
      </div>
      {aa.happiness_ages?.length>0&&<div className="mb-3">
        <div className="text-[12px] font-bold mb-2" style={{color:C.green,...HI}}>✅ सुख की आयु:</div>
        <div className="flex flex-wrap gap-2">
          {aa.happiness_ages.map((a,i)=><div key={i} className="text-center px-3 py-2 rounded-xl"
            style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.25)"}}>
            <div className="text-[24px] font-black" style={{color:C.green}}>{a.age}</div>
            <div className="text-[11px] text-green-400" style={HI}>{a.planet_hindi||a.planet}</div>
          </div>)}
        </div>
      </div>}
      {aa.sorrow_ages?.length>0&&<div>
        <div className="text-[12px] font-bold mb-2" style={{color:C.rose,...HI}}>⚠️ कष्ट की आयु:</div>
        <div className="flex flex-wrap gap-2">
          {aa.sorrow_ages.map((a,i)=><div key={i} className="text-center px-3 py-2 rounded-xl"
            style={{background:"rgba(251,113,133,.1)",border:"1px solid rgba(251,113,133,.25)"}}>
            <div className="text-[24px] font-black" style={{color:C.rose}}>{a.age}</div>
            <div className="text-[11px] text-rose-400" style={HI}>{a.planet_hindi||a.planet}</div>
          </div>)}
        </div>
      </div>}
    </Card>}

    {/* M8 Business */}
    {bs.will_become_businessman!=null&&<Card color={bs.will_become_businessman?C.green:C.rose}>
      <SLabel color={bs.will_become_businessman?C.green:C.rose}>MODULE 8 — व्यापार सफलता</SLabel>
      <div className="text-[18px] font-black mb-1" style={{color:bs.will_become_businessman?C.green:C.rose,...HI}}>
        {bs.will_become_businessman?"✅ व्यापार में सफलता":"❌ व्यापार कठिन"}
      </div>
      <div className="text-[13px] text-slate-300" style={HI}>{bs.prediction_hindi||""}</div>
      <div className="mt-2 p-2 rounded-lg" style={{background:"rgba(255,255,255,.04)"}}>
        <div className="text-[10px] text-slate-500 mb-0.5" style={HI}>💡 लॉजिक:</div>
        <div className="text-[10px] text-slate-400" style={HI}>7वें (व्यापार/साझेदारी) + 10वें (करियर/कर्म) + 11वें (लाभ) भाव के सर्वाष्टक अंकों का योग। 7वां ≥ 28 अंक = व्यापार सफल। {bs.house_7_points!=null?`इस कुंडली में 7वें के ${bs.house_7_points} अंक।`:""}</div>
      </div>
      {/* सप्तम भाव विशेष */}
      {(()=>{
        const pl_data=planets||{};
        const planetsIn7=Object.entries(pl_data).filter(([c,p])=>p?.house===7);
        const malIn7=planetsIn7.filter(([c])=>["Sa","Ma","Ra","Ke","Su"].includes(c));
        const benIn7=planetsIn7.filter(([c])=>["Ju","Ve","Mo","Me"].includes(c));
        const PNAME={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
        const ve=pl_data.Ve;
        const veDig=ve?.dignityHindi||ve?.dignity||"";
        const veGood=/उच्च|स्वराशि|मित्र|Uchcha|Swa|Mitra/i.test(veDig);
        const veBad=/नीच|शत्रु|Neecha|Shatru/i.test(veDig);
        const manglik=pl_data.Ma&&[1,4,7,8,12].includes(pl_data.Ma.house);
        const spouseNatures={1:"आत्मनिर्भर, प्रभावशाली",2:"धनी परिवार, वाकपटु",3:"साहसी, यात्राप्रिय",4:"घरेलू, माँ से प्रभावित",5:"रचनात्मक, प्रेमी",6:"मेहनती, सेवाभाव",7:"सुंदर, संतुलित",8:"रहस्यमय, गहरा",9:"धार्मिक, भाग्यशाली",10:"महत्वाकांक्षी, करियरिस्ट",11:"सामाजिक, लाभकारी",12:"आध्यात्मिक, विदेशी संभव"};
        return <div className="mt-3 p-3 rounded-xl" style={{background:"rgba(244,114,182,.06)",border:"1px solid rgba(244,114,182,.2)"}}>
          <div className="text-[12px] font-black text-pink-400 mb-2" style={HI}>💍 सप्तम भाव — विवाह + साझेदार</div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div className="p-2 rounded-lg" style={{background:"rgba(255,255,255,.04)"}}>
              <div className="text-[10px] text-slate-500" style={HI}>7वें में ग्रह</div>
              <div className="text-[12px] font-bold text-white" style={HI}>{planetsIn7.length>0?planetsIn7.map(([c])=>PNAME[c]||c).join(", "):"कोई नहीं"}</div>
            </div>
            <div className="p-2 rounded-lg" style={{background:veBad?"rgba(251,113,133,.08)":veGood?"rgba(74,222,128,.08)":"rgba(255,255,255,.04)"}}>
              <div className="text-[10px] text-slate-500" style={HI}>शुक्र अवस्था</div>
              <div className="text-[12px] font-bold" style={{color:veBad?C.rose:veGood?C.green:C.amber,...HI}}>{veDig||"—"} {ve?`(${ve.house}वें)`:""}</div>
            </div>
            <div className="p-2 rounded-lg" style={{background:manglik?"rgba(251,113,133,.08)":"rgba(74,222,128,.08)"}}>
              <div className="text-[10px] text-slate-500" style={HI}>मांगलिक दोष</div>
              <div className="text-[12px] font-bold" style={{color:manglik?C.rose:C.green,...HI}}>{manglik?`⚠️ हाँ (${pl_data.Ma.house}वें)`:"✅ नहीं"}</div>
            </div>
            <div className="p-2 rounded-lg" style={{background:malIn7.length>=2?"rgba(251,113,133,.08)":benIn7.length>=1?"rgba(74,222,128,.08)":"rgba(255,255,255,.04)"}}>
              <div className="text-[10px] text-slate-500" style={HI}>विवाह स्थिति</div>
              <div className="text-[12px] font-bold" style={{color:malIn7.length>=2?C.rose:benIn7.length>=1?C.green:C.amber,...HI}}>{malIn7.length>=2?"⚠️ विलंब संभव":benIn7.length>=1?"✅ शुभ योग":"सामान्य"}</div>
            </div>
          </div>
          {ve&&spouseNatures[ve.house]&&<div className="p-2 rounded-lg" style={{background:"rgba(244,114,182,.08)"}}>
            <div className="text-[10px] text-pink-400 mb-0.5" style={HI}>💕 जीवनसाथी स्वभाव (शुक्र {ve.house}वें):</div>
            <div className="text-[12px] text-white font-bold" style={HI}>{spouseNatures[ve.house]}</div>
          </div>}
        </div>;
      })()}
    </Card>}

    {/* M10 Reverse */}
    {Object.keys(rl).length>0&&<Card color={C.teal}>
      <SLabel color={C.teal}>MODULE 10 — उल्टे भाव 🔄</SLabel>
      {[["house_6","6वां","🏥",C.green,"निरोगी"],["house_8","8वां","🔮",C.orange,"दरिद्रता नहीं"],["house_12","12वां","💸",C.purple,"बचत"]].map(([k,lbl,ic,hc,hint])=>
        rl[k]?<div key={k} className="p-3 rounded-xl mb-2"
          style={{background:`${hc}0C`,border:`1px solid ${hc}25`}}>
          <div className="flex items-center gap-2 mb-1">
            <span>{ic}</span>
            <span className="text-[13px] font-black" style={{color:hc,...HI}}>{lbl} — {rl[k].verdict||""} ({rl[k].points} अंक)</span>
          </div>
          <div className="text-[13px] text-slate-200" style={HI}>{rl[k].prediction_hindi||hint}</div>
          <Bar value={rl[k].points||0} max={45} color={hc}/>
        </div>:null
      )}
    </Card>}

    {/* M11 Karma */}
    {(kb.dominant||kb.prediction_hindi)&&<Card color={C.purple}>
      <SLabel color={C.purple}>MODULE 11 — कर्म बनाम भाग्य ⚖️</SLabel>
      <div className="text-[20px] font-black mb-2" style={{color:C.purple,...HI}}>{kb.dominant||"—"}</div>
      {kb.house_9_points!=null&&kb.house_10_points!=null&&
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-3 rounded-xl" style={{background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.25)"}}>
            <div className="text-[30px] font-black" style={{color:C.purple}}>{kb.house_9_points}</div>
            <div className="text-[12px] text-purple-400" style={HI}>9वां (भाग्य)</div>
            <Bar value={kb.house_9_points} max={45} color={C.purple}/>
          </div>
          <div className="text-center p-3 rounded-xl" style={{background:"rgba(129,140,248,.1)",border:"1px solid rgba(129,140,248,.25)"}}>
            <div className="text-[30px] font-black" style={{color:C.indigo}}>{kb.house_10_points}</div>
            <div className="text-[12px] text-indigo-400" style={HI}>10वां (कर्म)</div>
            <Bar value={kb.house_10_points} max={45} color={C.indigo}/>
          </div>
        </div>}
      <div className="text-[13px] text-slate-300 p-3 rounded-xl bg-white/4" style={HI}>{kb.prediction_hindi||""}</div>
    </Card>}

    {/* M13 Jupiter Override */}
    {jo.note!=null&&<Card color={jo.dosha_cancelled?C.cyan:"#475569"}>
      <div className="flex items-center gap-3">
        <span className="text-[24px]">🪐</span>
        <div>
          <div className="text-[14px] font-black" style={{color:jo.dosha_cancelled?C.cyan:"#64748b",...HI}}>
            गुरु दोष निवारण: {jo.dosha_cancelled?"✅ सक्रिय":"❌ नहीं"}
          </div>
          <div className="text-[12px] text-slate-400" style={HI}>{jo.note}</div>
        </div>
      </div>
    </Card>}
  </>;
}

// ═══════════════════════════════════════════════════════════
// NAVATARA
// ═══════════════════════════════════════════════════════════
function NavataraBlock({raw}) {
  const nav=raw?.navatara_chakra||{},arth=raw?.arth_trikona||{};
  const taras=nav.taras||{},proh=nav.prohibited_items||{},gems=nav.gemstone_recommendations||{};
  if(!nav||Object.keys(nav).length===0) return <Card color={C.orange}><div className="text-slate-500 text-center py-6" style={HI}>नवतारा डेटा नहीं</div></Card>;
  const TDEFS=[
    {key:"birth_nakshatra",label:"जन्म नक्षत्र",color:C.cyan,icon:"⭐"},
    {key:"sampat_tara",label:"संपत् तारा",color:C.green,icon:"💰"},
    {key:"vipat_tara",label:"विपत् तारा",color:C.red,icon:"⚠️"},
    {key:"kshema_tara",label:"क्षेम तारा",color:C.teal,icon:"🛡️"},
    {key:"pratyari_tara",label:"प्रत्यारी तारा",color:C.rose,icon:"🔥"},
    {key:"sadhana_tara",label:"साधन तारा",color:C.indigo,icon:"✨"},
    {key:"vadha_tara",label:"वध तारा",color:"#DC2626",icon:"💀"},
    {key:"mitra_tara",label:"मित्र तारा",color:C.amber,icon:"🤝"},
    {key:"param_mitra_tara",label:"परम मित्र तारा",color:C.green,icon:"💚"},
  ];
  return <>
    {taras.birth_nakshatra&&<Card color={C.cyan}>
      <div className="text-center py-1">
        <div className="text-[24px] font-black" style={{color:C.cyan,...HI}}>{taras.birth_nakshatra.name_hindi||taras.birth_nakshatra.name}</div>
        <div className="text-[13px] text-slate-400 mt-1" style={HI}>#{taras.birth_nakshatra.number} — {taras.birth_nakshatra.name_english}</div>
      </div>
    </Card>}
    <Card color={C.orange}>
      <SLabel color={C.orange}>नवतारा चक्र</SLabel>
      {TDEFS.map(t=>{const val=taras[t.key];if(!val)return null;return(
        <div key={t.key} className="flex items-start gap-3 p-3 rounded-xl mb-2"
          style={{background:`${t.color}10`,border:`1px solid ${t.color}25`}}>
          <span className="text-[18px] flex-shrink-0">{t.icon}</span>
          <div className="flex-1">
            <div className="text-[13px] font-black" style={{color:t.color,...HI}}>{t.label}</div>
            <div className="text-[12px] text-slate-200 mt-0.5" style={HI}>
              {Array.isArray(val.nakshatra_names)?val.nakshatra_names.join(", "):(val.name_hindi||val.name||"")}
            </div>
            {val.effect&&<div className="text-[11px] text-slate-500 mt-0.5" style={HI}>{val.effect}</div>}
          </div>
        </div>
      );})}
    </Card>
    {(gems.highly_beneficial?.length>0||gems.avoid?.length>0)&&<Card color={C.cyan}>
      <SLabel color={C.cyan}>💎 रत्न अनुशंसा</SLabel>
      {gems.highly_beneficial?.length>0&&<div className="mb-3">
        <div className="text-[12px] font-bold mb-2" style={{color:C.green,...HI}}>✅ पहनें:</div>
        {gems.highly_beneficial.map((g,i)=><div key={i} className="flex items-center gap-2 p-2.5 rounded-xl mb-1.5"
          style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <span className="text-[18px]">💎</span>
          <div><div className="text-[13px] font-black text-white" style={HI}>{g.gemstone_hindi} ({g.gemstone_english})</div>
            <div className="text-[11px] text-slate-400" style={HI}>{g.reason}</div></div>
        </div>)}
      </div>}
      {gems.avoid?.length>0&&<div>
        <div className="text-[12px] font-bold mb-2" style={{color:C.rose,...HI}}>❌ वर्जित:</div>
        {gems.avoid.map((g,i)=><div key={i} className="flex items-center gap-2 p-2 rounded-xl mb-1.5"
          style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <span>🚫</span><div className="text-[13px] text-rose-300" style={HI}>{g.gemstone_hindi}</div>
        </div>)}
      </div>}
    </Card>}
    {Object.keys(proh).length>0&&<Card color={C.rose}>
      <SLabel color={C.rose}>🚫 वर्जित / शुभ</SLabel>
      <div className="grid grid-cols-2 gap-3">
        {proh.prohibited_colors?.length>0&&<div><div className="text-[11px] font-bold text-rose-400 mb-1" style={HI}>❌ रंग</div><div className="flex flex-wrap gap-1">{proh.prohibited_colors.map((c,i)=><Tag key={i} color={C.rose}>{c}</Tag>)}</div></div>}
        {proh.lucky_colors?.length>0&&<div><div className="text-[11px] font-bold text-green-400 mb-1" style={HI}>✅ रंग</div><div className="flex flex-wrap gap-1">{proh.lucky_colors.map((c,i)=><Tag key={i} color={C.green}>{c}</Tag>)}</div></div>}
        {proh.prohibited_days?.length>0&&<div><div className="text-[11px] font-bold text-rose-400 mb-1" style={HI}>❌ दिन</div><div className="flex flex-wrap gap-1">{proh.prohibited_days.map((d,i)=><Tag key={i} color={C.rose}>{d}</Tag>)}</div></div>}
        {proh.lucky_days?.length>0&&<div><div className="text-[11px] font-bold text-green-400 mb-1" style={HI}>✅ दिन</div><div className="flex flex-wrap gap-1">{proh.lucky_days.map((d,i)=><Tag key={i} color={C.green}>{d}</Tag>)}</div></div>}
      </div>
    </Card>}
  </>;
}

// ═══════════════════════════════════════════════════════════
// HEALTH + TRIKONA
// ═══════════════════════════════════════════════════════════
function HealthTrikonaBlock({vedicData,planets}) {
  const d=vedicData||{};
  const hh=d.health_happiness||{},ln=d.lagnesh_nature||{},as_=d.age_of_success||{},ta=d.trikona_analysis||{};
  const pl=planets||{};
  const PNAME={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};

  const getPlanetsIn=(houses)=>Object.entries(pl).filter(([c,p])=>p&&houses.includes(p.house)).map(([c,p])=>{
    const dig=p.dignityHindi||p.dignity||"";
    const isGood=/उच्च|Uchcha|स्वराशि|Swa|मित्र|Mitra|योगकारक/i.test(dig);
    const isBad=/नीच|Neecha|शत्रु|Shatru/i.test(dig);
    return {code:c,name:PNAME[c]||c,house:p.house,dig,isGood,isBad};
  });
  const trikonaScore=(houses)=>{
    const ps=getPlanetsIn(houses);
    if(!ps.length)return{score:50,label:"🟡 तटस्थ",planets:[]};
    const good=ps.filter(p=>p.isGood).length, bad=ps.filter(p=>p.isBad).length;
    const score=Math.min(100,Math.max(0,50+(good*15)-(bad*15)));
    return{score,label:score>=70?"🟢 मजबूत":score>=45?"🟡 सामान्य":"🔴 कमजोर",planets:ps};
  };

  const TK=[
    {k:"dharma",h:[1,5,9],color:C.cyan,icon:"🕉️",title:"धर्म त्रिकोण",
     good:"धार्मिक कार्य, सेवा, परोपकार, शिक्षा",bad:"केवल पैसे के पीछे = मानसिक तनाव",
     logic:"1वाँ=आत्मा+व्यक्तित्व, 5वाँ=पूर्वजन्म पुण्य+संतान, 9वाँ=भाग्य+धर्म+पिता"},
    {k:"artha", h:[2,6,10],color:C.green,icon:"💰",title:"अर्थ त्रिकोण",
     good:"पैसे से पैसा बनाएं, निवेश, नौकरी",bad:"व्यर्थ खर्च = धन नाश",
     logic:"2वाँ=संचित धन+परिवार, 6वाँ=मेहनत+सेवा+शत्रु, 10वाँ=कर्म+करियर+यश"},
    {k:"kama",  h:[3,7,11],color:C.rose,icon:"❤️",title:"काम त्रिकोण",
     good:"नेटवर्क, मैनपॉवर, साझेदारी, प्रेम",bad:"अति इच्छाएं = दुख",
     logic:"3वाँ=प्रयास+साहस, 7वाँ=साझेदार+विवाह, 11वाँ=फल+लाभ+मित्र"},
    {k:"moksha",h:[4,8,12],color:C.purple,icon:"🌌",title:"मोक्ष त्रिकोण",
     good:"निस्वार्थ कार्य, आध्यात्म, साधना",bad:"भौतिक लक्ष्य बनाना = चिड़चिड़ापन",
     logic:"4वाँ=सुख+माँ+घर, 8वाँ=गुप्त+आयु+परिवर्तन, 12वाँ=मोक्ष+विदेश+व्यय"},
  ];
  // Medical Astrology from planets
  const MEDICAL=[];
  if(planets) {
    const Sa=planets.Sa,Ju=planets.Ju,Ve=planets.Ve,Ma=planets.Ma,Mo=planets.Mo,Ra=planets.Ra,Su=planets.Su,Me=planets.Me;
    const inBadH=p=>[6,8,12].includes(p?.house);
    const debil=p=>/नीच/.test(p?.Dignity||"");
    if(Sa&&[1,7].includes(Sa.house)&&planets.Su){MEDICAL.push({s:"👁️ चश्मे का योग",c:C.orange,r:"शनि मेष/तुला में या सूर्य पर दृष्टि"});}
    if(Me&&(inBadH(Me)||/मीन/.test(Me.rashi||""))){MEDICAL.push({s:"🦷 त्वचा/चर्म रोग संभव",c:C.yellow,r:"बुध 6/8/12 या मीन में"});}
    if(Ju&&debil(Ju)){MEDICAL.push({s:"🩸 शुगर/डायबिटीज योग",c:C.rose,r:"गुरु नीच (मकर) — मधुमेह का संकेत"});}
    if(Ma&&debil(Ma)){MEDICAL.push({s:"💪 मांसपेशी/जोड़ों का दर्द",c:C.orange,r:"मंगल नीच (कर्क) — शारीरिक कष्ट"});}
    if(Mo&&Ra&&Mo.house===Ra.house){MEDICAL.push({s:"🧠 मानसिक अस्थिरता",c:C.red,r:"चंद्र+राहु युति — मानसिक भ्रम"});}
    if(Su&&inBadH(Su)){MEDICAL.push({s:"❤️ हृदय रोग सावधानी",c:C.rose,r:"सूर्य 6/8/12 में — हृदय पर दबाव"});}
    if(Ve&&debil(Ve)){MEDICAL.push({s:"🫘 किडनी/मधुमेह",c:C.pink,r:"शुक्र नीच (कन्या) — किडनी कमजोर"});}
  }
  return <>
    {/* Health Yoga */}
    {(hh.lifelong_health||hh.wealth_without_health)&&<Card color={C.green}>
      <SLabel color={C.green}>🏥 आजीवन स्वास्थ्य योग</SLabel>
      {hh.lifelong_health&&<div className="p-3 rounded-xl mb-2" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
        <div className="text-[12px] font-bold text-green-400 mb-1" style={HI}>✅ स्वास्थ्य:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{typeof hh.lifelong_health==="object"?hh.lifelong_health.result||"":hh.lifelong_health}</div>
      </div>}
      {hh.wealth_without_health&&<div className="p-3 rounded-xl" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
        <div className="text-[12px] font-bold text-amber-400 mb-1" style={HI}>⚠️ धन पर ध्यान:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{typeof hh.wealth_without_health==="object"?hh.wealth_without_health.result||"":hh.wealth_without_health}</div>
      </div>}
    </Card>}
    {/* Medical Astrology */}
    {MEDICAL.length>0&&<Card color={C.red}>
      <SLabel color={C.red}>🏥 मेडिकल ज्योतिष — ग्रह आधारित</SLabel>
      {MEDICAL.map((m,i)=><div key={i} className="p-3 rounded-xl mb-2"
        style={{background:`${m.c}08`,border:`1px solid ${m.c}25`}}>
        <div className="text-[13px] font-black" style={{color:m.c,...HI}}>{m.s}</div>
        <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>🪐 कारण: {m.r}</div>
      </div>)}
    </Card>}
    {/* Lagnesh */}
    {(ln.comfort_vs_work||ln.workplace_betrayal)&&<Card color={C.amber}>
      <SLabel color={C.amber}>👤 लग्नेश स्वभाव</SLabel>
      {ln.comfort_vs_work&&<div className="p-3 rounded-xl mb-2" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
        <div className="text-[12px] font-bold text-amber-400 mb-1" style={HI}>🏠 सुख vs कार्यशीलता:</div>
        <div className="text-[14px] font-black text-white" style={HI}>{ln.comfort_vs_work.type||ln.comfort_vs_work}</div>
      </div>}
      {ln.workplace_betrayal&&<div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
        <div className="text-[12px] font-bold text-rose-400 mb-1" style={HI}>🗡️ कार्यस्थल विश्वासघात:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{ln.workplace_betrayal.risk||ln.workplace_betrayal}</div>
      </div>}
    </Card>}
    {/* Age of Success */}
    {(as_.success_age||as_.age)&&<Card color={C.cyan}>
      <div className="text-center py-2">
        <div className="text-[12px] text-cyan-400/70 mb-2" style={HI}>🌟 सफलता की उम्र</div>
        <div className="text-[56px] font-black leading-none" style={{color:C.cyan}}>{as_.success_age||as_.age}</div>
        <div className="text-[14px] text-cyan-400/60 mt-1" style={HI}>वर्ष से</div>
        {as_.description&&<div className="text-[12px] text-slate-400 mt-2 px-4" style={HI}>{as_.description}</div>}
      </div>
    </Card>}
    {/* 4 Trikonas — upgraded */}
    <Card color={C.purple}>
      <SLabel color={C.purple}>△ चतुर्विध त्रिकोण — जीवन दिशा</SLabel>
      {ta.dominant_trikona&&<div className="p-3 rounded-xl mb-3" style={{background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.25)"}}>
        <div className="text-[14px] font-black text-white mb-1" style={HI}>🏆 प्रमुख त्रिकोण: {ta.dominant_trikona}</div>
        {ta.clash&&<div className="text-[12px] text-rose-400 mt-1" style={HI}>⚠️ {ta.clash}</div>}
      </div>}
      {TK.map(t=>{
        const analysis=trikonaScore(t.h);
        const scoreCol=analysis.score>=70?C.green:analysis.score>=45?C.amber:C.rose;
        return <div key={t.k} className="p-3 rounded-xl mb-2" style={{background:`${t.color}08`,border:`1px solid ${t.color}25`}}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{t.icon}</span>
              <span className="text-[13px] font-black" style={{color:t.color,...HI}}>{t.title}</span>
              <span className="text-[10px] text-slate-500" style={HI}>भाव {t.h.join("-")}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{background:`${scoreCol}20`,color:scoreCol}}>{analysis.label}</span>
          </div>
          {/* Logic */}
          <div className="text-[10px] text-slate-500 mb-1.5 px-1" style={HI}>💡 {t.logic}</div>
          {/* Planets in this trikona */}
          {analysis.planets.length>0&&<div className="flex flex-wrap gap-1 mb-1.5">
            {analysis.planets.map((p,i)=><span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{
              background:p.isGood?"rgba(74,222,128,.15)":p.isBad?"rgba(251,113,133,.15)":"rgba(255,255,255,.06)",
              color:p.isGood?C.green:p.isBad?C.rose:C.amber,
              border:`1px solid ${p.isGood?"rgba(74,222,128,.3)":p.isBad?"rgba(251,113,133,.3)":"rgba(255,255,255,.1)"}`
            }}>{p.name} {p.house}वें {p.isGood?"✅":p.isBad?"⚠️":""}</span>)}
          </div>}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg" style={{background:"rgba(74,222,128,.08)"}}>
              <div className="text-[10px] text-green-400 font-bold mb-0.5" style={HI}>✅ अनुकूल:</div>
              <div className="text-[11px] text-slate-200" style={HI}>{t.good}</div>
            </div>
            <div className="p-2 rounded-lg" style={{background:"rgba(251,113,133,.08)"}}>
              <div className="text-[10px] text-rose-400 font-bold mb-0.5" style={HI}>⚠️ टालें:</div>
              <div className="text-[11px] text-slate-200" style={HI}>{t.bad}</div>
            </div>
          </div>
        </div>;
      })}
      <div className="p-3 rounded-xl mt-2" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
        <div className="text-[12px] font-bold text-amber-400 mb-2" style={HI}>💼 करियर फोकस:</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-[12px] font-black text-green-400" style={HI}>अर्थ &gt; काम</div>
            <div className="text-[11px] text-slate-300" style={HI}>कम मेहनत, ज्यादा धन</div>
            <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>9/10वें में बलवान ग्रह = भाग्य से धन</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10">
            <div className="text-[12px] font-black text-rose-400" style={HI}>काम &gt; अर्थ</div>
            <div className="text-[11px] text-slate-300" style={HI}>ज्यादा मेहनत, कम धन</div>
            <div className="text-[10px] text-slate-500 mt-0.5" style={HI}>6वें में बलवान ग्रह = श्रम से धन</div>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="text-[11px] text-red-400 font-bold mb-0.5" style={HI}>🔴 अर्थ + मोक्ष = विरोधाभास!</div>
          <div className="text-[10px] text-slate-400" style={HI}>पैसा कमाना + त्याग एक साथ नहीं होता। यह द्वंद्व = मानसिक तनाव। एक ही मार्ग चुनें।</div>
        </div>
      </div>
    </Card>
  </>;
}

// ═══════════════════════════════════════════════════════════
// COMPLETE RAHU — ALL 12 HOUSES
// ═══════════════════════════════════════════════════════════
const RD={
  1:{n:"चतुर, रहस्यमई, स्वार्थी",career:"नौकरी से सफलता (विशेषतः 1-6 के सरकारी काम)",danger:[5],health:"सिर दर्द, माथे पर चोट, मानसिक तनाव",good:"✅ तीव्र बुद्धि, दूरदर्शिता, प्रभावशाली व्यक्तित्व",bad:"स्वार्थी प्रवृत्ति, दूसरों पर भरोसा नहीं",warn:"अहंकार से बचें, स्वार्थ को नियंत्रित करें",reason:"राहु लग्न में — पिछले जन्म की चालाकी इस जन्म में रहस्यमयता बनकर आती है",nat:"mixed"},
  2:{n:"वाणी का जादूगर, पर झूठ का शौक",career:"बातों/वाणी से धन — मीडिया, बिक्री, राजनीति",danger:[12,24],health:"दांत, आंख (दाईं), गले के रोग, नशे की आदत",good:"प्रभावशाली वाणी, विदेशी भाषा में प्रवीण",bad:"झूठ बोलना, परिवार में कलह, पिता के धन का नाश",warn:"⚠️ झूठ से सख्त बचें — पकड़े जाने पर सर्वनाश",reason:"राहु 2रे में — वाणी और संपत्ति दोनों पर अनिश्चितता, परिवार से दूरी",nat:"bad"},
  3:{n:"साहसी, पराक्रमी, उद्यमी",career:"✅ मीडिया, प्रकाशन, विज्ञापन, यात्रा व्यवसाय",danger:[21],health:"कान, नाक, श्वास नली, हाथ-कंधे",good:"✅✅ उत्तम — धन, यश, सम्मान, पराक्रम",bad:"भाई से थोड़ा कष्ट, बुध के साथ हो तो डरपोक",warn:"बुध+राहु यहां = साहस में कमी — सावधान",reason:"राहु 3रे में — पराक्रम से आगे बढ़ते हैं, सबसे शुभ स्थानों में से एक",nat:"good"},
  4:{n:"यात्राओं का शौकीन, घर-परिवार से दूरी",career:"विदेश/दूर स्थान में काम, रियल एस्टेट",danger:[8,16],health:"माता को चर्म रोग, छाती की समस्या, गृह अशांति",good:"बड़ा मकान, आध्यात्मिक जागृति, विदेश में स्थिरता",bad:"परिवार में प्रेम की कमी, माता को कष्ट",warn:"माता की सेवा करें — यह आपका कर्ज है",reason:"राहु 4थे में — मातृ सुख पर प्रश्नचिह्न, घर बनता है पर सुकून नहीं मिलता",nat:"bad"},
  5:{n:"राजनैतिक बुद्धि, तीव्र प्रतिभा, चालाकी",career:"राजनीति, सट्टा, सरकारी काम, तंत्र विद्या",danger:[5,19],health:"गैस, पेट, पाचन तंत्र, मानसिक बेचैनी",good:"✅ तंत्र सिद्धि, पूर्वजन्म ज्ञान, बुद्धि प्रखर",bad:"संतान देरी/कठिनाई, सट्टे में नुकसान",warn:"⚠️ सरकारी अधिकारियों से झगड़ा नहीं — शत्रु बनेंगे",reason:"राहु 5वें में — बुद्धि जीनियस स्तर की पर जिद्दी, संतान देर से",nat:"mixed"},
  6:{n:"✅ शत्रु नाशक! विजयी योद्धा",career:"✅✅ सेना, पुलिस, सरकारी नौकरी, मेडिकल",danger:[21,37],health:"कमर दर्द, पेट के रोग (लेकिन जल्दी ठीक होते हैं)",good:"✅✅ अति उत्तम — शत्रु खुद पस्त होते हैं, कर्ज नहीं चढ़ता",bad:"21-37 वर्ष में सावधानी जरूरी",special:"⭐ मंगल+राहु यहां = लक्ष्मी योग! शत्रु से ही धन",warn:"यही एकमात्र स्थान जहां राहु सबसे शुभ है",reason:"राहु 6वें में — दुश्मन और रोग दोनों राहु खा जाता है, सर्वश्रेष्ठ",nat:"good"},
  7:{n:"जीवनसाथी से मिसअंडरस्टैंडिंग",career:"विदेशी व्यापार में लाभ, लेकिन साझेदारी में धोखा",danger:[37],health:"किडनी, प्रजनन अंग, यौन रोग",good:"विदेश में व्यापार सफल, अंतर्राष्ट्रीय संबंध",bad:"दांपत्य तनाव, जीवनसाथी विचित्र स्वभाव का",warn:"⚠️ विधवा/विधुर से प्रेम-संबंध का खतरा — सावधान",reason:"राहु 7वें में — जीवनसाथी में रहस्यमयता, रिश्तों में भ्रम और भटकाव",nat:"bad"},
  8:{n:"गूढ़ शक्तियां, रहस्यवादी, तांत्रिक",career:"तंत्र, ज्योतिष, गुप्त विद्या, रिसर्च",danger:[25,32],health:"गुप्त रोग, बवासीर, सांप के सपने आना",good:"तंत्र सिद्धि, लंबी आयु, छुपी दौलत",bad:"झूठे आरोप, दुर्घटना का भय, अचानक विपदाएं",warn:"⚠️ काली विद्या से दूर रहें — वापस आती है",reason:"राहु 8वें में — अचानक उठाना और गिराना, पर छुपी संपत्ति भी देता है",nat:"bad"},
  9:{n:"धर्म में अरुचि, भाग्य कमजोर",career:"विदेश में भाग्य खिलता है, अपरंपरागत मार्ग",danger:[19,29],health:"कूल्हे, जांघ, लिवर, पित्त की समस्या",good:"विदेश में सफलता, 29 वर्ष बाद भाग्य खुलता है",bad:"पिता को कष्ट, धर्म-कर्म में रुचि नहीं",warn:"पारंपरिक रास्ते छोड़ें — नई राहें ज्यादा फलदायी",reason:"राहु 9वें में — भाग्य देर से आता है पर आता जरूर है, परंपरा से परहेज",nat:"bad"},
  10:{n:"महत्वाकांक्षी, धनवान, विद्वान",career:"✅ शासन, प्रशासन, राजनीति, तकनीक",danger:[54],health:"गैस, पेट दर्द, हथियार/चोट का भय",good:"✅ धनवान, विद्वान, समाज में सम्मान",bad:"54 वर्ष में नौकरी जाने का खतरा",warn:"⚠️ पैसे की चोरी/फ्रॉड से 54 वर्ष के आसपास बचें",reason:"राहु 10वें में — आकस्मिक उन्नति, शास्त्रों का ज्ञाता बनते हैं",nat:"good"},
  11:{n:"✅✅ सर्वश्रेष्ठ स्थान! धन, सम्मान",career:"✅✅ हर क्षेत्र में सफलता — बड़े सपने पूरे होते हैं",danger:[45],health:"पैर/टखने की समस्या (45 वर्ष के आसपास)",good:"✅✅ अति उत्तम — धन की वर्षा, बड़े नेटवर्क, उच्च मित्र",bad:"बड़े भाई को कभी-कभी कष्ट संभव",warn:"45 वर्ष में स्वास्थ्य का ध्यान रखें",reason:"राहु 11वें में — सबसे शुभ स्थान, धन और सम्मान दोनों, नेटवर्क से सफलता",nat:"good"},
  12:{n:"कपटी स्वभाव, जन्मस्थान से दूरी",career:"विदेश में सफलता, आध्यात्म, रहस्यमय पेशे",danger:[36,48],health:"पैर के तलवे, नींद की समस्या, अनजाने खर्चे",good:"✅ विदेश यात्रा/प्रवास के योग, आध्यात्मिक मोक्ष",bad:"जन्मस्थान छुड़वाता है, खर्चे बेहिसाब",warn:"विदेश जाने का मौका मिले तो अवश्य जाएं",reason:"राहु 12वें में — विदेश/परदेस में भाग्य, गुप्त शत्रु सावधान",nat:"mixed"},
};

function CompleteRahuBlock({chartPlanets}) {
  const rahuH=chartPlanets?.Ra?.house||null;
  const [sel,setSel]=useState(rahuH||1);
  const re=RD[sel];if(!re)return null;
  const isG=re.nat==="good",isB=re.nat==="bad";
  const accentC=isG?C.green:isB?C.rose:C.amber;
  // Pishach yoga
  const moonL=chartPlanets?.Mo?.house===1;
  const mal59=chartPlanets?Object.entries(chartPlanets).some(([c,p])=>[5,9].includes(p.house)&&["Sa","Ma"].includes(c)):false;
  const pishach=moonL&&mal59;
  // Rahu rajyoga
  const inKT=rahuH&&[1,2,4,5,7,9,10,11].includes(rahuH);
  const withBen=chartPlanets?Object.entries(chartPlanets).some(([c,p])=>["Me","Ve","Sa"].includes(c)&&p.house===rahuH):false;
  const rajyoga=inKT&&withBen;
  return <Card color={C.indigo}>
    <SLabel color={C.indigo}>🐍 राहु रहस्य — सभी 12 भाव</SLabel>
    {rahuH&&<div className="text-[13px] mb-3 px-3 py-2 rounded-xl"
      style={{background:"rgba(129,140,248,.1)",color:C.indigo,border:"1px solid rgba(129,140,248,.25)",...HI}}>
      🪐 इस कुंडली में राहु <strong>{rahuH}वें</strong> भाव में है
    </div>}
    <div className="grid grid-cols-6 gap-1.5 mb-4">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
        const isR=h===rahuH,isS=h===sel;
        const hd=RD[h];
        return <button key={h} onClick={()=>setSel(h)}
          className="py-2.5 rounded-xl text-[14px] font-black transition-all"
          style={{background:isS?`${C.indigo}25`:isR?"rgba(129,140,248,.1)":"rgba(255,255,255,.04)",
            color:isS?C.indigo:isR?C.indigo:"#475569",
            border:isS?`2px solid ${C.indigo}60`:isR?`1px solid ${C.indigo}30`:"1px solid rgba(255,255,255,.08)"}}>
          {h}{isR&&<div className="text-[7px] font-normal leading-none mt-0.5">राहु</div>}
          <div className="text-[7px] leading-none mt-0.5" style={{color:hd?.nat==="good"?C.green:hd?.nat==="bad"?C.rose:C.amber}}>
            {hd?.nat==="good"?"✅":hd?.nat==="bad"?"⚠️":"〜"}
          </div>
        </button>;
      })}
    </div>
    <motion.div key={sel} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <div className="text-[15px] font-black px-3 py-2.5 rounded-xl mb-3"
        style={{background:`${accentC}12`,border:`1px solid ${accentC}30`,...HI}}>
        राहु {sel}वें भाव में — {re.n}
      </div>
      <div className="p-3 rounded-xl mb-2" style={{background:"rgba(129,140,248,.08)",border:"1px solid rgba(129,140,248,.2)"}}>
        <div className="text-[12px] font-bold text-indigo-400 mb-1" style={HI}>🪐 ज्योतिष कारण:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{re.reason}</div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {re.career&&<div className="p-3 rounded-xl" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
          <div className="text-[12px] font-bold text-amber-400 mb-1" style={HI}>💼 करियर:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{re.career}</div>
        </div>}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
            <div className="text-[12px] font-bold text-green-400 mb-1" style={HI}>✅ शुभ:</div>
            <div className="text-[12px] text-slate-200" style={HI}>{re.good}</div>
          </div>
          <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
            <div className="text-[12px] font-bold text-rose-400 mb-1" style={HI}>⚠️ अशुभ:</div>
            <div className="text-[12px] text-slate-200" style={HI}>{re.bad}</div>
          </div>
        </div>
        {re.health&&<div className="p-3 rounded-xl" style={{background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)"}}>
          <div className="text-[12px] font-bold text-orange-400 mb-1" style={HI}>🏥 स्वास्थ्य:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{re.health}</div>
        </div>}
        {re.danger?.length>0&&<div className="p-3 rounded-xl" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}}>
          <div className="text-[12px] font-bold text-red-400 mb-2" style={HI}>⚠️ खतरे की आयु:</div>
          <div className="flex gap-2 flex-wrap">
            {re.danger.map((a,i)=><span key={i} className="text-[18px] font-black px-4 py-2 rounded-xl"
              style={{background:"rgba(239,68,68,.15)",color:C.red,border:"1px solid rgba(239,68,68,.3)"}}>{a} वर्ष</span>)}
          </div>
        </div>}
        {re.warn&&<div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[12px] font-bold text-rose-300" style={HI}>💡 सलाह: {re.warn}</div>
        </div>}
        {re.special&&<div className="p-3 rounded-xl" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
          <div className="text-[13px] text-amber-300 font-bold" style={HI}>⭐ {re.special}</div>
        </div>}
      </div>
    </motion.div>
    {pishach&&<div className="mt-4 p-4 rounded-xl" style={{background:"rgba(239,68,68,.12)",border:"2px solid rgba(239,68,68,.4)"}}>
      <div className="text-[14px] font-black text-red-400 mb-2" style={HI}>🔴 पिशाच योग चेतावनी!</div>
      <div className="text-[13px] text-slate-200" style={HI}>राहु+चंद्र लग्न में + 5/9 भाव में पाप ग्रह = भूत-प्रेत बाधा। मानसिक अस्थिरता। काली विद्या से दूर रहें।</div>
    </div>}
    {rajyoga&&<div className="mt-3 p-4 rounded-xl" style={{background:"rgba(34,211,238,.1)",border:"2px solid rgba(34,211,238,.3)"}}>
      <div className="text-[14px] font-black text-cyan-400 mb-2" style={HI}>✨ राहु राजयोग!</div>
      <div className="text-[13px] text-slate-200" style={HI}>राहु केंद्र/त्रिकोण में + बुध/शुक्र/शनि = फर्श से अर्श की यात्रा</div>
    </div>}
  </Card>;
}

// ═══════════════════════════════════════════════════════════
// KETU — ALL 12 HOUSES
// ═══════════════════════════════════════════════════════════
const KD={
  1:{t:"आत्मज्ञान, वैराग्य, पिछला जन्म",g:"✅ आध्यात्मिक उन्नति, तीव्र अंतर्ज्ञान, तंत्र-मंत्र में प्रवीण",b:"शरीर दुर्बल, आत्मविश्वास में कमी, शरीर में चोट के निशान",h:"सिर दर्द, आंखों की समस्या, बुखार",r:"केतु लग्न में — पिछले जन्म की शक्तियां इस जन्म में आती हैं, पर भटकाव भी"},
  2:{t:"वाणी असामान्य, गूढ़ ज्ञान की तलाश",g:"रहस्यमय ज्ञान, तंत्र में रुचि, भाषाओं की समझ",b:"कटु वचन, परिवार से अलगाव, धन अनिश्चित",h:"दांत, आंख (दाईं), गला, आवाज में समस्या",r:"केतु 2रे में — वाणी अनोखी, आध्यात्मिक संपदा पर भौतिक धन अनिश्चित"},
  3:{t:"साहस में विचित्रता, अकेला चलने वाला",g:"पराक्रम, तंत्र-मंत्र सिद्धि, लेखन प्रतिभा",b:"भाई से कष्ट, यात्रा में अचानक परिवर्तन",h:"कान, नाक, श्वास नली, हाथ-कंधे",r:"केतु 3रे में — साहस अनियमित, भाई से संबंध जटिल, पर लेखन में प्रतिभा"},
  4:{t:"माता-गृह से अलगाव, मन की अशांति",g:"आध्यात्मिक जागृति, ध्यान-साधना में आनंद",b:"गृह सुख बाधित, माता को कष्ट, मन हमेशा बेचैन",h:"छाती, फेफड़े, हृदय के आसपास",r:"केतु 4थे में — घर में रहकर भी मन घर में नहीं, ध्यान से शांति"},
  5:{t:"संतान बाधा, तीव्र बुद्धि, पूर्वजन्म ज्ञान",g:"✅ पूर्वजन्म ज्ञान, तंत्र सिद्धि, तीव्र बुद्धि",b:"संतान में देरी, सट्टे में हानि, जिद्द",h:"पेट, पाचन तंत्र, गैस",r:"केतु 5वें में — पिछले जन्म का ज्ञान प्रबल, पर संतान में देरी होती है"},
  6:{t:"✅ शत्रु नाशक — अति शुभ!",g:"✅✅ शत्रुओं और रोगों पर पूर्ण विजय, कर्ज नहीं चढ़ता",b:"नाना-मामा को कभी-कभी कष्ट",h:"पेट में कभी-कभी (पर जल्दी ठीक)",r:"केतु 6वें में — शत्रु, रोग, कर्ज तीनों पर विजय — शुभ स्थान"},
  7:{t:"विवाह में देरी/बाधा, साथी उदासीन",g:"व्यापार में कभी-कभी लाभ, आध्यात्मिक साथी",b:"जीवनसाथी को कष्ट, दांपत्य में तनाव",h:"किडनी, प्रजनन अंग",r:"केतु 7वें में — जीवनसाथी आध्यात्मिक या उदासीन, रिश्ते में गहराई कम"},
  8:{t:"गूढ़ शक्तियां, दीर्घायु योग",g:"तंत्र सिद्धि, लंबी आयु, मृत्यु का भय कम",b:"दुर्घटना का भय, अचानक हानि, गुप्त शत्रु",h:"गुप्त रोग, बवासीर, मलाशय",r:"केतु 8वें में — मृत्यु भय नहीं पर जीवन में कई आकस्मिक उतार-चढ़ाव"},
  9:{t:"धर्म में अरुचि, भाग्य अनिश्चित",g:"पूर्वजन्म संस्कार प्रबल, गहन आध्यात्म",b:"पिता को कष्ट, भाग्य बाधित, परंपरा से दूरी",h:"कूल्हे, जांघ, लिवर",r:"केतु 9वें में — परंपरागत धर्म से दूरी पर गहन आध्यात्मिक जागरण"},
  10:{t:"करियर में बदलाव, आध्यात्मिक पेशा",g:"✅ सरकारी/आध्यात्मिक/अनुसंधान कार्य",b:"नौकरी अचानक जाना, परंपरागत करियर से मोह नहीं",h:"घुटने, हड्डियां, जोड़",r:"केतु 10वें में — नई राहें खोजते हैं, रिसर्च और आध्यात्म में सफल"},
  11:{t:"आय अनिश्चित पर बड़ी उपलब्धि",g:"✅ अप्रत्याशित बड़े लाभ, इच्छापूर्ति",b:"बड़े भाई को कष्ट, आय अनियमित",h:"पैर, टखना, पिंडली",r:"केतु 11वें में — अचानक बड़ा मिलता है पर स्थिरता कम"},
  12:{t:"✅ मोक्ष योग! विदेश में सफलता",g:"✅✅ आध्यात्मिक मोक्ष, विदेश में बसने के योग",b:"खर्चे अधिक, नींद की समस्या, एकांत की तलाश",h:"पैर के तलवे, आंखें (बाईं)",r:"केतु 12वें में — सर्वश्रेष्ठ मोक्ष स्थान, विदेश में बसना शुभ"},
};

function KetuBlock({chartPlanets}) {
  const rahuH=chartPlanets?.Ra?.house||null;
  const ketuH=rahuH?((rahuH+5)%12||12):null;
  const [sel,setSel]=useState(ketuH||1);
  const ke=KD[sel];
  return <Card color={C.teal}>
    <SLabel color={C.teal}>🪐 केतु — सभी 12 भाव</SLabel>
    {ketuH&&<div className="text-[13px] mb-3 px-3 py-2 rounded-xl"
      style={{background:"rgba(45,212,191,.1)",color:C.teal,border:"1px solid rgba(45,212,191,.25)",...HI}}>
      🪐 इस कुंडली में केतु <strong>{ketuH}वें</strong> भाव में है
    </div>}
    <div className="grid grid-cols-6 gap-1.5 mb-4">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
        const isK=h===ketuH,isS=h===sel;
        return <button key={h} onClick={()=>setSel(h)}
          className="py-2.5 rounded-xl text-[14px] font-black transition-all"
          style={{background:isS?`${C.teal}25`:isK?"rgba(45,212,191,.1)":"rgba(255,255,255,.04)",
            color:isS?C.teal:isK?C.teal:"#475569",
            border:isS?`2px solid ${C.teal}60`:isK?`1px solid ${C.teal}30`:"1px solid rgba(255,255,255,.08)"}}>
          {h}{isK&&<div className="text-[7px] font-normal leading-none mt-0.5">केतु</div>}
        </button>;
      })}
    </div>
    {ke&&<motion.div key={sel} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <div className="text-[15px] font-black px-3 py-2.5 rounded-xl mb-3"
        style={{background:`${C.teal}12`,border:`1px solid ${C.teal}30`,...HI}}>
        {sel}वें भाव में केतु — {ke.t}
      </div>
      <div className="p-3 rounded-xl mb-2" style={{background:"rgba(45,212,191,.08)",border:"1px solid rgba(45,212,191,.2)"}}>
        <div className="text-[12px] font-bold text-teal-400 mb-1" style={HI}>🪐 कारण:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{ke.r}</div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[12px] font-bold text-green-400 mb-1" style={HI}>✅ शुभ फल:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{ke.g}</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[12px] font-bold text-rose-400 mb-1" style={HI}>⚠️ अशुभ फल:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{ke.b}</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)"}}>
          <div className="text-[12px] font-bold text-orange-400 mb-1" style={HI}>🏥 स्वास्थ्य:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{ke.h}</div>
        </div>
      </div>
    </motion.div>}
  </Card>;
}

// ═══════════════════════════════════════════════════════════
// LABHESH — ALL 12 HOUSES
// ═══════════════════════════════════════════════════════════
const LH={
  1:{t:"स्वयं की शक्ति से परिवार अमीर",g:"लग्नेश ही लाभेश — व्यक्तित्व और ब्रांडिंग से धन",b:"खुद पर जरूरत से ज्यादा खर्च",advice:"धर्म त्रिकोण: अपने नाम/व्यक्तित्व से कमाएं",r:"लग्न में लाभेश — स्वयं की मेहनत सबसे बड़ा हथियार"},
  2:{t:"वाणी से धन, परिवार से लाभ",g:"वाणी का शुद्ध और प्रभावशाली उपयोग — बोलने वाले काम",b:"परिवार की वजह से खर्चे बढ़ सकते हैं",advice:"अर्थ त्रिकोण: परिवार के साथ मिलकर धन बढ़ाएं",r:"2रे में लाभेश — बोलने और संवाद के व्यवसाय से लाभ"},
  3:{t:"धीरे-धीरे पूर्ति, पराक्रम से",g:"लेखन, मीडिया, यात्रा से धन — छोटे प्रयास बड़े फल",b:"शुरुआत में संघर्ष, देर से मिलेगा",advice:"काम त्रिकोण: भाई-बंधुओं की मदद लें, मैनपॉवर रखें",r:"3रे में लाभेश — लेखन, मीडिया, यात्रा से धन लेकिन धैर्य चाहिए"},
  4:{t:"ड्रीम हाउस मिलेगा पर माता को कष्ट",g:"भूमि/संपत्ति से लाभ, बड़ा मकान",b:"माता के स्वास्थ्य पर ध्यान रखें (11th from 4th = 8th)",advice:"मोक्ष त्रिकोण: माता की सेवा = आपका सुख",r:"4थे में लाभेश — संपत्ति से लाभ पर माता की सेवा जरूरी"},
  5:{t:"✅✅ बुद्धि से अति लाभ",g:"बेहद शुभ — संतान से भी लाभ, शेयर/स्पेकुलेशन में सफलता",b:"ज्यादा जोखिम न लें",advice:"धर्म त्रिकोण: शिक्षा/ज्ञान में निवेश करें — यही आपकी पूंजी",r:"5वें में लाभेश — सर्वश्रेष्ठ स्थानों में — बुद्धि और बच्चे दोनों से लाभ"},
  6:{t:"⚠️ कर्ज का जाल — षडाष्टक",g:"नौकरी से आय होगी",b:"आय होगी पर हाथ में नहीं रहेगी — एक कर्ज के लिए दूसरा लेना",advice:"सख्त चेतावनी: लोन से दूर रहें! बचत पर जोर दें",warn:"⚠️ षडाष्टक — कमाई से ज्यादा खर्च का खतरा हमेशा",r:"6वें में लाभेश (षडाष्टक) — आय होगी पर खर्चे भी उतने ही, बचत मुश्किल"},
  7:{t:"व्यापार/साझेदारी से लाभ",g:"जीवनसाथी से धन, विवाह से आर्थिक स्थिति सुधरेगी",b:"विवाह में नखरे, साझेदारी में धोखे का भय",advice:"काम त्रिकोण: जीवनसाथी के साथ मिलकर व्यापार करें",r:"7वें में लाभेश — विवाह और साझेदारी से उन्नति"},
  8:{t:"गुप्त/अचानक लाभ, विरासत",g:"विरासत/उत्तराधिकार से अचानक लाभ, गुप्त धन",b:"अस्थिर — अचानक आता और जाता है",advice:"मोक्ष त्रिकोण: दीर्घकालिक निवेश करें, FD/जमीन",r:"8वें में लाभेश — अचानक/गुप्त तरीके से धन मिलेगा, पर टिकेगा नहीं"},
  9:{t:"भाग्य साथ देता है, दान से बढ़ेगा",g:"✅ भाग्यशाली, पिता/गुरु से लाभ, धार्मिक काम से धन",b:"दान न करे तो भाग्य रुक जाता है",advice:"धर्म त्रिकोण: तीर्थ, गुरु सेवा, दान से धन और यश",r:"9वें में लाभेश — भाग्यशाली, पर पिता की सेवा और दान जरूरी"},
  10:{t:"करियर से जबरदस्त आय",g:"✅ नौकरी/करियर से उच्च आय, पद-प्रतिष्ठा",b:"आराम कम, काम ज्यादा — अति महत्वाकांक्षी",advice:"अर्थ त्रिकोण: पद-प्रतिष्ठा ही आपकी आय का स्रोत है",r:"10वें में लाभेश — करियर से जबरदस्त आय, पर आराम कम"},
  11:{t:"✅✅ स्वराशि — अति उत्तम!",g:"✅✅ सर्वश्रेष्ठ — इच्छाएं खुद ब खुद पूरी होती हैं",b:"कभी-कभी ज्यादा उम्मीद रखना नुकसानदेह",advice:"हर रास्ता खुला है — बस इरादा साफ रखें",r:"11वें में लाभेश (स्वराशि) — सर्वश्रेष्ठ, धन की वर्षा"},
  12:{t:"विदेश से लाभ, निस्वार्थ दान",g:"विदेश में जाने पर धन, आध्यात्म से लाभ",b:"स्वदेश में कम लाभ, खर्चे ज्यादा",advice:"मोक्ष त्रिकोण: दान-पुण्य से ही लाभ, विदेश जाएं",r:"12वें में लाभेश — विदेश/आध्यात्म से धन, स्वदेश में कमजोर"},
};
const DIG={combust:"✅ पर: छोटी-छोटी चीजों के लिए झिकझिक, मांगने पर मिलेगा",debilitated:"⚠️ गलत तरीकों से चीजें पाना, सही रास्ता बाद में",enemy_sign:"हक से कम मिलेगा — मेहनत अनुपात में आय कम",exalted:"✅✅ इच्छाएं आसानी से पूरी — बिना मांगे भी",own_sign:"✅✅ स्वयं की शक्ति से पूरी इच्छापूर्ति"};

function LabheshBlock({chartPlanets,chartData}) {
  const l11=chartData?.houseLords?.[11]||chartData?.house_lords?.[11]||null;
  const lH=l11&&chartPlanets?.[l11]?.house||null;
  const [sel,setSel]=useState(lH||5);
  const ld=LH[sel];if(!ld)return null;
  const lPData=l11?chartPlanets?.[l11]:null;
  const dig=lPData?.Dignity||lPData?.dignity||"";
  const dk=/उच्च/.test(dig)?"exalted":/नीच/.test(dig)?"debilitated":/स्वराशि/.test(dig)?"own_sign":/अस्त/.test(dig)?"combust":/शत्रु/.test(dig)?"enemy_sign":null;
  const TK=[
    {n:"धर्म (1-5-9)",c:C.cyan,i:"🕉️",d:"धर्म/शिक्षा/भाग्य से इच्छापूर्ति"},
    {n:"अर्थ (2-6-10)",c:C.green,i:"💰",d:"करियर/व्यापार — पैसे से पैसा"},
    {n:"काम (3-7-11)",c:C.rose,i:"❤️",d:"नेटवर्क, साझेदारी, मैनपॉवर"},
    {n:"मोक्ष (4-8-12)",c:C.purple,i:"🌌",d:"दान, दीर्घ निवेश, विदेश"},
  ];
  return <Card color={C.yellow}>
    <SLabel color={C.yellow}>💛 लाभेश — इच्छापूर्ति का रहस्य</SLabel>
    {l11&&lH&&<div className="p-3 rounded-xl mb-3" style={{background:"rgba(252,211,77,.1)",border:"1px solid rgba(252,211,77,.25)"}}>
      <div className="text-[13px] font-black text-yellow-300" style={HI}>🪐 लाभेश = {PH[l11]||l11} — {lH}वें भाव में</div>
      {dk&&<div className="text-[12px] mt-1 text-yellow-200" style={HI}>{DIG[dk]||""}</div>}
    </div>}
    <div className="text-[12px] text-slate-500 mb-2" style={HI}>भाव चुनें:</div>
    <div className="grid grid-cols-6 gap-1.5 mb-4">
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
        const isL=h===lH,isS=h===sel;
        return <button key={h} onClick={()=>setSel(h)}
          className="py-2.5 rounded-xl text-[14px] font-black transition-all"
          style={{background:isS?`${C.yellow}25`:isL?"rgba(252,211,77,.1)":"rgba(255,255,255,.04)",
            color:isS?C.yellow:isL?C.yellow:"#475569",
            border:isS?`2px solid ${C.yellow}60`:isL?`1px solid ${C.yellow}30`:"1px solid rgba(255,255,255,.08)"}}>
          {h}{isL&&<div className="text-[7px] font-normal leading-none mt-0.5">लाभेश</div>}
        </button>;
      })}
    </div>
    <motion.div key={sel} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <div className="text-[15px] font-black px-3 py-2.5 rounded-xl mb-3"
        style={{background:`${C.yellow}10`,border:`1px solid ${C.yellow}30`,...HI}}>
        {sel}वें में लाभेश — {ld.t}
      </div>
      <div className="p-3 rounded-xl mb-2" style={{background:"rgba(252,211,77,.06)",border:"1px solid rgba(252,211,77,.2)"}}>
        <div className="text-[12px] font-bold text-yellow-400 mb-1" style={HI}>🪐 कारण:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{ld.r}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[12px] font-bold text-green-400 mb-1" style={HI}>✅ शुभ:</div>
          <div className="text-[12px] text-slate-200" style={HI}>{ld.g}</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[12px] font-bold text-rose-400 mb-1" style={HI}>⚠️ ध्यान:</div>
          <div className="text-[12px] text-slate-200" style={HI}>{ld.b}</div>
        </div>
      </div>
      {ld.warn&&<div className="p-3 rounded-xl mb-2" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)"}}>
        <div className="text-[12px] font-bold text-red-300" style={HI}>{ld.warn}</div>
      </div>}
      {ld.advice&&<div className="p-3 rounded-xl mb-3" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
        <div className="text-[12px] font-bold text-amber-400 mb-1" style={HI}>💡 सलाह:</div>
        <div className="text-[13px] text-slate-200" style={HI}>{ld.advice}</div>
      </div>}
    </motion.div>
    <div className="mt-1">
      <div className="text-[12px] font-bold text-yellow-400 mb-2" style={HI}>△ त्रिकोण अनुसार इच्छापूर्ति:</div>
      {TK.map((t,i)=><div key={i} className="flex items-start gap-2 p-2.5 rounded-xl mb-1.5"
        style={{background:`${t.c}08`,border:`1px solid ${t.c}20`}}>
        <span className="text-[16px] flex-shrink-0">{t.i}</span>
        <div><div className="text-[12px] font-black" style={{color:t.c,...HI}}>{t.n}</div>
          <div className="text-[12px] text-slate-300" style={HI}>{t.d}</div></div>
      </div>)}
    </div>
  </Card>;
}

// ═══════════════════════════════════════════════════════════
// ADVANCED SUTRAS
// ═══════════════════════════════════════════════════════════
function AdvSutrasBlock({raw,chartPlanets}) {
  const d=raw?.analysis||raw||{};
  if(!d||Object.keys(d).length<2) return <Card color={C.indigo}><div className="text-slate-500 text-center py-6" style={HI}>डेटा लोड हो रहा है...</div></Card>;
  const cw=d.continuous_wealth||{},ra=d.rajyoga_age||{},dp=d.dream_property||{};
  const iv=d.income_vs_debt||{},lg=d.life_graph||{};
  return <>
    <Card color={cw.continuous_wealth_flow?C.green:C.rose}>
      <SLabel color={cw.continuous_wealth_flow?C.green:C.rose}>MODULE 1 — निरंतर धन प्रवाह</SLabel>
      <div className="text-[17px] font-black mb-2" style={{color:cw.continuous_wealth_flow?C.green:C.rose,...HI}}>
        {cw.continuous_wealth_flow?"✅ धन आसानी से आएगा":"⚠️ धन के लिए संघर्ष"}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {[["10वां",cw.house_10_points],["11वां",cw.house_11_points],["12वां",cw.house_12_points]].map(([l,v])=>
          v!=null&&<div key={l} className="text-center p-2 rounded-xl bg-white/5">
            <div className="text-[20px] font-black" style={{color:C.amber}}>{v}</div>
            <div className="text-[11px] text-slate-500" style={HI}>{l}</div>
          </div>)}
      </div>
      <div className="text-[13px] text-slate-300 p-3 rounded-xl bg-white/4" style={HI}>{cw.prediction_hindi||""}</div>
    </Card>
    {ra.activation_age&&<Card color={C.amber}>
      <SLabel color={C.amber}>MODULE 2 — राजयोग सक्रिय होगा</SLabel>
      <div className="flex items-center gap-4">
        <div className="text-[54px] font-black leading-none" style={{color:C.amber}}>{ra.activation_age}</div>
        <div>
          <div className="text-[14px] font-black text-white" style={HI}>वर्ष की उम्र में</div>
          {ra.lagna_points&&<div className="text-[12px] text-slate-400" style={HI}>लग्न AV = {ra.lagna_points} अंक</div>}
        </div>
      </div>
      {ra.prediction_hindi&&<div className="text-[13px] text-slate-300 mt-3 p-3 rounded-xl bg-white/4" style={HI}>{ra.prediction_hindi}</div>}
    </Card>}
    {dp.will_get_dream_property!=null&&<Card color={dp.will_get_dream_property?C.cyan:C.rose}>
      <SLabel color={dp.will_get_dream_property?C.cyan:C.rose}>MODULE 3 — ड्रीम हाउस/संपत्ति</SLabel>
      <div className="text-[17px] font-black mb-2" style={{color:dp.will_get_dream_property?C.cyan:C.rose,...HI}}>
        {dp.will_get_dream_property?"✅ ड्रीम हाउस मिलेगी":"❌ कठिनाई संभव"}
      </div>
      <div className="text-[13px] text-slate-300" style={HI}>{dp.prediction_hindi||""}</div>
    </Card>}
    {iv.total_sum!=null&&<Card color={iv.is_favorable?C.teal:C.rose}>
      <SLabel color={iv.is_favorable?C.teal:C.rose}>MODULE 4 — आय बनाम कर्ज</SLabel>
      <div className="flex items-center gap-4 mb-2">
        <div className="text-center"><div className="text-[32px] font-black" style={{color:iv.is_favorable?C.teal:C.rose}}>{iv.total_sum}</div><div className="text-[11px] text-slate-500" style={HI}>6+8+12</div></div>
        <div className="text-[18px] text-slate-600">vs</div>
        <div className="text-center"><div className="text-[32px] font-black text-slate-500">{iv.threshold}</div><div className="text-[11px] text-slate-500" style={HI}>थ्रेशहोल्ड</div></div>
      </div>
      <div className="text-[13px] font-bold p-3 rounded-xl"
        style={{...HI,background:iv.is_favorable?"rgba(45,212,191,.1)":"rgba(251,113,133,.1)",color:iv.is_favorable?C.teal:C.rose}}>
        {iv.prediction_hindi||""}
      </div>
    </Card>}
    {lg.differences&&<Card color={C.purple}>
      <SLabel color={C.purple}>MODULE 5 — जीवन ग्राफ 📈</SLabel>
      <div className="flex items-end gap-1 h-20 mb-3">
        {Object.values(lg.differences||{}).map((seg,i)=>{
          const h=seg.current||25;const pct=Math.max(12,((h-18)/(40-18))*100);
          const col=h>=30?C.cyan:h>=25?C.amber:C.rose;
          return <div key={i} className="flex-1 rounded-t-md flex flex-col justify-end" style={{height:"100%"}}>
            <div className="rounded-t-md" title={`${h}`}
              style={{height:`${pct}%`,background:col,opacity:.85,boxShadow:`0 0 4px ${col}40`}}/>
          </div>;
        })}
      </div>
      {lg.overall_trend&&<div className="text-[13px] text-slate-300" style={HI}>{lg.overall_trend}</div>}
    </Card>}
  </>;
}

// ═══════════════════════════════════════════════════════════
// DIPTANSHU — COMPLETE
// ═══════════════════════════════════════════════════════════
function DiptanshuBlock({chartPlanets}) {
  if(!chartPlanets||Object.keys(chartPlanets).length===0) return <Card color={C.yellow}><div className="text-slate-500 text-center py-4" style={HI}>ग्रह डेटा नहीं मिला</div></Card>;
  const houseMap={};
  Object.entries(chartPlanets).forEach(([code,p])=>{
    const h=p.house;if(!houseMap[h])houseMap[h]=[];
    const rawDeg=(p.fullDegree??p.Degree??parseFloat(p.degree))||0;
    houseMap[h].push({code,deg:rawDeg,...p});
  });
  const conjs=[];
  Object.entries(houseMap).forEach(([house,planets])=>{
    if(planets.length<2)return;
    for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
      const p1=planets[i],p2=planets[j];
      const diff=Math.abs((p1.deg%360)-(p2.deg%360));
      const ad=Math.min(diff,360-diff);
      const lim=((ORB[p1.code]||9)+(ORB[p2.code]||9))/2;
      const isPrime=ad<=lim;
      const isAng=(p1.code==="Ma"&&p2.code==="Ra")||(p1.code==="Ra"&&p2.code==="Ma");
      const angBad=isAng&&ad<=8.5;
      const isCom=(p1.code==="Su"||p2.code==="Su")&&ad<=12;
      const otherC=p1.code==="Su"?p2.code:p1.code;
      conjs.push({house:Number(house),p1:p1.code,p2:p2.code,diff:ad.toFixed(1),lim,isPrime,isAng,angBad,isCom,otherC,
        pm1:PLANET_META[p1.code]||{},pm2:PLANET_META[p2.code]||{}});
    }
  });
  // Orb table
  const ORB_ROWS=[["सूर्य ☉","Su",15],["चंद्र ☽","Mo",12],["मंगल ♂","Ma",8],["बुध ☿","Me",7],
    ["गुरु ♃","Ju",9],["शुक्र ♀","Ve",7],["शनि ♄","Sa",9],["राहु ☊","Ra",9],["केतु ☋","Ke",8]];
  return <Card color={C.yellow}>
    <SLabel color={C.yellow}>🌟 दीप्तांशु — युति शक्ति विश्लेषण</SLabel>
    {/* Orb table */}
    <div className="p-3 rounded-xl mb-4" style={{background:"rgba(252,211,77,.06)",border:"1px solid rgba(252,211,77,.2)"}}>
      <div className="text-[12px] font-bold text-yellow-400 mb-2" style={HI}>📐 ग्रहों की प्रभाव सीमा (Orb):</div>
      <div className="grid grid-cols-3 gap-1.5">
        {ORB_ROWS.map(([n,c,o])=>{
          const pm=PLANET_META[c]||{};
          return <div key={c} className="flex items-center justify-between p-1.5 rounded-lg"
            style={{background:`${pm.color||C.amber}10`,border:`1px solid ${pm.color||C.amber}20`}}>
            <span className="text-[11px] font-bold" style={{color:pm.color||C.amber,...HI}}>{n}</span>
            <span className="text-[12px] font-black text-white">{o}°</span>
          </div>;
        })}
      </div>
      <div className="mt-2 text-[11px] text-slate-500" style={HI}>
        अंतर ≤ (ग्रह1+ग्रह2)÷2 = <span className="text-green-400 font-bold">प्रदीप्त युति</span> (100% शक्ति) | अधिक = <span className="text-orange-400">क्षीण</span> (कमजोर)
      </div>
    </div>
    {conjs.length===0?
      <div className="text-[13px] text-amber-400 text-center py-4" style={HI}>कोई युति नहीं</div>:
      conjs.map((c,i)=>{
        const col=c.angBad?"#DC2626":c.isPrime?C.green:C.orange;
        return <div key={i} className="p-3 rounded-xl mb-2" style={{background:`${col}0A`,border:`1px solid ${col}25`}}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span style={{color:c.pm1.color,fontSize:18}}>{c.pm1.symbol}</span>
              <span className="text-[13px] font-black" style={{color:c.pm1.color,...HI}}>{PH[c.p1]||c.p1}</span>
              <span className="text-[12px] text-slate-500">+</span>
              <span style={{color:c.pm2.color,fontSize:18}}>{c.pm2.symbol}</span>
              <span className="text-[13px] font-black" style={{color:c.pm2.color,...HI}}>{PH[c.p2]||c.p2}</span>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{background:`${col}15`,color:col,...HI}}>
                {c.isPrime?"✅ प्रदीप्त":"〰️ क्षीण"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{isNaN(c.diff)?"—":c.diff}° | सीमा:{c.lim?.toFixed(1)||"?"}°</div>
            </div>
          </div>
          <div className="text-[12px] text-slate-400 mb-1" style={HI}>📍 {c.house}वें भाव | {c.isPrime?"फल 100% मिलेगा":"फल कमजोर, धैर्य रखें"}</div>
          {c.isAng&&<div className="p-2.5 rounded-lg mt-1"
            style={{background:c.angBad?"rgba(220,38,38,.12)":"rgba(245,158,11,.08)",
              border:`1px solid ${c.angBad?"rgba(220,38,38,.3)":"rgba(245,158,11,.2)"}`}}>
            <div className="text-[12px] font-bold" style={{color:c.angBad?"#EF4444":"#F59E0B",...HI}}>
              {c.angBad?"🔴 अंगारक दोष — पूर्ण चरम! भयंकर (अंतर ≤8.5°)":"🟡 अंगारक दोष — 8.5° से अधिक — हानिकारक स्तर पर नहीं"}
            </div>
          </div>}
          {c.isCom&&c.p1!==c.p2&&<div className="p-2.5 rounded-lg mt-1"
            style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
            <div className="text-[12px] font-bold text-amber-400" style={HI}>☀️ {PH[c.otherC]} अस्त (Combust)</div>
            <div className="text-[11px] text-slate-300 mt-0.5" style={HI}>
              {["Ju","Ve","Mo","Me"].includes(c.otherC)?"✅ मित्र ग्रह — सूर्य शुभ फल देगा":"⚠️ शत्रु ग्रह — सूर्य अशुभ फल (दग्ध = कमजोर)"}
            </div>
          </div>}
          <Bar value={c.isPrime?100:Math.max(20,100-((c.diff-c.lim)*10))} max={100} color={c.isPrime?C.green:C.orange}/>
        </div>;
      })
    }
  </Card>;
}

// ═══════════════════════════════════════════════════════════
// 100 SADABAHAR SUTRAS — All categories
// ═══════════════════════════════════════════════════════════
const SADABAHAR = {
  planetary:[
    {n:"सूर्य + शनि युति",c:"एक ही भाव में",e:"पिता-पुत्र में दूरी। पिता दीर्घायु पर कष्टदायक। खुद की सरकारी तरक्की में देरी।",r:"सूर्य मंत्र + शनि मंत्र अलग-अलग दिन"},
    {n:"गुरु + शुक्र युति",c:"केंद्र/त्रिकोण में",e:"धर्म vs भोग का संघर्ष। करियर सफल पर दांपत्य जीवन में कुछ त्याग।",r:"गुरुवार लक्ष्मी पूजा, दोनों का सम्मान"},
    {n:"चंद्र + मंगल युति",c:"किसी भी भाव में",e:"रक्त विकार, क्रोध अनियंत्रित। माता के लिए चिंता। ब्लड प्रेशर।",r:"मंगलवार व्रत, लाल मूंगा केवल ज्योतिषी से"},
    {n:"बुध + शुक्र युति",c:"केंद्र/त्रिकोण में",e:"✅ कला + बुद्धि = असाधारण प्रतिभा। लेखन, संगीत, व्यापार में सफलता।",r:"सदा उपयोग करें, यह शुभ योग है"},
    {n:"सूर्य + राहु युति (ग्रहण)",c:"किसी भाव में",e:"पिता पर संकट। नेतृत्व में बाधाएं। रहस्यमय बीमारी। सांप का भय।",r:"आदित्य हृदयम, सूर्य को अर्घ्य रोज"},
    {n:"चंद्र + केतु युति",c:"किसी भाव में",e:"माता को कष्ट। मन में अचानक वैराग्य। रहस्यमयी घटनाएं।",r:"सोमवार व्रत, मोती, शिव पूजा"},
    {n:"मंगल + शनि युति (क्रूर)",c:"किसी भाव में",e:"⚠️ दुर्घटना, चोट, हड्डी टूटने का खतरा। उस भाव की चीज को कष्ट।",r:"हनुमान पूजा + शनि मंत्र"},
    {n:"गुरु + चंद्र केंद्र में (गजकेसरी)",c:"केंद्र में एक-दूसरे से",e:"✅✅ राजा जैसा जीवन! प्रसिद्धि, धन, जनता का प्यार।",r:"इस योग को और मजबूत करें — गुरुवार व्रत"},
    {n:"सूर्य + बुध (बुधादित्य)",c:"एक भाव में",e:"✅ तीव्र बुद्धि, वाणी में तेज, राजकीय सम्मान।",r:"शुभ योग — बुध+सूर्य की शक्ति लें"},
    {n:"मंगल + राहु (अंगारक)",c:"युति (8.5° से कम)",e:"⚠️⚠️ हिंसा, दुर्घटना, अचानक रक्त विकार। तीव्र क्रोध।",r:"हनुमान चालीसा रोज, लाल वस्त्र मंगलवार"},
  ],
  houses:[
    {n:"5वां भाव 14-22 अंक",c:"अष्टकवर्ग में",e:"बुद्धि भ्रमित! निर्णय में गलती। डिग्री बेकार। संतान में देरी।",r:"5वें भाव के कारक गुरु को मजबूत करें"},
    {n:"7वां भाव 14-22 अंक",c:"अष्टकवर्ग में",e:"⚠️ तलाक की प्रबल संभावना। दांपत्य में गंभीर मतभेद। व्यापार हानि।",r:"शुक्र उपाय, विवाह से पहले कुंडली मिलान"},
    {n:"11वां भाव 28+ अंक",c:"अष्टकवर्ग में",e:"✅✅ उत्कृष्ट आय! इच्छापूर्ति। लाभ के अनेक स्रोत।",r:"11वें भाव को और मजबूत करें"},
    {n:"6+8+12 का योग > 76",c:"तीनों दुष्ट भाव",e:"कर्ज, बीमारी और खर्चे अधिक। रोग-शत्रु-व्यय तीनों सक्रिय।",r:"इन भावों के स्वामियों का उपाय तीव्रता से करें"},
    {n:"4था भाव कमजोर + मंगल 4थे में",c:"अष्टकवर्ग + मंगल",e:"भूमि विवाद। माता को कष्ट। घर में अशांति।",r:"माता की सेवा, मंगल मंत्र, भूमि विवाद से बचें"},
    {n:"9वां भाव 32+ अंक",c:"अष्टकवर्ग में",e:"✅ भाग्यशाली! पिता का सहयोग। धर्म से रक्षा।",r:"शुभ — गुरुवार को दान जरूर करें"},
    {n:"10वां भाव 30+ अंक",c:"अष्टकवर्ग में",e:"✅✅ करियर में उच्च सफलता! राजकीय सम्मान।",r:"करियर में पूरा जोर लगाएं"},
    {n:"2रा + 7वां = मारक",c:"दोनों भाव पाप पीड़ित",e:"⚠️ उम्र के निश्चित पड़ावों पर स्वास्थ्य का ध्यान रखें।",r:"मारक दशा में डॉक्टर से मिलते रहें"},
  ],
  vish_navamsha:[
    {n:"शुक्र विष नवमांश में",c:"0-3.33° / 13.33-16.67° / 26.67-30°",e:"⚠️ प्रेम में अस्थिरता। विवाह में कमाकर खोना। किडनी।",r:"शुक्र उपाय — शुक्रवार व्रत"},
    {n:"गुरु विष नवमांश में",c:"उपरोक्त डिग्री रेंज में",e:"⚠️ संतान में देरी। शिक्षा में बाधा। धर्म से दूरी।",r:"गुरु मंत्र, गुरुवार व्रत, पुखराज"},
    {n:"चंद्र विष नवमांश में",c:"उपरोक्त डिग्री रेंज में",e:"⚠️ मानसिक अस्थिरता। माता का स्वास्थ्य। घर में बेचैनी।",r:"सोमवार व्रत, मोती, शिव पूजा"},
    {n:"मंगल विष नवमांश में",c:"उपरोक्त डिग्री रेंज में",e:"⚠️ दुर्घटना। भाई से तनाव। भूमि विवाद।",r:"हनुमान पूजा, लाल मूंगा"},
    {n:"शनि पुष्कर नवमांश में",c:"पुष्कर डिग्री ±2°",e:"✅ शनि का फल दोगुना-चौगुना! उस भाव की चीज में स्थायित्व।",r:"शनि को और मजबूत करें"},
    {n:"सूर्य पुष्कर नवमांश में",c:"पुष्कर डिग्री ±2°",e:"✅ सरकारी काम में अभूतपूर्व सफलता। पिता का दीर्घायु।",r:"शुभ — सूर्य नमस्कार बढ़ाएं"},
  ],
  aspect:[
    {n:"गुरु की दृष्टि लग्न पर",c:"5वीं/7वीं/9वीं दृष्टि",e:"✅✅ लग्न पर गुरु की कृपा = दीर्घायु, धार्मिकता, सुरक्षा।",r:"शुभ — गुरुवार को दान जरूर"},
    {n:"शनि की दृष्टि चंद्र पर",c:"3री/7वीं/10वीं दृष्टि",e:"⚠️ माता को कष्ट। मन में भारीपन। काम में देरी।",r:"शनि + चंद्र दोनों के उपाय"},
    {n:"मंगल की दृष्टि 7वें पर",c:"4थी/7वीं/8वीं दृष्टि",e:"⚠️ दांपत्य में तनाव। जीवनसाथी को चोट। विवाह देरी।",r:"हनुमान पूजा, शुक्र उपाय"},
    {n:"गुरु की दृष्टि 5वें पर",c:"5वीं/7वीं/9वीं दृष्टि",e:"✅ संतान सुख। बुद्धि का विकास। शिक्षा में सफलता।",r:"शुभ — गुरु को और मजबूत करें"},
    {n:"शुक्र की दृष्टि 7वें पर",c:"किसी भी प्रकार",e:"✅ दांपत्य सुखी। जीवनसाथी सुंदर। प्रेम टिकाऊ।",r:"शुभ — शुक्रवार व्रत"},
    {n:"राहु की दृष्टि चंद्र पर",c:"5वीं/9वीं दृष्टि",e:"⚠️ मानसिक भ्रम। माता को विचित्र रोग।",r:"दुर्गा पूजा, राहु उपाय"},
  ],
  remedies:[
    {n:"नीलम (Blue Sapphire)",c:"शनि की महादशा + अनुकूल",e:"✅ पर: बिना ज्योतिषी परामर्श के कभी नहीं पहनें। तीव्र ग्रह है।",r:"3 दिन परखें — पैर के अंगूठे पर रखकर"},
    {n:"पन्ना (Emerald)",c:"बुध अनुकूल हो",e:"व्यापार, बुद्धि, वाणी में लाभ। बुध दशा में सबसे अच्छा।",r:"बुधवार, चांदी में, दाहिनी छोटी उंगली"},
    {n:"पुखराज (Yellow Sapphire)",c:"गुरु अनुकूल हो",e:"✅ धन, संतान, भाग्य में वृद्धि। गुरु दशा में सबसे शुभ।",r:"गुरुवार, सोने में, तर्जनी उंगली"},
    {n:"माणिक्य (Ruby)",c:"सूर्य अनुकूल हो",e:"नेतृत्व, सरकारी काम, पिता का सहयोग।",r:"रविवार, सोने में, अनामिका उंगली"},
    {n:"मोती (Pearl)",c:"चंद्र अनुकूल हो",e:"मन की शांति, माता का सुख, व्यापार में वृद्धि।",r:"सोमवार, चांदी में, कनिष्ठिका"},
    {n:"लाल मूंगा (Red Coral)",c:"मंगल अनुकूल हो",e:"साहस, भूमि लाभ, भाई का सहयोग।",r:"मंगलवार, सोने/चांदी में, अनामिका"},
  ],
};

function SadabaharBlock({chartPlanets}) {
  const [cat, setCat] = useState("planetary");
  const CATS = [
    {k:"planetary",l:"🪐 ग्रह युति",c:C.amber},
    {k:"houses",l:"🏠 भाव सूत्र",c:C.cyan},
    {k:"vish_navamsha",l:"💫 नवमांश",c:C.purple},
    {k:"aspect",l:"👁️ दृष्टि",c:C.green},
    {k:"remedies",l:"💎 रत्न उपाय",c:C.pink},
  ];
  const sutras = SADABAHAR[cat] || [];

  // Check which sutras are active in current chart
  const isActive = (s) => {
    if(!chartPlanets) return false;
    const p = chartPlanets;
    if(s.n.includes("मंगल + राहु") && p.Ma && p.Ra) {
      return p.Ma.house === p.Ra.house && Math.abs((p.Ma.Degree||0)-(p.Ra.Degree||0)) < 8.5;
    }
    if(s.n.includes("सूर्य + राहु") && p.Su && p.Ra) return p.Su.house === p.Ra.house;
    if(s.n.includes("चंद्र + मंगल") && p.Mo && p.Ma) return p.Mo.house === p.Ma.house;
    if(s.n.includes("गजकेसरी") && p.Ju && p.Mo) {
      const diff = Math.abs(p.Ju.house - p.Mo.house);
      return [0,3,6,9].includes(Math.min(diff, 12-diff));
    }
    if(s.n.includes("बुधादित्य") && p.Su && p.Me) return p.Su.house === p.Me.house;
    if(s.n.includes("गुरु + शुक्र") && p.Ju && p.Ve) return p.Ju.house === p.Ve.house;
    if(s.n.includes("मंगल + शनि") && p.Ma && p.Sa) return p.Ma.house === p.Sa.house;
    if(s.n.includes("चंद्र + केतु") && p.Mo && p.Ke) return p.Mo.house === p.Ke.house;
    if(s.n.includes("सूर्य + शनि") && p.Su && p.Sa) return p.Su.house === p.Sa.house;
    if(s.n.includes("गुरु + चंद्र") && p.Ju && p.Mo) return p.Ju.house === p.Mo.house;
    if(s.n.includes("बुध + शुक्र") && p.Me && p.Ve) return p.Me.house === p.Ve.house;
    return false;
  };

  return <Card color={C.amber}>
    <SLabel color={C.amber}>📜 100 सदाबहार सूत्र — चिरस्थायी ज्योतिष नियम</SLabel>
    <div className="flex flex-wrap gap-1.5 mb-4">
      {CATS.map(c => <button key={c.k} onClick={()=>setCat(c.k)}
        className="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all"
        style={{background:cat===c.k?`${c.c}20`:"rgba(255,255,255,.04)",
          color:cat===c.k?c.c:"#475569",
          border:cat===c.k?`1.5px solid ${c.c}45`:"1px solid rgba(255,255,255,.08)",...HI}}>
        {c.l}
      </button>)}
    </div>
    {sutras.map((s,i) => {
      const active = isActive(s);
      return <div key={i} className="p-3 rounded-xl mb-2"
        style={{background:active?"rgba(245,158,11,.1)":"rgba(255,255,255,.03)",
          border:`1px solid ${active?"rgba(245,158,11,.3)":"rgba(255,255,255,.06)"}`}}>
        <div className="flex items-start gap-2 mb-1">
          {active && <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 flex-shrink-0 font-bold" style={HI}>⚡ सक्रिय</span>}
          <div className="text-[13px] font-black text-amber-400" style={HI}>{s.n}</div>
        </div>
        <div className="text-[11px] text-slate-500 mb-1" style={HI}>
          <span className="text-slate-600">शर्त: </span>{s.c}
        </div>
        <div className="text-[12px] text-slate-200 mb-1" style={HI}>
          <span className="text-slate-500">📌 फल: </span>{s.e}
        </div>
        <div className="text-[11px] text-green-300" style={HI}>
          <span className="text-slate-600">🛡️ उपाय: </span>{s.r}
        </div>
      </div>;
    })}
  </Card>;
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════
export default function AdvancedAVPanel({enginesData,chartData}) {
  const ed=enginesData||{},pl=chartData?.planets||{};
  return <div className="pb-8">
    <Section icon="🔢" title="अष्टकवर्ग — 13 मॉड्यूल" color={C.amber} defaultOpen={true}>
      <AVBlock raw={ed.ashtakvarga_complete} planets={pl}/>
    </Section>
    <Section icon="⭐" title="नवतारा चक्र + रत्न" color={C.orange}>
      <NavataraBlock raw={ed.navatara}/>
    </Section>
    <Section icon="🏥" title="स्वास्थ्य · मेडिकल · त्रिकोण" color={C.green}>
      <HealthTrikonaBlock vedicData={ed.comprehensive_vedic} planets={pl}/>
    </Section>
    <Section icon="💰" title="उन्नत सूत्र — धन · राजयोग · जीवन ग्राफ" color={C.indigo}>
      <AdvSutrasBlock raw={ed.advanced_sutras} chartPlanets={pl}/>
    </Section>
    <Section icon="🐍" title="राहु रहस्य — सभी 12 भाव" color={C.indigo} defaultOpen={true}>
      <CompleteRahuBlock chartPlanets={pl}/>
    </Section>
    <Section icon="💛" title="लाभेश — इच्छापूर्ति का रहस्य" color={C.yellow}>
      <LabheshBlock chartPlanets={pl} chartData={chartData}/>
    </Section>
    <Section icon="🪐" title="केतु — सभी 12 भाव" color={C.teal} defaultOpen={true}>
      <KetuBlock chartPlanets={pl}/>
    </Section>
    <Section icon="🌟" title="दीप्तांशु — युति शक्ति" color={C.yellow}>
      <DiptanshuBlock chartPlanets={pl}/>
    </Section>
    <Section icon="📜" title="100 सदाबहार सूत्र — ग्रह युति, भाव, नवमांश, रत्न" color={C.amber}>
      <SadabaharBlock chartPlanets={pl}/>
    </Section>
  </div>;
}