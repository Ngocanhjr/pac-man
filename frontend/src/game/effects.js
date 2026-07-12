// effects.js — Hiệu ứng particle khi ăn food phủ lên canvas.
//
// Dùng chung hệ tọa độ pixel với PacmanRenderer (đã offset/cell). Renderer gọi
// effects.spawnBurst(cx, cy) khi ăn, và effects.draw(ctx) ở cuối mỗi frame.

class Effects {
  constructor() {
    this.particles = [];
  }

  // Nổ chùm hạt nhỏ tại tâm (cx, cy) màu tùy chọn.
  spawnBurst(cx, cy, color = "#FFE600", count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 0.8 + Math.random() * 1.6;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 1,
        decay: 0.04 + Math.random() * 0.03,
        color,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // trọng lực nhẹ
      p.life -= p.decay;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}

export const effects = new Effects();
