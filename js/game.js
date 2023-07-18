import { GameScene } from "./gameScene.js";
import { StartScene } from "./startScene.js";

let sceneToStart = new StartScene()
//export let sceneToPlay = new GameScene()

let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: [sceneToStart],
  physics: {
    default: 'arcade'
  }
};

let game = new Phaser.Game(config);