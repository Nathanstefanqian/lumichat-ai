import { useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import Matter from 'matter-js';
import { toast } from 'sonner';
import { Save, Upload, RotateCcw } from 'lucide-react';

// Game Constants
const TABLE_WIDTH = 20;
const TABLE_HEIGHT = 10;
const BALL_RADIUS = 0.35;
const CUSHION_WIDTH = 1;
const POCKET_RADIUS = 0.6;

// Ball Colors (Standard Pool Colors)
const BALL_COLORS = [
  '#ffffff', // 0: Cue Ball
  '#ffdd00', // 1: Yellow
  '#0000ff', // 2: Blue
  '#ff0000', // 3: Red
  '#800080', // 4: Purple
  '#ffa500', // 5: Orange
  '#008000', // 6: Green
  '#800000', // 7: Maroon
  '#000000', // 8: Black
  '#ffdd00', // 9: Yellow Stripe (Simplified as solid for now)
  '#0000ff', // 10
  '#ff0000', // 11
  '#800080', // 12
  '#ffa500', // 13
  '#008000', // 14
  '#800000', // 15
];

interface BallProps {
  id: number;
  position: [number, number, number];
  color: string;
  isCue?: boolean;
  engine: Matter.Engine;
}

const Ball = ({ id, position, color, isCue, engine }: BallProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<Matter.Body | null>(null);
  const { pointer } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [aimVector, setAimVector] = useState<{ x: number, y: number } | null>(null);

  // Initialize Physics Body
  useEffect(() => {
    const b = Matter.Bodies.circle(position[0], position[2], BALL_RADIUS, {
      restitution: 0.9, // Bounciness
      friction: 0.005,  // Rolling friction
      frictionAir: 0.02, // Air resistance (slows down balls)
      density: 1,
      label: isCue ? 'cue-ball' : `ball-${id}`,
    });
    Matter.World.add(engine.world, b);
    bodyRef.current = b;

    return () => {
      Matter.World.remove(engine.world, b);
    };
  }, [engine, id, isCue, position]);

  // Sync Mesh with Physics Body
  useFrame(() => {
    if (bodyRef.current && meshRef.current) {
      meshRef.current.position.x = bodyRef.current.position.x;
      meshRef.current.position.z = bodyRef.current.position.y; // Map Matter.js Y to Three.js Z
      
      // Simulate rolling rotation based on velocity
      const velocity = bodyRef.current.velocity;
      meshRef.current.rotation.x += velocity.y * 0.1;
      meshRef.current.rotation.z -= velocity.x * 0.1;
    }
  });

  // Interaction (Cue Ball only)
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!isCue || !bodyRef.current) return;
    // Only allow hitting if moving slowly
    if (bodyRef.current.speed > 0.1) return;
    
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = { x: pointer.x, y: pointer.y };
  };

  const handlePointerUp = () => {
    if (!isCue || !isDragging || !bodyRef.current || !dragStartRef.current) return;

    const dx = pointer.x - dragStartRef.current.x;
    const dy = pointer.y - dragStartRef.current.y;
    
    // Calculate force vector (inverted, pull back to shoot forward)
    // Scale force appropriately
    const forceMultiplier = 0.05; 
    
    // We apply force opposite to drag direction
    const forceX = -dx * forceMultiplier * 50; 
    const forceZ = -dy * forceMultiplier * 50; // Map screen Y to World Z

    // Apply force to physics body
    // Note: MatterJS uses (x, y), we map 3D (x, z) to it
    Matter.Body.applyForce(bodyRef.current, bodyRef.current.position, { x: forceX, y: forceZ });
    
    setIsDragging(false);
    dragStartRef.current = null;
    setAimVector(null);
  };

  useFrame(() => {
    if (isDragging && isCue && dragStartRef.current) {
      const dx = pointer.x - dragStartRef.current.x;
      const dy = pointer.y - dragStartRef.current.y;
      setAimVector({ x: -dx, y: -dy });
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { if(isDragging) handlePointerUp() }} // Auto-release if mouse leaves
      >
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.1} 
          metalness={0.1} 
          envMapIntensity={1}
        />
        {/* Number on ball (simplified) */}
        {id > 0 && (
           <Text
             position={[0, BALL_RADIUS + 0.01, 0]}
             rotation={[-Math.PI / 2, 0, 0]}
             fontSize={0.3}
             color="black"
             anchorX="center"
             anchorY="middle"
           >
             {id}
           </Text>
        )}
        
        {/* Aim Line Visualization - As child of mesh to inherit position */}
        {isDragging && aimVector && (
          <group rotation={[-Math.PI/2, 0, 0]}>
             {/* Visual guide line */}
             <mesh position={[aimVector.x * 5, 0, aimVector.y * 5]} rotation={[0, 0, Math.atan2(aimVector.y, aimVector.x)]}>
                <boxGeometry args={[Math.sqrt(aimVector.x**2 + aimVector.y**2) * 10, 0.05, 0.05]} />
                <meshBasicMaterial color="white" opacity={0.5} transparent />
             </mesh>
          </group>
        )}
      </mesh>
    </group>
  );
};

