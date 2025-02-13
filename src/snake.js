const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const speedDisplay = document.getElementById('speed');
const timerDisplay = document.getElementById('timer');
const tacoDensityInput = document.getElementById('tacoDensity');
const diddyDensityInput = document.getElementById('diddyDensity');
const gridSizeInput = document.getElementById('gridSize');
const header = document.querySelector('header');

let gridSize = parseInt(gridSizeInput.value)
let snake = [{ x: 0, y: 0 }];
let tacos = [];
let diddys = [];
let score = 0;
let gameSpeed = 400
let gameInterval;
let timerInterval;
let startTime;
let tacoDensity;
let diddyDensity;
let gameStarted = false;
let gamePaused = false;
let dx = 1;
let dy = 0;
let babyOilImage = null
let diddyImage = null
let mouthImage = null
let tacoImage = null

function preloadImages() {
    tacoImage = new Image();
    tacoImage.src = 'taco.png';
    mouthImage = new Image();
    mouthImage.src = 'mouth.png';
    diddyImage = new Image();
    diddyImage.src = 'diddy.png';
    babyOilImage = new Image();
    babyOilImage.src = 'baby-oil.png';
}

function initializeGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tacoDensity = parseInt(tacoDensityInput.value);
    diddyDensity = parseInt(diddyDensityInput.value);
    score = 0;
    snake = [getRandomPosition()];
    dx = 1;
    dy = 0;
    gridSize = parseInt(gridSizeInput.value)
    numberOfSquares = canvas.width / gridSize * canvas.height / gridSize
    gameSpeed = 400
    gameStarted = true;
    startTime = Date.now();
    scoreDisplay.textContent = `Score: ${score}`;
    generateTacos();
    generateDiddys();
    drawTacos();
    drawDiddys();
}

function startGame() {
    resetSnakeTimer()
    startTimer();
}

function gameLoop() {
    const tacoEaten = moveSnake();
    checkCollision();
    if (!checkDiddyCollision()) {
        drawSnake();
    }

    if (tacoEaten) {
        clearTacos()
        clearDiddys()
        generateTacos();
        generateDiddys()
        drawTacos();
        drawDiddys();
        resetSnakeTimer()
    }
}

function toggleGamePaused() {
    if (!gameStarted) {
        initializeGame()
        startGame();

        return;
    }

    if (gamePaused) {
        gamePaused = false;
        startGame();
    } else {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        gamePaused = true;
    }
}

function changeDirection(key) {
    switch (key) {
        case 'ArrowUp':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
}

function generateTacos() {
    const numberOfTacos = Math.floor(numberOfSquares * tacoDensity / 100)

    tacos = [];
    for (let i = 0; i < numberOfTacos; i++) {
        tacos.push(getRandomPosition());
    }
}

function generateDiddys() {
    const numberOfDiddys = Math.floor(numberOfSquares * diddyDensity / 100)
    
    diddys = [];
    for (let i = 0; i < numberOfDiddys; i++) {
        const newDiddy = getRandomPosition();

        let collision = false;
        for (const taco of tacos) {
            if (newDiddy.x === taco.x && newDiddy.y === taco.y) {
                collision = true;
                break;
            }

            const head = snake[0];
            const positive = (dx + dy) > 0
            const offsetX = head.x + 3 * dx * gridSize
            const offsetY = head.y + 3 * dy * gridSize
        
            // console.log(`${dx}, ${dy}, +: ${positive}, head: ${head.x}, ${head.y}, offsetHead: ${offsetX}, ${offsetY}, diddy: ${newDiddy.x}, ${newDiddy.y}`)
            if (
                positive
                && (newDiddy.x >= head.x && newDiddy.x <= offsetX)
                && (newDiddy.y >= head.y && newDiddy.y <= offsetY)
            ) {
                collision = true;
                break;
            }

            if (
                !positive
                && (newDiddy.x <= head.x && newDiddy.x >= offsetX)
                && (newDiddy.y <= head.y && newDiddy.y >= offsetY)
            ) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            diddys.push(newDiddy);
        }
    }
}

function getRandomPosition() {
    const x = Math.floor(Math.random() * (canvas.width / gridSize));
    const y = Math.floor(Math.random() * (canvas.height / gridSize));

    return { x: x * gridSize, y: y * gridSize };
}

function drawTacos() {
    tacos.forEach(taco => {
        ctx.drawImage(tacoImage, taco.x, taco.y, gridSize, gridSize);
    });
}

function drawDiddys() {
    diddys.forEach(diddy => {
        ctx.drawImage(diddyImage, diddy.x, diddy.y, gridSize, gridSize);
    });
}

function clearTacos() {
    tacos.forEach(taco => {
        ctx.clearRect(taco.x, taco.y, gridSize, gridSize);
    });
}

function clearDiddys() {
    diddys.forEach(diddy => {
        ctx.clearRect(diddy.x, diddy.y, gridSize, gridSize);
    });
}

function clearSnakeTail() {
    const tail = snake[snake.length - 1]

    ctx.clearRect(tail.x, tail.y, gridSize, gridSize);
}

function drawSnake() {
    ctx.fillStyle = 'green';

    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (i === 0) {
            ctx.drawImage(mouthImage, segment.x, segment.y, gridSize, gridSize);
        } else {
            ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        }
    }
}

