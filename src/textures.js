import * as THREE from 'three';
import { rng, pick } from './kit.js';

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const HAND = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
const MONO = 'Menlo, "SF Mono", Consolas, monospace';

export function canvasTexture(width, height, draw, repeat) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  texture.redraw = (...args) => {
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, ...args);
    texture.needsUpdate = true;
  };
  draw(ctx, width, height);
  return texture;
}

const speckle = (ctx, w, h, count, colors, min, max, random) => {
  for (let index = 0; index < count; index += 1) {
    ctx.fillStyle = pick(random, colors);
    const size = min + random() * (max - min);
    ctx.fillRect(random() * w, random() * h, size, size);
  }
};
const text = (ctx, value, x, y, font, color, align = 'left') => {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
};
const rounded = (ctx, x, y, w, h, r, fill, stroke) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};
const scribble = (ctx, x, y, w, color, random, width = 2) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let step = 0; step < w; step += 6) ctx.lineTo(x + step, y + Math.sin(step * 0.6 + random() * 2) * 2.4);
  ctx.stroke();
};
const arrow = (ctx, x1, y1, x2, y2, color) => {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 10, x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - Math.min(y1, y2) + 10, x2 - (x1 + x2) / 2);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(angle - 0.45), y2 - 9 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 9 * Math.cos(angle + 0.45), y2 - 9 * Math.sin(angle + 0.45));
  ctx.fill();
};

