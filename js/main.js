// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
"use strict";
const app = new PIXI.Application(600, 600);
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;
const highScoreID = "mab8141HighScores";
// pre-load the images
PIXI.loader.
    add(["images/Spaceship.png", "images/monster0.png", "images/monster1.png", "images/monster2.png", "images/monster3.png", "images/monster4.png", "images/monster5.png", "images/explosion_5.png"]).
    on("progress", e => { console.log(`progress=${e.progress}`) }).
    load(setup);

// aliases
let stage;

// game variables
let startScene;
let gameScene, ship, scoreLabel, lifeLabel, shootSound, enemyShootSound, hitSound, fireballSound;
let gameOverScene;
let highScoreScene;
let gameOverScoreLabel;
let placeHolderlabel;
let left = keyboard("ArrowLeft");
let right = keyboard("ArrowRight");
let spaceBar = keyboard(" ");
let monsterSpeed;
let highScores;
let monsters = [];
let bullets = [];
let enemyBullets = [];
let explosions = [];
let explosionTextures;
let score = 0;
let life = 100;
let levelNum = 1;
let paused = true;
function setup() {
    stage = app.stage;
    // #1 - Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    // #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    //Creation of highScoreScene
    highScoreScene = new PIXI.Container();
    highScoreScene.visible = false;
    stage.addChild(highScoreScene);

    // #4 - Create labels for all 3 scenes
    createLabelsAndButtons();
    // #5 - Create ship
    ship = new Ship();
    gameScene.addChild(ship);
    // #6 - Load Sounds
    shootSound = new Howl({
        src: ['sounds/shoot.wav']
    });
    enemyShootSound = new Howl({
        src: ['sounds/shoot2.wav']
    });

    hitSound = new Howl({
        src: ['sounds/hit.wav']
    });

    fireballSound = new Howl({
        src: ['sounds/fireball.wav']
    });
    // #7 - Load sprite sheet
    explosionTextures = loadSpriteSheet();
    // #8 - Start update loop
    app.ticker.add(gameLoop);

    // Now our `startScene` is visible
    // Clicking the button calls startGame()

}
function startGame() {
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;
    highScoreScene.visible = false;
    levelNum = 1;
    monsterSpeed = levelNum * 10;
    score = 0;
    life = 100;
    increaseScoreBy(0);
    decreaseLifeBy(0);
    ship.x = 300;
    ship.y = 550;
    loadLevel();

}
function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.key === key.value) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.value) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return key;
}
function end() {
    paused = true;

    enemyBullets.forEach(a => gameScene.removeChild(a));
    enemyBullets = [];

    monsters.forEach(m => gameScene.removeChild(m));
    monsters = [];

    bullets.forEach(b => gameScene.removeChild(b));
    bullets = [];

    explosions.forEach(e => gameScene.removeChild(e));
    explosions = [];

    gameOverScoreLabel.text = `Final score: ${score}`;
    let highScores = localStorage.getItem(highScoreID);
    if (highScores) {

    }
    else {
        highScores = 0;
    }
    if (highScores == 0) {
        highScores = score;
    }
    if (score > highScores) {
        highScores = score;
    }
    console.log(highScores);
    showScores();
    localStorage.setItem(highScoreID, highScores);
    gameScene.visible = false;
    gameOverScene.visible = true;
}
function HighScoreShower() {
    gameOverScene.visible = false;
    highScoreScene.visible = true;
}
function loadSpriteSheet() {
    let spriteSheet = PIXI.BaseTexture.fromImage("images/explosion_5.png");
    let width = 222;
    let height = 200;
    let numFrames = 4;
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i * width, 64, width, height));
        textures.push(frame);
    }
    return textures;
}
function createExplosion(x, y, frameWidth, frameHeight) {
    let w2 = frameWidth / 2
    let h2 = frameHeight / 2;
    let expl = new PIXI.extras.AnimatedSprite(explosionTextures);
    expl.x = x - w2 - 90; //we want the explosions to appear at the center of the circle
    expl.y = y - h2 - 30;
    expl.animationSpeed = 1 / 7;
    expl.loop = false;
    expl.onComplete = e => gameScene.removeChild(expl);
    explosions.push(expl);
    gameScene.addChild(expl);
    expl.play();
}
//Function for bullet firing, accepts an integer to determine whether the ship or the enemy is firing
function fireBullet(e, enemyOrFriendly = 0) {
    //let rect = app.view.getBoundingClientRect();
    //let mouseX = e.clientX - rect.x;
    //let mouseY = e.clientY - rect.y;
    if (enemyOrFriendly != 0) {

        let b = new Bullet(0xFFFFFF, e.x, e.y);
        b.fwd = { x: 0, y: 1 }
        enemyBullets.push(b);
        enemyShootSound.play();
        gameScene.addChild(b);
        return;
    }
    if (bullets.length == 3) {
        return;
    }
    let b = new Bullet(0xFFFFFF, ship.x, ship.y);
    bullets.push(b);
    gameScene.addChild(b);
    shootSound.play();
}
function increaseScoreBy(value) {
    score += value;
    scoreLabel.text = `Score ${score}`;
}
function decreaseLifeBy(value) {
    life -= value;
    life = parseInt(life);
    lifeLabel.text = `Life   ${life}%`;
}
function showScores() {
    placeHolderlabel.text = `1. ${highScores}`;

}
function createLabelsAndButtons() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 48,
        fontFamily: "Calibri",
    });

    // 1 - set up 'startScene'
    // 1A - make the top start label
    let startLabel1 = new PIXI.Text("Space Invaders Remake!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 32,
        fontFamily: 'Calibri',
        stroke: 0x00FF00,
        strokeThickness: 1
    });
    startLabel1.x = 130;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    // 1B - make the middle start label
    let startLabel2 = new PIXI.Text("This pays homage to the classic Space Invaders Game");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 20,
        fontFamily: 'Calibri',
        stroke: 0xFFFFFF,
        strokeThickness: 1
    });
    startLabel2.x = 75;
    startLabel2.y = 200;
    startScene.addChild(startLabel2);

    // 1C - make the start game button
    let startButton = new PIXI.Text("Play Now!");
    startButton.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 48,
        fontFamily: 'Calibri',
        stroke: 0xFFFFFF,
        strokeThickness: 1
    });
    startButton.x = 200;
    startButton.y = 250;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); //startGame is a function reference
    startButton.on('pointerover', e => e.target.alpha = 0.7); //concise arrow function with no brackets
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0); //ditto
    startScene.addChild(startButton);

    // 2 - set up 'gameScene'
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 18,
        fontFamily: 'Calibri',
        stroke: 0xFF0000,
        strokeThickness: 4
    });
    // 2A - make score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // 2B - make life label
    lifeLabel = new PIXI.Text();
    lifeLabel.style = textStyle;
    lifeLabel.x = 5;
    lifeLabel.y = 26;
    gameScene.addChild(lifeLabel);
    decreaseLifeBy(0);

    // 3 - set up `gameOverScene`
    // 3A - make game over text
    let gameOverText = new PIXI.Text("Game Over!");
    textStyle = new PIXI.TextStyle({
        fill: 0xFF0000,
        fontSize: 64,
        fontFamily: "Calibri",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverText.style = textStyle;
    gameOverText.x = 150;
    gameOverText.y = sceneHeight / 2 - 160;
    gameOverScene.addChild(gameOverText);

    //Challenge
    gameOverScoreLabel = new PIXI.Text("Final score:");
    textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 32,
        fontFamily: "Calibri",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    gameOverScoreLabel.style = textStyle;
    gameOverScoreLabel.x = 225;
    gameOverScoreLabel.y = sceneHeight / 2;
    gameOverScene.addChild(gameOverScoreLabel);


    // 3B - make "play again?" button
    let playAgainButton = new PIXI.Text("Click Here to See Your Highest");
    playAgainButton.style = buttonStyle;
    playAgainButton.x = 10;
    playAgainButton.y = sceneHeight - 200;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup", HighScoreShower); //HighScores is a function reference
    playAgainButton.on('pointerover', e => e.target.alpha = 0.7); //concise arrow function with no brackets
    playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); //ditto
    gameOverScene.addChild(playAgainButton);
    //HighScoreButtons
    let highScoreLabel = new PIXI.Text("Your High Scores!");
    highScoreLabel.style = buttonStyle;
    highScoreLabel.x = 150;
    highScoreLabel.y = 100;
    highScoreScene.addChild(highScoreLabel);

    placeHolderlabel = new PIXI.Text(1);
    placeHolderlabel.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 20,
        fontFamily: 'Calibri',
        stroke: 0xFFFFFF,
        strokeThickness: 1
    });
    placeHolderlabel.x = 300;
    placeHolderlabel.y = 200;
    highScoreScene.addChild(placeHolderlabel);

    let resetButton = new PIXI.Text("Click Here to Play Again");
    resetButton.style = buttonStyle;
    resetButton.x = 100;
    resetButton.y = sceneHeight - 150;
    resetButton.interactive = true;
    resetButton.buttonMode = true;
    resetButton.on("pointerup", startGame); //startGame is a function reference
    resetButton.on('pointerover', e => e.target.alpha = 0.7); //concise arrow function with no brackets
    resetButton.on('pointerout', e => e.currentTarget.alpha = 1.0); //ditto
    highScoreScene.addChild(resetButton);
}


