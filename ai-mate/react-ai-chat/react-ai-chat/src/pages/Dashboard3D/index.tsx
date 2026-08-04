/**
 * 3D 沉浸式 AI 行业资讯数据看板
 * Three.js + ECharts
 * 布局：右上角3张卡片横向 | 右侧中部3张卡片纵向 | 左下角3D场景
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
  ReportCountCard,
  AIPolicyCard,
  IndustryDataCard,
  TimelineCard,
  PenetrationChartCard,
  ToolLibraryCard,
} from './Panels';

const Dashboard3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    labelRenderer: CSS2DRenderer;
    controls: OrbitControls;
    animId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);
    scene.fog = new THREE.Fog(0xf0f2f5, 30, 90);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 18, 35);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI * 0.15;
    controls.maxPolarAngle = Math.PI * 0.45;
    controls.minDistance = 20;
    controls.maxDistance = 60;
    controls.target.set(0, 3, 0);
    controls.enablePan = false;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    mainLight.position.set(15, 30, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -30;
    mainLight.shadow.camera.right = 30;
    mainLight.shadow.camera.top = 30;
    mainLight.shadow.camera.bottom = -30;
    mainLight.shadow.bias = -0.0005;
    mainLight.shadow.radius = 4;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xd6e4ff, 0.4);
    fillLight.position.set(-15, 20, -10);
    scene.add(fillLight);

    const bottomLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.3);
    scene.add(bottomLight);

    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe8eaed,
      roughness: 0.15,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(120, 60, 0xd0d4da, 0xe0e2e6);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      roughness: 0.85,
      metalness: 0.02,
      emissive: 0xffffff,
      emissiveIntensity: 0.02,
    });

    const mainBldg = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), buildingMat);
    mainBldg.position.set(-12, 6, -15);
    mainBldg.castShadow = true;
    mainBldg.receiveShadow = true;
    scene.add(mainBldg);

    const side1 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), buildingMat);
    side1.position.set(-4, 4, -18);
    side1.castShadow = true;
    side1.receiveShadow = true;
    scene.add(side1);

    const side2 = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 4), buildingMat);
    side2.position.set(5, 5, -16);
    side2.castShadow = true;
    side2.receiveShadow = true;
    scene.add(side2);

    const far1 = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 5), buildingMat);
    far1.position.set(18, 7, -25);
    far1.castShadow = true;
    scene.add(far1);

    const far2 = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 4), buildingMat);
    far2.position.set(-22, 4.5, -22);
    far2.castShadow = true;
    scene.add(far2);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), buildingMat);
    tower.position.set(22, 10, -12);
    tower.castShadow = true;
    scene.add(tower);

    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0xe0e3e8, roughness: 0.7 })
    );
    bridge.position.set(-8, 3, -15);
    scene.add(bridge);

    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 7, 16),
      buildingMat
    );
    cylinder.position.set(14, 3.5, -8);
    cylinder.castShadow = true;
    scene.add(cylinder);

    const clock = new THREE.Clock();

    const animate = () => {
      const animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      if (sceneRef.current) sceneRef.current.animId = animId;
    };

    animate();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      labelRenderer,
      controls,
      animId: 0,
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animId);
        sceneRef.current.controls.dispose();
        sceneRef.current.renderer.dispose();
        container.removeChild(sceneRef.current.renderer.domElement);
        container.removeChild(sceneRef.current.labelRenderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #eef1f5 0%, #f5f7fa 50%, #e8eaed 100%)',
      }}
    >
      {/* 面板层 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
          padding: '8px 12px',
          boxSizing: 'border-box',
        }}
      >
        {/* 左上角：左侧3张卡片横向排列 */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            flexDirection: 'row',
            gap: 10,
            pointerEvents: 'auto',
            alignItems: 'flex-start',
          }}
        >
          <FloatCard delay={0.2}>
            <ReportCountCard />
          </FloatCard>
          <FloatCard delay={0.4}>
            <AIPolicyCard />
          </FloatCard>
          <FloatCard delay={0.6}>
            <IndustryDataCard />
          </FloatCard>
        </div>

        {/* 右侧：3张卡片纵向排列 */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            pointerEvents: 'auto',
          }}
        >
          <FloatCard delay={0.3}>
            <TimelineCard />
          </FloatCard>
          <FloatCard delay={0.5}>
            <PenetrationChartCard />
          </FloatCard>
          <FloatCard delay={0.7}>
            <ToolLibraryCard />
          </FloatCard>
        </div>
      </div>

      {/* 标题 */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 12,
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
            color: '#1a1a2e',
            letterSpacing: 1,
          }}
        >
          AI 行业资讯数据看板
        </h1>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#5a6c7d' }}>
          3D 沉浸式数字孪生
        </p>
      </div>

      {/* 操作提示 */}
      <div
        style={{
          position: 'absolute',
          bottom: 6,
          left: 12,
          zIndex: 20,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(10px)',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 10,
          color: '#5a6c7d',
          pointerEvents: 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        拖拽旋转视角 · 滚轮缩放
      </div>
    </div>
  );
};

const FloatCard: React.FC<{ children: React.ReactNode; delay: number }> = ({
  children,
  delay,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    const timer = setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        const card = e.currentTarget.firstChild as HTMLElement;
        if (card) {
          card.style.boxShadow = '0 8px 24px rgba(31, 110, 185, 0.12), 0 0 0 1px rgba(22,119,255,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        const card = e.currentTarget.firstChild as HTMLElement;
        if (card) {
          card.style.boxShadow = '0 4px 16px rgba(31, 110, 185, 0.06), inset 0 1px 0 rgba(255,255,255,0.6)';
        }
      }}
    >
      {children}
    </div>
  );
};

export default Dashboard3D;
