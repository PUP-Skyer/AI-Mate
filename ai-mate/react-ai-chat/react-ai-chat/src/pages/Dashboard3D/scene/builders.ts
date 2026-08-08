/**
 * 3D 场景构建函数集 — 杭州地图风格
 * 模块化构建：背景 / 街道地面 / 西湖 / 钱塘江 / 网格化米色建筑群 / 路灯 / 光照
 *
 * 城市布局：7列×4行街区，中心为西湖（跳过1个街区）
 * 每街区3×2子建筑 = 27街区×6 = 162栋米色建筑
 * 南侧钱塘江横贯全城
 */
import * as THREE from 'three';
import type { DashboardTheme } from '../dashboard-theme';
import type { SceneContext, BuildingInfo } from './types';

// ─── 网格布局常量 ─────────────────────────────────────────
const BLOCK_SIZE = 9;
const STREET_WIDTH = 3;
const GRID_PERIOD = BLOCK_SIZE + STREET_WIDTH; // 12
const COLS = 7;             // 7列街区（杭州东西向更宽）
const ROWS = 4;             // 4行街区
const SUB_COLS = 3;
const SUB_ROWS = 2;
const SUB_SPACING = 3;
const BUILDING_FOOTPRINT = 2.5;

// 西湖参数
const LAKE_RADIUS = 9;
const LAKE_CENTER_X = 0;
const LAKE_CENTER_Z = 0;

// 钱塘江参数
const RIVER_Z = 27;         // 江面 Z 坐标
const RIVER_WIDTH = 6;      // 江面宽度

// 建筑高度级别
const HEIGHT_LEVELS = [3.0, 4.5, 6.0, 8.0, 10.5, 13.0, 15.5, 18.0];

