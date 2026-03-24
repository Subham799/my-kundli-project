// KamuktaPanel.jsx — कामुकता एवं व्यभिचार विश्लेषण — 9 Alignment Tabs
// Like Rahu/Ketu — 12 sub-tabs per alignment (house-wise)
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C  = { amber:"#F59E0B",cyan:"#22D3EE",rose:"#FB7185",green:"#4ADE80",
             purple:"#C084FC",indigo:"#818CF8",orange:"#FB923C",teal:"#2DD4BF",
             red:"#EF4444",yellow:"#FCD34D",pink:"#F472B6",blue:"#60A5FA" };

function Bar({ value=0, max=100, color=C.amber }) {
  const pct = Math.min(100,Math.max(0,(value/max)*100));
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div className="h-full rounded-full"
          style={{ background:color, boxShadow:`0 0 8px ${color}50` }}
          initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:.9, ease:"easeOut" }}/>
      </div>
      <span className="text-[12px] font-black w-8 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function RiskBadge({ risk }) {
  const map = {
    "extreme": { label:"🔴🔴 अति उच्च", bg:"rgba(239,68,68,.2)",  color:C.red  },
    "high":    { label:"🔴 उच्च",       bg:"rgba(251,113,133,.15)",color:C.rose },
    "medium":  { label:"🟡 मध्यम",      bg:"rgba(245,158,11,.15)", color:C.amber},
    "low":     { label:"🟢 कम",         bg:"rgba(74,222,128,.15)", color:C.green},
    "none":    { label:"✅ नहीं",        bg:"rgba(74,222,128,.1)",  color:C.green},
  };
  const r = map[risk] || map["none"];
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={{background:r.bg,color:r.color,...HI}}>{r.label}</span>;
}

function Card({ children, color=C.amber, className="" }) {
  return <div className={`p-4 rounded-2xl border mb-3 ${className}`}
    style={{ background:"rgba(8,12,28,.97)", borderColor:`${color}30` }}>{children}</div>;
}

