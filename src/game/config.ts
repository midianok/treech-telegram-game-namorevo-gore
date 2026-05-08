import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { FlappyScene } from '../scenes/FlappyScene';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const width = window.innerWidth || GAME_WIDTH;
  const height = window.innerHeight || GAME_HEIGHT;

  return {
    type: Phaser.AUTO,
    parent: 'app',
    width,
    height,
    backgroundColor: '#080004',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [FlappyScene],
  };
}
