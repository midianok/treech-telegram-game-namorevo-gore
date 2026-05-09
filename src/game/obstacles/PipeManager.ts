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
    const pipe = this.pipes.create(x, y, AssetKey.Pipe) as Phaser.Physics.Arcade.Sprite;
    pipe.setDisplaySize(PIPE_WIDTH, height).refreshBody();
    pipe.setVelocityX(speed);
    pipe.setFlipY(flipY);
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

  private destroyObjectsOutsideScreen(group: Phaser.Physics.Arcade.Group, minX: number): void {
    group.children.each((child) => {
      const gameObject = child as Phaser.GameObjects.GameObject & { x: number };

      if (gameObject.x < minX) {
        gameObject.destroy();
      }

      return true;
    });
  }
}