// ─── 确定性随机数生成器 ─────────────────────────────────
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ─── 渐变背景纹理 ───────────────────────────────────────
function createGradientBackground(colors: readonly string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── 街道地面 + 网格线 ───────────────────────────────────
function buildGround(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
): void {
  const groundGeo = new THREE.PlaneGeometry(110, 75);
  const groundMat = new THREE.MeshStandardMaterial({
    color: t.streetColor,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  disposers.push(() => { groundGeo.dispose(); groundMat.dispose(); });

  // 网格辅助线
  const grid = new THREE.GridHelper(110, 44, t.gridColor, t.gridColor);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.1;
  grid.position.y = 0.01;
  scene.add(grid);
  disposers.push(() => grid.dispose());

  // 暖色稀疏标线
  const gridAccent = new THREE.GridHelper(110, 16, t.gridColorAccent, t.gridColorAccent);
  (gridAccent.material as THREE.Material).transparent = true;
  (gridAccent.material as THREE.Material).opacity = 0.06;
  gridAccent.position.y = 0.02;
  scene.add(gridAccent);
  disposers.push(() => gridAccent.dispose());
}

// ─── 西湖 ───────────────────────────────────────────────
function buildLake(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
): void {
  // 湖面主体（略带不规则形状）
  const lakeGeo = new THREE.CircleGeometry(LAKE_RADIUS, 48);
  // 轻微扰动顶点使湖岸更自然
  const posAttr = lakeGeo.attributes.position;
  const rng = createRng(99);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    if (dist > 0.1) {
      const noise = (rng() - 0.5) * 0.6;
      const scale = 1 + noise / dist;
      posAttr.setX(i, x * scale);
      posAttr.setY(i, y * scale);
    }
  }
  lakeGeo.computeVertexNormals();

  const lakeMat = new THREE.MeshStandardMaterial({
    color: t.lakeColor,
    roughness: 0.08,
    metalness: 0.85,
    emissive: t.lakeEmissive,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.88,
  });
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(LAKE_CENTER_X, 0.04, LAKE_CENTER_Z);
  scene.add(lake);
  disposers.push(() => { lakeGeo.dispose(); lakeMat.dispose(); });

  // 湖边步道（环形浅色带）
  const trailGeo = new THREE.RingGeometry(LAKE_RADIUS + 0.3, LAKE_RADIUS + 1.0, 48);
  const trailMat = new THREE.MeshStandardMaterial({
    color: t.blockPlatformColor,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.6,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.rotation.x = -Math.PI / 2;
  trail.position.set(LAKE_CENTER_X, 0.03, LAKE_CENTER_Z);
  scene.add(trail);
  disposers.push(() => { trailGeo.dispose(); trailMat.dispose(); });
}

// ─── 钱塘江 ─────────────────────────────────────────────
function buildRiver(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
): void {
  const riverGeo = new THREE.PlaneGeometry(110, RIVER_WIDTH);
  const riverMat = new THREE.MeshStandardMaterial({
    color: t.riverColor,
    roughness: 0.1,
    metalness: 0.75,
    emissive: t.lakeEmissive,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.82,
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.04, RIVER_Z);
  scene.add(river);
  disposers.push(() => { riverGeo.dispose(); riverMat.dispose(); });

  // 江堤（两侧浅色边）
  const bankGeo = new THREE.PlaneGeometry(110, 0.8);
  const bankMat = new THREE.MeshStandardMaterial({
    color: t.blockPlatformColor,
    roughness: 0.9,
    metalness: 0.0,
  });
  const bankN = new THREE.Mesh(bankGeo, bankMat);
  bankN.rotation.x = -Math.PI / 2;
  bankN.position.set(0, 0.03, RIVER_Z - RIVER_WIDTH / 2 - 0.4);
  scene.add(bankN);

  const bankS = new THREE.Mesh(bankGeo, bankMat);
  bankS.rotation.x = -Math.PI / 2;
  bankS.position.set(0, 0.03, RIVER_Z + RIVER_WIDTH / 2 + 0.4);
  scene.add(bankS);

  disposers.push(() => { bankGeo.dispose(); bankMat.dispose(); });
}

// ─── 街区底座平台 ───────────────────────────────────────
function buildBlockPlatforms(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
): { colCenters: number[]; rowCenters: number[] } {
  const colCenters: number[] = [];
  const rowCenters: number[] = [];
  for (let c = 0; c < COLS; c++) {
    colCenters.push((c - (COLS - 1) / 2) * GRID_PERIOD);
  }
  for (let r = 0; r < ROWS; r++) {
    rowCenters.push((r - (ROWS - 1) / 2) * GRID_PERIOD);
  }

  const platGeo = new THREE.BoxGeometry(BLOCK_SIZE, 0.15, BLOCK_SIZE);
  const platMat = new THREE.MeshStandardMaterial({
    color: t.blockPlatformColor,
    roughness: 0.9,
    metalness: 0.0,
  });

  colCenters.forEach((cx, ci) => {
    rowCenters.forEach((cz, ri) => {
      // 跳过西湖所在街区（7×4 网格中心）
      if (ci === 3 && ri === 1) return;

      const platform = new THREE.Mesh(platGeo, platMat);
      platform.position.set(cx, 0.075, cz);
      platform.receiveShadow = true;
      scene.add(platform);
    });
  });

  disposers.push(() => { platGeo.dispose(); platMat.dispose(); });
  return { colCenters, rowCenters };
}

// ─── 网格化米色建筑群（162栋） ─────────────────────────────
function buildCity(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
  colCenters: number[],
  rowCenters: number[],
): BuildingInfo[] {
  const buildings: BuildingInfo[] = [];
  const rng = createRng(42);

  const maxDist = Math.sqrt(
    Math.pow((COLS - 1) / 2 * GRID_PERIOD, 2) +
    Math.pow((ROWS - 1) / 2 * GRID_PERIOD, 2),
  );

  let buildingIndex = 0;

  colCenters.forEach((cx, ci) => {
    rowCenters.forEach((cz, ri) => {
      // 跳过西湖街区
      if (ci === 3 && ri === 1) return;

      for (let sc = 0; sc < SUB_COLS; sc++) {
        for (let sr = 0; sr < SUB_ROWS; sr++) {
          const x = cx + (sc - (SUB_COLS - 1) / 2) * SUB_SPACING;
          const z = cz + (sr - (SUB_ROWS - 1) / 2) * SUB_SPACING;

          // 跳过距离西湖太近的建筑
          const distFromLake = Math.sqrt(
            (x - LAKE_CENTER_X) ** 2 + (z - LAKE_CENTER_Z) ** 2,
          );
          if (distFromLake < LAKE_RADIUS + 1.5) continue;

          // 高度：距城市中心越近越高
          const dist = Math.sqrt(x * x + z * z);
          const normalized = Math.min(1, dist / maxDist);
          const level = Math.max(0, Math.min(7, Math.floor((1 - normalized) * 8)));
          const height = HEIGHT_LEVELS[level] + rng() * 0.5;

          // 建筑颜色
          const colorIdx = Math.floor(rng() * t.buildingColors.length);
          const color = t.buildingColors[colorIdx] ?? t.buildingColors[0];

          // 建筑主体
          const geo = new THREE.BoxGeometry(BUILDING_FOOTPRINT, height, BUILDING_FOOTPRINT);
          const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.75,
            metalness: 0.05,
            emissive: t.buildingEmissive,
            emissiveIntensity: t.buildingEmissiveIntensity,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, 0.15 + height / 2, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
          disposers.push(() => { geo.dispose(); mat.dispose(); });

          // 窗框发光边线
          const edgesGeo = new THREE.EdgesGeometry(geo);
          const edgesMat = new THREE.LineBasicMaterial({
            color: t.buildingWindowColor,
            transparent: true,
            opacity: 0.22,
          });
          const edges = new THREE.LineSegments(edgesGeo, edgesMat);
          edges.position.copy(mesh.position);
          scene.add(edges);
          disposers.push(() => { edgesGeo.dispose(); edgesMat.dispose(); });

          // 顶部发光帽（高层建筑）
          if (height > 10) {
            const capGeo = new THREE.BoxGeometry(
              BUILDING_FOOTPRINT * 0.6,
              0.25,
              BUILDING_FOOTPRINT * 0.6,
            );
            const capMat = new THREE.MeshBasicMaterial({
              color: t.buildingWindowColor,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            });
            const cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(x, 0.15 + height + 0.125, z);
            scene.add(cap);
            disposers.push(() => { capGeo.dispose(); capMat.dispose(); });
          }

          buildings.push({
            mesh,
            baseEmissiveIntensity: t.buildingEmissiveIntensity,
            phase: buildingIndex * 0.3,
          });
          buildingIndex++;
        }
      }
    });
  });

  return buildings;
}

// ─── 路灯 ───────────────────────────────────────────────
function buildStreetLamps(
  scene: THREE.Scene,
  t: DashboardTheme,
  disposers: (() => void)[],
  colCenters: number[],
  rowCenters: number[],
): void {
  const lampPositions: [number, number][] = [];

  // 水平街道路灯（行间）
  for (let r = 0; r < rowCenters.length - 1; r++) {
    const streetZ = (rowCenters[r] + rowCenters[r + 1]) / 2;
    colCenters.forEach((cx) => {
      lampPositions.push([cx, streetZ]);
    });
  }

  // 垂直街道路灯（列间）
  for (let c = 0; c < colCenters.length - 1; c++) {
    const streetX = (colCenters[c] + colCenters[c + 1]) / 2;
    rowCenters.forEach((rz) => {
      lampPositions.push([streetX, rz]);
    });
  }

  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 3.5, 6);
  const poleMat = new THREE.MeshStandardMaterial({
    color: t.gridColorAccent,
    roughness: 0.4,
    metalness: 0.6,
  });

  const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: t.buildingWindowColor,
    transparent: true,
    opacity: 0.75,
  });

  lampPositions.forEach(([x, z]) => {
    // 跳过西湖区域的路灯
    const distFromLake = Math.sqrt(
      (x - LAKE_CENTER_X) ** 2 + (z - LAKE_CENTER_Z) ** 2,
    );
    if (distFromLake < LAKE_RADIUS + 2) return;

    // 跳过钱塘江区域的路灯
    if (Math.abs(z - RIVER_Z) < RIVER_WIDTH / 2 + 1) return;

    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 1.75, z);
    pole.castShadow = true;
    scene.add(pole);

    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(x, 3.6, z);
    scene.add(bulb);
  });

  disposers.push(() => { poleGeo.dispose(); poleMat.dispose(); });
  disposers.push(() => { bulbGeo.dispose(); bulbMat.dispose(); });
}

// ─── 光照系统 ───────────────────────────────────────────
function buildLighting(scene: THREE.Scene, t: DashboardTheme): void {
  const ambient = new THREE.AmbientLight(t.ambientColor, t.ambientIntensity);
  scene.add(ambient);

  const mainLight = new THREE.DirectionalLight(t.mainLightColor, t.mainLightIntensity);
  mainLight.position.set(30, 50, 25);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 150;
  mainLight.shadow.camera.left = -55;
  mainLight.shadow.camera.right = 55;
  mainLight.shadow.camera.top = 35;
  mainLight.shadow.camera.bottom = -35;
  mainLight.shadow.bias = -0.0005;
  mainLight.shadow.radius = 4;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(t.fillLightColor, t.fillLightIntensity);
  fillLight.position.set(-25, 35, -20);
  scene.add(fillLight);

  const hemi = new THREE.HemisphereLight(t.hemiSkyColor, t.hemiGroundColor, t.hemiIntensity);
  scene.add(hemi);
}

// ─── 主构建函数 ─────────────────────────────────────────
export function buildScene(
  scene: THREE.Scene,
  t: DashboardTheme,
): SceneContext {
  const disposers: (() => void)[] = [];

  const bgTex = createGradientBackground(t.bgGradient);
  scene.background = bgTex;
  disposers.push(() => bgTex.dispose());

  scene.fog = new THREE.Fog(t.fogColor, t.fogNear, t.fogFar);

  buildGround(scene, t, disposers);
  buildRiver(scene, t, disposers);    // 钱塘江（先于建筑，在地面之上）
  buildLake(scene, t, disposers);     // 西湖

  const { colCenters, rowCenters } = buildBlockPlatforms(scene, t, disposers);
  const buildings = buildCity(scene, t, disposers, colCenters, rowCenters);
  buildStreetLamps(scene, t, disposers, colCenters, rowCenters);
  buildLighting(scene, t);

  return { buildings, disposers };
}
