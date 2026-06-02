const backgroundCanvas = document.getElementById("backgroundCanvas");
const starsCanvas = document.getElementById("starsCanvas");
const milkyWayCanvas = document.getElementById("milkyWayCanvas");

if (backgroundCanvas && starsCanvas && milkyWayCanvas) {
  const Background = {
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    starsCtx: null,
    milkyWayCtx: null,
    width: 0,
    height: 0,
    stars: [],
    shootingStars: [],
    randomArray: [],
    hueArray: [],
    randomArrayLength: 1000,
    hueArrayLength: 1000,
    randomArrayIterator: 0,
    animationFrame: null,
    palette: null,

    constants: {
      sNumber: 220,
      sSize: 0.3,
      sSizeR: 0.6,
      sAlphaR: 0.42,
      sMaxHueProportion: 0.6,
      shootingStarDensity: 0.0022,
      shootingStarBaseXspeed: 12,
      shootingStarBaseYspeed: 6,
      shootingStarBaseLength: 8,
      shootingStarBaseLifespan: 60,
      mwStarCount: 2400,
      mwRandomStarProp: 0.2,
      mwClusterCount: 24,
      mwClusterStarCount: 140,
      mwClusterSize: 110,
      mwClusterSizeR: 70,
      mwClusterLayers: 8,
      mwAngle: 0.6,
    },

    init() {
      this.starsCtx = starsCanvas.getContext("2d");
      this.milkyWayCtx = milkyWayCanvas.getContext("2d");
      this.updateDensity();
      this.updatePalette();
      this.resize();
      this.buildRandomArray();
      this.buildHueArray();
      this.buildStars();
      this.drawMilkyWay();
      this.animate();
      this.attachListeners();
    },

    attachListeners() {
      window.addEventListener("resize", () => {
        this.updateDensity();
        this.resize();
        this.buildRandomArray();
        this.buildHueArray();
        this.buildStars();
        this.drawMilkyWay();
      });

      const observer = new MutationObserver(() => {
        this.updatePalette();
        this.buildHueArray();
        this.buildStars();
        this.drawMilkyWay();
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    },

    currentTheme() {
      return document.documentElement.getAttribute("data-theme") === "light" || document.body.classList.contains("lightmode")
        ? "light"
        : "dark";
    },

    updateDensity() {
      if (window.matchMedia("(max-width: 768px)").matches) {
        this.constants.sNumber = 130;
        this.constants.mwStarCount = 1200;
        this.constants.mwClusterCount = 14;
        this.constants.mwClusterStarCount = 80;
      } else {
        this.constants.sNumber = 220;
        this.constants.mwStarCount = 2400;
        this.constants.mwClusterCount = 24;
        this.constants.mwClusterStarCount = 140;
      }
    },

    updatePalette() {
      if (this.currentTheme() === "light") {
        this.palette = {
          backgroundA: "#dfe8e3",
          backgroundB: "#c4d6d6",
          starHueMin: 205,
          starHueMax: 260,
          starLightness: 56,
          shootingStarColors: ["#6ca8ff", "#7ec8ff", "#a999ff", "#ffb17c"],
          mwHueMin: 205,
          mwHueMax: 280,
          mwWhiteMin: 54,
          mwWhiteMax: 68,
          mwAlphaBoost: 0.018,
        };
      } else {
        this.palette = {
          backgroundA: "#100826",
          backgroundB: "#060212",
          starHueMin: 0,
          starHueMax: 270,
          starLightness: 85,
          shootingStarColors: ["#a1ffba", "#a1d2ff", "#fffaa1", "#ffa1a1"],
          mwHueMin: 150,
          mwHueMax: 300,
          mwWhiteMin: 50,
          mwWhiteMax: 65,
          mwAlphaBoost: 0.01,
        };
      }

      backgroundCanvas.style.background = `radial-gradient(${this.palette.backgroundA}, ${this.palette.backgroundB})`;
    },

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;

      [starsCanvas, milkyWayCanvas].forEach((canvas) => {
        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;
      });

      this.starsCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.milkyWayCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.starsCtx.scale(this.dpr, this.dpr);
      this.milkyWayCtx.scale(this.dpr, this.dpr);
    },

    buildRandomArray() {
      this.randomArray = [];
      for (let i = 0; i < this.randomArrayLength; i += 1) {
        this.randomArray[i] = Math.random();
      }
      this.randomArrayIterator = 0;
    },

    buildHueArray() {
      this.hueArray = [];
      for (let i = 0; i < this.hueArrayLength; i += 1) {
        this.hueArray[i] = Math.floor(
          this.palette.starHueMin +
          Math.random() * (this.palette.starHueMax - this.palette.starHueMin)
        );
      }
    },

    buildStars() {
      this.stars = [];
      this.shootingStars = [];

      for (let i = 0; i < this.constants.sNumber; i += 1) {
        const size = Math.random() * this.constants.sSizeR + this.constants.sSize;
        const x = Math.random() * (this.width - size * 4) + size * 2;
        const y = Math.random() * (this.height - size * 4) + size * 2;
        this.stars.push(new Star(x, y, size, this));
      }
    },

    milkyWayX() {
      return Math.floor(Math.random() * this.width);
    },

    milkyWayYFromX(xPos, mode) {
      const offset = ((this.width / 2) - xPos) * this.constants.mwAngle;
      if (mode === "star") {
        return Math.floor(
          Math.pow(Math.random(), 1.2) * this.height * (Math.random() - 0.5) +
          this.height / 2 +
          (Math.random() - 0.5) * 100
        ) + offset;
      }

      return Math.floor(
        Math.pow(Math.random(), 1.5) * this.height * 0.6 * (Math.random() - 0.5) +
        this.height / 2 +
        (Math.random() - 0.5) * 100
      ) + offset;
    },

    drawMilkyWay() {
      this.milkyWayCtx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.constants.mwStarCount; i += 1) {
        this.milkyWayCtx.beginPath();
        const xPos = this.milkyWayX();
        const yPos = Math.random() < this.constants.mwRandomStarProp
          ? Math.floor(Math.random() * this.height)
          : this.milkyWayYFromX(xPos, "star");
        const size = Math.random() * 0.27;
        const alpha = 0.24 + Math.random() * 0.36;
        this.milkyWayCtx.arc(xPos, yPos, size, 0, Math.PI * 2, false);
        this.milkyWayCtx.fillStyle = `hsla(0,100%,100%,${alpha})`;
        this.milkyWayCtx.fill();
      }

      for (let i = 0; i < this.constants.mwClusterCount; i += 1) {
        const xPos = this.milkyWayX();
        const yPos = this.milkyWayYFromX(xPos, "cluster");
        const distToCenter =
          (1 - Math.abs(xPos - this.width / 2) / (this.width / 2)) *
          (1 - Math.abs(yPos - this.height / 2) / (this.height / 2));
        const size = this.constants.mwClusterSize + Math.random() * this.constants.mwClusterSizeR;
        const hue = this.palette.mwHueMin + Math.floor(
          (Math.random() * 0.5 + distToCenter * 0.5) * (this.palette.mwHueMax - this.palette.mwHueMin)
        );
        const baseWhiteProportion = this.palette.mwWhiteMin + Math.random() * (this.palette.mwWhiteMax - this.palette.mwWhiteMin);
        new MwStarCluster(xPos, yPos, size, hue, baseWhiteProportion, distToCenter, this).draw();
      }
    },

    animate() {
      this.animationFrame = requestAnimationFrame(() => this.animate());
      this.starsCtx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.stars.length; i += 1) {
        this.stars[i].update();
      }

      if (this.randomArray[this.randomArrayIterator] < this.constants.shootingStarDensity) {
        const posX = Math.floor(Math.random() * this.width);
        const posY = Math.floor(Math.random() * Math.min(150, this.height * 0.25));
        const speedX = (Math.random() - 0.5) * this.constants.shootingStarBaseXspeed;
        const speedY = Math.random() * this.constants.shootingStarBaseYspeed;
        const color = this.palette.shootingStarColors[Math.floor(Math.random() * this.palette.shootingStarColors.length)];
        this.shootingStars.push(new ShootingStar(posX, posY, speedX, speedY, color, this));
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i -= 1) {
        if (this.shootingStars[i].goingOut()) {
          this.shootingStars.splice(i, 1);
        } else {
          this.shootingStars[i].update();
        }
      }

      this.randomArrayIterator = this.randomArrayIterator + 1 >= this.randomArrayLength ? 0 : this.randomArrayIterator + 1;
    },
  };

  class Star {
    constructor(x, y, size, scene) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.size = size;
      this.alpha = size / (scene.constants.sSize + scene.constants.sSizeR);
      this.baseHue = scene.hueArray[Math.floor(Math.random() * scene.hueArrayLength)];
      this.baseHueProportion = Math.random() * scene.constants.sMaxHueProportion;
      this.randomIndexA = Math.floor(Math.random() * scene.randomArrayLength);
      this.randomIndexH = this.randomIndexA;
      this.randomValue = scene.randomArray[this.randomIndexA];
    }

    draw() {
      const ctx = this.scene.starsCtx;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      const rAlpha = Math.max(
        0.1,
        this.alpha + Math.min((this.randomValue - 0.5) * this.scene.constants.sAlphaR, 1)
      );
      const rHue = this.scene.randomArray[this.randomIndexH] > this.baseHueProportion
        ? this.scene.hueArray[this.randomIndexA]
        : this.baseHue;
      ctx.fillStyle = `hsla(${rHue},100%,${this.scene.palette.starLightness}%,${rAlpha})`;
      ctx.fill();
    }

    update() {
      this.randomIndexH = this.randomIndexA;
      this.randomIndexA = this.randomIndexA >= this.scene.randomArrayLength - 1 ? 0 : this.randomIndexA + 1;
      this.randomValue = this.scene.randomArray[this.randomIndexA];
      this.draw();
    }
  }

  class ShootingStar {
    constructor(x, y, speedX, speedY, color, scene) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.speedX = speedX;
      this.speedY = speedY;
      this.framesLeft = scene.constants.shootingStarBaseLifespan;
      this.color = color;
    }

    goingOut() {
      return this.framesLeft <= 0;
    }

    ageModifier() {
      const halfLife = this.scene.constants.shootingStarBaseLifespan / 2;
      return Math.pow(1 - Math.abs(this.framesLeft - halfLife) / halfLife, 2);
    }

    draw() {
      const ctx = this.scene.starsCtx;
      const am = this.ageModifier();
      const endX = this.x - this.speedX * this.scene.constants.shootingStarBaseLength * am;
      const endY = this.y - this.speedY * this.scene.constants.shootingStarBaseLength * am;
      const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
      gradient.addColorStop(0, "#fff");
      gradient.addColorStop(Math.min(am, 0.7), this.color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    update() {
      this.framesLeft -= 1;
      this.x += this.speedX;
      this.y += this.speedY;
      this.draw();
    }
  }

  class MwStarCluster {
    constructor(x, y, size, hue, baseWhiteProportion, brightnessModifier, scene) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.hue = hue;
      this.baseWhiteProportion = baseWhiteProportion;
      this.brightnessModifier = brightnessModifier;
      this.scene = scene;
    }

    draw() {
      const ctx = this.scene.milkyWayCtx;
      const starsPerLayer = Math.floor(this.scene.constants.mwClusterStarCount / this.scene.constants.mwClusterLayers);

      for (let layer = 1; layer < this.scene.constants.mwClusterLayers; layer += 1) {
        const layerRadius = (this.size * layer) / this.scene.constants.mwClusterLayers;
        for (let i = 1; i < starsPerLayer; i += 1) {
          const posX = this.x + 2 * layerRadius * (Math.random() - 0.5);
          const distance = Math.max(Math.pow(layerRadius, 2) - Math.pow(this.x - posX, 2), 0);
          const posY = this.y + 2 * Math.sqrt(distance) * (Math.random() - 0.5);
          const size = 0.05 + Math.random() * 0.15;
          const alpha = 0.18 + Math.random() * 0.3;
          const whitePercentage =
            this.baseWhiteProportion +
            15 +
            15 * this.brightnessModifier +
            Math.floor(Math.random() * 10);
          ctx.beginPath();
          ctx.arc(posX, posY, size, 0, Math.PI * 2, false);
          ctx.fillStyle = `hsla(${this.hue},100%,${whitePercentage}%,${alpha})`;
          ctx.fill();
        }
      }

      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      gradient.addColorStop(0, `hsla(${this.hue},100%,${this.baseWhiteProportion}%,0.002)`);
      gradient.addColorStop(
        0.25,
        `hsla(${this.hue},100%,${this.baseWhiteProportion + 30}%,${0.008 + this.scene.palette.mwAlphaBoost + 0.006 * this.brightnessModifier})`
      );
      gradient.addColorStop(0.4, `hsla(${this.hue},100%,${this.baseWhiteProportion + 15}%,0.004)`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  Background.init();
}
