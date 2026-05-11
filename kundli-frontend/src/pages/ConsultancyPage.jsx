import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Star, ShieldCheck, ArrowLeft, User, Zap, CheckCircle2, Globe, Mail, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const REVIEWS = [
  { id: 1, src: "/reviews/1.png", alt: "Client Feedback 1" },
  { id: 2, src: "/reviews/2.png", alt: "Payment Proof" },
  { id: 3, src: "/reviews/3.png", alt: "Success Story" },
  { id: 4, src: "/reviews/4.png", alt: "Success Story" },
  { id: 5, src: "/reviews/5.png", alt: "Success Story" },
  { id: 6, src: "/reviews/6.png", alt: "Success Story" },
  { id: 7, src: "/reviews/7.png", alt: "Success Story" },
];

export default function ConsultancyPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 pb-32"
      style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
    >
    {/* 🌟 PREMIUM HEADER & NAVIGATION */}
      <div className="max-w-6xl mx-auto mb-10 text-center pt-4">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {/* Back to Home Link */}
          {/* <Link 
            to="/" 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-amber-400 hover:bg-slate-800 hover:border-amber-500/50 transition-all backdrop-blur-md text-xs md:text-sm font-medium shadow-lg shadow-black/20"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" /> 
            वापस होमपेज / Back to Home
          </Link> */}

          {/* New: Check Kundali Link */}
          <Link 
            to="/" 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-slate-900 transition-all backdrop-blur-md text-xs md:text-sm font-bold shadow-lg shadow-amber-500/10"
          >
            <Sparkles size={16} className="animate-pulse" /> 
            कुण्डली देखें / Check your kundali with all yogas
          </Link>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-3 drop-shadow-lg">
          Premium Astrology Consultancy
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base px-4 font-light">
          सटीक KP और नाड़ी ज्योतिष द्वारा अपने जीवन के सबसे महत्वपूर्ण सवालों के जवाब पाएं। <br className="hidden md:block" />
          <span className="text-slate-500">Get precise answers to your life's most critical questions via KP & Nadi Astrology.</span>
        </p>
      </div>
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
        {[
          { label: "Satisfied Clients", val: "500+", icon: <User className="text-cyan-400" /> },
          { label: "Accuracy Rate", val: "99%", icon: <Zap className="text-amber-400" /> },
          { label: "Consultation", val: "Bilingual", icon: <Globe className="text-yellow-400" /> }, 
          { label: "Trusted", val: "100%", icon: <ShieldCheck className="text-green-400" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <div className="text-lg font-bold text-white">{s.val}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 💳 PRICING SECTION (Bilingual & Multi-Currency) */}
      <div className="max-w-5xl mx-auto mb-16 px-2">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">परामर्श शुल्क / Consultation Fees</h2>
          <p className="text-slate-500 text-xs">International payments accepted via PayPal / Stripe</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Package 1: Single Topic */}
          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl flex flex-col hover:border-amber-500 transition-all shadow-xl group">
            <h3 className="text-xl font-black text-amber-400 mb-1">Single Topic</h3>
            <p className="text-slate-500 text-xs mb-4">एकल विषय विश्लेषण / One Specific Topic</p>
            <div className="flex items-baseline gap-2 mb-6">
               <span className="text-3xl font-black text-white">₹399</span>
               <span className="text-slate-400">/</span>
               <span className="text-xl font-bold text-amber-500">$9 USD</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 border-t border-white/5 pt-4">
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-amber-500 shrink-0"/> Marriage / करियर (Career)</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-amber-500 shrink-0"/> Health / स्वास्थ्य</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-amber-500 shrink-0"/> Any 1 Custom Question</li>
            </ul>
            <a href="https://chat.whatsapp.com/LikRc4VDPVhJVRuJwmzlm1" target="_blank" rel="noreferrer" className="text-center bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all group-hover:scale-105">
              Select Package
            </a>
          </div>

          {/* Package 2: BTR (Birth Time Rectification) */}
          <div className="bg-slate-900 border border-cyan-500/50 p-6 rounded-3xl flex flex-col hover:border-cyan-400 transition-all shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Expertise</div>
            <h3 className="text-xl font-black text-cyan-400 mb-1">B.T.R.</h3>
            <p className="text-slate-500 text-xs mb-4">जन्म समय शुद्धि / Birth Time Correction</p>
            <div className="flex items-baseline gap-2 mb-6">
               <span className="text-3xl font-black text-white">₹599</span>
               <span className="text-slate-400">/</span>
               <span className="text-xl font-bold text-cyan-500">$15 USD</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 border-t border-white/5 pt-4">
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-cyan-500 shrink-0"/> Time Correction (Seconds level)</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-cyan-500 shrink-0"/> Event Verification (Past life events)</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-cyan-500 shrink-0"/> Ruling Planets Verification</li>
            </ul>
            <a href="https://chat.whatsapp.com/LikRc4VDPVhJVRuJwmzlm1" target="_blank" rel="noreferrer" className="text-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all group-hover:scale-105">
              Book Rectification
            </a>
          </div>

          {/* Package 3: Full Reading */}
          <div className="bg-slate-900 border border-green-500/30 p-6 rounded-3xl flex flex-col hover:border-green-500 transition-all shadow-xl group">
            <h3 className="text-xl font-black text-green-400 mb-1">Full Reading</h3>
            <p className="text-slate-500 text-xs mb-4">संपूर्ण कुंडली / Complete Life Analysis</p>
            <div className="flex items-baseline gap-2 mb-6">
               <span className="text-3xl font-black text-white">₹999</span>
               <span className="text-slate-400">/</span>
               <span className="text-xl font-bold text-green-500">$25 USD</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1 border-t border-white/5 pt-4">
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0"/> Everything Included (Marriage/Career)</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0"/> 5 Years Future Prediction</li>
              <li className="text-xs text-slate-300 flex gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0"/> Remedies & Solutions (उपाय)</li>
            </ul>
            <a href="https://chat.whatsapp.com/LikRc4VDPVhJVRuJwmzlm1" target="_blank" rel="noreferrer" className="text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all group-hover:scale-105">
              Get Complete Chart
            </a>
          </div>

        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white mb-2">क्लाइंट्स का फीडबैक / Client Feedback</h2>
        <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full"></div>
      </div>

      {/* 📸 IMAGE SECTION (Reviews) */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 max-w-6xl mx-auto space-y-4 px-2">
        {REVIEWS.map((img) => (
          <div key={img.id} className="break-inside-avoid">
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy" 
              className="w-full rounded-xl border border-white/10 hover:border-amber-500/50 transition-all shadow-xl"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>

     {/* 🚀 PREMIUM STICKY CTA (WhatsApp + Email) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto">
        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-900/80 backdrop-blur-lg p-2 rounded-3xl border border-slate-700 shadow-2xl">
          
          <a 
            href="https://chat.whatsapp.com/LikRc4VDPVhJVRuJwmzlm1" 
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all md:hover:scale-105 w-full md:w-auto text-sm"
          >
            <MessageCircle size={18} /> 
            <span>WhatsApp Consultation</span>
          </a>

          <a 
           href="mailto:subhamkandpal799@gmail.com?subject=Astrology Consultation Enquiry"


            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500 px-6 py-3.5 rounded-2xl font-bold transition-all md:hover:scale-105 w-full md:w-auto text-sm"
          >
            <Mail size={18} />
            <span>Email Us</span>
          </a>

        </div>
      </div>
    </motion.div>
  );
}