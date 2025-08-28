// Variables globales
let canvas;
let engine;
let scene;
let camera;

// Variables de jeu
let player1;
let player2;
let ball;
let gameState = "waiting";
let countdownValue = 3;
let countdownTimer = 0;
let winScore = 5;
let player1Score = 0;
let player2Score = 0;
let winner = "";

// Variables de vitesse
let ballVelocity = new BABYLON.Vector3(0.05, 0, 0.03);
let initialBallSpeed = 0.05;
let speedIncrease = 0.01;
let playerSpeed = 0.1;

// Gestion des touches
let keys = {
    w: false,
    s: false,
    arrowUp: false,
    arrowDown: false
};

window.addEventListener("DOMContentLoaded", function() {
    canvas = document.getElementById("board");
    engine = new BABYLON.Engine(canvas, true);
    
    // Créer la scène
    scene = createScene();
    
    // Boucle de rendu
    engine.runRenderLoop(function() {
        update();
        scene.render();
    });
    
    // Redimensionnement
    window.addEventListener("resize", function() {
        engine.resize();
    });
    
    // Gestion des touches
    setupKeyboardControls();
});

function createScene() {
    let scene = new BABYLON.Scene(engine);
    
    console.log("Création de la scène...");
    
    // Couleur de fond (terrain)
    scene.clearColor = new BABYLON.Color3(0, 0.5, 0); // Vert terrain
    
    // Caméra - utiliser FreeCamera au lieu d'ArcRotateCamera pour éviter les problèmes
    camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 8, -12), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Activer les contrôles de la caméra (méthode moderne)
    camera.setTarget(BABYLON.Vector3.Zero());
    
    // Lumière
    let light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    
    // Créer le terrain
    createField(scene);
    
    // Créer les paddles
    createPlayers(scene);
    
    // Créer la balle
    createBall(scene);
    
    // Interface utilisateur
    createUI(scene);
    
    console.log("Scène créée avec succès");
    
    return scene;
}

function createField(scene) {
    // Terrain principal
    let ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 8, height: 4}, scene);
    let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
    ground.material = groundMaterial;
    
    // Ligne centrale
    let centerLine = BABYLON.MeshBuilder.CreateBox("centerLine", {width: 0.05, height: 0.1, depth: 4}, scene);
    centerLine.position.x = 0;
    let lineMaterial = new BABYLON.StandardMaterial("lineMat", scene);
    lineMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    centerLine.material = lineMaterial;
    
    // Rond central - version plate au sol
    let centerCircle = BABYLON.MeshBuilder.CreateGround("centerCircle", {width: 1, height: 1}, scene);
    centerCircle.position.y = 0.01;
    
    // Créer un matériau avec texture de cercle
    let circleMaterial = new BABYLON.StandardMaterial("circleMat", scene);
    circleMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
    
    let circleTexture = new BABYLON.DynamicTexture("circleTexture", 512, scene);
    let context = circleTexture.getContext();
    
    context.fillStyle = "rgba(0, 100, 0, 1)";
    context.fillRect(0, 0, 512, 512);
    
    context.strokeStyle = "white";
    context.lineWidth = 8;
    context.beginPath();
    context.arc(256, 256, 240, 0, 2 * Math.PI);
    context.stroke();
    
    circleTexture.update();
    circleMaterial.diffuseTexture = circleTexture;
    centerCircle.material = circleMaterial;
    
    // NOUVELLES CAGES DE FOOT
    createGoals(scene);
    
    // Bordures
    let topBorder = BABYLON.MeshBuilder.CreateBox("topBorder", {width: 8, height: 0.2, depth: 0.1}, scene);
    topBorder.position.z = 2;
    topBorder.position.y = 0.1;
    let borderMaterial = new BABYLON.StandardMaterial("borderMat", scene);
    borderMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    topBorder.material = borderMaterial;
    
    let bottomBorder = BABYLON.MeshBuilder.CreateBox("bottomBorder", {width: 8, height: 0.2, depth: 0.1}, scene);
    bottomBorder.position.z = -2;
    bottomBorder.position.y = 0.1;
    bottomBorder.material = borderMaterial;
}

