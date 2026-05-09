import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { FlappyScene } from '../scenes/FlappyScene';
import { getTelegramViewportHeight } from '../telegram';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const { width, height } = getGameViewportSize();

  return {
    type: Phaser.AUTO,
    parent: 'app',
    width,
    height,
    backgroundColor: '#080004',
    physics: {
      default: 'arcade',
      arcade: {
        debug: import.meta.env.DEV,
      },
    },
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    scene: [FlappyScene],
  };
}

export function getGameViewportSize(): { width: number; height: number } {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? window.innerWidth;
  const height = getTelegramViewportHeight() ?? viewport?.height ?? window.innerHeight;

  return {
    width: Math.max(1, Math.ceil(width || GAME_WIDTH)),
    height: Math.max(1, Math.ceil(height || GAME_HEIGHT)),
  };
}
