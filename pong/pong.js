//board
let board;
let boardWidth = 800;
let boardHeight = 400;
let context; 

//players
let playerWidth = 10;
let playerHeight = 50;
let playerVelocityY = 0;
let playerSpeed = 5; // Vitesse de déplacement

// Ajout de la gestion des touches
let keys = {
    w: false,
    s: false,
    arrowUp: false,
    arrowDown: false
};

// Variables de gestion du jeu
let gameState = "waiting"; // "waiting", "countdown", "playing", "gameOver"
let countdownValue = 3;
let countdownTimer = 0;
let winScore = 5; // Score pour gagner
let winner = "";

let player1 = {
    x : 10,
    y : boardHeight/2 - playerHeight/2, // Centrer correctement
    width: playerWidth,
    height: playerHeight,
    velocityY : 0
}

let player2 = {
    x : boardWidth - playerWidth - 10,
    y : boardHeight/2 - playerHeight/2, // Centrer correctement
    width: playerWidth,
    height: playerHeight,
    velocityY : 0
}

//ball
let ballWidth = 10;
let ballHeight = 10;
let initialBallSpeedX = 2; // Vitesse initiale X
let initialBallSpeedY = 3; // Vitesse initiale Y
let speedIncrease = 0.2; // Augmentation de vitesse à chaque rebond 0.1 facile 0.5 dur

let ball = {
    x : boardWidth/2,
    y : boardHeight/2,
    width: ballWidth,
    height: ballHeight,
    velocityX : initialBallSpeedX,
    velocityY : initialBallSpeedY
}

let player1Score = 0;
let player2Score = 0;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    //draw initial player1
    context.fillStyle="skyblue";
    context.fillRect(player1.x, player1.y, playerWidth, playerHeight);

    requestAnimationFrame(update);
    
    // Gestion des événements clavier
    document.addEventListener("keydown", function(e) {
        switch(e.code) {
            case "KeyW":
                if (gameState === "playing") keys.w = true;
                break;
            case "KeyS":
                if (gameState === "playing") keys.s = true;
                break;
            case "ArrowUp":
                if (gameState === "playing") keys.arrowUp = true;
                break;
            case "ArrowDown":
                if (gameState === "playing") keys.arrowDown = true;
                break;
            case "Space":
                e.preventDefault();
                if (gameState === "waiting" || gameState === "gameOver") {
                    startCountdown();
                }
                break;
        }
    });
    
    document.addEventListener("keyup", function(e) {
        switch(e.code) {
            case "KeyW":
                keys.w = false;
                break;
            case "KeyS":
                keys.s = false;
                break;
            case "ArrowUp":
                keys.arrowUp = false;
                break;
            case "ArrowDown":
                keys.arrowDown = false;
                break;
        }
    });
}

function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    // Dessiner le terrain de football
    drawFootballField();

    // Afficher les paddles
    context.fillStyle = "skyblue";
    context.fillRect(player1.x, player1.y, playerWidth, playerHeight);
    context.fillRect(player2.x, player2.y, playerWidth, playerHeight);

    // Afficher le score
    context.font = "45px sans-serif";
    context.fillStyle = "white";
    context.fillText(player1Score, boardWidth/5, 45);
    context.fillText(player2Score, boardWidth*4/5 - 45, 45);

    // Gérer les différents états du jeu
    if (gameState === "waiting") {
        drawWaitingMessage();
        // Afficher la balle statique
        context.fillStyle = "white";
        context.fillRect(ball.x, ball.y, ballWidth, ballHeight);
    }
    else if (gameState === "countdown") {
        updateCountdown();
        drawCountdown();
        // Afficher la balle statique
        context.fillStyle = "white";
        context.fillRect(ball.x, ball.y, ballWidth, ballHeight);
    }
    else if (gameState === "playing") {
        updateGameplay();
    }
    else if (gameState === "gameOver") {
        drawGameOver();
        // Afficher la balle statique
        context.fillStyle = "white";
        context.fillRect(ball.x, ball.y, ballWidth, ballHeight);
    }
}

function outOfBounds(yPosition) {
    let borderSize = 5; // Taille de la bordure bleue définie dans pong.css
    return (yPosition < borderSize || yPosition + playerHeight > boardHeight - borderSize);
}

