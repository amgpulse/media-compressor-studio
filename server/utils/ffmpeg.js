import { spawn, exec } from 'child_process';
import path from 'path';

/**
 * Get video metadata using ffprobe / ffmpeg
 * @param {string} filePath 
 * @returns {Promise<{duration: number, size: number, width: number, height: number, codec: string, bitrate: number}>}
 */
export function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    // We use ffprobe to get precise JSON metadata
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        // Fallback parsing if ffprobe fails
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
 * Compress video to a target file size in Megabytes
 * @param {Object} params
 * @returns {Promise<string>}
 */
export function compressByTargetSize({ inputPath, outputPath, targetSizeMB, duration, onProgress }) {
  return new Promise((resolve, reject) => {
    if (!duration || duration <= 0) {
      return reject(new Error('INVALID_DURATION'));
    }

    // Audio bitrate decision
    const audioBitrateKbps = targetSizeMB < 5 ? 64 : (targetSizeMB < 15 ? 96 : 128);
    
    // Total bits = Size in Bytes * 8
    // Total Bitrate (kbps) = (Target MB * 8192) / Duration (seconds)
    const targetTotalBitrateKbps = (targetSizeMB * 8192) / duration;
    let targetVideoBitrateKbps = Math.round(targetTotalBitrateKbps - audioBitrateKbps);

    // Safety checks
    if (targetVideoBitrateKbps < 50) {
      targetVideoBitrateKbps = 50; // minimum reasonable bitrate
    }

    // Scale resolution dynamically if target bitrate is low to prevent pixelated ugly video
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

    // Faststart for web playback
    ffmpegArgs.push('-movflags', '+faststart', outputPath);

    console.log(`Executing FFmpeg Target Size: Target ${targetSizeMB}MB, Video Bitrate: ${targetVideoBitrateKbps}k`);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stderr.on('data', (data) => {
      const str = data.toString();
      // Extract time=00:00:12.34
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
        if (onProgress) onProgress({ percent: 100, speed: '1.0', fps: '0' });
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg exited with error code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Compress video by Quality Preset (CRF & Resolution)
 * @param {Object} params 
 * @returns {Promise<string>}
 */
export function compressByQuality({ inputPath, outputPath, resolution, qualityPreset, fpsPreset, audioOption, duration, onProgress }) {
  return new Promise((resolve, reject) => {
    // Quality Presets -> CRF mappings
    // lower CRF = higher quality, higher CRF = smaller file size
    const crfMap = {
      'high': 20,       // High quality, modest compression (~20-40% reduction)
      'medium': 25,     // Balanced quality & size (~50-70% reduction)
      'low': 30,        // High compression, smaller size (~70-85% reduction)
      'maximum': 34     // Extreme compression
    };

    const crf = crfMap[qualityPreset] || 25;

    // Scale resolution filter
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

    // Audio options
    if (audioOption === 'mute') {
      ffmpegArgs.push('-an');
    } else {
      const audioBitrate = audioOption || '128k';
      ffmpegArgs.push('-c:a', 'aac', '-b:a', audioBitrate);
    }

    ffmpegArgs.push('-movflags', '+faststart', outputPath);

    console.log(`Executing FFmpeg Quality Preset: CRF ${crf}, Res: ${resolution || 'original'}`);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

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
        if (onProgress) onProgress({ percent: 100, speed: '1.0', fps: '0' });
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process failed with exit code ${code}`));
      }
    });

    ffmpegProcess.on('error', (err) => {
      reject(err);
    });
  });
}
