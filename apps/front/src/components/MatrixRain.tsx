import { useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*<>{}|/\\;:~!?';
const FS = 13;

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drops: number[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops.length = 0;
      const cols = Math.floor(canvas.width / FS);
      for (let i = 0; i < cols; i++) drops.push(Math.random() * -(canvas.height / FS));
    };

    init();

    const draw = () => {
      ctx.fillStyle = 'rgba(6, 6, 10, 0.055)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FS}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const r = Math.random();

        if (r > 0.97) {
          ctx.fillStyle = 'rgba(220, 255, 230, 0.9)';
        } else if (r > 0.85) {
          ctx.fillStyle = 'rgba(0, 255, 65, 0.75)';
        } else {
          ctx.fillStyle = `rgba(0, 200, 50, ${0.15 + Math.random() * 0.25})`;
        }

        ctx.fillText(char, i * FS, drops[i] * FS);

        if (drops[i] * FS > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.4;
      }
    };

    const id = setInterval(draw, 45);
    const onResize = () => init();
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(id);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.18,
        pointerEvents: 'none',
      }}
    />
  );
}
