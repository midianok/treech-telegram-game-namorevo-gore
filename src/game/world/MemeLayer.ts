import Phaser from 'phaser';

import { GROUND_HEIGHT } from '../constants';

const MEME_COUNT = 11;
const DISPLAY_WIDTH_MIN = 140;
const DISPLAY_WIDTH_MAX = 195;
const SPEED_MIN = 1.0;
const SPEED_MAX = 2.5;
const MAX_SPAWN_DELAY = 5000;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = GROUND_HEIGHT + 20;

const MEME_URLS: string[] = Array.from(
  { length: MEME_COUNT },
  (_, i) => new URL(`../../assets/memes/${i + 1}.jpg`, import.meta.url).href,
);

function memeKey(index: number): string {
  return `meme_${index + 1}`;
}

export class MemeLayer {
  private activeImage: Phaser.GameObjects.Image | null = null;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private currentSpeed = 0;
  private width = 0;
  private height = 0;
  private pendingKey: string | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  create(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.preloadRandom();
    this.scheduleSpawn(Math.random() * MAX_SPAWN_DELAY);
  }

  update(): void {
    if (!this.activeImage) return;

    this.activeImage.x -= this.currentSpeed;

    if (this.activeImage.x + this.activeImage.displayWidth / 2 < 0) {
      this.activeImage.destroy();
      this.activeImage = null;
      this.scheduleSpawn(Math.random() * MAX_SPAWN_DELAY);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  destroy(): void {
    this.spawnTimer?.remove(false);
    this.activeImage?.destroy();
    this.activeImage = null;
  }

  private scheduleSpawn(delay: number): void {
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.scene.time.delayedCall(delay, () => this.trySpawn());
  }

  private trySpawn(): void {
    const index = Math.floor(Math.random() * MEME_COUNT);
    const key = memeKey(index);

    if (this.scene.textures.exists(key)) {
      this.showMeme(key);
    } else {
      this.loadAndShow(key, index);
    }

    // Preload another random meme in the background for next time
    this.preloadRandom();
  }

  private loadAndShow(key: string, index: number): void {
    if (this.pendingKey === key) return;

    this.pendingKey = key;
    this.scene.load.once(`filecomplete-image-${key}`, () => {
      if (this.pendingKey === key) {
        this.pendingKey = null;
        this.showMeme(key);
      }
    });
    this.scene.load.image(key, MEME_URLS[index]);
    this.scene.load.start();
  }

  private preloadRandom(): void {
    const index = Math.floor(Math.random() * MEME_COUNT);
    const key = memeKey(index);
    if (!this.scene.textures.exists(key) && this.pendingKey !== key) {
      this.scene.load.image(key, MEME_URLS[index]);
      this.scene.load.start();
    }
  }

  private showMeme(key: string): void {
    if (this.activeImage) return;

    const displayWidth =
      DISPLAY_WIDTH_MIN + Math.random() * (DISPLAY_WIDTH_MAX - DISPLAY_WIDTH_MIN);

    const img = this.scene.add.image(this.width + displayWidth, 0, key);
    const scale = displayWidth / img.width;
    img.setScale(scale).setAlpha(0.92);

    const minY = TOP_MARGIN + img.displayHeight / 2;
    const maxY = this.height - BOTTOM_MARGIN - img.displayHeight / 2;
    img.y = minY + Math.random() * Math.max(0, maxY - minY);

    this.currentSpeed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    this.activeImage = img;
  }
}
