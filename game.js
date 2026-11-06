'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── OVNI enemigo ──────────────────────────────────────────────────────────────
const ENEMY_RADIUS        = 14;
const ENEMY_SPEED         = 110;
const ENEMY_TTL           = 12;
const ENEMY_FIRE_MIN      = 1.6;
const ENEMY_FIRE_MAX      = 2.4;
const ENEMY_BULLET_SPEED  = 230;
const ENEMY_BULLET_TTL    = 3;
const ENEMY_POINTS        = 150;
const ENEMY_FIRST_MIN     = 8;
const ENEMY_FIRST_MAX     = 14;
const ENEMY_RESPAWN_MIN   = 18;
const ENEMY_RESPAWN_MAX   = 28;

class EnemyBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * ENEMY_BULLET_SPEED;
    this.vy = Math.sin(angle) * ENEMY_BULLET_SPEED;
    this.radius = 3;
    this.ttl = ENEMY_BULLET_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.fillStyle   = '#ff5a3c';
    ctx.shadowColor = '#ff5a3c';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Enemy {
  constructor(side) {
    this.x        = side < 0 ? 24 : W - 24;
    this.baseY    = rand(60, H - 60);
    this.y        = this.baseY;
    this.vx       = (side < 0 ? 1 : -1) * rand(ENEMY_SPEED * 0.8, ENEMY_SPEED * 1.2);
    this.radius   = ENEMY_RADIUS;
    this.ttl      = ENEMY_TTL;
    this.fireTimer = rand(1, ENEMY_FIRE_MAX);
    this.bobPhase = rand(0, Math.PI * 2);
    this.bobAmp   = rand(12, 28);
    this.bobSpeed = rand(0.8, 1.4);
    this.dead     = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.bobPhase += this.bobSpeed * dt;
    this.y = wrap(this.baseY + Math.sin(this.bobPhase) * this.bobAmp, H);

    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      return;
    }

    if (state === 'playing' && !ship.dead) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.shoot();
        this.fireTimer = rand(ENEMY_FIRE_MIN, ENEMY_FIRE_MAX);
      }
    }
  }

  shoot() {
    const angle = Math.atan2(ship.y - this.y, ship.x - this.x) + rand(-0.12, 0.12);
    const ox = this.x + Math.cos(angle) * this.radius;
    const oy = this.y + Math.sin(angle) * this.radius;
    enemyBullets.push(new EnemyBullet(ox, oy, angle));
  }

  draw() {
    // Parpadeo antes de retirarse
    const alpha = this.ttl < 2
      ? (Math.floor(this.ttl * 10) % 2 === 0 ? 0.4 : 1)
      : 1;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff5a3c';
    ctx.fillStyle   = '#ff5a3c';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = '#ff5a3c';
    ctx.shadowBlur  = 10;

    // Cúpula
    ctx.beginPath();
    ctx.arc(0, -1, 6, Math.PI, 0);
    ctx.stroke();

    // Cuerpo
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Luces
    for (const lx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.arc(lx, 3, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

const FUGAZ_SPEED  = 2.4;   // multiplicador de velocidad de la estrella fugaz
const FUGAZ_TTL    = 7;     // segundos antes de desvanecerse
const FUGAZ_CHANCE = 0.6;   // probabilidad de aparecer por nivel
const FUGAZ_POINTS = 3;     // multiplicador de puntos al destruirla
const FUGAZ_DROP   = 0.4;   // probabilidad de soltar power-up

class Asteroid {
  constructor(x, y, size = 3, fugaz = false) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.fugaz = fugaz;
    this.expired = false;

    const angle = rand(0, Math.PI * 2);
    const speed = (SPEEDS[size] + rand(-15, 15)) * (fugaz ? FUGAZ_SPEED : 1);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2) * (fugaz ? 1.6 : 1);
    this.rot = rand(0, Math.PI * 2);

    if (fugaz) {
      this.ttl    = FUGAZ_TTL;
      this.maxTtl = FUGAZ_TTL;
    }

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;

    if (this.fugaz && !this.dead) {
      this.ttl -= dt;
      if (this.ttl <= 0) {
        this.ttl = 0;
        this.dead = true;
        this.expired = true;
      }
    }
  }

  split() {
    if (this.size <= 1 || this.fugaz) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    if (this.fugaz && this.expired) return;

    const alpha = this.fugaz
      ? Math.min(1, this.ttl / (FUGAZ_TTL / 3))
      : 1;
    // Parpadeo final para avisar de la desaparición
    if (this.fugaz && this.ttl < 1.5 && Math.floor(this.ttl * 12) % 2 === 0) return;

    // Estela de la estrella fugaz
    if (this.fugaz) {
      const speed = Math.hypot(this.vx, this.vy) || 1;
      const tail  = this.radius * 2.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255,210,74,${(alpha * 0.35).toFixed(2)})`;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x - (this.vx / speed) * tail,
        this.y - (this.vy / speed) * tail
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.fugaz ? '#ffd24a' : '#fff';
    ctx.lineWidth   = this.fugaz ? 2 : 1.5;
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = alpha;
    if (this.fugaz) {
      ctx.shadowColor = '#ffd24a';
      ctx.shadowBlur  = 12;
    }
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
// Cada skin define silueta, colores y puntos de anclaje. Solo es estético:
// el radio de colisión de la nave no cambia.
const SKINS = [
  {
    id: 'clasica',
    name: 'Clásica',
    stroke: '#fff',
    boostStroke: '#00e5ff',
    flame: 'rgba(255, 130, 0, 0.85)',
    flameBoost: 'rgba(0,229,255,0.9)',
    shape: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    nose: 21,
    rear: -8,
    flameSpread: 4,
  },
  {
    id: 'neon',
    name: 'Neón',
    stroke: '#4dff88',
    boostStroke: '#00e5ff',
    flame: 'rgba(77, 255, 136, 0.8)',
    flameBoost: 'rgba(0,229,255,0.9)',
    shape: [[24, 0], [-10, -6], [-4, 0], [-10, 6]],
    nose: 25,
    rear: -6,
    flameSpread: 3,
    glow: '#4dff88',
  },
  {
    id: 'fuego',
    name: 'Fuego',
    stroke: '#ff6b35',
    boostStroke: '#ffd24a',
    flame: 'rgba(255, 210, 74, 0.9)',
    flameBoost: 'rgba(255, 210, 74, 0.9)',
    shape: [[18, 0], [-10, -12], [-6, -3], [-14, 0], [-6, 3], [-10, 12]],
    nose: 19,
    rear: -12,
    flameSpread: 3,
  },
  {
    id: 'fantasma',
    name: 'Fantasma',
    stroke: '#b388ff',
    boostStroke: '#00e5ff',
    flame: 'rgba(179, 136, 255, 0.85)',
    flameBoost: 'rgba(0,229,255,0.9)',
    shape: [[20, 0], [-2, -10], [-12, -6], [-8, 0], [-12, 6], [-2, 10]],
    nose: 21,
    rear: -9,
    flameSpread: 4,
    glow: '#b388ff',
  },
];

const SKIN_KEY = 'asteroids.skin';
let currentSkin = 0;
let skinNotice  = 0;

function loadSkin() {
  try {
    const stored = parseInt(localStorage.getItem(SKIN_KEY), 10);
    if (Number.isInteger(stored) && stored >= 0 && stored < SKINS.length)
      currentSkin = stored;
  } catch (e) { /* localStorage no disponible: se usa la skin por defecto */ }
}

function saveSkin() {
  try { localStorage.setItem(SKIN_KEY, String(currentSkin)); }
  catch (e) { /* localStorage no disponible: la elección dura la sesión */ }
}

function cycleSkin() {
  currentSkin = (currentSkin + 1) % SKINS.length;
  skinNotice  = 1.6;
  saveSkin();
}

// Dibuja la silueta con el ctx ya trasladado/rotado
function drawShipShape(skin) {
  const pts = skin.shape;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++)
    ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.stroke();
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const TRIPLE_INTERVAL = 5;    // segundos entre ráfagas automáticas
const TRIPLE_BURST    = 3;    // balas por ráfaga
const TRIPLE_GAP      = 0.08; // segundos entre balas de la ráfaga

class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleTimer   = TRIPLE_INTERVAL;
    this.burstShots    = 0;
    this.burstDelay    = 0;
    this.burstAngle    = this.angle;
    this.shield        = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.shield        > 0) this.shield        -= dt;

    // Ráfaga automática de 3 balas cada TRIPLE_INTERVAL segundos
    this.tripleTimer -= dt;
    if (this.tripleTimer <= 0) {
      this.tripleTimer = TRIPLE_INTERVAL;
      this.burstShots  = TRIPLE_BURST;
      this.burstDelay  = 0;
      this.burstAngle  = this.angle;   // misma dirección para las 3 balas
    }
    if (this.burstShots > 0) {
      this.burstDelay -= dt;
      if (this.burstDelay <= 0) {
        bullets.push(this.spawnBullet(this.burstAngle));
        this.burstShots--;
        this.burstDelay = TRIPLE_GAP;
      }
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260 * (this.speedBoost > 0 ? BOOST_FACTOR : 1);  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  spawnBullet(angle = this.angle) {
    const NOSE = SKINS[currentSkin].nose;
    const ox = this.x + Math.cos(angle) * NOSE;
    const oy = this.y + Math.sin(angle) * NOSE;
    return new Bullet(ox, oy, angle);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    return [this.spawnBullet()];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    const blink = this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0;

    if (!blink) {
      const skin  = SKINS[currentSkin];
      const boost = this.speedBoost > 0;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = boost ? skin.boostStroke : skin.stroke;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      if (skin.glow) {
        ctx.shadowColor = skin.glow;
        ctx.shadowBlur  = 10;
      }

      drawShipShape(skin);

      // Llama del propulsor
      if (this.thrusting && Math.random() > 0.35) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(skin.rear, -skin.flameSpread);
        ctx.lineTo(skin.rear - rand(6, 14), 0);
        ctx.lineTo(skin.rear,  skin.flameSpread);
        ctx.strokeStyle = boost ? skin.flameBoost : skin.flame;
        ctx.stroke();
      }

      ctx.restore();
    }

    if (this.shield > 0) this.drawShield();
  }

  drawShield() {
    const pulse = 0.65 + Math.sin(this.shield * 6) * 0.2;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = `rgba(125,255,176,${pulse.toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = SHIELD_COLOR;
    ctx.shadowBlur  = 12;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a  = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * SHIELD_RADIUS;
      const py = Math.sin(a) * SHIELD_RADIUS;
      if (i === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups ────────────────────────────────────────────────────────────────
const BOOST_TIME   = 5;    // segundos de efecto
const BOOST_FACTOR = 2;    // multiplicador de propulsión
const POWERUP_TTL  = 12;   // segundos antes de desaparecer
const POWERUP_DROP = 0.15; // probabilidad de soltar velocidad al destruir un asteroide
const SHIELD_DROP  = 0.10; // probabilidad de soltar escudo al destruir un asteroide
const SHIELD_TIME  = 8;    // segundos de protección
const SHIELD_RADIUS = 24;
const SHIELD_COLOR = '#7dffb0';

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = 10;
    this.ttl    = POWERUP_TTL;
    this.pulse  = 0;
    this.dead   = false;
  }

  update(dt) {
    this.pulse += dt * 6;
    this.ttl   -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const glow = 0.55 + Math.sin(this.pulse) * 0.25;
    const isShield = this.type === 'shield';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = isShield
      ? `rgba(125,255,176,${glow.toFixed(2)})`
      : `rgba(0,229,255,${glow.toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    if (isShield) {
      // Escudo hexagonal
      const r = 8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a  = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo
      ctx.beginPath();
      ctx.moveTo( 2, -9);
      ctx.lineTo(-5,  1);
      ctx.lineTo( 0,  1);
      ctx.lineTo(-2,  9);
      ctx.lineTo( 5, -1);
      ctx.lineTo( 0, -1);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps, enemies, enemyBullets;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let enemySpawnTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  const safeSpot = () => {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    return [x, y];
  };

  for (let i = 0; i < count; i++) {
    const [x, y] = safeSpot();
    asteroids.push(new Asteroid(x, y, 3));
  }

  // Estrella fugaz: más rápida, desaparece sola y da puntos extra
  if (Math.random() < FUGAZ_CHANCE) {
    const [x, y] = safeSpot();
    asteroids.push(new Asteroid(x, y, 3, true));
  }
}

function spawnEnemy() {
  enemies.push(new Enemy(Math.random() < 0.5 ? -1 : 1));
}

function initGame() {
  ship          = new Ship();
  bullets       = [];
  asteroids     = [];
  particles     = [];
  powerUps      = [];
  enemies       = [];
  enemyBullets  = [];
  enemySpawnTimer = rand(ENEMY_FIRST_MIN, ENEMY_FIRST_MAX);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets      = [];
  particles    = [];
  powerUps     = [];
  enemies      = [];
  enemyBullets = [];
  enemySpawnTimer = rand(ENEMY_FIRST_MIN, ENEMY_FIRST_MAX);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoost = 0;
  ship.shield = 0;
  enemyBullets = [];
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Skins: disponibles en cualquier estado del juego
  if (skinNotice > 0) skinNotice -= dt;
  if (pressed('KeyS') || pressed('KeyC')) cycleSkin();

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    enemies.forEach(e => e.update(dt));
    enemies = enemies.filter(e => !e.dead);
    enemyBullets.forEach(b => b.update(dt));
    enemyBullets = enemyBullets.filter(b => !b.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  enemies.forEach(e => e.update(dt));
  enemyBullets.forEach(b => b.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  // Aparición periódica del OVNI (máximo uno a la vez)
  enemySpawnTimer -= dt;
  if (enemySpawnTimer <= 0 && enemies.length === 0) {
    spawnEnemy();
    enemySpawnTimer = rand(ENEMY_RESPAWN_MIN, ENEMY_RESPAWN_MAX);
  }

  // La estrella fugaz agotada se desvanece sin otorgar puntos
  for (const a of asteroids) {
    if (a.expired) {
      a.expired = false;
      explode(a.x, a.y, 6);
    }
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Nave vs power-up
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'shield') ship.shield = SHIELD_TIME;
      else                     ship.speedBoost = BOOST_TIME;
      explode(p.x, p.y, 6);
    }
  }
  powerUps = powerUps.filter(p => !p.dead);

  // Bala vs asteroide / OVNI
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * (a.fugaz ? FUGAZ_POINTS : 1);
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < (a.fugaz ? FUGAZ_DROP : POWERUP_DROP))
          powerUps.push(new PowerUp(a.x, a.y));
        if (Math.random() < SHIELD_DROP)
          powerUps.push(new PowerUp(a.x, a.y, 'shield'));
      }
    }
    for (const e of enemies) {
      if (!e.dead && !b.dead && dist(b, e) < e.radius + b.radius) {
        b.dead = true;
        e.dead = true;
        score += ENEMY_POINTS;
        explode(e.x, e.y, 14);
        // El OVNI siempre suelta el escudo
        powerUps.push(new PowerUp(e.x, e.y, 'shield'));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  enemies   = enemies.filter(e => !e.dead);
  bullets   = bullets.filter(b => !b.dead);

  // Proyectil enemigo vs nave
  for (const b of enemyBullets) {
    if (b.dead || ship.dead || ship.invincible > 0) continue;
    if (dist(ship, b) < ship.radius + b.radius) {
      b.dead = true;
      if (ship.shield > 0) {
        // El escudo absorbe el impacto y se rompe
        ship.shield = 0;
        ship.invincible = Math.max(ship.invincible, 0.5);
        explode(b.x, b.y, 8);
      } else {
        killShip();
      }
    }
  }
  enemyBullets = enemyBullets.filter(b => !b.dead);

  // Nave vs asteroide / OVNI
  if (ship.invincible <= 0 && !ship.dead) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    if (!ship.dead) {
      for (const e of enemies) {
        if (dist(ship, e) < ship.radius + e.radius * 0.8) {
          killShip();
          break;
        }
      }
    }
  }

  // Nivel completado
  if (state === 'playing' && asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin  = SKINS[currentSkin];
  const SCALE = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(SCALE, SCALE);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2 / SCALE;
  ctx.lineJoin    = 'round';
  drawShipShape(skin);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 48;
  if (ship.speedBoost > 0) {
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`VELOCIDAD ${ship.speedBoost.toFixed(1)}s`, 14, hudY);
    ctx.fillStyle = '#fff';
    hudY += 22;
  }

  if (ship.shield > 0) {
    ctx.fillStyle = SHIELD_COLOR;
    ctx.fillText(`ESCUDO ${ship.shield.toFixed(1)}s`, 14, hudY);
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  ctx.textAlign = 'right';
  ctx.font      = '12px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`SKIN: ${SKINS[currentSkin].name} (S)`, W - 14, 46);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Aviso del nombre al cambiar de skin
  if (skinNotice > 0) {
    const alpha = Math.min(1, skinNotice / 0.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign   = 'center';
    ctx.font        = '14px monospace';
    ctx.fillStyle   = SKINS[currentSkin].stroke;
    ctx.fillText(SKINS[currentSkin].name.toUpperCase(), W / 2, 50);
    ctx.restore();
  }
}

function drawOverlay(title, sub, hint) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
  if (hint) {
    ctx.font      = '13px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(hint, W / 2, H / 2 + 52);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  enemies.forEach(e => e.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  enemyBullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay(
      'GAME OVER',
      `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`,
      'S / C: CAMBIAR SKIN'
    );
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSkin();
initGame();
requestAnimationFrame(loop);
