/**
 * Lyrian Chronicles - PixiJS Animated Background
 * Creates a dark, atmospheric background with floating particles
 */

/* exported BackgroundScene */
const BackgroundScene = (function() {
  let app = null;
  let particleTicker = null;
  let runeTicker = null;

  async function init() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.PIXI) {
      console.warn('PixiJS not available, skipping background');
      return;
    }

    try {
      app = new PIXI.Application();
      await app.init({
        view: canvas,
        resizeTo: window,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        preference: 'webgl'
      });

      // WebGL context loss/recovery handlers
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);

      createBackground();
      createParticles();
      createRunes();
    } catch(e) {
      console.warn('BackgroundScene init failed:', e.message);
    }
  }

  function createBackground() {
    if (!app || !app.stage) return;

    // Dark gradient background
    const graphics = new PIXI.Graphics();

    // Base dark fill
    graphics.rect(0, 0, app.screen.width, app.screen.height);
    graphics.fill({ color: 0x1a1a1a });

    // Subtle radial glow
    const gradient = new PIXI.Graphics();
    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2;
    const maxR = Math.max(app.screen.width, app.screen.height) * 0.6;

    // Create radial gradient using concentric circles
    for (let i = 20; i >= 0; i--) {
      const r = (maxR / 20) * i;
      const alpha = 0.03 * (1 - i / 20);
      gradient.circle(cx, cy, r);
      gradient.fill({ color: 0xc4a35a, alpha: alpha });
    }

    app.stage.addChild(graphics);
    app.stage.addChild(gradient);
  }

  function createParticles() {
    if (!app || !app.stage) return;

    const particleContainer = new PIXI.Container();
    app.stage.addChild(particleContainer);

    const particleCount = 60;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const size = Math.random() * 3 + 1;
      const particle = new PIXI.Graphics();
      particle.circle(0, 0, size);
      particle.fill({ color: 0xc4a35a, alpha: Math.random() * 0.4 + 0.1 });

      particle.x = Math.random() * app.screen.width;
      particle.y = Math.random() * app.screen.height;

      const data = {
        sprite: particle,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        baseAlpha: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2
      };

      particles.push(data);
      particleContainer.addChild(particle);
    }

    // Animate particles
    particleTicker = app.ticker.add((delta) => {
      const t = performance.now() * 0.001;
      particles.forEach((p) => {
        p.sprite.x += p.vx * delta;
        p.sprite.y += p.vy * delta;

        // Twinkle effect
        const twinkle = Math.sin(t * 2 + p.phase) * 0.15;
        p.sprite.alpha = Math.max(0.05, p.baseAlpha + twinkle);

        // Wrap around edges
        if (p.sprite.x < -10) p.sprite.x = app.screen.width + 10;
        if (p.sprite.x > app.screen.width + 10) p.sprite.x = -10;
        if (p.sprite.y < -10) p.sprite.y = app.screen.height + 10;
        if (p.sprite.y > app.screen.height + 10) p.sprite.y = -10;
      });
    });
  }

  function createRunes() {
    if (!app || !app.stage) return;

    const runeContainer = new PIXI.Container();
    app.stage.addChild(runeContainer);

    // Floating rune symbols
    const runes = ['\u2694', '\u2605', '\u25c6', '\u2726', '\u2b25', '\u2756', '\u2727', '\u22b9'];
    const runeSprites = [];

    for (let i = 0; i < 12; i++) {
      const text = new PIXI.Text({
        text: runes[Math.floor(Math.random() * runes.length)],
        style: {
          fontSize: Math.random() * 20 + 14,
          fill: 0xc4a35a,
          alpha: Math.random() * 0.15 + 0.05
        }
      });

      text.x = Math.random() * app.screen.width;
      text.y = Math.random() * app.screen.height;
      text.rotation = Math.random() * Math.PI * 2;

      const data = {
        sprite: text,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        floatSpeed: Math.random() * 0.2 + 0.05,
        phase: Math.random() * Math.PI * 2
      };

      runeSprites.push(data);
      runeContainer.addChild(text);
    }

    // Animate runes
    runeTicker = app.ticker.add((delta) => {
      const t = performance.now() * 0.001;
      runeSprites.forEach((r) => {
        r.sprite.rotation += r.rotationSpeed * delta;
        r.sprite.y -= r.floatSpeed * delta;

        // Gentle horizontal drift
        r.sprite.x += Math.sin(t + r.phase) * 0.1 * delta;

        // Wrap around
        if (r.sprite.y < -50) {
          r.sprite.y = app.screen.height + 50;
          r.sprite.x = Math.random() * app.screen.width;
        }
      });
    });
  }

  function destroy() {
    if (app) {
      // Explicitly remove ticker callbacks
      if (particleTicker) app.ticker.remove(particleTicker);
      if (runeTicker) app.ticker.remove(runeTicker);
      particleTicker = null;
      runeTicker = null;

      // Remove canvas event listeners
      const canvas = document.getElementById('bg-canvas');
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }

      app.destroy(true, { children: true, texture: true, baseTexture: true });
      app = null;
    }
  }

  // Store handler references for cleanup
  function handleContextLost(e) {
    e.preventDefault();
    console.warn('WebGL context lost — attempting recovery...');
  }
  function handleContextRestored() {
    console.log('WebGL context restored — rebuilding scene...');
    if (app && app.stage) {
      // Clear existing stage to prevent duplicate particles/runes/tickers
      app.stage.removeChildren();
      createBackground();
      createParticles();
      createRunes();
    }
  }

  return { init, destroy };
})();