// Condition match nahi hui → sirf yahi dikhao, koi points nahi
function NoMatch({ title, icon, conditions, color=C.amber }) {
  return (
    <Card color={color}>
      <div className="flex items-start gap-3 p-3 rounded-xl"
        style={{background:"rgba(71,85,105,.10)",border:"1px solid rgba(71,85,105,.20)"}}>
        <span className="text-2xl mt-0.5">{icon}</span>
        <div className="flex-1">
          <div className="text-[13px] font-black mb-2" style={{color:`${color}99`,...HI}}>
            {title}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
            style={{background:"rgba(74,222,128,.12)",border:"1px solid rgba(74,222,128,.25)"}}>
            <span className="text-green-400 text-[11px]">✅</span>
            <span className="text-[11px] font-bold text-green-400" style={HI}>इस कुंडली में यह योग/दोष नहीं है</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2" style={HI}>
            यह तब बनता जब:
          </div>
          <div className="space-y-1.5">
            {conditions.map((c,i)=>(
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600 text-[11px] flex-shrink-0 mt-0.5">→</span>
                <span className="text-[11px] text-slate-500 leading-snug" style={HI}>{c}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-600" style={HI}>
            शर्त पूरी नहीं हुई → कोई अंक नहीं दिए गए
          </div>
        </div>
      </div>
    </Card>
  );
}

function SLabel({ children, color=C.amber }) {
  return <div className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color }}>
    <span className="flex-1 h-px" style={{ background:`${color}30` }}/>
    <span style={HI}>{children}</span>
    <span className="flex-1 h-px" style={{ background:`${color}30` }}/>
  </div>;
}

// ─────────────────────────────────────────────────
// ALIGNMENT DEFINITIONS — 9 types
// ─────────────────────────────────────────────────
const ALIGNMENTS = [
  { k:"mv",     icon:"🔥", title:"मंगल-शुक्र",       subtitle:"Mars-Venus Alignment",       color:C.rose,   desc:"तीव्र यौन इच्छा और प्रेम आसक्ति का सबसे प्रमुख योग" },
  { k:"rv",     icon:"🌀", title:"राहु-शुक्र",        subtitle:"Rahu-Venus Influence",       color:C.purple, desc:"असामान्य आकर्षण, विदेशी/भिन्न पृष्ठभूमि, छुपे संबंध" },
  { k:"mmv",    icon:"🌊", title:"चंद्र-मंगल-शुक्र",  subtitle:"Moon-Mars-Venus Triangle",   color:C.indigo, desc:"भावनात्मक + शारीरिक + सौंदर्य = संवेदनशील प्रेम जीवन" },
  { k:"7th",    icon:"⚔️", title:"7वें में पाप समूह", subtitle:"7th House Malefic Cluster",  color:C.red,    desc:"एकाधिक पाप ग्रह सातवें में = वैवाहिक तनाव और असंतोष" },
  { k:"v12",    icon:"💫", title:"शुक्र द्वादश",      subtitle:"Venus in 12th",              color:C.pink,   desc:"12वें भाव का शुक्र = बिस्तर सुख, गुप्त संबंध, अनेक प्रेम" },
  { k:"scorp",  icon:"🦂", title:"वृश्चिक-मेष",       subtitle:"Scorpio-Aries Dominance",    color:C.orange, desc:"मंगल-शासित राशियों का प्रभाव = गहरी कामुकता" },
  { k:"v8",     icon:"🔮", title:"शुक्र अष्टम",       subtitle:"Venus in 8th",               color:C.amber,  desc:"8वां शुक्र = गुप्त इच्छाएं, विरासत से संबंध, यौन जटिलता" },
  { k:"gandh",  icon:"💞", title:"गंधर्व योग",         subtitle:"Gandharva Yoga",             color:C.teal,   desc:"प्रेम विवाह का सबसे सशक्त संकेत — प्रेम जीवन में शुभ" },
  // 6 NEW ALIGNMENTS
  { k:"ketu",   icon:"🌑", title:"केतु-शुक्र",         subtitle:"Ketu-Venus Detachment",      color:C.blue,   desc:"केतु का शुक्र पर प्रभाव = वैराग्य बनाम भोग का द्वंद्व" },
  { k:"sv",     icon:"🪐", title:"शनि-शुक्र",          subtitle:"Saturn-Venus Conflict",      color:C.indigo, desc:"शनि की शुक्र पर दृष्टि = प्रेम में देरी, वृद्ध साथी का योग" },
  { k:"sunv",   icon:"☀️", title:"सूर्य-शुक्र",         subtitle:"Sun-Venus Combustion",       color:C.yellow, desc:"सूर्य के पास शुक्र = अस्त शुक्र, विवाह देरी, अहंकार और प्रेम में टकराव" },
  { k:"mang",   icon:"♂️", title:"मांगलिक दोष",         subtitle:"Manglik Dosha Analysis",     color:C.rose,   desc:"मंगल का 1,4,7,8,12 में होना = विवाह में बाधा का सबसे प्रसिद्ध योग" },
  { k:"5th",    icon:"💝", title:"5वां भाव प्रेम",      subtitle:"5th House Love Analysis",    color:C.pink,   desc:"5वां भाव = प्रेम का घर। यहाँ ग्रहों की स्थिति से प्रेम जीवन समझें" },
  { k:"naadi",  icon:"🧬", title:"नाड़ी दोष",            subtitle:"Naadi Dosha Compatibility",  color:C.red,    desc:"जन्म नक्षत्र से नाड़ी दोष = विवाह में अनुकूलता की जांच" },
  { k:"self",   icon:"🧘", title:"आत्म-नियंत्रण",       subtitle:"Self-Control Score",         color:C.cyan,   desc:"समग्र आत्म-नियंत्रण स्कोर — 0 से 100 तक" },
];

// ─────────────────────────────────────────────────
// HOUSE-WISE EFFECTS for Mars-Venus alignment
// ─────────────────────────────────────────────────
const MV_HOUSE_FX = {
  1:  { risk:"high",   fx:"मंगल लग्न में + शुक्र कहीं = व्यक्तित्व में आकर्षण और आक्रामकता दोनों। खुद को बहुत आकर्षक मानते हैं। संयम की जरूरत।" },
  2:  { risk:"medium", fx:"परिवार में शारीरिक सुख की चाहत। वाणी में लुभावनापन। धन के लिए रिश्ते बना सकते हैं।" },
  3:  { risk:"medium", fx:"भाई-बहन के संबंधों में जटिलता। यात्राओं में प्रेम प्रसंग। मीडिया/कला में कामुकता।" },
  4:  { risk:"high",   fx:"घर में वैवाहिक तनाव। माता के प्रभाव में कामुक सोच। गृहस्थी में असंतोष।" },
  5:  { risk:"extreme",fx:"मंगल-शुक्र 5वें में = सबसे तीव्र प्रेम आसक्ति! पूर्व प्रेम से नहीं उबर पाते। संतान को लेकर भी जटिलता।" },
  6:  { risk:"low",    fx:"6वें में मंगल-शुक्र = शत्रु नाशक। कामुकता पर नियंत्रण बेहतर। रोग में शुक्र = मधुमेह सावधानी।" },
  7:  { risk:"extreme",fx:"7वें में दोनों = मंगलिक दोष + अति कामुकता। साथी से संघर्ष। बाहरी आकर्षण प्रबल। विवाह में समस्या।" },
  8:  { risk:"high",   fx:"8वें में = गुप्त यौन संबंध। विरासत से जुड़े संबंध। अचानक उत्कट इच्छाएं। स्वास्थ्य पर असर।" },
  9:  { risk:"medium", fx:"9वें में = धार्मिक गुरु से आकर्षण या भिन्न धर्म में प्रेम। यात्राओं में प्रेम प्रसंग।" },
  10: { risk:"high",   fx:"10वें में = कार्यस्थल पर संबंध। बॉस/सहकर्मी से आकर्षण। करियर खतरे में पड़ सकता है।" },
  11: { risk:"medium", fx:"11वें में = मित्रों से प्रेम। बड़े भाई या वरिष्ठ से आकर्षण। लाभ के लिए संबंध।" },
  12: { risk:"high",   fx:"12वें में = अस्पताल/विदेश में संबंध। बेड सुख की प्रबल इच्छा। गुप्त जीवन। विदेशी से प्रेम।" },
};

const RV_HOUSE_FX = {
  1:  { risk:"high",   fx:"राहु लग्न में + शुक्र = विचित्र और अप्रत्याशित आकर्षण। लोग आपकी ओर खिंचते हैं पर रिश्ते स्थिर नहीं।" },
  2:  { risk:"medium", fx:"परिवार से अलग रहकर संबंध। झूठ और धन के जरिए रिश्ते। अजीब परिवार पृष्ठभूमि वाले साथी।" },
  3:  { risk:"medium", fx:"मीडिया/सोशल मीडिया पर प्रेम। भाई-बहन के संपर्क से आकर्षण।" },
  4:  { risk:"high",   fx:"राहु 4वें में + शुक्र = गुप्त घरेलू संबंध। माता का प्रभाव उलट। समाज-विरोधी रिश्ते।" },
  5:  { risk:"extreme",fx:"राहु-शुक्र 5वें में = सबसे खतरनाक! अत्यधिक काम वासना। जादू-टोना/तंत्र से प्रेम। संतान में बाधा।" },
  6:  { risk:"low",    fx:"6वें में राहु = शत्रु विजय। शुक्र पर प्रभाव कम। कामुकता नियंत्रित।" },
  7:  { risk:"extreme",fx:"7वें में राहु = विदेशी/अन्य धर्म के साथी। विवाह में धोखे की संभावना। अस्थिर वैवाहिक जीवन।" },
  8:  { risk:"high",   fx:"8वें में राहु + शुक्र = गुप्त यौन संबंध। परकाया प्रवेश या तांत्रिक प्रेम। खतरनाक रिश्ते।" },
  9:  { risk:"medium", fx:"9वें में राहु = विदेश में प्रेम। धर्म परिवर्तन करके विवाह। गुरु से धोखा।" },
  10: { risk:"high",   fx:"10वें में राहु = करियर के जरिए प्रेम। धोखाधड़ी से उन्नति। राजनीतिक संबंध।" },
  11: { risk:"medium", fx:"11वें में राहु = विदेशी मित्र। लाभ के लिए असामान्य संबंध।" },
  12: { risk:"extreme",fx:"12वें में राहु + शुक्र = बिस्तर सुख की अत्यधिक लालसा। अस्पताल/जेल में संबंध। गुप्त जीवन।" },
};

const V8_HOUSE_FX = {
  1: {risk:"medium",fx:"शुक्र लग्न में = आकर्षक व्यक्तित्व, 8वें से दृष्टि = गुप्त इच्छाएं उजागर होती हैं।"},
  2: {risk:"medium",fx:"शुक्र धन में = पैसे से प्रेम, 8वें का शुक्र = विरासत में धन पर संबंध।"},
  3: {risk:"low",   fx:"तृतीय शुक्र = कलाकार, 8वें से = रहस्यमय संचार।"},
  4: {risk:"medium",fx:"गृह शुक्र = सुंदर घर, 8वें से = घर में गुप्त बातें।"},
  5: {risk:"high",  fx:"5वां शुक्र = प्रेम विवाह, 8वें से = संतान में गुप्त चिंता।"},
  6: {risk:"low",   fx:"6वां शुक्र = नौकरी में सुख, 8वें से = रोग में जटिलता।"},
  7: {risk:"high",  fx:"7वां शुक्र अति शुभ, लेकिन 8वें से = साथी के गुप्त राज।"},
  8: {risk:"extreme",fx:"8वें में शुक्र = सबसे गुप्त इच्छाएं, यौन जटिलता, विरासत से प्रेम, रहस्यमय संबंध।"},
  9: {risk:"medium",fx:"9वां शुक्र = विदेश प्रेम, 8वें से = गुरु से गुप्त संबंध।"},
  10:{risk:"high",  fx:"10वां शुक्र = करियर में प्रेम, 8वें से = पदोन्नति में संबंध।"},
  11:{risk:"medium",fx:"11वां शुक्र = लाभ, 8वें से = मित्र से गुप्त आकर्षण।"},
  12:{risk:"extreme",fx:"12वां शुक्र = बेड सुख + 8वें से = अत्यधिक गुप्त जीवन, विदेश में संबंध।"},
};

// ─────────────────────────────────────────────────
// MAIN ALIGNMENT BLOCKS
// ─────────────────────────────────────────────────

// Block 1: Mars-Venus
function MVBlock({ planets }) {
  const [selH, setSelH] = useState(null);
  const p = planets || {};
  const maH = p.Ma?.house, veH = p.Ve?.house;
  const together = maH && veH && maH === veH;
  const same7th  = maH===7 || veH===7;
  const diff = maH && veH ? Math.abs(maH - veH) : 99;
  const aspectFromMars = maH && veH && (maH + 6) % 12 + 1 === veH;

  // Condition check — koi bhi match nahi to NoMatch
  const conditionMet = together || same7th || aspectFromMars || diff <= 3;
  if (!conditionMet) return (
    <NoMatch
      icon="🔥" color={C.rose}
      title="मंगल-शुक्र संरेखण (Mars-Venus Alignment)"
      conditions={[
        `मंगल और शुक्र एक ही भाव में (युति) — अभी: मंगल ${maH||"?"}वें, शुक्र ${veH||"?"}वें`,
        "मंगल या शुक्र में से कोई एक 7वें भाव में हो",
        `मंगल की 7वीं दृष्टि शुक्र पर पड़े (मंगल ${maH||"?"}वें से → ${maH?(maH+5)%12+1:"?"}वें पर दृष्टि)`,
        "दोनों ग्रह 3 भाव के अंतर में हों",
      ]}
    />
  ); // 7th aspect

  let overallRisk = "low";
  if (together) overallRisk = "extreme";
  else if (same7th || aspectFromMars) overallRisk = "high";
  else if (diff <= 4) overallRisk = "medium";

  const riskColors = { extreme:C.red, high:C.rose, medium:C.amber, low:C.green, none:C.green };
  const rc = riskColors[overallRisk];

  const activeH = selH || (together ? maH : maH || veH || 5);
  const hfx = MV_HOUSE_FX[activeH] || MV_HOUSE_FX[5];

  return (
    <Card color={C.rose}>
      <SLabel color={C.rose}>🔥 मंगल-शुक्र संरेखण (Mars-Venus Alignment)</SLabel>

      {/* Status */}
      <div className="p-4 rounded-xl mb-4" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔥</span>
          <div className="flex-1">
            <div className="text-[15px] font-black" style={{color:rc,...HI}}>मंगल-शुक्र — <RiskBadge risk={overallRisk}/></div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              {together ? `मंगल + शुक्र दोनों ${maH}वें भाव में (युति) = तीव्रतम प्रभाव` :
               maH && veH ? `मंगल ${maH}वें + शुक्र ${veH}वें = ${diff} भाव का अंतर` :
               "ग्रह स्थिति अनुसार विश्लेषण"}
            </div>
          </div>
        </div>
        <Bar value={overallRisk==="extreme"?95:overallRisk==="high"?70:overallRisk==="medium"?45:20} max={100} color={rc}/>
        <div className="mt-2 text-[12px]" style={{color:rc,...HI}}>
          {together ? "🔴🔴 युति = उच्चतम तीव्रता — संयम और आध्यात्मिक साधना अति आवश्यक" :
           same7th  ? "🔴 विवाह भाव प्रभावित — दांपत्य जीवन में सावधानी जरूरी" :
           aspectFromMars ? "🔴 मंगल की दृष्टि शुक्र पर = आक्रामक आकर्षण" :
           diff<=4 ? "🟡 समीप भाव — मध्यम प्रभाव, ध्यान रखें" : "🟢 दूर भाव — कम प्रभाव"}
        </div>
      </div>

      {/* 12-house selector */}
      <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>भाव चुनें — देखें उस भाव में मंगल-शुक्र का प्रभाव:</div>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
          const hd=MV_HOUSE_FX[h];
          const isMa=maH===h, isVe=veH===h, isSel=selH===h;
          return <button key={h} onClick={()=>setSelH(h===selH?null:h)}
            className="py-2.5 rounded-xl text-[12px] font-black transition-all flex flex-col items-center gap-0.5"
            style={{
              background:isSel?`${C.rose}25`:isMa&&isVe?`${C.red}20`:isMa?`${C.rose}15`:isVe?`${C.pink}15`:"rgba(255,255,255,.03)",
              border:isSel?`2px solid ${C.rose}60`:isMa&&isVe?`1.5px solid ${C.red}50`:isMa?`1px solid ${C.rose}35`:isVe?`1px solid ${C.pink}35`:"1px solid rgba(255,255,255,.07)",
              color:isSel?C.rose:isMa&&isVe?C.red:isMa?C.rose:isVe?C.pink:"#475569",
            }}>
            {h}
            <span className="text-[7px]">{isMa&&isVe?"🔥Ma+Ve":isMa?"♂️Ma":isVe?"♀️Ve":hd?.risk==="extreme"?"🔴🔴":hd?.risk==="high"?"🔴":hd?.risk==="medium"?"🟡":"🟢"}</span>
          </button>;
        })}
      </div>

      {/* Detail for selected house */}
      {hfx && (
        <motion.div key={activeH} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
          className="p-3.5 rounded-xl mb-3"
          style={{background:`${riskColors[hfx.risk]}08`,border:`1.5px solid ${riskColors[hfx.risk]}30`}}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[15px] font-black" style={{color:riskColors[hfx.risk],...HI}}>{activeH}वें भाव में मंगल-शुक्र का प्रभाव:</span>
            <RiskBadge risk={hfx.risk}/>
          </div>
          <div className="text-[12px] text-slate-200 leading-relaxed" style={HI}>{hfx.fx}</div>
        </motion.div>
      )}

      {/* Remedies */}
      <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.07)",border:"1px solid rgba(251,113,133,.2)"}}>
        <div className="text-[12px] font-bold text-rose-400 mb-2" style={HI}>🛡️ संयम के उपाय:</div>
        {["शिव-पार्वती पूजा — शुक्रवार विशेष",
          "ब्रह्मचर्य व्रत (सोमवार/शनिवार)",
          "हनुमान चालीसा — मंगलवार",
          "योग/ध्यान प्रतिदिन 30 मिनट",
          "मंत्र: ॐ शुं शुक्राय नमः + ॐ अं अंगारकाय नमः"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 2: Rahu-Venus
function RVBlock({ planets }) {
  const [selH, setSelH] = useState(null);
  const p = planets || {};
  const raH = p.Ra?.house, veH = p.Ve?.house;
  const together = raH && veH && raH === veH;

  // Sensitive Rahu houses: 5,7,12,8 = high risk; 4,10,1 = moderate
  const raHigh = raH && [5,7,12,8].includes(raH);
  const raModerate = raH && [4,10,1].includes(raH);
  const ve_bad = veH && [7,8,12,5].includes(veH);

  // Condition: together, OR Rahu in sensitive house + Venus also in bad house
  const conditionMet = together || raHigh || (raModerate && ve_bad);
  if (!conditionMet) return (
    <NoMatch
      icon="🌀" color={C.purple}
      title="राहु-शुक्र प्रभाव (Rahu-Venus Influence)"
      conditions={[
        `राहु और शुक्र एक ही भाव में हों (युति) — अभी: राहु ${raH||"?"}वें, शुक्र ${veH||"?"}वें`,
        "राहु 5वें, 7वें, 8वें या 12वें भाव में हो (संवेदनशील घर)",
        `राहु 4वें/10वें/1वें में हो AND शुक्र भी 5/7/8/12 में हो`,
      ]}
    />
  );

  // ── SCORING ─────────────────────────────────────────────────
  const rahuScore = {
    5:80, 7:75, 12:70, 8:65,     // dangerous houses
    4:50, 10:45, 1:40,            // moderate
    2:30, 3:20, 6:15, 11:20, 9:25 // lower
  }[raH] || 25;

  // Venus modifier — only adds score if Venus is ALSO in a problematic house
  const veModifier =
    together          ? 20  : // same house as Rahu = +20
    veH===7           ?  8  : // Venus in 7th
    veH===12 || veH===8 ? 6 : // Venus in kama houses
    veH===5           ?  5  : // Venus in 5th
    0;                         // Venus in safe house = NO extra risk

  const score = Math.min(95, Math.max(10, rahuScore + veModifier));

  // Risk tier from final score
  let risk = score>=75?"extreme":score>=55?"high":score>=35?"medium":"low";

  // Override: if together, always extreme
  if (together) risk = "extreme";

  const rc = {extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];
  const activeH = selH || raH || 7;
  const hfx = RV_HOUSE_FX[activeH] || RV_HOUSE_FX[7];
  const riskColors = { extreme:C.red, high:C.rose, medium:C.amber, low:C.green, none:C.green };

  // ── Context-sensitive description ───────────────────────────
  const mainDesc = together
    ? `🌀 राहु-शुक्र युति ${raH}वें भाव में = अत्यंत अस्थिर प्रेम जीवन। परिवार विरोध, सामाजिक निंदा संभव।`
    : risk==="extreme"
    ? `⚠️ राहु ${raH}वें भाव में = तीव्र असामान्य आकर्षण। शुक्र ${veH}वें भाव से मिश्रित।`
    : risk==="high"
    ? `🟡 राहु ${raH}वें भाव का प्रभाव — संबंधों में कुछ भ्रम संभव। शुक्र ${veH}वें भाव में — सीधा युति नहीं।`
    : `🟢 राहु ${raH||"?"}वें + शुक्र ${veH||"?"}वें — अलग-अलग भावों में, सीधा दुष्प्रभाव सीमित।`;

  // ── Characteristics only show when genuinely warranted ──────
  // together = always show extreme chars
  // extreme score (Rahu in 5/7/12/8 AND Venus also in bad house) = show high chars
  // high with just Rahu in moderate bad house = show mild chars only
  // medium/low = no characteristics block
  const showExtremeChars = together || (risk==="extreme" && veModifier >= 5);
  const showHighChars    = !showExtremeChars && risk==="high" && veModifier >= 5;

  return (
    <Card color={C.purple}>
      <SLabel color={C.purple}>🌀 राहु-शुक्र प्रभाव (Rahu-Venus Influence)</SLabel>
      <div className="p-4 rounded-xl mb-4" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌀</span>
          <div className="flex-1">
            <div className="text-[15px] font-black" style={{color:rc,...HI}}>राहु-शुक्र — <RiskBadge risk={risk}/></div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              {together
                ? `राहु + शुक्र दोनों ${raH}वें भाव में = असामान्य आकर्षण`
                : `राहु ${raH||"?"}वें + शुक्र ${veH||"?"}वें भाव में`}
            </div>
          </div>
        </div>
        <Bar value={score} max={100} color={rc}/>
        <div className="text-[10px] text-slate-600 mt-1 mb-2" style={HI}>
          राहु स्थिति: {rahuScore} + शुक्र प्रभाव: +{veModifier} = कुल {score}/100
          {veModifier===0 && !together && <span className="text-green-500/70"> (शुक्र की स्थिति अलग — राहु से सीधा युति नहीं)</span>}
        </div>
        <div className="mt-1 text-[12px]" style={{color:rc,...HI}}>{mainDesc}</div>
      </div>

      {/* Extreme characteristics — only when both planets confirm */}
      {showExtremeChars && (
        <div className="p-3 rounded-xl mb-3" style={{background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.3)"}}>
          <div className="text-[12px] font-bold text-purple-400 mb-2" style={HI}>⚠️ विशेषताएं (राहु-शुक्र युति/एकीकृत प्रभाव):</div>
          {["समाज-मान्य नहीं संबंध — उम्र/जाति/धर्म के बंधन टूटते हैं",
            "तीव्र आकर्षण लेकिन अस्थिर — जल्दी टूट सकते हैं",
            "परिवार का विरोध लगभग निश्चित",
            "कानूनी समस्या या सामाजिक निंदा का खतरा",
            "पिछले जन्म का संबंध — अतृप्त इच्छाएं"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      )}

      {/* Mild caution — when Rahu is in high-risk house but Venus is separate */}
      {showHighChars && (
        <div className="p-3 rounded-xl mb-3" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)"}}>
          <div className="text-[12px] font-bold text-amber-400 mb-2" style={HI}>💡 ध्यान दें:</div>
          {["राहु की स्थिति से कुछ असामान्य आकर्षण संभव",
            "शुक्र अलग भाव में — सीधा दुष्प्रभाव नहीं",
            "सावधान रहें लेकिन घबराएं नहीं"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      )}

      {/* 12 houses */}
      <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>12 भावों में राहु-शुक्र प्रभाव:</div>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
          const hd=RV_HOUSE_FX[h];
          const isRa=raH===h, isVe=veH===h, isSel=selH===h;
          return <button key={h} onClick={()=>setSelH(h===selH?null:h)}
            className="py-2.5 rounded-xl text-[12px] font-black transition-all flex flex-col items-center gap-0.5"
            style={{
              background:isSel?`${C.purple}25`:isRa&&isVe?`${C.red}20`:isRa?`${C.purple}15`:isVe?`${C.pink}12`:"rgba(255,255,255,.03)",
              border:isSel?`2px solid ${C.purple}60`:isRa?`1px solid ${C.purple}40`:isVe?`1px solid ${C.pink}30`:"1px solid rgba(255,255,255,.07)",
              color:isSel?C.purple:isRa&&isVe?C.red:isRa?C.purple:isVe?C.pink:"#475569",
            }}>
            {h}
            <span className="text-[7px]">{isRa&&isVe?"🌀Ra+Ve":isRa?"☊Ra":isVe?"♀️Ve":hd?.risk==="extreme"?"🔴🔴":hd?.risk==="high"?"🔴":hd?.risk==="medium"?"🟡":"🟢"}</span>
          </button>;
        })}
      </div>
      {hfx&&<motion.div key={activeH} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
        className="p-3.5 rounded-xl mb-3"
        style={{background:`${riskColors[hfx.risk]}08`,border:`1.5px solid ${riskColors[hfx.risk]}30`}}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[14px] font-black" style={{color:riskColors[hfx.risk],...HI}}>{activeH}वें भाव में राहु-शुक्र प्रभाव:</span>
          <RiskBadge risk={hfx.risk}/>
        </div>
        <div className="text-[12px] text-slate-200 leading-relaxed" style={HI}>{hfx.fx}</div>
      </motion.div>}
      <div className="p-3 rounded-xl" style={{background:"rgba(192,132,252,.07)",border:"1px solid rgba(192,132,252,.2)"}}>
        <div className="text-[12px] font-bold text-purple-400 mb-2" style={HI}>🛡️ मार्गदर्शन:</div>
        {["परिवार से विचार-विमर्श — जल्दबाजी नहीं","दुर्गा माता की शरण — शुक्रवार पूजा","राहु शांति पूजा अवश्य करें","नीले रंग का उपयोग कम करें","सात्विक जीवन और सत्संग"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 3: Moon-Mars-Venus Triangle
function MMVBlock({ planets }) {
  const p = planets || {};
  const moH=p.Mo?.house, maH=p.Ma?.house, veH=p.Ve?.house;
  const trikon1=[1,5,9], kendra=[1,4,7,10];
  const twoInSame = (moH&&maH&&moH===maH)||(moH&&veH&&moH===veH)||(maH&&veH&&maH===veH);
  const allInTrikon = [moH,maH,veH].every(h=>h&&trikon1.includes(h));
  const allInKendra = [moH,maH,veH].every(h=>h&&kendra.includes(h));
  const allSeparate = !twoInSame;

  // Condition: only show if at least 2 in same house, OR all 3 in trikona/kendra
  const conditionMet = twoInSame || allInTrikon || allInKendra;
  if (!conditionMet) return (
    <NoMatch
      icon="🌊" color={C.indigo}
      title="चंद्र-मंगल-शुक्र त्रिकोण"
      conditions={[
        `कोई दो ग्रह एक ही भाव में हों (युति) — अभी: चंद्र ${moH||"?"}वें, मंगल ${maH||"?"}वें, शुक्र ${veH||"?"}वें`,
        "तीनों ग्रह एक त्रिकोण (1/5/9) में हों",
        "तीनों ग्रह एक केंद्र (1/4/7/10) में हों",
      ]}
    />
  );

  let risk = twoInSame?"extreme":allInTrikon?"high":allInKendra?"high":"medium";
  const rc={extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];

  // Context-aware description
  const desc = twoInSame
    ? "दो ग्रहों की युति = अत्यधिक संवेदनशील और अस्थिर प्रेम जीवन"
    : allInTrikon || allInKendra
    ? "तीनों एक ही त्रिकोण/केंद्र में = गहन प्रेम क्षमता + कुछ जटिलता"
    : `तीनों अलग-अलग भावों में (${moH||"?"}/${maH||"?"}/${veH||"?"}) = मिश्रित, संतुलित प्रभाव`;

  // Caution list — only severe ones for medium/separate case
  const cautionList = twoInSame || allInTrikon
    ? ["बहुत जल्दी आकर्षण — जल्दबाजी से बचें",
       "संबंध टूटने पर तीव्र पीड़ा",
       "नशे की लत संभव (दर्द भुलाने को)",
       "एक से अधिक संबंध की इच्छा"]
    : ["कभी-कभी जल्दी आकर्षण — समझदारी रखें",
       "भावनाओं पर नियंत्रण जरूरी"];

  return (
    <Card color={C.indigo}>
      <SLabel color={C.indigo}>🌊 चंद्र-मंगल-शुक्र त्रिकोण</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          चंद्र-मंगल-शुक्र त्रिकोण — <RiskBadge risk={risk}/>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[{sym:"☽",name:"चंद्र",h:moH,col:C.blue},{sym:"♂",name:"मंगल",h:maH,col:C.rose},{sym:"♀",name:"शुक्र",h:veH,col:C.pink}].map((pl,i)=>(
            <div key={i} className="p-2.5 rounded-xl text-center" style={{background:`${pl.col}10`,border:`1px solid ${pl.col}25`}}>
              <div className="text-[20px]" style={{color:pl.col}}>{pl.sym}</div>
              <div className="text-[11px] font-black" style={{color:pl.col,...HI}}>{pl.name}</div>
              <div className="text-[12px] text-slate-400" style={HI}>{pl.h?`${pl.h}वें में`:"—"}</div>
            </div>
          ))}
        </div>
        <div className="text-[12px] text-slate-300" style={HI}>
          भावनात्मक (चंद्र) + शारीरिक (मंगल) + सौंदर्य (शुक्र) तीनों मिलकर = {desc}
        </div>
        {allSeparate && (
          <div className="mt-2 text-[10px] text-green-500/70" style={HI}>
            ✅ तीनों अलग भावों में — सीधी युति नहीं, दुष्प्रभाव सीमित
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[12px] font-bold text-green-400 mb-2" style={HI}>✅ सकारात्मक</div>
          {["गहन प्रेम करने की क्षमता","कलात्मक अभिव्यक्ति — गायन/नृत्य/लेखन","जीवनसाथी के प्रति समर्पण","सौंदर्य बोध बहुत तीव्र"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[12px] font-bold text-rose-400 mb-2" style={HI}>⚠️ सावधानी</div>
          {cautionList.map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(129,140,248,.07)",border:"1px solid rgba(129,140,248,.2)"}}>
        <div className="text-[12px] font-bold text-indigo-400 mb-2" style={HI}>🛡️ संतुलन के उपाय:</div>
        {["सोमवार चंद्र उपाय + मंगलवार हनुमान + शुक्रवार देवी पूजा","ध्यान + प्राणायाम = भावनात्मक नियंत्रण","एक साथी के प्रति समर्पण का व्रत लें","कला और रचनात्मकता में ऊर्जा लगाएं"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 4: 7th House Malefic Cluster
function House7Block({ planets }) {
  const p = planets || {};
  const malefics = ["Ma","Sa","Ra","Ke","Su"];
  const in7 = Object.entries(p).filter(([c,pd])=>pd?.house===7);
  const malefIn7 = in7.filter(([c])=>malefics.includes(c));
  const count = malefIn7.length;

  if (count === 0) return (
    <NoMatch
      icon="⚔️" color={C.red}
      title="7वें भाव में पाप ग्रह समूह"
      conditions={[
        "कोई एक पाप ग्रह 7वें भाव में हो: मंगल, शनि, राहु, केतु, या सूर्य",
        "दो पाप ग्रह एक साथ 7वें में हों — उच्च जोखिम",
        "तीन या अधिक पाप ग्रह 7वें में — अत्यधिक जोखिम",
        `अभी 7वें भाव में: ${in7.length > 0 ? in7.map(([c])=>({Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"})[c]).join(", ") : "कोई ग्रह नहीं"}`,
      ]}
    />
  );

  const risk = count>=3?"extreme":count===2?"high":count===1?"medium":"low";
  const rc = {extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];
  return (
    <Card color={C.red}>
      <SLabel color={C.red}>⚔️ 7वें भाव में पाप ग्रह समूह</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          7वें भाव में {count} पाप ग्रह — <RiskBadge risk={risk}/>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {in7.length>0 ? in7.map(([code,pd])=>{
            const isMal=malefics.includes(code);
            const names={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
            const syms={Su:"☉",Mo:"☽",Ma:"♂",Me:"☿",Ju:"♃",Ve:"♀",Sa:"♄",Ra:"☊",Ke:"☋"};
            return <span key={code} className="px-3 py-1.5 rounded-xl text-[12px] font-black"
              style={{background:isMal?"rgba(239,68,68,.2)":"rgba(74,222,128,.15)",
                color:isMal?C.red:C.green,border:`1px solid ${isMal?C.red:C.green}30`,...HI}}>
              {syms[code]} {names[code]} {isMal?"(पाप)":"(शुभ)"}
            </span>;
          }) : <span className="text-[12px] text-slate-500" style={HI}>7वें भाव में कोई ग्रह नहीं</span>}
        </div>
        <Bar value={count>=3?90:count===2?65:count===1?40:15} max={100} color={rc}/>
        <div className="mt-2 text-[12px]" style={{color:rc,...HI}}>
          {count>=3?"🔴🔴 तीन पाप ग्रह = वैवाहिक जीवन में गंभीर तनाव और बाहरी संबंध की तलाश":
           count===2?"🔴 दो पाप ग्रह = साथी से झगड़े, यौन असंतोष":
           count===1?"🟡 एक पाप ग्रह = सावधानी जरूरी, उपाय करें":"🟢 7वां भाव साफ — विवाह शुभ"}
        </div>
      </div>
      {count>=2&&<div className="p-3 rounded-xl mb-3" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}}>
        <div className="text-[12px] font-bold text-red-400 mb-2" style={HI}>⚠️ परिणाम:</div>
        {["वैवाहिक जीवन तनावपूर्ण — विचार मतभेद",
          "यौन असंतोष — एकाधिक आकर्षण",
          "साथी के स्वास्थ्य पर असर संभव",
          "विवाह में देरी या विच्छेद का खतरा"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>}
      <div className="p-3 rounded-xl" style={{background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)"}}>
        <div className="text-[12px] font-bold text-red-400 mb-2" style={HI}>🛡️ अनिवार्य उपाय:</div>
        {["विवाह पूर्व कुंडली मिलान अनिवार्य",
          "साथी की सहमति से counseling",
          "नवग्रह पूजा + शुक्र शांति",
          "सोमवार-शुक्रवार व्रत",
          count>=3?"विवाह के समय Mahamrityunjaya path अवश्य करें":"7वें भाव की शांति पूजा"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 5: Venus in 12th/8th
function Venus12Block({ planets }) {
  const p = planets || {};
  const veH = p.Ve?.house;
  const is12 = veH===12;
  const is8  = veH===8;

  if (!is12 && !is8) return (
    <NoMatch
      icon="💫" color={C.pink}
      title="शुक्र — 12वें/8वें भाव का कामुकता प्रभाव"
      conditions={[
        `शुक्र 12वें भाव में हो (गुप्त सुख, बेड सुख की लालसा) — अभी: शुक्र ${veH||"?"}वें में`,
        "शुक्र 8वें भाव में हो (गुप्त इच्छाएं, रहस्यमय आकर्षण)",
      ]}
    />
  );

  const risk = is12?"extreme":is8?"high":"low";
  const rc = {extreme:C.rose,high:C.amber,low:C.green}[risk];

  const V12_FX={
    1:"शुक्र लग्न में = आकर्षक व्यक्तित्व। 12वें से दृष्टि = गुप्त सुख की चाहत बाहर नहीं आती।",
    2:"शुक्र 2रे में = मधुर वाणी। 12वें से = खर्च में विलासिता।",
    3:"शुक्र 3रे में = कलाकार। 12वें से = यात्राओं में प्रेम।",
    4:"शुक्र 4थे में = सुखी घर। 12वें से = एकांत में सुख।",
    5:"शुक्र 5वें में = प्रेम। 12वें से = गुप्त प्रेम की तलाश।",
    6:"शुक्र 6ठे में = नौकरी में सुख।",
    7:"शुक्र 7वें में = सुखी विवाह। 12वें दृष्टि = रात्रि सुख।",
    8:"शुक्र 8वें में = गुप्त इच्छाएं, विरासत।",
    9:"शुक्र 9वें में = विदेश प्रेम।",
    10:"शुक्र 10वें में = करियर में सुख।",
    11:"शुक्र 11वें में = लाभ।",
    12:"🔴🔴 शुक्र 12वें में = बेड सुख की अत्यधिक लालसा! एकाधिक गुप्त संबंध, विदेशी प्रेम, रात्रि जीवन में रुचि।",
  };

  return (
    <Card color={C.pink}>
      <SLabel color={C.pink}>💫 शुक्र — 12 भावों में कामुकता प्रभाव</SLabel>
      <div className="p-4 rounded-xl mb-4" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          शुक्र {veH?`${veH}वें भाव में`:"—"} — <RiskBadge risk={risk}/>
        </div>
        {veH&&<div className="text-[12px] text-slate-300 mb-2" style={HI}>{V12_FX[veH]}</div>}
        <Bar value={is12?90:is8?65:30} max={100} color={rc}/>
      </div>

      {/* All 12 houses reference */}
      <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>शुक्र किस भाव में = कैसा प्रभाव:</div>
      {Object.entries(V12_FX).map(([h,fx])=>{
        const isActive=Number(h)===veH;
        const is12h=Number(h)===12, is8h=Number(h)===8;
        return <div key={h} className={`flex items-start gap-2 p-2.5 rounded-xl mb-1 ${isActive?"ring-1":""}` }
          style={isActive?{background:`${C.pink}12`,borderColor:C.pink,ringColor:C.pink,border:`1.5px solid ${C.pink}35`}:{background:"rgba(255,255,255,.02)"}}>
          <span className="text-[11px] font-black flex-shrink-0 w-6" style={{color:isActive?C.pink:is12h?C.rose:is8h?C.amber:"#475569"}}>{h}</span>
          <span className="text-[11px] text-slate-400" style={HI}>{fx}{isActive&&<span className="ml-1 text-pink-400 font-bold">← इस कुंडली में</span>}</span>
        </div>;
      })}
      <div className="p-3 rounded-xl mt-3" style={{background:"rgba(244,114,182,.07)",border:"1px solid rgba(244,114,182,.2)"}}>
        <div className="text-[12px] font-bold text-pink-400 mb-2" style={HI}>🛡️ शुक्र शांति उपाय:</div>
        {["शुक्रवार व्रत — सफेद वस्त्र पहनें","माँ लक्ष्मी की आराधना","शुक्र मंत्र: ॐ शुं शुक्राय नमः — 108 बार","गाय को हरा चारा खिलाएं","श्वेत वस्तुओं का दान — दूध, चीनी, चांदी"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 6: Scorpio-Aries Dominance
function ScorpBlock({ planets }) {
  const p = planets || {};
  const MARS_SIGNS=["Mesha","Vrishchika","मेष","वृश्चिक","Aries","Scorpio"];
  const inMarsSign = c => {
    const s = p[c]?.sign||p[c]?.rashi||"";
    return MARS_SIGNS.some(ms=>s.includes(ms));
  };
  const marsSignPlanets = Object.keys(p).filter(c=>inMarsSign(c));
  const count = marsSignPlanets.length;
  const PNAMES={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};

  if (count < 2) return (
    <NoMatch
      icon="🦂" color={C.orange}
      title="वृश्चिक-मेष प्रभाव (Mars-Ruled Signs Dominance)"
      conditions={[
        "कम से कम 2 ग्रह मेष (Aries) या वृश्चिक (Scorpio) राशि में हों",
        "3+ ग्रह = उच्च प्रभाव | 4+ = अत्यधिक प्रभाव",
        `अभी मंगल राशि में ग्रह: ${count === 1 ? marsSignPlanets.map(c=>PNAMES[c]||c).join(", ")+" (केवल 1)" : "कोई नहीं"}`,
      ]}
    />
  );

  const risk = count>=4?"extreme":count>=3?"high":count>=2?"medium":"low";
  const rc = {extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];
  return (
    <Card color={C.orange}>
      <SLabel color={C.orange}>🦂 वृश्चिक-मेष प्रभाव (Mars-Ruled Signs)</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          मंगल राशि में {count} ग्रह — <RiskBadge risk={risk}/>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {marsSignPlanets.length>0?marsSignPlanets.map(c=>(
            <span key={c} className="px-2.5 py-1 rounded-lg text-[11px] font-black"
              style={{background:"rgba(251,146,60,.2)",color:C.orange,...HI}}>
              {PNAMES[c]||c} ({p[c]?.sign||"?"})
            </span>
          )):<span className="text-[12px] text-slate-500" style={HI}>मंगल राशि में कोई ग्रह नहीं</span>}
        </div>
        <Bar value={count*22} max={100} color={rc}/>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-xl" style={{background:"rgba(251,146,60,.08)",border:"1px solid rgba(251,146,60,.2)"}}>
          <div className="text-[11px] font-bold text-orange-400 mb-2" style={HI}>🔥 मेष (Aries) प्रभाव</div>
          <div className="text-[11px] text-slate-300" style={HI}>तीव्र, आक्रामक, तत्काल आकर्षण। जल्दी प्रेम — जल्दी विराम। ऊर्जावान पर अस्थिर।</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}}>
          <div className="text-[11px] font-bold text-red-400 mb-2" style={HI}>🦂 वृश्चिक (Scorpio) प्रभाव</div>
          <div className="text-[11px] text-slate-300" style={HI}>गहरी, रहस्यमयी कामुकता। जुनूनी प्रेम। ईर्ष्या तीव्र। गुप्त इच्छाएं।</div>
        </div>
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(251,146,60,.07)",border:"1px solid rgba(251,146,60,.2)"}}>
        <div className="text-[12px] font-bold text-orange-400 mb-2" style={HI}>🛡️ उपाय — मंगल शांति:</div>
        {["मंगलवार हनुमान चालीसा","लाल मूंगा (विद्वान ज्योतिषी की सलाह से)","नीले कपड़े पहनें — मंगल को शांत करें","स्वयं पर नियंत्रण — क्रोध और काम दोनों"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 7: Venus in 8th
function Venus8Block({ planets }) {
  const p = planets || {};
  const veH = p.Ve?.house;
  const is8 = veH===8, is12=veH===12;

  if (!is8) return (
    <NoMatch
      icon="🔮" color={C.amber}
      title="शुक्र अष्टम भाव (Venus in 8th)"
      conditions={[
        `शुक्र 8वें भाव में हो (गुप्त इच्छाएं, यौन जटिलता, विरासत से संबंध) — अभी: शुक्र ${veH||"?"}वें में`,
        "8वें भाव का शुक्र = सबसे गहरी कामुकता, रहस्यमय आकर्षण",
      ]}
    />
  );

  const risk = is8?"extreme":is12?"high":"low";
  const rc = {extreme:C.amber,high:C.rose,low:C.green}[risk];
  const riskColors = { extreme:C.amber, high:C.rose, medium:C.amber, low:C.green, none:C.green };
  const activeH = veH||8;
  const hfx = V8_HOUSE_FX[activeH];
  return (
    <Card color={C.amber}>
      <SLabel color={C.amber}>🔮 शुक्र — अष्टम भाव विश्लेषण</SLabel>
      <div className="p-4 rounded-xl mb-4" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          शुक्र {veH?`${veH}वें में`:"—"} — <RiskBadge risk={risk}/>
        </div>
        <div className="text-[12px] text-slate-300 mb-2" style={HI}>
          {is8?"8वें भाव में शुक्र = गुप्त इच्छाएं, रहस्यमय आकर्षण, विरासत से संबंध, कामुकता में जटिलता।":
           is12?"12वें में शुक्र = बेड सुख + गुप्त जीवन + विदेश प्रेम।":
           "शुक्र अन्य भाव में — 8वें का प्रभाव मध्यम।"}
        </div>
        <Bar value={is8?88:is12?65:25} max={100} color={rc}/>
      </div>

      {/* 12-house reference */}
      <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>शुक्र के भाव अनुसार अष्टम प्रभाव:</div>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
          const hd=V8_HOUSE_FX[h];
          const isActive=h===veH, isSel=h===activeH;
          return <button key={h}
            className="py-2.5 rounded-xl text-[12px] font-black transition-all flex flex-col items-center"
            style={{
              background:isActive?`${C.amber}25`:"rgba(255,255,255,.03)",
              border:isActive?`2px solid ${C.amber}55`:`1px solid ${riskColors[hd?.risk||"low"]}20`,
              color:isActive?C.amber:riskColors[hd?.risk||"low"],
            }}>
            {h}<span className="text-[7px]">{hd?.risk==="extreme"?"🔴🔴":hd?.risk==="high"?"🔴":hd?.risk==="medium"?"🟡":"🟢"}</span>
            {isActive&&<span className="text-[7px] text-amber-400" style={HI}>शुक्र</span>}
          </button>;
        })}
      </div>
      {hfx&&<motion.div key={activeH} initial={{opacity:0}} animate={{opacity:1}}
        className="p-3.5 rounded-xl mb-3"
        style={{background:`${riskColors[hfx.risk]}08`,border:`1.5px solid ${riskColors[hfx.risk]}30`}}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[13px] font-black" style={{color:riskColors[hfx.risk],...HI}}>
            {activeH}वें भाव में शुक्र — अष्टम संदर्भ:
          </span>
          <RiskBadge risk={hfx.risk}/>
        </div>
        <div className="text-[12px] text-slate-200" style={HI}>{hfx.fx}</div>
      </motion.div>}
      <div className="p-3 rounded-xl" style={{background:"rgba(245,158,11,.07)",border:"1px solid rgba(245,158,11,.2)"}}>
        <div className="text-[12px] font-bold text-amber-400 mb-2" style={HI}>🛡️ शुक्र-अष्टम उपाय:</div>
        {["शुक्र मंत्र जप — 108 बार प्रतिदिन","सफेद फूल और खीर का दान","8वें भाव की शांति — मोती रत्न","गुप्त संबंधों से दूर रहें — कर्म भोगना पड़ेगा","योग + ध्यान — इच्छाओं पर नियंत्रण"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 8: Gandharva Yoga (Love Marriage)
function GandharvaBlock({ planets }) {
  const p = planets || {};
  const veH=p.Ve?.house, moH=p.Mo?.house, juH=p.Ju?.house, maH=p.Ma?.house;
  const ve5=veH===5, ve7=veH===7, mo5=moH===5, ju5=juH===5;
  const mars7=(maH===7);
  let yogaScore=0;
  if(ve5) yogaScore+=30;
  if(ve7) yogaScore+=25;
  if(mo5) yogaScore+=20;
  if(ju5) yogaScore+=20;
  if(mars7) yogaScore-=15;
  yogaScore=Math.max(0,Math.min(100,yogaScore));

  if (yogaScore < 20) return (
    <NoMatch
      icon="💞" color={C.teal}
      title="गंधर्व योग (प्रेम विवाह का संकेत)"
      conditions={[
        `शुक्र 5वें भाव में हो (+30 अंक) — अभी: शुक्र ${veH||"?"}वें में`,
        `शुक्र 7वें भाव में हो (+25 अंक) — अभी: शुक्र ${veH||"?"}वें में`,
        `चंद्र 5वें भाव में हो (+20 अंक) — अभी: चंद्र ${moH||"?"}वें में`,
        `गुरु 5वें भाव में हो (+20 अंक) — अभी: गुरु ${juH||"?"}वें में`,
        "कम से कम 20 अंक जरूरी (ऊपर में से कोई एक शर्त मिले)",
      ]}
    />
  );

  const risk = yogaScore>=70?"extreme":yogaScore>=50?"high":yogaScore>=30?"medium":"low";
  const rc = yogaScore>=70?C.green:yogaScore>=50?C.cyan:yogaScore>=30?C.amber:C.rose;
  // Note: for Gandharva, higher score = BETTER (love marriage)
  return (
    <Card color={C.teal}>
      <SLabel color={C.teal}>💞 गंधर्व योग — प्रेम विवाह का संकेत</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          गंधर्व योग शक्ति: {yogaScore}/100 — {yogaScore>=70?"✅✅ प्रबल":yogaScore>=50?"✅ सशक्त":yogaScore>=30?"⚡ संभव":"⚠️ कम"}
        </div>
        <div className="text-[12px] text-slate-300 mb-2" style={HI}>
          {yogaScore>=70?"प्रेम विवाह की बहुत संभावना है। प्रेम प्रसंग में शुभ।":
           yogaScore>=50?"प्रेम विवाह संभव — कुछ बाधाएं हो सकती हैं।":
           yogaScore>=30?"प्रेम तो होगा, विवाह में माता-पिता की भूमिका।":
           "अरेंज मैरेज की संभावना अधिक — गंधर्व योग कमजोर।"}
        </div>
        <Bar value={yogaScore} max={100} color={rc}/>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          {cond:ve5,txt:"शुक्र 5वें में",yes:"✅ प्रेम विवाह योग",no:"शुक्र 5वें में नहीं"},
          {cond:ve7,txt:"शुक्र 7वें में",yes:"✅ विवाह भाव में शुक्र",no:"शुक्र 7वें में नहीं"},
          {cond:mo5,txt:"चंद्र 5वें में",yes:"✅ भावुक प्रेम योग",no:"चंद्र 5वें में नहीं"},
          {cond:ju5,txt:"गुरु 5वें में",yes:"✅✅ सबसे शुभ — बुद्धिमान साथी",no:"गुरु 5वें में नहीं"},
        ].map((item,i)=>(
          <div key={i} className="p-2.5 rounded-xl"
            style={{background:item.cond?"rgba(74,222,128,.08)":"rgba(255,255,255,.03)",
              border:`1px solid ${item.cond?"rgba(74,222,128,.25)":"rgba(255,255,255,.07)"}`}}>
            <div className="text-[10px] text-slate-500 mb-0.5" style={HI}>{item.txt}</div>
            <div className="text-[11px] font-bold" style={{color:item.cond?C.green:C.rose,...HI}}>
              {item.cond?item.yes:item.no}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(45,212,191,.07)",border:"1px solid rgba(45,212,191,.2)"}}>
        <div className="text-[12px] font-bold text-teal-400 mb-2" style={HI}>💞 गंधर्व योग के लिए उपाय:</div>
        {["शुक्र + गुरु — दोनों मजबूत करें","प्रेम विवाह से पहले परिवार से आशीर्वाद","शुक्रवार + गुरुवार दोनों व्रत","कन्यादान करें — प्रेम योग बढ़ेगा","राधा-कृष्ण या शिव-पार्वती पूजा"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW BLOCK: Ketu-Venus ──────────────────────────────────────
function KetuVenusBlock({ planets }) {
  const p = planets||{};
  const keH=p.Ke?.house, veH=p.Ve?.house;
  const together=keH&&veH&&keH===veH;
  const ketu7or5=(keH===7||keH===5||keH===12);
  const ketuMod = keH&&[8,4].includes(keH);
  const risk=together?"extreme":ketu7or5?"high":ketuMod?"medium":"low";

  if (risk === "low") return (
    <NoMatch
      icon="🌑" color={C.blue}
      title="केतु-शुक्र द्वंद्व (Ketu-Venus Detachment)"
      conditions={[
        `केतु और शुक्र एक ही भाव में हों (युति) — अभी: केतु ${keH||"?"}वें, शुक्र ${veH||"?"}वें`,
        `केतु 7वें, 5वें, या 12वें भाव में हो (विवाह/प्रेम/व्यय भाव)`,
        `केतु 8वें या 4थे भाव में हो (मध्यम प्रभाव)`,
      ]}
    />
  );

  const rc={extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];

  const KETU_HOUSE_FX={
    1:"केतु लग्न में = वैरागी स्वभाव। प्रेम में अरुचि। आत्मज्ञान की खोज। रिश्तों में उदासीनता।",
    2:"2रे में केतु = परिवार से अलगाव। बोलने में कटुता। धन में उतार-चढ़ाव।",
    3:"3रे में केतु = भाई-बहन से दूरी। यात्राओं में रहस्य। लेखन में गहराई।",
    4:"4थे में केतु = माता से दूरी। घर में अशांति। भावनात्मक असुरक्षा।",
    5:"5वें में केतु = ⚠️ प्रेम में विश्वासघात। संतान में कठिनाई। पुराने प्रेम की याद।",
    6:"6ठे में केतु = शत्रु नाश। रोग से मुक्ति। सेवा भाव।",
    7:"7वें में केतु = ⚠️ विवाह में देरी या विच्छेद। साथी से आत्मिक दूरी। रहस्यमय साथी।",
    8:"8वें में केतु = मृत्यु का भय। गुप्त विद्या। पिछले जन्म का असर।",
    9:"9वें में केतु = धर्म में प्रश्न। गुरु से विरोध। आध्यात्मिक साधना।",
    10:"10वें में केतु = करियर में उतार-चढ़ाव। असामान्य व्यवसाय।",
    11:"11वें में केतु = मित्रों से धोखा। लाभ में अनिश्चितता।",
    12:"12वें में केतु = मोक्ष योग। वैराग्य। विदेश में एकांत।",
  };

  return (
    <Card color={C.blue}>
      <SLabel color={C.blue}>🌑 केतु-शुक्र द्वंद्व (Ketu-Venus Detachment)</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 केतु = वैराग्य + आत्मज्ञान। शुक्र = भोग + प्रेम। जब दोनों एक साथ हों या केतु शुक्र पर दृष्टि डाले — तो व्यक्ति "चाहते हुए भी नहीं चाहता"। प्रेम में रहस्यमय उदासीनता आती है।
        </div>
      </div>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌑</span>
          <div className="flex-1">
            <div className="text-[15px] font-black" style={{color:rc,...HI}}>
              केतु-शुक्र — <RiskBadge risk={risk}/>
            </div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              केतु {keH?`${keH}वें में`:"—"} | शुक्र {veH?`${veH}वें में`:"—"}
              {together?" = एक ही भाव में (सबसे तीव्र)":""}
            </div>
          </div>
        </div>
        <Bar value={risk==="extreme"?88:risk==="high"?65:risk==="medium"?40:20} max={100} color={rc}/>
        <div className="mt-2 text-[12px]" style={{color:rc,...HI}}>
          {together?"🌑 केतु-शुक्र युति = प्रेम और वैराग्य का गहरा संघर्ष। रिश्तों में रहस्यमयी उदासीनता।":
           ketu7or5?"⚠️ केतु विवाह/प्रेम भाव में = रिश्तों में असामान्य अनुभव":"मध्यम प्रभाव"}
        </div>
      </div>
      <div className="mb-3">
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>केतु के 12 भावों में प्रभाव:</div>
        {keH&&<div className="p-3 rounded-xl mb-2" style={{background:`${C.blue}10`,border:`1.5px solid ${C.blue}30`}}>
          <div className="text-[12px] font-bold text-blue-400 mb-1" style={HI}>इस कुंडली में केतु {keH}वें भाव में:</div>
          <div className="text-[12px] text-slate-200" style={HI}>{KETU_HOUSE_FX[keH]}</div>
        </div>}
      </div>
      <div className="grid grid-cols-1 gap-2">
        <div className="p-3 rounded-xl" style={{background:"rgba(96,165,250,.07)",border:"1px solid rgba(96,165,250,.2)"}}>
          <div className="text-[12px] font-bold text-blue-400 mb-2" style={HI}>केतु-शुक्र विशेष लक्षण:</div>
          {["प्रेम में 'चाहते हुए भी नहीं चाहना' — अजीब भावना","रिश्ते शुरू होते हैं, अचानक ठंडे पड़ जाते हैं",
            "आत्मिक साथी की तलाश — सामान्य रिश्ते में मन नहीं लगता","पिछले जन्म के रिश्ते इस जन्म में आते हैं",
            "एकांत और ध्यान में सुख — भीड़ से दूर रहना पसंद"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(96,165,250,.07)",border:"1px solid rgba(96,165,250,.2)"}}>
          <div className="text-[12px] font-bold text-blue-400 mb-2" style={HI}>🛡️ केतु शांति उपाय:</div>
          {["केतु मंत्र: ॐ कें केतवे नमः — 108 बार","गणेश पूजा — केतु को गणेश का रूप माना जाता है",
            "शनिवार को काले तिल का दान","गरीब, अशक्त की सेवा — केतु का प्रमुख उपाय",
            "आत्मज्ञान की साधना — केतु की ऊर्जा को सकारात्मक दिशा दें"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── NEW BLOCK: Saturn-Venus ──────────────────────────────────────
function SaturnVenusBlock({ planets }) {
  const p=planets||{};
  const saH=p.Sa?.house, veH=p.Ve?.house;
  const together=saH&&veH&&saH===veH;
  const saAspVe=saH&&veH&&([saH+2,saH+6,saH+9].map(h=>((h-1)%12)+1).includes(veH));
  const saturn7=(saH===7); const saturn5=(saH===5);
  const conditionMet = together || saAspVe || saturn7 || saturn5;

  if (!conditionMet) return (
    <NoMatch
      icon="🪐" color={C.indigo}
      title="शनि-शुक्र संघर्ष (Saturn-Venus Conflict)"
      conditions={[
        `शनि और शुक्र एक ही भाव में हों (युति) — अभी: शनि ${saH||"?"}वें, शुक्र ${veH||"?"}वें`,
        "शनि 7वें भाव में हो (विवाह भाव)",
        "शनि 5वें भाव में हो (प्रेम भाव)",
        `शनि की 3री/7वीं/10वीं दृष्टि शुक्र पर पड़े`,
      ]}
    />
  );

  const risk=together?"extreme":saAspVe||saturn7?"high":saturn5?"high":"medium";
  const rc={extreme:C.red,high:C.indigo,medium:C.amber,low:C.green}[risk];

  return (
    <Card color={C.indigo}>
      <SLabel color={C.indigo}>🪐 शनि-शुक्र संघर्ष (Saturn-Venus Conflict)</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(129,140,248,.08)",border:"1px solid rgba(129,140,248,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 शनि = देरी + कर्म + वृद्धावस्था। शुक्र = प्रेम + यौवन + सौंदर्य। ये दोनों स्वभाव से विपरीत हैं। शनि का शुक्र पर प्रभाव = प्रेम में देरी, वृद्ध साथी का योग, या प्रेम में कठोरता।
        </div>
      </div>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          शनि {saH?`${saH}वें में`:"—"} — शुक्र {veH?`${veH}वें में`:"—"} — <RiskBadge risk={risk}/>
        </div>
        <div className="text-[12px] text-slate-300 mb-2" style={HI}>
          {together?"🪐 शनि-शुक्र युति = विवाह बहुत देर से या कठिनाई से। प्रेम में भी संघर्ष।":
           saturn7?"🪐 शनि 7वें में = विवाह भाव में विलंब कारक। साथी वृद्ध या गंभीर स्वभाव का।":
           saturn5?"🪐 शनि 5वें में = प्रेम भाव में शनि = प्रेम में बाधा, संतान में देरी।":
           saAspVe?"🪐 शनि की शुक्र पर दृष्टि = प्रेम और विवाह में देरी।":"सामान्य प्रभाव"}
        </div>
        <Bar value={risk==="extreme"?85:risk==="high"?62:40} max={100} color={rc}/>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-xl" style={{background:"rgba(129,140,248,.08)",border:"1px solid rgba(129,140,248,.2)"}}>
          <div className="text-[11px] font-bold text-indigo-400 mb-2" style={HI}>⚠️ दुष्प्रभाव</div>
          {["विवाह देरी से — 28-35 वर्ष के बाद","साथी उम्र में बड़ा या गंभीर स्वभाव",
            "रिश्तों में ठंडापन और दूरी","प्रेम में हिचकिचाहट","वैवाहिक जीवन में responsibility भारी"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[11px] font-bold text-green-400 mb-2" style={HI}>✅ सकारात्मक</div>
          {["देर से विवाह = स्थायी विवाह","साथी जिम्मेदार और मेहनती","प्रेम में परिपक्वता","रिश्ते गहरे और टिकाऊ","व्यापारिक साझेदारी में लाभ"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(129,140,248,.07)",border:"1px solid rgba(129,140,248,.2)"}}>
        <div className="text-[11px] font-bold text-indigo-400 mb-2" style={HI}>🛡️ शनि-शुक्र उपाय:</div>
        {["शनिवार + शुक्रवार दोनों व्रत","शनि मंत्र: ॐ शं शनैश्चराय नमः + शुक्र मंत्र एक साथ","नीलम और हीरा — ज्योतिषी से पूछकर",
          "विवाह में जल्दबाजी मत करें — सही समय का इंतजार","वृद्धों और गरीबों की सेवा"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW BLOCK: Sun-Venus Combustion Effect ─────────────────────
function SunVenusBlock({ planets }) {
  const p=planets||{};
  const suH=p.Su?.house, veH=p.Ve?.house;
  const together=suH&&veH&&suH===veH;
  const adjacent=suH&&veH&&Math.abs(suH-veH)===1;

  if (!together && !adjacent) return (
    <NoMatch
      icon="☀️" color={C.yellow}
      title="सूर्य-शुक्र अस्त/दहन (Sun-Venus Combustion)"
      conditions={[
        `सूर्य और शुक्र एक ही भाव में हों (युति/दहन) — अभी: सूर्य ${suH||"?"}वें, शुक्र ${veH||"?"}वें`,
        "सूर्य और शुक्र आसपास के भावों में हों (1 भाव का अंतर)",
        "शुक्र का सूर्य से बहुत नजदीक होना = शुक्र अस्त होता है",
      ]}
    />
  );

  const risk=together?"extreme":adjacent?"high":"low";
  const rc={extreme:C.yellow,high:C.amber,low:C.green}[risk];

  const SUN_HOUSE_LOVE={
    1:"सूर्य लग्न = अहंकारी प्रेम। 'मेरी बात माननी होगी' — रिश्तों में वर्चस्व।",
    2:"सूर्य 2रे = पैसे वाले को प्राथमिकता। परिवार की राय सर्वोपरि।",
    3:"सूर्य 3रे = दोस्ती से प्रेम। भाई-बहन का प्रभाव।",
    4:"सूर्य 4थे = माता की पसंद से विवाह। घर-परिवार को प्राथमिकता।",
    5:"सूर्य 5वें = रोमांटिक पर अहंकारी। प्रेम में नेतृत्व चाहिए।",
    6:"सूर्य 6ठे = प्रेम में स्वास्थ्य समस्याएं। शत्रु प्रेम बिगाड़ते हैं।",
    7:"सूर्य 7वें = ⚠️ विवाह में अहम् टकराव। दोनों बराबर नहीं रह पाते।",
    8:"सूर्य 8वें = रहस्यमय आकर्षण। अचानक संबंध।",
    9:"सूर्य 9वें = गुरु जैसे साथी की चाह। धर्म एक हो तो विवाह।",
    10:"सूर्य 10वें = करियर प्रेम से ऊपर। प्रेम विवाह में कठिनाई।",
    11:"सूर्य 11वें = मित्रता से प्रेम। सामाजिक दबाव।",
    12:"सूर्य 12वें = गुप्त प्रेम। विदेश में संबंध।",
  };

  return (
    <Card color={C.yellow}>
      <SLabel color={C.yellow}>☀️ सूर्य-शुक्र प्रभाव (Sun-Venus Combustion)</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(252,211,77,.08)",border:"1px solid rgba(252,211,77,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 सूर्य = अहंकार + आत्मसम्मान। शुक्र = प्रेम + समर्पण। जब शुक्र सूर्य के बहुत पास हो (8° से कम) तो शुक्र "अस्त" हो जाता है — प्रेम अहंकार में डूब जाता है। विवाह देरी और मधुमेह का संकेत।
        </div>
      </div>
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
        <div className="text-[15px] font-black mb-2" style={{color:rc,...HI}}>
          सूर्य {suH?`${suH}वें`:"—"} | शुक्र {veH?`${veH}वें`:"—"} — <RiskBadge risk={risk}/>
        </div>
        <div className="text-[12px] text-slate-300 mb-2" style={HI}>
          {together?"☀️ सूर्य-शुक्र एक ही भाव में = अस्त शुक्र का योग! प्रेम और विवाह में अहंकार बाधक। सटीक जांच के लिए डिग्री देखें।":
           adjacent?"☀️ पड़ोसी भाव में = मध्यम प्रभाव। शुक्र की शक्ति थोड़ी कम।":
           "सूर्य-शुक्र दूर = अस्त का खतरा कम। शुक्र स्वतंत्र।"}
        </div>
        <Bar value={together?82:adjacent?50:20} max={100} color={rc}/>
      </div>
      {suH&&<div className="p-3 rounded-xl mb-3" style={{background:`${C.yellow}08`,border:`1px solid ${C.yellow}25`}}>
        <div className="text-[11px] font-bold text-yellow-400 mb-1.5" style={HI}>सूर्य {suH}वें भाव में — प्रेम पर प्रभाव:</div>
        <div className="text-[12px] text-slate-200" style={HI}>{SUN_HOUSE_LOVE[suH]}</div>
      </div>}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[11px] font-bold text-rose-400 mb-2" style={HI}>☀️ अस्त शुक्र के दुष्प्रभाव</div>
          {["विवाह में देरी और बाधाएं","मधुमेह का खतरा बढ़ता है","प्रेम में अहंकार — 'मेरे तरीके से होगा'",
            "पत्नी/प्रेमिका कमजोर या अस्वस्थ","सौंदर्य में कमी या त्वचा समस्याएं"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[11px] font-bold text-green-400 mb-2" style={HI}>✅ यदि शुक्र बली है</div>
          {["सूर्य के पास भी शुक्र = रचनात्मकता बढ़ती है","कला, संगीत, फिल्म में सफलता",
            "सूर्य की ऊर्जा + शुक्र का सौंदर्य = नेतृत्व में आकर्षण","नृत्य, अभिनय में प्रतिभा"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(252,211,77,.07)",border:"1px solid rgba(252,211,77,.2)"}}>
        <div className="text-[11px] font-bold text-yellow-400 mb-2" style={HI}>🛡️ सूर्य-शुक्र संतुलन उपाय:</div>
        {["रविवार सूर्य नमस्कार + शुक्रवार व्रत दोनों","माणिक्य और हीरा एक साथ न पहनें — विरोधी हैं",
          "सूर्य मंत्र: ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः","मधुमेह की जांच नियमित करवाएं",
          "अहंकार पर काम करें — रिश्तों में लचीलापन रखें"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW BLOCK: Manglik Dosha ──────────────────────────────────────
function ManglikBlock({ planets, lagna }) {
  const p=planets||{};
  const maH=p.Ma?.house;
  const MANGLIK_HOUSES=[1,4,7,8,12];
  const isManglik=maH&&MANGLIK_HOUSES.includes(maH);

  if (!isManglik) return (
    <NoMatch
      icon="♂️" color={C.rose}
      title="मांगलिक दोष (Manglik Dosha)"
      conditions={[
        `मंगल 1वें, 4वें, 7वें, 8वें, या 12वें भाव में हो — अभी: मंगल ${maH||"?"}वें में`,
        "7वें या 8वें = डबल मांगलिक (सबसे तीव्र)",
        "यह विवाह में सबसे प्रसिद्ध दोष है — इस कुंडली में मंगल सुरक्षित भाव में है",
      ]}
    />
  );

  // Double Manglik: Mars in 7th or 8th
  const isDouble=maH&&[7,8].includes(maH);
  // Partial cancellations
  const veH=p.Ve?.house, juH=p.Ju?.house;
  const ve7=veH===7, ju7=juH===7;
  const cancellations=[];
  if(ve7)cancellations.push("शुक्र 7वें में = मांगलिक दोष का आंशिक निवारण");
  if(ju7)cancellations.push("गुरु 7वें में = मांगलिक दोष का शक्तिशाली निवारण");
  if(p.Ma?.sign&&["Mesha","Aries","Vrischika","Scorpio"].some(s=>p.Ma.sign.includes(s)))
    cancellations.push("मंगल अपनी राशि में = मांगलिक दोष कम होता है");
  if(p.Ma?.sign&&["Makara","Capricorn"].some(s=>p.Ma.sign.includes(s)))
    cancellations.push("मंगल उच्च (मकर) में = दोष का निवारण");

  const risk=isDouble&&cancellations.length===0?"extreme":cancellations.length>=2?"medium":isDouble?"high":"medium";
  const rc={extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[risk];

  const MANGLIK_HOUSE_FX={
    1:"मंगल लग्न में = मांगलिक योग। व्यक्तित्व में अग्नि। साथी पर हावी होने की प्रवृत्ति।",
    4:"मंगल 4थे में = घरेलू जीवन में तनाव। माता को कष्ट। घर में झगड़े।",
    7:"मंगल 7वें में = ⚠️ सबसे तीव्र मांगलिक। विवाह में बाधा। साथी को शारीरिक कष्ट।",
    8:"मंगल 8वें में = ⚠️ दोहरा मांगलिक। विधवा/विधुर योग। दुर्घटना सावधानी।",
    12:"मंगल 12वें में = गुप्त जीवन में तनाव। बेड रूम में संघर्ष। विदेश में समस्या।",
  };

  return (
    <Card color={C.rose}>
      <SLabel color={C.rose}>♂️ मांगलिक दोष — संपूर्ण विश्लेषण</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 मांगलिक दोष तब होता है जब मंगल ग्रह कुंडली के 1, 4, 7, 8, या 12वें भाव में हो। यह विवाह में देरी, साथी को कष्ट, या वैवाहिक तनाव का सबसे प्रसिद्ध दोष है। लेकिन निवारण होने पर यह दोष समाप्त हो जाता है।
        </div>
      </div>

      {/* Main status */}
      <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`2px solid ${rc}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{isManglik?"♂️":"✅"}</span>
          <div className="flex-1">
            <div className="text-[17px] font-black" style={{color:rc,...HI}}>
              {!isManglik?"मांगलिक नहीं ✅":isDouble?"दोहरा मांगलिक दोष 🔴🔴":"मांगलिक दोष — "+risk}
            </div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              मंगल {maH?`${maH}वें भाव में`:"स्थिति अज्ञात"}
              {isManglik&&` = मांगलिक भाव ${MANGLIK_HOUSES.indexOf(maH)+1}/5`}
            </div>
          </div>
          <RiskBadge risk={risk}/>
        </div>
        <Bar value={!isManglik?5:isDouble?88:55} max={100} color={rc}/>
        {maH&&MANGLIK_HOUSE_FX[maH]&&<div className="mt-2 text-[12px]" style={{color:rc,...HI}}>{MANGLIK_HOUSE_FX[maH]}</div>}
      </div>

      {/* 5 Manglik houses reference */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {MANGLIK_HOUSES.map(h=>(
          <div key={h} className="p-2 rounded-xl text-center"
            style={{background:maH===h?`${rc}20`:"rgba(255,255,255,.04)",
              border:`1.5px solid ${maH===h?rc+"50":"rgba(255,255,255,.08)"}`}}>
            <div className="text-[13px] font-black" style={{color:maH===h?rc:"#475569"}}>{h}वां</div>
            <div className="text-[8px] text-slate-500 mt-0.5" style={HI}>
              {h===1?"लग्न":h===4?"सुख":h===7?"विवाह":h===8?"आयु":"व्यय"}
            </div>
            {maH===h&&<div className="text-[8px] font-bold mt-1" style={{color:rc}}>♂ मंगल</div>}
          </div>
        ))}
      </div>

      {/* Cancellations */}
      {isManglik&&<div className="p-3 rounded-xl mb-3"
        style={{background:cancellations.length>0?"rgba(74,222,128,.08)":"rgba(251,113,133,.08)",
          border:`1px solid ${cancellations.length>0?"rgba(74,222,128,.25)":"rgba(251,113,133,.2)"}`}}>
        <div className="text-[12px] font-bold mb-2" style={{color:cancellations.length>0?C.green:C.rose,...HI}}>
          {cancellations.length>0?"✅ मांगलिक दोष निवारण:":"⚠️ निवारण नहीं — उपाय करें:"}
        </div>
        {cancellations.length>0
          ?cancellations.map((c2,i)=><div key={i} className="text-[11px] text-green-300" style={HI}>✅ {c2}</div>)
          :<div className="text-[11px] text-rose-300" style={HI}>मांगलिक दोष का कोई स्वाभाविक निवारण नहीं — कुंडली मिलान अनिवार्य</div>
        }
      </div>}

      <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.07)",border:"1px solid rgba(251,113,133,.2)"}}>
        <div className="text-[11px] font-bold text-rose-400 mb-2" style={HI}>🛡️ मांगलिक दोष उपाय:</div>
        {[isManglik?"मांगलिक से मांगलिक का विवाह — सबसे उत्तम":"कुंडली में दोष नहीं",
          "मंगलवार हनुमान चालीसा पाठ","मंगल शांति पूजा — विवाह से पहले अनिवार्य",
          "लाल मूंगा — मंगल को बली करें (ज्योतिषी की सलाह से)","कुंभ विवाह (भस्मासुर भय निवारण के लिए)"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW BLOCK: 5th House Love Analysis ──────────────────────────
function FifthHouseBlock({ planets }) {
  const p=planets||{};
  const in5=Object.entries(p).filter(([c,pd])=>pd?.house===5);
  const PNAME={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};
  const benef=["Mo","Me","Ju","Ve"]; const malef=["Su","Ma","Sa","Ra","Ke"];

  const benefIn5=in5.filter(([c])=>benef.includes(c));
  const malefIn5=in5.filter(([c])=>malef.includes(c));
  const empty5=in5.length===0;

  // Only show if there's something significant in 5th house
  if (empty5) return (
    <NoMatch
      icon="💝" color={C.pink}
      title="5वां भाव — प्रेम विश्लेषण"
      conditions={[
        "5वें भाव में कोई शुभ ग्रह हो: शुक्र, गुरु, चंद्र, बुध (+प्रेम शक्ति)",
        "5वें भाव में कोई पाप ग्रह हो: मंगल, शनि, राहु, केतु, सूर्य (−प्रेम बाधा)",
        "5वां भाव खाली = प्रेम जीवन सामान्य, 5वें के स्वामी की स्थिति देखें",
      ]}
    />
  );

  // Love quality score
  let loveScore=50;
  benefIn5.forEach(([c])=>{loveScore+=c==="Ve"?20:c==="Ju"?15:c==="Mo"?12:8});
  malefIn5.forEach(([c])=>{loveScore-=c==="Sa"?15:c==="Ra"?15:c==="Ma"?10:8});
  loveScore=Math.max(5,Math.min(100,loveScore));
  const lc=loveScore>=70?C.green:loveScore>=45?C.cyan:loveScore>=25?C.amber:C.rose;

  const PLANET_LOVE_FX={
    Su:"सूर्य 5वें = अहंकारी प्रेम। 'मैं सही हूं' — रोमांटिक पर जिद्दी।",
    Mo:"चंद्र 5वें = भावुक और गहरा प्रेम। माता जैसा प्यार देते हैं।",
    Ma:"मंगल 5वें = ⚠️ उत्कट प्रेम! जल्दी आकर्षण, जल्दी टूटना। संतान देरी।",
    Me:"बुध 5वें = बौद्धिक प्रेम। दोस्ती से रिश्ता। मजाकिया साथी पसंद।",
    Ju:"गुरु 5वें = ✅✅ सर्वश्रेष्ठ! धार्मिक, समझदार साथी। प्रेम विवाह शुभ।",
    Ve:"शुक्र 5वें = ✅ प्रेम का आशीर्वाद! सुंदर साथी। प्रेम विवाह संभव।",
    Sa:"शनि 5वें = ⚠️ प्रेम देर से। गंभीर साथी। संतान में देरी। लेकिन स्थायी।",
    Ra:"राहु 5वें = ⚠️ असामान्य प्रेम प्रसंग। गुप्त संबंध। संतान में बाधा।",
    Ke:"केतु 5वें = वैराग्य प्रेम। रहस्यमय साथी। संतान में बाधा।",
  };

  return (
    <Card color={C.pink}>
      <SLabel color={C.pink}>💝 5वां भाव — प्रेम का घर (5th House Love)</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(244,114,182,.08)",border:"1px solid rgba(244,114,182,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 ज्योतिष में 5वां भाव = प्रेम, रोमांस, पूर्व जन्म के पुण्य, संतान और रचनात्मकता। इस भाव में जो ग्रह हो उससे जानें — आपका प्रेम जीवन कैसा होगा?
        </div>
      </div>

      {/* Love Score */}
      <div className="p-4 rounded-xl mb-3" style={{background:`${lc}12`,border:`1.5px solid ${lc}35`}}>
        <div className="text-center mb-2">
          <div className="text-[32px] font-black" style={{color:lc}}>{loveScore}/100</div>
          <div className="text-[13px] font-black" style={{color:lc,...HI}}>
            {loveScore>=70?"💕 प्रेम जीवन बहुत शुभ":loveScore>=45?"💛 ठीक-ठाक प्रेम जीवन":loveScore>=25?"🟡 संघर्ष है, पर प्रेम होगा":"🔴 प्रेम में कठिनाई — उपाय करें"}
          </div>
        </div>
        <Bar value={loveScore} max={100} color={lc}/>
      </div>

      {/* Planets in 5th */}
      <div className="mb-3">
        {empty5?(
          <div className="p-3 rounded-xl text-center" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
            <div className="text-[13px] text-slate-400" style={HI}>5वें भाव में कोई ग्रह नहीं</div>
            <div className="text-[11px] text-slate-500 mt-1" style={HI}>5वें भाव का स्वामी देखें और उसकी स्थिति से प्रेम का फल जानें</div>
          </div>
        ):in5.map(([code,pd])=>(
          <div key={code} className="p-3 rounded-xl mb-2"
            style={{background:benef.includes(code)?"rgba(74,222,128,.08)":"rgba(251,113,133,.08)",
              border:`1.5px solid ${benef.includes(code)?"rgba(74,222,128,.25)":"rgba(251,113,133,.2)"}`}}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[14px] font-black" style={{color:benef.includes(code)?C.green:C.rose,...HI}}>
                {PNAME[code]||code} 5वें भाव में</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{background:benef.includes(code)?"rgba(74,222,128,.2)":"rgba(251,113,133,.15)",
                  color:benef.includes(code)?C.green:C.rose,...HI}}>
                {benef.includes(code)?"शुभ":"पाप"}
              </span>
            </div>
            <div className="text-[12px] text-slate-200" style={HI}>{PLANET_LOVE_FX[code]||""}</div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl" style={{background:"rgba(244,114,182,.07)",border:"1px solid rgba(244,114,182,.2)"}}>
        <div className="text-[11px] font-bold text-pink-400 mb-2" style={HI}>🛡️ 5वें भाव को शक्तिशाली बनाने के उपाय:</div>
        {["गुरु पूजा — 5वें का कारक गुरु है","5वें के स्वामी ग्रह का उपाय करें","बच्चों और विद्यार्थियों को शिक्षा दान","मंदिर में मिठाई का प्रसाद चढ़ाएं","प्रेम में ईमानदारी — 5वें का पुण्य भाव"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ── NEW BLOCK: Naadi Dosha ───────────────────────────────────────
function NaadiDoshaBlock({ planets }) {
  const p=planets||{};
  const moNakshatra=p.Mo?.nakshatra||p.Mo?.nak||"";
  // Naadi classification by nakshatra
  const AADI_NAK=["Ashwini","Ardra","Punarvasu","Uttara Phalguni","Hasta","Jyeshtha","Moola","Shatabhisha","Purva Bhadrapada",
    "अश्विनी","आर्द्रा","पुनर्वसु","उत्तर फाल्गुनी","हस्त","ज्येष्ठा","मूल","शतभिषा","पूर्वाभाद्र"];
  const MADHYA_NAK=["Bharani","Mrigashira","Pushya","Purva Phalguni","Chitra","Anuradha","Purva Ashadha","Dhanishta","Uttara Bhadrapada",
    "भरणी","मृगशीर्ष","पुष्य","पूर्व फाल्गुनी","चित्रा","अनुराधा","पूर्वाषाढ़","धनिष्ठा","उत्तराभाद्र"];
  const ANTYA_NAK=["Krittika","Rohini","Ashlesha","Magha","Swati","Vishakha","Uttara Ashadha","Shravana","Revati",
    "कृत्तिका","रोहिणी","आश्लेषा","मघा","स्वाति","विशाखा","उत्तराषाढ़","श्रावण","रेवती"];

  const getNaadi=(nak)=>{
    if(!nak)return null;
    if(AADI_NAK.some(n=>nak.includes(n)))return "आदि";
    if(MADHYA_NAK.some(n=>nak.includes(n)))return "मध्य";
    if(ANTYA_NAK.some(n=>nak.includes(n)))return "अंत्य";
    return null;
  };
  const myNaadi=getNaadi(moNakshatra);

  return (
    <Card color={C.red}>
      <SLabel color={C.red}>🧬 नाड़ी दोष — वैवाहिक अनुकूलता</SLabel>
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}}>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          💡 नाड़ी दोष = 36 गुण मिलान में सबसे महत्वपूर्ण (8 गुण)। यदि वर-वधू की नाड़ी एक ही हो तो 8 गुण शून्य। यह संतान में दोष, विवाह में कष्ट, और स्वास्थ्य समस्याओं का सूचक है।
        </div>
      </div>

      {/* My Naadi */}
      <div className="p-4 rounded-xl mb-3" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)"}}>
        <div className="text-[13px] font-bold text-white mb-2" style={HI}>आपकी नाड़ी:</div>
        {moNakshatra ? (
          <div>
            <div className="text-[14px] font-black mb-1" style={{color:C.cyan,...HI}}>
              चंद्र नक्षत्र: {moNakshatra}
            </div>
            <div className="text-[16px] font-black mb-2" style={{color:myNaadi?C.amber:C.rose,...HI}}>
              नाड़ी: {myNaadi||"अज्ञात (Backend से नक्षत्र चाहिए)"}
            </div>
          </div>
        ):(
          <div className="text-[12px] text-slate-500" style={HI}>चंद्र नक्षत्र की जानकारी Backend से नहीं मिली। Nakshatra field check करें।</div>
        )}
      </div>

      {/* Three Naadis explained */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          {n:"आदि नाड़ी",col:C.cyan,naks:"अश्विनी, आर्द्रा, पुनर्वसु, उ.फाल्गु., हस्त, ज्येष्ठा, मूल, शतभिषा, पू.भाद्र"},
          {n:"मध्य नाड़ी",col:C.amber,naks:"भरणी, मृगशीर्ष, पुष्य, पू.फाल्गु., चित्रा, अनुराधा, पू.आषाढ़, धनिष्ठा, उ.भाद्र"},
          {n:"अंत्य नाड़ी",col:C.rose,naks:"कृत्तिका, रोहिणी, आश्लेषा, मघा, स्वाति, विशाखा, उ.आषाढ़, श्रावण, रेवती"},
        ].map((nd,i)=>(
          <div key={i} className="p-2.5 rounded-xl" style={{background:`${nd.col}10`,border:`1px solid ${nd.col}25`}}>
            <div className="text-[11px] font-black mb-1" style={{color:nd.col,...HI}}>{nd.n}</div>
            <div className="text-[9px] text-slate-500 leading-relaxed" style={HI}>{nd.naks}</div>
          </div>
        ))}
      </div>

      {/* Naadi Dosha effects */}
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)"}}>
        <div className="text-[12px] font-bold text-red-400 mb-2" style={HI}>⚠️ नाड़ी दोष होने पर:</div>
        {["विवाह के बाद स्वास्थ्य समस्याएं — दोनों को","संतान प्राप्ति में बाधा या संतान की समस्या",
          "वैवाहिक जीवन में बार-बार संकट","एक-दूसरे की ऊर्जा का विपरीत प्रभाव"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>

      {/* Cancellations */}
      <div className="p-3 rounded-xl mb-3" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
        <div className="text-[12px] font-bold text-green-400 mb-2" style={HI}>✅ नाड़ी दोष निवारण कब होता है?</div>
        {["यदि वर-वधू का जन्म नक्षत्र एक ही हो (राशि भिन्न हो तो दोष नहीं)",
          "यदि राशि भिन्न हो और सिर्फ नाड़ी एक हो — पूजा से निवारण",
          "जुड़वां राशि (मिथुन, धनु, मीन) में — आंशिक निवारण",
          "नाड़ी दोष निवारण पूजा करवाएं — विवाह से पहले"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>

      <div className="p-3 rounded-xl" style={{background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)"}}>
        <div className="text-[11px] font-bold text-red-400 mb-2" style={HI}>🛡️ नाड़ी दोष उपाय:</div>
        {["नाड़ी दोष निवारण पूजा — विद्वान ब्राह्मण द्वारा","महामृत्युंजय मंत्र जाप — 1,25,000 बार",
          "सोने का कंगन दान करें","कन्यादान का पुण्य — किसी गरीब कन्या के विवाह में सहयोग",
          "विवाह के दिन मृत्युंजय हवन अनिवार्य"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// Block 9: Self-Control Score
function SelfControlBlock({ planets, allScores }) {
  const p = planets || {};
  const juH=p.Ju?.house, saH=p.Sa?.house, keH=p.Ke?.house;
  const moH=p.Mo?.house, maH=p.Ma?.house, veH=p.Ve?.house, raH=p.Ra?.house;

  // Calculate self-control
  let score = 60; // base
  if(juH&&[1,4,5,7,9,10].includes(juH)) score+=15; // jupiter strong = good control
  if(saH&&[1,3,10,11].includes(saH)) score+=10;    // saturn discipline
  if(keH&&[4,8,12].includes(keH)) score+=8;          // ketu detachment
  if(maH===veH) score-=20;                           // mars-venus together
  if(raH===veH) score-=15;                           // rahu-venus together
  if(veH===12||veH===8) score-=10;                   // venus in bad house
  if(maH&&[7,12].includes(maH)) score-=8;
  if(moH&&[6,8,12].includes(moH)) score-=5;         // moon afflicted
  score = Math.max(5, Math.min(100, score));

  const label = score>=70?"✅ अच्छा नियंत्रण":score>=45?"⚡ मध्यम — ध्यान रखें":score>=25?"⚠️ कमजोर — मदद लें":"🚨 बहुत कमजोर";
  const sc = score>=70?C.green:score>=45?C.amber:score>=25?C.rose:C.red;

  const FACTORS=[
    {icon:"♃",name:"गुरु बल",val:juH&&[1,4,5,9,10].includes(juH)?"+15 (बली)":juH&&[6,8,12].includes(juH)?"-10 (कमजोर)":"0 (सामान्य)",col:juH&&[1,4,5,9,10].includes(juH)?C.green:juH&&[6,8,12].includes(juH)?C.rose:C.amber},
    {icon:"♄",name:"शनि अनुशासन",val:saH&&[1,3,10].includes(saH)?"+10 (अनुशासित)":"0 (सामान्य)",col:saH&&[1,3,10].includes(saH)?C.green:C.amber},
    {icon:"☋",name:"केतु वैराग्य",val:keH&&[4,8,12].includes(keH)?"+8 (वैरागी)":"0 (सामान्य)",col:keH&&[4,8,12].includes(keH)?C.green:C.amber},
    {icon:"🔥",name:"मंगल-शुक्र युति",val:maH===veH?"-20 (खतरनाक)":"0 (ठीक)",col:maH===veH?C.red:C.green},
    {icon:"🌀",name:"राहु-शुक्र युति",val:raH===veH?"-15 (खतरनाक)":"0 (ठीक)",col:raH===veH?C.red:C.green},
    {icon:"♀",name:"शुक्र 8/12 में",val:(veH===8||veH===12)?"-10 (कमजोर)":"0 (ठीक)",col:(veH===8||veH===12)?C.rose:C.green},
  ];

  return (
    <Card color={C.cyan}>
      <SLabel color={C.cyan}>🧘 आत्म-नियंत्रण अंक — कुल स्कोर</SLabel>
      <div className="p-5 rounded-xl mb-4" style={{background:`${sc}10`,border:`2px solid ${sc}35`}}>
        <div className="text-center mb-3">
          <div className="text-[48px] font-black" style={{color:sc}}>{score}</div>
          <div className="text-[13px] font-black" style={{color:sc,...HI}}>{label}</div>
          <div className="text-[11px] text-slate-500 mt-1" style={HI}>0 = बिल्कुल नहीं | 100 = पूर्ण नियंत्रण</div>
        </div>
        <Bar value={score} max={100} color={sc}/>
        <div className="mt-2 text-[12px] text-center" style={{color:sc,...HI}}>
          {score>=70?"अच्छे संयम के साथ आप सफल और सुखी जीवन जी सकते हैं।":
           score>=45?"सचेत प्रयास से नियंत्रण पाया जा सकता है।":
           "ध्यान और गुरु की मदद लें — नियंत्रण संभव है।"}
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="mb-3">
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>स्कोर के कारण:</div>
        {FACTORS.map((f,i)=>(
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
            <span className="text-[14px]">{f.icon}</span>
            <span className="text-[11px] text-slate-400 flex-1" style={HI}>{f.name}</span>
            <span className="text-[11px] font-bold" style={{color:f.col,...HI}}>{f.val}</span>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl" style={{background:"rgba(34,211,238,.07)",border:"1px solid rgba(34,211,238,.2)"}}>
        <div className="text-[12px] font-bold text-cyan-400 mb-2" style={HI}>🧘 नियंत्रण बढ़ाने के उपाय:</div>
        {["प्रतिदिन ध्यान (Meditation) — 20 मिनट",
          "ब्रह्मचर्य व्रत — महीने में 4 दिन",
          "सात्विक आहार — तामसिक भोजन से दूर",
          "सत्संग — अच्छी संगति का प्रभाव",
          "गुरु मंत्र: ॐ गुं गुरवे नमः — 108 बार रोज",
          score<45?"मनोचिकित्सक से मार्गदर्शन लें — कोई शर्म नहीं":"योग + प्राणायाम — ऊर्जा सही दिशा में"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// SUMMARY TAB
// ─────────────────────────────────────────────────
function SummaryBlock({ planets }) {
  const p = planets||{};
  const maH=p.Ma?.house, veH=p.Ve?.house, raH=p.Ra?.house, moH=p.Mo?.house;
  const juH=p.Ju?.house, saH=p.Sa?.house, keH=p.Ke?.house;

  const yogas=[
    {name:"मंगल-शुक्र युति",active:maH&&veH&&maH===veH,icon:"🔥",risk:"extreme"},
    {name:"राहु-शुक्र युति",active:raH&&veH&&raH===veH,icon:"🌀",risk:"extreme"},
    {name:"7वां भाव afflicted",active:Object.values(p).filter(pd=>pd?.house===7&&["Ma","Sa","Ra"].includes(Object.keys(p).find(k=>p[k]===pd))).length>=2,icon:"⚔️",risk:"high"},
    {name:"शुक्र 12वें में",active:veH===12,icon:"💫",risk:"high"},
    {name:"शुक्र 8वें में",active:veH===8,icon:"🔮",risk:"medium"},
    {name:"चंद्र-मंगल युति",active:moH&&maH&&moH===maH,icon:"🌊",risk:"high"},
    {name:"गुरु 5वें में (शुभ)",active:juH===5,icon:"✅",risk:"none"},
    {name:"शनि बली (नियंत्रण)",active:saH&&[1,3,10].includes(saH),icon:"✅",risk:"none"},
  ];
  const activeYogas=yogas.filter(y=>y.active);
  const riskYogas=activeYogas.filter(y=>y.risk!=="none");

  // Overall risk score
  let riskScore=50;
  if(maH===veH)riskScore+=25;
  if(raH===veH)riskScore+=20;
  if(veH===12)riskScore+=15;
  if(moH===maH)riskScore+=10;
  if(juH&&[1,5,9].includes(juH))riskScore-=15;
  if(saH&&[1,10].includes(saH))riskScore-=10;
  if(keH&&[8,12].includes(keH))riskScore-=5;
  riskScore=Math.max(10,Math.min(100,riskScore));
  const rc=riskScore>=75?C.red:riskScore>=55?C.rose:riskScore>=35?C.amber:C.green;

  return (
    <div className="space-y-3">
      {/* Overall score */}
      <Card color={rc}>
        <SLabel color={rc}>📊 कामुकता विश्लेषण सारांश</SLabel>
        <div className="p-4 rounded-xl mb-3" style={{background:`${rc}12`,border:`1.5px solid ${rc}35`}}>
          <div className="text-center mb-3">
            <div className="text-[36px] font-black" style={{color:rc}}>{riskScore}/100</div>
            <div className="text-[14px] font-black" style={{color:rc,...HI}}>
              {riskScore>=75?"🔴 उच्च जोखिम":riskScore>=55?"🟠 मध्यम-उच्च":riskScore>=35?"🟡 मध्यम":"🟢 कम जोखिम"}
            </div>
          </div>
          <Bar value={riskScore} max={100} color={rc}/>
        </div>

        {/* Active yogas */}
        <div className="mb-3">
          <div className="text-[12px] font-bold text-slate-400 mb-2" style={HI}>सक्रिय योग:</div>
          {activeYogas.length>0 ? activeYogas.map((y,i)=>(
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
              <span className="text-[14px]">{y.icon}</span>
              <span className="text-[11px] font-bold" style={{color:y.risk==="none"?C.green:y.risk==="extreme"?C.red:y.risk==="high"?C.rose:C.amber,...HI}}>{y.name}</span>
              {y.risk!=="none"&&<RiskBadge risk={y.risk}/>}
            </div>
          )) : <div className="text-[12px] text-green-400" style={HI}>✅ कोई विशेष योग नहीं — जीवन सामान्य</div>}
        </div>

        {/* Guidance */}
        <div className="p-3 rounded-xl mb-2" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
          <div className="text-[12px] font-bold text-slate-300 mb-2" style={HI}>📋 मार्गदर्शन:</div>
          {(riskYogas.length>=3
            ?["विवाह पूर्व साथी चयन अत्यंत सावधानी से करें","Counseling लें — कोई कमजोरी नहीं है यह","आध्यात्मिक मार्ग अपनाएं — शक्ति मिलेगी","योग/ध्यान नियमित — मन नियंत्रित होगा"]
            :riskYogas.length>=1
            ?["सात्विक जीवन और अच्छी संगति","एक साथी के प्रति समर्पण","प्रेम में जल्दबाजी मत करें","परिवार का सम्मान और आशीर्वाद"]
            :["आपका जीवन संतुलित है","अपने साथी का सम्मान करें","आध्यात्मिकता से जीवन और निखरेगा","प्रेम और विवाह में भाग्य शुभ"]
          ).map((r,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>)}
        </div>

        {/* Remedies */}
        <div className="p-3 rounded-xl" style={{background:`${rc}07`,border:`1px solid ${rc}20`}}>
          <div className="text-[12px] font-bold mb-2" style={{color:rc,...HI}}>🛡️ समग्र उपाय:</div>
          {["शुक्रवार व्रत — शुक्र का उपाय","शिव-पार्वती पूजा — दांपत्य सुख","ब्रह्मचर्य अभ्यास — कुछ दिन","सत्संग में भाग लें","गुरु मंत्र + शुक्र मंत्र रोज"].map((r,i)=>(
            <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────
export default function KamuktaPanel({ chartData }) {
  const pl = chartData?.planets || {};
  const [activeTab, setActiveTab] = useState("summary");
  const tabScrollRef = useRef(null);

  const scrollTabs = (dir) => {
    if(tabScrollRef.current) {
      tabScrollRef.current.scrollBy({ left: dir * 160, behavior:"smooth" });
    }
  };

  const TABS = [
    { k:"summary", l:"📊 सारांश",         color:C.cyan   },
    ...ALIGNMENTS.map(a=>({ k:a.k, l:`${a.icon} ${a.title}`, color:a.color }))
  ];

  const renderTab = () => {
    switch(activeTab) {
      case "ketu":   return <KetuVenusBlock planets={pl}/>;
      case "sv":     return <SaturnVenusBlock planets={pl}/>;
      case "sunv":   return <SunVenusBlock planets={pl}/>;
      case "mang":   return <ManglikBlock planets={pl} lagna={chartData?.lagna||0}/>;
      case "5th":    return <FifthHouseBlock planets={pl}/>;
      case "naadi":  return <NaadiDoshaBlock planets={pl}/>;
      case "mv":    return <MVBlock planets={pl}/>;
      case "rv":    return <RVBlock planets={pl}/>;
      case "mmv":   return <MMVBlock planets={pl}/>;
      case "7th":   return <House7Block planets={pl}/>;
      case "v12":   return <Venus12Block planets={pl}/>;
      case "scorp": return <ScorpBlock planets={pl}/>;
      case "v8":    return <Venus8Block planets={pl}/>;
      case "gandh": return <GandharvaBlock planets={pl}/>;
      case "self":  return <SelfControlBlock planets={pl}/>;
      case "summary":default: return <SummaryBlock planets={pl}/>;
    }
  };

  // Find active alignment info
  const activeAlign = ALIGNMENTS.find(a=>a.k===activeTab);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="p-4 rounded-2xl mb-4" style={{background:"rgba(244,114,182,.08)",border:"1px solid rgba(244,114,182,.2)"}}>
        <div className="text-[16px] font-black text-pink-400 mb-1" style={HI}>💕 कामुकता एवं व्यभिचार विश्लेषण</div>
        <div className="text-[11px] text-slate-500" style={HI}>यह विश्लेषण ज्योतिषीय शिक्षा के उद्देश्य से है। मार्गदर्शन के लिए विद्वान ज्योतिषी से परामर्श लें।</div>
      </div>

      {/* Tab bar — arrow scrollable */}
      <div className="relative mb-4">
        {/* Left arrow */}
        <button onClick={()=>scrollTabs(-1)}
          className="absolute left-0 top-0 bottom-0 z-10 px-1.5 rounded-l-xl flex items-center justify-center"
          style={{background:"linear-gradient(to right,rgba(8,12,28,1) 60%,transparent)",minWidth:"28px"}}>
          <span className="text-[16px] font-black" style={{color:"#475569"}}>‹</span>
        </button>

        {/* Scrollable tabs */}
        <div ref={tabScrollRef}
          className="flex gap-1.5 overflow-x-auto px-7 pb-1"
          style={{scrollbarWidth:"none",msOverflowStyle:"none"}}>
          {TABS.map(t=>{
            const isActive = activeTab===t.k;
            return (
              <button key={t.k} onClick={()=>setActiveTab(t.k)}
                className="flex-shrink-0 px-3 py-2 rounded-xl text-[10px] font-black transition-all"
                style={{
                  background:isActive?`${t.color}20`:"rgba(255,255,255,.04)",
                  color:isActive?t.color:"#475569",
                  border:isActive?`2px solid ${t.color}45`:"1px solid rgba(255,255,255,.07)",
                  boxShadow:isActive?`0 0 12px ${t.color}25`:"none",
                  ...HI
                }}>
                {t.l}
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button onClick={()=>scrollTabs(1)}
          className="absolute right-0 top-0 bottom-0 z-10 px-1.5 rounded-r-xl flex items-center justify-center"
          style={{background:"linear-gradient(to left,rgba(8,12,28,1) 60%,transparent)",minWidth:"28px"}}>
          <span className="text-[16px] font-black" style={{color:"#475569"}}>›</span>
        </button>
      </div>

      {/* Tab description */}
      {activeAlign && (
        <div className="p-3 rounded-xl mb-4" style={{background:`${activeAlign.color}08`,border:`1px solid ${activeAlign.color}20`}}>
          <div className="text-[12px] font-bold mb-0.5" style={{color:activeAlign.color,...HI}}>
            {activeAlign.icon} {activeAlign.title} — {activeAlign.subtitle}
          </div>
          <div className="text-[11px] text-slate-400" style={HI}>{activeAlign.desc}</div>
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}