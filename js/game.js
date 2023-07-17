let bgBuffer = 100

// Level Declarations
function level1(scene) {
  scene.startWave(l1_w1)
  setTimeout(() => scene.startWave(l1_w2), 10000)
  setTimeout(() => scene.startWave(l1_w3), 14000)
}

class GameScene extends Phaser.Scene 
{
  // Using this to keep track of global variables
  player
  cursors
  enemies
  enemyLasers
  lasers
  currentLevel = 1
  score = 0
  health = 100
  bg
  bg2

  preload() {
    this.load.image('background', '/assets/blue_bg.png')
    this.load.image('player', '/assets/player.png')
    this.load.image('enemyRed', '/assets/enemyRed.png')
    this.load.image('enemyBlue', '/assets/enemyBlue.png')
    this.load.image('laserGreen', '/assets/laserGreen.png')
    this.load.image('laserBlue', '/assets/laserBlue.png')
    this.load.image('laserRed', '/assets/laserRed.png')
  }

  create() {
    // Adding 2 background objects to make a scrolling background.
    this.bg = this.add.sprite(config.width/2, 0 - bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
    this.physics.add.existing(this.bg)
    this.bg2 = this.add.sprite(config.width/2, 5 - this.bg.body.height - bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
    this.physics.add.existing(this.bg2)
    this.bg.body.velocity.y = 100
    this.bg2.body.velocity.y = 100

    this.player = this.add.sprite(400, 550, 'player')
    this.player.setScale(0.65)
    this.physics.add.existing(this.player)
    this.player.body.collideWorldBounds = true

    this.cursors = this.input.keyboard.createCursorKeys()
    this.lasers = this.physics.add.group()
    this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true, true);
    this.fire.on('down', () => {this.fireDown()})

    this.enemyLasers = this.physics.add.group()
    this.enemies = this.physics.add.group()

    this.scoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#fff' })
    this.scoreText.text = 'Score: ' + this.score
    this.healthText = this.add.text(config.width - 16, 16, '', { fontSize: '32px', fill: '#fff' }).setOrigin(1, 0)
    this.healthText.text = 'HP: ' + this.health

    level1(this)
  }

  update() {
    
    scrollBackground(this)
    this.enemies.children.each((enemy) => {
      enemy.update()
    }, this);
    this.playerMovement()
    

    if (true) {
      this.physics.add.overlap(this.enemies, this.lasers, this.hitEnemy, null, this);
      this.physics.add.overlap(this.player, this.enemyLasers, this.hit, null, this);
    }
  }

  startWave(wave) {
    spawnEnemies.call(this, wave.enemies.length)
    function spawnEnemies(enemiesToAdd) {
      if (enemiesToAdd > 0) {
        let enemy = new wave.enemies[wave.enemies.length - enemiesToAdd](wave.waypoints[0].x, wave.waypoints[0].y)
        this.enemies.add(enemy)

        for (let j=1; j < wave.waypoints.length; j++) {
          enemy.queueWaypoint(wave.waypoints[j])
        }

        setTimeout(() => spawnEnemies.call(this, enemiesToAdd - 1), wave.timeBetweenSpawn * 1000)
      } else if (enemiesToAdd <= 0) { return }
    }
  }

  hitEnemy(enemy, laser) {
    enemy.hit(laser.damage)
    laser.destroy()
  }

  hit(enemy, laser) {
    laser.destroy()
    console.log("Hit!")
  }

  playerMovement() {
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -450
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = 450
    }
    if (this.cursors.up.isDown && this.player.y > config.height/4 * 3) {
      this.player.body.velocity.y = -300
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = 300
    }
  }

  fireDown() {
    let laser = this.add.sprite(this.player.x, this.player.y - 30, 'laserGreen').setScale(0.65)
    laser.damage = 10
    this.physics.add.existing(laser)
    this.lasers.add(laser)
    laser.body.velocity.y = -800
  } 
}

function scrollBackground(scene){
  if (scene.bg.y > config.height) {
    repositionBG(scene.bg)
  } else if (scene.bg2.y > config.height) {
    repositionBG(scene.bg2)
  }

  function repositionBG(background) {
    background.y = 5 - background.body.height - bgBuffer
  }
}

class Enemy extends Phaser.GameObjects.Sprite {
  constructor(x, y, sprite, laserSprite, timeToShoot, damage, laserSpeed, health, score) {
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
    this.health = health
    this.score = score
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

  hit(damage) {
    let scene = game.scene.scenes[0]
    this.health -= damage
    if (this.health <= 0) {
      this.destroy()
      scene.score += this.score
      scene.scoreText.text = 'Score: ' + scene.score
    }
  }
}

class EnemyRed extends Enemy {
  constructor(x, y) {
    super(x, y, 'enemyRed', 'laserRed', [1, 5], 5, 500, 10, 10)
  }
}

class EnemyBlue extends Enemy {
  constructor(x, y) {
    super(x, y, 'enemyBlue', 'laserBlue', [1, 6], 10, 800, 20, 20)
  }
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

let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: GameScene,
  physics: {
    default: 'arcade'
  }
};

let game = new Phaser.Game(config);