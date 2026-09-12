import { spawn, exec } from 'child_process';

/**
 * Get video metadata using ffprobe
 * @param {string} filePath 
 * @returns {Promise<{duration: number, size: number, width: number, height: number, codec: string, bitrate: number}>}
 */
export function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    exec(cmd, (error, stdout) => {
      if (error) {
        return reject(new Error(`Failed to probe video file: ${error.message}`));
      }
      try {
        const info = JSON.parse(stdout);
        const format = info.format || {};
        const videoStream = (info.streams || []).find(s => s.codec_type === 'video') || {};

        const duration = parseFloat(format.duration || 0);
        const size = parseInt(format.size || 0, 10);
        const width = parseInt(videoStream.width || 0, 10);
        const height = parseInt(videoStream.height || 0, 10);
        const codec = videoStream.codec_name || 'unknown';
        const bitrate = parseInt(format.bit_rate || 0, 10);

        resolve({
          duration,
          size,
          width,
          height,
          codec,
          bitrate,
          aspectRatio: width && height ? (width / height).toFixed(2) : '1.78'
        });
      } catch (e) {
        reject(new Error('Failed to parse video metadata JSON'));
      }
    });
  });
}

/**
 * Convert HH:MM:SS.ms to seconds
 * @param {string} timeStr 
 * @returns {number}
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Compress video to RAM (Buffer) by Target Size
 * @param {Object} params
 * @returns {Promise<{buffer: Buffer, size: number}>}
 */
export function compressByTargetSize({ inputPath, targetSizeMB, duration, onProgress }) {
  return new Promise((resolve, reject) => {
    if (!duration || duration <= 0) {
      return reject(new Error('INVALID_DURATION'));
    }

    const audioBitrateKbps = targetSizeMB < 5 ? 64 : (targetSizeMB < 15 ? 96 : 128);
    const targetTotalBitrateKbps = (targetSizeMB * 8192) / duration;
    let targetVideoBitrateKbps = Math.round(targetTotalBitrateKbps - audioBitrateKbps);

    if (targetVideoBitrateKbps < 50) {
      targetVideoBitrateKbps = 50;
    }

    let scaleFilter = '';
    if (targetVideoBitrateKbps < 300) {
      scaleFilter = '-vf scale=-2:360';
    } else if (targetVideoBitrateKbps < 600) {
      scaleFilter = '-vf scale=-2:480';
    } else if (targetVideoBitrateKbps < 1200) {
      scaleFilter = '-vf scale=-2:720';
    }

    const ffmpegArgs = [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-b:v', `${targetVideoBitrateKbps}k`,
      '-maxrate', `${Math.round(targetVideoBitrateKbps * 1.25)}k`,
      '-bufsize', `${Math.round(targetVideoBitrateKbps * 2)}k`,
      '-c:a', 'aac',
      '-b:a', `${audioBitrateKbps}k`
    ];

    if (scaleFilter) {
      const parts = scaleFilter.split(' ');
      ffmpegArgs.push(parts[0], parts[1]);
    }

    // Output to stdout pipe in memory with fragmented MP4 headers
    ffmpegArgs.push('-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov+default_base_moof', 'pipe:1');

    console.log(`Executing In-Memory FFmpeg Target Size: Target ${targetSizeMB}MB, Video Bitrate: ${targetVideoBitrateKbps}k`);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    const bufferChunks = [];

    ffmpegProcess.stdout.on('data', (chunk) => {
      bufferChunks.push(chunk);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const str = data.toString();
      const timeMatch = str.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
      const speedMatch = str.match(/speed=\s*([\d\.]+)x/);
      const fpsMatch = str.match(/fps=\s*([\d\.]+)/);

      if (timeMatch && duration) {
        const currentTime = parseTimeToSeconds(timeMatch[1]);
        const percent = Math.min(99, Math.max(0, (currentTime / duration) * 100));
        const speed = speedMatch ? speedMatch[1] : '1.0';
        const fps = fpsMatch ? fpsMatch[1] : '0';

        if (onProgress) {
          onProgress({
            percent: parseFloat(percent.toFixed(1)),
            currentTime: parseFloat(currentTime.toFixed(1)),
            duration: parseFloat(duration.toFixed(1)),
            speed,
            fps
          });
        }
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        const finalBuffer = Buffer.concat(bufferChunks);
        if (onProgress) onProgress({ percent: 100, speed: '1.0', fps: '0' });
        resolve({ buffer: finalBuffer, size: finalBuffer.length });
      } else {
        reject(new Error(`FFmpeg in-memory process failed with exit code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Compress video to RAM (Buffer) by Quality Preset
 * @param {Object} params 
 * @returns {Promise<{buffer: Buffer, size: number}>}
 */
export function compressByQuality({ inputPath, resolution, qualityPreset, fpsPreset, audioOption, duration, onProgress }) {
  return new Promise((resolve, reject) => {
    const crfMap = {
      'high': 20,
      'medium': 25,
      'low': 30,
      'maximum': 34
    };

    const crf = crfMap[qualityPreset] || 25;

    let scaleFilter = '';
    if (resolution === '1080') scaleFilter = 'scale=-2:1080';
    else if (resolution === '720') scaleFilter = 'scale=-2:720';
    else if (resolution === '480') scaleFilter = 'scale=-2:480';
    else if (resolution === '360') scaleFilter = 'scale=-2:360';

    const ffmpegArgs = [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-crf', crf.toString(),
      '-preset', 'medium'
    ];

    if (scaleFilter) {
      ffmpegArgs.push('-vf', scaleFilter);
    }

    if (fpsPreset && fpsPreset !== 'original') {
      ffmpegArgs.push('-r', fpsPreset);
    }

    if (audioOption === 'mute') {
      ffmpegArgs.push('-an');
    } else {
      const audioBitrate = audioOption || '128k';
      ffmpegArgs.push('-c:a', 'aac', '-b:a', audioBitrate);
    }

    // Output to stdout pipe in memory with fragmented MP4 headers
    ffmpegArgs.push('-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov+default_base_moof', 'pipe:1');

    console.log(`Executing In-Memory FFmpeg Quality Preset: CRF ${crf}, Res: ${resolution || 'original'}`);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    const bufferChunks = [];

    ffmpegProcess.stdout.on('data', (chunk) => {
      bufferChunks.push(chunk);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const str = data.toString();
      const timeMatch = str.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
      const speedMatch = str.match(/speed=\s*([\d\.]+)x/);
      const fpsMatch = str.match(/fps=\s*([\d\.]+)/);

      if (timeMatch && duration) {
        const currentTime = parseTimeToSeconds(timeMatch[1]);
        const percent = Math.min(99, Math.max(0, (currentTime / duration) * 100));
        const speed = speedMatch ? speedMatch[1] : '1.0';
        const fps = fpsMatch ? fpsMatch[1] : '0';

        if (onProgress) {
          onProgress({
            percent: parseFloat(percent.toFixed(1)),
            currentTime: parseFloat(currentTime.toFixed(1)),
            duration: parseFloat(duration.toFixed(1)),
            speed,
            fps
          });
        }
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        const finalBuffer = Buffer.concat(bufferChunks);
        if (onProgress) onProgress({ percent: 100, speed: '1.0', fps: '0' });
        resolve({ buffer: finalBuffer, size: finalBuffer.length });
      } else {
        reject(new Error(`FFmpeg in-memory process failed with exit code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
}
