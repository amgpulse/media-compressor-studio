import React, { useState } from 'react';
import { Download, ArrowRightLeft, Sparkles, CheckCircle2, RotateCcw, Share2 } from 'lucide-react';
import { apiUrl } from '../utils/api';

export default function VideoComparison({ originalFile, compressedResult, onReset }) {
  const [activeTab, setActiveTab] = useState('compressed'); // 'compressed' | 'original'

  if (!compressedResult || !originalFile) return null;

  const originalMB = (originalFile.size / (1024 * 1024)).toFixed(2);
  const compressedMB = compressedResult.compressedSizeFormatted || (compressedResult.compressedSize / (1024 * 1024)).toFixed(2) + ' MB';
  const savedPercent = compressedResult.reductionPercent || 0;

  const handleDownload = () => {
    window.location.href = apiUrl(compressedResult.downloadUrl);
  };

  return (
    <div className="glass-panel" style={{ padding: '32px 24px', marginBottom: '32px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <CheckCircle2 size={24} color="var(--accent-emerald)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
            فشرده‌سازی با موفقیت انجام شد!
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>حجم اولیه</span>
            <strong style={{ fontSize: '1.3rem', color: '#f43f5e' }}>{originalMB} MB</strong>
          </div>

          <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>➔</div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>حجم جدید</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)' }}>{compressedMB}</strong>
          </div>

          <div className="badge badge-emerald" style={{ fontSize: '1.1rem', padding: '8px 18px' }}>
            <Sparkles size={16} /> کاهش {savedPercent}٪
          </div>
        </div>
      </div>

      {/* Main Download Action */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <button onClick={handleDownload} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.15rem' }}>
          <Download size={22} /> دانلود ویدیو فشرده شده
        </button>

        <button onClick={onReset} className="btn-secondary" style={{ padding: '16px 24px' }}>
          <RotateCcw size={18} /> فشرده‌سازی ویدیوی دیگر
        </button>
      </div>

      {/* Video Preview Switcher */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white' }}>
            مقایسه و پیش‌نمایش کیفیت:
          </h3>

          <div className="tabs-container" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${activeTab === 'compressed' ? 'active' : ''}`}
              onClick={() => setActiveTab('compressed')}
            >
              ویدیو فشرده‌شده ({compressedMB})
            </button>
            <button
              className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
              onClick={() => setActiveTab('original')}
            >
              ویدیو اصلی ({originalMB} MB)
            </button>
          </div>
        </div>

        <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid var(--border-color)' }}>
          {activeTab === 'compressed' ? (
            <video 
              key="compressed" 
              src={apiUrl(compressedResult.streamUrl)}
              controls 
              autoPlay
              style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }}
            />
          ) : (
            <video 
              key="original" 
              src={apiUrl(originalFile.filePath)}
              controls 
              style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
