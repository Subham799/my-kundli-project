// GocharPanel.jsx — गोचर एवं दशा पूर्वानुमान
// Auto-detects today's date → calculates current transits → predicts Shani/Guru/Rahu gochar effects
// Falls back to asking user for date if needed
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DailyGocharTab from './DailyGocharTab';   // ← NEW

const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C  = { amber:"#F59E0B", cyan:"#22D3EE", rose:"#FB7185", green:"#4ADE80",
             purple:"#C084FC", indigo:"#818CF8", orange:"#FB923C", teal:"#2DD4BF",
             red:"#EF4444", yellow:"#FCD34D", pink:"#F472B6", blue:"#60A5FA",
             slate:"#94A3B8" };

function Bar({ value=0, max=100, color=C.amber }) {
  const pct=Math.min(100,Math.max(0,(value/max)*100));
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div className="h-full rounded-full"
          style={{background:color,boxShadow:`0 0 10px ${color}40`}}
          initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,ease:"easeOut"}}/>
      </div>
      <span className="text-[12px] font-black w-8 text-right" style={{color}}>{value}</span>
    </div>
  );
}
function Card({children,color=C.amber,className=""}) {
  return <div className={`p-4 rounded-2xl border mb-3 ${className}`}
    style={{background:"rgba(8,12,28,.97)",borderColor:`${color}30`}}>{children}</div>;
}
function SLabel({children,color=C.amber}) {
  return <div className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{color}}>
    <span className="flex-1 h-px" style={{background:`${color}30`}}/>
    <span style={HI}>{children}</span>
    <span className="flex-1 h-px" style={{background:`${color}30`}}/>
  </div>;
}

// ══════════════════════════════════════════════════
// TRANSIT POSITION CALCULATOR
// Approximate planet positions based on date
// Using simplified orbital periods (sidereal)
// ══════════════════════════════════════════════════

