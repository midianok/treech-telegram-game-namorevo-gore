export type ArcadeBodySprite = Phaser.Physics.Arcade.Sprite & {
  body: Phaser.Physics.Arcade.Body;
};

export type ArcadeBodyZone = Phaser.GameObjects.Zone & {
  body: Phaser.Physics.Arcade.Body;
};