function moveSnake() {
    const head = { x: snake[0].x + dx * gridSize, y: snake[0].y + dy * gridSize };

    // Wrap around edges
    head.x = (head.x + canvas.width) % canvas.width;
    head.y = (head.y + canvas.height) % canvas.height;

    snake.unshift(head);

    if (checkTacoCollision(head)) {
        if (diddyDensity > tacoDensity) {
            score += (diddyDensity - tacoDensity);
        } else {
            score++
        }

        scoreDisplay.textContent = `Score: ${score}`;

        return true
    }

    clearSnakeTail()
    snake.pop();

    return false
}

function checkTacoCollision(head) {
    for (let i = 0; i < tacos.length; i++) {
        if (head.x === tacos[i].x && head.y === tacos[i].y) {
            tacos.splice(i, 1);
            return true;
        }
    }
    return false;
}

function checkDiddyCollision() {
    const head = snake[0];

    for (let i = 0; i < diddys.length; i++) {
        const diddyX = diddys[i].x
        const diddyY = diddys[i].y

        if (head.x === diddyX && head.y === diddyY) {
            ctx.clearRect(diddyX, diddyY, gridSize, gridSize);
            ctx.drawImage(babyOilImage, diddyX, diddyY, gridSize, gridSize);

            gameOver()

            return true;
        }
    }

    return false;
}

function checkCollision() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            gameOver();
        }
    }
}

function gameOver() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    gameStarted = false;
    alert(`Game Over! Your score is ${score}.`);
}

function startTimer() {
    timerInterval = setInterval(updateTimer, 1000);
}
function resetSnakeTimer() {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
    speedDisplay.textContent = `Speed: ${gameSpeed.toFixed(0)}`;

    gameSpeed *= 0.95
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = `Time: ${elapsedTime}`;
}

function adjustCanvasHeight() {
    const headerHeight = header.offsetHeight;
    // const availableHeight = canvas.height = window.innerHeight - headerHeight - 100;
    const availableHeight = window.innerHeight - headerHeight - 100;
    canvas.height = Math.floor(availableHeight / gridSize) * gridSize;
    canvas.width = Math.floor(window.innerWidth / gridSize) * gridSize;
}

preloadImages()

gridSizeInput.addEventListener('change', () => {
    gridSize = gridSizeInput.value
    adjustCanvasHeight()
})

window.addEventListener('load', adjustCanvasHeight);
window.addEventListener('resize', adjustCanvasHeight);
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        toggleGamePaused();
    } else if (gameStarted) {
        changeDirection(event.key);
    }
});

