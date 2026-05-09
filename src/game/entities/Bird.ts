import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';
import { BIRD_GRAVITY, BIRD_JUMP_VELOCITY } from '../constants';
import type { ArcadeBodySprite } from '../types/physics';

const BIRD_START_X = 130;
const BIRD_SIZE = 68;
const BIRD_DEPTH = 5;
const IDLE_FLOAT_DISTANCE = 12;

export class Bird {
  private sprite!: ArcadeBodySprite;

  constructor(private readonly scene: Phaser.Scene) {}

  create(startY: number): void {
    this.sprite = this.scene.physics.add.sprite(BIRD_START_X, startY, AssetKey.Bird) as ArcadeBodySprite;
    this.sprite.setDisplaySize(BIRD_SIZE, BIRD_SIZE);
    this.sprite.setDepth(BIRD_DEPTH);
    this.sprite.body.setSize(BIRD_SIZE, BIRD_SIZE, false);
    this.sprite.body.setOffset(0, 0);
    this.sprite.setCollideWorldBounds(false);
    this.body.setGravityY(0);

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y + IDLE_FLOAT_DISTANCE,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  get gameObject(): ArcadeBodySprite {
    return this.sprite;
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body;
  }

  get y(): number {
    return this.sprite.y;
  }

  enableGravity(): void {
    this.body.setGravityY(BIRD_GRAVITY);
  }

  flap(): void {
    this.sprite.setVelocityY(BIRD_JUMP_VELOCITY);
  }

  stopIdleAnimation(): void {
    this.scene.tweens.killTweensOf(this.sprite);
  }

  updateIdleRotation(): void {
    this.sprite.rotation = Phaser.Math.Clamp(this.sprite.rotation - 0.03, -0.2, 0.3);
  }

  updateFlightRotation(): void {
    this.sprite.rotation = Phaser.Math.Clamp(this.body.velocity.y / 650, -0.45, 0.8);
  }

  markDead(): void {
    this.sprite.setTint(0xff7777);
    this.sprite.setVelocity(0, 220);
    this.sprite.setAngularVelocity(180);
  }
}
