// MahapurushPanel.jsx — 5 Mahapurush + 10 Rajyogas + Dasha Predictions + Vish/Pushkar Navamsha
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PLANET_META } from "../../constants";

const HI = { fontFamily:"'Noto Sans Devanagari',sans-serif" };
const C = { amber:"#F59E0B",cyan:"#22D3EE",rose:"#FB7185",green:"#4ADE80",purple:"#C084FC",indigo:"#818CF8",orange:"#FB923C",teal:"#2DD4BF",red:"#EF4444",yellow:"#FCD34D",pink:"#F472B6",blue:"#60A5FA" };
const PH = {Su:"सूर्य ☉",Mo:"चंद्र ☽",Ma:"मंगल ♂",Me:"बुध ☿",Ju:"गुरु ♃",Ve:"शुक्र ♀",Sa:"शनि ♄",Ra:"राहु ☊",Ke:"केतु ☋"};

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

// ═══ MAHAPURUSH YOGAS ═══
const MAHA_YOGAS=[
  {id:"hamsa",planet:"Ju",name:"हंस योग",icon:"🦢",color:C.cyan,
   condition:"गुरु केंद्र (1,4,7,10) में + धनु/मीन/कर्क राशि",
   signs:["Sagittarius","Pisces","Cancer"],
   effect:"धार्मिक, विद्वान, धनी, सम्मानित, दयालु",
   physical:"सुंदर चेहरा, कमल जैसी आंखें, गोरा रंग",
   lifespan:"105 वर्ष",
   special:"गुरु जिस घर में हो — उस भाव का फल 100 गुना बढ़ता है"},
  {id:"malavya",planet:"Ve",name:"मालव्य योग",icon:"💎",color:C.pink,
   condition:"शुक्र केंद्र (1,4,7,10) में + वृषभ/तुला/मीन राशि",
   signs:["Taurus","Libra","Pisces"],
   effect:"सुखी, वाहन, संपत्ति, सुंदर जीवनसाथी, विलासी",
   physical:"आकर्षक व्यक्तित्व, चमकदार त्वचा",
   lifespan:"77 वर्ष",
   special:"शुक्र की राशि में विवाह सुखी, कला में सफलता"},
  {id:"sasha",planet:"Sa",name:"शश योग",icon:"🪨",color:C.indigo,
   condition:"शनि केंद्र (1,4,7,10) में + मकर/कुंभ/तुला राशि",
   signs:["Capricorn","Aquarius","Libra"],
   effect:"कठिन परिश्रम से सफलता, नेता, दीर्घायु",
   physical:"मजबूत शरीर, गंभीर स्वभाव, काला रंग",
   lifespan:"70 वर्ष",
   special:"शनि की दशा में सर्वोच्च उन्नति"},
  {id:"ruchaka",planet:"Ma",name:"रुचक योग",icon:"⚔️",color:C.rose,
   condition:"मंगल केंद्र (1,4,7,10) में + मेष/वृश्चिक/मकर राशि",
   signs:["Aries","Scorpio","Capricorn"],
   effect:"साहसी, योद्धा, सेना/पुलिस में सफल, देशभक्त",
   physical:"मजबूत, लाल रंग, तीखे नैन-नक्श",
   lifespan:"60 वर्ष",
   special:"मंगल की दशा में भूमि/संपत्ति लाभ"},
  {id:"bhadra",planet:"Me",name:"भद्र योग",icon:"🧠",color:C.green,
   condition:"बुध केंद्र (1,4,7,10) में + मिथुन/कन्या राशि",
   signs:["Gemini","Virgo"],
   effect:"बुद्धिमान, वक्ता, लेखक, व्यापारी, अनुकूलनशील",
   physical:"तेज दिमाग, लंबी नाक, पतला शरीर",
   lifespan:"85 वर्ष",
   special:"बुध की दशा में व्यापार में जबरदस्त सफलता"},
];

function checkMahapurush(planet,chartPlanets,lagna) {
  if(!chartPlanets||!chartPlanets[planet])return false;
  const p=chartPlanets[planet];
  const house=p.house;
  const rashi=p.Vargas?.D1?.Rashi||p.rashi||"";
  const inKendra=[1,4,7,10].includes(house);
  const yoga=MAHA_YOGAS.find(y=>y.planet===planet);
  if(!yoga)return false;
  const inGoodSign=yoga.signs.some(s=>rashi.includes(s)||rashi.toLowerCase().includes(s.toLowerCase()));
  return inKendra&&inGoodSign;
}