function createGoals(scene) {
    // Matériau pour les cages (blanc)
    let goalMaterial = new BABYLON.StandardMaterial("goalMat", scene);
    goalMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    
    // Dimensions des cages - correspondent aux bordures du terrain
    let goalWidth = 4;    // Toute la largeur du terrain (de -2 à +2)
    let goalHeight = 0.8; // Hauteur de la cage
    let goalDepth = 0.3;  // Profondeur de la cage
    let postThickness = 0.05; // Épaisseur des poteaux
    
    // === CAGE GAUCHE ===
    
    // Poteau gauche (côté +Z)
    let leftGoalPostLeft = BABYLON.MeshBuilder.CreateBox("leftGoalPostLeft", {
        width: postThickness, 
        height: goalHeight, 
        depth: postThickness
    }, scene);
    leftGoalPostLeft.position.x = -4;
    leftGoalPostLeft.position.y = goalHeight / 2;
    leftGoalPostLeft.position.z = 2; // Aligné avec la bordure supérieure
    leftGoalPostLeft.material = goalMaterial;
    
    // Poteau droit (côté -Z)
    let leftGoalPostRight = BABYLON.MeshBuilder.CreateBox("leftGoalPostRight", {
        width: postThickness, 
        height: goalHeight, 
        depth: postThickness
    }, scene);
    leftGoalPostRight.position.x = -4;
    leftGoalPostRight.position.y = goalHeight / 2;
    leftGoalPostRight.position.z = -2; // Aligné avec la bordure inférieure
    leftGoalPostRight.material = goalMaterial;
    
    // Barre transversale
    let leftGoalCrossbar = BABYLON.MeshBuilder.CreateBox("leftGoalCrossbar", {
        width: postThickness, 
        height: postThickness, 
        depth: goalWidth
    }, scene);
    leftGoalCrossbar.position.x = -4;
    leftGoalCrossbar.position.y = goalHeight;
    leftGoalCrossbar.position.z = 0;
    leftGoalCrossbar.material = goalMaterial;
    
    // Poteaux de profondeur gauche (arrière de la cage)
    let leftGoalBackLeft = BABYLON.MeshBuilder.CreateBox("leftGoalBackLeft", {
        width: goalDepth, 
        height: postThickness, 
        depth: postThickness
    }, scene);
    leftGoalBackLeft.position.x = -4 - goalDepth / 2;
    leftGoalBackLeft.position.y = goalHeight;
    leftGoalBackLeft.position.z = 2;
    leftGoalBackLeft.material = goalMaterial;
    
    let leftGoalBackRight = BABYLON.MeshBuilder.CreateBox("leftGoalBackRight", {
        width: goalDepth, 
        height: postThickness, 
        depth: postThickness
    }, scene);
    leftGoalBackRight.position.x = -4 - goalDepth / 2;
    leftGoalBackRight.position.y = goalHeight;
    leftGoalBackRight.position.z = -2;
    leftGoalBackRight.material = goalMaterial;
    
    // Poteau arrière gauche
    let leftGoalBackPost = BABYLON.MeshBuilder.CreateBox("leftGoalBackPost", {
        width: postThickness, 
        height: goalHeight, 
        depth: goalWidth
    }, scene);
    leftGoalBackPost.position.x = -4 - goalDepth;
    leftGoalBackPost.position.y = goalHeight / 2;
    leftGoalBackPost.position.z = 0;
    leftGoalBackPost.material = goalMaterial;
    
    // === CAGE DROITE ===
    
    // Poteau gauche (côté +Z)
    let rightGoalPostLeft = BABYLON.MeshBuilder.CreateBox("rightGoalPostLeft", {
        width: postThickness, 
        height: goalHeight, 
        depth: postThickness
    }, scene);
    rightGoalPostLeft.position.x = 4;
    rightGoalPostLeft.position.y = goalHeight / 2;
    rightGoalPostLeft.position.z = 2; // Aligné avec la bordure supérieure
    rightGoalPostLeft.material = goalMaterial;
    
    // Poteau droit (côté -Z)
    let rightGoalPostRight = BABYLON.MeshBuilder.CreateBox("rightGoalPostRight", {
        width: postThickness, 
        height: goalHeight, 
        depth: postThickness
    }, scene);
    rightGoalPostRight.position.x = 4;
    rightGoalPostRight.position.y = goalHeight / 2;
    rightGoalPostRight.position.z = -2; // Aligné avec la bordure inférieure
    rightGoalPostRight.material = goalMaterial;
    
    // Barre transversale
    let rightGoalCrossbar = BABYLON.MeshBuilder.CreateBox("rightGoalCrossbar", {
        width: postThickness, 
        height: postThickness, 
        depth: goalWidth
    }, scene);
    rightGoalCrossbar.position.x = 4;
    rightGoalCrossbar.position.y = goalHeight;
    rightGoalCrossbar.position.z = 0;
    rightGoalCrossbar.material = goalMaterial;
    
    // Poteaux de profondeur droite (arrière de la cage)
    let rightGoalBackLeft = BABYLON.MeshBuilder.CreateBox("rightGoalBackLeft", {
        width: goalDepth, 
        height: postThickness, 
        depth: postThickness
    }, scene);
    rightGoalBackLeft.position.x = 4 + goalDepth / 2;
    rightGoalBackLeft.position.y = goalHeight;
    rightGoalBackLeft.position.z = 2;
    rightGoalBackLeft.material = goalMaterial;
    
    let rightGoalBackRight = BABYLON.MeshBuilder.CreateBox("rightGoalBackRight", {
        width: goalDepth, 
        height: postThickness, 
        depth: postThickness
    }, scene);
    rightGoalBackRight.position.x = 4 + goalDepth / 2;
    rightGoalBackRight.position.y = goalHeight;
    rightGoalBackRight.position.z = -2;
    rightGoalBackRight.material = goalMaterial;
    
    // Poteau arrière droit
    let rightGoalBackPost = BABYLON.MeshBuilder.CreateBox("rightGoalBackPost", {
        width: postThickness, 
        height: goalHeight, 
        depth: goalWidth
    }, scene);
    rightGoalBackPost.position.x = 4 + goalDepth;
    rightGoalBackPost.position.y = goalHeight / 2;
    rightGoalBackPost.position.z = 0;
    rightGoalBackPost.material = goalMaterial;
}

