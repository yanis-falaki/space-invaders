let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
      default: 'arcade'
    }
  };

let game = new Phaser.Game(config);

let bg, bg2
let bgBuffer = 100
let player
let cursors

function preload() {
  this.load.image('background', '/assets/blue_bg.png')
  this.load.image('player', '/assets/player.png')
  this.load.image('enemyRed', '/assets/enemyRed.png')
  this.load.image('enemyBlue', '/assets/enemyBlue.png')
  this.load.image('laserGreen', '/assets/laserGreen.png')
}

function create() {
  // Adding 2 background objects to make a scrolling background.
  bg = this.add.sprite(config.width/2, 0 - bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
  this.physics.add.existing(bg)
  bg2 = this.add.sprite(config.width/2, 5 - bg.body.height - bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
  this.physics.add.existing(bg2)
  bg.body.velocity.y = 100
  bg2.body.velocity.y = 100

  player = this.add.sprite(400, 550, 'player').setScale(0.65)
  this.physics.add.existing(player)
  player.body.collideWorldBounds = true
  cursors = this.input.keyboard.createCursorKeys()

  this.enemies = this.physics.add.group()
  let Enemy1 = new Enemy(400, 300)
  this.enemies.add(Enemy1)
  Enemy1.goTo(200, 300, 1)
}

function update() {
  scrollBackground()

  this.enemies.children.each((enemy) => {
    enemy.update()
  }, this);

  player.body.velocity.x = 0
  player.body.velocity.y = 0

  if (cursors.left.isDown) {
    player.body.velocity.x = -300
  } else if (cursors.right.isDown) {
    player.body.velocity.x = 300
  }
  if (cursors.up.isDown && player.y > config.height/4 * 3) {
    player.body.velocity.y = -200
  } else if (cursors.down.isDown) {
    player.body.velocity.y = 200
  }
}

function scrollBackground() {
  if (bg.y > config.height) {
    repositionBG(bg)
  } else if (bg2.y > config.height) {
    repositionBG(bg2)
  }
}

function repositionBG(background) {
  background.y = 5 - background.body.height - bgBuffer
}


class Enemy extends Phaser.GameObjects.Sprite {
  constructor(x, y) {
    super(game.scene.scenes[0], x, y, 'enemyRed');
    let scene = game.scene.scenes[0]
    this.setScale(0.65)
    scene.add.existing(this);
    scene.physics.world.enable(this);
    console.log(this)
  }

  travelling = false
  targetPosition
  threshold = 0.4

  goTo(targetX, targetY, duration) {
    this.travelling = true
    const startPosition = new Phaser.Math.Vector2(this.x, this.y);
    const targetPositionVector = new Phaser.Math.Vector2(targetX, targetY);
    const distance = Phaser.Math.Distance.BetweenPoints(startPosition, targetPositionVector);
    const velocity = distance / duration;
    const direction = targetPositionVector.subtract(startPosition).normalize();
    this.body.setVelocity(direction.x * velocity, direction.y * velocity);

    this.targetPosition = [targetX, targetY]
  }

  update() {
    if (this.travelling === true && Math.abs(this.x - this.targetPosition[0]) < this.threshold && Math.abs(this.y - this.targetPosition[1]) < this.threshold) {
      this.body.setVelocity(0, 0)
      this.travelling = false
    }
  }
}