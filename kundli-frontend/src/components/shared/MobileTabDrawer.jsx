/**
 * MobileTabDrawer.jsx
 * 
 * Mobile-only bottom drawer for 17+ tabs.
 * On desktop: not rendered (DashboardLayout uses its existing tab bar).
 * On mobile:  floating button → drawer from bottom with all tabs grouped.
 * 
 * File location: src/components/shared/MobileTabDrawer.jsx
 * 
 * Usage in DashboardLayout.jsx:
 *   import MobileTabDrawer from "../components/shared/MobileTabDrawer";
 *   import { useIsMobile } from "../hooks/useIsMobile";
 * 
 *   const isMobile = useIsMobile();
 * 
 *   // In render:
 *   {isMobile && (
 *     <MobileTabDrawer
 *       tabs={TABS}
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *       enginesReady={chartData?._enginesReady}
 *     />
 *   )}
 */
import { useState, useEffect, useRef } from "react";

// Reuse your existing phase info from constants.js
// Tabs with phase:2 need enginesReady to be enabled

const GROUP_ICONS = {
  "मुख्य":    "🌟",
  "ग्रह":     "🪐",
  "योग":      "✨",
  "दशा":      "📅",
  "गोचर":     "🔭",
  "विशेष":    "🔮",
};

// Group tabs by their label prefix or manual mapping
function groupTabs(tabs) {
  // Groups in display order
  const groups = [
    { name: "मुख्य",   ids: ["planets","houses","drishti","conclusion"] },
    { name: "दशा",     ids: ["dasha","av"] },
    { name: "गोचर",    ids: ["gochar","nadi"] },
    { name: "योग",     ids: ["yogas","advanced","av_sutras"] },
    { name: "चंद्र",   ids: ["chandra_surya","kamukta"] },
    { name: "विशेष",   ids: ["dasha_shani","advanced_yogas","kp_btr","vivah"] },
  ];

  // Any tabs not in groups go to "अन्य"
  const grouped = groups.map(g => ({
    ...g,
    tabs: g.ids.map(id => tabs.find(t => t.id === id)).filter(Boolean),
  })).filter(g => g.tabs.length > 0);

  const allGroupedIds = grouped.flatMap(g => g.ids);
  const others = tabs.filter(t => !allGroupedIds.includes(t.id));
  if (others.length > 0) grouped.push({ name: "अन्य", tabs: others });

  return grouped;
}

export default function MobileTabDrawer({ tabs = [], activeTab, onTabChange, enginesReady }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const groups = groupTabs(tabs);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const currentTab = tabs.find(t => t.id === activeTab);

  function handleSelect(tab) {
    if (tab.phase === 2 && !enginesReady) return; // disabled
    onTabChange(tab.id);
    setOpen(false);
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
          zIndex:998, transition:"opacity 0.2s",
        }} onClick={() => setOpen(false)} />
      )}

      {/* Floating pill button — shows current tab */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position:"fixed", bottom:"72px", left:"50%", transform:"translateX(-50%)",
          zIndex:997, display:"flex", alignItems:"center", gap:"8px",
          padding:"10px 20px", borderRadius:"24px", border:"none",
          background:"rgba(20,20,30,0.92)", backdropFilter:"blur(12px)",
          WebkitBackdropFilter:"blur(12px)",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          color:"#fff", fontSize:"13px", fontWeight:600, cursor:"pointer",
          fontFamily:"inherit", minHeight:"44px", minWidth:"160px",
          justifyContent:"center",
        }}
      >
        <span style={{ fontSize:"16px" }}>☰</span>
        <span style={{ maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {currentTab?.label || "टैब चुनें"}
        </span>
        <span style={{ fontSize:"12px", opacity:0.6 }}>▲</span>
      </button>

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:999,
          background:"rgba(12,12,20,0.97)", backdropFilter:"blur(16px)",
          WebkitBackdropFilter:"blur(16px)",
          borderTop:"1px solid rgba(255,255,255,0.12)",
          borderRadius:"20px 20px 0 0",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition:"transform 0.32s cubic-bezier(0.4,0,0.2,1)",
          maxHeight:"80vh", overflowY:"auto",
          paddingBottom:"env(safe-area-inset-bottom, 16px)",
        }}
      >
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 8px" }}>
          <div style={{ width:"40px", height:"4px", borderRadius:"2px", background:"rgba(255,255,255,0.25)" }} />
        </div>

        {/* Header */}
        <div style={{ padding:"0 16px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"rgba(255,255,255,0.9)", fontWeight:700, fontSize:"15px" }}>
            सेक्शन चुनें
          </span>
          <button onClick={() => setOpen(false)} style={{
            background:"none", border:"none", color:"rgba(255,255,255,0.5)",
            fontSize:"22px", cursor:"pointer", padding:"4px 8px", lineHeight:1,
          }}>✕</button>
        </div>

        {/* Groups */}
        <div style={{ padding:"0 12px 24px" }}>
          {groups.map(group => (
            <div key={group.name} style={{ marginBottom:"16px" }}>
              <div style={{
                fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.4)",
                letterSpacing:"0.08em", textTransform:"uppercase",
                padding:"0 4px 8px",
              }}>
                {GROUP_ICONS[group.name] || "•"} {group.name}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {group.tabs.map(tab => {
                  const isActive   = tab.id === activeTab;
                  const isDisabled = tab.phase === 2 && !enginesReady;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSelect(tab)}
                      disabled={isDisabled}
                      style={{
                        padding:"9px 14px", borderRadius:"12px", border:"1px solid",
                        borderColor: isActive ? "rgba(99,179,237,0.7)" : "rgba(255,255,255,0.12)",
                        background: isActive
                          ? "rgba(99,179,237,0.18)"
                          : isDisabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                        color: isActive ? "#63B3ED"
                             : isDisabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.82)",
                        fontSize:"13px", fontWeight: isActive ? 700 : 400,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        fontFamily:"inherit", minHeight:"40px",
                        transition:"all 0.15s",
                      }}
                    >
                      {tab.label}
                      {isDisabled && <span style={{ fontSize:"10px", opacity:0.5, marginLeft:"4px" }}>⏳</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}