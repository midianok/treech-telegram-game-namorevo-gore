import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';
import { GROUND_HEIGHT, PIPE_WIDTH } from '../constants';
import { getPipeGap, getPipeSpeed } from '../difficulty';
import type { ScorerZone } from './ScorerZone';

const MIN_GAP_TOP = 90;
const GAP_BOTTOM_MARGIN = 190;
const PIPE_SPAWN_OFFSET_X = PIPE_WIDTH;
const SCORER_WIDTH = 10;
const SCORER_X_OFFSET = 8;
const SCORER_MIN_X = -20;
const PIPE_DEPTH = 3;

// Контур pipe.png по анализу альфа-канала: конусообразный, узкий кончик (~42% ширины)
// расширяется к основанию (~93%). Arcade Physics поддерживает только AABB на тело,
// поэтому форма аппроксимируется лесенкой из нескольких прямоугольных зон.
// yStart/yEnd — доли по высоте сверху вниз (для не-флипнутого спрайта: 0=кончик, 1=основание).
// widthRatio — доля от PIPE_WIDTH.
const PIPE_HITBOX_SEGMENTS: ReadonlyArray<{
  yStart: number;
  yEnd: number;
  widthRatio: number;
}> = [
  { yStart: 0.02, yEnd: 0.05, widthRatio: 0.42 },
  { yStart: 0.05, yEnd: 0.12, widthRatio: 0.62 },
  { yStart: 0.12, yEnd: 0.22, widthRatio: 0.78 },
  { yStart: 0.22, yEnd: 0.85, widthRatio: 0.84 },
  { yStart: 0.85, yEnd: 0.99, widthRatio: 0.93 },
];

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

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    this.pipes = this.scene.physics.add.group({ allowGravity: false, immovable: true });
    this.scorers = this.scene.physics.add.group({ allowGravity: false, immovable: true });
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
    const gapTop = Phaser.Math.Between(MIN_GAP_TOP, sceneHeight - GAP_BOTTOM_MARGIN - gap);
    const gapCenter = gapTop + gap / 2;
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
      ? PIPE_HITBOX_SEGMENTS.map((s) => ({
          widthRatio: s.widthRatio,
          yStart: 1 - s.yEnd,
          yEnd: 1 - s.yStart,
        }))
      : PIPE_HITBOX_SEGMENTS;

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
