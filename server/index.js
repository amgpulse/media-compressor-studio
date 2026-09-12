import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVideoMetadata, compressByTargetSize, compressByQuality } from './utils/ffmpeg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const PORT = process.env.PORT || 5050;

// Ensure directories exist
const uploadDir = path.join(rootDir, 'uploads');
const outputDir = path.join(rootDir, 'outputs');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// Active jobs store for SSE
const activeJobs = new Map();

// Content types helper
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

/**
 * Handle multipart video upload stream
 */
function handleUpload(req, res) {
  const boundaryMatch = req.headers['content-type']?.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'فرمت درخواست نامعتبر است' }));
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const filename = `video-${Date.now()}-${Math.floor(Math.random() * 10000)}.mp4`;
  const filePath = path.join(uploadDir, filename);
  const writeStream = fs.createWriteStream(filePath);

  let bodyBuffer = Buffer.alloc(0);

  req.on('data', chunk => {
    bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
  });

  req.on('end', async () => {
    try {
      const boundaryBuf = Buffer.from(`--${boundary}`);
      let headerEndIndex = bodyBuffer.indexOf('\r\n\r\n');

      if (headerEndIndex === -1) {
        throw new Error('فایل ویدیویی در درخواست یافت نشد');
      }

      const fileDataStart = headerEndIndex + 4;
      let fileDataEnd = bodyBuffer.lastIndexOf(boundaryBuf);
      
      if (fileDataEnd > 2) {
        fileDataEnd -= 2; // trim trailing \r\n
      }

      const fileContent = bodyBuffer.subarray(fileDataStart, fileDataEnd);
      fs.writeFileSync(filePath, fileContent);

      // Probe metadata with ffprobe
      const metadata = await getVideoMetadata(filePath);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        filename,
        originalName: filename,
        filePath: `/uploads/${filename}`,
        size: fileContent.length,
        sizeFormatted: (fileContent.length / (1024 * 1024)).toFixed(2) + ' MB',
        metadata
      }));
    } catch (err) {
      console.error('Upload Process Error:', err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message || 'خطا در آپلود ویدیو' }));
    }
  });
}

/**
 * Handle HTTP requests
 */
const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. API: Upload Video
  if (pathname === '/api/upload' && req.method === 'POST') {
    return handleUpload(req, res);
  }

  // 2. API: Start Compression Job
  if (pathname === '/api/compress' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { filename, mode, targetSizeMB, qualityPreset, resolution, fpsPreset, audioOption } = payload;

        if (!filename) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'نام فایل الزامی است' }));
        }

        const inputPath = path.join(uploadDir, filename);
        if (!fs.existsSync(inputPath)) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'فایل ویدیو یافت نشد' }));
        }

        const metadata = await getVideoMetadata(inputPath);
        const jobId = 'job-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const outputFilename = `compressed-${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);

        const jobState = {
          jobId,
          status: 'processing',
          percent: 0,
          currentTime: 0,
          duration: metadata.duration,
          speed: '1.0',
          fps: '0',
          outputFilename,
          outputUrl: `/outputs/${outputFilename}`,
          originalSize: metadata.size,
          compressedSize: 0,
          reductionPercent: 0,
          listeners: []
        };

        activeJobs.set(jobId, jobState);

        // Progress Callback
        const onProgress = (data) => {
          const job = activeJobs.get(jobId);
          if (!job) return;

          Object.assign(job, data);

          job.listeners.forEach(client => {
            client.write(`data: ${JSON.stringify({
              status: job.status,
              percent: job.percent,
              currentTime: job.currentTime,
              duration: job.duration,
              speed: job.speed,
              fps: job.fps
            })}\n\n`);
          });
        };

        // Return Job ID immediately
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ jobId }));

        // Run compression in background
        let processPromise;
        if (mode === 'targetSize') {
          processPromise = compressByTargetSize({
            inputPath,
            outputPath,
            targetSizeMB: parseFloat(targetSizeMB),
            duration: metadata.duration,
            onProgress
          });
        } else {
          processPromise = compressByQuality({
            inputPath,
            outputPath,
            qualityPreset,
            resolution,
            fpsPreset,
            audioOption,
            duration: metadata.duration,
            onProgress
          });
        }

        processPromise
          .then((outPath) => {
            const stats = fs.statSync(outPath);
            const compressedSize = stats.size;
            const reductionPercent = (((metadata.size - compressedSize) / metadata.size) * 100).toFixed(1);

            jobState.status = 'completed';
            jobState.percent = 100;
            jobState.compressedSize = compressedSize;
            jobState.compressedSizeFormatted = (compressedSize / (1024 * 1024)).toFixed(2) + ' MB';
            jobState.reductionPercent = Math.max(0, parseFloat(reductionPercent));

            jobState.listeners.forEach(client => {
              client.write(`data: ${JSON.stringify({
                status: 'completed',
                percent: 100,
                outputUrl: jobState.outputUrl,
                outputFilename: jobState.outputFilename,
                compressedSize: jobState.compressedSize,
                compressedSizeFormatted: jobState.compressedSizeFormatted,
                reductionPercent: jobState.reductionPercent
              })}\n\n`);
              client.end();
            });
          })
          .catch(err => {
            console.error(`Job ${jobId} error:`, err);
            jobState.status = 'error';
            jobState.error = err.message;
            jobState.listeners.forEach(client => {
              client.write(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`);
              client.end();
            });
          });

      } catch (err) {
        console.error('Compress endpoint error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. SSE Progress Stream
  if (pathname.startsWith('/api/compress/progress/')) {
    const jobId = pathname.replace('/api/compress/progress/', '');
    const job = activeJobs.get(jobId);

    if (!job) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'پردازش پیدا نشد' }));
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    job.listeners.push(res);

    res.write(`data: ${JSON.stringify({
      status: job.status,
      percent: job.percent,
      currentTime: job.currentTime,
      duration: job.duration,
      speed: job.speed,
      fps: job.fps,
      ...(job.status === 'completed' ? {
        outputUrl: job.outputUrl,
        outputFilename: job.outputFilename,
        compressedSize: job.compressedSize,
        compressedSizeFormatted: job.compressedSizeFormatted,
        reductionPercent: job.reductionPercent
      } : {})
    })}\n\n`);

    req.on('close', () => {
      job.listeners = job.listeners.filter(l => l !== res);
    });
    return;
  }

  // 4. Download file
  if (pathname.startsWith('/api/download/')) {
    const filename = pathname.replace('/api/download/', '');
    const filePath = path.join(outputDir, filename);

    if (fs.existsSync(filePath)) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="compressed_${filename}"`
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'فایل پیدا نشد' }));
    }
  }

  // 5. Static Files Serving (/uploads, /outputs, /public or index.html)
  let staticPath = '';
  if (pathname.startsWith('/uploads/')) {
    staticPath = path.join(uploadDir, pathname.replace('/uploads/', ''));
  } else if (pathname.startsWith('/outputs/')) {
    staticPath = path.join(outputDir, pathname.replace('/outputs/', ''));
  } else {
    staticPath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
  }

  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const ext = path.extname(staticPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    return fs.createReadStream(staticPath).pipe(res);
  }

  // Fallback to index.html for SPA
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Video Compressor Server listening on http://0.0.0.0:${PORT}`);
});
