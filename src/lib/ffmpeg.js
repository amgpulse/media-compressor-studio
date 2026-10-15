import { FFmpeg } from '@ffmpeg/ffmpeg';

let instance = null;
let loading = null;

function assetURL(path) {
  const base = import.meta.env.BASE_URL || '/';
  return new URL(`${base}${path}`, document.baseURI).href;
}

export function getFFmpeg() {
  if (instance && instance.loaded) return Promise.resolve(instance);

  if (!loading) {
    const ffmpeg = new FFmpeg();
    loading = ffmpeg
      .load({
        coreURL: assetURL('ffmpeg/ffmpeg-core.js'),
        wasmURL: assetURL('ffmpeg/ffmpeg-core.wasm'),
      })
      .then(() => {
        instance = ffmpeg;
        return instance;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }

  return loading;
}

export function terminateFFmpeg() {
  if (instance) {
    instance.terminate();
    instance = null;
  }
  loading = null;
}
