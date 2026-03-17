import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DEFAULT_PRESETS = [
  {
    name: "default-pill",
    width: 196,
    height: 56,
    radius: 22,
    rim: 16,
  },
  {
    name: "hero-pill",
    width: 430,
    height: 128,
    radius: 38,
    rim: 28,
  },
  {
    name: "motion-pill",
    width: 320,
    height: 120,
    radius: 38,
    rim: 28,
  },
  {
    name: "circle-button",
    width: 124,
    height: 124,
    radius: 62,
    rim: 24,
  },
  {
    name: "rounded-square-button",
    width: 132,
    height: 132,
    radius: 34,
    rim: 24,
  },
];

const outputRoot = path.resolve("assets");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function gaussian(value, sigma) {
  return Math.exp(-(value * value) / (2 * sigma * sigma));
}

function roundedRectSdf(x, y, halfWidth, halfHeight, radius) {
  const qx = Math.abs(x) - (halfWidth - radius);
  const qy = Math.abs(y) - (halfHeight - radius);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
}

function makeSdf(width, height, radius) {
  const halfWidth = (width - 1) / 2;
  const halfHeight = (height - 1) / 2;

  return (x, y) =>
    roundedRectSdf(
      x - halfWidth,
      y - halfHeight,
      halfWidth,
      halfHeight,
      radius,
    );
}

function gradient(sdf, x, y) {
  const epsilon = 0.5;
  const dx = sdf(x + epsilon, y) - sdf(x - epsilon, y);
  const dy = sdf(x, y + epsilon) - sdf(x, y - epsilon);
  const length = Math.hypot(dx, dy);

  if (length < 1e-4) {
    return [0, 0];
  }

  return [dx / length, dy / length];
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function writePng(filename, width, height, pixels) {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);

  for (let row = 0; row < height; row += 1) {
    const rowStart = row * (stride + 1);
    scanlines[rowStart] = 0;
    pixels.copy(
      scanlines,
      rowStart + 1,
      row * stride,
      row * stride + stride,
    );
  }

  const idat = zlib.deflateSync(scanlines, { level: 9 });
  const png = Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filename, png);
}

function generateDisplacementMap(preset, outputDir) {
  const sdf = makeSdf(preset.width, preset.height, preset.radius);
  const pixels = Buffer.alloc(preset.width * preset.height * 4);

  for (let y = 0; y < preset.height; y += 1) {
    for (let x = 0; x < preset.width; x += 1) {
      const offset = (y * preset.width + x) * 4;
      const d = sdf(x + 0.5, y + 0.5);
      const [nx, ny] = gradient(sdf, x + 0.5, y + 0.5);
      const edge =
        d <= 0
          ? clamp(1 + d / preset.rim, 0, 1)
          : clamp(1 - d / 2.2, 0, 1) * 0.15;
      const eased = Math.pow(edge, 0.82);
      const amplitude = 114 * eased;

      pixels[offset] = Math.round(clamp(128 + nx * amplitude, 0, 255));
      pixels[offset + 1] = Math.round(clamp(128 - ny * amplitude, 0, 255));
      pixels[offset + 2] = 0;
      pixels[offset + 3] = 255;
    }
  }

  writePng(
    path.join(outputDir, "displacement-map.png"),
    preset.width,
    preset.height,
    pixels,
  );
}

