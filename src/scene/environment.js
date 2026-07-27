import * as THREE from 'three';
import { createScrapTexture } from './textures.js';

function tornDiscShape(radius, seed) {
  const shape = new THREE.Shape();
  const segments = 46;
  for (let index = 0; index <= segments; index++) {
    const angle = (index / segments) * Math.PI * 2;
    const edge = radius * (
      1
      + 0.034 * Math.sin(angle * 3 + seed)
      + 0.021 * Math.sin(angle * 7 + seed * 2.1)
      + 0.012 * Math.sin(angle * 12 + seed * 3.7)
    );
    const x = Math.cos(angle) * edge;
    const y = Math.sin(angle) * edge;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

function fogBankShape(width, height, seed) {
  const shape = new THREE.Shape();
  const half = width / 2;
  const segments = 26;
  shape.moveTo(-half, -0.4);
  for (let index = 0; index <= segments; index++) {
    const x = -half + (width * index) / segments;
    const noise = (
      0.55 * Math.sin(index * 0.9 + seed)
      + 0.32 * Math.sin(index * 2.3 + seed * 1.7)
      + 0.13 * Math.sin(index * 5.1 + seed * 2.9)
    );
    shape.lineTo(x, height * (0.62 + 0.38 * (noise * 0.5 + 0.5)));
  }
  shape.lineTo(half, -0.4);
  shape.closePath();
  return shape;
}

function createMoon(farGroup) {
  const moonGroup = new THREE.Group();
  const moon = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tornDiscShape(2.85, 1.7), {
      depth: 0.14,
      bevelEnabled: false,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xe9e2cf,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.24,
      flatShading: true,
    })
  );
  const halo = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tornDiscShape(3.5, 4.2), {
      depth: 0.1,
      bevelEnabled: false,
    }),
    new THREE.MeshBasicMaterial({
      color: 0xd9d8cf,
      transparent: true,
      opacity: 0.07,
    })
  );
  halo.position.z = -0.35;
  halo.rotation.z = 0.5;
  moonGroup.add(halo, moon);
  moonGroup.position.set(2.7, 1.35, -2.6);
  farGroup.add(moonGroup);
  return moonGroup;
}

function createFogBanks(farGroup) {
  const definitions = [
    { w: 32, h: 2.6, y: -4.05, z: -7, color: 0x171d2b, seed: 2.2, drift: 0.5 },
    { w: 32, h: 2.3, y: -3.8, z: -4, color: 0x10151f, seed: 5.8, drift: 0.34 },
    { w: 32, h: 2, y: -3.55, z: -2, color: 0x0a0d14, seed: 9.1, drift: 0.22 },
  ];
  return definitions.map((definition) => {
    const mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(
        fogBankShape(definition.w, definition.h, definition.seed),
        { depth: 0.4, bevelEnabled: false }
      ),
      new THREE.MeshStandardMaterial({
        color: definition.color,
        roughness: 1,
        metalness: 0,
        flatShading: true,
      })
    );
    mesh.position.set(0, definition.y, definition.z);
    mesh.userData = {
      baseX: 0,
      drift: definition.drift,
      phase: definition.seed,
    };
    farGroup.add(mesh);
    return mesh;
  });
}

function createDust(farGroup) {
  const count = 130;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index++) {
    positions[index * 3] = (Math.random() - 0.5) * 15;
    positions[index * 3 + 1] = (Math.random() - 0.5) * 8.4;
    positions[index * 3 + 2] = -3 + Math.random() * 5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xb9c2d6,
      size: 0.035,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  farGroup.add(points);
  return { geometry, count, points };
}

function createScraps(nearGroup) {
  const textSets = [
    ['AES-128-CBC', 'key 9F4A E307 55D1'],
    ['SHA-256', 'e3b0 c442 98fc 1c14'],
    ['PLAIN \u25b8', '64 65 63 72 79 70'],
    ['HMAC-SHA1', 'd0 e1 f2 03 8a 9b'],
    ['PBKDF2', 'iter 4096 \u00b7 ok'],
    ['IV', '0000 0000 0000 0000'],
  ];
  const textures = textSets.map(createScrapTexture);
  const geometry = new THREE.PlaneGeometry(0.42, 0.28);
  const scraps = [];

  for (let index = 0; index < 26; index++) {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: textures[index % textures.length],
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    let x = (Math.random() - 0.5) * 11.5;
    const y = (Math.random() - 0.5) * 7.4;
    if (x < -2.6 && Math.random() < 0.55) x += 4.5;
    if (y > 1.25 && x > -1.7 && x < 2.3) x += x < 0 ? -2.5 : 2.5;
    mesh.position.set(x, y, -1.2 + Math.random() * 2.8);
    mesh.rotation.set(Math.random() * 0.6, Math.random() * 0.6, Math.random() * Math.PI);
    mesh.userData = {
      baseX: x,
      y,
      baseOpacity: mesh.material.opacity,
      vy: 0.1 + Math.random() * 0.17,
      phase: Math.random() * Math.PI * 2,
      rz: (Math.random() - 0.5) * 0.35,
      gatherX: (Math.random() - 0.5) * 0.7,
      gatherY: (Math.random() - 0.5) * 0.35,
    };
    scraps.push(mesh);
    nearGroup.add(mesh);
  }
  return scraps;
}

export function createHeroEnvironment({ farGroup, nearGroup }) {
  const moonGroup = createMoon(farGroup);
  const banks = createFogBanks(farGroup);
  const dust = createDust(farGroup);
  const scraps = createScraps(nearGroup);
  return {
    moonGroup,
    banks,
    dustGeometry: dust.geometry,
    dustCount: dust.count,
    dustPoints: dust.points,
    scraps,
  };
}
