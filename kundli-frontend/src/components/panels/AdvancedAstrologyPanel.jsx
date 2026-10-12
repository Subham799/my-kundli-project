import React, { useMemo, useState } from "react";

/**
 * AdvancedAstrologyPanel
 * ------------------------------------------------------------
 * Renders the `advanced_astrology` block returned by
 * run_advanced_predictions() in predictive_engine.py:
 *   chara_karakas, vargottama, crisis_points, kunda, bhrigu_bindu,
 *   argala_details, viparita_argala, mathematical_hora_lagna, kaal_hora_lord,
 *   progressed_lagna, d10_deities, d10_dashamesh_deity, d10_d24_education_match,
 *   d9_marriage_analysis, arudha_lagna, jaimini_trinity, ishta_devta, deep_forensics
 *
 * Usage:
 *   <AdvancedAstrologyPanel data={result.advanced_astrology} />
 * ------------------------------------------------------------
 */

const RASHI_NAMES_HI = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

const PLANET_META = {
  Su: { hi: "सूर्य", glyph: "\u2609" },
  Mo: { hi: "चंद्र", glyph: "\u263D" },
  Ma: { hi: "मंगल", glyph: "\u2642" },
  Me: { hi: "बुध", glyph: "\u263F" },
  Ju: { hi: "गुरु", glyph: "\u2643" },
  Ve: { hi: "शुक्र", glyph: "\u2640" },
  Sa: { hi: "शनि", glyph: "\u2644" },
  Ra: { hi: "राहु", glyph: "\u260A" },
  Ke: { hi: "केतु", glyph: "\u260B" },
  La: { hi: "लग्न", glyph: "\u2191" },
};

const FORENSICS_SECTIONS = [
  { key: "romance_and_marriage", label: "प्रेम व विवाह", glyph: "\u2665" },
  { key: "career_and_success", label: "करियर व सफलता", glyph: "\u2726" },
  { key: "danger_and_accidents", label: "जोखिम व सतर्कता", glyph: "\u26A0" },
  { key: "mind_and_spirituality", label: "मन व आध्यात्म", glyph: "\u0950" },
];

function planetLabel(code) {
  const meta = PLANET_META[code];
  if (!meta) return code || "—";
  return `${meta.glyph} ${meta.hi}`;
}

function Empty({ children }) {
  return <p className="aae-empty">{children}</p>;
}

function KarakaRow({ karakas }) {
  const order = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];
  if (!karakas || Object.keys(karakas).length === 0) {
    return <Empty>जैमिनी कारक डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-karaka-row">
      {order
        .filter((k) => karakas[k])
        .map((k) => (
          <div className="aae-karaka-chip" key={k}>
            <span className="aae-karaka-code">{k}</span>
            <span className="aae-karaka-planet">{planetLabel(karakas[k].planet)}</span>
            <span className="aae-karaka-role">{karakas[k].role_name}</span>
          </div>
        ))}
    </div>
  );
}

function VargottamaStrip({ planets }) {
  if (!planets || planets.length === 0) {
    return <Empty>कोई ग्रह वर्गोत्तम नहीं है।</Empty>;
  }
  return (
    <div className="aae-vargottama">
      {planets.map((p) => (
        <span className="aae-vargottama-badge" key={p}>
          {planetLabel(p)}
        </span>
      ))}
    </div>
  );
}

function DegreeDial({ degree, signName, signIdx, label }) {
  const safeDeg = typeof degree === "number" ? degree : 0;
  const angle = (safeDeg / 360) * 360;
  return (
    <div className="aae-dial-block">
      <div
        className="aae-dial"
        style={{ "--aae-angle": `${angle}deg` }}
        aria-label={`${label}: ${safeDeg.toFixed ? safeDeg.toFixed(2) : safeDeg} डिग्री`}
      >
        <div className="aae-dial-face">
          <div className="aae-dial-needle" />
          <div className="aae-dial-center">{typeof signIdx === "number" ? signIdx + 1 : "–"}</div>
        </div>
      </div>
      <div className="aae-dial-caption">
        <span className="aae-dial-label">{label}</span>
        <span className="aae-dial-value">
          {signName || "—"} · {typeof degree === "number" ? degree.toFixed(2) : "—"}°
        </span>
      </div>
    </div>
  );
}

