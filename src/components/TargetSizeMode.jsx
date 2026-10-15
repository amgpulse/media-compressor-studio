import React from 'react';
import { HardDrive, Send, Mail, Share2, Info } from 'lucide-react';

export default function TargetSizeMode({ fileData, targetSize, setTargetSize, language }) {
  if (!fileData) return null;

  const isEnglish = language === 'en';
  const originalMB = fileData.size / (1024 * 1024);
  const stepMB = originalMB < 1 ? 0.001 : 0.1;
  const minTargetMB = Math.min(stepMB, originalMB);
  const sizePrecision = originalMB < 1 ? 3 : 1;
  const duration = fileData.metadata?.duration || 1;

  // Calculate estimated reduction
  const reduction = Math.max(0, originalMB - targetSize);
  const reductionPercentage = ((reduction / originalMB) * 100).toFixed(0);

  // Bitrate estimation check
  const estimatedBitrateKbps = ((targetSize * 8192) / duration) - 96;
  const isBitrateTooLow = estimatedBitrateKbps < 150;

  const handlePreset = (mb) => {
    const target = mb < originalMB ? mb : originalMB * 0.5;
    setTargetSize(Math.min(originalMB, Math.max(minTargetMB, parseFloat(target.toFixed(sizePrecision)))));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="var(--primary)" />
            {isEnglish ? 'Target video size after compression:' : 'حجم هدف ویدیو پس از فشرده‌سازی:'}
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            {isEnglish ? 'Input video size:' : 'حجم ویدیو ورودی:'} {originalMB.toFixed(1)} MB
          </p>
        </div>

        {/* Numeric Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="number" 
            min={minTargetMB}
            max={originalMB}
            step={stepMB}
            value={targetSize}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (Number.isFinite(val)) {
                setTargetSize(Math.min(originalMB, Math.max(minTargetMB, val)));
              }
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--primary)',
              borderRadius: '10px',
              color: '#ffffff',
              padding: '10px 14px',
              fontSize: '1.2rem',
              fontWeight: 700,
              width: '100px',
              textAlign: 'center',
              outline: 'none'
            }}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{isEnglish ? 'Megabytes (MB)' : 'مگابایت (MB)'}</span>
        </div>
      </div>

      {/* Slider */}
      <div>
        <input 
          type="range" 
          min={minTargetMB}
          max={originalMB}
          step={stepMB}
          value={targetSize}
          onChange={(e) => setTargetSize(parseFloat(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '6px' }}>
          <span>{minTargetMB.toFixed(sizePrecision)} MB</span>
          <span>{(originalMB / 2).toFixed(sizePrecision)} MB ({isEnglish ? '50%' : '۵۰٪'})</span>
          <span>{originalMB.toFixed(sizePrecision)} MB ({isEnglish ? 'original size' : 'حجم اولیه'})</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
          {isEnglish ? 'Quick presets (click to apply):' : 'میان‌برهای محبوب (کلیک کنید):'}
        </span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.88rem', padding: '8px 14px' }}
            onClick={() => handlePreset(10)}
          >
            <Mail size={14} /> {isEnglish ? '10 MB (Email)' : '۱۰ مگابایت (ارسال ایمیل)'}
          </button>
          
          <button 
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.88rem', padding: '8px 14px' }}
            onClick={() => handlePreset(25)}
          >
            <Send size={14} /> {isEnglish ? '25 MB (Telegram limit)' : '۲۵ مگابایت (حد تلگرام)'}
          </button>

          <button 
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.88rem', padding: '8px 14px' }}
            onClick={() => handlePreset(16)}
          >
            <Share2 size={14} /> {isEnglish ? '16 MB (WhatsApp)' : '۱۶ مگابایت (واتساپ)'}
          </button>

          <button 
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.88rem', padding: '8px 14px' }}
            onClick={() => handlePreset(originalMB * 0.5)}
          >
            {isEnglish ? '50% of original' : '۵۰٪ حجم اولیه'}
          </button>
        </div>
      </div>

      {/* Savings Summary Banner */}
      <div style={{ 
        background: 'rgba(16, 185, 129, 0.1)', 
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '1.05rem', display: 'block' }}>
            {isEnglish
              ? `Estimated compression: ${reductionPercentage}% saved`
              : `میزان فشرده‌سازی تخمینی: ${reductionPercentage}٪ صرفه‌جویی`}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isEnglish
              ? `From ${originalMB.toFixed(sizePrecision)} MB to ${targetSize} MB (saving ${reduction.toFixed(sizePrecision)} MB)`
              : `کاهش از ${originalMB.toFixed(sizePrecision)} مگابایت به ${targetSize} مگابایت (کاهش ${reduction.toFixed(sizePrecision)} مگابایت)`}
          </span>
        </div>

        <span className="badge badge-emerald" style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
          -{reductionPercentage}%
        </span>
      </div>

      {isBitrateTooLow && (
        <div style={{ 
          background: 'rgba(245, 158, 11, 0.15)', 
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={18} />
          <span>
            {isEnglish
              ? 'The target size is small for this video duration. Resolution will be reduced automatically to avoid a severe quality loss.'
              : 'توجه: حجم درخواستی نسبت به مدت زمان ویدیو کم است. رزولوشن به صورت خودکار تغییر می‌کند تا کیفیت تصویر افت شدید نکند.'}
          </span>
        </div>
      )}
    </div>
  );
}
