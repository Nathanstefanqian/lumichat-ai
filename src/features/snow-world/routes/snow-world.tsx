import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars, Cloud } from '@react-three/drei';
import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

// --- Game Constants ---
const PLAYER_SPEED = 10;
const MONSTER_SPAWN_RATE = 2000; // ms
const MONSTER_SPEED = 3;
const FIREBALL_SPEED = 40;
const PLAYER_MAX_HEALTH = 100;

// --- Types ---
type GameState = 'playing' | 'gameover';

// --- Components ---

// Snow particles
function Snow() {
  const count = 2000;
  
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100; // x
      pos[i * 3 + 1] = Math.random() * 50;      // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
    }
    return pos;
  });

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Move snow down
        positions[i * 3 + 1] -= delta * 2;
        
        // Reset snow to top if it falls below ground
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 50;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Rotate slightly for wind effect
      pointsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Tree component
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 2]} />
        <meshStandardMaterial color="#4a2e16" />
      </mesh>
      {/* Leaves (Cone layers) */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[1.5, 2]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.2, 1.5]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <coneGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#1a472a" />
      </mesh>
      {/* Snow on tree */}
      <mesh position={[0, 4.3, 0]}>
        <coneGeometry args={[0.85, 0.9]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Snowman component
function Snowman({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.15, 3.1, 0.35]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.15, 3.1, 0.35]}>
        <sphereGeometry args={[0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 3, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.5]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
    </group>
  );
}

// Player Logic & Controls
function GameLogic({ 
  onHealthChange, 
  onGameOver, 
  isPlaying 
}: { 
  onHealthChange: (h: number) => void, 
  onGameOver: () => void,
  isPlaying: boolean 
}) {
  const { camera, scene } = useThree();
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  
  // Game State Refs
  const projectiles = useRef<{ id: number; mesh: THREE.Mesh; velocity: THREE.Vector3 }[]>([]);
  const monsters = useRef<{ id: number; group: THREE.Group; speed: number }[]>([]);
  const lastShotTime = useRef(0);
  const lastSpawnTime = useRef(0);
  const health = useRef(PLAYER_MAX_HEALTH);
  
  // Helper to manage scene objects
  const monsterMeshes = useRef<Map<number, THREE.Group>>(new Map());
  const projectileMeshes = useRef<Map<number, THREE.Mesh>>(new Map());

  // Cleanup on unmount or game over
  useEffect(() => {
    return () => {
      // Clear scene objects
      monsterMeshes.current.forEach(mesh => scene.remove(mesh));
      projectileMeshes.current.forEach(mesh => scene.remove(mesh));
      monsterMeshes.current.clear();
      projectileMeshes.current.clear();
    };
  }, [scene]);

  const shoot = useCallback(() => {
    const now = performance.now();
    if (now - lastShotTime.current < 500) return; // Fire rate limit
    lastShotTime.current = now;

    const id = now;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const position = camera.position.clone().add(direction.clone().multiplyScalar(1));
    const velocity = direction.multiplyScalar(FIREBALL_SPEED);
    
    const geometry = new THREE.SphereGeometry(0.3);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4500, emissive: 0xff0000, emissiveIntensity: 2 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Add point light to fireball
    const light = new THREE.PointLight(0xffaa00, 1, 5);
    mesh.add(light);
    
    scene.add(mesh);
    projectileMeshes.current.set(id, mesh);
    projectiles.current.push({ id, mesh, velocity });
  }, [camera, scene]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward.current = true; break;
        case 'ArrowLeft': case 'KeyA': moveLeft.current = true; break;
        case 'ArrowDown': case 'KeyS': moveBackward.current = true; break;
        case 'ArrowRight': case 'KeyD': moveRight.current = true; break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': moveForward.current = false; break;
        case 'ArrowLeft': case 'KeyA': moveLeft.current = false; break;
        case 'ArrowDown': case 'KeyS': moveBackward.current = false; break;
        case 'ArrowRight': case 'KeyD': moveRight.current = false; break;
      }
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!isPlaying || !document.pointerLockElement) return;
      if (event.button === 0) { // Left click
        shoot();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [isPlaying, shoot]);

  const spawnMonster = () => {
    const id = performance.now();
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 20; // Spawn 40-60 units away
    const x = Math.sin(angle) * distance + camera.position.x;
    const z = Math.cos(angle) * distance + camera.position.z;
    
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Build Monster (Code based on the Monster component above but using Three.js API)
    const bodyGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    group.add(body);

    const headGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x550000 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.4;
    group.add(head);

    // Weapon
    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.6, 2, 0.6);
    weaponGroup.rotation.set(0, 0, -0.5);
    const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.5;
    weaponGroup.add(handle);
    const bladeGeo = new THREE.BoxGeometry(0.4, 0.8, 0.1);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 1.5;
    weaponGroup.add(blade);
    group.add(weaponGroup);

    scene.add(group);
    monsterMeshes.current.set(id, group);
    monsters.current.push({ id, group, speed: MONSTER_SPEED + Math.random() });
  };

  useFrame((_state, delta) => {
    if (!isPlaying) return;

    // --- Player Movement ---
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;

    direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
    direction.current.normalize();

    if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * 100.0 * delta;
    if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * 100.0 * delta;

    const camDirection = new THREE.Vector3();
    camera.getWorldDirection(camDirection);
    camDirection.y = 0;
    camDirection.normalize();
    const camRight = new THREE.Vector3();
    camRight.crossVectors(camera.up, camDirection).normalize();

    const moveVector = new THREE.Vector3(0, 0, 0);
    if (moveForward.current) moveVector.add(camDirection);
    if (moveBackward.current) moveVector.sub(camDirection);
    if (moveRight.current) moveVector.sub(camRight);
    if (moveLeft.current) moveVector.add(camRight);
    
    if (moveVector.length() > 0) moveVector.normalize();
    const speed = PLAYER_SPEED * delta;
    camera.position.addScaledVector(moveVector, speed);
    camera.position.setY(1.8); // Lock height

    // --- Monster Spawning ---
    const now = performance.now();
    if (now - lastSpawnTime.current > MONSTER_SPAWN_RATE) {
      spawnMonster();
      lastSpawnTime.current = now;
    }

    // --- Updates ---
    
    // Projectiles
    for (let i = projectiles.current.length - 1; i >= 0; i--) {
      const p = projectiles.current[i];
      p.mesh.position.addScaledVector(p.velocity, delta);
      
      // Remove if too far
      if (p.mesh.position.distanceTo(camera.position) > 100) {
        scene.remove(p.mesh);
        projectileMeshes.current.delete(p.id);
        projectiles.current.splice(i, 1);
        continue;
      }

      // Check collision with monsters
      let hit = false;
      for (let j = monsters.current.length - 1; j >= 0; j--) {
        const m = monsters.current[j];
        if (p.mesh.position.distanceTo(m.group.position) < 1.5) {
          // Hit!
          scene.remove(m.group);
          monsterMeshes.current.delete(m.id);
          monsters.current.splice(j, 1);
          hit = true;
          break; // One bullet hits one monster
        }
      }

      if (hit) {
        scene.remove(p.mesh);
        projectileMeshes.current.delete(p.id);
        projectiles.current.splice(i, 1);
      }
    }

    // Monsters
    for (let i = monsters.current.length - 1; i >= 0; i--) {
      const m = monsters.current[i];
      const dirToPlayer = new THREE.Vector3().subVectors(camera.position, m.group.position);
      dirToPlayer.y = 0;
      const dist = dirToPlayer.length();
      
      // Move towards player
      dirToPlayer.normalize();
      m.group.position.addScaledVector(dirToPlayer, m.speed * delta);
      m.group.lookAt(camera.position.x, m.group.position.y, camera.position.z);

      // Check collision with player
      if (dist < 1.5) {
        // Damage player
        health.current -= 10; // High damage
        onHealthChange(health.current);
        
        // Push back monster or remove? Let's remove for now to avoid rapid damage
        scene.remove(m.group);
        monsterMeshes.current.delete(m.id);
        monsters.current.splice(i, 1);

        if (health.current <= 0) {
          onGameOver();
        }
      }
    }
  });

  return null;
}

