import * as THREE from 'three';

export const BLOCK_TYPES = [
  { id: 0, name: 'Grass', color: 0x5d9b4a },
  { id: 1, name: 'Dirt', color: 0x7a5a3a },
  { id: 2, name: 'Stone', color: 0x7f7f7f },
];

let SELECTED_BLOCK = 0;
export function setSelectedBlock(id) { SELECTED_BLOCK = id; }
export { SELECTED_BLOCK };

// world bounds
const SIZE = 30;          // half-extent in x/z
const MAX_INSTANCES = 60000;

// one InstancedMesh per block type
const meshes = [];
const matrices = [];
const instanceCounts = [];
const dummy = new THREE.Object3D();

const blockData = new Map(); // key "x,y,z" -> typeId

function simpleNoise(x, z) {
  return Math.sin(x * 0.5) * Math.cos(z * 0.5) * 1.5
       + Math.sin(x * 1.7 + z * 1.3) * 1.0
       + Math.sin(x * 0.3) * 0.5;
}

export function initWorld({ scene }) {
  for (let i = 0; i < BLOCK_TYPES.length; i++) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: BLOCK_TYPES[i].color });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX_INSTANCES);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;
    mesh.visible = true;
    meshes.push(mesh);
    matrices.push(new Float32Array(MAX_INSTANCES * 16));
    instanceCounts.push(0);
    scene.add(mesh);
  }

  generateTerrain();
  rebuildAll();

  return { meshes, getHeight, getBlock, setBlock, removeBlock, rebuildAll };
}

// Terrain: heightmap based, stone->dirt->grass layers
function generateTerrain() {
  for (let x = -SIZE; x <= SIZE; x++) {
    for (let z = -SIZE; z <= SIZE; z++) {
      const h = Math.floor(2 + simpleNoise(x, z));
      for (let y = 0; y <= h; y++) {
        let type = 2; // stone
        if (y === h) type = 0; // grass
        else if (y === h - 1 || y === h - 2) type = 1; // dirt
        blockData.set(`${x},${y},${z}`, type);
      }
    }
  }
}

export function getHeight(x, z) {
  let best = 0;
  for (let y = 0; y <= 16; y++) {
    if (blockData.has(`${x},${y},${z}`)) best = y;
  }
  return best;
}

export function getBlock(x, y, z) {
  return blockData.get(`${x},${y},${z}`);
}

export function setBlock(x, y, z, typeId) {
  if (typeId < 0 || typeId >= BLOCK_TYPES.length) return;
  blockData.set(`${x},${y},${z}`, typeId);
  rebuildAll();
}

export function removeBlock(x, y, z) {
  blockData.delete(`${x},${y},${z}`);
  rebuildAll();
}

function rebuildAll() {
  const counts = [0, 0, 0];
  const offsets = [0, 0, 0]; // per-type offset into matrices

  // First pass: collect blocks per type
  const perType = [[], [], []];
  blockData.forEach((type, key) => {
    const [x, y, z] = key.split(',').map(Number);
    perType[type].push({ x, y, z });
  });

  for (let t = 0; t < BLOCK_TYPES.length; t++) {
    const blocks = perType[t];
    const mat = matrices[t];
    let n = 0;
    for (const b of blocks) {
      dummy.position.set(b.x, b.y, b.z);
      dummy.updateMatrix();
      dummy.matrix.toArray(mat, n * 16);
      n++;
    }
    const mesh = meshes[t];
    mesh.count = n;
    if (n > 0) {
      mesh.instanceMatrix.needsUpdate = true;
      // copy only the used range
      const arr = new Float32Array(mat.buffer, 0, n * 16);
      mesh.instanceMatrix = new THREE.InstancedBufferAttribute(arr, 16);
    } else {
      mesh.count = 0;
    }
    instanceCounts[t] = n;
  }
}