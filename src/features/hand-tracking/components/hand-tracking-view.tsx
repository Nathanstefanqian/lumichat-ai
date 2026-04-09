import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Hands, type Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { Loader2, Camera as CameraIcon, Hand } from 'lucide-react';

export const HandTrackingView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const threeRootRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    // Initialize Three.js
    if (!threeRootRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, threeRootRef.current.clientWidth / threeRootRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(threeRootRef.current.clientWidth, threeRootRef.current.clientHeight);
    threeRootRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const animate = () => {
      requestAnimationFrame(animate);
      if (cubeRef.current) {
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!threeRootRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = threeRootRef.current.clientWidth / threeRootRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(threeRootRef.current.clientWidth, threeRootRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Initialize MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        // Use Middle finger MCP (landmark 9) as palm center
        const palm = landmarks[9]; 
        
        if (cubeRef.current) {
          // Map MediaPipe coordinates (0-1) to Three.js coordinates
          // MediaPipe: (0,0) is top-left, (1,1) is bottom-right
          // Three.js: center is (0,0)
          const targetX = (palm.x - 0.5) * -10; // Inverted for mirror effect
          const targetY = (palm.y - 0.5) * -10;
          
          cubeRef.current.position.x = THREE.MathUtils.lerp(cubeRef.current.position.x, targetX, 0.1);
          cubeRef.current.position.y = THREE.MathUtils.lerp(cubeRef.current.position.y, targetY, 0.1);
        }
      }
    });

    let cameraPipe: Camera | null = null;

    if (videoRef.current) {
      cameraPipe = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraPipe.start().then(() => setIsLoading(false)).catch(err => {
        console.error(err);
        setError("无法访问摄像头，请确保已授权。");
        setIsLoading(false);
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (cameraPipe) {
        cameraPipe.stop();
      }
      hands.close();
      renderer.dispose();
      if (threeRootRef.current && renderer.domElement) {
        threeRootRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Three.js Canvas Container */}
      <div ref={threeRootRef} className="absolute inset-0 z-10" />

      {/* Camera Preview (Hidden but needed for tracking) */}
      <video
        ref={videoRef}
        className="absolute top-4 right-4 w-48 h-36 rounded-xl border-2 border-primary/20 shadow-lg z-20 mirror"
        autoPlay
        playsInline
        muted
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium animate-pulse">正在初始化手势追踪...</p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/90 p-8 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-6">
            <CameraIcon className="w-12 h-12 text-destructive" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">摄像头访问受限</h3>
          <p className="text-muted-foreground mb-8 max-w-md">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            重试
          </button>
        </div>
      )}

      {/* UI Controls/Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
          <div className="bg-primary/20 p-2 rounded-full">
            <Hand className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-white tracking-wide">
            在摄像头前移动你的手，立方体会跟随你
          </span>
        </div>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};
