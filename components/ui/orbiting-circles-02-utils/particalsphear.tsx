"use client";

import React, { useEffect, useRef } from "react";

export default function ParticleSphereAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const numParticles = 240;
    const radius = Math.min(width, height) * 0.38;

    interface Particle {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ["#6366f1", "#06b6d4", "#a855f7", "#3b82f6", "#10b981"];

    // Distribute particles evenly on a sphere using Fibonacci sphere algorithm
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numParticles; i++) {
      const y = 1 - (i / (numParticles - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        color: colors[i % colors.length],
      });
    }

    let angleY = 0;
    let angleX = 0.2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      angleY += 0.008;

      particles.forEach((p) => {
        // Rotate around Y axis
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = p.baseX * cosY - p.baseZ * sinY;
        const z1 = p.baseX * sinY + p.baseZ * cosY;

        // Rotate around X axis
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = p.baseY * cosX - z1 * sinX;
        const z2 = p.baseY * sinX + z1 * cosX;

        // Perspective projection
        const perspective = 300;
        const scale = perspective / (perspective + z2);

        const projX = cx + x1 * scale;
        const projY = cy + y2 * scale;
        const alpha = Math.max(0.1, (z2 + radius) / (2 * radius));

        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(1, 2.5 * scale), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      });

      // Draw subtle connecting lines between close particles
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i += 6) {
        for (let j = i + 1; j < particles.length; j += 12) {
          const p1 = particles[i];
          const p2 = particles[j];

          const cosY = Math.cos(angleY);
          const sinY = Math.sin(angleY);
          const x1 = p1.baseX * cosY - p1.baseZ * sinY;
          const z1 = p1.baseX * sinY + p1.baseZ * cosY;

          const x2 = p2.baseX * cosY - p2.baseZ * sinY;
          const z2 = p2.baseX * sinY + p2.baseZ * cosY;

          const dist = Math.hypot(x1 - x2, p1.baseY - p2.baseY, z1 - z2);
          if (dist < radius * 0.45) {
            const scale1 = 300 / (300 + z1);
            const scale2 = 300 / (300 + z2);
            ctx.beginPath();
            ctx.moveTo(cx + x1 * scale1, cy + p1.baseY * scale1);
            ctx.lineTo(cx + x2 * scale2, cy + p2.baseY * scale2);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  );
}