function MahapurushBlock({chartPlanets,lagna}) {
  const results=MAHA_YOGAS.map(y=>({...y,present:checkMahapurush(y.planet,chartPlanets,lagna)}));
  const found=results.filter(y=>y.present);
  const allFive=found.length===5;
  return <>
    {allFive&&<div className="p-4 rounded-2xl mb-4" style={{background:"linear-gradient(135deg,rgba(245,158,11,.15),rgba(34,211,238,.1))",border:"2px solid rgba(245,158,11,.5)"}}>
      <div className="text-[18px] font-black text-amber-400 mb-2" style={HI}>🌟 पंच महापुरुष योग! (अत्यंत दुर्लभ)</div>
      <div className="text-[13px] text-slate-200" style={HI}>सभी 5 महापुरुष योग एक साथ — महान राजा, सम्राट या युग पुरुष का जीवन!</div>
    </div>}
    {found.length>0&&found.length<5&&<div className="p-3 rounded-2xl mb-3" style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)"}}>
      <div className="text-[14px] font-black text-green-400" style={HI}>✅ {found.length} महापुरुष योग मिले!</div>
    </div>}
    {results.map(y=><div key={y.id} className="p-4 rounded-2xl mb-3"
      style={{background:y.present?`${y.color}10`:"rgba(255,255,255,.02)",
        border:`1.5px solid ${y.present?y.color+"40":"rgba(255,255,255,.08)"}`}}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[24px]">{y.icon}</span>
        <div className="flex-1">
          <div className="text-[15px] font-black" style={{color:y.present?y.color:"#475569",...HI}}>
            {y.name} {y.present?"✅":"—"}
          </div>
          <div className="text-[11px]" style={{color:y.present?y.color+"99":"#334155",...HI}}>{PH[y.planet]}</div>
        </div>
        {y.present&&<span className="text-[11px] px-3 py-1 rounded-full font-bold"
          style={{background:`${y.color}20`,color:y.color,border:`1px solid ${y.color}35`,...HI}}>सक्रिय</span>}
      </div>
      {y.present&&<>
        <div className="text-[12px] text-slate-400 mb-2" style={HI}>🔑 {y.condition}</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl" style={{background:`${y.color}08`}}>
            <div className="text-[11px] font-bold mb-1" style={{color:y.color,...HI}}>✨ जीवन फल:</div>
            <div className="text-[12px] text-slate-200" style={HI}>{y.effect}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/4">
            <div className="text-[11px] font-bold text-slate-400 mb-1" style={HI}>👤 शारीरिक:</div>
            <div className="text-[12px] text-slate-300" style={HI}>{y.physical}</div>
          </div>
        </div>
        <div className="mt-2 p-2 rounded-xl" style={{background:`${y.color}08`}}>
          <div className="text-[12px] text-slate-200" style={HI}>⭐ {y.special} | आयु: {y.lifespan}</div>
        </div>
      </>}
      {!y.present&&<div className="text-[12px] text-slate-600" style={HI}>{y.condition}</div>}
    </div>)}
  </>;
}

// ═══ RAJYOGAS ═══
function checkVipreet(lord,chartPlanets) {
  if(!chartPlanets?.[lord])return false;
  return [6,8,12].includes(chartPlanets[lord].house);
}
function checkNeechBhang(planet,chartPlanets) {
  // Simple check: debilitated planet in kendra
  if(!chartPlanets?.[planet])return false;
  const p=chartPlanets[planet];
  const debilSigns={Su:"Libra",Mo:"Scorpio",Ma:"Cancer",Me:"Pisces",Ju:"Capricorn",Ve:"Virgo",Sa:"Aries"};
  const rashi=p.Vargas?.D1?.Rashi||p.rashi||"";
  const isDebil=debilSigns[planet]&&(rashi.includes(debilSigns[planet])||/नीच/.test(p.Dignity||""));
  const inKendra=[1,4,7,10].includes(p.house);
  return isDebil&&inKendra;
}