// Nouvelle fonction pour le mouvement fluide
function updatePlayerMovement() {
    // Player 1 movement
    if (keys.w) {
        let nextY = player1.y - playerSpeed;
        if (!outOfBounds(nextY)) {
            player1.y = nextY;
        }
    }
    if (keys.s) {
        let nextY = player1.y + playerSpeed;
        if (!outOfBounds(nextY)) {
            player1.y = nextY;
        }
    }
    
    // Player 2 movement
    if (keys.arrowUp) {
        let nextY = player2.y - playerSpeed;
        if (!outOfBounds(nextY)) {
            player2.y = nextY;
        }
    }
    if (keys.arrowDown) {
        let nextY = player2.y + playerSpeed;
        if (!outOfBounds(nextY)) {
            player2.y = nextY;
        }
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}

function startCountdown() {
    gameState = "countdown";
    countdownValue = 3;
    countdownTimer = 0;

    // Remettre les scores à 0 ici quand on lance une nouvelle partie
    player1Score = 0;
    player2Score = 0
    
    // Réinitialiser la balle
    ball.x = boardWidth/2;
    ball.y = boardHeight/2;
    ball.velocityX = initialBallSpeedX;
    ball.velocityY = initialBallSpeedY;
}

function updateCountdown() {
    countdownTimer++;
    if (countdownTimer >= 60) { // 1 seconde à 60 FPS
        countdownValue--;
        countdownTimer = 0;
        
        if (countdownValue <= 0) {
            gameState = "playing";
        }
    }
}

function drawCountdown() {
    context.fillStyle = "red";
    context.font = "72px sans-serif";
    context.textAlign = "center";
    
    if (countdownValue > 0) {
        context.fillText(countdownValue, boardWidth / 2, boardHeight / 2 + 20);
    } else {
        context.fillText("GO!", boardWidth / 2, boardHeight / 2 + 20);
    }
    
    context.textAlign = "left"; // Reset alignment
}

function drawWaitingMessage() {
    context.fillStyle = "white";
    context.font = "30px sans-serif";
    context.textAlign = "center";
    context.fillText("Appuyez sur ESPACE pour commencer", boardWidth / 2, boardHeight / 2 + 100);
    context.textAlign = "left";
}

function drawGameOver() {
    context.fillStyle = "yellow";
    context.font = "48px sans-serif";
    context.textAlign = "center";
    context.fillText(`${winner} GAGNE!`, boardWidth / 2, boardHeight / 2 - 50);
    
    context.fillStyle = "white";
    context.font = "24px sans-serif";
    context.fillText("Appuyez sur ESPACE pour rejouer", boardWidth / 2, boardHeight / 2 + 50);
    context.textAlign = "left";
}

function updateGameplay() {
    // Mouvement fluide des paddles
    updatePlayerMovement();

    // ball
    context.fillStyle = "white";
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    context.fillRect(ball.x, ball.y, ballWidth, ballHeight);

    if (ball.y <= 5 || (ball.y + ballHeight >= boardHeight - 5)) { 
        ball.velocityY *= -1;
    }

    //bounce the ball back
    if (detectCollision(ball, player1)) {
        if (ball.x <= player1.x + player1.width) {
            ball.velocityX *= -1;
            
            // Augmenter la vitesse après rebond
            if (ball.velocityX > 0) {
                ball.velocityX += speedIncrease;
            } else {
                ball.velocityX -= speedIncrease;
            }
            
            if (ball.velocityY > 0) {
                ball.velocityY += speedIncrease * 0.5;
            } else {
                ball.velocityY -= speedIncrease * 0.5;
            }
        }
    }
    else if (detectCollision(ball, player2)) {
        if (ball.x + ballWidth >= player2.x) {
            ball.velocityX *= -1;
            
            // Augmenter la vitesse après rebond
            if (ball.velocityX > 0) {
                ball.velocityX += speedIncrease;
            } else {
                ball.velocityX -= speedIncrease;
            }
            
            if (ball.velocityY > 0) {
                ball.velocityY += speedIncrease * 0.5;
            } else {
                ball.velocityY -= speedIncrease * 0.5;
            }
        }
    }

    //game over ou point marqué
    if (ball.x < 0) {
        player2Score++;
        checkWinner();
    }
    else if (ball.x + ballWidth > boardWidth) {
        player1Score++;
        checkWinner();
    }
}

function checkWinner() {
    if (player1Score >= winScore) {
        winner = "JOUEUR 1";
        gameState = "gameOver";
    } else if (player2Score >= winScore) {
        winner = "JOUEUR 2";
        gameState = "gameOver";
    } else {
        // Continuer le jeu directement sans compte à rebours
        resetBallForNextPoint();
    }
}

function resetBallForNextPoint() {
    // Réinitialiser la balle au centre
    ball.x = boardWidth/2;
    ball.y = boardHeight/2;
    ball.velocityX = initialBallSpeedX;
    ball.velocityY = initialBallSpeedY;
    
    // Changer la direction aléatoirement
    if (Math.random() < 0.5) {
        ball.velocityX *= -1;
    }
    if (Math.random() < 0.5) {
        ball.velocityY *= -1;
    }
}

function drawFootballField() {
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.fillStyle = "white";

    // Ligne centrale verticale
    context.beginPath();
    context.moveTo(boardWidth / 2, 5);
    context.lineTo(boardWidth / 2, boardHeight - 5);
    context.stroke();

    // Rond central (juste le contour)
    let centerX = boardWidth / 2;
    let centerY = boardHeight / 2;
    let centerRadius = 50;

    context.beginPath();
    context.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    context.stroke();

    // Point central
    context.beginPath();
    context.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    context.fill();

}