import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';

export function createWorldTextures(scene: Phaser.Scene): void {
  createWallTexture(scene);
  createGroundTexture(scene);
}

function createWallTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0x0d0006, 1);
  g.fillRect(0, 0, 128, 64);

  g.fillStyle(0x3e1022, 1);
  g.fillRect(2, 2, 58, 28);
  g.fillRect(68, 2, 58, 28);

  g.fillStyle(0x300c1a, 1);
  g.fillRect(2, 34, 28, 28);
  g.fillRect(36, 34, 58, 28);
  g.fillRect(100, 34, 26, 28);

  g.fillStyle(0x4e1830, 1);
  g.fillRect(2, 2, 58, 3);
  g.fillRect(68, 2, 58, 3);
  g.fillRect(2, 34, 28, 3);
  g.fillRect(36, 34, 58, 3);
  g.fillRect(100, 34, 26, 3);

  g.fillStyle(0x1a0610, 1);
  g.fillRect(10, 6, 12, 8);
  g.fillRect(80, 10, 8, 6);
  g.fillRect(44, 38, 10, 7);
  g.fillRect(110, 36, 6, 5);

  g.generateTexture(AssetKey.Wall, 128, 64);
  g.destroy();
}

function createGroundTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0x181010, 1);
  g.fillRect(0, 0, 96, 72);

  g.fillStyle(0x271518, 1);
  g.fillRect(2, 4, 44, 30);
  g.fillRect(52, 4, 44, 30);
  g.fillRect(27, 40, 44, 30);

  g.fillStyle(0x1f1014, 1);
  g.fillRect(2, 4, 44, 4);
  g.fillRect(52, 4, 44, 4);
  g.fillRect(27, 40, 44, 4);

  g.fillStyle(0x0c0808, 1);
  g.fillRect(0, 36, 96, 3);
  g.fillRect(50, 0, 2, 36);
  g.fillRect(25, 38, 2, 34);
  g.fillRect(75, 38, 2, 34);

  g.fillStyle(0x2a0510, 1);
  g.fillRect(0, 0, 96, 4);

  g.generateTexture(AssetKey.Ground, 96, 72);
  g.destroy();
}
