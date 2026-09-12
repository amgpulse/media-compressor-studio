# 🎬 Media Compressor Studio

> A high-performance, developer-grade web application for intelligent video compression, target file sizing, and codec customization powered by native **FFmpeg** and **Node.js**.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![FFmpeg Native](https://img.shields.io/badge/Engine-FFmpeg_Native-0078D4?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.style=for-the-badge?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

---

## ✨ Features

- **🎯 Target File Size Compression (Method 1):**
  Specify exact target output file sizes (e.g., `10 MB` for email, `25 MB` for Telegram, `16 MB` for WhatsApp). The engine automatically probes media duration and calculates optimal video bitrates to hit the target file size with minimal quality loss.

- **🎛️ Quality & Codec Control (Method 2):**
  Fine-tune encoding parameters using Constant Rate Factor (CRF) presets:
  - **High Quality (CRF 20):** Visually lossless quality with 20%-40% size reduction.
  - **Balanced (CRF 25):** Recommended optimal size & clarity ratio.
  - **High Compression (CRF 30):** Up to 85% reduction, ideal for fast web distribution.
  - **Custom Scaling:** Downscale resolution to `1080p`, `720p`, `480p`, or `360p`.
  - **Framerate & Audio Controls:** Adjust FPS (`30`, `24`, or Original) and audio bitrates (`128k`, `96k`, `64k`, or Mute).

- **⚡ Live Encoding Telemetry (SSE):**
  Real-time progress streaming over Server-Sent Events (SSE) displaying live progress percentage, encoding speed factor (e.g., `3.5x`), active framerate (`fps`), and remaining duration.

- **💎 Industrial Dark UI:**
  Clean, high-density dashboard inspired by modern professional tools (Linear, Vercel Studio) featuring crisp typography, LTR alignment, and pixel-perfect SVG icons.

- **🔒 Privacy-First & Local Hardware Acceleration:**
  Processes video natively on your system using local FFmpeg CPU/GPU pipelines without transmitting videos to external third-party cloud servers.

---

## 🧮 Bitrate Calculation Formula

For target file size matching, the application computes the required video bitrate using the following equation:

$$\text{Target Bitrate (kbps)} = \max\left(50, \frac{\text{Target File Size (MB)} \times 8192}{\text{Duration (seconds)}} - \text{Audio Bitrate (kbps)}\right)$$

If the calculated video bitrate drops below quality thresholds for high resolutions, resolution scaling is dynamically applied to prevent compression artifacts.

---

## 🚀 Quick Start

### Prerequisites

Ensure you have **Node.js (>= 18.0.0)** and **FFmpeg** installed on your operating system.

#### Installing FFmpeg:
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update && sudo apt install ffmpeg
  ```
- **macOS (Homebrew):**
  ```bash
  brew install ffmpeg
  ```
- **Windows (Chocolatey / Scoop):**
  ```bash
  choco install ffmpeg
  ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/media-compressor-studio.git
   cd media-compressor-studio
   ```

2. **Start the server:**
   ```bash
   node server/index.js
   ```

3. **Open in browser:**
   Navigate to [http://localhost:5050](http://localhost:5050).

---

## 📁 Project Structure

```
media-compressor-studio/
├── public/                  # Static Web Assets & UI Shell
│   └── index.html           # Standalone Single-Page Application (HTML/CSS/JS)
├── server/                  # Backend Node.js Server & APIs
│   ├── index.js             # HTTP Core Server & Server-Sent Events (SSE) Endpoint
│   └── utils/
│       └── ffmpeg.js        # FFmpeg Spawn Utilities & Probe Math
├── uploads/                 # Temporary Upload Directory (Ignored in Git)
├── outputs/                 # Transcoded Output Directory (Ignored in Git)
└── README.md                # Project Documentation
```

---

## 🛠️ API Reference

### 1. Upload Video & Probe Metadata
`POST /api/upload` (Multipart Form-Data)
- **Response:**
  ```json
  {
    "filename": "video-1788527520.mp4",
    "sizeFormatted": "48.50 MB",
    "metadata": {
      "duration": 124.5,
      "width": 1920,
      "height": 1080,
      "codec": "h264",
      "bitrate": 3200000
    }
  }
  ```

### 2. Start Compression Job
`POST /api/compress` (JSON)
- **Payload:**
  ```json
  {
    "filename": "video-1788527520.mp4",
    "mode": "targetSize",
    "targetSizeMB": 15
  }
  ```
- **Response:**
  ```json
  {
    "jobId": "job-1788527537031-466"
  }
  ```

### 3. SSE Live Progress Stream
`GET /api/compress/progress/:jobId` (EventSource)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/media-compressor-studio/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