/* ---------- Floors and wall finishes (sized to tile in world units) ---------- */
export const grass = () => canvasTexture(256, 256, (ctx, w, h) => {
  const random = rng(11);
  ctx.fillStyle = '#5a983c';
  ctx.fillRect(0, 0, w, h);
  for (let index = 0; index < 3200; index += 1) {
    const x = random() * w, y = random() * h, length = 3 + random() * 6, angle = -Math.PI / 2 + (random() - 0.5) * 1.1;
    ctx.strokeStyle = pick(random, ['#6db24a', '#4b8633', '#7cc355', '#57943b', '#3e782b', '#8bcf5f']);
    ctx.lineWidth = 1 + random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
});
export const planks = (base = [178, 130, 86]) => canvasTexture(512, 512, (ctx, w, h) => {
  const random = rng(23), rowHeight = h / 8;
  for (let row = 0; row < 8; row += 1) {
    for (let x = -random() * 220; x < w;) {
      const length = 150 + random() * 210, shade = (random() - 0.5) * 30;
      ctx.fillStyle = `rgb(${base[0] + shade},${base[1] + shade * 0.8},${base[2] + shade * 0.6})`;
      ctx.fillRect(x, row * rowHeight, length, rowHeight);
      ctx.strokeStyle = 'rgba(70,40,20,.14)';
      ctx.lineWidth = 1;
      for (let grain = 0; grain < 6; grain += 1) {
        const y = row * rowHeight + 5 + random() * (rowHeight - 10);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + length * 0.3, y + (random() - 0.5) * 7, x + length * 0.6, y + (random() - 0.5) * 7, x + length, y + (random() - 0.5) * 4);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(45,26,14,.5)';
      ctx.fillRect(x, row * rowHeight, 2, rowHeight);
      x += length;
    }
    ctx.fillStyle = 'rgba(45,26,14,.45)';
    ctx.fillRect(0, row * rowHeight, w, 2);
  }
});
export const carpet = (a, b) => canvasTexture(256, 256, (ctx, w, h) => {
  const random = rng(5);
  for (let ty = 0; ty < 2; ty += 1) for (let tx = 0; tx < 2; tx += 1) {
    const flip = (tx + ty) % 2;
    ctx.fillStyle = flip ? a : b;
    ctx.fillRect(tx * 128, ty * 128, 128, 128);
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.lineWidth = 1.5;
    for (let line = 2; line < 128; line += 5) {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(tx * 128 + line, ty * 128);
        ctx.lineTo(tx * 128 + line, ty * 128 + 128);
      } else {
        ctx.moveTo(tx * 128, ty * 128 + line);
        ctx.lineTo(tx * 128 + 128, ty * 128 + line);
      }
      ctx.stroke();
    }
  }
  speckle(ctx, w, h, 4200, ['rgba(0,0,0,.09)', 'rgba(255,255,255,.07)'], 1, 2, random);
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  ctx.fillRect(0, 0, w, 1.5);
  ctx.fillRect(0, 128, w, 1.5);
  ctx.fillRect(0, 0, 1.5, h);
  ctx.fillRect(128, 0, 1.5, h);
});
export const concrete = () => canvasTexture(512, 512, (ctx, w, h) => {
  const random = rng(77);
  ctx.fillStyle = '#8e9193';
  ctx.fillRect(0, 0, w, h);
  for (let index = 0; index < 46; index += 1) {
    const x = random() * w, y = random() * h, radius = 30 + random() * 100, gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, random() > 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.09)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  speckle(ctx, w, h, 5000, ['rgba(0,0,0,.18)', 'rgba(255,255,255,.18)', 'rgba(60,60,60,.25)'], 1, 2.2, random);
  ctx.strokeStyle = 'rgba(35,35,35,.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(40,40,40,.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, 300);
  for (let step = 0; step < 14; step += 1) ctx.lineTo(90 + step * 14, 300 + (random() - 0.5) * 18 + step * 3);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,60,30,.18)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(380, 140, 14, 0, Math.PI * 1.7);
  ctx.stroke();
});
export const epoxy = () => canvasTexture(256, 256, (ctx, w, h) => {
  const random = rng(31);
  ctx.fillStyle = '#e6eaee';
  ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, 1800, ['rgba(120,130,140,.12)', 'rgba(255,255,255,.4)'], 1, 2, random);
  ctx.fillStyle = 'rgba(140,150,160,.35)';
  ctx.fillRect(0, 0, w, 1.5);
  ctx.fillRect(0, 0, 1.5, h);
});
export const raisedFloor = () => canvasTexture(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#aeb5bf';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c3c9d2';
  ctx.fillRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = 'rgba(40,46,56,.55)';
  for (let y = 14; y < h - 10; y += 8) for (let x = 14; x < w - 10; x += 8) ctx.fillRect(x, y, 3, 3);
});
export const rubber = (base = '#2c2f35') => canvasTexture(256, 256, (ctx, w, h) => {
  const random = rng(8);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  speckle(ctx, w, h, 3500, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.25)', 'rgba(110,120,140,.08)'], 1, 2, random);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, 0, 2, h);
});
export const brick = () => canvasTexture(512, 256, (ctx, w, h) => {
  const random = rng(19);
  ctx.fillStyle = '#c4b8a6';
  ctx.fillRect(0, 0, w, h);
  for (let row = 0; row < 8; row += 1) for (let x = row % 2 ? -32 : 0; x < w; x += 64) {
    const shade = (random() - 0.5) * 34, soot = random() > 0.86 ? -30 : 0;
    ctx.fillStyle = `rgb(${156 + shade + soot},${74 + shade * 0.6 + soot},${54 + shade * 0.4 + soot})`;
    ctx.fillRect(x + 2, row * 32 + 2, 60, 28);
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(x + 2, row * 32 + 2, 60, 4);
  }
  speckle(ctx, w, h, 2000, ['rgba(0,0,0,.12)', 'rgba(255,230,210,.1)'], 1, 2, random);
});
export const pegboard = () => canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#c9a676';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(70,48,24,.75)';
  for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) {
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
});
export const cuttingMat = () => canvasTexture(256, 160, (ctx, w, h) => {
  ctx.fillStyle = '#2d6b52';
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 10) {
    ctx.fillStyle = x % 50 ? 'rgba(220,255,230,.2)' : 'rgba(250,230,120,.55)';
    ctx.fillRect(x, 0, 1, h);
  }
  for (let y = 0; y < h; y += 10) {
    ctx.fillStyle = y % 50 ? 'rgba(220,255,230,.2)' : 'rgba(250,230,120,.55)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.strokeStyle = 'rgba(250,230,120,.45)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(h, 0);
  ctx.stroke();
});
export const starkGrid = () => canvasTexture(512, 256, (ctx, w, h) => {
  const random = rng(42);
  ctx.fillStyle = '#04101f';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) if (random() > 0.9) {
    ctx.fillStyle = `rgba(70,225,255,${0.12 + random() * 0.32})`;
    ctx.fillRect(x + 1, y + 1, 15, 15);
  }
  for (let x = 0; x <= w; x += 16) {
    ctx.fillStyle = x % 64 ? 'rgba(70,225,255,.28)' : 'rgba(110,240,255,.8)';
    ctx.fillRect(x, 0, x % 64 ? 1 : 2, h);
  }
  for (let y = 0; y <= h; y += 16) {
    ctx.fillStyle = y % 64 ? 'rgba(70,225,255,.28)' : 'rgba(110,240,255,.8)';
    ctx.fillRect(0, y, w, y % 64 ? 1 : 2);
  }
  ctx.strokeStyle = 'rgba(140,245,255,.85)';
  ctx.lineWidth = 2;
  for (const radius of [26, 40, 52]) {
    ctx.beginPath();
    ctx.arc(256, 128, radius, 0.2, Math.PI * 2 - 0.4);
    ctx.stroke();
  }
  ctx.strokeRect(24, 24, 120, 60);
  ctx.strokeRect(368, 168, 120, 60);
  text(ctx, 'MK-07 // ARC CORE', 30, 100, `600 12px ${MONO}`, 'rgba(160,245,255,.9)');
});