export function SnowWorld() {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [health, setHealth] = useState(PLAYER_MAX_HEALTH);
  const [gameKey, setGameKey] = useState(0); // To reset game

  const restartGame = () => {
    setGameState('playing');
    setHealth(PLAYER_MAX_HEALTH);
    setGameKey(k => k + 1);
  };

  // Use useState for static scenery to ensure stable random values
  const [trees] = useState(() => Array.from({ length: 50 }).map((_, i) => ({
    key: `tree-${i}`,
    position: [
      (Math.random() - 0.5) * 100,
      0,
      (Math.random() - 0.5) * 100
    ] as [number, number, number]
  })));

  const [snowmen] = useState(() => Array.from({ length: 10 }).map((_, i) => ({
    key: `snowman-${i}`,
    position: [
      (Math.random() - 0.5) * 50,
      0,
      (Math.random() - 0.5) * 50
    ] as [number, number, number]
  })));

  return (
    <div className="w-full h-full relative bg-black">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20 text-white font-bold text-xl pointer-events-none drop-shadow-md">
        Health: <span className={health < 30 ? 'text-red-500' : 'text-green-500'}>{health}</span>
      </div>

      <div className="absolute top-4 right-4 z-20 text-white/70 text-sm pointer-events-none">
        Click to Lock Cursor | Left Click to Shoot | WASD to Move
      </div>

      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center p-8 border border-white/20 rounded-2xl bg-zinc-900/90 backdrop-blur">
            <h2 className="text-4xl font-bold mb-4 text-red-500">GAME OVER</h2>
            <p className="mb-8 text-lg">The monsters got you!</p>
            <button 
              onClick={restartGame}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <Canvas shadows camera={{ fov: 75, position: [0, 1.8, 10] }} key={gameKey}>
        <fog attach="fog" args={['#e0f7fa', 0, 60]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.1} mieCoefficient={0.005} mieDirectionalG={0.8} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Cloud opacity={0.5} speed={0.4} segments={20} position={[0, 20, 0]} />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#ffffff" roughness={1} metalness={0} />
        </mesh>

        {/* Scene Objects */}
        {trees.map((tree) => (
          <Tree key={tree.key} position={tree.position} />
        ))}

        {snowmen.map((man) => (
          <Snowman key={man.key} position={man.position} />
        ))}

        <Snow />
        
        {/* Game Logic & Player */}
        <GameLogic 
          isPlaying={gameState === 'playing'} 
          onHealthChange={setHealth}
          onGameOver={() => {
            setGameState('gameover');
            document.exitPointerLock();
          }}
        />
        
        {gameState === 'playing' && <PointerLockControls />}
      </Canvas>
    </div>
  );
}