function createPlayers(scene) {
    // Joueur 1 (gauche)
    player1 = BABYLON.MeshBuilder.CreateBox("player1", {width: 0.1, height: 0.3, depth: 0.5}, scene);
    player1.position.x = -3.8;
    player1.position.y = 0.15;
    let player1Material = new BABYLON.StandardMaterial("player1Mat", scene);
    player1Material.diffuseColor = new BABYLON.Color3(0.5, 0.8, 1);
    player1.material = player1Material;
    
    // Joueur 2 (droite)
    player2 = BABYLON.MeshBuilder.CreateBox("player2", {width: 0.1, height: 0.3, depth: 0.5}, scene);
    player2.position.x = 3.8;
    player2.position.y = 0.15;
    player2.material = player1Material;
}

function createBall(scene) {
    ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 0.1}, scene);
    ball.position.y = 0.05;
    let ballMaterial = new BABYLON.StandardMaterial("ballMat", scene);
    ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    ball.material = ballMaterial;
}

function createUI(scene) {
    // Vérifier si GUI est disponible
    if (typeof BABYLON.GUI === 'undefined') {
        console.error("Babylon.js GUI n'est pas chargé");
        return;
    }
    
    // Interface utilisateur avec Babylon.js GUI
    let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    
    // Score
    let scoreText = new BABYLON.GUI.TextBlock();
    scoreText.text = "0 - 0";
    scoreText.color = "white";
    scoreText.fontSize = 60;
    scoreText.top = "-40%";
    advancedTexture.addControl(scoreText);
    
    // Message d'attente
    let messageText = new BABYLON.GUI.TextBlock();
    messageText.text = "Appuyez sur ESPACE pour commencer";
    messageText.color = "white";
    messageText.fontSize = 24;
    messageText.top = "40%";
    advancedTexture.addControl(messageText);
    
    // Stocker pour pouvoir les modifier
    scene.scoreText = scoreText;
    scene.messageText = messageText;
}

