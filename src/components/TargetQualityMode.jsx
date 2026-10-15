import React from 'react';
import { Sliders, Monitor, Volume2, Film, Sparkles, Check } from 'lucide-react';

export default function TargetQualityMode({
  qualityPreset, setQualityPreset,
  resolution, setResolution,
  fpsPreset, setFpsPreset,
  audioOption, setAudioOption,
  language
}) {
  const isEnglish = language === 'en';
  const presets = [
    {
      id: 'high',
      name: isEnglish ? 'High quality' : 'کیفیت بالا',
      desc: isEnglish ? 'Light compression that preserves image detail' : 'کاهش حجم ملایم (حفظ حداکثر جزییات تصویر)',
      tag: isEnglish ? 'Almost no visible quality loss' : 'افت کیفیت تقریباً صفر'
    },
    {
      id: 'medium',
      name: isEnglish ? 'Balanced (recommended)' : 'متعادل (پیشنهادی)',
      desc: isEnglish ? 'An excellent balance of file size and quality' : 'توازن عالی بین حجم کم و کیفیت بالا',
      tag: isEnglish ? '50%–70% size reduction' : 'صرفه‌جویی ۵۰٪ تا ۷۰٪',
      recommended: true
    },
    {
      id: 'low',
      name: isEnglish ? 'High compression' : 'فشرده‌سازی زیاد',
      desc: isEnglish ? 'Large size reduction for quick sharing' : 'کاهش شدید حجم مناسب ارسال سریع در پیام‌رسان‌ها',
      tag: isEnglish ? '70%–85% size reduction' : 'صرفه‌جویی ۷۰٪ تا ۸۵٪'
    }
  ];

  const resolutions = [
    { id: 'original', label: isEnglish ? 'Original resolution' : 'رزولوشن اصلی' },
    { id: '1080', label: '1080p (Full HD)' },
    { id: '720', label: '720p (HD)' },
    { id: '480', label: '480p (SD)' },
    { id: '360', label: isEnglish ? '360p (Mobile)' : '360p (موبایل)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Quality Presets Cards */}
      <div>
        <label style={{ fontSize: '1.05rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sliders size={18} color="var(--primary)" />
          {isEnglish ? 'Video quality preset:' : 'سطح کیفیت تصویر (Quality Preset):'}
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {presets.map(p => (
            <div
              key={p.id}
              onClick={() => setQualityPreset(p.id)}
              style={{
                background: qualityPreset === p.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                border: `2px solid ${qualityPreset === p.id ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              {p.recommended && (
                <span className="badge badge-emerald" style={{ position: 'absolute', top: '-10px', left: '12px', fontSize: '0.75rem' }}>
                  <Sparkles size={12} /> {isEnglish ? 'Recommended' : 'پیشنهادی'}
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{p.name}</h4>
                {qualityPreset === p.id && <Check size={18} color="var(--primary)" />}
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '10px' }}>{p.desc}</p>
              
              <span className="badge badge-indigo" style={{ fontSize: '0.78rem' }}>
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Resolution & FPS Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Resolution */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Monitor size={16} color="var(--accent-cyan)" />
            {isEnglish ? 'Resolution:' : 'تغییر ابعاد / رزولوشن:'}
          </label>
          <select 
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {resolutions.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* FPS */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Film size={16} color="var(--accent-emerald)" />
            {isEnglish ? 'Frame rate (FPS):' : 'نرخ فریم (FPS):'}
          </label>
          <select 
            value={fpsPreset}
            onChange={(e) => setFpsPreset(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="original">{isEnglish ? 'Original frame rate' : 'فریم‌ریت اصلی فایل'}</option>
            <option value="30">{isEnglish ? '30 fps (Standard)' : '۳۰ فریم بر ثانیه (استاندارد)'}</option>
            <option value="24">{isEnglish ? '24 fps (Cinematic)' : '۲۴ فریم بر ثانیه (سینمایی)'}</option>
          </select>
        </div>

        {/* Audio Quality */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Volume2 size={16} color="#f43f5e" />
            {isEnglish ? 'Audio quality:' : 'کیفیت صدا:'}
          </label>
          <select 
            value={audioOption}
            onChange={(e) => setAudioOption(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-color)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="128k">{isEnglish ? '128 kbps (High quality)' : '۱۲۸ کیلوبیت (کیفیت بالا)'}</option>
            <option value="96k">{isEnglish ? '96 kbps (Standard)' : '۹۶ کیلوبیت (استاندارد)'}</option>
            <option value="64k">{isEnglish ? '64 kbps (Compressed)' : '۶۴ کیلوبیت (فشرده)'}</option>
            <option value="mute">{isEnglish ? 'Remove audio' : 'حذف کامل صدا (بدون صدا)'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