//Function to create all enemy ships
function createShips() {

    for (let i = 0; i < 1; i++) {
        let monsterSpriteChosen = Math.floor(Math.random() * 6);
        let imageResource = "images/" + "monster" + monsterSpriteChosen + ".png";
        for (let j = 0; j < 1; j++) {
            let monster = new EnemyShips(imageResource, 50 * j + 70, 50 * i + 100, monsterSpeed);
            monsters.push(monster);
            gameScene.addChild(monster);
        }
    }
}
function loadLevel() {
    createShips();
    paused = false;
}

function MoveShips() {
    for (let m of monsters) {
        m.move;
    }
}
function gameLoop() {
    if (paused) return; // keep this commented out for now
    let timeSince = 0;
    // #1 - Calculate "delta time"
    let dt = 1 / app.ticker.FPS;
    if (dt > 1 / 12) dt = 1 / 12;
    left.press = () => {
        if (ship.x >= ship.width / 2 + 10) {
            ship.fwd = { x: -1, y: 0 };
        }

    }
    left.release = () => {
        ship.fwd = { x: 0, y: 0 };
    }
    right.press = () => {
        if (ship.x <= sceneWidth - ship.width / 2 - 10) {
            ship.fwd = { x: 1, y: 0 };
        }

    }
    right.release = () => {
        ship.fwd = { x: 0, y: 0 };
    }
    ship.move();
    if (ship.x <= ship.width / 2 + 10) {
        ship.x = ship.width / 2 + 10;
    }
    if (ship.x >= sceneWidth - ship.width / 2 - 10) {
        ship.x = sceneWidth - ship.width / 2 - 10;
    }
    spaceBar.press = () => {
        fireBullet();
    }
    if (Math.floor(Math.random() * 101) == 0) {
        fireBullet(monsters[Math.floor(Math.random() * monsters.length)], 1);
    }

    //MonsterMovement
    for (let m of monsters) {
        m.move(dt);
        if (m.x <= m.width / 2 + 10 || m.x >= sceneWidth - m.width / 2 - 10) {
            for (let m of monsters) {
                m.fwd = { x: m.fwd.x * -1, y: 0 };
            }
            if (monsters[monsters.length - 1].y != 400) {
                for (let m of monsters) {
                    m.y += 10;
                }
            }
        }
    }

    // #4 - Move Friendly Bullets
    for (let b of bullets) {
        b.move(dt);
    }
    // Move Enemy Bullets
    for (let a of enemyBullets) {
        a.move(dt);
    }

    //Monster/Bullet Collisions
    for (let m of monsters) {
        for (let b of bullets) {

            if (rectsIntersect(m, b)) {
                fireballSound.play();
                createExplosion(m.x, m.y, m.width, m.height); //we will implement this soon
                gameScene.removeChild(m);
                m.isAlive = false;
                gameScene.removeChild(b);
                b.isAlive = false;
                increaseScoreBy(1);
            }
            if (b.y < -10) b.isAlive = false;
        }
    }



    //Ship/EnemyBullet Collisions
    for (let a of enemyBullets) {
        if (rectsIntersect(a, ship)) {
            hitSound.play();
            gameScene.removeChild(a);
            a.isAlive = false;
            decreaseLifeBy(20);
        }
    }




    // #6 - Now do some clean up

    // get rid of dead bullets
    bullets = bullets.filter(b => b.isAlive);



    // get rid of explosions
    explosions = explosions.filter(e => e.playing);

    //Monster Removal
    monsters = monsters.filter(m => m.isAlive);

    //EnemyBullet Removal
    enemyBullets = enemyBullets.filter(a => a.isAlive);
    // #7 - Is game over?
    if (life <= 0) {
        end();
        return; // return here so we skip #8 below
    }

    // #8 - Load next level
    if (monsters.length == 0) {
        levelNum++;
        loadLevel();
    }
}