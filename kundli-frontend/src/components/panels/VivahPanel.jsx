/**
 * VivahPanel.jsx — v5.0
 * 33 modules · sutras_with_status · definition boxes · per-sutra indicators
 */
import { CollapsibleSection, EmptyState, GlassCard } from "../shared/ui";
import { HI } from "../shared/designTokens";
import useKundliStore from "../../store/useKundliStore";

const pass="#22D3EE", warn="#FCD34D", fail="#FB7185", gold="#F59E0B";
const info="#C084FC", neut="#94A3B8", grn="#4ADE80";

function Verdict({text,color}){
  if(!text) return null;
  return <div style={{display:"inline-block",padding:"5px 14px",borderRadius:"20px",marginBottom:"8px",
    background:`${color}18`,border:`1.5px solid ${color}55`,fontSize:"0.82rem",fontWeight:700,color,...HI}}>{text}</div>;
}
function Row({text,color="rgba(255,255,255,0.8)"}){
  if(!text) return null;
  return <div style={{display:"flex",gap:"8px",alignItems:"flex-start",padding:"7px 10px",
    borderRadius:"8px",marginBottom:"5px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
    <span style={{fontSize:"0.79rem",...HI,color,lineHeight:1.5,flex:1}}>{text}</span>
  </div>;
}
function autoColor(t){
  if(!t) return "rgba(255,255,255,0.75)";
  if(t.startsWith("✅")) return grn;
  if(t.startsWith("⚠️")) return warn;
  if(t.startsWith("❌")) return fail;
  if(t.startsWith("💘")||t.startsWith("💕")||t.startsWith("👑")) return info;
  if(t.startsWith("📜")||t.startsWith("📌")||t.startsWith("📅")) return "rgba(255,255,255,0.5)";
  if(t.startsWith("⏰")||t.startsWith("🕐")||t.startsWith("🙏")) return gold;
  return "rgba(255,255,255,0.8)";
}
function RowList({items,color}){
  if(!items?.length) return null;
  return <>{items.map((t,i)=><Row key={i} text={t} color={color||autoColor(t)}/>)}</>;
}
function ChipRow({label,items,color}){
  if(!items?.length) return null;
  return <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap",marginBottom:"6px"}}>
    <span style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.45)",...HI,minWidth:"90px"}}>{label}:</span>
    {items.map((p,i)=><span key={i} style={{padding:"2px 10px",borderRadius:"8px",fontSize:"0.75rem",
      fontWeight:700,background:`${color}20`,border:`1px solid ${color}50`,color,...HI}}>{p}</span>)}
  </div>;
}
function SLabel({children}){
  return <div style={{...HI,fontSize:"0.7rem",color:"rgba(255,255,255,0.45)",fontWeight:600,marginBottom:"6px"}}>{children}</div>;
}
function Div(){return <div style={{height:"1px",background:"rgba(255,255,255,0.08)",margin:"10px 0"}}/>;}
function BhavBar({sav,bhav,weight}){
  const col=sav>=28?grn:sav>=22?warn:sav>=14?fail:"#EF4444";
  const label=sav>=28?"✅ बलवान":sav>=22?"🟡 सामान्य":sav>=14?"⚠️ कमजोर":"❌ अत्यंत कमजोर";
  return <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",
    borderRadius:"10px",marginBottom:"6px",background:"rgba(255,255,255,0.04)",border:`1px solid ${col}30`}}>
    <div style={{...HI,fontSize:"0.8rem",color:"rgba(255,255,255,0.8)",flex:2}}>{bhav}</div>
    <div style={{padding:"3px 10px",borderRadius:"8px",minWidth:"44px",textAlign:"center",
      background:`${col}18`,border:`1px solid ${col}45`,fontSize:"0.82rem",fontWeight:800,color:col,fontFamily:"monospace"}}>{sav}</div>
    {weight&&<div style={{...HI,fontSize:"0.7rem",color:"rgba(255,255,255,0.4)",width:"30px"}}>{weight}</div>}
    <div style={{...HI,fontSize:"0.72rem",color:col,flex:1}}>{label}</div>
  </div>;
}

// SutraRow — हर सूत्र के आगे indicator + नियम + result
function SutraRow({sutra,applied,result}){
  const icon=applied===true?"🔴":"🟢";
  const borderCol=applied===true?`${fail}50`:`${grn}40`;
  const bg=applied===true?`${fail}08`:"rgba(255,255,255,0.03)";
  return (
    <div style={{borderRadius:"10px",marginBottom:"6px",overflow:"hidden",border:`1px solid ${borderCol}`,background:bg}}>
      <div style={{display:"flex",gap:"8px",alignItems:"flex-start",padding:"6px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <span style={{fontSize:"0.78rem",flexShrink:0,marginTop:"1px"}}>{icon}</span>
        <span style={{...HI,fontSize:"0.76rem",color:"rgba(255,255,255,0.5)",fontStyle:"italic",lineHeight:1.5,flex:1}}>📜 {sutra}</span>
      </div>
      <div style={{padding:"5px 10px 6px 28px"}}>
        <span style={{...HI,fontSize:"0.78rem",color:applied?"rgba(251,113,133,0.95)":"rgba(74,222,128,0.9)",fontWeight:600,lineHeight:1.5}}>{result}</span>
      </div>
    </div>
  );
}

// DefinitionBox — section के ऊपर नियम summary
function DefinitionBox({title,rules,color}){
  if(!rules?.length) return null;
  const c=color||gold;
  return (
    <div style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"10px",background:`${c}0a`,border:`1px solid ${c}30`}}>
      <div style={{...HI,fontSize:"0.68rem",fontWeight:700,color:c,marginBottom:"5px",textTransform:"uppercase",letterSpacing:"0.05em"}}>📋 {title}</div>
      {rules.map((r,i)=>(
        <div key={i} style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.6)",lineHeight:1.6,
          paddingLeft:"8px",borderLeft:`2px solid ${c}40`,marginBottom:i<rules.length-1?"4px":0}}>{r}</div>
      ))}
    </div>
  );
}

// SutraList — full sutras_with_status list
function SutraList({sutras}){
  if(!sutras?.length) return null;
  return (
    <div style={{marginTop:"8px"}}>
      <SLabel>🔍 सभी सूत्र — इस कुंडली में लागू स्थिति:</SLabel>
      <div style={{...HI,fontSize:"0.67rem",color:"rgba(255,255,255,0.35)",marginBottom:"6px",paddingLeft:"4px"}}>
        🔴 = यह दोष/नियम इस कुंडली में लागू है &nbsp;|&nbsp; 🟢 = लागू नहीं
      </div>
      {sutras.map((s,i)=><SutraRow key={i} sutra={s.sutra} applied={s.applied} result={s.result}/>)}
    </div>
  );
}

