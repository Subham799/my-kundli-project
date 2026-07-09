import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function CaseStudyList() {
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE}/api/posts`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPosts(data.posts);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-white py-20">डेटा लोड हो रहा है...</div>;

  const allStudies = Object.entries(posts).map(([id, data]) => ({ id, ...data }));
  const categories = ["All", ...new Set(allStudies.map(p => p.category))];
  const filteredStudies = activeTab === "All" ? allStudies : allStudies.filter(p => p.category === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <Helmet>
        <title>Astrology Case Studies | KundliMaker</title>
        <meta name="description" content="वास्तविक कुंडलियों का गहरा विश्लेषण और सटीक भविष्यवाणियां" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-amber-400 mb-2">ज्योतिष केस स्टडीज़ 📂</h1>
        <p className="text-slate-400 mb-6">वास्तविक कुंडलियों का गहरा विश्लेषण</p>

        {/* 🌟 Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4" style={{scrollbarWidth: "none"}}>
          {categories.map((cat, idx) => (
            <button key={idx} onClick={() => setActiveTab(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === cat ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30" : "bg-slate-900 text-slate-400 border border-slate-700"
              }`}
            >
              {cat === "All" ? "सभी देखें" : cat}
            </button>
          ))}
        </div>

        {/* 🌟 Cards */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredStudies.map((post) => (
              <motion.div layout initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}}
                key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full hover:border-cyan-500/50 transition-all">
                
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-cyan-950 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded">{post.category}</span>
                  <span className="text-[10px] text-slate-500">{post.date}</span>
                </div>
                
                <h2 className="text-lg font-bold text-slate-100 mb-3">{post.title}</h2>
                
                <div className="bg-slate-950 rounded-xl p-3 mb-4 flex-1 border border-slate-800/50 text-[11px] text-slate-400">
                  <div className="mb-1">👤 {post.clientProfile?.gender}, Age {post.clientProfile?.age}</div>
                  <div>⚠️ <span className="text-rose-400">{post.clientProfile?.issue}</span></div>
                </div>

                <Link to={`/case-studies/${post.id}`} className="text-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-4 py-2 rounded-xl">
                  पूरी केस फाइल पढ़ें ➔
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}