function setupKeyboardControls() {
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
    updatePlayerMovement();
    updateGameLogic();
    updateUI();
}

function updatePlayerMovement() {
    if (gameState === "playing") {
        // Joueur 1
        if (keys.w && player1.position.z < 1.7) {
            player1.position.z += playerSpeed;
        }
        if (keys.s && player1.position.z > -1.7) {
            player1.position.z -= playerSpeed;
        }
        
        // Joueur 2
        if (keys.arrowUp && player2.position.z < 1.7) {
            player2.position.z += playerSpeed;
        }
        if (keys.arrowDown && player2.position.z > -1.7) {
            player2.position.z -= playerSpeed;
        }
    }
}

function updateGameLogic() {
    if (gameState === "playing") {
        // Mouvement de la balle
        ball.position.x += ballVelocity.x;
        ball.position.z += ballVelocity.z;
        
        // Collision avec les bordures
        if (ball.position.z >= 1.9 || ball.position.z <= -1.9) {
            ballVelocity.z *= -1;
        }
        
        // Collision avec les paddles
        if (ball.position.x <= -3.7 && Math.abs(ball.position.z - player1.position.z) < 0.3) {
            ballVelocity.x *= -1;
            ballVelocity.x += ballVelocity.x > 0 ? speedIncrease : -speedIncrease;
        }
        
        if (ball.position.x >= 3.7 && Math.abs(ball.position.z - player2.position.z) < 0.3) {
            ballVelocity.x *= -1;
            ballVelocity.x += ballVelocity.x > 0 ? speedIncrease : -speedIncrease;
        }
        
        // Points marqués
        if (ball.position.x < -4) {
            player2Score++;
            checkWinner();
        } else if (ball.position.x > 4) {
            player1Score++;
            checkWinner();
        }
    } else if (gameState === "countdown") {
        updateCountdown();
    }
}

function updateUI() {
    scene.scoreText.text = `${player1Score} - ${player2Score}`;
    
    if (gameState === "waiting") {
        scene.messageText.text = "Appuyez sur ESPACE pour commencer";
        scene.messageText.isVisible = true;
    } else if (gameState === "countdown") {
        if (countdownValue > 0) {
            scene.messageText.text = countdownValue.toString();
        } else {
            scene.messageText.text = "GO!";
        }
        scene.messageText.isVisible = true;
    } else if (gameState === "playing") {
        scene.messageText.isVisible = false;
    } else if (gameState === "gameOver") {
        scene.messageText.text = `${winner} GAGNE!\nAppuyez sur ESPACE pour rejouer`;
        scene.messageText.isVisible = true;
    }
}

function startCountdown() {
    gameState = "countdown";
    countdownValue = 3;
    countdownTimer = 0;
    player1Score = 0;
    player2Score = 0;
    resetBall();
}

function updateCountdown() {
    countdownTimer++;
    if (countdownTimer >= 60) {
        countdownValue--;
        countdownTimer = 0;
        
        if (countdownValue <= 0) {
            gameState = "playing";
        }
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
        resetBall();
    }
}

function resetBall() {
    ball.position.x = 0;
    ball.position.z = 0;
    ballVelocity.x = initialBallSpeed;
    ballVelocity.z = initialBallSpeed * 0.6;
    
    // Direction aléatoire
    if (Math.random() < 0.5) ballVelocity.x *= -1;
    if (Math.random() < 0.5) ballVelocity.z *= -1;
}