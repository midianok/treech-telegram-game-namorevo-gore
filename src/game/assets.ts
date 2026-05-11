import Phaser from 'phaser';

import { AssetKey } from './assetKeys';
import { createWorldTextures } from './textures/createWorldTextures';

export function preloadGameAssets(scene: Phaser.Scene): void {
  scene.load.image(AssetKey.Bird, new URL('../assets/namor.jpg', import.meta.url).href);
  scene.load.image(AssetKey.Pipe, new URL('../assets/pipe.png', import.meta.url).href);
  createWorldTextures(scene);
}
