// Получаем доступ к канвасу
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Устанавливаем размеры игрового поля
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.6;

// Загрузка изображений
const heroImg = new Image();
heroImg.src = 'images/hero.png';

const workImg = new Image();
workImg.src = 'images/work.png';

const tripImg = new Image();
tripImg.src = 'images/trip.png';

const wineImg = new Image();
wineImg.src = 'images/wine.png';

// Переменные игры
let player = {
    x: 50,
    y: canvas.height - 100,
    targetY: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 5
};

let obstacles = [];
let bonuses = [];
let score = 0;
let isGameOver = false;
let tripCount = 0;
let wineCount = 0;
let lastObstacleTime = 0;
let lastBonusTime = 0;
let objectOrder = ['work', 'trip', 'wine'];
let nextObjectIndex = 0;
let celebrationStartTime = null;

const obstacleInterval = 2000;
const bonusInterval = 2000;
const celebrationDuration = 2000; // Продолжительность показа праздничной надписи

// Функции для отрисовки объектов
function drawPlayer() {
    ctx.drawImage(heroImg, player.x, player.y, player.width, player.height);
}

function createObstacle() {
    const height = 100;
    const yPosition = nextObjectIndex === 0 ? canvas.height - height : 0;

    obstacles.push({
        x: canvas.width,
        y: yPosition,
        width: 50,
        height: height
    });

    nextObjectIndex = (nextObjectIndex + 1) % objectOrder.length;
}

function createBonus() {
    const bonusType = objectOrder[nextObjectIndex];
    const yPosition = bonusType === 'trip' ? canvas.height / 3 : canvas.height / 1.5;

    const bonus = {
        x: canvas.width,
        y: yPosition,
        size: 30,
        type: bonusType
    };

    bonuses.push(bonus);
    nextObjectIndex = (nextObjectIndex + 1) % objectOrder.length;
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= 3;

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
        } else if (collision(player, obstacle)) {
            isGameOver = true;
        }
    }
}

function updateBonuses() {
    for (let i = bonuses.length - 1; i >= 0; i--) {
        const bonus = bonuses[i];
        bonus.x -= 3;

        if (bonus.x + bonus.size < 0) {
            bonuses.splice(i, 1);
        } else if (collision(player, bonus)) {
            if (bonus.type === 'trip') {
                score += 10;
                tripCount += 1;
            } else if (bonus.type === 'wine') {
                score += 20;
                wineCount += 1;
            }
            bonuses.splice(i, 1);  // Удаление бонуса при столкновении
        }
    }
}

function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function updatePlayer() {
    if (player.y < player.targetY) {
        player.y += player.speed;
        if (player.y > player.targetY) player.y = player.targetY;
    } else if (player.y > player.targetY) {
        player.y -= player.speed;
        if (player.y < player.targetY) player.y = player.targetY;
    }
}

function handleInput(event) {
    if (isGameOver && event.key === ' ') {
        restartGame();
    } else if (event.key === 'ArrowUp') {
        player.targetY = 0;
    } else if (event.key === 'ArrowDown') {
        player.targetY = canvas.height - player.height;
    }
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Trips: ${tripCount}`, 10, 60);
    ctx.fillText(`Wines: ${wineCount}`, 10, 90);
}

function drawBonuses() {
    bonuses.forEach(bonus => {
        const img = bonus.type === 'trip' ? tripImg : wineImg;
        ctx.drawImage(img, bonus.x, bonus.y, bonus.size, bonus.size);
    });
}

function drawCelebration() {
    if (celebrationStartTime !== null) {
        const elapsedTime = performance.now() - celebrationStartTime;
        if (elapsedTime < celebrationDuration) {
            ctx.fillStyle = 'gold';
            ctx.font = '40px Arial';
            ctx.fillText('С днем рождения!', canvas.width / 2 - 150, canvas.height / 2);
        } else {
            celebrationStartTime = null; // Сброс времени празднования
        }
    }
}

function restartGame() {
    player.y = canvas.height - player.height;
    player.targetY = canvas.height - player.height;
    obstacles = [];
    bonuses = [];
    score = 0;
    isGameOver = false;
    celebrationStartTime = null;
}

function gameLoop(timestamp) {
    if (isGameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    updatePlayer();

    if (timestamp - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = timestamp;
    }

    if (timestamp - lastBonusTime > bonusInterval) {
        createBonus();
        lastBonusTime = timestamp;
    }

    updateObstacles();
    updateBonuses();

    obstacles.forEach(obstacle => {
        ctx.drawImage(workImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    drawBonuses();
    drawUI();
    drawCelebration();

    if (score > 0 && score % 1000 === 0 && celebrationStartTime === null) {
        celebrationStartTime = performance.now();
    }

    score += 1;

    requestAnimationFrame(gameLoop);
}

// Обработчик ввода
function handleTap(event) {
    const tapY = event.touches ? event.touches[0].clientY : event.clientY;
    if (tapY < canvas.height / 2) {
        player.targetY = 0;  // Переключение на верхнюю часть экрана
    } else {
        player.targetY = canvas.height - player.height;  // Переключение на нижнюю часть экрана
    }
}

document.addEventListener('keydown', handleInput);
document.addEventListener('touchstart', handleTap);
document.addEventListener('click', handleTap);

// Запуск игры
gameLoop(0);