/* ---------- Screens ---------- */
export const screens = {
  code: () => canvasTexture(256, 160, (ctx, w, h) => {
    const random = rng(3);
    ctx.fillStyle = '#1e2230';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b3043';
    ctx.fillRect(0, 0, w, 12);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(8 + index * 9, 6, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#252a3a';
    ctx.fillRect(0, 12, 46, h);
    for (let line = 0; line < 15; line += 1) {
      const y = 18 + line * 9.4;
      ctx.fillStyle = '#4a5068';
      ctx.fillRect(50, y, 8, 4);
      let x = 64 + Math.floor(random() * 4) * 9;
      for (let token = 0; token < 2 + random() * 4; token += 1) {
        const width = 8 + random() * 34;
        ctx.fillStyle = pick(random, ['#c792ea', '#82aaff', '#c3e88d', '#a6accd', '#f78c6c', '#89ddff', '#a6accd']);
        ctx.fillRect(x, y, width, 4);
        x += width + 5;
      }
    }
    for (let row = 0; row < 9; row += 1) {
      ctx.fillStyle = row === 3 ? '#82aaff' : '#596080';
      ctx.fillRect(8 + (row % 3) * 4, 20 + row * 12, 30 - (row % 3) * 4, 4);
    }
  }),
  terminal: () => canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0b100d';
    ctx.fillRect(0, 0, w, h);
    ['$ npm run build', '  vite v6.0.0 building...', '  ✓ 214 modules transformed', '$ git push origin main', '  remote: deploying moonbase', '  ████████████░░░ 78%', '$ ./sim --orbit lunar', '  Δv = 1.87 km/s  OK', '$ _'].forEach((line, index) => text(ctx, line, 8, 12 + index * 16, `11px ${MONO}`, index % 3 === 0 ? '#9bffb8' : '#4ee08a'));
  }),
  sheet: () => canvasTexture(256, 160, (ctx, w, h) => {
    const random = rng(9);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f7a4a';
    ctx.fillRect(0, 0, w, 14);
    ctx.fillStyle = '#eef3ef';
    ctx.fillRect(0, 14, w, 10);
    ctx.fillRect(0, 14, 16, h);
    ctx.strokeStyle = '#d6dad8';
    ctx.lineWidth = 1;
    for (let x = 16; x < w; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 24; y < h; y += 9) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      for (let x = 20; x < 140; x += 34) if (random() > 0.25) {
        ctx.fillStyle = random() > 0.9 ? '#e25c4a' : '#5b6670';
        ctx.fillRect(x, y + 3, 8 + random() * 20, 3);
      }
    }
    ctx.fillStyle = 'rgba(255,214,90,.5)';
    ctx.fillRect(50, 60, 34, 9);
    [0.4, 0.65, 0.5, 0.85, 0.7].forEach((value, index) => {
      ctx.fillStyle = '#34a36a';
      ctx.fillRect(160 + index * 16, 140 - value * 90, 11, value * 90);
    });
  }),
  dashboard: () => canvasTexture(256, 160, (ctx, w, h) => {
    const random = rng(14);
    ctx.fillStyle = '#121722';
    ctx.fillRect(0, 0, w, h);
    [['#4fd1c5', '98.2%'], ['#f6ad55', '1,204'], ['#9f7aea', '42ms']].forEach(([color, value], index) => {
      rounded(ctx, 8 + index * 82, 8, 74, 36, 5, '#1b2232');
      ctx.fillStyle = color;
      ctx.fillRect(14 + index * 82, 14, 20, 3);
      text(ctx, value, 14 + index * 82, 32, `700 14px ${SANS}`, '#e8edf6');
    });
    rounded(ctx, 8, 52, 240, 100, 5, '#1b2232');
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= 220; x += 10) ctx.lineTo(18 + x, 130 - x * 0.25 - random() * 22);
    ctx.stroke();
    for (let x = 0; x < 220; x += 14) {
      ctx.fillStyle = 'rgba(159,122,234,.55)';
      const value = 10 + random() * 28;
      ctx.fillRect(20 + x, 146 - value, 8, value);
    }
  }),
  call: () => canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#17191f';
    ctx.fillRect(0, 0, w, h);
    [['#3b4b6b', '#e3b08a', '#2a1c13'], ['#5a4a6b', '#a06a45', '#111214'], ['#3f6b5a', '#f2cba8', '#d6b06c'], ['#6b5a3f', '#744a2d', '#111214']].forEach(([bg, skin, hair], index) => {
      const x = 6 + (index % 2) * 123, y = 6 + Math.floor(index / 2) * 68;
      rounded(ctx, x, y, 119, 64, 5, bg);
      ctx.fillStyle = '#2b2f3a';
      ctx.beginPath();
      ctx.ellipse(x + 60, y + 70, 30, 22, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(x + 60, y + 30, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(x + 60, y + 26, 13, Math.PI, 0);
      ctx.fill();
    });
    rounded(ctx, 108, 146, 40, 10, 5, '#e5484d');
  }),
  design: () => canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#eef0f4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 44, h);
    ctx.fillRect(212, 0, 44, h);
    for (let row = 0; row < 10; row += 1) {
      ctx.fillStyle = row === 2 ? '#7c8cff' : '#c7ccd6';
      ctx.fillRect(6, 10 + row * 12, 30, 4);
      ctx.fillStyle = '#d5d9e1';
      ctx.fillRect(218, 10 + row * 12, 30, 4);
    }
    [[58, '#ff8a65'], [110, '#7c8cff'], [162, '#4fd1a5']].forEach(([x, color]) => {
      rounded(ctx, x, 22, 44, 92, 6, '#ffffff', '#c7ccd6');
      rounded(ctx, x + 5, 30, 34, 26, 3, color);
      ctx.fillStyle = '#c7ccd6';
      ctx.fillRect(x + 5, 62, 30, 4);
      ctx.fillRect(x + 5, 70, 22, 4);
      rounded(ctx, x + 5, 96, 34, 10, 4, '#1f2430');
    });
    ctx.strokeStyle = '#7c8cff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(108, 20, 48, 96);
  }),
  calendar: () => canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3b6fe0';
    ctx.fillRect(0, 0, w, 16);
    text(ctx, 'Week 42', 8, 8, `700 9px ${SANS}`, '#ffffff');
    ctx.strokeStyle = '#e1e5ec';
    for (let x = 30; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 28; y < h; y += 14) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    [[0, 30, 28, '#7aa7ff'], [1, 58, 42, '#ffb86b'], [2, 44, 18, '#7ee0b0'], [3, 86, 32, '#f38ba8'], [4, 30, 56, '#c6a0f6'], [5, 100, 22, '#7aa7ff'], [1, 120, 20, '#7ee0b0'], [3, 40, 24, '#ffb86b']].forEach(([day, y, height, color]) => rounded(ctx, 32 + day * 32, y, 28, height, 3, color));
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(30, 78, w, 1.5);
  }),
  email: () => canvasTexture(256, 160, (ctx, w, h) => {
    const random = rng(21);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f2f4f8';
    ctx.fillRect(0, 0, 50, h);
    for (let row = 0; row < 9; row += 1) {
      ctx.fillStyle = row < 2 ? '#2a3140' : '#7a8394';
      ctx.fillRect(58, 8 + row * 17, 40 + random() * 30, 4);
      ctx.fillStyle = '#b6bdc9';
      ctx.fillRect(58, 15 + row * 17, 100 + random() * 80, 3);
      ctx.fillStyle = '#e9ecf1';
      ctx.fillRect(50, 21 + row * 17, w, 1);
    }
    for (let row = 0; row < 6; row += 1) {
      ctx.fillStyle = row === 0 ? '#3b6fe0' : '#aab2c0';
      ctx.fillRect(8, 12 + row * 14, 32, 4);
    }
  }),
  gantt: () => canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#10151f';
    ctx.fillRect(0, 0, w, h);
    text(ctx, 'Q4 MISSION TIMELINE', 16, 18, `700 15px ${SANS}`, '#e7ecf5');
    ['Habitat 7 fit-out', 'Rover service', 'Crew rotation', 'Supply drop', 'Solar array B', 'Research cycle', 'Comms upgrade'].forEach((label, row) => {
      const y = 46 + row * 29;
      text(ctx, label, 16, y + 8, `500 11px ${SANS}`, '#9aa4b7');
      ctx.fillStyle = '#1a2130';
      ctx.fillRect(130, y, 366, 18);
      rounded(ctx, 130 + ((row * 53) % 190), y + 2, 70 + ((row * 37) % 120), 14, 7, ['#5b8cff', '#f59e5b', '#4fd1a5', '#e879a8', '#a78bfa', '#facc15', '#38bdf8'][row]);
    });
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(300, 36, 2, 212);
    text(ctx, 'TODAY', 304, 40, `700 9px ${SANS}`, '#ef4444');
  }),
  metrics: () => canvasTexture(512, 288, (ctx, w, h) => {
    ctx.fillStyle = '#0e1015';
    ctx.fillRect(0, 0, w, h);
    text(ctx, 'MRR', 24, 30, `700 16px ${SANS}`, '#8b93a7');
    text(ctx, '$48.2k', 24, 70, `800 44px ${SANS}`, '#f5f7fb');
    text(ctx, '▲ 12.4% MoM', 24, 108, `700 16px ${SANS}`, '#3ddc84');
    text(ctx, 'USERS 12,408', 300, 30, `700 14px ${SANS}`, '#8b93a7');
    text(ctx, 'RUNWAY 7 mo', 300, 56, `700 14px ${SANS}`, '#f6ad55');
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= 460; x += 10) ctx.lineTo(26 + x, 266 - Math.pow(x / 460, 3.2) * 130 - Math.sin(x * 0.2) * 3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(61,220,132,.12)';
    ctx.lineTo(486, 270);
    ctx.lineTo(26, 270);
    ctx.fill();
  }),
};

