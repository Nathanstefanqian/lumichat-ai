import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { 
  Box, 
  Globe, 
  Eye, 
  Maximize, 
  Scissors, 
  Monitor, 
  ChevronRight, 
  ChevronLeft,
  Info
} from 'lucide-react';

interface PipelineStep {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'model', title: 'a. 模型坐标系', desc: '在模型坐标系中定义三维物体的几何结构和属性 (材质, 纹理, 颜色)', icon: Box },
  { id: 'world', title: 'b. 世界坐标系', desc: '通过平移, 旋转, 缩放等模型变换, 将单个物体从模型坐标系转换到世界坐标系拼接成完整三维场景', icon: Globe },
  { id: 'view', title: 'c. 观察坐标系', desc: '确定观察者的位置和视线方向，通过视图变换将三维图形从世界坐标系转换到观察坐标系', icon: Eye },
  { id: 'projection', title: 'd/e. 投影与裁剪', desc: '根据需求选择投影类型 (透视/正交), 投影变换将三维图形转换到裁剪坐标系', icon: Scissors },
  { id: 'ndc', title: 'f. 标准化设备坐标 (NDC)', desc: '通过透视除法将裁剪坐标系转换到标准化设备坐标系, 有效去除视椎体之外的部分', icon: Maximize },
  { id: 'screen', title: 'g/h. 屏幕坐标与光栅化', desc: '通过视口变换将图形转换到二维屏幕坐标系，并通过光栅化离散为像素，同时进行消隐操作', icon: Monitor },
];

export const GraphicsPipelineView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef = useRef<THREE.Group | null>(null);
  const frustumRef = useRef<THREE.CameraHelper | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // 3. Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // 4. Objects Group
    const objects = new THREE.Group();
    objectsRef.current = objects;
    scene.add(objects);

    // Frustum Helper for step d/e/f
    const frustumCamera = new THREE.PerspectiveCamera(45, 1.33, 1, 5);
    const frustumHelper = new THREE.CameraHelper(frustumCamera);
    frustumHelper.visible = false;
    scene.add(frustumHelper);
    frustumRef.current = frustumHelper;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Handle Pipeline Transitions
  useEffect(() => {
    if (!objectsRef.current || !cameraRef.current || !frustumRef.current) return;

    const objects = objectsRef.current;
    const camera = cameraRef.current;
    const frustum = frustumRef.current;

    // Clear previous
    while (objects.children.length > 0) {
      const child = objects.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      objects.remove(child);
    }
    frustum.visible = false;

    // Setup based on step
    const stepId = PIPELINE_STEPS[activeStep].id;

    if (stepId === 'model') {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshNormalMaterial({ wireframe: false });
      const mesh = new THREE.Mesh(geometry, material);
      objects.add(mesh);
      camera.position.set(4, 3, 5);
    } 
    else if (stepId === 'world') {
      for (let i = 0; i < 3; i++) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 1.5),
          new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
        );
        mesh.position.set(i * 3 - 3, 0.75, Math.sin(i) * 2);
        mesh.rotation.y = i * 0.5;
        objects.add(mesh);
      }
      camera.position.set(8, 6, 10);
    }
    else if (stepId === 'view') {
      // Show camera and target
      const targetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshPhongMaterial({ color: 0xff4444 })
      );
      objects.add(targetMesh);
      
      const camHelperMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1, 8),
        new THREE.MeshBasicMaterial({ color: 0x44ff44, wireframe: true })
      );
      camHelperMesh.position.set(5, 2, 5);
      camHelperMesh.lookAt(0, 0, 0);
      objects.add(camHelperMesh);
      camera.position.set(10, 8, 12);
    }
    else if (stepId === 'projection' || stepId === 'ndc') {
      frustum.visible = true;
      const mesh = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1, 0.3, 100, 16),
        new THREE.MeshStandardMaterial({ color: 0x4488ff })
      );
      mesh.position.set(0, 0, -3); // Inside frustum
      objects.add(mesh);
      camera.position.set(10, 5, 10);
    }
    else if (stepId === 'screen') {
      // 2D Screen simulation
      const screenGeo = new THREE.PlaneGeometry(10, 6);
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      objects.add(screen);

      const pixelGeo = new THREE.PlaneGeometry(0.2, 0.2);
      for (let x = -4; x < 4; x += 0.5) {
        for (let y = -2; y < 2; y += 0.5) {
          if (Math.random() > 0.5) {
            const pixel = new THREE.Mesh(pixelGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
            pixel.position.set(x, y, 0.01);
            objects.add(pixel);
          }
        }
      }
      camera.position.set(0, 0, 10);
    }

  }, [activeStep]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden text-white font-sans">
      {/* Three.js Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-10" />

      {/* Header Info */}
      <div className="absolute top-8 left-8 z-20 max-w-md">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">三维图像显示流水线 (2024 967)</h1>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-blue-400">
                {PIPELINE_STEPS[activeStep].title}
              </h2>
              <p className="text-white/70 leading-relaxed text-sm">
                {PIPELINE_STEPS[activeStep].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Steps Navigation */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-8">
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-2xl overflow-x-auto">
          <button 
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all active:scale-90 flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 flex justify-around items-center px-4 overflow-x-auto scrollbar-hide gap-6">
            {PIPELINE_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === activeStep;
              const isPast = index < activeStep;

              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => setActiveStep(index)}
                    className={`
                      relative flex flex-col items-center gap-2 transition-all duration-300
                      ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'}
                    `}
                  >
                    <div className={`
                      p-3 rounded-2xl transition-colors
                      ${isActive ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/5'}
                      ${isPast ? 'text-blue-400' : ''}
                    `}>
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap hidden lg:block">
                      {step.title.split('.')[1]?.trim() || step.title}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full"
                      />
                    )}
                  </button>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <div className="mx-2 opacity-10 flex-shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            disabled={activeStep === PIPELINE_STEPS.length - 1}
            onClick={() => setActiveStep(prev => prev + 1)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all active:scale-90 flex-shrink-0"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
