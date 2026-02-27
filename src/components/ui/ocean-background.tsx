import { useEffect, useRef } from 'react';

export function OceanBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    setSize();
    window.addEventListener('resize', setSize);

    // Fish configuration
    const fishCount = 15;
    const fishes: Fish[] = [];
    const bubbles: Bubble[] = [];

    class Fish {
      x: number;
      y: number;
      size: number;
      speed: number;
      color: string;
      direction: number; // 1 for right, -1 for left
      angle: number;
      tailAngle: number;
      tailSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 10 + 5;
        this.speed = Math.random() * 1 + 0.5;
        this.color = `hsla(${Math.random() * 60 + 180}, 70%, 70%, 0.6)`; // Blue-Cyan range
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.angle = 0;
        this.tailAngle = 0;
        this.tailSpeed = 0.1 + Math.random() * 0.1;
      }

      update() {
        this.x += this.speed * this.direction;
        this.tailAngle += this.tailSpeed;

        // Wrap around screen
        if (this.direction === 1 && this.x > width + 50) this.x = -50;
        if (this.direction === -1 && this.x < -50) this.x = width + 50;

        // Gentle sine wave movement
        this.y += Math.sin(this.x * 0.01) * 0.5;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.direction, 1); // Flip if moving left

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-this.size * 1.2, 0);
        const tailWiggle = Math.sin(this.tailAngle) * 5;
        ctx.lineTo(-this.size * 2.5, -this.size + tailWiggle);
        ctx.lineTo(-this.size * 2.5, this.size + tailWiggle);
        ctx.fill();

        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size * 0.8, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size * 0.9, -this.size * 0.3, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    class Bubble {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 100;
        this.size = Math.random() * 5 + 2;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.y -= this.speed;
        if (this.y < -20) {
          this.y = height + Math.random() * 100;
          this.x = Math.random() * width;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize fishes
    for (let i = 0; i < fishCount; i++) {
      fishes.push(new Fish());
    }

    // Initialize bubbles
    for (let i = 0; i < 30; i++) {
      bubbles.push(new Bubble());
    }

    let animationFrameId: number;

    const animate = () => {
      if (!ctx) return;
      
      // Clear with ocean gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f172a'); // Deep dark blue at top
      gradient.addColorStop(1, '#1e3a8a'); // Blue at bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw light rays
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      const rayGradient = ctx.createLinearGradient(width / 2, 0, width / 2, height);
      rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      rayGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rayGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width / 2 + 200, height);
      ctx.lineTo(width / 2 - 200, height);
      ctx.fill();
      ctx.restore();

      // Update and draw bubbles
      bubbles.forEach(bubble => {
        bubble.update();
        bubble.draw(ctx);
      });

      // Update and draw fishes
      fishes.forEach(fish => {
        fish.update();
        fish.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ pointerEvents: 'none' }}
    />
  );
}
