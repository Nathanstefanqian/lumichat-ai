import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface ParticleLoaderProps {
  variant?: 'music' | 'default';
}

export function ParticleLoader({ variant = 'default' }: ParticleLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    class Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      vx: number;
      vy: number;
      color: string;
      size: number;

      constructor(target: Point) {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.targetX = target.x;
        this.targetY = target.y;
        this.vx = 0;
        this.vy = 0;
        const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 3 + 1;
      }

      update() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Spring force
        const force = dist * 0.01;
        const angle = Math.atan2(dy, dx);
        
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        
        // Friction
        this.vx *= 0.8;
        this.vy *= 0.8;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Add some jitter
        this.x += (Math.random() - 0.5) * 0.5;
        this.y += (Math.random() - 0.5) * 0.5;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseScale = Math.min(canvas.width, canvas.height) / 4;
      
      // Prevent drawing if size is too small
      if (baseScale <= 0) return;

      const newTargets: Point[] = [];
      
      if (variant === 'music') {
          // Note Head (Ellipse at bottom left)
          for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            newTargets.push({
              x: centerX - baseScale * 0.5 + Math.cos(angle) * (baseScale * 0.3),
              y: centerY + baseScale * 0.5 + Math.sin(angle) * (baseScale * 0.25)
            });
          }
          
          // Stem (Vertical line)
          for (let i = 0; i < 60; i++) {
            newTargets.push({
              x: centerX - baseScale * 0.5 + (baseScale * 0.3), // Right side of head
              y: centerY + baseScale * 0.5 - (i * (baseScale * 1.5) / 60)
            });
          }
          
          // Flag (Curved line at top)
          const stemTopX = centerX - baseScale * 0.5 + (baseScale * 0.3);
          const stemTopY = centerY + baseScale * 0.5 - (baseScale * 1.5);
          
          for (let i = 0; i < 40; i++) {
            const progress = i / 40;
            newTargets.push({
              x: stemTopX + progress * (baseScale * 0.8),
              y: stemTopY + Math.sin(progress * Math.PI) * (baseScale * 0.4) + progress * (baseScale * 0.5)
            });
          }
      } else {
          // Default: A swirling circle
          for (let i = 0; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            newTargets.push({
                x: centerX + Math.cos(angle) * baseScale,
                y: centerY + Math.sin(angle) * baseScale
            });
          }
      }

      // Create particles
      particles = [];
      newTargets.forEach(target => {
        particles.push(new Particle(target));
      });
      
      // Add some ambient particles
      for(let i=0; i<30; i++) {
         particles.push(new Particle({
             x: Math.random() * canvas.width,
             y: Math.random() * canvas.height
         }));
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const resizeObserver = new ResizeObserver(() => {
      init();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <div className="absolute inset-0 bg-background/90 z-10 flex flex-col items-center justify-center pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full absolute inset-0"
      />
    </div>
  );
}

export function MusicParticleLoader() {
  return <ParticleLoader variant="music" />;
}
