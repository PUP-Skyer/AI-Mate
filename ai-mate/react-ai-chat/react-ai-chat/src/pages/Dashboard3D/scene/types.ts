/**
 * 3D 场景上下文类型定义
 * 持有所有需要逐帧更新的动画对象引用
 */
import type * as THREE from 'three';

/** 单栋建筑的动画引用 */
export interface BuildingInfo {
  /** 建筑网格体（用于 emissive 微脉动） */
  mesh: THREE.Mesh;
  /** 基准发光强度 */
  baseEmissiveIntensity: number;
  /** 交错相位偏移 */
  phase: number;
}

/** 整个 3D 场景的动画上下文 */
export interface SceneContext {
  /** 所有建筑（emissive 微脉动） */
  buildings: BuildingInfo[];
  /** 资源释放函数数组（dispose 时统一调用） */
  disposers: (() => void)[];
}
