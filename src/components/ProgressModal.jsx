import React from 'react';
import { Loader2, Cpu, Zap, Activity } from 'lucide-react';

export default function ProgressModal({ progressData, language }) {
  const isEnglish = language === 'en';
  const percent = progressData ? Math.min(100, Math.max(0, progressData.percent || 0)) : 0;
  const speed = progressData?.speed || '1.0';
  const fps = progressData?.fps || '0';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '36px 28px',
        textAlign: 'center',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
      }}>
        {/* Animated Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
        }}>
          <Loader2 size={40} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>

        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
          {isEnglish ? 'Compressing your video...' : 'در حال فشرده‌سازی ویدیو...'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {isEnglish
            ? 'FFmpeg is encoding and optimizing your video.'
            : 'موتور FFmpeg در حال انکود و بهینه‌سازی فرمت ویدیو است'}
        </p>

        {/* Big Percentage Number */}
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: '16px', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>
          {percent}%
        </div>

        {/* Progress Bar */}
        <div style={{
          height: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '5px',
          overflow: 'hidden',
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
            boxShadow: '0 0 12px var(--primary)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Live Encoding Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '14px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Zap size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {isEnglish ? 'Speed:' : 'سرعت:'} <strong>{speed}x</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <Activity size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {isEnglish ? 'Frame rate:' : 'نرخ:'} <strong>{fps} fps</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
