import { scrollBackground, logAllEntities } from "./helpers.js"
import { GameScene } from "./gameScene.js";

export class StartScene extends Phaser.Scene {
  bgBuffer = 100

  constructor() {
    super('StartScene')
  }

  preload() {
    this.canvas = this.sys.game.canvas;

    this.load.image('background', '/assets/blue_bg.png')
    this.load.image('arrows', '/assets/arrowIcons.png')
    this.load.image('space', '/assets/spaceIcon.png')
    this.load.audio('backgroundMusic', 'assets/music.mp3')
  }

  create() {
    // Adding 2 background objects to make a scrolling background.
    this.bg = this.add.sprite(this.canvas.width/2, 0 - this.bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
    this.physics.add.existing(this.bg)
    this.bg2 = this.add.sprite(this.canvas.width/2, 5 - this.bg.body.height - this.bgBuffer, 'background').setScale(3.5).setOrigin(0.5, 0)
    this.physics.add.existing(this.bg2)
    this.bg.body.velocity.y = 100
    this.bg2.body.velocity.y = 100

    // Background Music
    if (!this.hasOwnProperty('backgroundMusic')){
      this.backgroundMusic = this.sound.add('backgroundMusic')
      this.backgroundMusic.play({ loop: true, volume: 0.15 });
    }

    this.title = this.add.text(400, 100, 'Starblaze Assault', {
      fontSize: '40px',
      color: '#aaaaff'
    }).setOrigin(0.5)
    this.arrows = this.add.sprite(600, 450, 'arrows').setScale(1.3)
    this.fireText = this.add.text(70, 460, 'Fire ->', {
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.space = this.add.sprite(200, 460, 'space').setScale(0.25)

    let button = this.add.text(400, 300, 'Start Game', {
      fontSize: '40px',
      color: '#fff',
    }).setOrigin(0.5).setInteractive();

    button.on('pointerout', () => {
      button.setStyle({ color: '#fff' })
    });

    button.on('pointerdown', () => {
      button.setStyle({ color: '#aa0000' })
    });

    button.on('pointerover', () => {
      button.setStyle({ color: '#aa0000' })
    });

    button.on('pointerup', () => {
      button.setStyle({ color: '#ff0000' })
      this.scene.add('GameScene', GameScene, true)
      //this.scene.start('GameScene')
    });
  }

  update() {
    //logAllEntities(this)
    scrollBackground(this)
  }
}