function RajyogaBlock({chartPlanets,lagna}) {
  const p=chartPlanets||{};
  const yogas=[];
  // Vipreet
  const h6l=null,h8l=null,h12l=null; // would need houseLords
  // Gajakesari
  if(p.Ju&&p.Mo){const diff=Math.abs(p.Ju.house-p.Mo.house);const norm=Math.min(diff,12-diff);
    if([0,3,6,9].includes(norm))yogas.push({n:"गजकेसरी योग",c:C.cyan,icon:"🐘",
      present:true,effect:"राजा जैसा जीवन, धनी, प्रसिद्ध, सम्मानित",
      reason:`गुरु ${p.Ju.house}वें + चंद्र ${p.Mo.house}वें — केंद्र में`});}
  else yogas.push({n:"गजकेसरी योग",c:C.cyan,icon:"🐘",present:false,effect:"गुरु-चंद्र केंद्र में नहीं",reason:"गुरु चंद्र से केंद्र में नहीं"});
  // Lakshmi Yoga: 9th lord in kendra + strong
  if(p.Ve&&[1,4,7,10].includes(p.Ve.house)&&/उच्च|स्वराशि/.test(p.Ve.Dignity||""))
    yogas.push({n:"लक्ष्मी योग",c:C.pink,icon:"🌸",present:true,effect:"अपार धन, राजकीय सुख, वैभव",reason:`शुक्र ${p.Ve.house}वें में उच्च/स्वराशि`});
  else yogas.push({n:"लक्ष्मी योग",c:C.pink,icon:"🌸",present:false,effect:"शुक्र केंद्र में उच्च/स्वराशि नहीं",reason:""});
  // Saraswati
  const budhOk=p.Me&&[1,2,4,5,7,9,10,11].includes(p.Me.house);
  const guruOk=p.Ju&&[1,2,4,5,7,9,10,11].includes(p.Ju.house);
  const shukrOk=p.Ve&&[1,2,4,5,7,9,10,11].includes(p.Ve.house);
  if(budhOk&&guruOk&&shukrOk)yogas.push({n:"सरस्वती योग",c:C.green,icon:"📚",present:true,effect:"विद्वान, कलाकार, लेखक, प्रसिद्ध",reason:"गुरु+बुध+शुक्र तीनों केंद्र/त्रिकोण में"});
  else yogas.push({n:"सरस्वती योग",c:C.green,icon:"📚",present:false,effect:"गुरु/बुध/शुक्र तीनों केंद्र/त्रिकोण में नहीं",reason:""});
  // Amala: benefic in 10th
  const benInTen=["Ju","Ve","Mo","Me"].some(c=>p[c]?.house===10);
  if(benInTen){const who=["Ju","Ve","Mo","Me"].filter(c=>p[c]?.house===10)[0];
    yogas.push({n:"अमल योग",c:C.teal,icon:"✨",present:true,effect:"स्थायी प्रसिद्धि, कीर्ति, सम्मान",reason:`${PH[who]} 10वें भाव में`});}
  else yogas.push({n:"अमल योग",c:C.teal,icon:"✨",present:false,effect:"शुभ ग्रह 10वें में नहीं",reason:""});
  // Adhi: benefics in 6,7,8 from Moon
  if(p.Mo){const moonH=p.Mo.house;
    const bens=["Ju","Ve","Me"].filter(c=>p[c]&&[((moonH+4)%12)||12,((moonH+5)%12)||12,((moonH+6)%12)||12].includes(p[c].house));
    if(bens.length>=2)yogas.push({n:"आधि योग",c:C.indigo,icon:"👑",present:true,effect:"नेतृत्व, प्रभाव, मंत्री/उच्च पद",reason:`चंद्र से 6/7/8वें में ${bens.map(c=>PH[c]).join(", ")}`});
    else yogas.push({n:"आधि योग",c:C.indigo,icon:"👑",present:false,effect:"चंद्र से 6/7/8 में 2+ शुभ नहीं",reason:""});}
  // Budh-Aditya (Sun+Mercury together)
  if(p.Su&&p.Me&&p.Su.house===p.Me.house)
    yogas.push({n:"बुधादित्य योग",c:C.yellow,icon:"☀️",present:true,effect:"तेज बुद्धि, वक्ता, राजकीय सम्मान",reason:`सूर्य+बुध ${p.Su.house}वें भाव में`});
  else yogas.push({n:"बुधादित्य योग",c:C.yellow,icon:"☀️",present:false,effect:"सूर्य+बुध एक साथ नहीं",reason:""});
  // Chamara: Lagnesh exalted in kendra
  const EXALT={Su:1,Mo:2,Ma:10,Me:6,Ju:4,Ve:12,Sa:7};
  const lagnaSign=lagna;
  yogas.push({n:"चामर योग",c:C.amber,icon:"🎖️",present:false,effect:"राजकीय जीवन — Lagnesh उच्च केंद्र में",reason:"Lagnesh उच्च केंद्र में होना जरूरी"});
  // Vipreet
  const h6lord=null; // Simplified
  yogas.push({n:"विपरीत राजयोग (हर्ष)",c:C.orange,icon:"🔄",present:false,effect:"शत्रु से विजय — 6ठे का स्वामी 6/8/12 में",reason:"6ठे/8वें/12वें के स्वामी 6/8/12 में हों"});
  // Neech Bhang
  const nbPlanets=["Su","Mo","Ma","Me","Ju","Ve","Sa"].filter(c=>checkNeechBhang(c,p));
  if(nbPlanets.length>0)yogas.push({n:"नीचभंग राजयोग",c:C.green,icon:"⬆️",present:true,effect:"गरीबी से अमीरी! अचानक उत्थान",reason:`${nbPlanets.map(c=>PH[c]).join(", ")} नीच पर केंद्र में`});
  else yogas.push({n:"नीचभंग राजयोग",c:C.green,icon:"⬆️",present:false,effect:"कोई नीचभंग नहीं",reason:""});
  const found=yogas.filter(y=>y.present);
  return <>
    <div className="p-3 rounded-xl mb-3" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
      <div className="text-[15px] font-black text-amber-400" style={HI}>✨ {found.length} राजयोग मिले ({yogas.length} में से)</div>
    </div>
    {yogas.map((y,i)=><div key={i} className="p-3 rounded-xl mb-2"
      style={{background:y.present?`${y.color}0A`:"rgba(255,255,255,.02)",
        border:`1px solid ${y.present?y.color+"30":"rgba(255,255,255,.06)"}`}}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[18px]">{y.icon}</span>
        <span className="text-[13px] font-black" style={{color:y.present?y.color:"#475569",...HI}}>{y.n}</span>
        {y.present&&<span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
          style={{background:`${y.color}20`,color:y.color,...HI}}>✅ सक्रिय</span>}
      </div>
      <div className="text-[12px]" style={{color:y.present?"#CBD5E1":"#334155",...HI}}>{y.present?y.effect:y.effect}</div>
      {y.present&&y.reason&&<div className="text-[11px] text-slate-500 mt-0.5" style={HI}>🪐 {y.reason}</div>}
    </div>)}
  </>;
}

