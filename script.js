"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const menu = document.getElementById("menu");
const menuTitle = document.getElementById("menuTitle");
const menuText = document.getElementById("menuText");
const playButton = document.getElementById("play");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2500;
const FINISH_X = 2350;

let score = 0;
let lives = 3;
let running = false;
let paused = false;
let camera = 0;
let keys = { left: false, right: false };
let coins = [];
let enemies = [];
let animationFrame = 0;
let lastFrameTime = 0;

const player = {
  x: 60,
  y: 300,
  width: 32,
  height: 48,
  velocityX: 0,
  velocityY: 0,
  onGround: false,
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

function reset() {
  score = 0;
  lives = 3;
  camera = 0;
  keys = { left: false, right: false };

  player.x = 60;
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;

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
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x - camera, player.y);

  // Body and legs.
  ctx.fillStyle = "#ff791c";
  ctx.fillRect(5, 20, 25, 28);
  ctx.fillStyle = "#173c91";
  ctx.fillRect(5, 42, 9, 7);
  ctx.fillRect(22, 42, 9, 7);

  // Face and hair.
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

  // Headband, eyes, smile, and whisker marks.
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
  ctx.fillStyle = "#79d6ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Clouds scroll more slowly than the ground for a parallax effect.
  ctx.fillStyle = "#fff";
  for (let index = 0; index < 8; index += 1) {
    const x = ((index * 230 - camera * 0.4) % 1000 + 1000) % 1000;
    ctx.beginPath();
    ctx.arc(x, 75, 20, 0, Math.PI * 2);
    ctx.arc(x + 22, 70, 25, 0, Math.PI * 2);
    ctx.arc(x + 45, 77, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  platforms.forEach((platform) => {
    ctx.fillStyle = "#228b22";
    ctx.fillRect(platform.x - camera, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#8b542e";
    ctx.fillRect(
      platform.x - camera,
      platform.y + 12,
      platform.width,
      platform.height - 12,
    );
  });

  coins.forEach((coin) => {
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(coin.x - camera, coin.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff3a0";
    ctx.stroke();
  });

  enemies.forEach((enemy) => {
    ctx.fillStyle = "#8b35ad";
    ctx.beginPath();
    ctx.arc(enemy.x - camera, enemy.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(enemy.x - camera - 8, enemy.y - 5, 5, 6);
    ctx.fillRect(enemy.x - camera + 4, enemy.y - 5, 5, 6);
  });

  ctx.fillStyle = "#222";
  ctx.fillRect(FINISH_X - camera, 285, 5, 115);
  ctx.fillStyle = "#ffdf30";
  ctx.fillRect(FINISH_X + 5 - camera, 285, 45, 28);
}

function draw() {
  drawWorld();
  drawPlayer();
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

  if (lives <= 0) {
    gameOver();
    return;
  }

  player.x = Math.max(60, player.x - 100);
  player.y = 300;
  player.velocityX = 0;
  player.velocityY = 0;
  player.onGround = false;
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
  player.velocityX = Number(keys.right) * 4 - Number(keys.left) * 4;
  player.x += player.velocityX;

  // Resolve horizontal collisions.
  platforms.forEach((platform) => {
    if (!overlapsPlatform(platform)) return;
    if (player.velocityX > 0) player.x = platform.x - player.width;
    if (player.velocityX < 0) player.x = platform.x + platform.width;
  });

  player.velocityY = Math.min(player.velocityY + 0.55, 12);
  const previousBottom = player.y + player.height;
  player.y += player.velocityY;
  player.onGround = false;

  // Land only when falling onto the top of a platform.
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
      updateStats();
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

  if (hitEnemy) {
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
  setMenu("YUYU NARUTO ADVENTURE!", `Final Score: ${score}`, "PLAY AGAIN");
}

function winGame() {
  running = false;
  paused = false;
  setMenu("🏆 YOU WIN!", `Naruto reached the finish! Score: ${score}`, "PLAY AGAIN");
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
    setMenu("PAUSED", "Take a break!", "RESUME");
  } else {
    menu.hidden = true;
    lastFrameTime = 0;
  }
}

function gameLoop(timestamp) {
  animationFrame = 0;
  if (!running) return;

  if (!paused) {
    // Clamp frame time so returning to a background tab does not skip gameplay.
    const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 32) : 16;
    lastFrameTime = timestamp;
    if (elapsed >= 0) update();
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
