/**
 * 3D 场景动画更新函数集
 * 在 requestAnimationFrame 循环中逐帧调用
 */
import type { SceneContext } from './types';

// ─── 建筑 emissive 微脉动 ───────────────────────────────
function updateCityAnimation(ctx: SceneContext, elapsed: number): void {
  ctx.buildings.forEach((b) => {
    const mat = b.mesh.material as THREE.MeshStandardMaterial;
    const pulse = Math.sin(elapsed * 0.4 + b.phase) * 0.015;
    mat.emissiveIntensity = b.baseEmissiveIntensity + pulse;
  });
}

// ─── 主更新函数：调用所有子动画 ───────────────────────────
export function updateScene(ctx: SceneContext, elapsed: number): void {
  updateCityAnimation(ctx, elapsed);
}

// ─── 释放场景所有资源 ───────────────────────────────────
export function disposeScene(ctx: SceneContext): void {
  ctx.disposers.forEach((fn) => {
    try {
      fn();
    } catch {
      // 忽略释放错误
    }
  });
  ctx.disposers.length = 0;
  ctx.buildings.length = 0;
}