// ═══ DASHA PREDICTIONS ═══
const DASHA_DATA={
  Su:{years:6,icon:"☉",color:C.yellow,name:"सूर्य महादशा",
    good:["सरकारी लाभ","पिता का सहयोग","नेतृत्व का अवसर","राजकीय सम्मान"],
    bad:["अहंकार की समस्या","आंख/हृदय रोग संभव","पिता से तनाव (कमजोर सूर्य)"],
    areas:"सरकार, राजनीति, पिता, नेतृत्व, पशु चिकित्सा",
    tip:"इस दशा में सरकारी काम, राजकीय संबंध बनाएं"},
  Mo:{years:10,icon:"☽",color:C.blue,name:"चंद्र महादशा",
    good:["माता का आशीर्वाद","जनता से प्रेम","व्यापार में वृद्धि","संपत्ति लाभ","विदेश यात्रा"],
    bad:["मानसिक उथल-पुथल","जल/नमी से रोग","माता की तबियत"],
    areas:"जनता, माता, मन, जल व्यापार, कृषि",
    tip:"इस दशा में माता की सेवा करें, मन को शांत रखें"},
  Ma:{years:7,icon:"♂",color:C.rose,name:"मंगल महादशा",
    good:["भूमि/संपत्ति लाभ","सेना/पुलिस में सफलता","साहस से आगे बढ़ना","भाई से लाभ"],
    bad:["दुर्घटना/चोट का खतरा","रक्त विकार","भाई से झगड़ा","बहुत ऊर्जा — संभालें"],
    areas:"भूमि, भाई, सेना, इंजीनियरिंग, शल्य चिकित्सा",
    tip:"इस दशा में भूमि खरीदें, साहसी काम करें"},
  Ra:{years:18,icon:"☊",color:C.indigo,name:"राहु महादशा",
    good:["विदेश में सफलता","तकनीक में उन्नति","अचानक बड़ा लाभ","राजनीति में उभरना"],
    bad:["भ्रम और भटकाव","नाना से दूरी","असामान्य बीमारियां","धोखाधड़ी का शिकार"],
    areas:"विदेश, तकनीक, राजनीति, जासूसी, रसायन",
    tip:"18 साल की लंबी दशा — विदेश के अवसर भुनाएं"},
  Ju:{years:16,icon:"♃",color:C.yellow,name:"गुरु महादशा",
    good:["संतान जन्म","धन-संपत्ति वृद्धि","ज्ञान और शिक्षा","विवाह के योग","यात्रा लाभ"],
    bad:["मोटापा","लिवर समस्या (कमजोर गुरु)","अति उदारता"],
    areas:"शिक्षा, धर्म, संतान, न्यायालय, बैंकिंग",
    tip:"इस दशा में शिक्षा/धर्म में निवेश करें, दान दें"},
  Sa:{years:19,icon:"♄",color:C.indigo,name:"शनि महादशा",
    good:["मेहनत का पक्का फल","दीर्घकालिक सफलता","नौकरशाही में उन्नति","आध्यात्म"],
    bad:["देरी हर चीज में","जोड़ों का दर्द","पुराने रोग","मानसिक थकान"],
    areas:"न्याय, श्रम, कृषि, लोहा, तेल",
    tip:"19 साल की दशा — धैर्य रखें, परिश्रम करते रहें"},
  Me:{years:17,icon:"☿",color:C.green,name:"बुध महादशा",
    good:["व्यापार में सफलता","लेखन/वाणी से लाभ","भांजे से लाभ","मीडिया में उभरना"],
    bad:["त्वचा रोग","चालाकी में फंसना","मित्र से धोखा"],
    areas:"व्यापार, लेखन, मीडिया, गणित, कंप्यूटर",
    tip:"इस दशा में व्यापार, लेखन, शिक्षा में आगे बढ़ें"},
  Ke:{years:7,icon:"☋",color:C.teal,name:"केतु महादशा",
    good:["आध्यात्मिक उन्नति","गूढ़ ज्ञान","पितामह से लाभ","मोक्ष की राह"],
    bad:["रहस्यमय बीमारियां","दुर्घटना","भटकाव","नुकसान"],
    areas:"आध्यात्म, तंत्र, पशु चिकित्सा, दर्शन",
    tip:"इस दशा में ध्यान/साधना करें, तीर्थ यात्राएं करें"},
  Ve:{years:20,icon:"♀",color:C.pink,name:"शुक्र महादशा",
    good:["विवाह/प्रेम","वाहन/संपत्ति","कला में सफलता","विलासिता","स्त्री सुख"],
    bad:["मधुमेह/चीनी रोग","यौन रोग","अत्यधिक विलासिता","खर्चे"],
    areas:"कला, मनोरंजन, विवाह, फैशन, सौंदर्य",
    tip:"20 साल सबसे लंबी — विवाह, कला, संपत्ति के लिए सबसे अच्छा समय"},
};

