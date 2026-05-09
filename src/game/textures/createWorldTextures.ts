import Phaser from 'phaser';

import { AssetKey } from '../assetKeys';

export function createWorldTextures(scene: Phaser.Scene): void {
  createWallTexture(scene);
  createCeilingTexture(scene);
  createChainsTexture(scene);
  createDecorTexture(scene);
  createGroundTexture(scene);
}

function createWallTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0x0d0006, 1);
  g.fillRect(0, 0, 128, 64);

  g.fillStyle(0x3e1022, 1);
  g.fillRect(2, 2, 58, 28);
  g.fillRect(68, 2, 58, 28);

  g.fillStyle(0x300c1a, 1);
  g.fillRect(2, 34, 28, 28);
  g.fillRect(36, 34, 58, 28);
  g.fillRect(100, 34, 26, 28);

  g.fillStyle(0x4e1830, 1);
  g.fillRect(2, 2, 58, 3);
  g.fillRect(68, 2, 58, 3);
  g.fillRect(2, 34, 28, 3);
  g.fillRect(36, 34, 58, 3);
  g.fillRect(100, 34, 26, 3);

  g.fillStyle(0x1a0610, 1);
  g.fillRect(10, 6, 12, 8);
  g.fillRect(80, 10, 8, 6);
  g.fillRect(44, 38, 10, 7);
  g.fillRect(110, 36, 6, 5);

  g.generateTexture(AssetKey.Wall, 128, 64);
  g.destroy();
}

function createCeilingTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const width = 480;
  const height = 40;

  g.fillStyle(0x150810, 1);
  g.fillRect(0, 0, width, height);

  g.fillStyle(0x2a1420, 1);
  for (let x = 0; x < width; x += 80) {
    g.fillRect(x + 2, 2, 76, height - 6);
  }

  g.fillStyle(0x0a0408, 1);
  for (let x = 80; x < width; x += 80) {
    g.fillRect(x - 1, 0, 3, height);
  }

  g.fillStyle(0x999999, 1);
  for (let x = 55; x < width; x += 120) {
    g.fillCircle(x, height - 5, 6);
    g.fillStyle(0x111111, 1);
    g.fillCircle(x, height - 5, 3);
    g.fillStyle(0x999999, 1);
  }

  g.fillStyle(0x050203, 1);
  g.fillRect(0, height - 4, width, 4);

  g.generateTexture(AssetKey.Ceiling, width, height);
  g.destroy();
}

function createChainsTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const width = 320;
  const height = 200;

  const drawLink = (x: number, y: number, vertical: boolean): void => {
    g.fillStyle(0x909090, 1);

    if (vertical) {
      g.fillEllipse(x, y + 7, 9, 15);
      g.fillStyle(0x1a0a10, 1);
      g.fillEllipse(x, y + 7, 5, 9);
    } else {
      g.fillEllipse(x, y + 7, 15, 9);
      g.fillStyle(0x1a0a10, 1);
      g.fillEllipse(x, y + 7, 9, 5);
    }

    g.fillStyle(0x909090, 1);
  };

  const drawChain = (x: number, links: number): void => {
    for (let i = 0; i < links; i += 1) {
      drawLink(x, i * 13, i % 2 === 0);
    }
  };

  const drawCandle = (x: number, baseY: number, candleHeight: number): void => {
    g.fillStyle(0xcca060, 1);
    g.fillRect(x - 4, baseY - candleHeight, 9, candleHeight);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(x, baseY - candleHeight - 5, 2, 6);
    g.fillStyle(0xff4400, 1);
    g.fillEllipse(x + 1, baseY - candleHeight - 10, 9, 14);
    g.fillStyle(0xff9900, 1);
    g.fillEllipse(x + 1, baseY - candleHeight - 13, 6, 10);
    g.fillStyle(0xffee66, 1);
    g.fillEllipse(x + 1, baseY - candleHeight - 15, 4, 7);
    g.fillStyle(0xcca060, 1);
    g.fillEllipse(x + 1, baseY, 11, 7);
  };

  drawChain(28, 8);
  drawChain(40, 6);

  drawChain(130, 10);
  g.fillStyle(0x777777, 1);
  g.fillRect(104, 130, 54, 5);
  g.fillRect(100, 125, 8, 10);
  g.fillRect(154, 125, 8, 10);
  drawCandle(110, 130, 24);
  drawCandle(131, 130, 24);
  drawCandle(152, 130, 24);

  drawChain(230, 7);
  drawChain(244, 11);
  drawChain(295, 5);

  g.generateTexture(AssetKey.Chains, width, height);
  g.destroy();
}

function createDecorTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const width = 520;
  const height = 210;
  const baseY = height;

  const crossX = 65;
  const crossWidth = 72;
  const crossHeight = 188;
  const halfBeamWidth = 7;

  g.fillStyle(0x3c0e20, 1);
  g.fillTriangle(
    crossX - crossWidth / 2 - halfBeamWidth,
    baseY - crossHeight,
    crossX - crossWidth / 2 + halfBeamWidth,
    baseY - crossHeight,
    crossX + crossWidth / 2 + halfBeamWidth,
    baseY,
  );
  g.fillTriangle(
    crossX - crossWidth / 2 - halfBeamWidth,
    baseY - crossHeight,
    crossX + crossWidth / 2 + halfBeamWidth,
    baseY,
    crossX + crossWidth / 2 - halfBeamWidth,
    baseY,
  );
  g.fillTriangle(
    crossX + crossWidth / 2 - halfBeamWidth,
    baseY - crossHeight,
    crossX + crossWidth / 2 + halfBeamWidth,
    baseY - crossHeight,
    crossX - crossWidth / 2 + halfBeamWidth,
    baseY,
  );
  g.fillTriangle(
    crossX + crossWidth / 2 + halfBeamWidth,
    baseY - crossHeight,
    crossX - crossWidth / 2 + halfBeamWidth,
    baseY,
    crossX - crossWidth / 2 - halfBeamWidth,
    baseY,
  );

  g.fillStyle(0x888888, 1);
  g.fillCircle(crossX - crossWidth / 2, baseY - crossHeight + 6, 7);
  g.fillCircle(crossX + crossWidth / 2, baseY - crossHeight + 6, 7);
  g.fillCircle(crossX - crossWidth / 2, baseY - 6, 7);
  g.fillCircle(crossX + crossWidth / 2, baseY - 6, 7);
  g.fillStyle(0x444444, 1);
  g.fillCircle(crossX - crossWidth / 2, baseY - crossHeight + 6, 4);
  g.fillCircle(crossX + crossWidth / 2, baseY - crossHeight + 6, 4);
  g.fillCircle(crossX - crossWidth / 2, baseY - 6, 4);
  g.fillCircle(crossX + crossWidth / 2, baseY - 6, 4);

  const rackX = 168;
  g.fillStyle(0x2e0c18, 1);
  g.fillRect(rackX, height - 62, 110, 10);
  g.fillRect(rackX + 6, height - 52, 10, 52);
  g.fillRect(rackX + 94, height - 52, 10, 52);
  g.fillRect(rackX, height - 32, 110, 6);
  g.fillStyle(0x777777, 1);
  g.fillRect(rackX + 10, height - 62, 4, 16);
  g.fillRect(rackX + 96, height - 62, 4, 16);
  g.fillCircle(rackX + 12, height - 46, 5);
  g.fillCircle(rackX + 98, height - 46, 5);

  const cageX = 352;
  const cageHeight = 148;
  const cageWidth = 64;
  g.fillStyle(0x666666, 1);
  for (let i = 0; i <= 4; i += 1) {
    g.fillRect(cageX + i * 16, height - cageHeight, 4, cageHeight);
  }
  g.fillRect(cageX, height - cageHeight, cageWidth + 4, 5);
  g.fillRect(cageX, height - Math.round(cageHeight * 0.6), cageWidth + 4, 4);
  g.fillRect(cageX, height - 5, cageWidth + 4, 5);
  g.fillStyle(0x999999, 1);
  g.fillCircle(cageX + 4, height - cageHeight + 12, 4);
  g.fillCircle(cageX + 4, height - cageHeight + 30, 4);

  const torchX = 462;
  g.fillStyle(0x3c0e20, 1);
  g.fillRect(torchX + 2, height - 115, 7, 75);
  g.fillRect(torchX - 18, height - 115, 26, 7);
  g.fillStyle(0x5a2a00, 1);
  g.fillRect(torchX - 10, height - 128, 10, 16);
  g.fillStyle(0xff4400, 1);
  g.fillEllipse(torchX - 5, height - 136, 12, 16);
  g.fillStyle(0xff9900, 1);
  g.fillEllipse(torchX - 5, height - 140, 8, 12);
  g.fillStyle(0xffee44, 1);
  g.fillEllipse(torchX - 5, height - 143, 5, 8);

  g.generateTexture(AssetKey.Decor, width, height);
  g.destroy();
}

function createGroundTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0x181010, 1);
  g.fillRect(0, 0, 96, 72);

  g.fillStyle(0x271518, 1);
  g.fillRect(2, 4, 44, 30);
  g.fillRect(52, 4, 44, 30);
  g.fillRect(27, 40, 44, 30);

  g.fillStyle(0x1f1014, 1);
  g.fillRect(2, 4, 44, 4);
  g.fillRect(52, 4, 44, 4);
  g.fillRect(27, 40, 44, 4);

  g.fillStyle(0x0c0808, 1);
  g.fillRect(0, 36, 96, 3);
  g.fillRect(50, 0, 2, 36);
  g.fillRect(25, 38, 2, 34);
  g.fillRect(75, 38, 2, 34);

  g.fillStyle(0x2a0510, 1);
  g.fillRect(0, 0, 96, 4);

  g.generateTexture(AssetKey.Ground, 96, 72);
  g.destroy();
}
