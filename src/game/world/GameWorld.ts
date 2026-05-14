import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';
import { GROUND_HEIGHT } from '../constants';
import { MemeLayer } from './MemeLayer';

const GROUND_BODY_HEIGHT = 56;
const GROUND_BODY_OFFSET_Y = 16;

export class GameWorld {
  private background!: Phaser.GameObjects.Rectangle;
  private wall!: Phaser.GameObjects.TileSprite;
  private memeLayer!: MemeLayer;
  private ground!: Phaser.GameObjects.TileSprite;
  private groundTopY = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  create(width: number, height: number): void {
    this.background = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x080004);
    this.groundTopY = height - GROUND_HEIGHT;

    this.wall = this.scene.add.tileSprite(width / 2, height / 2, width, height, AssetKey.Wall);
    this.memeLayer = new MemeLayer(this.scene);
    this.memeLayer.create(width, height);
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
    this.memeLayer.resize(width, height);
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
    this.memeLayer.update();
    this.ground.tilePositionX += isRunning ? pipeSpeed * -0.013 : 0.6;
  }
}
