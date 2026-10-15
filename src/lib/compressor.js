import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg';
import { formatSize } from './metadata';

const INPUT_NAME = 'input_video';
const OUTPUT_NAME = 'output_compressed.mp4';

const CRF_MAP = {
  high: 20,
  medium: 25,
  low: 30,
  maximum: 34,
};

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 3) return 0;
  return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}

export function buildArgs({ mode, targetSizeMB, qualityPreset, resolution, fpsPreset, audioOption, duration }) {
  const args = ['-i', INPUT_NAME];

  if (mode === 'targetSize') {
    if (!duration || duration <= 0) {
      throw new Error('INVALID_DURATION');
    }

    const audioBitrateKbps = targetSizeMB < 5 ? 64 : targetSizeMB < 15 ? 96 : 128;
    const targetTotalBitrateKbps = (targetSizeMB * 8192) / duration;
    let videoBitrateKbps = Math.round(targetTotalBitrateKbps - audioBitrateKbps);
    if (videoBitrateKbps < 50) videoBitrateKbps = 50;

    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-b:v', `${videoBitrateKbps}k`,
      '-maxrate', `${Math.round(videoBitrateKbps * 1.25)}k`,
      '-bufsize', `${Math.round(videoBitrateKbps * 2)}k`,
      '-c:a', 'aac',
      '-b:a', `${audioBitrateKbps}k`
    );

    let scaleFilter = '';
    if (videoBitrateKbps < 300) scaleFilter = 'scale=-2:360';
    else if (videoBitrateKbps < 600) scaleFilter = 'scale=-2:480';
    else if (videoBitrateKbps < 1200) scaleFilter = 'scale=-2:720';

    if (scaleFilter) args.push('-vf', scaleFilter);
  } else {
    const crf = CRF_MAP[qualityPreset] || 25;

    args.push('-c:v', 'libx264', '-crf', String(crf), '-preset', 'medium');

    if (resolution === '1080') args.push('-vf', 'scale=-2:1080');
    else if (resolution === '720') args.push('-vf', 'scale=-2:720');
    else if (resolution === '480') args.push('-vf', 'scale=-2:480');
    else if (resolution === '360') args.push('-vf', 'scale=-2:360');

    if (fpsPreset && fpsPreset !== 'original') args.push('-r', fpsPreset);

    if (audioOption === 'mute') {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac', '-b:a', audioOption || '128k');
    }
  }

  args.push('-movflags', '+faststart', OUTPUT_NAME);
  return args;
}

async function safeDelete(ffmpeg, path) {
  try {
    await ffmpeg.deleteFile(path);
  } catch {
    /* file does not exist */
  }
}

/**
 * Compresses a video entirely inside the browser using FFmpeg WebAssembly.
 * Returns a blob URL - nothing is uploaded anywhere.
 */
export async function compressVideo({ file, duration, ...options }, onProgress) {
  const ffmpeg = await getFFmpeg();
  const args = buildArgs({ duration, ...options });

  const stats = { percent: 0, speed: '1.0', fps: '0', currentTime: 0, duration: duration || 0 };

  const emit = () => onProgress && onProgress({ ...stats });

  const handleLog = ({ message }) => {
    if (!message) return;
    const timeMatch = message.match(/time=(\d{2}:\d{2}:\d{2}\.\d+)/);
    const speedMatch = message.match(/speed=\s*([\d.]+)x/);
    const fpsMatch = message.match(/fps=\s*([\d.]+)/);

    if (timeMatch && duration) {
      stats.currentTime = parseFloat(parseTimeToSeconds(timeMatch[1]).toFixed(1));
      stats.percent = Math.min(99, Math.max(0, (stats.currentTime / duration) * 100));
    }
    if (speedMatch) stats.speed = speedMatch[1];
    if (fpsMatch) stats.fps = fpsMatch[1];
    if (timeMatch || speedMatch || fpsMatch) emit();
  };

  const handleProgress = ({ progress }) => {
    if (typeof progress !== 'number' || !isFinite(progress)) return;
    if (!duration) {
      stats.percent = Math.min(99, Math.max(0, progress * 100));
      emit();
    }
  };

  await safeDelete(ffmpeg, INPUT_NAME);
  await safeDelete(ffmpeg, OUTPUT_NAME);
  await ffmpeg.writeFile(INPUT_NAME, await fetchFile(file));

  ffmpeg.on('log', handleLog);
  ffmpeg.on('progress', handleProgress);

  try {
    const code = await ffmpeg.exec(args);
    if (code !== 0) {
      throw new Error(`FFmpeg exited with code ${code}`);
    }

    const data = await ffmpeg.readFile(OUTPUT_NAME);
    const blob = new Blob([data], { type: 'video/mp4' });
    const reductionPercent = Math.max(
      0,
      parseFloat((((file.size - blob.size) / file.size) * 100).toFixed(1))
    );

    onProgress && onProgress({ ...stats, percent: 100 });

    return {
      blob,
      url: URL.createObjectURL(blob),
      size: blob.size,
      sizeFormatted: formatSize(blob.size),
      reductionPercent,
      filename: `compressed_${Date.now()}.mp4`,
    };
  } finally {
    ffmpeg.off('log', handleLog);
    ffmpeg.off('progress', handleProgress);
    await safeDelete(ffmpeg, INPUT_NAME);
    await safeDelete(ffmpeg, OUTPUT_NAME);
  }
}
