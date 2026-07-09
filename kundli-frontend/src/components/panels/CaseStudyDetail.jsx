import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export default function CaseStudyDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/posts/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPost(data.post);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-white text-center py-20">केस फाइल लोड हो रही है...</div>;
  if (!post) return <div className="text-white text-center py-20">यह केस स्टडी मौजूद नहीं है (404)</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      {/* 🚀 SEO DYNAMIC TAGS */}
      <Helmet>
        <title>{post.title} | KundliMaker</title>
        <meta name="description" content={post.seoDescription} />
        <link rel="canonical" href={`https://kundlimaker.com/case-studies/${slug}`} />
      </Helmet>

      <div className="max-w-3xl mx-auto mt-4">
        <Link to="/case-studies" className="text-cyan-500 text-sm font-bold mb-6 inline-block">
          ← सभी केस स्टडीज़
        </Link>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 md:p-10 border-b border-slate-800">
            <span className="bg-cyan-950 text-cyan-400 text-[10px] font-bold px-2.5 py-1 rounded mb-4 inline-block">{post.category}</span>
            <h1 className="text-2xl md:text-4xl font-black text-white mb-6">{post.title}</h1>
            <div className="text-slate-500 text-xs font-bold">प्रकाशित: {post.date}</div>
          </div>
          {/* 📄 Header Section के नीचे और Content से ठीक पहले */}
<div className="p-6 md:p-10">

  {/* 🌟 चार्ट इमेज ब्लॉक (कहानी से पहले - एकदम सेंटर में) */}
  {post.chartImage && (
    <div className="mb-8 flex flex-col items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3">
        📊 विश्लेषण चार्ट / जन्म कुण्डली
      </div>
      <img 
        src={post.chartImage} 
        alt="Kundli Chart" 
        className="w-full max-w-sm md:max-w-md rounded-xl border border-slate-800 shadow-2xl transition-transform hover:scale-[1.02] duration-300"
      />
    </div>
  )}

  {/* आपकी पुरानी कहानी का Markdown */}
  <div className="prose prose-invert prose-cyan max-w-none" style={{fontFamily:"'Noto Sans Devanagari',sans-serif"}}>
    <ReactMarkdown>{post.content}</ReactMarkdown>
  </div>
</div>

          {/* Markdown Content */}
          <div className="p-6 md:p-10">
            <div className="prose prose-invert prose-cyan max-w-none">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}