function ForensicsCard({ title, glyph, entries }) {
  const rows = entries ? Object.entries(entries) : [];
  return (
    <div className="aae-forensics-card">
      <div className="aae-forensics-head">
        <span className="aae-forensics-glyph">{glyph}</span>
        <h4>{title}</h4>
      </div>
      {rows.length === 0 ? (
        <Empty>इस विषय पर कोई विशेष संकेत नहीं मिला।</Empty>
      ) : (
        <ul className="aae-forensics-list">
          {rows.map(([k, v]) => (
            <li key={k}>{typeof v === "string" ? v : JSON.stringify(v)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarriageLordTable({ analysis }) {
  const rows = analysis ? Object.entries(analysis) : [];
  if (rows.length === 0) return <Empty>D-9 विवाह विश्लेषण उपलब्ध नहीं।</Empty>;
  return (
    <table className="aae-table">
      <thead>
        <tr>
          <th>भाव स्वामी</th>
          <th>ग्रह</th>
          <th>D-9 भाव</th>
          <th>स्थिति (उच्च/नीच)</th>
          <th>साथ में ग्रह</th>
          <th>निष्कर्ष</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([role, info]) => (
          <tr key={role} className={info.in_6_8_12 ? "aae-row-warn" : ""}>
            <td>{role}</td>
            <td>{planetLabel(info.planet)}</td>
            <td>{info.house_in_d9} · {info.sign_name || "—"}</td>
            <td>{info.dignity || "—"}</td>
            <td>
              {info.conjunct_with && info.conjunct_with.length > 0
                ? info.conjunct_with.map(planetLabel).join(", ")
                : "कोई नहीं"}
            </td>
            <td>{info.warning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeityStrip({ deities }) {
  const rows = deities ? Object.entries(deities) : [];
  if (rows.length === 0) return <Empty>D-10 देवता डेटा उपलब्ध नहीं।</Empty>;
  return (
    <div className="aae-deity-strip">
      {rows.map(([p, deity]) => (
        <div className="aae-deity-chip" key={p}>
          <span className="aae-deity-planet">{planetLabel(p)}</span>
          <span className="aae-deity-name">{deity}</span>
        </div>
      ))}
    </div>
  );
}

function ArgalaStrip({ argalaDetails, house, houseLabel, viparitaArgala }) {
  const entries = argalaDetails ? argalaDetails[house] || argalaDetails[String(house)] : null;
  if (!entries || entries.length === 0) {
    return <Empty>{houseLabel} पर कोई अर्गला नहीं मिली।</Empty>;
  }
  const givers = entries.filter((e) => e.type === "Argala");
  const cancellers = entries.filter((e) => e.type === "Virodh Argala");
  const validGivers = givers.filter((g) => !g.cancelled);

  let verdict = "कोई विशेष निष्कर्ष नहीं।";
  if (givers.length === 0) {
    verdict = "इस भाव पर कोई अर्गला (लॉक) बन ही नहीं रही।";
  } else if (validGivers.length > 0) {
    verdict = "शुभ/लाभ भावों की अर्गला सक्रिय है और विरोध उसे पूरी तरह काट नहीं पा रहा — सफलता की संभावना मजबूत ✅";
  } else {
    verdict = "अर्गला बनी थी, लेकिन विरोध अर्गला ने उसे काट दिया — असर कमज़ोर पड़ जाता है ⚠️";
  }

  return (
    <div className="aae-argala-block">
      <div className="aae-argala-row">
        <span className="aae-argala-tag aae-argala-tag-lock">लॉक करने वाले</span>
        {givers.length === 0 ? (
          <span className="aae-argala-none">कोई नहीं</span>
        ) : (
          givers.map((g, i) => (
            <span key={i} className={`aae-argala-chip ${g.cancelled ? "aae-argala-cancelled" : ""}`}>
              {planetLabel(g.planet)}
              {g.cancelled ? ` (कट गई — ${planetLabel(g.cancelled_by)} द्वारा)` : ""}
            </span>
          ))
        )}
      </div>
      <div className="aae-argala-row">
        <span className="aae-argala-tag aae-argala-tag-unlock">अनलॉक/काटने वाले (विरोध अर्गला)</span>
        {cancellers.length === 0 ? (
          <span className="aae-argala-none">कोई नहीं</span>
        ) : (
          cancellers.map((c, i) => (
            <span key={i} className="aae-argala-chip aae-argala-chip-unlock">{planetLabel(c.planet)}</span>
          ))
        )}
      </div>
      <p className="aae-argala-verdict">{verdict}</p>
      {viparitaArgala?.viparita_argala_present && (
        <p className="aae-argala-viparita">🚨 {viparitaArgala.verdict}</p>
      )}
    </div>
  );
}

function ArudhaLagnaCard({ arudha }) {
  if (!arudha || arudha.sign_idx === undefined) {
    return <Empty>आरूढ़ लग्न डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-yoga-card">
      <h4>आरूढ़ लग्न (AL) — दुनिया की नज़र में हैसियत</h4>
      <p className="aae-yoga-status">
        {arudha.sign_name} ({arudha.sign_idx + 1}) · लग्नेश: {planetLabel(arudha.lagna_lord)}
        {arudha.exception_applied ? " · अपवाद नियम लागू" : ""}
      </p>
      {arudha.note && <p className="aae-yoga-note">{arudha.note}</p>}
    </div>
  );
}

function TrinityCard({ trinity }) {
  const roles = trinity ? Object.entries(trinity) : [];
  if (roles.length === 0) return <Empty>ब्रह्मा/माहेश्वर/रुद्र डेटा उपलब्ध नहीं।</Empty>;
  return (
    <div className="aae-trinity-grid">
      {roles.map(([key, info]) => (
        <div className="aae-trinity-chip" key={key}>
          <span className="aae-trinity-role">{info.role}</span>
          <span className="aae-trinity-planet">{planetLabel(info.planet)}</span>
          <span className="aae-trinity-house">{info.from_house}वें भाव से (AK)</span>
        </div>
      ))}
    </div>
  );
}

function IshtaDevtaCard({ ishta }) {
  if (!ishta || !ishta.ishta_devta || ishta.ishta_devta.length === 0) {
    return <Empty>इष्ट देवता डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-yoga-card">
      <h4>इष्ट देवता</h4>
      <p className="aae-yoga-status">{ishta.ishta_devta.join(" · ")}</p>
      {ishta.basis && <p className="aae-yoga-note">{ishta.basis}</p>}
    </div>
  );
}

function KarakamshaCard({ kl }) {
  if (!kl || kl.sign_idx === undefined) {
    return <Empty>कारकांश लग्न डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-yoga-card">
      <h4>कारकांश लग्न (KL) — आत्मा का लग्न</h4>
      <p className="aae-yoga-status">
        {kl.sign_name} · आत्मकारक: {planetLabel(kl.atmakaraka)}
      </p>
      {kl.note && <p className="aae-yoga-note">{kl.note}</p>}
    </div>
  );
}

function UpapadaLagnaCard({ ul }) {
  if (!ul || ul.sign_idx === undefined) {
    return <Empty>उपपद लग्न डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-yoga-card">
      <h4>उपपद लग्न (UL) — जैमिनी विवाह सूचक</h4>
      <p className="aae-yoga-status">
        {ul.sign_name} · 12वें स्वामी: {planetLabel(ul.twelfth_lord)}
        {ul.exception_applied ? " · अपवाद नियम लागू" : ""}
      </p>
      {ul.note && <p className="aae-yoga-note">{ul.note}</p>}
    </div>
  );
}

function D10MoolLagnaCard({ d10 }) {
  if (!d10 || d10.sign_idx === undefined) {
    return <Empty>D-10 मूल लग्न डेटा उपलब्ध नहीं।</Empty>;
  }
  return (
    <div className="aae-yoga-card">
      <h4>D-10 मूल लग्न — आंतरिक कार्य-इच्छा</h4>
      <p className="aae-yoga-status">
        {d10.sign_name}
        {d10.occupants?.length > 0 && ` · ग्रह: ${d10.occupants.map(planetLabel).join(", ")}`}
      </p>
      <p className="aae-yoga-note">{d10.internal_work_drive}</p>
    </div>
  );
}

function NavamshaSpecialPointsCard({ pushkar, vish, deities }) {
  const pushkarEntries = pushkar ? Object.entries(pushkar) : [];
  const vishEntries = vish ? Object.entries(vish) : [];
  const deityEntries = deities ? Object.entries(deities) : [];

  if (pushkarEntries.length === 0 && vishEntries.length === 0 && deityEntries.length === 0) {
    return <Empty>नवमांश विशेष बिंदु डेटा उपलब्ध नहीं।</Empty>;
  }

  return (
    <div className="aae-yoga-card">
      <h4>नवमांश विशेष बिंदु (Pushkar / Vish / D-9 देवता)</h4>

      {pushkarEntries.length > 0 && (
        <p className="aae-yoga-status">
          🌟 पुष्कर ग्रह: {pushkarEntries.map(([p]) => planetLabel(p)).join(", ")}
        </p>
      )}
      {vishEntries.length > 0 && (
        <p className="aae-yoga-status" style={{ color: "#ef4444" }}>
          🚨 विष नवमांश ग्रह: {vishEntries.map(([p, v]) => `${planetLabel(p)} (${v.affected_relative})`).join(", ")}
        </p>
      )}
      {pushkarEntries.length === 0 && vishEntries.length === 0 && (
        <p className="aae-yoga-note">कोई ग्रह पुष्कर/विष नवमांश में नहीं है।</p>
      )}

      {deityEntries.length > 0 && (
        <>
          <p className="aae-yoga-note" style={{ marginTop: 8, fontWeight: 600 }}>D-9 देव/नर/राक्षस स्वभाव:</p>
          <div className="aae-trinity-grid" style={{ marginTop: 6 }}>
            {deityEntries.map(([p, info]) => (
              <div className="aae-trinity-chip" key={p}>
                <span className="aae-trinity-role">{planetLabel(p)}</span>
                <span className="aae-trinity-planet">{info.deity}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SanyasDharmaCard({ sanyas, dharma }) {
  if (!sanyas && !dharma) return <Empty>संन्यास/धर्म-परिवर्तन डेटा उपलब्ध नहीं।</Empty>;
  return (
    <div className="aae-yoga-card">
      <h4>संन्यास योग व धर्म परिवर्तन</h4>
      <p className="aae-yoga-status">संन्यास योग: {sanyas?.present ? "मौजूद ✅" : "नहीं"}</p>
      {sanyas?.present && sanyas.reason && <p className="aae-yoga-note">{sanyas.reason}</p>}
      <p className="aae-yoga-status" style={{ marginTop: 8 }}>
        धर्म परिवर्तन योग: {dharma?.present ? "मौजूद ⚠️" : "नहीं"}
      </p>
      {dharma?.note && <p className="aae-yoga-note">{dharma.note}</p>}
    </div>
  );
}

function D30MarriageTimingCard({ timing }) {
  if (!timing || (!timing.early_marriage && !timing.marriage_denial)) {
    return <Empty>D-30 विवाह समय डेटा उपलब्ध नहीं।</Empty>;
  }
  const { early_marriage, marriage_denial } = timing;
  return (
    <div className="aae-yoga-card">
      <h4>त्रिशांश (D-30) से विवाह निर्णय</h4>
      <p className="aae-yoga-status">
        जल्दी शादी: {early_marriage?.present
          ? `हाँ (${early_marriage.matching_planets.map(planetLabel).join(", ")})`
          : "नहीं"}
      </p>
      <p className="aae-yoga-status" style={{ marginTop: 6 }}>
        शादी से इनकार/देरी: {marriage_denial?.present ? "जोखिम मौजूद ⚠️" : "नहीं"}
      </p>
      {marriage_denial?.present && (
        <p className="aae-yoga-note">
          7वें में: {marriage_denial.malefics_in_7th.map(planetLabel).join(", ")} · 8वें में:{" "}
          {marriage_denial.malefics_in_8th.map(planetLabel).join(", ")}
        </p>
      )}
    </div>
  );
}

function SexualPatternsCard({ patterns }) {
  if (!patterns || Object.keys(patterns).length === 0) {
    return <Empty>D-9 यौन-प्रवृत्ति डेटा उपलब्ध नहीं।</Empty>;
  }
  const { excessive_desire, abnormal_desire, lack_of_desire } = patterns;
  return (
    <div className="aae-yoga-card">
      <h4>D-9 यौन प्रवृत्ति संकेत</h4>
      <p className="aae-yoga-status">
        अत्यधिक वासना: {excessive_desire?.present ? `हाँ (${excessive_desire.type})` : "नहीं"}
      </p>
      <p className="aae-yoga-status" style={{ marginTop: 6 }}>
        असामान्य इच्छाएं: {abnormal_desire?.present ? "हाँ ⚠️" : "नहीं"}
      </p>
      <p className="aae-yoga-status" style={{ marginTop: 6 }}>
        इच्छा का अभाव: {lack_of_desire?.present ? "हाँ" : "नहीं"}
      </p>
    </div>
  );
}

function ForeignSettlementCard({ foreign }) {
  if (!foreign || (!foreign.foreign_spouse && !foreign.settle_abroad)) {
    return <Empty>विदेश-योग डेटा उपलब्ध नहीं।</Empty>;
  }
  const { foreign_spouse, settle_abroad } = foreign;
  return (
    <div className="aae-yoga-card">
      <h4>विदेशी जीवनसाथी व विदेश-निवास योग</h4>
      <p className="aae-yoga-status">
        विदेशी जीवनसाथी: {foreign_spouse?.present
          ? `संभावना (दाराकारक: ${planetLabel(foreign_spouse.dara_karaka)})`
          : "नहीं"}
      </p>
      <p className="aae-yoga-status" style={{ marginTop: 6 }}>
        विदेश में बसना: {settle_abroad?.present ? "संभावना ✅" : "नहीं"}
      </p>
    </div>
  );
}

export default function AdvancedAstrologyPanel({ data, loading = false, error = null }) {
  const [openSection, setOpenSection] = useState("forensics");

  const forensics = data?.deep_forensics || {};
  const hasAnyForensics = FORENSICS_SECTIONS.some(
    (s) => forensics[s.key] && Object.keys(forensics[s.key]).length > 0
  );

  const sections = useMemo(
    () => [
      { id: "forensics", label: "गहन विश्लेषण" },
      { id: "timing", label: "समय व अंश" },
      { id: "yoga", label: "योग व मिलान" },
      { id: "rahasya", label: "गूढ़ योग" },
    ],
    []
  );

  if (loading) {
    return (
      <div className="aae-wrapper aae-state">
        <div className="aae-spinner" />
        <p>कुंडली की गहराई में जा रहे हैं…</p>
        <Styles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="aae-wrapper aae-state aae-state-error">
        <p>विश्लेषण लोड नहीं हो सका: {String(error)}</p>
        <Styles />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aae-wrapper aae-state">
        <p>अभी कोई एडवांस डेटा उपलब्ध नहीं है।</p>
        <Styles />
      </div>
    );
  }

  return (
    <div className="aae-wrapper">
      <svg className="aae-yantra" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" />
        <circle cx="100" cy="100" r="66" />
        <circle cx="100" cy="100" r="40" />
        <path d="M100 8 L182 150 L18 150 Z" />
        <path d="M100 192 L18 50 L182 50 Z" />
      </svg>

      <header className="aae-header">
        <p className="aae-eyebrow">डीप फॉरेंसिक्स इंजन</p>
        <h3>कुंडली का गहन विश्लेषण</h3>
      </header>

      <section className="aae-block">
        <h4 className="aae-block-title">जैमिनी चर कारक</h4>
        <KarakaRow karakas={data.chara_karakas} />
      </section>

      <section className="aae-block">
        <h4 className="aae-block-title">वर्गोत्तम ग्रह</h4>
        <VargottamaStrip planets={data.vargottama} />
      </section>

      <nav className="aae-tabs" role="tablist">
        {sections.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={openSection === s.id}
            className={`aae-tab ${openSection === s.id ? "aae-tab-active" : ""}`}
            onClick={() => setOpenSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {openSection === "forensics" && (
        <section className="aae-block">
          {!hasAnyForensics ? (
            <Empty>गहन विश्लेषण के लिए पर्याप्त डेटा नहीं मिला।</Empty>
          ) : (
            <div className="aae-forensics-grid">
              {FORENSICS_SECTIONS.map((s) => (
                <ForensicsCard
                  key={s.key}
                  title={s.label}
                  glyph={s.glyph}
                  entries={forensics[s.key]}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {openSection === "timing" && (
        <section className="aae-block">
          <div className="aae-dial-grid">
            <DegreeDial
              label="होरा लग्न"
              degree={data.mathematical_hora_lagna?.degree}
              signIdx={data.mathematical_hora_lagna?.sign_idx}
              signName={data.mathematical_hora_lagna?.sign_name}
            />
            <DegreeDial
              label="कुंद बिंदु"
              degree={data.kunda?.degree}
              signIdx={data.kunda?.sign_idx}
              signName={null}
            />
            <DegreeDial
              label="भृगु बिंदु"
              degree={data.bhrigu_bindu?.degree}
              signIdx={data.bhrigu_bindu?.sign_idx}
              signName={null}
            />
          </div>
          <div className="aae-mini-row">
            <div className="aae-mini-stat">
              <span className="aae-mini-label">काल होरा स्वामी</span>
              <span className="aae-mini-value">{planetLabel(data.kaal_hora_lord)}</span>
            </div>
            <div className="aae-mini-stat aae-mini-stat-warn">
              <span className="aae-mini-label">64वाँ नवमांश — मारक ग्रह</span>
              <span className="aae-mini-value">
                {data.crisis_points?.["64th_Navamsha_Sign_Idx"] !== undefined
                  ? `${RASHI_NAMES_HI[data.crisis_points["64th_Navamsha_Sign_Idx"]]} (${data.crisis_points["64th_Navamsha_Sign_Idx"] + 1}) ➔ ${planetLabel(data.crisis_points["64th_Navamsha_Lord"])}`
                  : "—"}
              </span>
            </div>
            <div className="aae-mini-stat aae-mini-stat-warn">
              <span className="aae-mini-label">22वाँ द्रेष्काण — मारक ग्रह</span>
              <span className="aae-mini-value">
                {data.crisis_points?.["22nd_Dreshkana_Sign_Idx"] !== undefined
                  ? `${RASHI_NAMES_HI[data.crisis_points["22nd_Dreshkana_Sign_Idx"]]} (${data.crisis_points["22nd_Dreshkana_Sign_Idx"] + 1}) ➔ ${planetLabel(data.crisis_points["22nd_Dreshkana_Lord"])}`
                  : "—"}
              </span>
            </div>
          </div>

          {data.progressed_lagna && (
            <div className="aae-yoga-card aae-prog-lagna-card" style={{ marginTop: 16 }}>
              <h4>प्रोग्रेस्ड लग्न <span className="aae-prog-method">(विधि: VP Goel योगिनी)</span></h4>

              <div className="aae-mini-row" style={{ marginTop: 10 }}>
                <div className="aae-mini-stat">
                  <span className="aae-mini-label">वर्तमान राशि</span>
                  <span className="aae-mini-value">{data.progressed_lagna.current_sign || "—"}</span>
                </div>
                <div className="aae-mini-stat">
                  <span className="aae-mini-label">वर्तमान नक्षत्र</span>
                  <span className="aae-mini-value">{data.progressed_lagna.nakshatra || "—"}</span>
                </div>
                <div className="aae-mini-stat">
                  <span className="aae-mini-label">नक्षत्र स्वामी</span>
                  <span className="aae-mini-value">{planetLabel(data.progressed_lagna.star_lord)}</span>
                </div>
              </div>

              <div className="aae-prog-progress-wrap">
                <div className="aae-prog-progress-labels">
                  <span>प्रगति</span>
                  <span>{data.progressed_lagna.progress_percent ?? 0}%</span>
                </div>
                <div className="aae-prog-progress-track">
                  <div
                    className="aae-prog-progress-fill"
                    style={{ width: `${Math.min(Math.max(data.progressed_lagna.progress_percent ?? 0, 0), 100)}%` }}
                  />
                </div>
              </div>

              {data.progressed_lagna.split?.is_split ? (
                <p className="aae-yoga-note" style={{ marginTop: 10 }}>
                  यह दशा-नक्षत्र {data.progressed_lagna.split.first_sign} और{" "}
                  {data.progressed_lagna.split.second_sign} — दोनों राशियों में बंटा है।
                  {data.progressed_lagna.transition_date && (
                    <> बदलाव की तारीख़: {data.progressed_lagna.transition_date}</>
                  )}
                </p>
              ) : (
                <p className="aae-yoga-note" style={{ marginTop: 10 }}>
                  महादशा: {data.progressed_lagna.start_date} — {data.progressed_lagna.end_date}
                  {" "}({data.progressed_lagna.duration_years} वर्ष)
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {openSection === "yoga" && (
        <section className="aae-block">
          <div className="aae-yoga-row">
            <div className="aae-yoga-card">
              <h4>शिक्षा ↔ करियर (D-24 ↔ D-10)</h4>
              {data.d10_d24_education_match?.match_status ? (
                <p className="aae-yoga-status">{data.d10_d24_education_match.match_status}</p>
              ) : (
                <Empty>मिलान डेटा उपलब्ध नहीं।</Empty>
              )}
            </div>
          </div>

          <h4 className="aae-block-title">D-10 करियर देवता</h4>
          <DeityStrip deities={data.d10_deities} />
          {data.d10_dashamesh_deity?.planet && (
            <p className="aae-yoga-note" style={{ marginTop: 8 }}>
              दशमेश ({planetLabel(data.d10_dashamesh_deity.planet)}) का देवता: {data.d10_dashamesh_deity.deity}
            </p>
          )}

          <h4 className="aae-block-title">D-9 विवाह भाव जांच</h4>
          <MarriageLordTable analysis={data.d9_marriage_analysis} />

          <div className="aae-yoga-row" style={{ marginTop: 16 }}>
            <D30MarriageTimingCard timing={data.d30_marriage_timing} />
          </div>

          <div className="aae-yoga-row">
            <SexualPatternsCard patterns={data.d9_sexual_patterns} />
          </div>

          <div className="aae-yoga-row">
            <ForeignSettlementCard foreign={data.foreign_settlement} />
          </div>
        </section>
      )}

      {openSection === "rahasya" && (
        <section className="aae-block">
          <div className="aae-yoga-row">
            <ArudhaLagnaCard arudha={data.arudha_lagna} />
          </div>

          <div className="aae-yoga-row">
            <KarakamshaCard kl={data.karakamsha_lagna} />
          </div>

          <div className="aae-yoga-row">
            <UpapadaLagnaCard ul={data.upapada_lagna} />
          </div>

          <div className="aae-yoga-row">
            <D10MoolLagnaCard d10={data.d10_mool_lagna} />
          </div>

          <div className="aae-yoga-row">
            <NavamshaSpecialPointsCard
              pushkar={data.pushkar_navamsha_planets}
              vish={data.vish_navamsha_planets}
              deities={data.navamsha_deities}
            />
          </div>

          <div className="aae-yoga-row">
            <SanyasDharmaCard sanyas={data.sanyas_yoga} dharma={data.dharma_parivartan} />
          </div>

          <div className="aae-yoga-row">
            <IshtaDevtaCard ishta={data.ishta_devta} />
          </div>

          <h4 className="aae-block-title">जैमिनी मृत्यु त्रिकोण — ब्रह्मा / माहेश्वर / रुद्र</h4>
          <TrinityCard trinity={data.jaimini_trinity} />

          <h4 className="aae-block-title" style={{ marginTop: 20 }}>
            अर्गला — 10वाँ भाव (करियर) कौन लॉक/अनलॉक कर रहा है
          </h4>
          <ArgalaStrip
            argalaDetails={data.argala_details}
            house={10}
            houseLabel="10वें भाव"
            viparitaArgala={data.viparita_argala}
          />
        </section>
      )}

      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .aae-wrapper {
        --aae-bg: #100e1c;
        --aae-bg-card: #191634;
        --aae-gold: #c9a24d;
        --aae-gold-soft: rgba(201, 162, 77, 0.16);
        --aae-rose: #b5474d;
        --aae-text: #ede6d6;
        --aae-muted: #8f8aa8;
        --aae-line: rgba(201, 162, 77, 0.2);

        position: relative;
        overflow: hidden;
        background: radial-gradient(circle at 15% 0%, #221d3d 0%, var(--aae-bg) 55%);
        color: var(--aae-text);
        border: 1px solid var(--aae-line);
        border-radius: 18px;
        padding: 28px clamp(16px, 4vw, 36px);
        font-family: 'Noto Serif Devanagari', Georgia, 'Times New Roman', serif;
        max-width: 960px;
        margin: 0 auto;
      }

      .aae-yantra {
        position: absolute;
        top: -40px;
        right: -50px;
        width: 220px;
        height: 220px;
        opacity: 0.08;
        stroke: var(--aae-gold);
        fill: none;
        stroke-width: 1;
        pointer-events: none;
      }

      .aae-header { margin-bottom: 20px; }
      .aae-eyebrow {
        font-family: 'Inter', system-ui, sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 11px;
        color: var(--aae-gold);
        margin: 0 0 6px;
      }
      .aae-header h3 {
        margin: 0;
        font-size: clamp(20px, 3vw, 26px);
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .aae-block { margin: 22px 0; position: relative; }
      .aae-block-title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px;
        letter-spacing: 0.04em;
        color: var(--aae-muted);
        text-transform: uppercase;
        margin: 0 0 10px;
        border-bottom: 1px solid var(--aae-line);
        padding-bottom: 8px;
      }

      .aae-empty {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13.5px;
        color: var(--aae-muted);
        margin: 0;
      }

      .aae-karaka-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .aae-karaka-chip {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 12px;
        padding: 10px 14px;
        min-width: 108px;
      }
      .aae-karaka-code {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 10.5px;
        color: var(--aae-gold);
        letter-spacing: 0.08em;
      }
      .aae-karaka-planet { font-size: 15px; }
      .aae-karaka-role {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
      }

      .aae-vargottama { display: flex; flex-wrap: wrap; gap: 8px; }
      .aae-vargottama-badge {
        font-size: 13.5px;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--aae-gold-soft);
        border: 1px solid var(--aae-line);
      }

      .aae-tabs {
        display: flex;
        gap: 6px;
        margin: 22px 0 6px;
        border-bottom: 1px solid var(--aae-line);
      }
      .aae-tab {
        font-family: 'Inter', system-ui, sans-serif;
        background: none;
        border: none;
        color: var(--aae-muted);
        font-size: 13px;
        padding: 10px 6px;
        cursor: pointer;
        position: relative;
      }
      .aae-tab-active { color: var(--aae-text); }
      .aae-tab-active::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: -1px;
        height: 2px;
        background: var(--aae-gold);
      }

      .aae-forensics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .aae-forensics-card {
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 14px;
        padding: 16px;
      }
      .aae-forensics-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .aae-forensics-glyph { color: var(--aae-gold); font-size: 15px; }
      .aae-forensics-head h4 { margin: 0; font-size: 15px; font-weight: 600; }
      .aae-forensics-list { margin: 0; padding-left: 18px; }
      .aae-forensics-list li { font-size: 13.5px; line-height: 1.6; margin-bottom: 6px; }

      .aae-dial-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 18px;
        margin-bottom: 18px;
      }
      .aae-dial-block { display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .aae-dial {
        width: 88px; height: 88px;
        border-radius: 50%;
        background: conic-gradient(var(--aae-gold) var(--aae-angle), rgba(255,255,255,0.06) 0);
        padding: 3px;
      }
      .aae-dial-face {
        width: 100%; height: 100%;
        border-radius: 50%;
        background: var(--aae-bg-card);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .aae-dial-needle {
        position: absolute;
        top: 50%; left: 50%;
        width: 2px; height: 34px;
        background: var(--aae-gold);
        transform-origin: bottom center;
        transform: translate(-50%, -100%) rotate(var(--aae-angle));
      }
      .aae-dial-center {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 15px;
        color: var(--aae-text);
      }
      .aae-dial-caption { text-align: center; }
      .aae-dial-label {
        display: block;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11.5px;
        color: var(--aae-muted);
      }
      .aae-dial-value { font-size: 13px; }

      .aae-mini-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .aae-mini-stat {
        flex: 1 1 160px;
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 12px;
        padding: 10px 14px;
      }
      .aae-mini-label {
        display: block;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
        margin-bottom: 4px;
      }
      .aae-mini-value { font-size: 15px; }

      .aae-mini-stat-warn {
        border-color: rgba(251, 113, 133, 0.4);
        background: rgba(251, 113, 133, 0.06);
      }
      .aae-mini-stat-warn .aae-mini-label { color: #fb7185; }
      .aae-mini-stat-warn .aae-mini-value { color: #fecdd3; }

      .aae-yoga-row { margin-bottom: 18px; }
      .aae-yoga-card {
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 14px;
        padding: 16px;
      }
      .aae-yoga-card h4 { margin: 0 0 8px; font-size: 14px; color: var(--aae-muted); font-weight: 500; }
      .aae-yoga-status { margin: 0; font-size: 15px; color: var(--aae-gold); }
      .aae-yoga-note {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 12.5px;
        color: var(--aae-muted);
        margin: 6px 0 0;
      }

      .aae-prog-method {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11.5px;
        font-weight: 400;
        color: var(--aae-muted);
      }
      .aae-prog-progress-wrap { margin-top: 14px; }
      .aae-prog-progress-labels {
        display: flex;
        justify-content: space-between;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
        margin-bottom: 6px;
      }
      .aae-prog-progress-track {
        height: 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        overflow: hidden;
      }
      .aae-prog-progress-fill {
        height: 100%;
        border-radius: 999px;
        background: var(--aae-gold);
        transition: width 0.6s ease;
      }

      .aae-argala-block {
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 14px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .aae-argala-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .aae-argala-tag {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
        margin-right: 4px;
      }
      .aae-argala-chip {
        font-size: 13px;
        padding: 4px 10px;
        border-radius: 999px;
        background: var(--aae-gold-soft);
        border: 1px solid var(--aae-line);
      }
      .aae-argala-cancelled {
        text-decoration: line-through;
        opacity: 0.6;
      }
      .aae-argala-chip-unlock {
        background: rgba(251, 113, 133, 0.1);
        border-color: rgba(251, 113, 133, 0.3);
      }
      .aae-argala-none {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 12.5px;
        color: var(--aae-muted);
      }
      .aae-argala-verdict {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px;
        color: var(--aae-gold);
        margin: 4px 0 0;
      }
      .aae-argala-viparita {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px;
        color: var(--aae-rose);
        font-weight: 600;
        margin: 2px 0 0;
      }

      .aae-trinity-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
      }
      .aae-trinity-chip {
        display: flex;
        flex-direction: column;
        gap: 3px;
        background: var(--aae-bg-card);
        border: 1px solid var(--aae-line);
        border-radius: 12px;
        padding: 10px 14px;
      }
      .aae-trinity-role {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-gold);
      }
      .aae-trinity-planet { font-size: 14.5px; }
      .aae-trinity-house {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
      }

      .aae-deity-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
      .aae-deity-chip {
        display: flex; gap: 6px; align-items: baseline;
        background: var(--aae-gold-soft);
        border: 1px solid var(--aae-line);
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 12.5px;
      }
      .aae-deity-name { color: var(--aae-gold); }

      .aae-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13.5px;
        margin-top: 6px;
      }
      .aae-table th, .aae-table td {
        text-align: left;
        padding: 8px 10px;
        border-bottom: 1px solid var(--aae-line);
      }
      .aae-table th {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 11px;
        color: var(--aae-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .aae-row-warn td:last-child { color: var(--aae-rose); }

      .aae-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 160px;
        text-align: center;
      }
      .aae-state-error { color: var(--aae-rose); }
      .aae-spinner {
        width: 26px; height: 26px;
        border-radius: 50%;
        border: 2px solid var(--aae-line);
        border-top-color: var(--aae-gold);
        animation: aae-spin 0.9s linear infinite;
      }
      @keyframes aae-spin { to { transform: rotate(360deg); } }

      @media (max-width: 480px) {
        .aae-karaka-chip { min-width: 96px; }
        .aae-dial { width: 76px; height: 76px; }
      }
    `}</style>
  );
}