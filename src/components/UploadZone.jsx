import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function UploadZone({ onFileUploaded, selectedFile, onReset }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mkv|mov|avi|webm|flv|wmv)$/i)) {
      setError('لطفاً یک فایل ویدیویی معتبر (MP4, MKV, MOV, AVI, WEBM) انتخاب کنید.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploadProgress(50);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در آپلود ویدیو');
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        onFileUploaded(data);
      }, 300);
    } catch (err) {
      console.error(err);
      setError(err.message || 'خطایی در آپلود فایل رخ داد.');
      setIsUploading(false);
    }
  };

  if (selectedFile) {
    const meta = selectedFile.metadata || {};
    const durationMin = meta.duration ? Math.floor(meta.duration / 60) : 0;
    const durationSec = meta.duration ? Math.floor(meta.duration % 60) : 0;

    return (
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <FileVideo size={36} color="var(--primary)" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', marginBottom: '4px' }}>
                {selectedFile.originalName}
              </h3>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                <span>حجم اولیه: <strong style={{ color: '#6366f1' }}>{selectedFile.sizeFormatted}</strong></span>
                <span>•</span>
                <span>مدت زمان: <strong>{durationMin}:{durationSec < 10 ? '0' : ''}{durationSec}</strong></span>
                <span>•</span>
                <span>ابعاد: <strong>{meta.width}x{meta.height}</strong></span>
              </div>
            </div>
          </div>

          <button onClick={onReset} className="btn-secondary" title="انتخاب ویدیوی دیگر">
            <RefreshCw size={16} /> تغییر ویدیو
          </button>
        </div>

        {/* Video Preview */}
        <div style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', maxHeight: '260px', background: '#000' }}>
          <video 
            src={selectedFile.filePath}
            controls 
            style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '32px 24px', marginBottom: '24px' }}>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
          background: isDragging ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="video/*,.mp4,.mkv,.mov,.avi,.webm" 
          style={{ display: 'none' }} 
        />

        <div style={{ 
          width: '72px', 
          height: '72px', 
          margin: '0 auto 16px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <UploadCloud size={36} color="var(--primary)" />
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
          ویدیو خود را کشیده و اینجا رها کنید
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '16px' }}>
          یا برای انتخاب فایل کلیک کنید (پشتیبانی از MP4, MKV, MOV, WEBM تا ۲ گیگابایت)
        </p>

        {isUploading && (
          <div style={{ maxWidth: '300px', margin: '16px auto 0' }}>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.2s ease' }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>در حال آپلود و تحلیل ویدیو... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'rgba(244, 63, 94, 0.15)', 
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f87171',
          padding: '12px 16px',
          borderRadius: '12px',
          marginTop: '16px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
