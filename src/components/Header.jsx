import React from 'react';
import { Video, Zap, ShieldCheck, Sparkles, Languages } from 'lucide-react';

export default function Header({ language, onToggleLanguage }) {
  const isEnglish = language === 'en';

  return (
    <header style={{ position: 'relative', textAlign: 'center', marginBottom: '36px', paddingTop: '20px' }}>
      <button
        type="button"
        className="btn-secondary language-toggle"
        onClick={onToggleLanguage}
        aria-label={isEnglish ? 'Switch language to Persian' : 'Switch language to English'}
      >
        <Languages size={16} />
        {isEnglish ? 'فارسی' : 'English'}
      </button>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', 
          padding: '12px', 
          borderRadius: '16px',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <Video size={32} color="#ffffff" />
        </div>
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isEnglish ? 'Advanced Video Compressor' : 'فشرده‌ساز پیشرفته ویدیو'}
        </h1>
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 18px' }}>
        {isEnglish
          ? 'Smart video compression with minimal quality loss and full control over target size, quality, and resolution — fully offline, nothing is uploaded.'
          : 'کاهش هوشمند حجم ویدیو بدون افت کیفیت محسوس با کنترل کامل بر روی حجم هدف یا کیفیت و رزولوشن — کاملاً آفلاین و بدون آپلود'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span className="badge badge-indigo">
          <Zap size={14} /> {isEnglish ? 'FFmpeg runs in your browser (WASM)' : 'اجرای FFmpeg داخل مرورگر (WASM)'}
        </span>
        <span className="badge badge-cyan">
          <Sparkles size={14} /> {isEnglish ? 'Smart H.264 encoding' : 'الگوریتم هوشمند H.264'}
        </span>
        <span className="badge badge-emerald">
          <ShieldCheck size={14} /> {isEnglish ? 'Private and secure' : 'کاملاً خصوصی و امن'}
        </span>
      </div>
    </header>
  );
}