function DashaPredBlock({chartData}) {
  const dasha=chartData?.dasha||{};
  const current=dasha.current||{};
  const timeline=dasha.timeline||[];
  const [sel,setSel]=useState(current.mahadasha?.slice(0,2)||"Su");
  const dd=DASHA_DATA[sel];
  const PLANET_ORDER=["Su","Mo","Ma","Ra","Ju","Sa","Me","Ke","Ve"];
  return <>
    <Card color={C.amber}>
      <SLabel color={C.amber}>वर्तमान दशा फल</SLabel>
      {current.mahadasha&&<div className="p-4 rounded-xl mb-3" style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)"}}>
        <div className="text-[16px] font-black text-amber-400 mb-1" style={HI}>⚡ {current.mahadasha} महादशा चल रही है</div>
        {current.antardasha&&<div className="text-[13px] text-slate-300" style={HI}>अंतर्दशा: {current.antardasha}</div>}
        {current.endDate&&<div className="text-[11px] text-slate-500 mt-1" style={HI}>समाप्ति: {current.endDate}</div>}
      </div>}
    </Card>
    {/* Dasha selector */}
    <div className="grid grid-cols-5 gap-1.5 mb-4">
      {PLANET_ORDER.map(c=>{
        const dd2=DASHA_DATA[c];if(!dd2)return null;
        const isCur=current.mahadasha?.includes(dd2.name.split(" ")[0]);
        return <button key={c} onClick={()=>setSel(c)}
          className="py-2.5 rounded-xl text-[11px] font-black transition-all flex flex-col items-center gap-0.5"
          style={{background:c===sel?`${dd2.color}20`:isCur?"rgba(245,158,11,.08)":"rgba(255,255,255,.04)",
            color:c===sel?dd2.color:isCur?C.amber:"#475569",
            border:c===sel?`2px solid ${dd2.color}50`:isCur?`1px solid ${C.amber}30`:"1px solid rgba(255,255,255,.08)"}}>
          <span style={HI}>{dd2.icon}</span>
          <span style={HI}>{dd2.years}yr</span>
        </button>;
      })}
    </div>
    {dd&&<motion.div key={sel} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
      <Card color={dd.color}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[28px]">{dd.icon}</span>
          <div>
            <div className="text-[16px] font-black" style={{color:dd.color,...HI}}>{dd.name}</div>
            <div className="text-[12px] text-slate-400" style={HI}>अवधि: {dd.years} वर्ष</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-3 rounded-xl" style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)"}}>
            <div className="text-[12px] font-bold text-green-400 mb-2" style={HI}>✅ शुभ फल:</div>
            {dd.good.map((g,i)=><div key={i} className="text-[12px] text-slate-200 mb-1" style={HI}>• {g}</div>)}
          </div>
          <div className="p-3 rounded-xl" style={{background:"rgba(251,113,133,.08)",border:"1px solid rgba(251,113,133,.2)"}}>
            <div className="text-[12px] font-bold text-rose-400 mb-2" style={HI}>⚠️ सावधानी:</div>
            {dd.bad.map((b,i)=><div key={i} className="text-[12px] text-slate-200 mb-1" style={HI}>• {b}</div>)}
          </div>
        </div>
        <div className="p-3 rounded-xl mb-2" style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)"}}>
          <div className="text-[12px] font-bold text-amber-400 mb-1" style={HI}>💡 टिप्स:</div>
          <div className="text-[13px] text-slate-200" style={HI}>{dd.tip}</div>
        </div>
        <div className="p-3 rounded-xl" style={{background:"rgba(255,255,255,.04)"}}>
          <div className="text-[12px] font-bold text-slate-400 mb-1" style={HI}>🎯 क्षेत्र:</div>
          <div className="text-[12px] text-slate-300" style={HI}>{dd.areas}</div>
        </div>
      </Card>
    </motion.div>}
  </>;
}

