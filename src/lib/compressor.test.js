import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArgs } from './compressor.js';

const qualityOptions = {
  mode: 'targetQuality',
  qualityPreset: 'medium',
  resolution: 'original',
  fpsPreset: 'original',
  audioOption: '128k',
};

test('uses the returned MP4 output filename and preserves original resolution by default', () => {
  const args = buildArgs(qualityOptions);

  assert.equal(args.at(-1), 'output_compressed.mp4');
  assert.equal(args.includes('-vf'), false);
});

test('limits requested resolution to the source height without upscaling', () => {
  const args = buildArgs({ ...qualityOptions, resolution: '1080' });

  assert.deepEqual(args.slice(args.indexOf('-vf'), args.indexOf('-vf') + 2), [
    '-vf',
    'scale=-2:min(1080\\,ih)',
  ]);
});

test('limits target-size downscaling to the source height', () => {
  const args = buildArgs({
    mode: 'targetSize',
    targetSizeMB: 1,
    duration: 60,
  });

  assert.deepEqual(args.slice(args.indexOf('-vf'), args.indexOf('-vf') + 2), [
    '-vf',
    'scale=-2:min(360\\,ih)',
  ]);
});

test('rejects invalid target sizes and durations', () => {
  assert.throws(
    () => buildArgs({ mode: 'targetSize', targetSizeMB: 0, duration: 60 }),
    { message: 'INVALID_TARGET_SIZE' }
  );
  assert.throws(
    () => buildArgs({ mode: 'targetSize', targetSizeMB: 10, duration: 0 }),
    { message: 'INVALID_DURATION' }
  );
  assert.throws(
    () => buildArgs({ mode: 'targetSize', targetSizeMB: 10, duration: Infinity }),
    { message: 'INVALID_DURATION' }
  );
});

test('rejects unknown compression modes', () => {
  assert.throws(() => buildArgs({ mode: 'unknown' }), { message: 'INVALID_MODE' });
});