function generateSpecularMap(preset, outputDir) {
  const sdf = makeSdf(preset.width, preset.height, preset.radius);
  const pixels = Buffer.alloc(preset.width * preset.height * 4);
  const halfWidth = (preset.width - 1) / 2;
  const halfHeight = (preset.height - 1) / 2;
  const xEdgeInset = Math.max(18, Math.round(preset.width * 0.112));
  const yTopInset = Math.max(6, Math.round(preset.height * 0.115));
  const topLineSigma = Math.max(2.2, preset.height * 0.04);
  const topArcSigma = Math.max(3.8, preset.height * 0.068);
  const xGlowSigma = Math.max(60, preset.width * 0.306);
  const glintXSigma = Math.max(8.5, preset.width * 0.043);
  const glintYSigma = Math.max(4.8, preset.height * 0.086);
  const edgeFadeDepth = Math.max(6.5, preset.radius * 0.3);

  for (let y = 0; y < preset.height; y += 1) {
    for (let x = 0; x < preset.width; x += 1) {
      const offset = (y * preset.width + x) * 4;
      const d = sdf(x + 0.5, y + 0.5);
      const px = x - halfWidth;
      const py = y - halfHeight;

      const rim = gaussian(d, 0.95) * 0.88;
      const topLine =
        d <= 0 ? gaussian(py + halfHeight - yTopInset, topLineSigma) * 0.26 : 0;
      const topArc =
        d <= 0
          ? gaussian(py + halfHeight - (yTopInset + 1), topArcSigma) *
            gaussian(px, xGlowSigma) *
            0.24
          : 0;
      const upperSheen =
        d <= 0
          ? smoothstep(
              0.38,
              0,
              clamp((py + halfHeight - 3) / Math.max(11, preset.height * 0.2), 0, 1),
            ) * 0.1
          : 0;
      const leftGlint =
        d <= 0
          ? gaussian(px + halfWidth - xEdgeInset, glintXSigma) *
            gaussian(py + halfHeight - (yTopInset + 1), glintYSigma) *
            0.18
          : 0;
      const rightGlint =
        d <= 0
          ? gaussian(px - halfWidth + xEdgeInset, glintXSigma) *
            gaussian(py + halfHeight - (yTopInset + 1), glintYSigma * 1.08) *
            0.14
          : 0;
      const edgeFade = d <= 0 ? clamp(1 + d / edgeFadeDepth, 0, 1) : 0;

      const intensity = clamp(
        rim * (0.72 + upperSheen * 0.9) +
          topLine +
          topArc +
          upperSheen +
          leftGlint +
          rightGlint,
        0,
        1,
      );
      const alpha = clamp(
        rim * 0.95 +
          topLine * 0.72 +
          topArc * 0.76 +
          upperSheen * edgeFade +
          leftGlint +
          rightGlint,
        0,
        1,
      );
      const channel = Math.round(255 * intensity);

      pixels[offset] = channel;
      pixels[offset + 1] = channel;
      pixels[offset + 2] = channel;
      pixels[offset + 3] = Math.round(255 * alpha);
    }
  }

  writePng(
    path.join(outputDir, "specular-map.png"),
    preset.width,
    preset.height,
    pixels,
  );
}

function writePresetMetadata(preset, outputDir) {
  fs.writeFileSync(
    path.join(outputDir, "preset.json"),
    `${JSON.stringify(preset, null, 2)}\n`,
  );
}

function generatePreset(preset) {
  const outputDir = path.join(outputRoot, preset.name);
  fs.mkdirSync(outputDir, { recursive: true });
  generateDisplacementMap(preset, outputDir);
  generateSpecularMap(preset, outputDir);
  writePresetMetadata(preset, outputDir);
}

function readFlagValue(flag) {
  const index = process.argv.findIndex((arg) => arg === flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : null;
}

function readNumberFlag(flag) {
  const value = readFlagValue(flag);
  if (value === null) {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`Flag "${flag}" must be a positive number.`);
  }

  return numericValue;
}

function parseCustomPreset() {
  const name = readFlagValue("--name");
  if (!name) {
    return null;
  }

  const width = readNumberFlag("--width");
  const height = readNumberFlag("--height");
  const radius = readNumberFlag("--radius");
  const rim = readNumberFlag("--rim");

  if (width === null || height === null || radius === null || rim === null) {
    throw new Error(
      'Custom preset generation requires "--name", "--width", "--height", "--radius", and "--rim".',
    );
  }

  const maxRadius = Math.min(width, height) / 2;
  if (radius > maxRadius) {
    throw new Error(
      `Flag "--radius" (${radius}) must be <= min(width, height) / 2 (${maxRadius}).`,
    );
  }

  return {
    name,
    width,
    height,
    radius,
    rim,
  };
}

function parsePresetSelection() {
  const selectedName = readFlagValue("--preset");
  const customPreset = parseCustomPreset();

  if (selectedName && customPreset) {
    throw new Error('Use either "--preset <name>" or the custom preset flags, not both.');
  }

  if (customPreset) {
    return [customPreset];
  }

  if (selectedName) {
    const preset = DEFAULT_PRESETS.find((item) => item.name === selectedName);
    if (!preset) {
      throw new Error(
        `Unknown preset "${selectedName}". Available presets: ${DEFAULT_PRESETS.map((item) => item.name).join(", ")}`,
      );
    }
    return [preset];
  }

  return DEFAULT_PRESETS;
}

const selectedPresets = parsePresetSelection();
fs.mkdirSync(outputRoot, { recursive: true });

selectedPresets.forEach(generatePreset);

process.stdout.write(
  `Generated reflect glass assets for: ${selectedPresets.map((preset) => preset.name).join(", ")}\n`,
);
