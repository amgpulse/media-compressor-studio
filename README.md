<div align="center">

# 🎬 Media Compressor Studio

### Compress videos right in your browser

No video uploads or server-side processing. Choose a target file size or adjust quality, resolution, frame rate, and audio.

[![Live app](https://img.shields.io/badge/Live%20App-Open%20the%20app-6366f1?style=for-the-badge)](https://amgpulse.github.io/media-compressor-studio/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![FFmpeg WASM](https://img.shields.io/badge/Processing-FFmpeg%20WASM-0078d4?style=for-the-badge)](https://ffmpegwasm.github.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](./LICENSE)

</div>

---

## Contents

- [About](#about)
- [Features](#features)
- [Getting started](#getting-started)
- [How to use](#how-to-use)
- [Limitations and notes](#limitations-and-notes)
- [Privacy](#privacy)
- [Technology and project structure](#technology-and-project-structure)
- [Testing and production build](#testing-and-production-build)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Troubleshooting](#troubleshooting)
- [Contributing and license](#contributing-and-license)

## About

**Media Compressor Studio** is a web app for compressing video. Your browser opens the selected file and processes it locally using [FFmpeg WebAssembly](https://ffmpegwasm.github.io/). The output is an MP4 file encoded with H.264 video.

The app includes a Persian, right-to-left interface and an English interface, with two compression methods: target file size and quality settings.

## Features

- **Target file size:** Set a desired output size and calculate a video bitrate based on the video duration.
- **Quality and resolution:** Choose one of three CRF presets and set a maximum output resolution of 1080p, 720p, 480p, or 360p. Smaller source videos are not upscaled.
- **Frame rate:** Keep the original frame rate or convert to 24 or 30 fps.
- **Audio:** In quality mode, choose 128, 96, or 64 kbps audio, or remove audio.
- **Preview and comparison:** Preview the original and compressed videos, then download the result.
- **Persian and English UI:** Switch languages using the button at the top of the page.
- **Live progress:** View encoding progress, speed, and frame rate.

## Getting started

### Requirements

- Node.js 18 or later
- npm
- A modern browser with WebAssembly support

### Run locally

```bash
git clone https://github.com/amgpulse/media-compressor-studio.git
cd media-compressor-studio
npm install
npm run dev
```

Open the URL printed in the terminal. By default, it is:

```text
http://localhost:3000
```

During installation, the FFmpeg WebAssembly core is copied from the npm dependency into `public/ffmpeg/`. These large generated files are excluded from Git and are recreated by `npm install` or when building the app.

## How to use

1. Drop a video onto the upload area, or click it to choose a file.
2. Select **Target file size** or **Quality and resolution**.
3. Adjust the settings and click **Start video compression**.
4. When processing is complete, preview the result and download the MP4.

### Target file size mode

The app estimates a bitrate from the target size and video duration:

```text
Estimated total bitrate (kbps) ≈ target size (MB) × 8192 ÷ duration (seconds)
Estimated video bitrate ≈ total bitrate − selected audio bitrate
```

Audio bitrate is selected as 64, 96, or 128 kbps based on the target size. If the estimated video bitrate is low, the output resolution is automatically capped. This mode **targets** an output size; it does not guarantee an exact file size. Encoding overhead and minimum bitrate limits can affect the result.

### Quality and resolution mode

This mode uses constant-rate-factor (CRF) encoding. A lower CRF value generally produces higher quality and a larger file:

| App preset | CRF | Description |
| --- | ---: | --- |
| High quality | 20 | Preserves more detail and usually produces a larger file |
| Balanced | 25 | Balances quality and file size |
| High compression | 30 | Produces a smaller file with more quality loss |

CRF does not guarantee a particular output size or percentage reduction. Results depend on the video content, duration, resolution, and frame rate.

## Limitations and notes

- The app limits input files to **1 GB**. Larger files may require too much memory or make the browser unresponsive.
- WebAssembly encoding is usually slower than native FFmpeg. Processing time depends on your device, browser, and video.
- Output is always MP4 with H.264 video. In target-size mode, audio is encoded as AAC; in quality mode, you can remove audio.
- The upload interface accepts video MIME types and files with MP4, MKV, MOV, AVI, WEBM, FLV, and WMV extensions. Actual support depends on the browser and the codecs available in FFmpeg.
- The browser must be able to read the video metadata. Some files may not be supported even if their extension is accepted.
- The hosted app needs a network connection to load the page and FFmpeg files. Video files are not sent to the server for processing.

## Privacy

The selected video is not uploaded to the app’s server. Metadata probing and encoding happen in your browser, on your device. Temporary files are stored in FFmpeg’s in-memory workspace and removed after processing. Reloading or closing the page also makes temporary previews and results unavailable, so download your output before leaving.

**Network note:** The interface uses Google Fonts, so loading the page may contact an external service to retrieve fonts. This is separate from local video processing. To run without a network connection, run the app locally and host the fonts locally as well.

## Technology and project structure

- [React 18](https://react.dev/) for the user interface
- [Vite](https://vite.dev/) for development and production builds
- [FFmpeg WebAssembly](https://ffmpegwasm.github.io/) for in-browser video processing
- [Lucide](https://lucide.dev/) for icons

```text
.
├── .github/workflows/deploy.yml   # Build and deploy to GitHub Pages
├── public/
│   ├── favicon.svg
│   └── ffmpeg/                    # Generated FFmpeg files; ignored by Git
├── scripts/
│   └── copy-ffmpeg-core.mjs       # Copy FFmpeg files from node_modules
├── src/
│   ├── components/                # UI components
│   ├── lib/
│   │   ├── compressor.js          # FFmpeg arguments and compression
│   │   ├── compressor.test.js     # Compression argument regression tests
│   │   ├── ffmpeg.js              # FFmpeg WebAssembly loader
│   │   └── metadata.js            # Local video metadata probing
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Testing and production build

Run the regression tests:

```bash
npm test
```

Build the production app:

```bash
npm run build
```

The build output is written to `dist/`. To preview the production build locally:

```bash
npm run preview
```

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. The workflow in `.github/workflows/deploy.yml` installs dependencies, builds the app, and deploys `dist/` on every push to `main` or `master`. You can also run it manually from the **Actions** tab.

The app uses a relative base path so its assets, including FFmpeg files, can be loaded from a GitHub Pages project path.

## Troubleshooting

| Problem | What to try |
| --- | --- |
| Video metadata cannot be read | Try another browser and confirm that the video plays there. A supported extension does not guarantee that its codec is supported. |
| FFmpeg fails to load | Check your network connection and make sure `public/ffmpeg/` exists. Then run `npm install` and `npm run build` again. |
| Compression is slow or the browser runs out of memory | Try a smaller file or close other applications. Large videos require substantial memory. |
| Output does not exactly match the target size | Target size is an estimate. Adjust it and try again; video content and minimum bitrate limits affect the result. |
| The output has no audio | Check the audio setting in quality mode. Target-size mode does not remove audio. |

## Contributing and license

To report a bug or suggest a feature, open an [issue](https://github.com/amgpulse/media-compressor-studio/issues). To contribute, create a branch, include appropriate tests for your changes, and open a pull request.

This project is distributed under the [MIT License](./LICENSE).
