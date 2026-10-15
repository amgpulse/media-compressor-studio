import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import TargetSizeMode from './components/TargetSizeMode';
import TargetQualityMode from './components/TargetQualityMode';
import ProgressModal from './components/ProgressModal';
import VideoComparison from './components/VideoComparison';
import { compressVideo } from './lib/compressor';
import { Target, Sliders, Play, AlertCircle } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage === 'en' ? 'en' : 'fa';
  });
  const isEnglish = language === 'en';
  const [fileData, setFileData] = useState(null);
  const [mode, setMode] = useState('targetSize'); // 'targetSize' | 'targetQuality'
  
  // Method 1 parameters
  const [targetSize, setTargetSize] = useState(25); // MB

  // Method 2 parameters
  const [qualityPreset, setQualityPreset] = useState('medium');
  const [resolution, setResolution] = useState('original');
  const [fpsPreset, setFpsPreset] = useState('original');
  const [audioOption, setAudioOption] = useState('128k');

  // Job & Progress state
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isEnglish ? 'ltr' : 'rtl';
    document.title = isEnglish
      ? 'Advanced Video Compressor | Video Compressor Pro'
      : 'فشرده‌ساز پیشرفته ویدیو | Video Compressor Pro';
    localStorage.setItem('language', language);
  }, [language, isEnglish]);

  // Set default target size when file is uploaded (50% of original size)
  const handleFileUploaded = (data) => {
    if (fileData?.filePath) URL.revokeObjectURL(fileData.filePath);
    if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    setFileData(data);
    setCompressedResult(null);
    setError(null);
    if (data && data.size) {
      const originalMB = data.size / (1024 * 1024);
      const minTargetMB = Math.min(originalMB < 1 ? 0.001 : 0.1, originalMB);
      const defaultTarget = Math.min(
        originalMB,
        Math.max(minTargetMB, parseFloat((originalMB * 0.4).toFixed(originalMB < 1 ? 3 : 1)))
      );
      setTargetSize(defaultTarget);
    }
  };

  const handleReset = () => {
    if (fileData?.filePath) URL.revokeObjectURL(fileData.filePath);
    if (compressedResult?.url) URL.revokeObjectURL(compressedResult.url);
    setFileData(null);
    setCompressedResult(null);
    setProgressData(null);
    setIsCompressing(false);
    setError(null);
  };

  const startCompression = async () => {
    if (!fileData) return;
    setError(null);
    setIsCompressing(true);
    setProgressData({ percent: 0, speed: '1.0', fps: '0' });

    try {
      const result = await compressVideo(
        {
          file: fileData.file,
          duration: fileData.metadata?.duration || 0,
          mode,
          targetSizeMB: targetSize,
          qualityPreset,
          resolution,
          fpsPreset,
          audioOption,
        },
        (progress) => setProgressData(progress)
      );

      setIsCompressing(false);
      setProgressData(null);
      setCompressedResult(result);
    } catch (err) {
      console.error(err);
      setIsCompressing(false);
      setProgressData(null);
      setError(
        err.message === 'INVALID_DURATION'
          ? (isEnglish
              ? 'Video duration could not be detected. Try the "Quality and resolution" method.'
              : 'مدت زمان ویدیو قابل تشخیص نبود؛ روش «کیفیت و رزولوشن» را امتحان کنید.')
          : (err.message || (isEnglish
              ? 'An error occurred while compressing the video.'
              : 'خطایی در حین فشرده‌سازی پیش آمد.'))
      );
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 60px' }}>
      <Header language={language} onToggleLanguage={() => setLanguage(isEnglish ? 'fa' : 'en')} />

      {/* Upload Zone */}
      <UploadZone 
        selectedFile={fileData} 
        onFileUploaded={handleFileUploaded} 
        onReset={handleReset} 
        language={language}
      />

      {/* Show Result View if Compression Completed */}
      {compressedResult ? (
        <VideoComparison 
          originalFile={fileData} 
          compressedResult={compressedResult} 
          onReset={handleReset} 
          language={language}
        />
      ) : fileData ? (
        /* Options & Controls Container */
        <div className="glass-panel" style={{ padding: '32px 24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'white' }}>
            {isEnglish ? 'Choose a compression method:' : 'روش فشرده‌سازی را انتخاب کنید:'}
          </h2>

          {/* Mode Tabs */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${mode === 'targetSize' ? 'active' : ''}`}
              onClick={() => setMode('targetSize')}
            >
              <Target size={18} /> {isEnglish ? 'Target file size' : 'روش اول: تعیین حجم مشخص (Target Size)'}
            </button>

            <button 
              className={`tab-btn ${mode === 'targetQuality' ? 'active' : ''}`}
              onClick={() => setMode('targetQuality')}
            >
              <Sliders size={18} /> {isEnglish ? 'Quality and resolution' : 'روش دوم: تنظیم کیفیت و رزولوشن (Target Quality)'}
            </button>
          </div>

          {/* Mode Tab Content */}
          <div style={{ marginBottom: '32px' }}>
            {mode === 'targetSize' ? (
              <TargetSizeMode 
                fileData={fileData} 
                targetSize={targetSize} 
                setTargetSize={setTargetSize} 
                language={language}
              />
            ) : (
              <TargetQualityMode 
                qualityPreset={qualityPreset} setQualityPreset={setQualityPreset}
                resolution={resolution} setResolution={setResolution}
                fpsPreset={fpsPreset} setFpsPreset={setFpsPreset}
                audioOption={audioOption} setAudioOption={setAudioOption}
                language={language}
              />
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
              marginBottom: '24px'
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Start Button */}
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={startCompression}
              disabled={isCompressing}
              className="btn-primary"
              style={{ width: '100%', maxWidth: '380px', padding: '16px 32px', fontSize: '1.15rem' }}
            >
              <Play size={20} /> {isEnglish ? 'Start video compression' : 'شروع فشرده‌سازی ویدیو'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Live Progress Overlay */}
      {isCompressing && <ProgressModal progressData={progressData} language={language} />}
    </div>
  );
}
