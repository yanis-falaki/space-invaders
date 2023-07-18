import { EnemyBlue, EnemyRed } from "./EnemyClasses.js"
import { scrollBackground, logAllEntities, delay } from "./helpers.js"
import { levels } from "./levels.js"

export class GameScene extends Phaser.Scene 
{
  constructor() {
    super('GameScene')
    this.canShoot = true
    this.shootCooldown = 0.2
    this.health = 100
    this.score = 0
    this.currentLevel = 1
    this.levelFinished = true
    this.isLost = false
  }
  // Using this to keep track of global variables
  player
  cursors
  enemies
  enemyLasers
  lasers
  currentLevel
  score
  health
  bg
  bg2
  bgBuffer = 100
  canShoot
  shootCooldown
  levelFinished
  isLost

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
    this.load.audio('levelUp', 'assets/levelUp.wav')
    this.load.audio('enemyShoot', 'assets/enemyShoot.wav')
    this.load.audio('winSound', 'assets/winSound.wav')
    this.load.audio('loseSound', 'assets/loseSound.wav')

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
    this.enemyShootSound = this.sound.add('enemyShoot')
    this.winSound = this.sound.add('winSound')
    this.loseSound = this.sound.add('loseSound')

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

    this.nextLevel()
  }

  update() {
    //logAllEntities(this)
    scrollBackground(this)
    this.enemies.children.each((enemy) => {
      enemy.update(this.isLost)
    }, this)
    this.playerMovement()
    this.destroyLasers()

    this.physics.add.overlap(this.enemies, this.lasers, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyLasers, this.hit, null, this);

    this.nextLevel()
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
    if (this.isLost) { return }
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

  createSimpleEnemy(x, y, type, killOnEnd=false) {
    if (this.isLost) { return }
    let enemy = new type(this, x, y, killOnEnd)
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
      this.explodeEnemySound.play()
      let explosionSprite = this.add.sprite(player.x, player.y, 'explosion_1').setScale(0.25)
      explosionSprite.play('explosion', false)
      explosionSprite.once('animationcomplete', () => {
          explosionSprite.destroy()
      })
      player.destroy()
      this.health = 0
      // LevelUpText() also handles win/loss
      this.levelUpText(-1)
    } else { 
      this.damageSound.play()
    }
    this.healthText.text = 'HP: ' + this.health
  }

  playerMovement() {
    if (this.isLost) { return }
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
    if (this.canShoot == true) {
      this.canShoot = false
      let laser = this.add.sprite(this.player.x, this.player.y - 30, 'laserGreen').setScale(0.65)
      laser.damage = 10
      this.physics.add.existing(laser)
      this.lasers.add(laser)
      laser.body.velocity.y = -800
      setTimeout(() => this.canShoot = true, this.shootCooldown*1000)
    }
  }

  // Decided to make this function responsible for win, levelup, and lose state. Was originally going to make post-game menu
  async levelUpText(gameState=0) {
    let transmissionTime = 2
    let delayTime = 0.1
    let amountOfSwitches = transmissionTime/delayTime

    let levelText = this.add.text(400, 300, '', { fontSize: '56px', fill: '#ff0000', fontStyle: 'bold', }).setOrigin(0.5)

    if (gameState === 0) {
      let levelUpSound = this.sound.add('levelUp')
      levelUpSound.play({ volume: 0.30 })
      levelText.text = 'LEVEL ' + this.currentLevel
    }
    else if (gameState === 1) { 
      this.winSound.play({volume: 0.5})
      levelText.text = 'YOU WIN'
      transmissionTime = 5
      delayTime = 0.25
     }
     else if (gameState === -1) {
      this.isLost = true
      this.loseSound.play()
      this.enemies.children.each((enemy) => {
        enemy.destroy()
      }, this)
      levelText.text = 'YOU LOSE'
      transmissionTime = 5
      delayTime = 0.25
     }

    for (let i = 0; i < amountOfSwitches; i++) {
      if (i % 2 === 0) {
        levelText.setStyle({ fill: '#ff0000' })
      } else {
        levelText.setStyle({ fill: '#aaaaff' });
      }
      await delay(delayTime)
    }
    levelText.destroy()
    if (gameState === 1 || gameState === -1) {
      console.log(this)
      this.scene.start('StartScene')
      this.scene.remove()
     }
  }

  async nextLevel() {
    if (!this.levelFinished || this.enemies.countActive() > 0 || this.isLost) return
    this.levelFinished = false
    if (this.currentLevel in levels) {
      await delay(1.5)
      this.levelUpText()
      await delay(1)
      const levelFunction = levels[this.currentLevel]
      levelFunction(this)
      this.currentLevel++
    } else {
      console.log("You WIN!")
      await delay(1.5)
      this.levelUpText(1)
    }
  }
}