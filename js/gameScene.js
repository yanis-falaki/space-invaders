import { EnemyBlue, EnemyRed } from "./EnemyClasses.js"
import { scrollBackground, logAllEntities } from "./helpers.js"
import { level1 } from "./levels.js"

export class GameScene extends Phaser.Scene 
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
  bgBuffer = 100

  preload() {
    this.canvas = this.sys.game.canvas;

    this.load.image('background', '/assets/blue_bg.png')
    this.load.image('player', '/assets/player.png')
    this.load.image('enemyRed', '/assets/enemyRed.png')
    this.load.image('enemyBlue', '/assets/enemyBlue.png')
    this.load.image('laserGreen', '/assets/laserGreen.png')
    this.load.image('laserBlue', '/assets/laserBlue.png')
    this.load.image('laserRed', '/assets/laserRed.png')
    this.load.audio('explodeEnemy', 'assets/low_blip.wav')
    this.load.audio('blip', 'assets/blip.wav')
    this.load.audio('damage', 'assets/damage.wav')
    this.load.audio('backgroundMusic', 'assets/music.mp3')

    //Explosion animation
    for (let i = 1; i < 11; i++) {
      this.load.image(`explosion_${i}`, `assets/explosion/Explosion_${i}.png`)
    }
  }

  create() {
    // Explosion animation
    let explosionFrames = [];
    for (let i = 1; i <= 10; i++) {
      explosionFrames.push({ key: `explosion_${i}` });
    }
    this.anims.create({
      key: 'explosion',
      frames: explosionFrames,
      frameRate: 14,
      repeat: 0
    })

    // Sound effects
    this.explodeEnemySound = this.sound.add('explodeEnemy')
    this.blipSound = this.sound.add('blip')
    this.damageSound = this.sound.add('damage')
    this.backgroundMusic = this.sound.add('backgroundMusic')
    this.backgroundMusic.play({ loop: true, volume: 0.15 });

    // Adding 2 background objects to make a scrolling background.
    this.bg = this.add.sprite(this.canvas.width/2, 0 - this.bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
    this.physics.add.existing(this.bg)
    this.bg2 = this.add.sprite(this.canvas.width/2, 5 - this.bg.body.height - this.bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
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
    this.healthText = this.add.text(this.canvas.width - 16, 16, '', { fontSize: '32px', fill: '#fff' }).setOrigin(1, 0)
    this.healthText.text = 'HP: ' + this.health

    console.log(this)
    level1(this)
  }

  update(time, delta) {
    //logAllEntities(this)
    scrollBackground(this)
    this.enemies.children.each((enemy) => {
      enemy.update(time, delta)
    }, this);
    this.playerMovement()
    this.destroyLasers()

    this.physics.add.overlap(this.enemies, this.lasers, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyLasers, this.hit, null, this);
  }

  destroyLasers() {
    this.lasers.children.each((laser) => {
      if (laser.y <= -30) { laser.destroy() }
    }, this)
    this.enemyLasers.children.each((laser) => {
      if (laser.y >= this.canvas.height + 30) { laser.destroy() }
    }, this)
  }

  startWave(wave) {
    spawnEnemies.call(this, wave.enemies.length)
    function spawnEnemies(enemiesToAdd) {
      if (enemiesToAdd > 0) {
        let enemy = new wave.enemies[wave.enemies.length - enemiesToAdd](this, wave.waypoints[0].x, wave.waypoints[0].y, true)
        this.enemies.add(enemy)

        for (let j=1; j < wave.waypoints.length; j++) {
          enemy.queueWaypoint(wave.waypoints[j])
        }

        setTimeout(() => spawnEnemies.call(this, enemiesToAdd - 1), wave.timeBetweenSpawn * 1000)
      } else if (enemiesToAdd <= 0) { return }
    }
  }

  createSimpleEnemy(x, y, type) {
    let enemy = new type(this, x, y)
    this.enemies.add(enemy)
    return enemy
  }

  hitEnemy(enemy, laser) {
    enemy.hit(laser.damage)
    laser.destroy()
  }

  hit(player, laser) {
    this.health -= laser.damage
    laser.destroy()
    if (this.health <= 0) {
      this.health = 0
      player.destroy
      console.log("Game Over!")
    } else { 
      this.healthText.text = 'HP: ' + this.health
      this.damageSound.play()
    }
  }

  playerMovement() {
    this.player.body.velocity.x = 0
    this.player.body.velocity.y = 0

    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -450
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = 450
    }
    if (this.cursors.up.isDown && this.player.y > this.canvas.height/4 * 3) {
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