const Table = ({ engine }: { engine: Matter.Engine }) => {
  // Static Bodies for Cushions
  useEffect(() => {
    const wallOptions = { isStatic: true, restitution: 1, friction: 0 };
    const walls = [
      // Top
      Matter.Bodies.rectangle(0, -TABLE_HEIGHT / 2 - CUSHION_WIDTH / 2, TABLE_WIDTH + 2 * CUSHION_WIDTH, CUSHION_WIDTH, wallOptions),
      // Bottom
      Matter.Bodies.rectangle(0, TABLE_HEIGHT / 2 + CUSHION_WIDTH / 2, TABLE_WIDTH + 2 * CUSHION_WIDTH, CUSHION_WIDTH, wallOptions),
      // Left
      Matter.Bodies.rectangle(-TABLE_WIDTH / 2 - CUSHION_WIDTH / 2, 0, CUSHION_WIDTH, TABLE_HEIGHT, wallOptions),
      // Right
      Matter.Bodies.rectangle(TABLE_WIDTH / 2 + CUSHION_WIDTH / 2, 0, CUSHION_WIDTH, TABLE_HEIGHT, wallOptions),
    ];
    Matter.World.add(engine.world, walls);

    return () => {
      Matter.World.remove(engine.world, walls);
    };
  }, [engine]);

  return (
    <group>
      {/* Felt Surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -BALL_RADIUS, 0]}>
        <planeGeometry args={[TABLE_WIDTH, TABLE_HEIGHT]} />
        <meshStandardMaterial color="#0a6c03" roughness={0.8} />
      </mesh>

      {/* Cushions (Visuals) */}
      {/* Top */}
      <mesh position={[0, 0, -TABLE_HEIGHT / 2 - CUSHION_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + 2 * CUSHION_WIDTH, CUSHION_WIDTH, CUSHION_WIDTH]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0, TABLE_HEIGHT / 2 + CUSHION_WIDTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_WIDTH + 2 * CUSHION_WIDTH, CUSHION_WIDTH, CUSHION_WIDTH]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Left */}
      <mesh position={[-TABLE_WIDTH / 2 - CUSHION_WIDTH / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[CUSHION_WIDTH, CUSHION_WIDTH, TABLE_HEIGHT]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Right */}
      <mesh position={[TABLE_WIDTH / 2 + CUSHION_WIDTH / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[CUSHION_WIDTH, CUSHION_WIDTH, TABLE_HEIGHT]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>

      {/* Pockets (Visuals Only for now) */}
      {[
        [-TABLE_WIDTH/2, -TABLE_HEIGHT/2], [0, -TABLE_HEIGHT/2], [TABLE_WIDTH/2, -TABLE_HEIGHT/2],
        [-TABLE_WIDTH/2, TABLE_HEIGHT/2], [0, TABLE_HEIGHT/2], [TABLE_WIDTH/2, TABLE_HEIGHT/2]
      ].map((pos, i) => (
         <mesh key={i} position={[pos[0], -BALL_RADIUS + 0.01, pos[1]]} rotation={[-Math.PI/2, 0, 0]}>
            <circleGeometry args={[POCKET_RADIUS, 32]} />
            <meshBasicMaterial color="black" />
         </mesh>
      ))}
    </group>
  );
};

const GameScene = forwardRef((_, ref) => {
  // Initialize Engine
  const engine = useMemo(() => {
    const e = Matter.Engine.create();
    e.gravity.y = 0; // Top-down 2D physics
    e.gravity.x = 0;
    return e;
  }, []);

  // Initialize Balls
  // Pyramid setup
  const balls = useMemo(() => {
    const b: Array<Omit<BallProps, 'engine'>> = [];
    // Cue Ball
    b.push({ id: 0, position: [-5, 0, 0], color: BALL_COLORS[0], isCue: true });
    
    // Rack (15 balls)
    const startX = 5;
    let idx = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX + row * (BALL_RADIUS * 1.732); // sqrt(3) spacing
        const z = (col - row / 2) * (BALL_RADIUS * 2.05); 
        // Note: In 3D world, Y is Up. Z is "Down" on the table.
        // MatterJS uses X, Y. We map Matter Y -> Three Z.
        // So position array is [x, y, z] for ThreeJS.
        
        // Let's randomize colors/ids slightly or just sequential
        if (idx <= 15) {
          b.push({ id: idx, position: [x, 0, z], color: BALL_COLORS[idx] });
          idx++;
        }
      }
    }
    return b;
  }, []);

  useImperativeHandle(ref, () => ({
    save: () => {
      const bodies = engine.world.bodies.filter(b => b.label.startsWith('ball-') || b.label === 'cue-ball');
      const data = bodies.map(b => ({
        label: b.label,
        position: b.position,
        velocity: b.velocity,
        angularVelocity: b.angularVelocity,
        angle: b.angle
      }));
      localStorage.setItem('billiards-save', JSON.stringify(data));
      toast.success('台球进度已保存');
    },
    load: () => {
      const saved = localStorage.getItem('billiards-save');
      if (!saved) {
        toast.error('没有找到存档');
        return;
      }
      try {
        const data = JSON.parse(saved);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((item: any) => {
          const body = engine.world.bodies.find(b => b.label === item.label);
          if (body) {
             Matter.Body.setPosition(body, item.position);
             Matter.Body.setVelocity(body, item.velocity);
             Matter.Body.setAngularVelocity(body, item.angularVelocity);
             Matter.Body.setAngle(body, item.angle);
          }
        });
        toast.success('台球进度已读取');
      } catch (e) {
        console.error(e);
        toast.error('存档读取失败');
      }
    },
    reset: () => {
      balls.forEach(ball => {
        const label = ball.isCue ? 'cue-ball' : `ball-${ball.id}`;
        const body = engine.world.bodies.find(b => b.label === label);
        if (body) {
           Matter.Body.setPosition(body, { x: ball.position[0], y: ball.position[2] });
           Matter.Body.setVelocity(body, { x: 0, y: 0 });
           Matter.Body.setAngularVelocity(body, 0);
           Matter.Body.setAngle(body, 0);
        }
      });
      toast.success('游戏已重置');
    }
  }));

  useFrame((_, delta) => {
    // Step Physics Engine
    // Matter.js runs at 60Hz by default, sync with framerate
    Matter.Engine.update(engine, delta * 1000);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 10, 0]} intensity={1.5} castShadow />
      <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={1} castShadow />
      
      <Environment preset="studio" />
      
      <group position={[0, 0, 0]}>
        <Table engine={engine} />
        {balls.map((ball) => (
          <Ball 
            key={ball.id} 
            {...ball} 
            engine={engine}
          />
        ))}
      </group>
      
      <ContactShadows position={[0, -BALL_RADIUS - 0.01, 0]} opacity={0.4} scale={40} blur={2} far={4} />
    </>
  );
});

