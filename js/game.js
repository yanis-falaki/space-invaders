import { GameScene } from "./gameScene.js";

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