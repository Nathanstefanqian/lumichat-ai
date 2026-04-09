/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Stats } from '@react-three/drei';
import { Arena } from './Arena';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { OtherPlayer } from './OtherPlayer';
import { Effects } from './Effects';
import { useGameStore } from '../store/index';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';

function GameLoop() {
  const updateTime = useGameStore(state => state.updateTime);
  const updateEnemies = useGameStore(state => state.updateEnemies);
  const cleanupEffects = useGameStore(state => state.cleanupEffects);

  useFrame((_, delta) => {
    const now = Date.now();
    updateTime(delta);
    updateEnemies(now);
    cleanupEffects(now);
  });
  return null;
}

export function Game() {
  const enemies = useGameStore(state => state.enemies);
  const otherPlayerIds = useGameStore(
    useShallow(state => Object.keys(state.otherPlayers))
  );

  const mapType = useGameStore(state => state.mapType);

  const mapConfig = useMemo(() => {
    switch (mapType) {
      case 'desert': return { bg: '#c2915d', fog: 0.03 };
      case 'snow': return { bg: '#ffffff', fog: 0.04 };
      case 'office': return { bg: '#222222', fog: 0.05 };
      default: return { bg: '#050510', fog: 0.025 };
    }
  }, [mapType]);

  return (
    <Canvas 
      shadows={true} 
      camera={{ fov: 75, near: 0.1, far: 1000 }}
      dpr={[1, 2]}
      gl={{ 
        antialias: true, 
        stencil: false, 
        depth: true,
        powerPreference: 'high-performance',
        alpha: false,
        precision: 'highp'
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(mapConfig.bg);
      }}
    >
      <Stats showPanel={0} className="!left-auto !right-4 !top-4" />
      <color attach="background" args={[mapConfig.bg]} />
      <fogExp2 attach="fog" args={[mapConfig.bg, mapConfig.fog]} />
      
      <ambientLight intensity={0.5} />
      
      {/* Maximum Lighting Performance */}
      <pointLight position={[0, 15, 0]} intensity={2} castShadow distance={100} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[50, 15, 50]} intensity={1.5} castShadow distance={100} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-50, 15, -50]} intensity={1.5} castShadow distance={100} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[50, 15, -50]} intensity={1.5} castShadow distance={100} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-50, 15, 50]} intensity={1.5} castShadow distance={100} shadow-mapSize={[1024, 1024]} />
      
      <Physics gravity={[0, -20, 0]} timeStep="vary">
        <GameLoop />
        <Arena />
        <Player />
        {enemies.map(enemy => (
          <Enemy key={enemy.id} data={enemy} />
        ))}
        {otherPlayerIds.map(id => (
          <OtherPlayer key={id} id={id} />
        ))}
        <Effects />
      </Physics>

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
}