/* ---------- Boards, posters and signs ---------- */
const boardBase = (ctx, w, h) => {
  ctx.fillStyle = '#fbfbf8';
  ctx.fillRect(0, 0, w, h);
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,.5)');
  gradient.addColorStop(1, 'rgba(200,205,215,.18)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
};
const sticky = (ctx, x, y, color, random, angle = 0) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(2, 3, 34, 34);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 34, 34);
  scribble(ctx, 5, 11, 22, 'rgba(40,40,60,.7)', random, 1.4);
  scribble(ctx, 5, 20, 16, 'rgba(40,40,60,.7)', random, 1.4);
  ctx.restore();
};
export const whiteboard = variant => canvasTexture(512, 256, (ctx, w, h) => {
  const random = rng(50 + variant);
  boardBase(ctx, w, h);
  if (variant === 0) {
    [['APP', 30, 40, '#2563eb'], ['API', 140, 40, '#2563eb'], ['DB', 250, 40, '#2563eb'], ['AI ✨', 140, 120, '#16a34a']].forEach(([label, x, y, color]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, 78, 40);
      text(ctx, label, x + 39, y + 21, `700 18px ${HAND}`, color, 'center');
    });
    arrow(ctx, 110, 58, 138, 58, '#2563eb');
    arrow(ctx, 220, 58, 248, 58, '#2563eb');
    arrow(ctx, 180, 82, 180, 118, '#16a34a');
    text(ctx, 'SHIP > PERFECT', 30, 210, `700 26px ${HAND}`, '#dc2626');
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    scribble(ctx, 30, 228, 200, '#dc2626', random, 3);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(360, 30);
    ctx.lineTo(360, 150);
    ctx.lineTo(490, 150);
    ctx.stroke();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let x = 0; x <= 120; x += 6) ctx.lineTo(364 + x, 146 - Math.pow(x / 120, 3.4) * 110);
    ctx.stroke();
    text(ctx, 'MRR', 366, 24, `700 15px ${HAND}`, '#111827');
    ['#fde68a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fde68a', '#fed7aa'].forEach((color, index) => sticky(ctx, 300 + (index % 3) * 40, 172 + Math.floor(index / 3) * 40, color, random, (random() - 0.5) * 0.25));
  } else if (variant === 1) {
    [40, 170, 300].forEach((x, index) => {
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, 30, 80, 150, 10);
      ctx.stroke();
      ctx.strokeStyle = ['#2563eb', '#9333ea', '#16a34a'][index];
      ctx.strokeRect(x + 10, 50, 60, 30);
      scribble(ctx, x + 10, 100, 55, '#6b7280', random);
      scribble(ctx, x + 10, 114, 40, '#6b7280', random);
      ctx.strokeRect(x + 14, 150, 52, 16);
      if (index < 2) arrow(ctx, x + 88, 100, x + 124, 100, '#dc2626');
    });
    text(ctx, 'onboarding v3', 40, 214, `700 22px ${HAND}`, '#1f2937');
    text(ctx, 'v2', 400, 60, `700 20px ${HAND}`, '#9ca3af');
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(392, 50);
    ctx.lineTo(430, 72);
    ctx.stroke();
    text(ctx, 'ask users!!', 400, 210, `700 20px ${HAND}`, '#9333ea');
  } else {
    text(ctx, 'LTV / CAC > 3', 30, 40, `700 26px ${HAND}`, '#1d4ed8');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, 80, 160, 140);
    ctx.beginPath();
    ctx.moveTo(120, 80);
    ctx.lineTo(120, 220);
    ctx.moveTo(40, 150);
    ctx.lineTo(200, 150);
    ctx.stroke();
    text(ctx, 'impact', 14, 150, `600 12px ${HAND}`, '#6b7280');
    [[70, 100, '#dc2626'], [150, 110, '#16a34a'], [90, 190, '#2563eb'], [170, 180, '#9333ea'], [160, 96, '#16a34a']].forEach(([x, y, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    text(ctx, 'PIVOT?', 300, 110, `700 34px ${HAND}`, '#dc2626');
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(355, 110, 82, 34, -0.08, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'no. focus. ✓', 290, 190, `700 22px ${HAND}`, '#16a34a');
  }
});
export const kanban = () => canvasTexture(512, 256, (ctx, w, h) => {
  const random = rng(64);
  boardBase(ctx, w, h);
  ['TO DO', 'DOING', 'DONE'].forEach((label, column) => {
    const x = 12 + column * 168;
    text(ctx, label, x + 76, 20, `800 16px ${SANS}`, '#334155', 'center');
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x, 32, 152, 2);
    if (column) ctx.fillRect(x - 9, 10, 2, 236);
    const colors = [['#fde68a', '#fecaca', '#bfdbfe'], ['#fed7aa', '#ddd6fe'], ['#bbf7d0', '#bbf7d0', '#a7f3d0']][column];
    for (let card = 0; card < [7, 4, 6][column]; card += 1) sticky(ctx, x + 4 + (card % 3) * 50, 44 + Math.floor(card / 3) * 50, pick(random, colors), random, (random() - 0.5) * 0.18);
  });
});
export function calendarWall(date = new Date()) {
  return canvasTexture(1280, 512, (ctx, w, h) => {
    const random = rng(date.getMonth() + 7), year = date.getFullYear(), month = date.getMonth(), today = date.getDate();
    const first = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, w, 70);
    text(ctx, date.toLocaleString('en-US', { month: 'long' }).toUpperCase(), 32, 37, `800 40px ${SANS}`, '#ffffff');
    text(ctx, String(year), w - 32, 37, `300 40px ${SANS}`, '#9ec5ff', 'right');
    const cellW = (w - 24) / 7, cellH = (h - 110) / 6;
    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].forEach((day, index) => text(ctx, day, 12 + cellW * index + cellW / 2, 88, `700 15px ${SANS}`, index > 4 ? '#e05252' : '#475569', 'center'));
    const events = ['Sprint review', 'Launch prep', '1:1s', 'Rover maint.', 'Crew rotation', 'Supply drop', 'Demo day', 'Board sync', 'O₂ audit', 'Retro', 'EVA window', 'Hiring loop'];
    const colors = ['#5b8cff', '#f59e5b', '#34c38f', '#e879a8', '#a78bfa', '#f2c94c', '#38bdf8'];
    for (let cell = 0; cell < 42; cell += 1) {
      const column = cell % 7, row = Math.floor(cell / 7), x = 12 + column * cellW, y = 100 + row * cellH, day = cell - first + 1;
      ctx.fillStyle = column > 4 ? '#f3f4f6' : '#ffffff';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = '#d7dce3';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, cellW, cellH);
      const inMonth = day >= 1 && day <= days;
      const label = inMonth ? day : day < 1 ? new Date(year, month, day).getDate() : day - days;
      if (inMonth && day === today) {
        ctx.fillStyle = 'rgba(229,72,77,.12)';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        ctx.fillStyle = '#e5484d';
        ctx.beginPath();
        ctx.arc(x + 22, y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      text(ctx, String(label), x + 22, y + 20, `700 16px ${SANS}`, !inMonth ? '#c4c9d2' : day === today ? '#ffffff' : '#1f2937', 'center');
      if (inMonth && random() > 0.38) {
        const count = random() > 0.7 ? 2 : 1;
        for (let event = 0; event < count; event += 1) {
          const color = pick(random, colors);
          rounded(ctx, x + 6, y + 38 + event * 20, cellW - 12, 16, 4, color);
          text(ctx, pick(random, events), x + 11, y + 46 + event * 20, `600 10px ${SANS}`, '#ffffff');
        }
      }
    }
  });
}
export const roadmap = () => canvasTexture(512, 256, (ctx, w, h) => {
  boardBase(ctx, w, h);
  text(ctx, '2026 ROADMAP', 16, 20, `800 16px ${SANS}`, '#1e3a5f');
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach((label, index) => {
    text(ctx, label, 70 + index * 110, 46, `700 13px ${SANS}`, '#64748b', 'center');
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(16 + index * 110, 56, 2, 186);
  });
  [['#5b8cff', 20, 160], ['#34c38f', 90, 240], ['#f59e5b', 200, 180], ['#a78bfa', 140, 300], ['#e879a8', 320, 150], ['#38bdf8', 60, 120]].forEach(([color, x, width], row) => rounded(ctx, x, 68 + row * 28, width, 18, 9, color));
  ctx.fillStyle = '#e5484d';
  ctx.fillRect(400, 52, 2, 194);
  ctx.beginPath();
  ctx.arc(401, 52, 5, 0, Math.PI * 2);
  ctx.fill();
});
export const periodicTable = () => canvasTexture(256, 160, (ctx, w, h) => {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);
  text(ctx, 'PERIODIC TABLE OF ELEMENTS', 128, 10, `800 9px ${SANS}`, '#1f2937', 'center');
  const layout = ['1................2', '12..........345678', '12..........345678', '123456789012345678', '123456789012345678', '12.4567890123456789', '12.4567890123456789'];
  layout.forEach((row, y) => [...row].slice(0, 18).forEach((cell, x) => {
    if (cell === '.') return;
    ctx.fillStyle = x < 2 ? '#f8a5a5' : x > 11 ? (x === 17 ? '#c4b5fd' : '#a7f3d0') : '#bfdbfe';
    ctx.fillRect(10 + x * 13, 22 + y * 16, 12, 15);
  }));
  for (let x = 0; x < 15; x += 1) {
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(49 + x * 13, 140, 12, 9);
  }
});
export const poster = kind => canvasTexture(192, 256, (ctx, w, h) => {
  if (kind === 'rocket') {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0b1a3a');
    gradient.addColorStop(1, '#3c1c5a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f6f2e9';
    ctx.beginPath();
    ctx.moveTo(96, 40);
    ctx.quadraticCurveTo(126, 90, 116, 160);
    ctx.lineTo(76, 160);
    ctx.quadraticCurveTo(66, 90, 96, 40);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(76, 140);
    ctx.lineTo(58, 172);
    ctx.lineTo(78, 160);
    ctx.moveTo(116, 140);
    ctx.lineTo(134, 172);
    ctx.lineTo(114, 160);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(96, 92, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(82, 164);
    ctx.quadraticCurveTo(96, 210, 110, 164);
    ctx.fill();
    text(ctx, 'LAUNCH WEEK', 96, 230, `900 20px ${SANS}`, '#fbbf24', 'center');
  } else if (kind === 'done') {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, w, h);
    ['DONE', 'IS BETTER', 'THAN', 'PERFECT'].forEach((line, index) => text(ctx, line, 16, 52 + index * 46, `900 ${index === 3 ? 34 : 30}px ${SANS}`, '#111111'));
  } else if (kind === 'blueprint') {
    ctx.fillStyle = '#123a73';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    for (let line = 0; line < w; line += 12) {
      ctx.beginPath();
      ctx.moveTo(line, 0);
      ctx.lineTo(line, h);
      ctx.moveTo(0, line);
      ctx.lineTo(w, line);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 60, 100, 120);
    ctx.beginPath();
    ctx.arc(96, 120, 30, 0, Math.PI * 2);
    ctx.moveTo(46, 60);
    ctx.lineTo(20, 30);
    ctx.moveTo(146, 60);
    ctx.lineTo(172, 30);
    ctx.moveTo(46, 180);
    ctx.lineTo(20, 210);
    ctx.moveTo(146, 180);
    ctx.lineTo(172, 210);
    ctx.stroke();
    text(ctx, 'DRONE MK-II', 96, 236, `700 16px ${MONO}`, '#e0f2fe', 'center');
  } else {
    ctx.fillStyle = '#e8efe4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3f6b3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(96, 210);
    ctx.bezierCurveTo(90, 160, 110, 120, 96, 50);
    ctx.stroke();
    ctx.fillStyle = '#6aa84f';
    for (let leaf = 0; leaf < 8; leaf += 1) {
      ctx.save();
      ctx.translate(96 + (leaf % 2 ? 6 : -6), 70 + leaf * 18);
      ctx.rotate(leaf % 2 ? 0.7 : -0.7);
      ctx.beginPath();
      ctx.ellipse(leaf % 2 ? 18 : -18, 0, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    text(ctx, 'Ficus lunaris', 96, 236, `italic 600 16px Georgia, serif`, '#2f4f2a', 'center');
  }
});
export const sign = (label, background, color, width = 256, height = 96, size = 40) => canvasTexture(width, height, (ctx, w, h) => {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);
  text(ctx, label, w / 2, h / 2 + 2, `800 ${size}px ${SANS}`, color, 'center');
});
export const neon = (label, color) => canvasTexture(512, 128, (ctx, w, h) => {
  ctx.font = `italic 900 72px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  for (const [blur, fill] of [[32, color], [16, color], [4, '#fff6fb']]) {
    ctx.shadowBlur = blur;
    ctx.fillStyle = fill;
    ctx.fillText(label, w / 2, h / 2);
  }
});

/* ---------- Animated textures ---------- */
export const serverFront = () => canvasTexture(128, 256, (ctx, w, h) => {
  ctx.fillStyle = '#14171d';
  ctx.fillRect(0, 0, w, h);
  for (let unit = 0; unit < 16; unit += 1) {
    const y = unit * 16;
    ctx.fillStyle = unit % 5 === 0 ? '#262b35' : '#1d2129';
    ctx.fillRect(4, y + 1, w - 8, 14);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let x = 40; x < w - 10; x += 5) ctx.fillRect(x, y + 4, 2, 8);
    for (let led = 0; led < 4; led += 1) {
      const on = Math.random() > 0.3;
      ctx.fillStyle = on ? pick(Math.random, ['#39ff88', '#39ff88', '#4cc3ff', '#ffb547']) : '#203026';
      ctx.fillRect(8 + led * 7, y + 6, 4, 4);
    }
  }
}, [1, 1]);
export const holoPanel = seed => canvasTexture(256, 256, (ctx, w, h) => {
  const random = rng(90 + seed);
  ctx.strokeStyle = 'rgba(120,235,255,.9)';
  ctx.fillStyle = 'rgba(120,235,255,.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillRect(6, 6, w - 12, 24);
  text(ctx, ['SCHEMATIC 07', 'POWER FLOW', 'DIAGNOSTICS'][seed % 3], 14, 18, `700 12px ${MONO}`, 'rgba(200,250,255,.95)');
  if (seed % 3 === 1) {
    for (let bar = 0; bar < 9; bar += 1) {
      const value = 20 + random() * 150;
      ctx.fillRect(20 + bar * 25, 230 - value, 16, value);
      ctx.strokeRect(20 + bar * 25, 230 - value, 16, value);
    }
  } else {
    for (const radius of [30, 54, 80]) {
      ctx.beginPath();
      ctx.arc(128, 136, radius, random() * 2, Math.PI * (1.2 + random()));
      ctx.stroke();
    }
    for (let line = 0; line < 6; line += 1) {
      const angle = random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(angle) * 30, 136 + Math.sin(angle) * 30);
      ctx.lineTo(128 + Math.cos(angle) * 100, 136 + Math.sin(angle) * 100);
      ctx.stroke();
    }
    text(ctx, `${(random() * 99).toFixed(1)}%`, 128, 136, `700 18px ${MONO}`, 'rgba(220,252,255,1)', 'center');
  }
});
export const holoBoard = () => canvasTexture(512, 256, (ctx, w, h) => {
  ctx.strokeStyle = 'rgba(110,230,255,.95)';
  ctx.fillStyle = 'rgba(110,230,255,.1)';
  ctx.lineWidth = 2;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.strokeStyle = 'rgba(110,230,255,.25)';
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(170,245,255,1)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(150, 128, 70, 0, Math.PI * 2);
  ctx.moveTo(150, 58);
  ctx.lineTo(150, 198);
  ctx.moveTo(80, 128);
  ctx.lineTo(220, 128);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(150, 128, 26, 0, Math.PI * 2);
  ctx.stroke();
  for (let row = 0; row < 6; row += 1) {
    ctx.strokeRect(290, 40 + row * 30, 190, 20);
    ctx.fillStyle = 'rgba(170,245,255,.5)';
    ctx.fillRect(292, 42 + row * 30, 30 + ((row * 47) % 150), 16);
  }
  text(ctx, 'ARC REACTOR · REV 12', 20, 22, `700 14px ${MONO}`, 'rgba(210,250,255,1)');
});
export const clock = (label, offsetHours) => {
  const texture = canvasTexture(128, 148, (ctx, w, h, now = new Date()) => {
    const utc = now.getTime() + now.getTimezoneOffset() * 60000, local = new Date(utc + offsetHours * 3600000);
    const hours = local.getHours() % 12, minutes = local.getMinutes(), seconds = local.getSeconds();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbfbf7';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.fill();
    for (let tick = 0; tick < 60; tick += 1) {
      const angle = tick * Math.PI / 30, inner = tick % 5 ? 50 : 44;
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = tick % 5 ? 1 : 3;
      ctx.beginPath();
      ctx.moveTo(64 + Math.sin(angle) * inner, 64 - Math.cos(angle) * inner);
      ctx.lineTo(64 + Math.sin(angle) * 53, 64 - Math.cos(angle) * 53);
      ctx.stroke();
    }
    const hand = (angle, length, width, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(64, 64);
      ctx.lineTo(64 + Math.sin(angle) * length, 64 - Math.cos(angle) * length);
      ctx.stroke();
    };
    hand((hours + minutes / 60) * Math.PI / 6, 28, 5, '#111827');
    hand((minutes + seconds / 60) * Math.PI / 30, 42, 3.5, '#111827');
    hand(seconds * Math.PI / 30, 46, 1.5, '#e5484d');
    rounded(ctx, 18, 128, 92, 19, 6, '#1f2937');
    text(ctx, label, 64, 138, `800 12px ${SANS}`, '#e5e7eb', 'center');
  });
  return texture;
};
export const countdown = target => canvasTexture(256, 112, (ctx, w, h, now = Date.now()) => {
  const left = Math.max(0, target - now), days = Math.floor(left / 864e5), hours = Math.floor(left / 36e5) % 24, minutes = Math.floor(left / 6e4) % 60, seconds = Math.floor(left / 1000) % 60;
  ctx.fillStyle = '#0a0d13';
  ctx.fillRect(0, 0, w, h);
  text(ctx, 'NEXT SUPPLY LAUNCH', 128, 22, `800 15px ${SANS}`, '#67e8f9', 'center');
  text(ctx, `T-${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, 128, 66, `700 34px ${MONO}`, '#fbbf24', 'center');
  text(ctx, 'PAD 2 · GO FOR STACKING', 128, 96, `600 12px ${SANS}`, '#94a3b8', 'center');
});
