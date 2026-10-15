export function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

/**
 * Reads video metadata locally using a detached <video> element.
 * No server round-trip, nothing leaves the browser.
 */
export function probeVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      URL.revokeObjectURL(url);
    };

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? video.duration : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      cleanup();
      resolve({
        duration,
        width,
        height,
        aspectRatio: width && height ? (width / height).toFixed(2) : '1.78',
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('خواندن اطلاعات ویدیو ممکن نشد. فرمت فایل را بررسی کنید.'));
    };

    video.src = url;
  });
}
