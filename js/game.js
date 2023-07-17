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
let enemies
let enemyLasers
let lasers
let currentLevel = 1
let score = 0
let health = 100

function preload() {
  this.load.image('background', '/assets/blue_bg.png')
  this.load.image('player', '/assets/player.png')
  this.load.image('enemyRed', '/assets/enemyRed.png')
  this.load.image('enemyBlue', '/assets/enemyBlue.png')
  this.load.image('laserGreen', '/assets/laserGreen.png')
  this.load.image('laserBlue', '/assets/laserBlue.png')
  this.load.image('laserRed', '/assets/laserRed.png')
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
  this.lasers = this.physics.add.group()
  fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true, true);
  fire.on('down', () => {fireDown()})

  this.enemyLasers = this.physics.add.group()
  this.enemies = this.physics.add.group()

  scoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#fff' })
  scoreText.text = 'Score: ' + score
  healthText = this.add.text(config.width - 16, 16, '', { fontSize: '32px', fill: '#fff' }).setOrigin(1, 0)
  healthText.text = 'HP: ' + health

  level1()
}

function update() {
  scrollBackground()
  this.enemies.children.each((enemy) => {
    enemy.update()
  }, this);
  playerMovement()

  if (this.enemies && this.lasers && this.enemyLasers) {
    this.physics.add.overlap(this.enemies, this.lasers, blowUpEnemy, null, this);
  }
}

function startWave(wave) {
  let scene = game.scene.scenes[0]
  spawnEnemies(wave.enemies.length)


  function spawnEnemies(enemiesToAdd) {
    if (enemiesToAdd > 0) {
      let enemy = new wave.enemies[wave.enemies.length - enemiesToAdd](wave.waypoints[0].x, wave.waypoints[0].y)
      scene.enemies.add(enemy)

      for (let j=1; j < wave.waypoints.length; j++) {
        enemy.queueWaypoint(wave.waypoints[j])
      }

      setTimeout(() => spawnEnemies(enemiesToAdd - 1), wave.timeBetweenSpawn * 1000)
    } else if (enemiesToAdd <= 0) { return }
  }
}

function blowUpEnemy(enemy, laser) {
  enemy.destroy()
  laser.destroy()
  score += 10
  scoreText.text = 'Score: ' + score
}

function playerMovement() {
  player.body.velocity.x = 0
  player.body.velocity.y = 0

  if (cursors.left.isDown) {
    player.body.velocity.x = -450
  } else if (cursors.right.isDown) {
    player.body.velocity.x = 450
  }
  if (cursors.up.isDown && player.y > config.height/4 * 3) {
    player.body.velocity.y = -300
  } else if (cursors.down.isDown) {
    player.body.velocity.y = 300
  }
}

function fireDown() {
  let scene = game.scene.scenes[0]
  let laser = scene.add.sprite(player.x, player.y - 30, 'laserGreen').setScale(0.65)
  scene.physics.add.existing(laser)
  scene.lasers.add(laser)
  laser.body.velocity.y = -800
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
  constructor(x, y, sprite, laserSprite, timeToShoot, damage, laserSpeed) {
    super(game.scene.scenes[0], x, y, sprite);
    let scene = game.scene.scenes[0]
    this.setScale(0.65)
    scene.add.existing(this);
    scene.physics.world.enable(this);
    this.minTime = timeToShoot[0]
    this.maxTime = timeToShoot[1]
    this.laserSprite = laserSprite
    this.damage = damage
    this.laserSpeed = laserSpeed
  }

  travelling = false
  targetPosition
  threshold = 0.4
  waypointQueue = []
  waitingToShoot = true
  firstShot = true

  // Found out that there's a tween function which could've simplified the movement, but I already made this.
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

  queueWaypoint(waypoint) {
    this.waypointQueue.push([waypoint.x, waypoint.y, waypoint.speed])
  }

  checkWaypoints() {
    if (this.travelling === false && this.waypointQueue.length > 0) {
      // waypointQueue is an array of waypoints, who themselves are arrays containing x, y, and speed elements
      this.goTo(this.waypointQueue[0][0], this.waypointQueue[0][1], this.waypointQueue[0][2])
      this.waypointQueue.shift()
    }
  }

  update() {
    if (this.travelling === true && Math.abs(this.x - this.targetPosition[0]) < this.threshold && Math.abs(this.y - this.targetPosition[1]) < this.threshold) {
      this.body.setVelocity(0, 0)
      this.travelling = false
    }
    this.checkWaypoints()

    // Shooting logic
    if (this.firstShot) {
      setTimeout(() => this.waitingToShoot = false, Phaser.Math.Between(400, 1000))
      this.firstShot = false
    }

    if (!this.waitingToShoot) {
      this.waitingToShoot = true
      this.shoot()
      setTimeout(() => this.waitingToShoot = false, Phaser.Math.Between(this.minTime, this.maxTime) * 1000)
    }
  }

  shoot() {
    let scene = game.scene.scenes[0]
    let laser = scene.add.sprite(this.x, this.y + 30, this.laserSprite).setScale(1, -1).setScale(0.65)
    laser.damage = this.damage
    scene.physics.add.existing(laser)
    scene.enemyLasers.add(laser)
    laser.body.velocity.y = this.laserSpeed
  }
}

class EnemyRed extends Enemy {
  constructor(x, y) {
    super(x, y, 'enemyRed', 'laserRed', [1, 5], 5, 500)
  }
}

class EnemyBlue extends Enemy {
  constructor(x, y) {
    super(x, y, 'enemyBlue', 'laserBlue', [1, 6], 10, 800)
  }
}

// Level Declarations
function level1() {
  startWave(l1_w1)
  setTimeout(() => startWave(l1_w2), 10000)
  setTimeout(() => startWave(l1_w3), 14000)
}

// Wave Declarations
const l1_w1 = {
  enemies: [EnemyRed, EnemyRed, EnemyRed, EnemyRed, EnemyBlue],
  timeBetweenSpawn: 1,
  waypoints: [
    {
      x: 0,
      y: 0,
      speed: null
    },
    {
      x: 300,
      y: 400,
      speed: 1
    },
    {
      x: 800,
      y: 0,
      speed: 5
    }
  ],
}

const l1_w2 = {
  enemies: [EnemyRed, EnemyRed, EnemyRed, EnemyRed],
  timeBetweenSpawn: 1,
  waypoints: [
    {
      x: 840,
      y: -30,
      speed: null
    },
    {
      x: 50,
      y: 200,
      speed: 2
    },
    {
      x: 500,
      y: 300,
      speed: 2
    }
  ],
}

const l1_w3 = {
  enemies: [EnemyBlue, EnemyBlue, EnemyBlue],
  timeBetweenSpawn: 1,
  waypoints: [
    {
      x: 815,
      y: 200,
      speed: null
    },
    {
      x: 15,
      y: 300,
      speed: 4
    },
    {
      x: 815,
      y: 400,
      speed: 2
    }
  ],
}