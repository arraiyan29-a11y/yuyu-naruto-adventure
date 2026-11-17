"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const bestScoreElement = document.getElementById("bestScore");
const menu = document.getElementById("menu");
const menuTitle = document.getElementById("menuTitle");
const menuText = document.getElementById("menuText");
const playButton = document.getElementById("play");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2500;
const FINISH_X = 2350;
const BEST_SCORE_KEY = "yuyu-naruto-adventure-best";

let score = 0;
let lives = 3;
let running = false;
let paused = false;
let camera = 0;
let keys = { left: false, right: false };
let coins = [];
let enemies = [];
let particles = [];
let animationFrame = 0;
let lastFrameTime = 0;
let gameTime = 0;

const player = {
  x: 60,
  y: 300,
  width: 32,
  height: 48,
  velocityX: 0,
  velocityY: 0,
  onGround: false,
  invulnerableFrames: 0,
};

const platforms = [
  { x: 0, y: 400, width: 600, height: 50 },
  { x: 680, y: 400, width: 450, height: 50 },
  { x: 1200, y: 400, width: 550, height: 50 },
  { x: 1800, y: 400, width: 700, height: 50 },
  { x: 180, y: 320, width: 120, height: 18 },
  { x: 400, y: 270, width: 130, height: 18 },
  { x: 750, y: 320, width: 120, height: 18 },
  { x: 1000, y: 260, width: 140, height: 18 },
  { x: 1350, y: 320, width: 140, height: 18 },
  { x: 1600, y: 270, width: 140, height: 18 },
  { x: 1950, y: 320, width: 150, height: 18 },
];

function loadBestScore() {
  try {
    const savedScore = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(savedScore) && savedScore > 0 ? savedScore : 0;
  } catch {
    return 0;
  }
}

let bestScore = loadBestScore();

function saveBestScore() {
  if (score <= bestScore) return;
  bestScore = score;
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  } catch {
    // The game remains playable when browser storage is unavailable.
  }
  updateStats();
}

function reset() {
  score = 0;
  lives = 3;
  camera = 0;
  gameTime = 0;
  particles = [];
  keys = { left: false, right: false };

  player.x = 60;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;
  player.invulnerableFrames = 0;

  coins = [
    { x: 220, y: 280 },
    { x: 440, y: 230 },
    { x: 780, y: 280 },
    { x: 1040, y: 220 },
    { x: 1390, y: 280 },
    { x: 1640, y: 230 },
    { x: 2000, y: 280 },
    { x: 2200, y: 350 },
  ];

  enemies = [
    { x: 500, y: 368, velocityX: 1.5, minX: 450, maxX: 600 },
    { x: 900, y: 368, velocityX: 1.5, minX: 800, maxX: 1100 },
    { x: 1450, y: 368, velocityX: 2, minX: 1300, maxX: 1700 },
  ];

  updateStats();
}

