import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Float, 
  ContactShadows,
  Text
} from '@react-three/drei';
import * as THREE from 'three';

// 闹钟组件
const AlarmClockModel = () => {
  const groupRef = useRef<THREE.Group>(null);
  const hourHandRef = useRef<THREE.Mesh>(null);
  const minuteHandRef = useRef<THREE.Mesh>(null);
  const secondHandRef = useRef<THREE.Mesh>(null);
  const hammerRef = useRef<THREE.Group>(null);
  
  const [isRinging, setIsRinging] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 初始化 AudioContext 和响铃逻辑
  useEffect(() => {
    if (isRinging) {
      // 创建音频上下文
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const ctx = audioContextRef.current;
      
      // 创建振荡器模拟铃声 (经典电子/机械复合音)
      const playBell = () => {
        if (!isRinging) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 频率
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      };

      const interval = setInterval(playBell, 150);
      return () => clearInterval(interval);
    }
  }, [isRinging]);

  // 材质定义
  const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d4af37', // 金色
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.5,
  }), []);

  const chromeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness: 0.05,
    envMapIntensity: 2,
  }), []);

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    transmission: 0.95,
    thickness: 0.5,
    envMapIntensity: 1,
  }), []);

  // 更新时间逻辑
  useFrame((state) => {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    if (secondHandRef.current) {
      secondHandRef.current.rotation.z = -((seconds / 60) * Math.PI * 2);
    }
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.z = -(((minutes + seconds / 60) / 60) * Math.PI * 2);
    }
    if (hourHandRef.current) {
      hourHandRef.current.rotation.z = -((((hours % 12) + minutes / 60) / 12) * Math.PI * 2);
    }

    // 响铃动画
    if (isRinging && hammerRef.current) {
      hammerRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 50) * 0.2;
      groupRef.current?.position.set(
        Math.sin(state.clock.elapsedTime * 60) * 0.02,
        Math.cos(state.clock.elapsedTime * 60) * 0.02,
        0
      );
    } else if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 主体外壳 */}
      <mesh material={metalMaterial} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.4, 64]} />
      </mesh>

      {/* 玻璃罩 */}
      <mesh position={[0, 0, 0.21]} material={glassMaterial} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 64]} />
      </mesh>

      {/* 表盘 */}
      <mesh position={[0, 0, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.01, 64]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>

      {/* 时标 (简单实现) */}
      {[...Array(12)].map((_, i) => (
        <group key={i} rotation={[0, 0, -(i * Math.PI * 2) / 12]}>
          <mesh position={[0, 0.75, 0.2]}>
            <boxGeometry args={[0.02, 0.1, 0.01]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      ))}

      {/* 指针 */}
      <group position={[0, 0, 0.21]}>
        <mesh ref={hourHandRef}>
          <boxGeometry args={[0.04, 0.5, 0.01]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh ref={minuteHandRef}>
          <boxGeometry args={[0.03, 0.7, 0.01]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh ref={secondHandRef}>
          <boxGeometry args={[0.01, 0.8, 0.01]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
        {/* 指针中心点 */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 32]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      {/* 顶部闹铃耳 */}
      <group position={[0, 1.1, 0]}>
        <mesh position={[-0.6, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]} material={chromeMaterial}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        </mesh>
        <mesh position={[0.6, 0, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 4]} material={chromeMaterial}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        </mesh>
        
        {/* 响铃锤子 */}
        <group ref={hammerRef}>
           <mesh position={[0, -0.1, 0]} material={chromeMaterial}>
             <boxGeometry args={[0.05, 0.3, 0.05]} />
           </mesh>
           <mesh position={[0, 0.1, 0]} material={chromeMaterial}>
             <sphereGeometry args={[0.08, 16, 16]} />
           </mesh>
        </group>
      </group>

      {/* 支脚 */}
      <group position={[0, -0.9, 0]}>
        <mesh position={[-0.5, -0.1, 0]} rotation={[0, 0, -Math.PI / 6]} material={chromeMaterial}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        </mesh>
        <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, Math.PI / 6]} material={chromeMaterial}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
        </mesh>
      </group>

      {/* 交互提示文字 */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        onClick={() => setIsRinging(!isRinging)}
      >
        {isRinging ? "点击停止响铃" : "点击测试响铃"}
      </Text>
    </group>
  );
};

export const ThreeDAlarmClock = () => {
  return (
    <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        
        {/* 灯光配置 */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        {/* 环境反射，提升金属感 */}
        <Environment preset="city" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <AlarmClockModel />
        </Float>

        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
        />
        
        <OrbitControls enablePan={false} minDistance={3} maxDistance={7} />
      </Canvas>
      
      <div className="absolute top-4 left-4 text-white pointer-events-none">
        <h2 className="text-xl font-bold">高级金属质感 3D 闹钟</h2>
        <p className="text-sm opacity-70">拖动旋转 · 滚轮缩放 · 点击下方文字交互</p>
      </div>
    </div>
  );
};

export default ThreeDAlarmClock;
