# 🎬 Media Compressor Studio

> A fully **offline**, client-side web application for intelligent video compression — target file sizing, CRF quality presets, scaling, FPS and audio control — powered entirely by **FFmpeg compiled to WebAssembly (ffmpeg.wasm)** running inside your browser.

[![FFmpeg WASM](https://img.shields.io/badge/Engine-FFmpeg_WASM-0078D4?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpegwasm.github.io/)
[![Offline](https://img.shields.io/badge/100%25-Offline-10b981?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge?style=for-the-badge)](LICENSE)

**No server. No upload. No API keys.** The video never leaves your machine: it is decoded, encoded and re-wrapped entirely in the browser.

---

## ✨ Features

- **🎯 Target File Size Compression (Method 1):**
  Specify an exact target output size (e.g. `10 MB` for email, `25 MB` for Telegram, `16 MB` for WhatsApp). The engine probes the media duration and calculates the optimal video bitrate to hit the target with minimal quality loss, downscaling automatically when the bitrate would be too low for the current resolution.

- **🎛️ Quality & Codec Control (Method 2):**
  Fine-tune encoding with Constant Rate Factor (CRF) presets:
  - **High Quality (CRF 20):** near lossless output with 20%-40% size reduction.
  - **Balanced (CRF 25):** recommended size / clarity ratio.
  - **High Compression (CRF 30):** up to 85% reduction, ideal for fast sharing.
  - **Custom Scaling:** downscale to `1080p`, `720p`, `480p` or `360p`.
  - **Framerate & Audio:** `30`, `24` or original FPS; audio at `128k`, `96k`, `64k` or muted.

- **⚡ Live Encoding Telemetry:**
  Real-time progress, encoding speed factor (e.g. `3.5x`) and active framerate streamed straight from the FFmpeg WebAssembly runtime.

- **🔒 Privacy-First:**
  Nothing is ever transmitted. Close the tab and every intermediate file disappears.

- **💎 Industrial Dark UI:**
  Clean, high-density dashboard in RTL Persian with crisp typography and pixel-perfect SVG icons.

---

## 🧮 Bitrate Calculation Formula

For target file size matching, the required video bitrate is computed as:

$$\text{Target Bitrate (kbps)} = \max\left(50, \frac{\text{Target File Size (MB)} \times 8192}{\text{Duration (seconds)}} - \text{Audio Bitrate (kbps)}\right)$$

If the calculated bitrate drops below quality thresholds for the current resolution, the resolution is scaled down dynamically to avoid heavy compression artifacts.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js >= 18**
- A modern browser with WebAssembly support (Chrome, Edge, Firefox, Safari 15+)

No FFmpeg installation is required — the codec runs in the browser.

> Note: `npm install` copies the FFmpeg core (`~32 MB`) from `node_modules/@ffmpeg/core` into `public/ffmpeg/` so the app stays fully offline.

### Local development

```bash
git clone https://github.com/amgpulse/media-compressor-studio.git
cd media-compressor-studio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build     # copies ffmpeg core + builds to dist/
npm run preview   # serves the production build locally
```

Run the compression argument regression tests with `npm test`.

---

## 🌐 Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. Every push to `main` / `master` runs `.github/workflows/deploy.yml`, which builds the app and publishes `dist/`.

The site is served from the repository path, so the Vite base is set to `'./'` (relative) and works on any repository name without configuration.

---

## 📁 Project Structure

```
media-compressor-studio/
├── .github/workflows/
│   └── deploy.yml            # Builds and deploys to GitHub Pages
├── public/
│   ├── favicon.svg
│   └── ffmpeg/               # ffmpeg-core.js + .wasm (generated, git-ignored)
├── scripts/
│   └── copy-ffmpeg-core.mjs  # Copies the WASM core from node_modules
├── src/
│   ├── components/           # React UI components
│   └── lib/
│       ├── ffmpeg.js         # FFmpeg WebAssembly loader (singleton)
│       ├── compressor.js     # Argument building + progress parsing
│       └── metadata.js       # Local video probing (duration, resolution)
├── index.html
├── vite.config.js
└── README.md
```

---

## ⚙️ How It Works

1. **Probe:** the selected file is loaded into a detached `<video>` element to read duration and dimensions — no decoding happens yet.
2. **Load:** on the first compression, `ffmpeg-core.js` / `ffmpeg-core.wasm` are fetched from the same origin and instantiated inside a Web Worker.
3. **Encode:** the file is written to the in-memory filesystem, the FFmpeg command built by `src/lib/compressor.js` is executed, and stderr telemetry (`time=`, `speed=`, `fps=`) is parsed to drive the progress UI.
4. **Result:** the output is read back as bytes, turned into a Blob URL for preview and download, then deleted from memory.

### Limits

- Input files are limited to **1 GB**: the whole pipeline runs in browser memory.
- WebAssembly encoding is slower than native FFmpeg; `preset fast` / `medium` keep the wait reasonable.
- Container formats supported for input: MP4, MKV, MOV, AVI, WEBM (whatever the browser can decode plus what FFmpeg can demux). Output is always H.264 + AAC in MP4.

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to open an [issue](https://github.com/amgpulse/media-compressor-studio/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
