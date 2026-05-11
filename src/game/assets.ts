import Phaser from 'phaser';

import { AssetKey, FinishSoundKeys } from './assetKeys';
import { createWorldTextures } from './textures/createWorldTextures';

const finishSoundFiles = [
  new URL('../assets/sounds/finish/я_пид.ogg', import.meta.url).href,
  new URL('../assets/sounds/finish/условкой_не_отделаешься.ogg', import.meta.url).href,
];

export function preloadGameAssets(scene: Phaser.Scene): void {
  scene.load.image(AssetKey.Bird, new URL('../assets/namor.jpg', import.meta.url).href);
  scene.load.image(AssetKey.Pipe, new URL('../assets/pipe.png', import.meta.url).href);
  scene.load.audio(AssetKey.FlySound, new URL('../assets/sounds/fly.ogg', import.meta.url).href);
  FinishSoundKeys.forEach((key, i) => {
    scene.load.audio(key, finishSoundFiles[i]);
  });
  createWorldTextures(scene);
}
