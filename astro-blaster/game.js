(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const menu = document.getElementById('menu');
  const gameOverScreen = document.getElementById('game-over');
  const leaderboardScreen = document.getElementById('leaderboard');
  const finalScoreEl = document.getElementById('finalScore');
  const leaderboardList = document.getElementById('leaderboardList');

  const startBtn = document.getElementById('startBtn');
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  const restartBtn = document.getElementById('restartBtn');
  const menuBtn = document.getElementById('menuBtn');
  const backBtn = document.getElementById('backBtn');

  // Game state variables
  let running = false;
  let score = 0;
  let animationFrameId = null;

  // Dummy game variables (replace with your game logic)
  let player = { x: 400, y: 550, width: 50, height: 50, speed: 5 };
  let bullets = [];
  let enemies = [];
  let keysPressed = {};

  // Controls - Keyboard & Touch
  function setupControls() {
    window.addEventListener('keydown', e => {
      keysPressed[e.key.toLowerCase()] = true;
      // Prevent arrow keys from scrolling page
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => {
      keysPressed[e.key.toLowerCase()] = false;
    });

    // Touch controls (basic)
    let touchX = null;
    canvas.addEventListener('touchstart', e => {
      const touch = e.touches[0];
      touchX = touch.clientX;
      e.preventDefault();
    });
    canvas.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      let deltaX = touch.clientX - touchX;
      player.x += deltaX;
      if (player.x < 0) player.x = 0;
      if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
      touchX = touch.clientX;
      e.preventDefault();
    });
    canvas.addEventListener('touchend', e => {
      touchX = null;
      e.preventDefault();
    });
  }

  // Game functions
  function startGame() {
    menu.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    score = 0;
    bullets = [];
    enemies = [];
    player.x = canvas.width / 2 - player.width / 2;
    running = true;

    spawnEnemies();
    gameLoop();
  }

  function restartGame() {
    startGame();
  }

  function goToMenu() {
    running = false;
    menu.classList.remove('hidden');
    leaderboardScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    cancelAnimationFrame(animationFrameId);
  }

  function spawnEnemies() {
    enemies = [];
    for(let i=0; i<5; i++) {
      enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: Math.random() * 150,
        width: 40,
        height: 40,
        speed: 1 + Math.random()*2,
        direction: 1
      });
    }
  }

  function shoot() {
    bullets.push({ x: player.x + player.width/2 - 5, y: player.y, width: 10, height: 20, speed: 8 });
  }

  // Collision check
  function isColliding(a,b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
  }

  // Leaderboard functions (localStorage)
  function saveScore(score) {
    let scores = JSON.parse(localStorage.getItem('astroBlasterScores') || '[]');
    scores.push(score);
    scores.sort((a,b) => b - a);
    if(scores.length > 10) scores.length = 10;
    localStorage.setItem('astroBlasterScores', JSON.stringify(scores));
  }

  function showLeaderboard() {
    menu.classList.add('hidden');
    leaderboardScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');

    leaderboardList.innerHTML = '';
    let scores = JSON.parse(localStorage.getItem('astroBlasterScores') || '[]');
    if(scores.length === 0) {
      leaderboardList.innerHTML = '<li>No scores yet</li>';
    } else {
      scores.forEach((sc,i) => {
        leaderboardList.innerHTML += `<li>#${i+1}: ${sc}</li>`;
      });
    }
  }

  // Game loop
  function gameLoop() {
    if (!running) return;
    update();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // Update game state
  function update() {
    // Player movement
    if(keysPressed['arrowleft'] || keysPressed['a']) {
      player.x -= player.speed;
      if(player.x < 0) player.x = 0;
    }
    if(keysPressed['arrowright'] || keysPressed['d']) {
      player.x += player.speed;
      if(player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    }
    // Shoot bullet (space or up arrow)
    if(keysPressed[' '] || keysPressed['arrowup']) {
      if(canShoot) {
        shoot();
        canShoot = false;
      }
    } else {
      canShoot = true;
    }

    // Update bullets
    bullets = bullets.filter(b => b.y + b.height > 0);
    bullets.forEach(b => b.y -= b.speed);

    // Update enemies
    enemies.forEach(enemy => {
      enemy.x += enemy.speed * enemy.direction;
      if(enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
        enemy.direction *= -1;
        enemy.y += enemy.height/2;
      }
    });

    // Bullet-enemy collisions
    bullets.forEach((b, bi) => {
      enemies.forEach((e, ei) => {
        if(isColliding(b,e)) {
          bullets.splice(bi,1);
          enemies.splice(ei,1);
          score += 10;
          enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: Math.random() * 100,
            width: 40,
            height: 40,
            speed: 1 + Math.random()*2,
            direction: 1
          });
        }
      });
    });

    // Enemy-player collision
    enemies.forEach(e => {
      if(isColliding(e, player)) {
        gameOver();
      }
      if(e.y + e.height > canvas.height) {
        gameOver();
      }
    });
  }

  // Draw game objects
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Bullets
    ctx.fillStyle = '#FFD700';
    bullets.forEach(b => {
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Enemies
    ctx.fillStyle = '#FF4500';
    enemies.forEach(e => {
      ctx.fillRect(e.x, e.y, e.width, e.height);
    });

    // Score display
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
  }

  // Game over
  function gameOver() {
    running = false;
    cancelAnimationFrame(animationFrameId);
    saveScore(score);
    finalScoreEl.textContent = `Your Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
  }

  // Variables to prevent continuous shooting on key hold
  let canShoot = true;

  // Button event listeners
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restartGame);
  menuBtn.addEventListener('click', goToMenu);
  leaderboardBtn.addEventListener('click', showLeaderboard);
  backBtn.addEventListener('click', goToMenu);

  setupControls();

  goToMenu();
})();
