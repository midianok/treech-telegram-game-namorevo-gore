import Phaser from 'phaser';

import { GROUND_HEIGHT } from '../constants';

const DISPLAY_WIDTH_MIN = 140;
const DISPLAY_WIDTH_MAX = 195;
const SPEED_MIN = 1.0;
const SPEED_MAX = 2.5;
const MAX_SPAWN_DELAY = 5000;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = GROUND_HEIGHT + 20;
const MEME_DEPTH = 1;

type MemeMediaType = 'image' | 'video';

interface MemeMedia {
  key: string;
  type: MemeMediaType;
  url: string;
}

type MemeObject = Phaser.GameObjects.Image | Phaser.GameObjects.Video;

const MEME_MODULES = import.meta.glob('../../assets/memes/*.{jpg,jpeg,png,webp,gif,mp4,webm}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const MEME_MEDIA: MemeMedia[] = Object.entries(MEME_MODULES)
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
  .map(([path, url], index) => ({
    key: `meme_${index + 1}`,
    type: isVideoPath(path) ? 'video' : 'image',
    url,
  }));

function isVideoPath(path: string): boolean {
  return /\.(mp4|webm)$/i.test(path);
}

export class MemeLayer {
  private activeMedia: MemeObject | null = null;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private currentSpeed = 0;
  private width = 0;
  private height = 0;
  private readonly pendingKeys = new Set<string>();

  constructor(private readonly scene: Phaser.Scene) {}

  create(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.preloadRandom();
    this.scheduleSpawn(Math.random() * MAX_SPAWN_DELAY);
  }

  update(): void {
    if (!this.activeMedia) return;

    this.activeMedia.x -= this.currentSpeed;

    if (this.activeMedia.x + this.activeMedia.displayWidth / 2 < 0) {
      this.activeMedia.destroy();
      this.activeMedia = null;
      this.scheduleSpawn(Math.random() * MAX_SPAWN_DELAY);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  destroy(): void {
    this.spawnTimer?.remove(false);
    this.activeMedia?.destroy();
    this.activeMedia = null;
  }

  private scheduleSpawn(delay: number): void {
    this.spawnTimer?.remove(false);
    this.spawnTimer = this.scene.time.delayedCall(delay, () => this.trySpawn());
  }

  private trySpawn(): void {
    const media = this.getRandomMedia();

    if (!media) return;

    if (this.isLoaded(media)) {
      this.showMeme(media);
    } else {
      this.loadAndShow(media);
    }

    // Preload another random meme in the background for next time
    this.preloadRandom();
  }

  private loadAndShow(media: MemeMedia): void {
    if (this.pendingKeys.has(media.key)) return;

    this.pendingKeys.add(media.key);
    this.scene.load.once(`filecomplete-${media.type}-${media.key}`, () => {
      if (this.pendingKeys.delete(media.key)) {
        this.showMeme(media);
      }
    });
    this.queueLoad(media);
    this.scene.load.start();
  }

  private preloadRandom(): void {
    const media = this.getRandomMedia();

    if (media && !this.isLoaded(media) && !this.pendingKeys.has(media.key)) {
      this.pendingKeys.add(media.key);
      this.scene.load.once(`filecomplete-${media.type}-${media.key}`, () => {
        this.pendingKeys.delete(media.key);
      });
      this.queueLoad(media);
      this.scene.load.start();
    }
  }

  private showMeme(media: MemeMedia): void {
    if (this.activeMedia) return;

    const displayWidth =
      DISPLAY_WIDTH_MIN + Math.random() * (DISPLAY_WIDTH_MAX - DISPLAY_WIDTH_MIN);

    if (media.type === 'video') {
      this.showVideo(media, displayWidth);
      return;
    }

    const img = this.scene.add.image(this.width + displayWidth, 0, media.key);
    this.configureMediaObject(img, displayWidth, img.width, img.height);
    this.activeMedia = img;
  }

  private showVideo(media: MemeMedia, displayWidth: number): void {
    const video = this.scene.add
      .video(this.width + displayWidth, 0, media.key)
      .setAlpha(0.92)
      .setDepth(MEME_DEPTH)
      .setVisible(false);

    this.activeMedia = video;
    video.once(Phaser.GameObjects.Events.VIDEO_CREATED, (_video: Phaser.GameObjects.Video, width: number, height: number) => {
      if (this.activeMedia === video) {
        this.configureMediaObject(video, displayWidth, width, height);
        video.setVisible(true);
      }
    });
    video.once(Phaser.GameObjects.Events.VIDEO_ERROR, () => {
      if (this.activeMedia === video) {
        video.destroy();
        this.activeMedia = null;
        this.scheduleSpawn(Math.random() * MAX_SPAWN_DELAY);
      }
    });
    video.play(true);
  }

  private configureMediaObject(object: MemeObject, displayWidth: number, sourceWidth: number, sourceHeight: number): void {
    const scale = displayWidth / sourceWidth;
    object.setScale(scale).setAlpha(0.92).setDepth(MEME_DEPTH);

    const displayHeight = sourceHeight * scale;
    const minY = TOP_MARGIN + displayHeight / 2;
    const maxY = this.height - BOTTOM_MARGIN - displayHeight / 2;
    object.y = minY + Math.random() * Math.max(0, maxY - minY);

    this.currentSpeed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
  }

  private isLoaded(media: MemeMedia): boolean {
    return media.type === 'video'
      ? this.scene.cache.video.exists(media.key)
      : this.scene.textures.exists(media.key);
  }

  private queueLoad(media: MemeMedia): void {
    if (media.type === 'video') {
      this.scene.load.video(media.key, media.url, true);
      return;
    }

    this.scene.load.image(media.key, media.url);
  }

  private getRandomMedia(): MemeMedia | null {
    const media = MEME_MEDIA.filter((item) => item.type === 'image' || this.canPlayVideo(item.url));

    if (media.length === 0) {
      return null;
    }

    return media[Math.floor(Math.random() * media.length)];
  }

  private canPlayVideo(url: string): boolean {
    const getVideoURL = this.scene.sys.game.device.video.getVideoURL as (urls: string) => unknown;

    return Boolean(getVideoURL(url));
  }
}
