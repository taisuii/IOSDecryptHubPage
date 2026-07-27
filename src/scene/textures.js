import * as THREE from 'three';

export function createScrapTexture(lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const jitter = () => (Math.random() - 0.5) * 12;

  ctx.beginPath();
  ctx.moveTo(8 + jitter(), 8 + jitter());
  ctx.lineTo(96 + jitter(), 6 + jitter());
  ctx.lineTo(184 + jitter(), 9 + jitter());
  ctx.lineTo(186 + jitter(), 64 + jitter());
  ctx.lineTo(183 + jitter(), 119 + jitter());
  ctx.lineTo(92 + jitter(), 122 + jitter());
  ctx.lineTo(7 + jitter(), 118 + jitter());
  ctx.lineTo(5 + jitter(), 62 + jitter());
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = '#e8e2d1';
  ctx.fillRect(0, 0, 192, 128);
  ctx.fillStyle = 'rgba(122, 108, 82, 0.10)';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 192, Math.random() * 128, 6 + Math.random() * 16, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#5d5647';
  ctx.font = '600 17px "JetBrains Mono", "SFMono-Regular", Consolas, monospace';
  lines.forEach((line, index) => ctx.fillText(line, 18, 48 + index * 32));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createRingGlowTexture(inner, middle) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.3, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.46, inner);
  gradient.addColorStop(0.64, middle);
  gradient.addColorStop(0.82, 'rgba(150,8,2,0.22)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDotGlowTexture(inner, middle) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.45, middle);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRavenHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(180, 195, 230, 0.22)');
  gradient.addColorStop(0.5, 'rgba(140, 160, 210, 0.08)');
  gradient.addColorStop(1, 'rgba(100, 120, 180, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
