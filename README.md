# Media Compressor Studio

A Persian, right-to-left web interface for compressing video with FFmpeg. The React/Vite frontend talks to a local Node.js HTTP server that probes uploads, runs FFmpeg jobs, streams progress over Server-Sent Events (SSE), and serves the resulting MP4.

## Features

- Compress toward a requested file size. The target is an estimate: a single-pass bitrate calculation cannot guarantee an exact output size.
- Compress using quality presets, with optional resolution, frame-rate, and audio settings.
- View upload metadata and compare the original video with the compressed result.
- Follow encoding progress, speed, and frame rate over SSE.
- Run the processing server locally; videos are not intentionally sent to a third-party cloud service.

## Requirements

- Node.js 18 or newer and npm
- FFmpeg, including `ffprobe`, available on `PATH`

Check that both FFmpeg commands are available:

```sh
ffmpeg -version
ffprobe -version
```

## Run locally

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The Vite development server proxies `/api` and `/uploads` requests to the Node.js server on port `5050`.

You can also run the two processes separately in different terminals:

```sh
npm run server
npm run dev
```

To create and preview a production frontend build:

```sh
npm run build
npm run preview
```

The compression server is a separate process; `vite preview` serves only the frontend.

## GitHub Pages demo

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` publishes the frontend to GitHub Pages when changes are pushed to `main` (or when run manually). In the repository settings, enable **Settings → Pages → Build and deployment → Source → GitHub Actions**.

GitHub Pages only hosts static files. Without a separately hosted Node.js/FFmpeg backend, the deployed page is a UI demo: upload, compression, progress, preview, and download require the backend and will not work.

When a backend is available:

1. Add a repository Actions variable named `VITE_API_BASE_URL` with the backend's origin, for example `https://compressor-api.example.com` (no trailing slash).
2. Configure that backend for public HTTPS access and allow the GitHub Pages origin through CORS.
3. Trigger the workflow again. The frontend uses the variable for API calls and uploaded/compressed video URLs.

Do not expose the current server directly to the public internet without adding appropriate upload limits, validation, resource controls, and access protections. It accepts unauthenticated requests and buffers uploads and compressed output in memory.

## API overview

The frontend uses these server routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/upload` | Upload a video and return its metadata |
| `POST` | `/api/compress` | Start a compression job and return its job ID |
| `GET` | `/api/compress/progress/:jobId` | Receive job progress and completion over SSE |
| `GET` | `/api/stream/:jobId` | Preview the compressed MP4 (supports byte ranges) |
| `GET` | `/api/download/:jobId` | Download the compressed MP4 |

The server defaults to port `5050`; set `PORT` to change it. Vite's development proxy is configured for this port.

## Project layout

```text
src/                    React application and UI components
server/index.js         Node.js HTTP API and job lifecycle
server/utils/ffmpeg.js  ffprobe metadata and FFmpeg encoding helpers
public/                 Static assets
uploads/                Uploaded source videos (local server)
outputs/                Reserved for generated output files
.github/workflows/      GitHub Actions workflows
```

## License

MIT. See [LICENSE](./LICENSE).
