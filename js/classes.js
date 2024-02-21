class Ship extends PIXI.Sprite {
    constructor(x = 0, y = 0) {
        super(PIXI.loader.resources["images/Spaceship.png"].texture);
        this.anchor.set(.5, .5) //position,scaling,rotating etc are now from center of sprite
        this.scale.set(0.1);
        this.x = x;
        this.y = y;
        this.fwd = { x: 0, y: 0 };
        this.speed = 50;
        this.isAlive = true;
    }
    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}

class Bullet extends PIXI.Graphics {
    constructor(color = 0xFFFFFF, x = 0, y = 0) {
        super();
        this.beginFill(color);
        this.drawRect(-2, -3, 4, 6);
        this.endFill();
        this.x = x;
        this.y = y;
        //variables
        this.fwd = { x: 0, y: -1 };
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);

    }
    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}
class EnemyShips extends PIXI.Sprite {
    constructor(spriteResource, x = 0, y = 0, spedWanted = 10) {
        super(PIXI.loader.resources[spriteResource].texture);
        this.anchor.set(.5, .5);
        this.scale.set(0.3);
        this.x = x;
        this.y = y;
        this.fwd = { x: 1, y: 0 };
        this.speed = spedWanted;
        this.isAlive = true;
    }
    move(dt = 1 / 60) {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}