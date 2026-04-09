/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Grid, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/index';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(uaMatch || coarsePointer || window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function Wall({ position, size, color = "#111", emissive = "#000" }: { position: [number, number, number], size: [number, number, number], color?: string, emissive?: string }) {
  return (
    <RigidBody type="fixed">
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.9} emissive={emissive} emissiveIntensity={0.2} />
      </mesh>
    </RigidBody>
  );
}

function AmbientParticles({ color = "#00ffff" }: { color?: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, sizes] = useMemo(() => {
    const count = 2000;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const rngParticles = mulberry32(54321);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rngParticles() - 0.5) * 200;
      pos[i * 3 + 1] = rngParticles() * 40;
      pos[i * 3 + 2] = (rngParticles() - 0.5) * 200;
      sz[i] = rngParticles() * 0.8 + 0.4;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) }
        }}
        vertexShader={`
          attribute float size;
          varying float vOpacity;
          uniform float uTime;
          void main() {
            vOpacity = sin(uTime * 0.5 + position.x + position.z) * 0.5 + 0.5;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          uniform vec3 uColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(uColor, vOpacity * (1.0 - d * 2.0));
          }
        `}
      />
    </points>
  );
}

export function Arena() {
  const isMobile = useIsMobile();
  const mapType = useGameStore(state => state.mapType);
  
  const obstacles = useMemo(() => {
    const count = isMobile ? 60 : 150;
    const rngLocal = mulberry32(12345);
    return Array.from({ length: count }).map(() => {
      const x = (rngLocal() - 0.5) * 170;
      const z = (rngLocal() - 0.5) * 170;
      if (Math.abs(x) < 20 && Math.abs(z) < 20) return null;

      const height = rngLocal() * 8 + 6;
      const isHorizontal = rngLocal() > 0.5;
      const width = isHorizontal ? rngLocal() * 25 + 10 : rngLocal() * 3 + 1;
      const depth = isHorizontal ? rngLocal() * 3 + 1 : rngLocal() * 25 + 10;
      
      let color = "#00ffff";
      if (mapType === 'desert') color = "#e2a76f";
      else if (mapType === 'snow') color = "#ffffff";
      else if (mapType === 'office') color = "#cccccc";
      else color = rngLocal() > 0.5 ? "#00ffff" : "#ff00ff";

      return { position: [x, height / 2 - 0.5, z] as [number, number, number], size: [width, height, depth] as [number, number, number], color };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [isMobile, mapType]);

  const mapConfig = useMemo(() => {
    switch (mapType) {
      case 'desert':
        return {
          floor: "#c2915d",
          grid: ["#8b4513", "#d2691e"],
          sky: "#87ceeb",
          ambient: 0.8,
          particles: "#8b4513"
        };
      case 'snow':
        return {
          floor: "#f0f8ff",
          grid: ["#add8e6", "#ffffff"],
          sky: "#ffffff",
          ambient: 0.9,
          particles: "#ffffff"
        };
      case 'office':
        return {
          floor: "#333333",
          grid: ["#111111", "#555555"],
          sky: "#222222",
          ambient: 0.6,
          particles: "#ffffff"
        };
      default:
        return {
          floor: "#050510",
          grid: ["#ff00ff", "#00ffff"],
          sky: "#050510",
          ambient: 0.5,
          particles: "#00ffff"
        };
    }
  }, [mapType]);

  return (
    <group>
      <ambientLight intensity={mapConfig.ambient} />
      <pointLight position={[0, 20, 0]} intensity={2} color={mapConfig.grid[1]} castShadow={!isMobile} />
      
      {/* Floor */}
      <RigidBody type="fixed" name="floor" friction={0}>
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color={mapConfig.floor} roughness={0.2} metalness={0.8} />
        </mesh>
      </RigidBody>
      <Grid position={[0, -0.49, 0]} args={[200, 200]} cellColor={mapConfig.grid[0]} sectionColor={mapConfig.grid[1]} fadeDistance={100} cellThickness={0.5} sectionThickness={1.5} />

      {/* Perimeter Walls */}
      <Wall position={[0, 10, 100]} size={[200, 20, 1]} color={mapConfig.floor} />
      <Wall position={[0, 10, -100]} size={[200, 20, 1]} color={mapConfig.floor} />
      <Wall position={[100, 10, 0]} size={[1, 20, 200]} color={mapConfig.floor} />
      <Wall position={[-100, 10, 0]} size={[1, 20, 200]} color={mapConfig.floor} />

      {/* Obstacles */}
      {obstacles.map((obs, i) => (
        <RigidBody key={i} type="fixed" position={obs.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={obs.size} />
            <meshStandardMaterial 
              color={obs.color} 
              roughness={0.1} 
              metalness={0.9}
              emissive={obs.color}
              emissiveIntensity={mapType === 'neon' ? 0.2 : 0.05}
            />
          </mesh>
        </RigidBody>
      ))}

      {!isMobile && (
        <>
          {mapType === 'neon' && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
          <AmbientParticles color={mapConfig.particles} />
        </>
      )}
    </group>
  );
}
