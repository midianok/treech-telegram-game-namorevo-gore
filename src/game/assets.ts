import Phaser from 'phaser';

import { AssetKey, FinishSoundKeys, FinishSoundURLs } from './assetKeys';
import { createWorldTextures } from './textures/createWorldTextures';

export function preloadGameAssets(scene: Phaser.Scene): void {
  scene.load.image(AssetKey.Bird, new URL('../assets/namor.jpg', import.meta.url).href);
  scene.load.image(AssetKey.Pipe, new URL('../assets/pipe.png', import.meta.url).href);
  scene.load.audio(AssetKey.FlySound, new URL('../assets/sounds/fly.ogg', import.meta.url).href);
  FinishSoundKeys.forEach((key, i) => {
    scene.load.audio(key, FinishSoundURLs[i]);
  });
  createWorldTextures(scene);
}