export default function VivahPanel(){
  const chartData=useKundliStore(s=>s.chartData);
  if(!chartData)
    return <EmptyState icon="💍" message="पहले कुंडली लोड करें" subtext="विवाह विश्लेषण के लिए जन्म कुंडली जरूरी है"/>;
  const vd=chartData?.enginesData?.vivah;
  if(!vd||!vd.saptam)
    return <EmptyState icon="⏳" message="विवाह डेटा लोड हो रहा है..." subtext="Phase 2 engines का इंतजार करें"/>;

  const {
    saptam,mangalik,vilamb,prem_vivah,prem_sambandh,
    vichchhed,swabhaav,avivahit,vivah_kaal,daampatya_sukh,
    vaidhavya,dwi_vivah,vyabhichar,vyabhichar_basic,vivah_bhagya,daihi_aakrshan,
    kul_nirdharan,combos_7th,shukra_sep,anterjatiya,
    muhurta,chandra_bal,rahu_checks,attraction,d9_hints,
    vivah_saham,vish_navamsha,ugra_nakshatra,sasural_disha,
    mangalik_vish,d9_saccha_prem,paracetamol,dosha_yogas,sapt_varga,
  }=vd;

  return <div className="p-3 space-y-3">

    <div style={{borderBottom:"1px solid rgba(255,255,255,0.08)",paddingBottom:"10px"}}>
      <div style={{...HI,fontWeight:800,fontSize:"1.05rem",color:"#F472B6"}}>💍 विवाह विश्लेषण</div>
      <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.45)",marginTop:"3px",...HI}}>33 मॉड्यूल · v5.0 · हर सूत्र की परिभाषा + लागू स्थिति</div>
      <div style={{marginTop:"6px",display:"flex",gap:"10px",flexWrap:"wrap"}}>
        <span style={{...HI,fontSize:"0.67rem",color:"rgba(251,113,133,0.8)"}}>🔴 = यह दोष लागू है</span>
        <span style={{...HI,fontSize:"0.67rem",color:"rgba(74,222,128,0.8)"}}>🟢 = यह दोष नहीं है</span>
        <span style={{...HI,fontSize:"0.67rem",color:"rgba(255,255,255,0.4)"}}>📋 = section नियम &nbsp; 📜 = शास्त्र सूत्र</span>
      </div>
    </div>

    {/* 1. SAPTAM */}
    <CollapsibleSection icon="💑" title="सप्तम भाव — विवाह का मूल"
      color={saptam?.h7_sav>=28?pass:saptam?.h7_sav<=22?fail:warn} defaultOpen={true}>
      <div style={{padding:"4px 0 8px"}}>
        <Verdict text={saptam?.verdict} color={saptam?.color||warn}/>
        <DefinitionBox title="सप्तम भाव के नियम" color={warn} rules={[
          "SAV ≥ 28 = बलवान — सुखमय दांपत्य ✅",
          "SAV 14-22 = खतरे का क्षेत्र — विच्छेद की आशंका ⚠️",
          "SAV < 14 = अत्यंत कमजोर — गंभीर समस्या ❌",
          "सप्तमेश 6/8/12 में = त्रिक — जीवनसाथी सुख में भारी कमी",
          "विवाह कारक (शुक्र/गुरु) BAV ≥ 5 = बलवान — विवाह सुखमय ✅",
          "7वें पर गुरु की दृष्टि = रक्षाकवच ✅",
        ]}/>
        <Row text={`7वें SAV: ${saptam?.h7_sav} — ${saptam?.h7_sav>=28?"✅ बलवान":saptam?.h7_sav<=14?"❌ अत्यंत कमजोर":saptam?.h7_sav<=22?"⚠️ खतरे का क्षेत्र":"🟡 सामान्य"}`}
          color={saptam?.h7_sav>=28?pass:saptam?.h7_sav<=22?fail:warn}/>
        <Row text={`सप्तमेश ${saptam?.h7_lord_hi} — ${saptam?.h7_lord_house}वें भाव में${saptam?.lord_in_trik?" (त्रिक — अशुभ स्थिति)":" (शुभ स्थिति)"}`}
          color={saptam?.lord_in_trik?fail:pass}/>
        <Row text={`विवाह कारक ${saptam?.vivah_karak}: BAV ${saptam?.karak_bav} — ${saptam?.karak_strong?"✅ बलवान":"⚠️ कमजोर"}`}
          color={saptam?.karak_strong?pass:warn}/>
        <Div/>
        <ChipRow label="7वें में ग्रह" items={saptam?.planets_in_7} color={info}/>
        <ChipRow label="🔴 पाप ग्रह" items={saptam?.kroor_in_7} color={fail}/>
        <ChipRow label="✅ शुभ ग्रह" items={saptam?.shubh_in_7} color={grn}/>
        <ChipRow label="🔴 पाप दृष्टि" items={saptam?.kroor_aspects} color={warn}/>
        <ChipRow label="✅ शुभ दृष्टि" items={saptam?.shubh_aspects} color={pass}/>
        <SutraList sutras={saptam?.sutras_with_status}/>
      </div>
    </CollapsibleSection>

    {/* 2. MANGALIK */}
    <CollapsibleSection icon="🔴" title="मांगलिक दोष"
      color={mangalik?.cancelled?grn:mangalik?.is_mangalik?fail:pass} defaultOpen={true}>
      <div style={{padding:"4px 0 8px"}}>
        <Verdict text={mangalik?.label} color={mangalik?.color||warn}/>
        <DefinitionBox title="मांगलिक दोष के नियम" color={fail} rules={[
          "मंगल 1/4/7/8/12 = मांगलिक — विवाह में देरी/समस्या",
          "मंगल 7वें में = सबसे तीव्र दोष ❌",
          "मंगल वक्री / अस्त = दोष पूर्णतः रद्द ✅ (software अक्सर यह चूक जाते हैं)",
          "गुरु की दृष्टि मंगल पर / गुरु 1/7 में = दोष रद्द ✅",
          "मंगल स्वराशि (मेष/वृश्चिक) / उच्च (मकर) = दोष रद्द ✅",
          "मंगल BAV ≥ 6 = बलवान — दोष का प्रभाव कम ✅",
          "दोनों पार्टनर मांगलिक = दोष परस्पर रद्द ✅",
        ]}/>
        <Row text={`मंगल ${mangalik?.mars_house}वें भाव में | BAV: ${mangalik?.mars_bav}/8`}
          color={mangalik?.is_mangalik?warn:pass}/>
        {mangalik?.is_mangalik&&<Row
          text={mangalik?.cancelled?`✅ दोष रद्द — ${mangalik?.cancel_reasons?.join(" | ")}`:"⚠️ दोष सक्रिय — जीवनसाथी भी मांगलिक होना चाहिए"}
          color={mangalik?.cancelled?grn:fail}/>}
        <SutraList sutras={mangalik?.sutras_with_status}/>
      </div>
    </CollapsibleSection>

    {/* 3. CHANDRA BAL */}
    <CollapsibleSection icon="🌙" title="चंद्र बल — कुंडली मिलान की असली जांच"
      color={chandra_bal?.warnings?.length>0?warn:pass} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="चंद्र बल के नियम" color={info} rules={[
          "तिथि 1-5 = बाल चंद्र — अत्यंत कमजोर, BAV भी काम नहीं करेगा ❌",
          "तिथि 25-30 = वृद्ध चंद्र — बल कम ⚠️",
          "तिथि 12-18 = पूर्ण चंद्र — BAV फल दोगुना ✅",
          "चंद्र BAV ≤ 2 = अत्यंत कमजोर — गुण मिलान अपर्याप्त ❌",
          "चंद्र BAV ≥ 6 = बलवान — भावनात्मक स्थिरता ✅",
          "गुरु की चंद्र पर दृष्टि = कमजोर चंद्र का प्रभाव घटता है ✅",
        ]}/>
        <div style={{...HI,fontSize:"0.72rem",color:info,marginBottom:"8px"}}>
          🌙 चंद्रमा: {chandra_bal?.moon_rashi} | BAV: {chandra_bal?.moon_bav}
        </div>
        <RowList items={chandra_bal?.warnings} color={warn}/>
        <RowList items={chandra_bal?.strengths} color={grn}/>
        <Div/>
        <Row text={chandra_bal?.matchmaking_note} color={gold}/>
      </div>
    </CollapsibleSection>

    {/* 4. VILAMB */}
    <CollapsibleSection icon="⏳" title="विवाह विलंब"
      color={vilamb?.delay_count>0?warn:pass} defaultOpen={vilamb?.delay_count>0}>
      <div style={{padding:"4px 0 8px"}}>
        <Verdict text={vilamb?.verdict} color={vilamb?.color||warn}/>
        <DefinitionBox title="विवाह विलंब के नियम" color={warn} rules={[
          "शनि 7वें में = गंभीर विलंब (जिम्मेदारी का डर + over-analysis) ❌",
          "शनि की 7वें पर दृष्टि = देरी संभव ⚠️",
          "सप्तमेश 6/8/12 में = विलंब + कलह ⚠️",
          "राहु 7वें में = विचित्र परिस्थितियाँ ⚠️",
          "SAV 14-22 = खतरे का क्षेत्र ⚠️",
          "गुरु की 7वें पर दृष्टि / केंद्र में = रक्षाकवच ✅",
          "शुक्र BAV ≥ 5 = विवाह कारक बलवान — देरी कम ✅",
        ]}/>
        {vilamb?.delay_factors?.length>0&&<><SLabel>⚠️ विलंब के कारण:</SLabel>
          <RowList items={vilamb.delay_factors} color={warn}/></>}
        {vilamb?.protect_factors?.length>0&&<><Div/><SLabel>✅ रक्षा कारक:</SLabel>
          <RowList items={vilamb.protect_factors} color={grn}/></>}
        <SutraList sutras={vilamb?.sutras_with_status}/>
        {vilamb?.upay?.length>0&&<><Div/>
          <div style={{...HI,fontSize:"0.72rem",color:gold,fontWeight:700,marginBottom:"6px"}}>🙏 उपाय:</div>
          {vilamb.upay.map((u,i)=><Row key={i} text={"🕯️ "+u} color={gold}/>)}</>}
      </div>
    </CollapsibleSection>

    {/* 5. PREM VIVAH */}
    <CollapsibleSection icon="❤️" title="प्रेम विवाह योग"
      color={prem_vivah?.has_prem_vivah_yoga?pass:neut} defaultOpen={prem_vivah?.has_prem_vivah_yoga}>
      <div style={{padding:"4px 0 8px"}}>
        <Verdict text={prem_vivah?.verdict} color={prem_vivah?.color||neut}/>
        <DefinitionBox title="प्रेम विवाह के सूत्र" color={pass} rules={[
          "पंचमेश 7वें / सप्तमेश 5वें = 100% प्रेम विवाह ✅",
          "पंचमेश-सप्तमेश एक-दूसरे के नक्षत्र में = 100% (KP से verify करें)",
          "5-7 भाव/स्वामी में दृष्टि संबंध = प्रेम विवाह का योग",
          "राहु/शनि 5/7/9 में = अंतर्जातीय प्रेम विवाह ⚠️",
          "गुरु 5/7/9 में = परिवार की सहमति मिलेगी ✅",
          "7वें में मंगल मेष राशि = प्रेम विवाह का विशेष योग ✅",
        ]}/>
        <RowList items={prem_vivah?.prem_yoga_factors} color={pass}/>
        {prem_vivah?.anterjatiya_factors?.length>0&&<><Div/>
          <SLabel>⚠️ अंतर्जातीय संकेत:</SLabel>
          <RowList items={prem_vivah.anterjatiya_factors} color={warn}/></>}
        <Div/>
        <Row text={prem_vivah?.family_note} color={prem_vivah?.family_approval?grn:warn}/>
        <SutraList sutras={prem_vivah?.sutras_with_status}/>
      </div>
    </CollapsibleSection>

    {/* 6. PREM SAMBANDH */}
    <CollapsibleSection icon="🌹" title="प्रेम संबंध बनाम प्रेम विवाह" color={info} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="प्रेम संबंध के नियम" color={info} rules={[
          "5वाँ स्थिर राशि (वृष/सिंह/वृश्चिक/कुंभ) = गहरा + स्थायी प्रेम ✅",
          "5वाँ चर राशि = अनेक प्रेम संबंध संभव ⚠️",
          "शुक्र + सूर्य एक राशि = प्रेम असफल (अस्त शुक्र) ❌",
          "शनि की 5वें दृष्टि (गुरु रक्षा नहीं) = प्रेम में बाधा ⚠️",
        ]}/>
        {prem_sambandh?.prem_type&&<div style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"10px",
          background:`${info}15`,border:`1.5px solid ${info}40`,...HI,fontSize:"0.85rem",fontWeight:700,color:info}}>
          {prem_sambandh.prem_type}</div>}
        {prem_sambandh?.love_strength?.length>0&&<><SLabel>💕 प्रेम के संकेत:</SLabel>
          <RowList items={prem_sambandh.love_strength} color={info}/></>}
        {prem_sambandh?.vivah_strength?.length>0&&<><Div/><SLabel>💍 विवाह तक पहुँचने के संकेत:</SLabel>
          <RowList items={prem_sambandh.vivah_strength} color={pass}/></>}
        {prem_sambandh?.breakup_risk?.length>0&&<><Div/><SLabel>💔 टूटने के संकेत:</SLabel>
          <RowList items={prem_sambandh.breakup_risk} color={warn}/></>}
        <Div/>
        <Row text={prem_sambandh?.note} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>

    {/* 7. VICHCHHED */}
    <CollapsibleSection icon="💔" title="विवाह विच्छेद / तलाक"
      color={vichchhed?.risk_level==="high"?fail:vichchhed?.risk_level==="low"?pass:warn}
      defaultOpen={vichchhed?.risk_level!=="low"}>
      <div style={{padding:"4px 0 8px"}}>
        <Verdict text={vichchhed?.verdict} color={vichchhed?.color||warn}/>
        <DefinitionBox title="तलाक के सटीक सूत्र" color={fail} rules={[
          "षष्ठेश + सप्तमेश दोनों 6वें = तलाक का सटीक योग ❌",
          "7वें में राहु+शनि = विच्छेद का प्रबल योग ❌",
          "SAV 14-22 = खतरे का क्षेत्र | SAV < 14 = अत्यंत खतरनाक",
          "गुरु की 7वें पर दृष्टि = रक्षक — विच्छेद रोकता है ✅",
          "7वें/सप्तमेश पर कोई शुभ प्रभाव न हो = कोई उपाय काम नहीं करेगा ❌",
          "तलाक का समय: 7वें के शनि/राहु/केतु की दशा में",
        ]}/>
        {vichchhed?.vichchhed_factors?.length>0&&<><SLabel>❌ जोखिम के कारण:</SLabel>
          <RowList items={vichchhed.vichchhed_factors} color={fail}/></>}
        {vichchhed?.protection_factors?.length>0&&<><Div/><SLabel>🛡️ सुरक्षा कारक:</SLabel>
          <RowList items={vichchhed.protection_factors} color={grn}/></>}
        <SutraList sutras={vichchhed?.sutras_with_status}/>
        {vichchhed?.upay?.length>0&&<><Div/>
          {vichchhed.upay.map((u,i)=><Row key={i} text={"🙏 "+u} color={gold}/>)}</>}
        <Div/>
        <Row text={`7वें SAV: ${vichchhed?.h7_sav} — 14-22 खतरे का क्षेत्र | 28+ बलवान`}
          color="rgba(255,255,255,0.45)"/>
      </div>
    </CollapsibleSection>

    {/* 8. SWABHAAV */}
    <CollapsibleSection icon="👤" title="जीवनसाथी का स्वभाव" color={info} defaultOpen={true}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="7वें भाव के ग्रह → जीवनसाथी का स्वभाव" color={info} rules={[
          "सूर्य = अहंकारी, ego का टकराव | चंद्र = मूडी, भावुक",
          "मंगल = आवेगी, झगड़ालू | बुध = बुद्धिमान, बातूनी",
          "गुरु = ज्ञानी मार्गदर्शक | शुक्र = आकर्षक पर ईर्ष्यालु",
          "शनि = वफादार, उम्र में बड़े | राहु = रहस्यमय, धोखेबाज",
          "केतु = आध्यात्मिक, victim मानसिकता",
        ]}/>
        {swabhaav?.descriptions?.length>0
          ?swabhaav.descriptions.map((d,i)=>(
            <div key={i} style={{display:"flex",gap:"10px",alignItems:"flex-start",
              padding:"10px 12px",borderRadius:"10px",marginBottom:"8px",
              background:"rgba(192,132,252,0.08)",border:"1px solid rgba(192,132,252,0.25)"}}>
              <span style={{fontSize:"1.3rem",flexShrink:0}}>{d.icon}</span>
              <div>
                <div style={{...HI,fontSize:"0.82rem",fontWeight:700,color:info}}>{d.planet}</div>
                <div style={{...HI,fontSize:"0.76rem",color:"rgba(255,255,255,0.75)",marginTop:"3px",lineHeight:1.5}}>{d.nature}</div>
              </div>
            </div>))
          :<Row text="ℹ️ सप्तमेश की स्थिति से जीवनसाथी का स्वभाव जाना जाता है" color="rgba(255,255,255,0.55)"/>}
      </div>
    </CollapsibleSection>

    {/* 9. 7TH COMBOS */}
    {combos_7th?.sutras?.length>0&&(
    <CollapsibleSection icon="⚔️" title="7वें भाव के खतरनाक संयोग" color={warn} defaultOpen={true}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="7वें भाव के विचित्र संयोग" color={warn} rules={[
          "मंगल+शुक्र = एक साथ दो संबंध (double affairs) ❌",
          "मंगल+शनि = जीवनसाथी ही सबसे बड़ा दुश्मन ❌",
          "राहु+शनि = निम्न वर्ग/असामान्य संबंधों की ओर आकर्षण ⚠️",
          "केतु = victim मानसिकता वाला पार्टनर ⚠️",
          "शुक्र (अकेला) = विवाह फीका, ज्यादा आकर्षण = जलन ⚠️",
          "मंगल+शुक्र+बुध = वासना की आग में घी ❌",
        ]}/>
        <RowList items={combos_7th.sutras}/>
      </div>
    </CollapsibleSection>)}

    {/* 10. VIVAH KAAL */}
    <CollapsibleSection icon="📅" title="विवाह का समय — कौन सी दशा" color={pass} defaultOpen={true}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="विवाह काल के नियम" color={pass} rules={[
          "2/7/11 भाव स्वामी + शुक्र/राहु की दशा में विवाह होता है",
          "डबल गोचर: गुरु+शनि दोनों का 4 में से 2 बिंदुओं पर प्रभाव अनिवार्य",
          "विवाह सहम पर गोचर का गुरु आए तब विवाह होता है",
          "D9 लग्न स्वामी की दशा = गुप्त विवाह दशा (ज्योतिषी अक्सर भूल जाते हैं)",
        ]}/>
        {vivah_kaal?.current_note&&<div style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"10px",
          background:`${pass}15`,border:`1.5px solid ${pass}40`,...HI,fontSize:"0.82rem",fontWeight:700,color:pass}}>
          {vivah_kaal.current_note}</div>}
        <SLabel>🔑 अनुकूल दशाएं:</SLabel>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          {vivah_kaal?.key_dashas?.map((p,i)=>(
            <div key={i} style={{padding:"5px 14px",borderRadius:"10px",background:`${pass}18`,
              border:`1.5px solid ${pass}45`,fontSize:"0.8rem",fontWeight:700,color:pass,...HI}}>{p}</div>))}
        </div>
        {vivah_kaal?.timing_notes?.map((n,i)=><Row key={i} text={"🕐 "+n} color="rgba(255,255,255,0.75)"/>)}
        <Div/>
        <Row text={vivah_kaal?.rule} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>

    {/* 11. DAAMPATYA SUKH */}
    <CollapsibleSection icon="🏠" title="दांपत्य सुख — भाव SAV" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="दांपत्य सुख के भाव" color={gold} rules={[
          "7वाँ = विवाह | 4वाँ = गृह शांति/मानसिक सुख | 12वाँ = शैय्या सुख | 2रा = परिवार",
          "SAV ≥ 28 = बलवान ✅ | 22-28 = सामान्य | < 22 = कमजोर ⚠️",
          "गुरु की 7वें पर दृष्टि = दांपत्य रक्षक ✅",
        ]}/>
        {daampatya_sukh?.breakdown?.map((b,i)=><BhavBar key={i} bhav={b.bhav} sav={b.sav} weight={b.weight}/>)}
        {daampatya_sukh?.sutras?.length>0&&<><Div/><RowList items={daampatya_sukh.sutras}/></>}
      </div>
    </CollapsibleSection>

    {/* 12. VAIDHAVYA */}
    {vaidhavya?.applicable!==false&&(
    <CollapsibleSection icon="🕯️" title="वैधव्य योग (स्त्री कुंडली)"
      color={vaidhavya?.has_risk?fail:pass} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="वैधव्य योग के नियम" color={fail} rules={[
          "6ठे/8वें स्वामी त्रिक में = वैधव्य का संकेत ⚠️",
          "7वाँ + 8वाँ SAV दोनों < 22 = मांगल्य पर खतरा ⚠️",
          "गुरु बल कमजोर (4/8/12 में या BAV ≤ 2) = खतरा ⚠️",
          "गुरु की 7/8वें पर दृष्टि = सुहाग रक्षक ✅",
        ]}/>
        <Verdict text={vaidhavya?.verdict} color={vaidhavya?.has_risk?fail:pass}/>
        {vaidhavya?.factors?.length>0&&<><SLabel>⚠️ वैधव्य के संकेत:</SLabel>
          <RowList items={vaidhavya.factors} color={fail}/></>}
        {vaidhavya?.protect?.length>0&&<><Div/><SLabel>🛡️ सुरक्षा कारक:</SLabel>
          <RowList items={vaidhavya.protect} color={grn}/></>}
        <Div/>
        <Row text={vaidhavya?.note_8th} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>)}

    {/* 13. DWI VIVAH */}
    <CollapsibleSection icon="💒" title="द्विविवाह + सुभार्या/सुपति योग"
      color={dwi_vivah?.has_risk?warn:neut} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="द्विविवाह के नियम" color={warn} rules={[
          "द्विस्वभाव लग्न (मिथुन/कन्या/धनु/मीन) = सर्वाधिक केस ⚠️",
          "शुक्र+मंगल दोनों 7वें = द्विविवाह का सूत्र ⚠️",
          "3+ पाप ग्रह 7वें पर = खतरा ⚠️",
          "2+ कारक एक साथ हों तभी प्रबल योग माना जाता है",
          "गुरु की सप्तमेश पर दृष्टि = सुभार्या/सुपति योग ✅",
        ]}/>
        <Verdict text={dwi_vivah?.verdict} color={dwi_vivah?.has_risk?warn:pass}/>
        {dwi_vivah?.has_risk&&dwi_vivah?.factors?.length>0&&<><SLabel>⚠️ द्विविवाह के संकेत:</SLabel>
          <RowList items={dwi_vivah.factors} color={warn}/></>}
        {!dwi_vivah?.has_risk&&dwi_vivah?.factors?.length>0&&<><Div/>
          <SLabel>📌 कमजोर संकेत (अकेले पर्याप्त नहीं):</SLabel>
          <RowList items={dwi_vivah.factors} color="rgba(255,255,255,0.45)"/></>}
        {dwi_vivah?.su_pati_yoga?.length>0&&<><Div/><SLabel>✅ सुभार्या/सुपति योग:</SLabel>
          <RowList items={dwi_vivah.su_pati_yoga} color={grn}/></>}
        <Div/>
        <Row text={dwi_vivah?.note} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>

    {/* 14. VYABHICHAR */}
    <CollapsibleSection icon="⚖️" title="चरित्र विश्लेषण"
      color={vyabhichar?.has_risk||vyabhichar_basic?.has_risk?fail:neut} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="चरित्र के सूत्र" color={warn} rules={[
          "षष्ठेश+सप्तमेश दोनों 10वें = चरित्र पर प्रश्न ⚠️",
          "शनि 2/12 में = व्यभिचार योग (शास्त्रोक्त) ⚠️",
          "9वाँ भाव पीड़ित (SAV < 22 + पाप) = समाज का डर नहीं ⚠️",
          "चंद्र+मंगल 7वें में = चरित्र पर संदेह ⚠️",
          "लग्नेश के साथ 2+ पाप ग्रह = कमजोर चरित्र बल ⚠️",
          "गुरु का लग्न/7वें पर प्रभाव = चरित्र की रक्षा ✅",
          "9वाँ SAV ≥ 28 = धर्म बलवान — नैतिकता प्रबल ✅",
        ]}/>
        <Verdict text={vyabhichar?.verdict} color={vyabhichar?.has_risk?fail:pass}/>
        {vyabhichar?.factors?.length>0
          ?<><SLabel>⚠️ चरित्र पर संकेत (गहरा विश्लेषण):</SLabel>
             <RowList items={vyabhichar.factors} color={warn}/></>
          :<Row text="✅ चरित्र पर कोई प्रबल अशुभ योग नहीं" color={grn}/>}
        {vyabhichar_basic?.factors?.length>0&&<><Div/>
          <SLabel>⚠️ अतिरिक्त चरित्र संकेत (शास्त्रीय सूत्र):</SLabel>
          <RowList items={vyabhichar_basic.factors} color={warn}/></>}
        {vyabhichar?.protect_factors?.length>0&&<><Div/>
          <SLabel>✅ नैतिकता के रक्षक:</SLabel>
          <RowList items={vyabhichar.protect_factors} color={grn}/></>}
        {vyabhichar?.dasha_note&&<div style={{marginTop:"10px",padding:"8px 10px",borderRadius:"8px",
          background:`${gold}12`,border:`1px solid ${gold}40`,...HI,fontSize:"0.76rem",color:gold}}>
          {vyabhichar.dasha_note}</div>}
        <Div/>
        <Row text={vyabhichar?.important_note||"📌 ये संकेत हैं — दशा + परिस्थिति + इच्छाशक्ति भी भूमिका निभाती है।"} color={gold}/>
      </div>
    </CollapsibleSection>

    {/* 15. VIVAH BHAGYA */}
    {vivah_bhagya?.bhagya_factors?.length>0&&(
    <CollapsibleSection icon="🌟" title="विवाह के बाद भाग्योदय" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="विवाह भाग्य" color={gold} rules={[
          "सप्तमेश + नवमेश युति/दृष्टि = विवाह के बाद प्रबल भाग्योदय ✅",
          "सप्तमेश + नवमेश + एकादशेश एक साथ = अपार धन + भाग्य ✅",
          "तलाक का समय: 7वें के शनि/राहु/केतु की दशा में",
        ]}/>
        <RowList items={vivah_bhagya.bhagya_factors} color={gold}/>
        {vivah_bhagya?.timing_sutras?.length>0&&<><Div/><SLabel>⏰ तलाक का समय संकेत:</SLabel>
          <RowList items={vivah_bhagya.timing_sutras} color={warn}/></>}
        <Div/>
        <Row text={vivah_bhagya?.rule} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>)}

    {/* 16. DAIHI AAKRSHAN */}
    {daihi_aakrshan?.factors?.length>0&&(
    <CollapsibleSection icon="🔥" title="दैहिक आकर्षण + प्लेटोनिक प्रेम" color={info} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="आकर्षण के सूत्र" color={info} rules={[
          "साथी का शुक्र = आपके मंगल की राशि में → अटूट शारीरिक+मानसिक आकर्षण ✅",
          "मंगल+शुक्र अग्नि राशि = प्रबल कामुकता ⚠️",
          "गुरु 1/4/9 = दिव्य/प्लेटोनिक प्रेम ✅",
          "शुक्र 12वें = छोटी उम्र में प्रेम प्रसंग ⚠️",
          "चंद्र से 10वें शुक्र = flirtatious स्वभाव ⚠️",
        ]}/>
        <RowList items={daihi_aakrshan.factors} color={info}/>
        <Div/>
        <Row text={daihi_aakrshan?.note} color={gold}/>
      </div>
    </CollapsibleSection>)}

    {/* 17. KUL NIRDHARAN */}
    {kul_nirdharan?.sutras?.length>0&&(
    <CollapsibleSection icon="👑" title="जीवनसाथी का कुल/वर्ग" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="कुल निर्धारण के नियम" color={gold} rules={[
          "सप्तमेश BAV > लग्नेश BAV = उच्च कुल में विवाह ✅",
          "सप्तमेश अस्त/वक्री/नीच/त्रिक = अपने से नीचे कुल में विवाह ⚠️",
          "7वें में वक्री सप्तमेश = जीवनसाथी झूठा निकल सकता है ⚠️",
        ]}/>
        <Row text={`सप्तमेश BAV ${kul_nirdharan?.lord7_bav} | लग्नेश BAV ${kul_nirdharan?.lord1_bav}`} color={info}/>
        <RowList items={kul_nirdharan.sutras} color={gold}/>
      </div>
    </CollapsibleSection>)}

    {/* 18. SHUKRA SEP */}
    {shukra_sep?.sutras?.length>0&&(
    <CollapsibleSection icon="♀️" title="शुक्र — अलगाव का रूप" color={fail} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="शुक्र के अलगाव सूत्र" color={fail} rules={[
          "शुक्र + सूर्य एक राशि = प्रेम असफल (अस्त शुक्र) ❌",
          "शुक्र सूर्य-चंद्र के बीच फंसा = प्रेम में हमेशा बाधा ❌",
          "सूर्य+शुक्र 5/7/9 में = पति/पत्नी सुख में हमेशा कमी ⚠️",
        ]}/>
        <RowList items={shukra_sep.sutras} color={warn}/>
      </div>
    </CollapsibleSection>)}

    {/* 19. ANTERJATIYA */}
    <CollapsibleSection icon="🌍" title="अंतर्जातीय / सजातीय विवाह"
      color={anterjatiya?.contradiction?warn:anterjatiya?.has_anterjatiya?warn:pass} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="अंतर्जातीय विवाह के नियम" color={warn} rules={[
          "राहु/शनि का 5/7/9 में होना = अंतर्जातीय/अन्य धर्म में विवाह ⚠️",
          "राहु/शनि का 5/7/9 स्वामियों पर दृष्टि = अंतर्जातीय संभव ⚠️",
          "शनि नीच भंग हो = अंतर्जातीय प्रभाव कमजोर ✅",
          "गुरु का 5/7/9 पर प्रभाव = सजातीय / परिवार-सहमत विवाह ✅",
        ]}/>
        <Verdict text={anterjatiya?.verdict} color={anterjatiya?.contradiction?warn:anterjatiya?.has_anterjatiya?warn:pass}/>
        {anterjatiya?.factors?.length>0&&<><SLabel>⚠️ अंतर्जातीय संकेत:</SLabel>
          <RowList items={anterjatiya.factors} color={warn}/></>}
        {anterjatiya?.shani_neech_bhang&&<><Div/>
          <Row text={`✅ ${anterjatiya.nbhang_reason} — शनि का अंतर्जातीय प्रभाव कमजोर`} color={grn}/></>}
        {anterjatiya?.sajatiya_factors?.length>0&&<><Div/><SLabel>✅ सजातीय विवाह के संकेत:</SLabel>
          <RowList items={anterjatiya.sajatiya_factors} color={grn}/></>}
        {anterjatiya?.contradiction&&<><Div/>
          <div style={{padding:"8px 12px",borderRadius:"10px",background:`${warn}12`,border:`1.5px solid ${warn}40`}}>
            <div style={{...HI,fontSize:"0.74rem",color:warn,fontWeight:700}}>⚠️ विरोधाभास</div>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.7)",marginTop:"4px",lineHeight:1.5}}>
              दोनों संकेत एक साथ हैं। नीच भंग, दशा और D9 से अंतिम निर्णय करें।
            </div>
          </div></>}
        {!anterjatiya?.has_anterjatiya&&<Row text="✅ अंतर्जातीय विवाह का कोई प्रबल योग नहीं — सजातीय विवाह अधिक संभव" color={grn}/>}
        <Div/>
        <Row text={anterjatiya?.rule} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>

    {/* 20. AVIVAHIT */}
    {avivahit?.risk!=="none"&&(
    <CollapsibleSection icon="⚠️" title="अविवाहित रहने के संकेत"
      color={avivahit?.color||warn} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="अविवाहित योग के नियम" color={fail} rules={[
          "सप्तमेश त्रिक + BAV ≤ 2 = अत्यंत खतरनाक ❌",
          "7वाँ SAV < 14 = विवाह भाव बहुत कमजोर ❌",
          "शुक्र 5/7/9 में पाप ग्रह के साथ = बाधा ⚠️",
        ]}/>
        <Verdict text={avivahit?.verdict} color={avivahit?.color||warn}/>
        <RowList items={avivahit?.factors} color={warn}/>
      </div>
    </CollapsibleSection>)}

    {/* 21. MUHURTA */}
    <CollapsibleSection icon="🕐" title="विवाह मुहूर्त — शुभ/अशुभ लग्न" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="मुहूर्त के मुख्य नियम" color={gold} rules={[
          "7वाँ भाव मुहूर्त में बिल्कुल खाली होना चाहिए (शुभ/अशुभ कोई नहीं)",
          "गुरु गोचर 1/4/5/9/10 में = सभी दोष नष्ट (सर्वश्रेष्ठ रक्षक) ✅",
          "गोचर बुध 1/4/5/9/10 में = दोष नष्ट ✅",
          "12वें में शनि, 10वें में मंगल, 3रे में शुक्र = वर्जित ❌",
        ]}/>
        {[
          {label:"🔇 बधिर लग्न (विवाह वर्जित)",items:muhurta?.badhir_lagnas,color:fail},
          {label:"🙈 अंधी लग्न",items:muhurta?.andhi_lagnas,color:fail},
          {label:"🦽 पंगु लग्न",items:muhurta?.pangu_lagnas,color:warn},
          {label:"🏚️ कुबड़ी लग्न",items:muhurta?.kubdi_lagnas,color:warn},
          {label:"🚫 लग्न शुद्धि नियम",items:muhurta?.lagna_shuddhi,color:warn},
          {label:"✅ दोष निवारण",items:muhurta?.cancellations,color:grn},
          {label:"🙏 स्त्री गुरु बल",items:muhurta?.guru_bal_stri,color:gold},
        ].map(({label,items,color})=>items?.length>0&&(
          <div key={label} style={{marginBottom:"10px"}}>
            <div style={{...HI,fontSize:"0.7rem",color:"rgba(255,255,255,0.4)",marginBottom:"4px"}}>{label}</div>
            <RowList items={items} color={color}/>
          </div>))}
        <Row text={muhurta?.note} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>

    {/* 22. RAHU CHECKS */}
    {rahu_checks?.sutras?.length>0&&(
    <CollapsibleSection icon="🐍" title="राहु की स्थिति + 28वाँ नवमांश" color={fail} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="राहु के खतरनाक नियम" color={fail} rules={[
          "राहु 7वें = साथी धोखेबाज/रहस्यमय ⚠️",
          "राहु 1वें = सम-सप्तक दोष ⚠️",
          "28वाँ नवमांश (27.5°-30°) = 'लंका' — भारी संघर्ष ❌",
        ]}/>
        <RowList items={rahu_checks.sutras}/>
        <Div/>
        <Row text={rahu_checks?.note} color="rgba(255,255,255,0.5)"/>
      </div>
    </CollapsibleSection>)}

    {/* 23. ATTRACTION */}
    <CollapsibleSection icon="💘" title="आकर्षण + गुप्त विवाह सूत्र" color={info} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="गुप्त सूत्र — आकर्षण और विवाह काल" color={info} rules={[
          "साथी का शुक्र = आपके मंगल की राशि में → अटूट शारीरिक+मानसिक आकर्षण ✅",
          "स्त्री की कुंडली में प्रेम का कारक = मंगल (न कि शुक्र)",
          "11वें में शुभ ग्रह = कानूनी मुसीबत से हमेशा विजय ✅",
          "D9 लग्न स्वामी की दशा = गुप्त विवाह दशा (ज्योतिषी अक्सर भूल जाते हैं)",
        ]}/>
        <RowList items={attraction?.sutras}/>
      </div>
    </CollapsibleSection>

    {/* 24. D9 HINTS */}
    <CollapsibleSection icon="🔭" title="नवमांश (D9) — विवाह का दर्पण" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="D9 भावों का विवाह में अर्थ" color={gold} rules={[
          "D9 लग्न = चरित्र | D9 4था = सच्चा प्रेम | D9 7वाँ = साथी का चरित्र",
          "D9 6ठा बलवान = विवाद रहित जीवन ✅ | D9 8वाँ = विवाहेत्तर संबंध",
          "D9 12वाँ = शैय्या सुख | D9 11वाँ = साथी की भौतिक डिमांड्स",
        ]}/>
        {d9_hints?.d1_hint&&<Row text={d9_hints.d1_hint} color={warn}/>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginTop:"8px"}}>
          {d9_hints?.bhav_hints?.map((h,i)=>(
            <div key={i} style={{padding:"6px 8px",borderRadius:"8px",
              background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{...HI,fontSize:"0.7rem",fontWeight:700,color:gold}}>{h.bhav}</div>
              <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.7)",marginTop:"2px",lineHeight:1.4}}>{h.arth}</div>
            </div>))}
        </div>
        <Div/>
        <Row text={d9_hints?.important} color={gold}/>
      </div>
    </CollapsibleSection>

    {/* 25. VIVAH SAHAM */}
    <CollapsibleSection icon="🎯" title="विवाह सहम — सटीक विवाह समय" color={gold} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="विवाह सहम की गणना" color={gold} rules={[
          "सूत्र: लग्नेश + सप्तमेश की बीती हुई राशि+अंश+कला जोड़ो",
          "कला ≥ 60 → 60 घटाओ + 1 अंश | अंश ≥ 30 → 30 घटाओ + 1 राशि",
          "परिणाम की अगली राशि = विवाह सहम राशि",
          "गोचर का गुरु इस राशि पर आए = विवाह का समय ✅",
          "महादशा में सहम स्वामी + सप्तमेश का संबंध = विवाह निश्चित ✅",
        ]}/>
        {vivah_saham?.saham_rashi&&(
          <div style={{padding:"10px 14px",borderRadius:"12px",marginBottom:"10px",
            background:`${gold}15`,border:`2px solid ${gold}50`}}>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginBottom:"4px"}}>विवाह सहम राशि</div>
            <div style={{...HI,fontSize:"1.1rem",fontWeight:800,color:gold}}>{vivah_saham.saham_rashi}</div>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.55)",marginTop:"4px"}}>
              लग्नेश: {vivah_saham?.lagnesh} ({vivah_saham?.lagnesh_pos}) &nbsp;|&nbsp;
              सप्तमेश: {vivah_saham?.saptamesh} ({vivah_saham?.saptamesh_pos})
            </div>
          </div>)}
        <RowList items={vivah_saham?.sutras}/>
      </div>
    </CollapsibleSection>

    {/* 26. VISH NAVAMSHA */}
    <CollapsibleSection icon="☠️" title="विष नवमांश — छिपा हुआ दोष"
      color={vish_navamsha?.has_dosha?fail:pass} defaultOpen={vish_navamsha?.has_dosha}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="विष नवमांश की डिग्रियाँ" color={fail} rules={[
          "मेष/वृष/कन्या/धनु → 0° से 3°20' = विष नवमांश ❌",
          "मिथुन/सिंह/तुला/कुंभ → 13°20' से 16°40' = विष नवमांश ❌",
          "कर्क/वृश्चिक/मकर/मीन → 26°40' से 30° = विष नवमांश ❌",
          "चेक: सप्तमेश + 7वें के ग्रह + शुक्र + गुरु + मांगलिक मंगल",
          "मांगलिक + विष नवमांश = सबसे घातक — 100% तलाक ❌",
        ]}/>
        <Verdict text={vish_navamsha?.verdict} color={vish_navamsha?.color||pass}/>
        {vish_navamsha?.has_dosha
          ?vish_navamsha?.checks?.map((c,i)=>(
            <div key={i} style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"6px",
              background:`${fail}10`,border:`1px solid ${fail}35`}}>
              <div style={{...HI,fontSize:"0.8rem",fontWeight:700,color:fail}}>{c.planet} — {c.role}</div>
              <div style={{...HI,fontSize:"0.75rem",color:"rgba(255,255,255,0.7)",marginTop:"2px"}}>{c.rashi} {c.degree}</div>
              <div style={{...HI,fontSize:"0.75rem",color:warn,marginTop:"3px"}}>{c.msg}</div>
            </div>))
          :<Row text="✅ किसी भी महत्वपूर्ण ग्रह में विष नवमांश दोष नहीं" color={grn}/>}
        <Div/>
        <Row text={vish_navamsha?.note} color="rgba(255,255,255,0.45)"/>
      </div>
    </CollapsibleSection>

    {/* 27. UGRA NAKSHATRA */}
    <CollapsibleSection icon="🔥" title="उग्र/तीक्ष्ण नक्षत्र — 100% तलाक सूत्र"
      color={ugra_nakshatra?.has_severe?fail:ugra_nakshatra?.has_any?warn:pass}
      defaultOpen={ugra_nakshatra?.has_any}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="उग्र/तीक्ष्ण नक्षत्र का नियम" color={fail} rules={[
          "उग्र: भरणी, मघा, पूर्वाफाल्गुनी, पूर्वाषाढ़ा, पूर्वाभाद्रपद",
          "तीक्ष्ण: आर्द्रा, आश्लेषा, ज्येष्ठा, मूल",
          "इन 3 में से कोई 2 इन नक्षत्रों में = 100% तलाक ❌",
          "(1) मांगलिक मंगल  (2) सप्तमेश  (3) 7वें में ग्रह",
          "मांगलिक से मांगलिक की शादी हो तब भी यह नियम लागू होता है",
        ]}/>
        <Verdict text={ugra_nakshatra?.verdict} color={ugra_nakshatra?.color||pass}/>
        {ugra_nakshatra?.findings?.map((f,i)=>(
          <div key={i} style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"6px",
            background:`${fail}10`,border:`1px solid ${fail}35`}}>
            <div style={{...HI,fontSize:"0.8rem",fontWeight:700,color:warn}}>{f.planet}</div>
            <div style={{...HI,fontSize:"0.75rem",color:fail,marginTop:"2px"}}>नक्षत्र: {f.nakshatra} ({f.type})</div>
            <div style={{...HI,fontSize:"0.75rem",color:"rgba(255,255,255,0.7)",marginTop:"3px"}}>{f.msg}</div>
          </div>))}
        {!ugra_nakshatra?.has_any&&<Row text="✅ कोई उग्र/तीक्ष्ण नक्षत्र दोष नहीं" color={grn}/>}
        <SutraList sutras={ugra_nakshatra?.sutras_with_status}/>
      </div>
    </CollapsibleSection>

    {/* 28. DOSHA YOGAS */}
    <CollapsibleSection icon="⚡" title="खतरनाक दोष योग (7वाँ + 12वाँ भाव)"
      color={dosha_yogas?.has_any?fail:pass} defaultOpen={dosha_yogas?.has_any}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="खतरनाक दोष योग" color={fail} rules={[
          "ग्रहण दोष = राहु/केतु + सूर्य/चंद्र → चरित्र में दोष ⚠️",
          "अंगारक दोष = राहु + मंगल → हिंसक स्वभाव ❌",
          "विष दोष = शनि + चंद्र → मानसिक पीड़ा ⚠️",
          "श्रापित दोष = राहु + शनि → पूर्वजन्म का श्राप ❌",
          "7वें में = चरित्र दोष + झगड़े | 12वें में = रोमांस/आत्मीयता खत्म",
        ]}/>
        <Verdict text={dosha_yogas?.verdict} color={dosha_yogas?.color||pass}/>
        {dosha_yogas?.doshas_7th?.length>0&&<><SLabel>⚠️ 7वें भाव के दोष:</SLabel>
          <RowList items={dosha_yogas.doshas_7th} color={fail}/></>}
        {dosha_yogas?.doshas_12th?.length>0&&<><Div/><SLabel>⚠️ 12वें भाव के दोष:</SLabel>
          <RowList items={dosha_yogas.doshas_12th} color={warn}/></>}
        {!dosha_yogas?.has_any&&<Row text="✅ कोई खतरनाक दोष योग नहीं" color={grn}/>}
        <Div/>
        <Row text={dosha_yogas?.note_12} color="rgba(255,255,255,0.45)"/>
      </div>
    </CollapsibleSection>

    {/* 29. MANGALIK + VISH STRI */}
    {mangalik_vish?.applicable!==false&&(
    <CollapsibleSection icon="⚠️" title="मांगलिक + विष योग (स्त्री कुंडली)"
      color={mangalik_vish?.color||warn} defaultOpen={mangalik_vish?.has_risk}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="मांगलिक + विष योग के नियम" color={fail} rules={[
          "विष योग = शनि + चंद्र एक भाव में → पति कभी 'केयरिंग' नहीं होगा ❌",
          "मांगलिक + विष योग = सबसे घातक संयोग — दांपत्य सुख शून्य ❌",
          "दोष भंग: साथी के 7वें में सूर्य/शनि/राहु = मांगलिक दोष 100% रद्द ✅",
          "चलित कुंडली में मंगल 7वें से 6वें में जाए = दोष काफी समाप्त ✅",
        ]}/>
        <Verdict text={mangalik_vish?.verdict} color={mangalik_vish?.color||warn}/>
        <RowList items={mangalik_vish?.findings} color={fail}/>
        {mangalik_vish?.dosha_bhang?.length>0&&<><Div/>
          <SLabel>✅ दोष भंग के नियम:</SLabel>
          <RowList items={mangalik_vish.dosha_bhang} color={grn}/></>}
      </div>
    </CollapsibleSection>)}

    {/* 30. D9 SACCHA PREM */}
    <CollapsibleSection icon="💎" title="D9 4थाँ भाव — सच्चा प्यार या समझौता?"
      color={d9_saccha_prem?.has_issue?warn:pass} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="D9 4थे भाव के नियम" color={info} rules={[
          "D9 4था शुभ ग्रह = जीवनसाथी सच्चा प्रेम करता है — गलतियाँ भी माफ करेगा ✅",
          "D9 4था क्रूर ग्रह = साथी का प्रेम दिखावा/मजबूरी — केवल समझौता ❌",
          "D1 खराब + D9 4था क्रूर = तलाक/तनाव 100% निश्चित ❌",
          "शनि 1/4 में = परिवार में जीवनभर एक कांटा चुभता रहेगा ⚠️",
          "चंद्र 12वें = जिससे सबसे खुशी मिलती है, वही बाद में दुख देता है ⚠️",
        ]}/>
        <Verdict text={d9_saccha_prem?.verdict} color={d9_saccha_prem?.color||pass}/>
        {d9_saccha_prem?.findings?.length>0&&<><SLabel>⚠️ संकेत:</SLabel>
          <RowList items={d9_saccha_prem.findings} color={warn}/></>}
        {d9_saccha_prem?.protection?.length>0&&<><Div/><SLabel>✅ सुरक्षा कारक:</SLabel>
          <RowList items={d9_saccha_prem.protection} color={grn}/></>}
        {!d9_saccha_prem?.has_issue&&<Row text="✅ D9 4थे भाव में कोई गंभीर पीड़ा नहीं" color={grn}/>}
        <Div/>
        <Row text={d9_saccha_prem?.important} color={gold}/>
      </div>
    </CollapsibleSection>

    {/* 31. SASURAL DISHA */}
    <CollapsibleSection icon="🧭" title="ससुराल की दिशा" color={info} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="ससुराल दिशा निर्धारण" color={info} rules={[
          "3 बिंदुओं से दिशा: (1) 7वें की राशि (2) 7वें के ग्रहों की राशि (3) शुक्र/गुरु से 7वाँ",
          "1/5/9 राशि = पूर्व | 2/6/10 = दक्षिण | 3/7/11 = पश्चिम | 4/8/12 = उत्तर",
          "जो दिशा सबसे ज्यादा बार = ससुराल की दिशा",
        ]}/>
        {sasural_disha?.sasural_disha&&(
          <div style={{padding:"12px 16px",borderRadius:"12px",marginBottom:"10px",
            background:`${info}15`,border:`2px solid ${info}50`,textAlign:"center"}}>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginBottom:"4px"}}>संभावित ससुराल की दिशा</div>
            <div style={{...HI,fontSize:"1.4rem",fontWeight:800,color:info}}>{sasural_disha.sasural_disha}</div>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginTop:"4px"}}>
              ({sasural_disha.frequency}/{sasural_disha.total_points} बिंदु)
            </div>
          </div>)}
        <RowList items={sasural_disha?.details} color="rgba(255,255,255,0.7)"/>
        <Div/>
        <Row text={sasural_disha?.note} color="rgba(255,255,255,0.45)"/>
      </div>
    </CollapsibleSection>

    {/* 32. SAPT VARGA */}
    <CollapsibleSection icon="📊" title="सप्त-वर्ग विलंब सूत्र"
      color={sapt_varga?.color||warn} defaultOpen={false}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="सप्त-वर्ग देरी का नियम" color={warn} rules={[
          "7 D-charts में 7वें भाव की राशि देखो",
          "4-5 charts में मकर/कुंभ (शनि राशि) = विवाह में भारी देरी निश्चित ❌",
          "2-3 में मकर/कुंभ = मध्यम विलंब ⚠️",
          "D-charts input करने पर सटीक परिणाम मिलेगा",
        ]}/>
        <Verdict text={sapt_varga?.verdict} color={sapt_varga?.color||warn}/>
        {sapt_varga?.results?.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",marginBottom:"10px"}}>
            {sapt_varga.results.map((r,i)=>(
              <div key={i} style={{padding:"6px 8px",borderRadius:"8px",textAlign:"center",
                background:r.shani?`${fail}15`:"rgba(255,255,255,0.04)",
                border:`1px solid ${r.shani?fail+"50":"rgba(255,255,255,0.08)"}`}}>
                <div style={{...HI,fontSize:"0.72rem",fontWeight:700,color:r.shani?fail:grn}}>{r.chart}</div>
                <div style={{...HI,fontSize:"0.68rem",color:"rgba(255,255,255,0.6)",marginTop:"2px"}}>{r.rashi}</div>
                {r.shani&&<div style={{...HI,fontSize:"0.65rem",color:fail}}>शनि ⚠️</div>}
              </div>))}
          </div>)}
        <Row text={sapt_varga?.note} color="rgba(255,255,255,0.45)"/>
      </div>
    </CollapsibleSection>

    {/* 33. PARACETAMOL UPAY */}
    <CollapsibleSection icon="💊" title="पेरासिटामोल उपाय — सटीक दान और मंत्र"
      color={paracetamol?.has_upay?gold:neut} defaultOpen={paracetamol?.has_upay}>
      <div style={{padding:"4px 0 8px"}}>
        <DefinitionBox title="पेरासिटामोल vs एंटीबायोटिक" color={gold} rules={[
          "एंटीबायोटिक = महामृत्युंजय, विष्णु सहस्त्रनाम — सहायक, मूल उपाय नहीं",
          "पेरासिटामोल = जो ग्रह असली दोषी है उसी का विशेष उपाय — सीधे असर",
          "वजन के बराबर दान = 11 भागों में, 11 सप्ताह",
          "संकल्प = दाहिने हाथ में जल+अक्षत, समस्या बोलो, वस्तु 3 बार छूकर दान",
          "कड़वा सच: 7वें/सप्तमेश पर शुभ प्रभाव न हो = कोई उपाय काम नहीं करेगा ❌",
        ]}/>
        {paracetamol?.afflicting?.length>0&&(
          <div style={{padding:"8px 12px",borderRadius:"10px",marginBottom:"10px",
            background:`${fail}12`,border:`1.5px solid ${fail}40`}}>
            <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.5)",marginBottom:"4px"}}>मुख्य दोषी ग्रह</div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {paracetamol.afflicting.map((p,i)=>(
                <span key={i} style={{padding:"3px 12px",borderRadius:"10px",fontSize:"0.8rem",
                  fontWeight:700,background:`${fail}20`,border:`1px solid ${fail}50`,color:fail,...HI}}>{p}</span>))}
            </div>
          </div>)}
        <RowList items={paracetamol?.upay_notes}/>
        {paracetamol?.remedies?.length>0&&<><Div/>
          <SLabel>🎯 ग्रह-वार सटीक उपाय (पेरासिटामोल):</SLabel>
          {paracetamol.remedies.map((r,i)=>(
            <div key={i} style={{padding:"10px 12px",borderRadius:"10px",marginBottom:"8px",
              background:`${gold}08`,border:`1px solid ${gold}35`}}>
              <div style={{...HI,fontSize:"0.82rem",fontWeight:800,color:gold,marginBottom:"6px"}}>🎯 {r.planet}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                {[["📦 दान की वस्तु",r.vastu],["📅 वार/समय",r.vaar],["🕉️ मंत्र",r.mantra],["👘 वस्त्र",r.vastra]].map(([label,val],j)=>(
                  <div key={j} style={{padding:"5px 8px",borderRadius:"7px",background:"rgba(255,255,255,0.04)"}}>
                    <div style={{...HI,fontSize:"0.65rem",color:"rgba(255,255,255,0.4)"}}>{label}</div>
                    <div style={{...HI,fontSize:"0.75rem",color:"rgba(255,255,255,0.85)",marginTop:"2px"}}>{val}</div>
                  </div>))}
              </div>
              <div style={{marginTop:"8px",padding:"7px 10px",borderRadius:"8px",background:`${gold}12`,border:`1px solid ${gold}35`}}>
                <div style={{...HI,fontSize:"0.72rem",color:gold,fontWeight:700}}>⚖️ वजन के बराबर दान:</div>
                <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.75)",marginTop:"3px",lineHeight:1.5}}>{r.daan_rule}</div>
              </div>
              <div style={{marginTop:"6px",padding:"6px 10px",borderRadius:"8px",background:"rgba(255,255,255,0.04)"}}>
                <div style={{...HI,fontSize:"0.7rem",color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>🙏 संकल्प: {r.sankalp}</div>
              </div>
            </div>))}</>}
        <Div/>
        <div style={{padding:"8px 12px",borderRadius:"10px",background:`${fail}10`,border:`1px solid ${fail}35`}}>
          <div style={{...HI,fontSize:"0.76rem",color:fail,fontWeight:700,lineHeight:1.6}}>{paracetamol?.kadwa_sach}</div>
        </div>
      </div>
    </CollapsibleSection>

    {/* Final Note */}
    <GlassCard className="p-3" style={{background:"rgba(255,255,255,0.03)"}}>
      <div style={{...HI,fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>
        📌 <strong style={{color:"rgba(255,255,255,0.6)"}}>नोट:</strong> ये सभी संकेत हैं — अंतिम निर्णय आप स्वयं लें।
        दशा + गोचर + परिस्थिति सब मिलाकर देखें। गुरु की दृष्टि अशुभ योगों को कम करती है।&nbsp;
        <span style={{color:"rgba(251,113,133,0.7)"}}>🔴 = यह दोष आपकी कुंडली में लागू है</span>&nbsp;
        <span style={{color:"rgba(74,222,128,0.7)"}}>🟢 = यह दोष नहीं है</span>
      </div>
    </GlassCard>

  </div>;
}