export function BilliardsGame() {
  const gameRef = useRef<{ save: () => void, load: () => void, reset: () => void } | null>(null);

  return (
    <div className="w-full h-full bg-slate-900 relative">
      <div className="absolute top-16 left-4 z-10 bg-black/50 p-4 rounded-xl text-white backdrop-blur-sm pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2">3D 台球</h2>
        <p className="text-sm opacity-80">拖拽白球以击球</p>
        <p className="text-xs opacity-60 mt-1">按住鼠标左键并在白球上拖动，松开击球</p>
        
        <div className="flex gap-2 mt-4">
            <button onClick={() => gameRef.current?.save()} className="p-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full transition-colors" title="保存">
                <Save className="w-4 h-4" />
            </button>
            <button onClick={() => gameRef.current?.load()} className="p-2 bg-green-600/80 hover:bg-green-600 text-white rounded-full transition-colors" title="读取">
                <Upload className="w-4 h-4" />
            </button>
            <button onClick={() => gameRef.current?.reset()} className="p-2 bg-orange-600/80 hover:bg-orange-600 text-white rounded-full transition-colors" title="重置">
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <Canvas shadows camera={{ position: [0, 15, 10], fov: 45 }}>
        <color attach="background" args={['#1e1e1e']} />
        <GameScene ref={gameRef} />
        <OrbitControls 
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below table
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}
