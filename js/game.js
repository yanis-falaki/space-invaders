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
}

function update() {
  if (bg.y > config.height) {
    RepositionBG(bg)
  } else if (bg2.y > config.height) {
    RepositionBG(bg2)
  }

  player.body.velocity.x = 0
  player.body.velocity.y = 0

  if (cursors.left.isDown) {
    player.body.velocity.x = -300
  } else if (cursors.right.isDown) {
    player.body.velocity.x = 300
  }
  if (cursors.up.isDown) {
    player.body.velocity.y = -200
  } else if (cursors.down.isDown) {
    player.body.velocity.y = 200
  }
}

function RepositionBG(background) {
  background.y = 5 - background.body.height - bgBuffer
}