// Sidereal sign of a planet on a given date (approximate)
// Reference: Saturn in Aquarius (Kumbha) from Jan 2023
const SIGN_NAMES_HI=["मेष","वृष","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
const SIGN_NAMES_EN=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function getTransitPositions(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const dayOfYear = Math.floor((d - new Date(year, 0, 0)) / 86400000);
  const fracYear = year + dayOfYear / 365.25;

  // Saturn: ~2.46 years per sign. Was in Makara (10) at Jan 2020, Kumbha (11) from Jan 2023
  // Meena (12) from ~Mar 2025
  const saturnBase = 10; // Makara at Jan 2020
  const saturnYearsFrom2020 = fracYear - 2020;
  const saturnSignOffset = Math.floor(saturnYearsFrom2020 / 2.46);
  const saturnSign = ((saturnBase - 1 + saturnSignOffset) % 12) + 1; // 1-indexed

  // Jupiter: ~1 year per sign. Was in Meena (12) late 2021, Mesha (1) Apr 2022, Vrishabha (2) Apr 2023, Mithuna (3) May 2024
  const jupiterBase = 12; // Meena at Jan 2022
  const jupiterYearsFrom2022 = fracYear - 2022;
  const jupiterSignOffset = Math.floor(jupiterYearsFrom2022);
  const jupiterSign = ((jupiterBase - 1 + jupiterSignOffset) % 12) + 1;

  // Rahu: ~18 months per sign, retrograde. Was in Mesha (1) at Oct 2023, Meena (12) from May 2025
  // Rahu moves backwards! From Mesha (1) backward to Meena (12) in ~1.5y
  const rahuBase = 2; // Vrishabha at ~Jan 2022
  const rahuYearsFrom2022 = fracYear - 2022;
  const rahuSignOffset = Math.floor(rahuYearsFrom2022 / 1.5);
  const rahuSign = ((rahuBase - 1 - rahuSignOffset + 1200) % 12) + 1; // retrograde

  // Ketu always opposite Rahu
  const ketuSign = ((rahuSign - 1 + 6) % 12) + 1;

  // Mars: ~45 days per sign. Was in Mesha (1) at Mar 2024
  const marsBase = 1; // Mesha at Mar 2024
  const marsYearsFrom2024 = fracYear - 2024.25;
  const marsSignOffset = Math.floor(marsYearsFrom2024 / (45/365.25));
  const marsSign = ((marsBase - 1 + marsSignOffset) % 12) + 1;

  return {
    Saturn: { sign: saturnSign, signHi: SIGN_NAMES_HI[saturnSign-1], signEn: SIGN_NAMES_EN[saturnSign-1] },
    Jupiter: { sign: jupiterSign, signHi: SIGN_NAMES_HI[jupiterSign-1], signEn: SIGN_NAMES_EN[jupiterSign-1] },
    Rahu: { sign: rahuSign, signHi: SIGN_NAMES_HI[rahuSign-1], signEn: SIGN_NAMES_EN[rahuSign-1] },
    Ketu: { sign: ketuSign, signHi: SIGN_NAMES_HI[ketuSign-1], signEn: SIGN_NAMES_EN[ketuSign-1] },
    Mars: { sign: marsSign, signHi: SIGN_NAMES_HI[marsSign-1], signEn: SIGN_NAMES_EN[marsSign-1] },
  };
}

// Get transit house from natal Moon sign
function getTransitHouse(transitSign, natalMoonSign) {
  if(!transitSign || !natalMoonSign) return null;
  return ((transitSign - natalMoonSign + 12) % 12) + 1;
}

// ══════════════════════════════════════════════════
// SATURN TRANSIT (SADE SATI) PREDICTION
// ══════════════════════════════════════════════════
const SHANI_HOUSE_FX = {
  1:  { name:"जन्म राशि — साढ़े साती चरम",     phase:"साढ़े साती — दूसरा चरण (Peak)", severity:"extreme", color:C.red,
        effects:["स्वास्थ्य पर दबाव","व्यक्तित्व और आत्मविश्वास में बदलाव","कठिन निर्णय लेने पड़ते हैं","धन में उतार-चढ़ाव","पहचान संकट — खुद को नए सिरे से परिभाषित करें"],
        good:["कर्म और मेहनत का फल मिलेगा","आत्मज्ञान और परिपक्वता","पुराने बोझ से मुक्ति"],
        remedies:["शनिवार व्रत अनिवार्य","हनुमान चालीसा रोज","नीले कपड़े और उड़द का दान","शनि मंदिर में तेल चढ़ाएं","लोहे की वस्तु दान"] },
  2:  { name:"12वें से 2रा — साढ़े साती अंत",   phase:"साढ़े साती — तीसरा चरण (Exit)", severity:"high", color:C.rose,
        effects:["परिवार में कलह","धन खर्च बढ़ता है","बोलने में कड़वाहट","आंखों और दांतों की समस्या","पुराने कर्जे चुकाने का समय"],
        good:["साढ़े साती की समाप्ति की ओर","सीखे गए सबक काम आएंगे","वाणी में परिपक्वता"],
        remedies:["पितृ तर्पण करें","गाय को हरा चारा","काले तिल का जल में दान"] },
  3:  { name:"3रा — सामान्य",                    phase:"साधारण गोचर", severity:"low", color:C.green,
        effects:["प्रयासों में सफलता","भाई-बहन से सहयोग","यात्राओं में लाभ","लेखन और मीडिया में अच्छा समय"],
        good:["✅ 3रे में शनि = उत्तम! साहस और मेहनत से सफलता","व्यापार में लाभ"],
        remedies:["सामान्य उपाय पर्याप्त"] },
  4:  { name:"4था — ढैया",                        phase:"ढैया (2.5 वर्ष)", severity:"high", color:C.rose,
        effects:["माता को कष्ट","घर में परेशानी","वाहन दुर्घटना सावधानी","मानसिक तनाव","गृह स्थान में बदलाव"],
        good:["संपत्ति में निवेश फायदेमंद हो सकता है","घर बनाने का समय"],
        remedies:["माता की सेवा करें","शनि उपाय नियमित","वाहन सावधानी से चलाएं"] },
  5:  { name:"5वां — सामान्य",                    phase:"साधारण गोचर", severity:"medium", color:C.amber,
        effects:["संतान को कष्ट","प्रेम में बाधा","बुद्धि पर दबाव","निवेश में सावधानी"],
        good:["मेहनत से पढ़ाई में सफलता","एकाग्रता बढ़ती है"],
        remedies:["5वें के कारक गुरु का उपाय","संतान गोपाल पाठ"] },
  6:  { name:"6ठा — बहुत शुभ",                    phase:"उत्तम गोचर ✅", severity:"low", color:C.green,
        effects:["शत्रु पराजित होंगे","रोग से मुक्ति","कर्ज चुकेगा","नौकरी में उन्नति"],
        good:["✅✅ 6ठे में शनि = सर्वश्रेष्ठ! प्रतिस्पर्धा में जीत","सरकारी काम सफल"],
        remedies:["सामान्य उपाय — यह समय बहुत शुभ है"] },
  7:  { name:"7वां — साढ़े साती शुरू",             phase:"साढ़े साती — पहला चरण (Entry)", severity:"high", color:C.rose,
        effects:["विवाह में तनाव","साझेदारी में समस्या","व्यापार में बाधा","दूर देश में जाना पड़ सकता है","रिश्तों में दूरी"],
        good:["अकेले काम करना बेहतर","ध्यान और साधना में मन लगेगा"],
        remedies:["शनिवार व्रत शुरू करें","साझेदारी में नए अनुबंध से बचें","शनि मंत्र रोज"] },
  8:  { name:"8वां — अति कठिन",                   phase:"अष्टम शनि (सबसे कठिन)", severity:"extreme", color:C.red,
        effects:["स्वास्थ्य में बड़ी समस्या","दुर्घटना का खतरा","अचानक आर्थिक हानि","छुपे शत्रु सक्रिय","परिवार में मृत्यु तुल्य दुख"],
        good:["गहरा आत्मज्ञान","छुपी हुई शक्तियां उजागर","तांत्रिक विद्या में रुचि"],
        remedies:["महामृत्युंजय मंत्र रोज 108 बार","शनि मंदिर प्रत्येक शनिवार","नवग्रह शांति पूजा","काले कपड़े न पहनें","यात्रा सावधानी से"] },
  9:  { name:"9वां — मध्यम",                       phase:"साधारण गोचर", severity:"medium", color:C.amber,
        effects:["भाग्य में उतार-चढ़ाव","पिता को कष्ट","धर्म-कर्म में मन नहीं लगता","विदेश यात्रा में बाधा"],
        good:["मेहनत से भाग्य बनेगा","आध्यात्मिकता में रुचि"],
        remedies:["पिता की सेवा करें","शनिवार व्रत"] },
  10: { name:"10वां — करियर चरम",                  phase:"दशम शनि (करियर परीक्षण)", severity:"medium", color:C.amber,
        effects:["करियर में बड़ा परिवर्तन","पद और प्रतिष्ठा में उतार-चढ़ाव","कठिन मेहनत जरूरी","वरिष्ठों से तनाव"],
        good:["✅ मेहनत का पूरा फल मिलेगा","नई जिम्मेदारी","दीर्घकालिक सफलता"],
        remedies:["कर्म में ईमानदारी — शनि यही देखता है","शनिवार उपाय नियमित"] },
  11: { name:"11वां — अति शुभ",                    phase:"एकादश शनि (लाभ काल) ✅✅", severity:"low", color:C.green,
        effects:["बड़े लाभ का समय","पुरानी मेहनत का फल","मित्रों से सहयोग","इच्छाएं पूरी होती हैं","आय में वृद्धि"],
        good:["✅✅ 11वें में शनि = सबसे शुभ! धन, यश, सफलता सब मिलेगा","पुराने निवेश का लाभ"],
        remedies:["कोई विशेष उपाय नहीं — बस कर्म करते रहें"] },
  12: { name:"12वां — साढ़े साती से पहले",          phase:"साढ़े साती — आगमन चरण", severity:"high", color:C.rose,
        effects:["खर्चे बढ़ते हैं","एकांत और थकान","विदेश यात्रा संभव","नींद की समस्या","गुप्त शत्रु"],
        good:["आध्यात्मिकता में उन्नति","एकांत में ध्यान से लाभ","विदेश में अवसर"],
        remedies:["शनि उपाय अभी से शुरू करें","बजट बनाएं","अनावश्यक खर्च कम करें"] },
};

function SaturnTransitBlock({ transitHouse, moonSignHi, date, transitPos }) {
  if(!transitHouse) return <div className="p-4 text-slate-500 text-center" style={HI}>चंद्र राशि की जानकारी नहीं — कुंडली डेटा देखें</div>;
  const fx=SHANI_HOUSE_FX[transitHouse];
  if(!fx) return null;
  const rc=fx.color;

  // Sade Sati check
  const isSS=[12,1,2].includes(transitHouse);
  const isDhaiya=[4,8].includes(transitHouse);

  return (
    <div>
      {/* Header */}
      <div className="p-4 rounded-2xl mb-3" style={{background:`${rc}12`,border:`2px solid ${rc}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🪐</span>
          <div className="flex-1">
            <div className="text-[16px] font-black" style={{color:rc,...HI}}>
              शनि {transitPos?.Saturn?.signHi||"?"} राशि में
            </div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              आपकी चंद्र राशि {moonSignHi} से <strong style={{color:rc}}>{transitHouse}वें भाव</strong> में
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold px-2.5 py-1 rounded-xl" style={{background:`${rc}20`,color:rc,...HI}}>
              {isSS?"🔴 साढ़े साती":isDhaiya?"🟠 ढैया":"शनि गोचर"}
            </div>
          </div>
        </div>
        <div className="text-[13px] font-black mb-2" style={{color:rc,...HI}}>{fx.phase}</div>
        <Bar value={fx.severity==="extreme"?90:fx.severity==="high"?65:fx.severity==="medium"?40:20} max={100} color={rc}/>
        <div className="mt-2 text-[12px]" style={{color:rc,...HI}}>{fx.name}</div>
      </div>

      {/* Effects */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        <div className="p-3.5 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
          <div className="text-[12px] font-bold text-rose-400 mb-2" style={HI}>⚠️ इस काल में सावधानियां:</div>
          {fx.effects.map((e,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {e}</div>)}
        </div>
        <div className="p-3.5 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
          <div className="text-[12px] font-bold text-green-400 mb-2" style={HI}>✅ इस काल के अवसर:</div>
          {fx.good.map((g,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {g}</div>)}
        </div>
        <div className="p-3.5 rounded-xl" style={{background:`${rc}07`,border:`1px solid ${rc}20`}}>
          <div className="text-[12px] font-bold mb-2" style={{color:rc,...HI}}>🛡️ शनि उपाय:</div>
          {fx.remedies.map((r,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>)}
        </div>
      </div>

      {/* 12-house quick overview */}
      <div className="p-3 rounded-xl" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>शनि गोचर — 12 भाव त्वरित संदर्भ:</div>
        <div className="grid grid-cols-4 gap-1">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
            const hfx=SHANI_HOUSE_FX[h];
            const isActive=h===transitHouse;
            return <div key={h} className="p-1.5 rounded-lg text-center"
              style={{background:isActive?`${hfx.color}25`:"rgba(255,255,255,.03)",
                border:isActive?`1.5px solid ${hfx.color}50`:"1px solid rgba(255,255,255,.06)"}}>
              <div className="text-[10px] font-black" style={{color:isActive?hfx.color:"#475569"}}>{h}</div>
              <div className="text-[7px]" style={{color:hfx.color,...HI}}>
                {hfx.severity==="extreme"?"🔴🔴":hfx.severity==="high"?"🔴":hfx.severity==="medium"?"🟡":"✅"}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// JUPITER TRANSIT PREDICTION
// ══════════════════════════════════════════════════
const GURU_HOUSE_FX = {
  1:  {phase:"लग्न गुरु — नया अध्याय ✅",color:C.cyan,  effects:["नई शुरुआत शुभ","व्यक्तित्व में निखार","स्वास्थ्य बेहतर","आत्मविश्वास वापस","नया प्रोजेक्ट शुरू करने का समय"],  remedies:["गुरुवार व्रत","गुरु मंत्र"]},
  2:  {phase:"धन गुरु — आर्थिक वृद्धि ✅",color:C.green, effects:["धन लाभ होगा","परिवार में शुभ समाचार","बोलने की शक्ति बढ़ेगी","बचत और निवेश शुभ","वाणी प्रभावशाली"],   remedies:["पीले चावल दान","गुरु उपाय"]},
  3:  {phase:"3रा गुरु — मध्यम",color:C.amber,           effects:["भाई-बहन में तनाव संभव","यात्राएं होंगी","लेखन में सफलता","प्रयासों में देरी"],     remedies:["विशेष उपाय नहीं"]},
  4:  {phase:"4था गुरु — घर-परिवार शुभ ✅",color:C.cyan,  effects:["माता को सुख","घर में शुभ कार्य","संपत्ति लाभ","मन में शांति","वाहन खरीदने का अच्छा समय"],  remedies:["माता की सेवा"]},
  5:  {phase:"5वां गुरु — सर्वश्रेष्ठ ✅✅",color:C.green, effects:["संतान जन्म का शुभ समय","प्रेम विवाह संभव","शिक्षा में सफलता","रचनात्मकता चरम पर","पुण्य कार्य फलदायी"],  remedies:["संतान गोपाल पाठ","गुरु उपाय"]},
  6:  {phase:"6ठा गुरु — कमजोर",color:C.rose,            effects:["स्वास्थ्य पर ध्यान दें","नौकरी में चुनौतियां","शत्रु सक्रिय","ऋण बढ़ सकता है"],    remedies:["गुरुवार व्रत अनिवार्य","दान करें"]},
  7:  {phase:"7वां गुरु — विवाह योग ✅",color:C.cyan,     effects:["विवाह/साझेदारी का शुभ समय","जीवनसाथी का सहयोग","व्यापार में नई साझेदारी","कानूनी मामलों में सफलता"],  remedies:["विवाह की तैयारी करें"]},
  8:  {phase:"8वां गुरु — गुप्त लाभ",color:C.amber,       effects:["विरासत या अचानक धन","गुप्त विद्या में रुचि","शोध-अनुसंधान में सफलता","स्वास्थ्य में सुधार"],  remedies:["आध्यात्मिक साधना"]},
  9:  {phase:"9वां गुरु — भाग्य उदय ✅✅",color:C.green,  effects:["भाग्य चरम पर","विदेश यात्रा","धार्मिक यात्रा","पिता का आशीर्वाद","गुरु-शिष्य संबंध शुभ","उच्च शिक्षा"],  remedies:["गुरु की सेवा करें","तीर्थ यात्रा"]},
  10: {phase:"10वां गुरु — करियर शिखर ✅",color:C.cyan,   effects:["पदोन्नति","सम्मान और प्रतिष्ठा","नया पद/व्यापार","सरकारी सहयोग","सार्वजनिक पहचान"],  remedies:["कर्तव्य पालन","गुरु उपाय"]},
  11: {phase:"11वां गुरु — लाभ काल ✅✅",color:C.green,   effects:["बड़े लाभ","इच्छापूर्ति","मित्रों से सहयोग","सामाजिक नेटवर्क मजबूत","पुराने निवेश से लाभ"],  remedies:["दोस्तों की मदद करें"]},
  12: {phase:"12वां गुरु — व्यय काल",color:C.amber,       effects:["खर्चे बढ़ेंगे","विदेश जाने का योग","आध्यात्मिक उन्नति","एकांत में लाभ","स्वास्थ्य पर ध्यान"],  remedies:["बजट सावधानी","आध्यात्मिक साधना"]},
};

function JupiterTransitBlock({ transitHouse, moonSignHi, transitPos }) {
  if(!transitHouse) return <div className="p-4 text-slate-500 text-center" style={HI}>चंद्र राशि की जानकारी नहीं</div>;
  const fx=GURU_HOUSE_FX[transitHouse];
  if(!fx) return null;
  return (
    <div>
      <div className="p-4 rounded-2xl mb-3" style={{background:`${fx.color}12`,border:`2px solid ${fx.color}35`}}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">♃</span>
          <div className="flex-1">
            <div className="text-[16px] font-black" style={{color:fx.color,...HI}}>गुरु {transitPos?.Jupiter?.signHi||"?"} में</div>
            <div className="text-[12px] text-slate-400 mt-0.5" style={HI}>
              {moonSignHi} से <strong style={{color:fx.color}}>{transitHouse}वें</strong> भाव में
            </div>
          </div>
        </div>
        <div className="text-[13px] font-black mb-1" style={{color:fx.color,...HI}}>{fx.phase}</div>
      </div>
      <div className="p-3.5 rounded-xl mb-3" style={{background:`${fx.color}08`,border:`1px solid ${fx.color}25`}}>
        <div className="text-[12px] font-bold mb-2" style={{color:fx.color,...HI}}>✨ गुरु गोचर फल:</div>
        {fx.effects.map((e,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {e}</div>)}
      </div>
      <div className="p-3 rounded-xl" style={{background:"rgba(252,211,77,.07)",border:"1px solid rgba(252,211,77,.2)"}}>
        <div className="text-[11px] font-bold text-yellow-400 mb-1.5" style={HI}>🛡️ गुरु उपाय:</div>
        {fx.remedies.map((r,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>)}
      </div>

      {/* 12 quick view */}
      <div className="p-3 rounded-xl mt-3" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
        <div className="text-[11px] font-bold text-slate-500 mb-2" style={HI}>गुरु गोचर — 12 भाव त्वरित संदर्भ:</div>
        <div className="grid grid-cols-4 gap-1">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=>{
            const hfx=GURU_HOUSE_FX[h];
            const isA=h===transitHouse;
            return <div key={h} className="p-1.5 rounded-lg text-center"
              style={{background:isA?`${hfx.color}25`:"rgba(255,255,255,.03)",
                border:isA?`1.5px solid ${hfx.color}50`:"1px solid rgba(255,255,255,.06)"}}>
              <div className="text-[10px] font-black" style={{color:isA?hfx.color:"#475569"}}>{h}</div>
              <div className="text-[7px]" style={{color:hfx.color}}>
                {[5,9,10,11].includes(h)?"✅✅":[1,2,4,7].includes(h)?"✅":[3,6,8,12].includes(h)?"⚠️":"🟡"}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// RAHU-KETU TRANSIT PREDICTION
// ══════════════════════════════════════════════════
const RAHU_HOUSE_FX = {
  1:  {effect:"लग्न राहु = व्यक्तित्व में अचानक बदलाव। नई पहचान। विचित्र आकर्षण। स्वास्थ्य में सावधानी।",risk:"high"},
  2:  {effect:"धन राहु = आय में उतार-चढ़ाव। परिवार में उलझन। बोलने में झूठ का खतरा। विदेशी धन का योग।",risk:"medium"},
  3:  {effect:"3रा राहु = यात्राओं में रहस्य। मीडिया में अचानक उन्नति। भाई-बहन से विचित्र संबंध।",risk:"low"},
  4:  {effect:"4था राहु = घर में अशांति। माता को कष्ट। संपत्ति में विवाद। मानसिक अस्थिरता।",risk:"high"},
  5:  {effect:"5वां राहु = ⚠️ संतान में कठिनाई। प्रेम में धोखा। शेयर/जुए में हानि। बुद्धि पर प्रश्नचिह्न।",risk:"extreme"},
  6:  {effect:"6ठा राहु = शत्रुओं पर विजय। रोगों से मुक्ति। विदेशी नौकरी का योग। ✅",risk:"low"},
  7:  {effect:"7वां राहु = विवाह में विलंब या जटिलता। विदेशी साथी। व्यापार में धोखे का भय।",risk:"high"},
  8:  {effect:"8वां राहु = ⚠️ दुर्घटना सावधानी। अचानक धन लाभ या हानि। रहस्यमय रोग। तांत्रिक असर।",risk:"extreme"},
  9:  {effect:"9वां राहु = धर्म में संशय। पिता से दूरी। विदेश यात्रा। भाग्य में उतार-चढ़ाव।",risk:"medium"},
  10: {effect:"10वां राहु = करियर में असामान्य उन्नति। राजनीति में अवसर। पदोन्नति अचानक।",risk:"medium"},
  11: {effect:"11वां राहु = बड़े लाभ का समय! विदेश से धन। अचानक इच्छापूर्ति। नई मित्रता। ✅",risk:"low"},
  12: {effect:"12वां राहु = विदेश जाने का प्रबल योग। खर्चे बढ़ते हैं। नींद में गड़बड़ी। आध्यात्मिक साधना।",risk:"medium"},
};

function RahuTransitBlock({ rahuHouse, ketuHouse, moonSignHi, transitPos }) {
  if(!rahuHouse) return <div className="p-4 text-slate-500 text-center" style={HI}>चंद्र राशि की जानकारी नहीं</div>;
  const rfx=RAHU_HOUSE_FX[rahuHouse];
  const kfx=RAHU_HOUSE_FX[ketuHouse];
  const rc={extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[rfx?.risk||"medium"];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          {label:"☊ राहु",house:rahuHouse,sign:transitPos?.Rahu?.signHi,fx:rfx,col:C.purple},
          {label:"☋ केतु",house:ketuHouse,sign:transitPos?.Ketu?.signHi,fx:kfx,col:C.indigo},
        ].map((rk,i)=>{
          const rcc={extreme:C.red,high:C.rose,medium:C.amber,low:C.green}[rk.fx?.risk||"medium"];
          return <div key={i} className="p-3.5 rounded-2xl" style={{background:`${rcc}10`,border:`1.5px solid ${rcc}30`}}>
            <div className="text-[14px] font-black mb-1" style={{color:rcc,...HI}}>{rk.label}</div>
            <div className="text-[12px] text-white font-bold mb-1" style={HI}>{rk.sign||"?"} ({moonSignHi} से {rk.house}वें)</div>
            <div className="text-[11px] text-slate-300 leading-relaxed" style={HI}>{rk.fx?.effect}</div>
          </div>;
        })}
      </div>

      {/* Rahu axis overall reading */}
      <div className="p-3.5 rounded-xl mb-3" style={{background:"rgba(192,132,252,.08)",border:"1px solid rgba(192,132,252,.25)"}}>
        <div className="text-[12px] font-bold text-purple-400 mb-2" style={HI}>⚡ राहु-केतु अक्ष का समग्र प्रभाव:</div>
        <div className="text-[12px] text-slate-300 leading-relaxed" style={HI}>
          राहु {rahuHouse}वें — केतु {ketuHouse}वें — यह अक्ष {rahuHouse} और {ketuHouse}वें भावों के विषयों में बड़ा परिवर्तन लाता है। राहु जहां है वहां अति-इच्छा, केतु जहां है वहां वैराग्य।
          {rahuHouse===5||rahuHouse===8?" ⚠️ विशेष सावधानी इस काल में।":rahuHouse===6||rahuHouse===11?" ✅ यह गोचर शुभ है।":" सावधान और जागरूक रहें।"}
        </div>
      </div>

      <div className="p-3 rounded-xl" style={{background:"rgba(192,132,252,.07)",border:"1px solid rgba(192,132,252,.2)"}}>
        <div className="text-[11px] font-bold text-purple-400 mb-1.5" style={HI}>🛡️ राहु-केतु उपाय:</div>
        {["राहु मंत्र: ॐ रां राहवे नमः — 108 बार शनिवार","केतु मंत्र: ॐ कें केतवे नमः — 108 बार",
          "भैरव मंदिर जाएं — राहु की शांति","गणेश पूजा — केतु की शांति","नीलम और लहसुनिया — ज्योतिषी की सलाह से"].map((r,i)=>(
          <div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// DASHA + GOCHAR COMBINED PREDICTION
// ══════════════════════════════════════════════════
const DASHA_GOCHAR_MATRIX = {
  // [Mahadasha planet]: { [Transit planet in house]: combined_prediction }
  Sa: {
    saturn_1:"⚠️ शनि महादशा + शनि लग्न गोचर = साढ़े साती का चरम काल। सबसे कठिन। पूरे उपाय करें।",
    saturn_11:"✅ शनि महादशा + शनि 11वें = महादशा का सबसे शुभ समय। धन और सफलता।",
    saturn_8:"🚨 शनि महादशा + अष्टम शनि = अत्यंत कठिन। स्वास्थ्य और दुर्घटना सावधानी।",
    jupiter_9:"✅✅ शनि महादशा में गुरु 9वें = भाग्य का उदय। मेहनत का फल मिलेगा।",
  },
  Ju: {
    jupiter_5:"✅✅ गुरु महादशा + गुरु 5वें = जीवन का सर्वश्रेष्ठ समय! विवाह, संतान, उन्नति सब।",
    saturn_8:"⚠️ गुरु महादशा में अष्टम शनि = गुरु की शक्ति से कठिनाई पार होगी, लेकिन सावधानी जरूरी।",
    jupiter_9:"✅✅ गुरु महादशा + गुरु 9वें = सर्वोच्च भाग्य काल।",
  },
};

function DashaGocharBlock({ chartData, transitPos, moonSign }) {
  const currentDasha=chartData?.dashas?.[0]||chartData?.enginesData?.navatara?.current_mahadasha||null;
  const PNAME={Su:"सूर्य",Mo:"चंद्र",Ma:"मंगल",Me:"बुध",Ju:"गुरु",Ve:"शुक्र",Sa:"शनि",Ra:"राहु",Ke:"केतु"};

  const saturnH=transitPos?.Saturn?.sign&&moonSign?getTransitHouse(transitPos.Saturn.sign,moonSign):null;
  const jupiterH=transitPos?.Jupiter?.sign&&moonSign?getTransitHouse(transitPos.Jupiter.sign,moonSign):null;
  const rahuH=transitPos?.Rahu?.sign&&moonSign?getTransitHouse(transitPos.Rahu.sign,moonSign):null;

  // Overall period score
  let score=50;
  if(jupiterH&&[5,9,11].includes(jupiterH))score+=20;
  if(jupiterH&&[1,2,4,7,10].includes(jupiterH))score+=10;
  if(jupiterH&&[6,8,12].includes(jupiterH))score-=10;
  if(saturnH&&[6,11].includes(saturnH))score+=15;
  if(saturnH&&[8].includes(saturnH))score-=25;
  if(saturnH&&[1,2,12].includes(saturnH))score-=15;
  if(rahuH&&[6,11].includes(rahuH))score+=10;
  if(rahuH&&[5,8].includes(rahuH))score-=15;
  score=Math.max(5,Math.min(100,score));
  const sc=score>=70?C.green:score>=45?C.cyan:score>=25?C.amber:C.rose;

  return (
    <Card color={sc}>
      <SLabel color={sc}>📊 दशा + गोचर समग्र पूर्वानुमान</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{background:`${sc}12`,border:`2px solid ${sc}35`}}>
        <div className="text-center mb-2">
          <div className="text-[40px] font-black" style={{color:sc}}>{score}/100</div>
          <div className="text-[14px] font-black" style={{color:sc,...HI}}>
            {score>=70?"✅✅ अभी का समय बहुत शुभ है!":score>=45?"✅ ठीक-ठाक समय — मेहनत करें":score>=25?"⚡ मध्यम समय — सावधान रहें":"⚠️ कठिन समय — उपाय अनिवार्य"}
          </div>
        </div>
        <Bar value={score} max={100} color={sc}/>
      </div>

      {/* Planet-wise summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          {label:"🪐 शनि",h:saturnH,sign:transitPos?.Saturn?.signHi,good:[6,11],bad:[8,12,1,2,7]},
          {label:"♃ गुरु",h:jupiterH,sign:transitPos?.Jupiter?.signHi,good:[5,9,11,10],bad:[6,8,12]},
          {label:"☊ राहु",h:rahuH,sign:transitPos?.Rahu?.signHi,good:[6,11,3],bad:[5,8,4,7]},
        ].map((pl,i)=>{
          const isGood=pl.h&&pl.good.includes(pl.h);
          const isBad=pl.h&&pl.bad.includes(pl.h);
          const col=isGood?C.green:isBad?C.rose:C.amber;
          return <div key={i} className="p-3 rounded-xl text-center"
            style={{background:`${col}10`,border:`1px solid ${col}25`}}>
            <div className="text-[12px] font-black mb-0.5" style={{color:col,...HI}}>{pl.label}</div>
            <div className="text-[11px] text-white font-bold" style={HI}>{pl.sign||"?"}</div>
            <div className="text-[10px]" style={{color:col,...HI}}>{pl.h?`${pl.h}वां भाव`:"—"}</div>
            <div className="text-[10px] mt-1" style={{color:col}}>
              {isGood?"✅ शुभ":isBad?"⚠️ सावधान":"🟡 मध्यम"}
            </div>
          </div>;
        })}
      </div>

      {/* Recommendations */}
      <div className="p-3.5 rounded-xl" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
        <div className="text-[12px] font-bold text-white mb-2" style={HI}>🎯 अभी क्या करें:</div>
        {(score>=70
          ?["यह शुभ समय है — नए काम शुरू करें","निवेश और व्यापार के लिए अच्छा","विवाह/संतान के लिए उत्तम","अपनी मेहनत का पूरा फल मिलेगा"]
          :score>=45
          ?["मेहनत बंद मत करें — फल मिलेगा","बड़े जोखिम से बचें","उपाय नियमित करते रहें","धैर्य रखें"]
          :["उपाय अभी से शुरू करें","बड़े निर्णय टालें (यदि संभव हो)","ध्यान और साधना में समय दें","नकारात्मक लोगों से दूर रहें"]
        ).map((r,i)=><div key={i} className="text-[11px] text-slate-300" style={HI}>• {r}</div>)}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// SADE SATI + DHAIYA (migrated from SaturnPanel)
// ══════════════════════════════════════════════════
function SevBar({ value=0 }) {
  const col = value>=80?C.red:value>=50?C.orange:value>=30?C.amber:C.cyan;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <motion.div className="h-full rounded-full"
          style={{ background:col, boxShadow:`0 0 6px ${col}60` }}
          initial={{ width:0 }} animate={{ width:`${value}%` }}
          transition={{ duration:1, ease:"easeOut" }}/>
      </div>
      <span className="text-[10px] font-black flex-shrink-0" style={{ color:col }}>{value}%</span>
    </div>
  );
}

function SadeSatiBlock({ data }) {
  const ss = data?.sade_sati || {};
  const dy = data?.dhayya || {};
  const pada = data?.pada_system || {};
  const avOverride = data?.ashtakvarga_override || {};

  const PHASES = [
    { key:"rising", num:"1", name:"उदय पाद", hindi:"12वें में शनि", sev:40, color:C.amber,
      effect:"मानसिक तनाव की शुरुआत, व्यय बढ़ना, अनजाना भय",
      tip:"अभी से बचत शुरू करें, ऋण चुकाएं, अनावश्यक खर्च बंद करें" },
    { key:"peak", num:"2", name:"चरम पाद", hindi:"चंद्र राशि में शनि", sev:100, color:C.red,
      effect:"सबसे कठिन समय — स्वास्थ्य, धन, मान सभी पर दबाव",
      tip:"धैर्य रखें। शनि मंत्र 108 बार रोज। गरीबों को भोजन कराएं।" },
    { key:"setting", num:"3", name:"अस्त पाद", hindi:"2रे में शनि", sev:60, color:C.orange,
      effect:"धीरे-धीरे सुधार, लेकिन अभी भी सावधानी जरूरी",
      tip:"धन्यवाद पूजा करें। दान जारी रखें। नई शुरुआत शुभ।" },
  ];
  const PADAS = [
    { name:"स्वर्ण पाद", icon:"🥇", color:"#FCD34D", sev:25, effect:"साढ़े साती का सबसे कम कठिन समय।" },
    { name:"रजत पाद",  icon:"🥈", color:"#94A3B8", sev:50, effect:"कष्ट बढ़ने लगे हैं। धन संभालें।" },
    { name:"ताम्र पाद", icon:"🥉", color:"#B45309", sev:75, effect:"काफी कठिन। सोच-समझकर निर्णय लें।" },
    { name:"लौह पाद",  icon:"⚙️", color:"#64748B", sev:100, effect:"सबसे कठिन पाद। अधिकतम दबाव।" },
  ];

  const isActive = ss.active || dy.active;
  const isDhaiya = !ss.active && dy.active;
  const curPhase = ss.phase || "";

  return (
    <Card color={isActive ? C.red : C.cyan}>
      <SLabel color={isActive ? C.red : C.cyan}>🪐 शनि गोचर — वर्तमान स्थिति</SLabel>

      {/* Status Badge */}
      <div className="p-4 rounded-xl mb-4" style={{
        background: isActive ? "rgba(239,68,68,.1)" : "rgba(34,211,238,.08)",
        border: `1.5px solid ${isActive ? C.red : C.cyan}35` }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[28px]">{isActive ? "🪐" : "✅"}</span>
          <div>
            <div className="text-[16px] font-black" style={{ color: isActive ? C.red : C.cyan,...HI }}>
              {ss.active ? (ss.type || "साढ़े साती सक्रिय!") : isDhaiya ? "ढैया सक्रिय" : "शनि गोचर सामान्य"}
            </div>
            <div className="text-[12px] text-slate-400" style={HI}>
              {ss.active ? ss.phase : isDhaiya ? dy.type : "अभी कोई विशेष शनि प्रभाव नहीं"}
            </div>
          </div>
        </div>
        {isActive && <SevBar value={ss.severity || dy.severity || 0}/>}
        {(ss.description || dy.description) && (
          <div className="mt-2 text-[12px] text-slate-300" style={HI}>{ss.description || dy.description}</div>
        )}
        {!isActive && (
          <div>
            <div className="text-[13px] text-cyan-400 mt-1" style={HI}>✅ अभी साढ़े साती/ढैया नहीं है</div>
            {data?.next_sade_sati && <div className="text-[12px] text-slate-400 mt-1" style={HI}>
              अगली साढ़े साती: {data.next_sade_sati}
            </div>}
          </div>
        )}
      </div>

      {/* AV Override */}
      {(avOverride.house_points || data?.av_points) && (
        <div className="p-3 rounded-xl mb-4" style={{
          background: (avOverride.house_points || data?.av_points || 0) >= 28
            ? "rgba(74,222,128,.1)" : "rgba(251,113,133,.1)",
          border: `1px solid ${(avOverride.house_points || data?.av_points || 0) >= 28 ? C.green : C.rose}35` }}>
          <div className="text-[13px] font-black mb-1" style={{
            color: (avOverride.house_points || data?.av_points || 0) >= 28 ? C.green : C.rose,...HI }}>
            🔢 अष्टकवर्ग — {(avOverride.house_points || data?.av_points || 0) >= 28 ? "✅ सुरक्षा!" : "⚠️ पूर्ण प्रभाव"}
          </div>
          <div className="text-[12px] text-slate-200 mb-1" style={HI}>
            शनि का वर्तमान भाव = {avOverride.house_points || data?.av_points || 0} अंक
          </div>
          <Bar value={avOverride.house_points || data?.av_points || 0} max={56}
            color={(avOverride.house_points||data?.av_points||0)>=28?C.green:C.rose}/>
          <div className="text-[12px] mt-2" style={HI}>
            {(avOverride.house_points || data?.av_points || 0) >= 28
              ? "✅ 28+ अंक = साढ़े साती का कष्ट 70% कम!"
              : "⚠️ 28 से कम = शनि का पूर्ण कठोर प्रभाव।"}
          </div>
        </div>
      )}

      {/* 3 Phases */}
      <SLabel color={C.orange}>साढ़े साती — तीन चरण (7.5 वर्ष)</SLabel>
      {PHASES.map((ph, i) => {
        const isThisPhase = isActive && curPhase.includes(ph.hindi.split("में")[0].trim());
        return <div key={i} className="p-3 rounded-xl mb-2" style={{
          background: isThisPhase ? `${ph.color}15` : "rgba(255,255,255,.03)",
          border: `1px solid ${isThisPhase ? ph.color : "rgba(255,255,255,.06)"}35` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px]">{["🌅","🔥","🌇"][i]}</span>
            <span className="text-[13px] font-black" style={{ color:ph.color,...HI }}>{ph.name}</span>
            <span className="text-[11px] text-slate-500 flex-1" style={HI}>— {ph.hindi}</span>
            {isThisPhase && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background:`${ph.color}20`, color:ph.color,...HI }}>⚡ चालू</span>}
          </div>
          <div className="text-[12px] text-slate-300 mb-1" style={HI}>{ph.effect}</div>
          <div className="text-[11px] text-slate-500" style={HI}>💡 {ph.tip}</div>
          <SevBar value={ph.sev}/>
        </div>;
      })}

      {/* 4 Padas */}
      <SLabel color={C.purple}>पाद प्रणाली (4 पाद × 2.5 वर्ष)</SLabel>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PADAS.map((p, i) => (
          <div key={i} className="p-3 rounded-xl" style={{ background:`${p.color}08`, border:`1px solid ${p.color}25` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[16px]">{p.icon}</span>
              <span className="text-[12px] font-black" style={{ color:p.color,...HI }}>{p.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 mb-1" style={HI}>{p.effect}</div>
            <SevBar value={p.sev}/>
          </div>
        ))}
      </div>

      {/* Dhaiya */}
      <SLabel color={C.amber}>ढैया (2.5 वर्ष)</SLabel>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-3 rounded-xl" style={{ background: dy.active&&dy.type?.includes("4")?"rgba(251,146,60,.15)":"rgba(255,255,255,.04)", border:`1px solid ${dy.active&&dy.type?.includes("4")?C.orange:C.amber}30` }}>
          <div className="text-[12px] font-black text-amber-400 mb-1" style={HI}>कंटक शनि (4वां)</div>
          <div className="text-[11px] text-slate-300" style={HI}>चंद्र से 4वें में शनि</div>
          <div className="text-[11px] text-slate-400 mt-1" style={HI}>मानसिक कष्ट, माता को कष्ट, मकान समस्या</div>
          <SevBar value={70}/>
        </div>
        <div className="p-3 rounded-xl" style={{ background: dy.active&&dy.type?.includes("8")?"rgba(251,113,133,.15)":"rgba(255,255,255,.04)", border:`1px solid ${dy.active&&dy.type?.includes("8")?C.rose:C.amber}30` }}>
          <div className="text-[12px] font-black text-rose-400 mb-1" style={HI}>अष्टम शनि (8वां)</div>
          <div className="text-[11px] text-slate-300" style={HI}>चंद्र से 8वें में शनि</div>
          <div className="text-[11px] text-slate-400 mt-1" style={HI}>धन हानि, गुप्त शत्रु, स्वास्थ्य समस्या</div>
          <SevBar value={80}/>
        </div>
      </div>

      {/* Phase-wise Remedies */}
      <SLabel color={C.teal}>🛡️ उपाय (Phase-wise)</SLabel>
      {[
        { phase:"उदय पाद (शुरू)", remedies:["हनुमान चालीसा प्रातः","तिल का तेल दान","काली दाल दान शनिवार","बचत बढ़ाएं, ऋण चुकाएं"] },
        { phase:"चरम पाद (Peak)", remedies:["शनि मंत्र 108 बार रोज","नीलम रत्न (विद्वान से परामर्श)","शनि शिंगणापुर दर्शन","गरीबों को भोजन कराएं"] },
        { phase:"अस्त पाद (अंत)", remedies:["दान जारी रखें","धन्यवाद पूजा करें","नई शुरुआत शुभ है"] },
      ].map((r, i) => <div key={i} className="mb-2 p-3 rounded-xl" style={{ background:"rgba(45,212,191,.06)", border:"1px solid rgba(45,212,191,.2)" }}>
        <div className="text-[12px] font-bold text-teal-400 mb-1" style={HI}>{r.phase}:</div>
        {r.remedies.map((rem, j) => <div key={j} className="text-[11px] text-slate-300" style={HI}>• {rem}</div>)}
      </div>)}
    </Card>
  );
}

// ── Punarjanma Block ──────────────────────────────
function PunarjanmaBlock({ data }) {
  if (!data || data.error) return (
    <Card color={C.indigo}>
      <div className="text-slate-500 text-center py-6" style={HI}>पुनर्जन्म डेटा उपलब्ध नहीं</div>
    </Card>
  );
  const realm = data.birth_realm || {};
  const quality = data.birth_quality || {};
  const REALMS = [
    { name:"देवलोक", color:C.cyan,  icon:"🌟", desc:"स्वर्ग से आए हैं। बहुत पुण्य लेकर आए।" },
    { name:"पितृलोक",color:C.amber, icon:"👴", desc:"पूर्वजों के लोक से। कर्ज चुकाने आए हैं।" },
    { name:"मर्त्यलोक",color:C.green,icon:"🌍",desc:"पृथ्वी से ही फिर आए। कर्म जारी है।" },
    { name:"नरकलोक", color:C.rose,  icon:"🔥", desc:"पिछले कर्मों की सफाई के लिए।" },
  ];
  const realmName = realm.realm || "मर्त्यलोक";
  const realmData = REALMS.find(r => r.name === realmName) || REALMS[2];
  const qualityScore = quality.score || 60;
  const qualityText = qualityScore >= 80 ? "उत्तम" : qualityScore >= 50 ? "मध्यम" : "अधम";
  const qualityColor = qualityScore >= 80 ? C.cyan : qualityScore >= 50 ? C.amber : C.rose;

  return (
    <Card color={C.indigo}>
      <SLabel color={C.indigo}>🔮 पुनर्जन्म विश्लेषण — D3 द्रेष्काण</SLabel>
      <div className="p-4 rounded-xl mb-3" style={{ background:"linear-gradient(135deg,rgba(129,140,248,.08),rgba(8,12,28,.98))", border:"1px solid rgba(129,140,248,.25)" }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[36px]">{realm.icon || realmData.icon}</span>
          <div>
            <div className="text-[16px] font-black text-indigo-300" style={HI}>{realmName}</div>
            <div className="text-[12px] text-slate-400" style={HI}>{realmData.desc}</div>
          </div>
        </div>
        {data.stronger_planet && <div className="text-[12px] text-slate-400 mt-2" style={HI}>
          प्रमुख ग्रह: <span className="text-amber-300 font-bold">{data.stronger_planet}</span>
          {data.drekkana_lord && ` · द्रेष्काण स्वामी: ${data.drekkana_lord}`}
        </div>}
      </div>
      <div className="p-3 rounded-xl mb-3" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
        <div className="text-[12px] font-bold mb-2" style={{ color:qualityColor,...HI }}>🌟 जन्म गुणवत्ता: {qualityText}</div>
        <Bar value={qualityScore} max={100} color={qualityColor}/>
        {quality.description && <div className="text-[12px] text-slate-300 mt-2" style={HI}>{quality.description}</div>}
      </div>
      <div className="p-3 rounded-xl" style={{ background:"rgba(129,140,248,.06)", border:"1px solid rgba(129,140,248,.2)" }}>
        <div className="text-[12px] font-bold text-indigo-400 mb-2" style={HI}>🙏 इस जन्म का उद्देश्य:</div>
        <div className="text-[12px] text-slate-200" style={HI}>
          {realm.purpose || "कर्म संतुलन और आत्मिक उन्नति। दान, सेवा और सत्य पालन इस जन्म के मुख्य कर्तव्य हैं।"}
        </div>
        <div className="mt-2 text-[11px] text-slate-400" style={HI}>
          उपाय: • पितृ तर्पण • दान-पुण्य • सत्संग • गरीबों की सेवा
        </div>
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════
// ADVANCED TRANSIT SEARCHER — inline component
// ══════════════════════════════════════════════════
const RASHI_LIST=[{id:1,name:"मेष"},{id:2,name:"वृषभ"},{id:3,name:"मिथुन"},{id:4,name:"कर्क"},
  {id:5,name:"सिंह"},{id:6,name:"कन्या"},{id:7,name:"तुला"},{id:8,name:"वृश्चिक"},
  {id:9,name:"धनु"},{id:10,name:"मकर"},{id:11,name:"कुंभ"},{id:12,name:"मीन"}];
const PLANET_LIST=[{id:"Su",name:"सूर्य"},{id:"Mo",name:"चंद्र"},{id:"Ma",name:"मंगल"},
  {id:"Me",name:"बुध"},{id:"Ju",name:"गुरु"},{id:"Ve",name:"शुक्र"},
  {id:"Sa",name:"शनि"},{id:"Ra",name:"राहु"},{id:"Ke",name:"केतु"}];

function AdvancedTransitSearcher() {
  const [startDate, setStartDate]   = useState("2024-01-01");
  const [endDate,   setEndDate]     = useState("2030-12-31");
  const [conditions, setConditions] = useState([{planet:"Sa", sign:12}]);
  const [results,   setResults]     = useState(null);
  const [loading,   setLoading]     = useState(false);
  const [searched,  setSearched]    = useState(false);
  const [error,     setError]       = useState(null);

  const updateCond = (idx, key, val) => {
    const c = [...conditions];
    c[idx] = {...c[idx], [key]: val};
    setConditions(c);
  };

  const handleSearch = async () => {
    setLoading(true); setSearched(true); setError(null);
    try {
      const res  = await fetch("/api/transit_search", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({start_date:startDate, end_date:endDate, conditions})
      });
      const data = await res.json();
      if(data.success) setResults(data.periods);
      else setError(data.error || "सर्वर से गलत response");
    } catch(e) { setError("नेटवर्क एरर — सर्वर से connect नहीं हो पाया"); }
    setLoading(false);
  };

  return (
    <div className="p-4 rounded-2xl mb-3 mt-2"
      style={{background:"rgba(8,12,28,.97)", border:`1px solid ${C.teal}30`}}>
      <div className="text-[11px] font-bold uppercase tracking-widest mb-4"
        style={{color:C.teal,...HI}}>🔍 सटीक गोचर खोज</div>

      {/* Date range */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="text-[10px] text-slate-400 block mb-1" style={HI}>कब से शुरू</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-[12px] outline-none"/>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-400 block mb-1" style={HI}>कब तक खत्म</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-[12px] outline-none"/>
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
        {conditions.map((cond,i)=>(
          <div key={i} className="flex gap-2 mb-2 items-center">
            <select value={cond.planet} onChange={e=>updateCond(i,"planet",e.target.value)}
              className="bg-slate-800 border border-slate-600 text-amber-400 p-2 rounded-lg text-[12px] font-bold outline-none">
              {PLANET_LIST.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-slate-500">➔</span>
            <select value={cond.sign} onChange={e=>updateCond(i,"sign",e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-600 text-cyan-400 p-2 rounded-lg text-[12px] outline-none" style={HI}>
              {RASHI_LIST.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {conditions.length>1&&(
              <button onClick={()=>setConditions(conditions.filter((_,j)=>j!==i))}
                className="p-2 text-rose-400 rounded-lg text-[13px]">✕</button>
            )}
          </div>
        ))}
        <button onClick={()=>setConditions([...conditions,{planet:"Ju",sign:4}])}
          className="mt-2 text-[10px] font-bold text-teal-400" style={HI}>
          + और ग्रह जोड़ें
        </button>
      </div>

      {/* Search button */}
      <button onClick={handleSearch} disabled={loading}
        className="w-full font-black py-2.5 rounded-xl text-[13px] transition-opacity"
        style={{background:C.teal, color:"#0f172a", opacity:loading?0.6:1,...HI}}>
        {loading ? "🔄 खोज रहा है..." : "🔍 समय खोजें"}
      </button>

      {/* Error */}
      {error&&(
        <div className="mt-3 p-3 rounded-xl text-[11px]"
          style={{background:"rgba(251,113,133,.1)",border:`1px solid ${C.rose}30`,color:C.rose,...HI}}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {searched && !error && results && (
        <div className="mt-5 p-3 rounded-xl" style={{background:`${C.teal}12`,border:`1px solid ${C.teal}30`}}>
          <h4 className="text-[12px] font-bold mb-2" style={{color:C.teal,...HI}}>
            परिणाम: {results.length} बार योग बना
          </h4>
          {results.length===0
            ? <div className="text-slate-400 text-[11px]" style={HI}>इस अवधि में ऐसी ग्रह स्थिति नहीं है।</div>
            : <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {results.map((p,i)=>(
                  <li key={i} className="bg-slate-900 border border-white/10 p-2.5 rounded-lg text-[11px] flex justify-between items-center">
                    <span className="font-bold" style={{color:C.green}}>{p.start}</span>
                    <span className="text-slate-500 text-[10px]">से</span>
                    <span className="font-bold" style={{color:C.rose}}>{p.end}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      )}
    </div>
  );
}

const TABS=[
  {k:"combined",  l:"📊 समग्र",       color:C.cyan},
  {k:"sati",      l:"🪐 साढ़े साती",  color:C.red},
  {k:"saturn",    l:"🪐 शनि गोचर",   color:C.indigo},
  {k:"jupiter",   l:"♃ गुरु",         color:C.yellow},
  {k:"rahu",      l:"☊ राहु-केतु",   color:C.purple},
  {k:"daily",     l:"📅 दैनिक",       color:C.blue},
  {k:"search",    l:"🔍 गोचर खोज",   color:C.teal},
];

export default function GocharPanel({ chartData }) {
  const [tab, setTab] = useState("combined");
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [transitPos, setTransitPos] = useState(null);

  // Pull saturn/punarjanma from enginesData (formerly from SaturnPanel)
  const saturnData    = chartData?.enginesData?.saturn_transit;
  const punarjanmaData = chartData?.enginesData?.punarjanma;

  // Auto-detect today's date and compute transits
  useEffect(() => {
    const today = new Date();
    setTransitPos(getTransitPositions(today));
  }, []);

  // If user provides custom date
  useEffect(() => {
    if(useCustomDate && customDate) {
      const d = new Date(customDate);
      if(!isNaN(d)) setTransitPos(getTransitPositions(d));
    } else if(!useCustomDate) {
      setTransitPos(getTransitPositions(new Date()));
    }
  }, [useCustomDate, customDate]);

  // Get Moon sign from natal chart (1-indexed)
  const pl = chartData?.planets || {};
  const moonSignStr = pl.Mo?.sign || pl.Mo?.rashi || "";
  const SIGN_MAP = {
    Mesha:1,Vrishabha:2,Mithuna:3,Karka:4,Simha:5,Kanya:6,
    Tula:7,Vrischika:8,Dhanu:9,Makara:10,Kumbha:11,Meena:12,
    Aries:1,Taurus:2,Gemini:3,Cancer:4,Leo:5,Virgo:6,
    Libra:7,Scorpio:8,Sagittarius:9,Capricorn:10,Aquarius:11,Pisces:12,
    मेष:1,वृष:2,मिथुन:3,कर्क:4,सिंह:5,कन्या:6,
    तुला:7,वृश्चिक:8,धनु:9,मकर:10,कुंभ:11,मीन:12,
  };
  // Find moon sign number
  let moonSignNum = null;
  for(const [k,v] of Object.entries(SIGN_MAP)) {
    if(moonSignStr.toLowerCase().includes(k.toLowerCase())) { moonSignNum=v; break; }
  }
  const moonSignHi = moonSignNum ? SIGN_NAMES_HI[moonSignNum-1] : "अज्ञात";

  // Compute transit houses from natal moon
  const saturnH = transitPos?.Saturn?.sign && moonSignNum
    ? getTransitHouse(transitPos.Saturn.sign, moonSignNum) : null;
  const jupiterH = transitPos?.Jupiter?.sign && moonSignNum
    ? getTransitHouse(transitPos.Jupiter.sign, moonSignNum) : null;
  const rahuH = transitPos?.Rahu?.sign && moonSignNum
    ? getTransitHouse(transitPos.Rahu.sign, moonSignNum) : null;
  const ketuH = transitPos?.Ketu?.sign && moonSignNum
    ? getTransitHouse(transitPos.Ketu.sign, moonSignNum) : null;

  // Today display
  const today = useCustomDate && customDate ? new Date(customDate) : new Date();
  const todayStr = today.toLocaleDateString("hi-IN", {day:"numeric",month:"long",year:"numeric"});

  return (
    <div className="pb-8">
      {/* Header — Date Selector */}
      <div className="p-4 rounded-2xl mb-4" style={{background:"rgba(34,211,238,.08)",border:"1px solid rgba(34,211,238,.2)"}}>
        <div className="text-[15px] font-black text-cyan-400 mb-2" style={HI}>🌍 गोचर एवं दशा पूर्वानुमान</div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] text-slate-400 mb-1" style={HI}>
              {useCustomDate?"विशेष तिथि के लिए गोचर:":"आज की तिथि (स्वतः):"}
            </div>
            {useCustomDate ? (
              <input type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-[13px] font-bold text-white"
                style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(34,211,238,.3)",outline:"none"}}/>
            ) : (
              <div className="text-[14px] font-black text-white" style={HI}>📅 {todayStr}</div>
            )}
          </div>
          <button onClick={()=>setUseCustomDate(v=>!v)}
            className="px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            style={{background:useCustomDate?"rgba(34,211,238,.2)":"rgba(255,255,255,.06)",
              color:useCustomDate?C.cyan:"#475569",
              border:`1px solid ${useCustomDate?C.cyan+"40":"rgba(255,255,255,.08)"}`,...HI}}>
            {useCustomDate?"✅ कस्टम तिथि":"📅 तिथि बदलें"}
          </button>
        </div>
        {!moonSignNum&&(
          <div className="mt-2 p-2.5 rounded-xl text-[11px]" style={{background:"rgba(251,146,60,.1)",color:C.orange,...HI}}>
            ⚠️ चंद्र राशि नहीं मिली ({moonSignStr||"खाली"}) — कुंडली में Moon.sign field check करें। गोचर houses सही नहीं दिखेंगे।
          </div>
        )}
      </div>

      {/* Current transit summary strip */}
      {transitPos&&<div className="grid grid-cols-5 gap-1.5 mb-4">
        {[
          {label:"🪐 शनि",sign:transitPos.Saturn.signHi,h:saturnH},
          {label:"♃ गुरु",sign:transitPos.Jupiter.signHi,h:jupiterH},
          {label:"☊ राहु",sign:transitPos.Rahu.signHi,h:rahuH},
          {label:"☋ केतु",sign:transitPos.Ketu.signHi,h:ketuH},
          {label:"♂ मंगल",sign:transitPos.Mars.signHi,h:transitPos.Mars.sign&&moonSignNum?getTransitHouse(transitPos.Mars.sign,moonSignNum):null},
        ].map((pl,i)=>(
          <div key={i} className="p-2 rounded-xl text-center" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)"}}>
            <div className="text-[10px] font-bold text-slate-400" style={HI}>{pl.label}</div>
            <div className="text-[11px] font-black text-white mt-0.5" style={HI}>{pl.sign}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5" style={HI}>{pl.h?`${pl.h}वें`:moonSignNum?"?":"—"}</div>
          </div>
        ))}
      </div>}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{scrollbarWidth:"none"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all"
            style={{background:tab===t.k?`${t.color}20`:"rgba(255,255,255,.04)",
              color:tab===t.k?t.color:"#475569",
              border:tab===t.k?`2px solid ${t.color}45`:"1px solid rgba(255,255,255,.07)",...HI}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          {tab==="combined" && <DashaGocharBlock chartData={chartData} transitPos={transitPos} moonSign={moonSignNum}/>}
          {tab==="sati"     && <>
            <SadeSatiBlock data={saturnData}/>
            <PunarjanmaBlock data={punarjanmaData}/>
          </>}
          {tab==="saturn"  && <Card color={C.indigo}><SLabel color={C.indigo}>🪐 शनि गोचर फलादेश</SLabel>
            <SaturnTransitBlock transitHouse={saturnH} moonSignHi={moonSignHi} date={today} transitPos={transitPos}/></Card>}
          {tab==="jupiter" && <Card color={C.yellow}><SLabel color={C.yellow}>♃ गुरु गोचर फलादेश</SLabel>
            <JupiterTransitBlock transitHouse={jupiterH} moonSignHi={moonSignHi} transitPos={transitPos}/></Card>}
          {tab==="rahu"    && <Card color={C.purple}><SLabel color={C.purple}>☊ राहु-केतु गोचर फलादेश</SLabel>
            <RahuTransitBlock rahuHouse={rahuH} ketuHouse={ketuH} moonSignHi={moonSignHi} transitPos={transitPos}/></Card>}
          {tab==="daily"   && <DailyGocharTab data={chartData?.enginesData?.daily_prediction} />}
          {tab==="search"  && <AdvancedTransitSearcher />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}