// ═══ VISH & PUSHKAR NAVAMSHA ═══
const PUSHKAR_DEG={
  Aries:21,Leo:21,Sagittarius:21,
  Taurus:14,Virgo:14,Capricorn:14,
  Gemini:24,Libra:24,Aquarius:24,
  Cancer:7,Scorpio:7,Pisces:7,
};
const VISH_RANGES=[
  {signs:["Aries","Taurus","Gemini","Cancer"],range:[0,3.33]},
  {signs:["Leo","Virgo","Libra","Scorpio"],range:[13.33,16.67]},
  {signs:["Sagittarius","Capricorn","Aquarius","Pisces"],range:[26.67,30]},
];
function checkPushkar(planet) {
  if(!planet)return false;
  const rashi=planet.Vargas?.D1?.Rashi||planet.rashi||"";
  const deg=planet.Degree%30||0;
  const pushkarDeg=PUSHKAR_DEG[rashi];
  return pushkarDeg&&Math.abs(deg-pushkarDeg)<=2;
}
function checkVish(planet) {
  if(!planet)return false;
  const rashi=planet.Vargas?.D1?.Rashi||planet.rashi||"";
  const deg=planet.Degree%30||0;
  const range=VISH_RANGES.find(v=>v.signs.includes(rashi));
  return range&&deg>=range.range[0]&&deg<=range.range[1];
}