function updateStats() {
  scoreElement.textContent = String(score);
  livesElement.textContent = String(lives);
  bestScoreElement.textContent = String(bestScore);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#55b9f4");
  sky.addColorStop(0.72, "#b3edff");
  sky.addColorStop(1, "#e5f7df");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Distant hills add depth and drift at a slower rate than the level.
  ctx.fillStyle = "#91c9b0";
  ctx.beginPath();
  ctx.moveTo(0, 300);
  for (let x = 0; x <= WIDTH; x += 80) {
    const hillY = 270 + Math.sin((x + camera * 0.12) / 95) * 28;
    ctx.lineTo(x, hillY);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  for (let index = 0; index < 8; index += 1) {
    const x = ((index * 230 - camera * 0.4) % 1000 + 1000) % 1000;
    const y = 68 + Math.sin(gameTime * 0.025 + index) * 4;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 22, y - 5, 23, 0, Math.PI * 2);
    ctx.arc(x + 44, y + 2, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  if (player.invulnerableFrames > 0 && Math.floor(player.invulnerableFrames / 5) % 2 === 0) return;

  ctx.save();
  ctx.translate(player.x - camera, player.y);

  // Soft shadow gives the character a little depth.
  ctx.fillStyle = "#173c9140";
  ctx.beginPath();
  ctx.ellipse(17, 48, 17, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff791c";
  ctx.fillRect(5, 20, 25, 28);
  ctx.fillStyle = "#173c91";
  ctx.fillRect(5, 42, 9, 7);
  ctx.fillRect(22, 42, 9, 7);

  ctx.fillStyle = "#ffcf9e";
  ctx.fillRect(7, 5, 22, 20);
  ctx.fillStyle = "#ffd52b";
  ctx.beginPath();
  ctx.moveTo(5, 9);
  ctx.lineTo(0, 0);
  ctx.lineTo(10, 4);
  ctx.lineTo(13, -5);
  ctx.lineTo(19, 4);
  ctx.lineTo(27, -3);
  ctx.lineTo(30, 8);
  ctx.lineTo(34, 3);
  ctx.lineTo(29, 15);
  ctx.lineTo(7, 15);
  ctx.fill();

  ctx.fillStyle = "#344d8d";
  ctx.fillRect(6, 10, 25, 5);
  ctx.fillStyle = "#cbd9ef";
  ctx.fillRect(14, 10, 9, 5);
  ctx.fillStyle = "#171717";
  ctx.fillRect(11, 17, 3, 3);
  ctx.fillRect(23, 17, 3, 3);
  ctx.fillStyle = "#9c3825";
  ctx.fillRect(16, 22, 7, 2);

  ctx.strokeStyle = "#a85a3c";
  ctx.lineWidth = 1;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.moveTo(7, 19 + index * 3);
    ctx.lineTo(12, 20 + index * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorld() {
  drawBackground();

  platforms.forEach((platform) => {
    const x = platform.x - camera;
    ctx.fillStyle = "#217f37";
    ctx.fillRect(x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#48bd53";
    ctx.fillRect(x, platform.y, platform.width, Math.min(7, platform.height));
    ctx.fillStyle = "#8b542e";
    ctx.fillRect(x, platform.y + 12, platform.width, platform.height - 12);
  });

  coins.forEach((coin, index) => {
    const bob = Math.sin(gameTime * 0.09 + index * 1.7) * 4;
    const x = coin.x - camera;
    const y = coin.y + bob;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.ellipse(x, y, 9 + Math.abs(Math.sin(gameTime * 0.06 + index)) * 2, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff4a8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff9d6";
    ctx.fillRect(x - 1, y - 6, 2, 5);
  });

  enemies.forEach((enemy) => {
    const x = enemy.x - camera;
    ctx.fillStyle = "#57278140";
    ctx.beginPath();
    ctx.ellipse(x, enemy.y + 16, 17, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8b35ad";
    ctx.beginPath();
    ctx.arc(x, enemy.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 8, enemy.y - 5, 5, 6);
    ctx.fillRect(x + 4, enemy.y - 5, 5, 6);
    ctx.fillStyle = "#24133a";
    ctx.fillRect(x - 6, enemy.y - 3, 2, 3);
    ctx.fillRect(x + 6, enemy.y - 3, 2, 3);
  });

  ctx.fillStyle = "#352d35";
  ctx.fillRect(FINISH_X - camera, 285, 5, 115);
  ctx.fillStyle = "#ffdf30";
  ctx.beginPath();
  ctx.moveTo(FINISH_X + 5 - camera, 285);
  ctx.lineTo(FINISH_X + 52 - camera, 300);
  ctx.lineTo(FINISH_X + 5 - camera, 318);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff4a8";
  ctx.fillRect(FINISH_X + 11 - camera, 296, 12, 4);

  drawParticles();
}

function drawParticles() {
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x - camera, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function draw() {
  drawWorld();
  drawPlayer();
}

function burst(x, y, color, count = 10) {
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    const speed = 1 + Math.random() * 2.2;
    particles.push({
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      size: 2 + Math.random() * 2,
      color,
      life: 24 + Math.floor(Math.random() * 12),
      maxLife: 36,
    });
  }
}

function updateParticles() {
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.velocityY += 0.04;
    particle.life -= 1;
  });
}

function setMenu(title, text, buttonText) {
  menuTitle.textContent = title;
  menuText.textContent = text;
  playButton.textContent = buttonText;
  menu.hidden = false;
}

function respawn() {
  lives -= 1;
  updateStats();
  burst(player.x + player.width / 2, player.y + player.height / 2, "#ff8b4d", 16);

  if (lives <= 0) {
    gameOver();
    return;
  }

  player.x = Math.max(60, player.x - 100);
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;
  player.invulnerableFrames = 100;
}

function overlapsPlatform(platform) {
  return (
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x &&
    player.y < platform.y + platform.height &&
    player.y + player.height > platform.y
  );
}

function update() {
  gameTime += 1;
  if (player.invulnerableFrames > 0) player.invulnerableFrames -= 1;

  player.velocityX = Number(keys.right) * 4 - Number(keys.left) * 4;
  player.x += player.velocityX;

  platforms.forEach((platform) => {
    if (!overlapsPlatform(platform)) return;
    if (player.velocityX > 0) player.x = platform.x - player.width;
    if (player.velocityX < 0) player.x = platform.x + platform.width;
  });

  player.velocityY = Math.min(player.velocityY + 0.55, 12);
  const previousBottom = player.y + player.height;
  player.y += player.velocityY;
  player.onGround = false;

  platforms.forEach((platform) => {
    const overlapsHorizontally =
      player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop =
      previousBottom <= platform.y && player.y + player.height >= platform.y;

    if (overlapsHorizontally && crossedTop && player.velocityY >= 0) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.onGround = true;
    }
  });

  coins = coins.filter((coin) => {
    const collected =
      Math.abs(player.x + player.width / 2 - coin.x) < 22 &&
      Math.abs(player.y + player.height / 2 - coin.y) < 28;

    if (collected) {
      score += 10;
      saveBestScore();
      updateStats();
      burst(coin.x, coin.y, "#ffd700", 12);
      return false;
    }
    return true;
  });

  let hitEnemy = false;
  enemies.forEach((enemy) => {
    enemy.x += enemy.velocityX;
    if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
      enemy.velocityX *= -1;
      enemy.x += enemy.velocityX;
    }

    const touching =
      player.x + player.width > enemy.x - 15 &&
      player.x < enemy.x + 15 &&
      player.y + player.height > enemy.y - 15 &&
      player.y < enemy.y + 15;

    if (touching) hitEnemy = true;
  });

  updateParticles();

  if (hitEnemy && player.invulnerableFrames === 0) {
    respawn();
    if (!running) return;
  }

  if (player.y > HEIGHT + 80) {
    respawn();
    if (!running) return;
  }

  camera = Math.max(0, Math.min(player.x - 250, WORLD_WIDTH - WIDTH));

  if (player.x > FINISH_X) {
    winGame();
    return;
  }

  draw();
}

function gameOver() {
  running = false;
  paused = false;
  saveBestScore();
  setMenu("YUYU NARUTO ADVENTURE!", `Game over — final score: ${score}`, "PLAY AGAIN");
}

function winGame() {
  running = false;
  paused = false;
  saveBestScore();
  setMenu("🏆 YOU WIN!", `You reached the finish with ${score} points!`, "PLAY AGAIN");
}

function startGame() {
  reset();
  paused = false;
  running = true;
  lastFrameTime = 0;
  menu.hidden = true;
  if (!animationFrame) animationFrame = requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    keys = { left: false, right: false };
    setMenu("PAUSED", "Take a break! Your adventure is waiting.", "RESUME");
  } else {
    menu.hidden = true;
    lastFrameTime = 0;
  }
}

function gameLoop(timestamp) {
  animationFrame = 0;
  if (!running) return;

  if (!paused) {
    lastFrameTime = timestamp;
    update();
  }
  if (running) animationFrame = requestAnimationFrame(gameLoop);
}

function jump() {
  if (player.onGround && running && !paused) {
    player.velocityY = -11;
    player.onGround = false;
  }
}

playButton.addEventListener("click", () => {
  if (paused) {
    paused = false;
    menu.hidden = true;
    lastFrameTime = 0;
  } else {
    startGame();
  }
});

document.getElementById("pause").addEventListener("click", pauseGame);
document.getElementById("restart").addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", " "].includes(key)) event.preventDefault();
  if (key === "escape") {
    pauseGame();
    return;
  }
  if (key === "arrowleft" || key === "a") keys.left = true;
  if (key === "arrowright" || key === "d") keys.right = true;
  if (key === "arrowup" || key === " " || key === "w") jump();
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") keys.left = false;
  if (key === "arrowright" || key === "d") keys.right = false;
});

function holdButton(id, key) {
  const button = document.getElementById(id);
  const release = () => {
    keys[key] = false;
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys[key] = true;
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

holdButton("left", "left");
holdButton("right", "right");
document.getElementById("jump").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  jump();
});

reset();
draw();
