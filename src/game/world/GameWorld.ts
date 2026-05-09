import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';
import { GROUND_HEIGHT } from '../constants';

const GROUND_BODY_HEIGHT = 56;
const GROUND_BODY_OFFSET_Y = 16;

export class GameWorld {
  private background!: Phaser.GameObjects.Rectangle;
  private wall!: Phaser.GameObjects.TileSprite;
  private ceiling!: Phaser.GameObjects.TileSprite;
  private chains!: Phaser.GameObjects.TileSprite;
  private decor!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private groundTopY = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  create(width: number, height: number): void {
    this.background = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x080004);
    this.groundTopY = height - GROUND_HEIGHT;

    this.wall = this.scene.add.tileSprite(width / 2, height / 2, width, height, AssetKey.Wall);
    this.ceiling = this.scene.add.tileSprite(width / 2, 20, width, 40, AssetKey.Ceiling);
    this.chains = this.scene.add.tileSprite(width / 2, 135, width, 200, AssetKey.Chains);
    this.decor = this.scene.add.tileSprite(width / 2, height - 190, width, 240, AssetKey.Decor);
    this.ground = this.scene.add.tileSprite(
      width / 2,
      height - GROUND_HEIGHT / 2,
      width,
      GROUND_HEIGHT,
      AssetKey.Ground,
    );

    this.scene.physics.add.existing(this.ground, true);
    const groundBody = this.ground.body as Phaser.Physics.Arcade.StaticBody;
    groundBody.setSize(width, GROUND_BODY_HEIGHT).setOffset(0, GROUND_BODY_OFFSET_Y);
  }

  resize(width: number, height: number): void {
    this.groundTopY = height - GROUND_HEIGHT;
    const groundTopY = this.groundTopY;
    const groundHeight = GROUND_HEIGHT;

    this.background.setPosition(width / 2, height / 2).setSize(width, height);
    this.wall.setPosition(width / 2, height / 2).setSize(width, height);
    this.ceiling.setPosition(width / 2, 20).setSize(width, 40);
    this.chains.setPosition(width / 2, 135).setSize(width, 200);
    this.decor.setPosition(width / 2, groundTopY - 118).setSize(width, 240);
    this.ground.setPosition(width / 2, groundTopY + groundHeight / 2).setSize(width, groundHeight);

    const groundBody = this.ground.body as Phaser.Physics.Arcade.StaticBody;
    groundBody.setSize(width, GROUND_BODY_HEIGHT).setOffset(0, GROUND_BODY_OFFSET_Y);
    groundBody.updateFromGameObject();
  }

  get groundObject(): Phaser.GameObjects.TileSprite {
    return this.ground;
  }

  update(isRunning: boolean, pipeSpeed: number): void {
    this.wall.tilePositionX += 0.05;
    this.ceiling.tilePositionX += 0.3;
    this.chains.tilePositionX += 0.15;
    this.decor.tilePositionX += 0.5;
    this.ground.tilePositionX += isRunning ? pipeSpeed * -0.013 : 0.6;
  }
}
