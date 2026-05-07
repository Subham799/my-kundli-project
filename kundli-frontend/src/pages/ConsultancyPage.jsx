import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Star, ShieldCheck, ArrowLeft, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

// 📸 1. YAHAN HAIN TUMHARI IMAGES KI LIST (Yehi Image Section ka dimag hai)
// public/reviews/ folder mein jo bhi photos hain, unka naam yahan likhna hai
const REVIEWS = [
  { id: 1, src: "/reviews/1.png", alt: "Client Feedback 1" },
  { id: 2, src: "/reviews/2.png", alt: "Payment Proof" },
  { id: 3, src: "/reviews/3.png", alt: "Success Story" },
  { id: 4, src: "/reviews/4.png", alt: "Success Story" },
  { id: 5, src: "/reviews/5.png", alt: "Success Story" },
  { id: 6, src: "/reviews/6.png", alt: "Success Story" },
  { id: 7, src: "/reviews/7.png", alt: "Success Story" },
  // Nayi photo daalni ho to bas aise hi ek aur line jod do
];

export default function ConsultancyPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8"
      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
    >
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-12 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-amber-500 mb-6 hover:underline">
          <ArrowLeft size={18} /> वापस होमपेज पर
        </Link>
        <h1 className="text-3xl md:text-5xl font-black text-amber-500 mb-4">
          Personal Astrology Consultancy
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          हज़ारों लोगों का भरोसा और सटीक फलादेश। यहाँ आप हमारे क्लाइंट्स के फीडबैक और सफलता की कहानियाँ देख सकते हैं।
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
        {[
          { label: "Satisfied Clients", val: "500+", icon: <User className="text-cyan-400" /> },
          { label: "Accuracy Rate", val: "99%", icon: <Zap className="text-amber-400" /> },
          { label: "Consultation Fee", val: "₹251", icon: <Star className="text-yellow-400" /> }, 
          { label: "Trusted Platform", val: "100%", icon: <ShieldCheck className="text-green-400" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-xl font-bold text-white">{s.val}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 📸 2. IMAGE SECTION (Ye loop chalega aur upar wali saari photos dikhayega) */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 max-w-6xl mx-auto space-y-4">
        {REVIEWS.map((img) => (
          <div key={img.id} className="break-inside-avoid">
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy" 
              className="w-full rounded-xl border border-white/10 hover:border-amber-500/50 transition-all shadow-xl"
              // Agar koi photo folder mein nahi milti hai, to yeh code uski jagah toota hua icon nahi dikhayega, balki usko gayab kar dega
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

      {/* CTA Button Sticky */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <a 
          // 🚀 TUMHARA WHATSAPP GROUP LINK YAHAN UPDATE KAR DIYA HAI
          href="https://chat.whatsapp.com/LikRc4VDPVhJVRuJwmzlm1" 
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all scale-110"
        >
          <MessageCircle /> अभी परामर्श लें (₹251)
        </a>
      </div>
    </motion.div>
  );
}