function NavamshaBlock({chartPlanets}) {
  if(!chartPlanets)return null;
  const pushkarPlanets=Object.entries(chartPlanets).filter(([c,p])=>checkPushkar(p));
  const vishPlanets=Object.entries(chartPlanets).filter(([c,p])=>checkVish(p));
  const PLANET_CODES=["Su","Mo","Ma","Me","Ju","Ve","Sa","Ra","Ke"];
  return <>
    <Card color={C.green}>
      <SLabel color={C.green}>✨ पुष्कर नवमांश — दिन-दुगना रात-चौगुना</SLabel>
      <div className="text-[12px] text-slate-400 mb-3" style={HI}>
        जिस राशि में ग्रह हो, उस राशि की पुष्कर डिग्री के ±2° में हो तो = सुख दिन-दुगना
      </div>
      {pushkarPlanets.length>0?pushkarPlanets.map(([c,p])=>{
        const pm=PLANET_META[c]||{};
        return <div key={c} className="p-3 rounded-xl mb-2" style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)"}}>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{pm.symbol}</span>
            <span className="text-[14px] font-black text-green-400" style={HI}>{pm.hindi||c} — पुष्कर नवमांश!</span>
            <span className="ml-auto text-[12px] text-green-300" style={{fontFamily:"monospace"}}>{(p.Degree%30)?.toFixed(2)}°</span>
          </div>
          <div className="text-[12px] text-slate-300 mt-1" style={HI}>✅ {p.house}वें भाव का फल दोगुना-चौगुना मिलेगा</div>
        </div>;
      }):<div className="text-[13px] text-slate-500 text-center py-3" style={HI}>कोई ग्रह पुष्कर नवमांश में नहीं</div>}
    </Card>
    <Card color={C.red}>
      <SLabel color={C.red}>⚠️ विष नवमांश — अस्थिरता का संकेत</SLabel>
      <div className="text-[12px] text-slate-400 mb-3" style={HI}>
        विशेष डिग्री रेंज में ग्रह = उस भाव में अस्थिरता, कमाकर खोना
      </div>
      {vishPlanets.length>0?vishPlanets.map(([c,p])=>{
        const pm=PLANET_META[c]||{};
        return <div key={c} className="p-3 rounded-xl mb-2" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)"}}>
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{pm.symbol}</span>
            <span className="text-[14px] font-black text-red-400" style={HI}>{pm.hindi||c} — विष नवमांश</span>
          </div>
          <div className="text-[12px] text-rose-300 mt-1" style={HI}>⚠️ {p.house}वें भाव में अस्थिरता — कमाकर खोना, ध्यान दें</div>
        </div>;
      }):<div className="text-[13px] text-green-400 text-center py-3" style={HI}>✅ कोई ग्रह विष नवमांश में नहीं — शुभ!</div>}
    </Card>
    {/* Full table */}
    <Card color={C.purple}>
      <SLabel color={C.purple}>सभी ग्रहों का नवमांश स्थिति</SLabel>
      {PLANET_CODES.map(c=>{
        const p=chartPlanets[c];if(!p)return null;
        const isPu=checkPushkar(p),isVi=checkVish(p);
        const pm=PLANET_META[c]||{};
        return <div key={c} className="flex items-center gap-2 p-2 rounded-lg mb-1"
          style={{background:isPu?"rgba(74,222,128,.06)":isVi?"rgba(239,68,68,.06)":"rgba(255,255,255,.02)"}}>
          <span style={{color:pm.color}}>{pm.symbol}</span>
          <span className="text-[12px] text-white font-bold" style={HI}>{pm.hindi||c}</span>
          <span className="text-[11px] text-slate-500 flex-1" style={{fontFamily:"monospace"}}>{(p.Degree%30)?.toFixed(2)}° | {p.Vargas?.D1?.Rashi||""}</span>
          {isPu&&<span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold" style={HI}>✨ पुष्कर</span>}
          {isVi&&<span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold" style={HI}>⚠️ विष</span>}
          {!isPu&&!isVi&&<span className="text-[11px] text-slate-600" style={HI}>सामान्य</span>}
        </div>;
      })}
    </Card>
  </>;
}

// ═══ CHARACTER ANALYSIS ═══
function CharacterBlock({chartPlanets}) {
  if(!chartPlanets)return null;
  const Ve=chartPlanets.Ve,Ma=chartPlanets.Ma,Mo=chartPlanets.Mo,Ra=chartPlanets.Ra,Sa=chartPlanets.Sa;
  const analyses=[];
  // Venus
  if(Ve){
    const veDig=Ve.Dignity||"",veH=Ve.house;
    let veChar="";
    if(veH===12)veChar="प्रेम में अनेक संबंध, विवाह से पहले शारीरिक संबंध का खतरा";
    else if(/नीच/.test(veDig))veChar="केवल भोग की इच्छा, प्रेम की सच्ची समझ कम";
    else if(Ma&&Ve.house===Ma.house)veChar="तीव्र आकर्षण, प्रेम में जल्दी आगे बढ़ना";
    else if(Ra&&Ve.house===Ra.house)veChar="असामान्य प्रेम रुचि, विदेशी से आकर्षण";
    else if(/उच्च|स्वराशि/.test(veDig))veChar="✅ स्त्री-पुरुष का सम्मान, एक साथी के प्रति समर्पित";
    else veChar="सामान्य प्रेम जीवन";
    analyses.push({icon:"♀",name:"शुक्र — प्रेम स्वभाव",color:C.pink,text:veChar,house:`${veH}वें भाव में`});
  }
  // Mars
  if(Ma){
    const maH=Ma.house,maDig=Ma.Dignity||"";
    let maChar="";
    if(maH===7)maChar="रिश्तों में आक्रामकता, जीवनसाथी से झगड़े";
    else if(/उच्च/.test(maDig))maChar="✅ उच्च ऊर्जा, साहस, बलशाली";
    else if(/नीच/.test(maDig))maChar="कम शारीरिक ऊर्जा, रक्त विकार";
    else if(Ve&&Ma.house===Ve.house)maChar="तीव्र शारीरिक आकर्षण, प्रेम में जुनून";
    else maChar="सामान्य ऊर्जा और साहस";
    analyses.push({icon:"♂",name:"मंगल — ऊर्जा स्वभाव",color:C.rose,text:maChar,house:`${maH}वें भाव में`});
  }
  // Moon
  if(Mo){
    const moH=Mo.house,moDig=Mo.Dignity||"";
    let moChar="";
    if(Ra&&Mo.house===Ra.house)moChar="भ्रमित मन, अस्थिर संबंध, मानसिक उथल-पुथल";
    else if(/नीच/.test(moDig)||moH===8)moChar="भावनात्मक अस्थिरता, रिश्तों में अनिश्चितता";
    else if(/उच्च|स्वराशि/.test(moDig))moChar="✅ भावनात्मक स्थिरता, सुखी संबंध";
    else moChar="संवेदनशील, भावुक स्वभाव";
    analyses.push({icon:"☽",name:"चंद्र — भावनात्मक स्वभाव",color:C.blue,text:moChar,house:`${moH}वें भाव में`});
  }
  // 7th house
  const h7Planets=Object.entries(chartPlanets).filter(([c,p])=>p.house===7);
  if(h7Planets.length>0){
    const malefics=h7Planets.filter(([c])=>["Ma","Sa","Ra","Ke","Su"].includes(c));
    const benefics=h7Planets.filter(([c])=>["Ju","Ve","Mo","Me"].includes(c));
    let h7Char="";
    if(h7Planets.length>=3)h7Char="⚠️ 7वें में 3+ ग्रह — रिश्तों में जटिलता";
    else if(malefics.length>benefics.length)h7Char="⚠️ पाप ग्रह प्रबल — तनावपूर्ण रिश्ते";
    else h7Char="✅ शुभ ग्रह — सुखी वैवाहिक जीवन";
    analyses.push({icon:"💑",name:"7वां भाव — वैवाहिक जीवन",color:C.pink,text:h7Char,
      house:`${h7Planets.map(([c])=>PLANET_META[c]?.hindi||c).join(", ")}`});
  }
  return <Card color={C.pink}>
    <SLabel color={C.pink}>💕 चरित्र एवं प्रेम विश्लेषण</SLabel>
    {analyses.map((a,i)=><div key={i} className="p-3 rounded-xl mb-2"
      style={{background:`${a.color}08`,border:`1px solid ${a.color}20`}}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[18px]">{a.icon}</span>
        <span className="text-[13px] font-black" style={{color:a.color,...HI}}>{a.name}</span>
        <span className="text-[11px] text-slate-500 ml-auto" style={HI}>{a.house}</span>
      </div>
      <div className="text-[13px] text-slate-200" style={HI}>{a.text}</div>
    </div>)}
  </Card>;
}

// ═══ MAIN ═══
export default function MahapurushPanel({chartData}) {
  const pl=chartData?.planets||{};
  const lagna=chartData?.lagna??0;
  return <div className="pb-8">
    <Section icon="🦢" title="पंच महापुरुष योग" color={C.cyan} defaultOpen={true}>
      <MahapurushBlock chartPlanets={pl} lagna={lagna}/>
    </Section>
    <Section icon="👑" title="राजयोग विश्लेषण" color={C.amber} defaultOpen={true}>
      <RajyogaBlock chartPlanets={pl} lagna={lagna}/>
    </Section>
    <Section icon="⏳" title="दशा फल — 9 महादशाएं" color={C.yellow} defaultOpen={true}>
      <DashaPredBlock chartData={chartData}/>
    </Section>
    <Section icon="💫" title="पुष्कर / विष नवमांश" color={C.green}>
      <NavamshaBlock chartPlanets={pl}/>
    </Section>
    <Section icon="💕" title="चरित्र एवं प्रेम विश्लेषण" color={C.pink}>
      <CharacterBlock chartPlanets={pl}/>
    </Section>
  </div>;
}
