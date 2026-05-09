import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';
import { GROUND_HEIGHT, PIPE_WIDTH } from '../constants';
import { getPipeGap, getPipeSpeed } from '../difficulty';
import type { ScorerZone } from './ScorerZone';

const MIN_GAP_TOP = 90;
const GAP_BOTTOM_MARGIN = 190;
const MAX_GAP_CENTER_DELTA = 160;
const PIPE_SPAWN_OFFSET_X = PIPE_WIDTH;
const SCORER_WIDTH = 10;
const SCORER_X_OFFSET = 8;
const SCORER_MIN_X = -20;
const PIPE_DEPTH = 3;
const HITBOX_SEGMENTS = 20;
const ALPHA_THRESHOLD = 10;

interface HitboxSegment {
  yStart: number;
  yEnd: number;
  widthRatio: number;
}

function buildPipeHitboxSegments(scene: Phaser.Scene, numSegments: number): ReadonlyArray<HitboxSegment> {
  const source = scene.textures.get(AssetKey.Pipe).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const w = 'naturalWidth' in source ? source.naturalWidth : (source as HTMLCanvasElement).width;
  const h = 'naturalHeight' in source ? source.naturalHeight : (source as HTMLCanvasElement).height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  const result: HitboxSegment[] = [];
  const segH = 1 / numSegments;

  for (let i = 0; i < numSegments; i++) {
    const yStart = i * segH;
    const yEnd = (i + 1) * segH;
    const rowStart = Math.floor(yStart * h);
    const rowEnd = Math.min(Math.ceil(yEnd * h), h);

    let minX = w;
    let maxX = -1;

    for (let row = rowStart; row < rowEnd; row++) {
      for (let x = 0; x < w; x++) {
        if (data[(row * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (maxX >= minX) {
      result.push({ yStart, yEnd, widthRatio: (maxX - minX + 1) / w });
    }
  }

  return result;
}

interface PipeLeaderZone extends Phaser.GameObjects.Zone {
  pipeVisual: Phaser.GameObjects.Image;
  pipeVisualOffsetY: number;
}

function isPipeLeaderZone(obj: unknown): obj is PipeLeaderZone {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'pipeVisual' in obj &&
    (obj as { pipeVisual?: unknown }).pipeVisual !== undefined
  );
}

export class PipeManager {
  private pipes!: Phaser.Physics.Arcade.Group;
  private scorers!: Phaser.Physics.Arcade.Group;
  private hitboxSegments: ReadonlyArray<HitboxSegment> = [];
  private lastGapCenter: number | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    this.pipes = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    this.scorers = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    this.hitboxSegments = buildPipeHitboxSegments(this.scene, HITBOX_SEGMENTS);
  }

  get pipeGroup(): Phaser.Physics.Arcade.Group {
    return this.pipes;
  }

  get scorerGroup(): Phaser.Physics.Arcade.Group {
    return this.scorers;
  }

  spawn(score: number, sceneWidth: number, sceneHeight: number): void {
    const speed = getPipeSpeed(score);
    const gap = getPipeGap(score);
    const halfGap = gap / 2;
    const minGapTop = MIN_GAP_TOP;
    const maxGapTop = sceneHeight - GAP_BOTTOM_MARGIN - gap;

    let clampedMin = minGapTop;
    let clampedMax = maxGapTop;
    if (this.lastGapCenter !== null) {
      clampedMin = Math.max(minGapTop, this.lastGapCenter - MAX_GAP_CENTER_DELTA - halfGap);
      clampedMax = Math.min(maxGapTop, this.lastGapCenter + MAX_GAP_CENTER_DELTA - halfGap);
      if (clampedMin > clampedMax) {
        clampedMin = minGapTop;
        clampedMax = maxGapTop;
      }
    }

    const gapTop = Phaser.Math.Between(Math.round(clampedMin), Math.round(clampedMax));
    const gapCenter = gapTop + halfGap;
    this.lastGapCenter = gapCenter;
    const bottomY = gapTop + gap;
    const bottomHeight = sceneHeight - GROUND_HEIGHT - bottomY;
    const pipeX = sceneWidth + PIPE_SPAWN_OFFSET_X;

    this.createPipe(pipeX, gapTop / 2, gapTop, speed, true);
    this.createPipe(pipeX, bottomY + bottomHeight / 2, bottomHeight, speed, false);
    this.createScorer(pipeX + SCORER_X_OFFSET, gapCenter, gap, speed);
  }

  update(): void {
    this.syncPipeVisuals();
    this.destroyObjectsOutsideScreen(this.pipes, -PIPE_WIDTH);
    this.destroyObjectsOutsideScreen(this.scorers, SCORER_MIN_X);
  }

  setSpeed(speed: number): void {
    this.pipes.setVelocityX(speed);
    this.scorers.setVelocityX(speed);
  }

  stop(): void {
    this.pipes.setVelocityX(0);
    this.scorers.setVelocityX(0);
  }

  private createPipe(x: number, y: number, height: number, speed: number, flipY: boolean): void {
    const visual = this.scene.add.image(x, y, AssetKey.Pipe);
    visual.setDisplaySize(PIPE_WIDTH, height);
    visual.setFlipY(flipY);
    visual.setDepth(PIPE_DEPTH);

    const topY = y - height / 2;
    const segments = flipY
      ? this.hitboxSegments.map((s) => ({
          widthRatio: s.widthRatio,
          yStart: 1 - s.yEnd,
          yEnd: 1 - s.yStart,
        }))
      : this.hitboxSegments;

    let isLeader = true;
    for (const seg of segments) {
      const segHeight = (seg.yEnd - seg.yStart) * height;
      const segCenterY = topY + ((seg.yStart + seg.yEnd) / 2) * height;
      const segWidth = seg.widthRatio * PIPE_WIDTH;

      const zone = this.scene.add.zone(x, segCenterY, segWidth, segHeight);
      this.scene.physics.add.existing(zone);
      this.pipes.add(zone);
      const body = zone.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setVelocityX(speed);

      if (isLeader) {
        const leader = zone as PipeLeaderZone;
        leader.pipeVisual = visual;
        leader.pipeVisualOffsetY = y - segCenterY;
        isLeader = false;
      }
    }
  }

  private createScorer(x: number, y: number, height: number, speed: number): void {
    const scorer = this.scene.add.zone(x, y, SCORER_WIDTH, height) as ScorerZone;
    this.scene.physics.add.existing(scorer);
    this.scorers.add(scorer);
    scorer.body.setAllowGravity(false);
    scorer.body.setImmovable(true);
    scorer.body.setVelocityX(speed);
    scorer.scored = false;
  }

  private syncPipeVisuals(): void {
    this.pipes.children.each((child) => {
      if (isPipeLeaderZone(child)) {
        child.pipeVisual.x = child.x;
        child.pipeVisual.y = child.y + child.pipeVisualOffsetY;
      }
      return true;
    });
  }

  private destroyObjectsOutsideScreen(group: Phaser.Physics.Arcade.Group, minX: number): void {
    group.children.each((child) => {
      const gameObject = child as Phaser.GameObjects.GameObject & { x: number };

      if (gameObject.x < minX) {
        if (isPipeLeaderZone(gameObject)) {
          gameObject.pipeVisual.destroy();
        }
        gameObject.destroy();
      }

      return true;
    });
  }
}
