import Phaser from 'phaser';

import { hapticImpact, hapticNotification } from '../telegram';
import {
  BIRD_GRAVITY,
  BIRD_JUMP_VELOCITY,
  GROUND_HEIGHT,
  PIPE_GAP,
  PIPE_SPEED,
  PIPE_WIDTH,
  STORAGE_BEST_SCORE_KEY,
} from '../game/constants';

type ScorerZone = Phaser.GameObjects.Zone & {
  body: Phaser.Physics.Arcade.Body;
  scored?: boolean;
};

export class FlappyScene extends Phaser.Scene {
  private bird!: Phaser.Physics.Arcade.Sprite;
  private wall!: Phaser.GameObjects.TileSprite;
  private ceiling!: Phaser.GameObjects.TileSprite;
  private clouds!: Phaser.GameObjects.TileSprite;
  private city!: Phaser.GameObjects.TileSprite;
  private ground!: Phaser.GameObjects.TileSprite;
  private pipes!: Phaser.Physics.Arcade.Group;
  private scorers!: Phaser.Physics.Arcade.Group;
  private pipeTimer: Phaser.Time.TimerEvent | null = null;
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private liquidatedText!: Phaser.GameObjects.Text;

  private score = 0;
  private bestScore = 0;
  private started = false;
  private isGameOver = false;

  private get W(): number { return this.scale.width; }
  private get H(): number { return this.scale.height; }

  constructor() {
    super('FlappyScene');
  }

  preload(): void {
    this.load.image('bird', new URL('../assets/namor.jpg', import.meta.url).href);
    this.createWorldTextures();
    this.load.image('pipe', new URL('../assets/pipe.png', import.meta.url).href);
  }

  create(): void {
    this.score = 0;
    this.bestScore = this.readBestScore();
    this.started = false;
    this.isGameOver = false;

    this.createWorld();
    this.createBird();
    this.createHud();

    this.pipes = this.physics.add.group({ allowGravity: false, immovable: true });
    this.scorers = this.physics.add.group({ allowGravity: false, immovable: true });

    this.physics.add.collider(this.bird, this.ground, this.endGame, undefined, this);
    this.physics.add.overlap(this.bird, this.pipes, this.endGame, undefined, this);
    this.physics.add.overlap(this.bird, this.scorers, this.addPoint, undefined, this);


    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.flap, this);
    this.input.keyboard?.on('keydown-SPACE', this.flap, this);
    this.input.keyboard?.on('keydown-UP', this.flap, this);
    this.input.keyboard?.on('keydown-R', this.resetGame, this);
  }

  update(): void {
    this.wall.tilePositionX += 0.05;
    this.ceiling.tilePositionX += 0.3;
    this.clouds.tilePositionX += 0.15;
    this.city.tilePositionX += 0.5;
    const groundScroll = this.started && !this.isGameOver ? this.getPipeSpeed() * -0.013 : 0.6;
    this.ground.tilePositionX += groundScroll;

    if (!this.started || this.isGameOver) {
      this.bird.rotation = Phaser.Math.Clamp(this.bird.rotation - 0.03, -0.2, 0.3);
      return;
    }

    this.bird.rotation = Phaser.Math.Clamp(this.getBirdBody().velocity.y / 650, -0.45, 0.8);

    if (this.bird.y < -20 || this.bird.y > this.H + 40) {
      this.endGame();
    }

    this.destroyObjectsOutsideScreen(this.pipes, -PIPE_WIDTH);
    this.destroyObjectsOutsideScreen(this.scorers, -20);
  }

  private createWorld(): void {
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x080004);

    this.wall = this.add.tileSprite(this.W / 2, this.H / 2, this.W, this.H, 'wall');
    this.ceiling = this.add.tileSprite(this.W / 2, 20, this.W, 40, 'ceiling');
    this.clouds = this.add.tileSprite(this.W / 2, 135, this.W, 200, 'chains');
    this.city = this.add.tileSprite(this.W / 2, this.H - 190, this.W, 240, 'decor');
    this.ground = this.add.tileSprite(this.W / 2, this.H - GROUND_HEIGHT / 2, this.W, GROUND_HEIGHT, 'ground');

    this.physics.add.existing(this.ground, true);
    const groundBody = this.ground.body as Phaser.Physics.Arcade.StaticBody;
    groundBody.setSize(this.W, 56).setOffset(0, 16);
  }

  private createBird(): void {
    this.bird = this.physics.add.sprite(130, this.H / 2, 'bird');
    this.bird.setDisplaySize(56, 56);
    this.bird.setCircle(22, 6, 6);
    this.bird.setCollideWorldBounds(false);
    this.getBirdBody().setGravityY(0);

    this.tweens.add({
      targets: this.bird,
      y: this.bird.y + 12,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createHud(): void {
    this.scoreText = this.add
      .text(this.W / 2, 72, '0', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '56px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.helpText = this.add
      .text(this.W / 2, this.H / 2 + 90, 'Нажми пробел, кликни или тапни', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '22px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.bestText = this.add
      .text(18, 18, `Лучший: ${this.bestScore}`, {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 4,
      })
      .setDepth(10);

    this.liquidatedText = this.add
      .text(this.W / 2, this.H / 2 - 60, 'ЛИКВИДИРОВАН', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '52px',
        fontStyle: '900',
        color: '#ff0000',
        stroke: '#1a0000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setVisible(false);
  }

  private flap(): void {
    if (this.isGameOver) {
      this.resetGame();
      return;
    }

    if (!this.started) {
      this.started = true;
      this.getBirdBody().setGravityY(BIRD_GRAVITY);
      this.spawnPipePair();
      this.schedulePipeSpawn();
      this.helpText.setVisible(false);
      this.tweens.killTweensOf(this.bird);
    }

    hapticImpact('light');
    this.bird.setVelocityY(BIRD_JUMP_VELOCITY);
  }

  private schedulePipeSpawn(): void {
    const delay = Math.max(1450 - this.getDifficultyLevel() * 55, 1000);
    this.pipeTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver && this.started) {
        this.spawnPipePair();
        this.schedulePipeSpawn();
      }
    });
  }

  private spawnPipePair(): void {
    if (this.isGameOver) {
      return;
    }

    const minGapTop = 90;
    const speed = this.getPipeSpeed();
    const gap = this.getPipeGap();
    const gapTopDynamic = Phaser.Math.Between(minGapTop, this.H - 190 - gap);
    const gapCenterDynamic = gapTopDynamic + gap / 2;
    const topHeightDynamic = gapTopDynamic;
    const bottomYDynamic = gapTopDynamic + gap;
    const bottomHeightDynamic = this.H - GROUND_HEIGHT - bottomYDynamic;

    const topPipe = this.pipes.create(this.W + PIPE_WIDTH, topHeightDynamic / 2, 'pipe') as Phaser.Physics.Arcade.Sprite;
    topPipe.setDisplaySize(PIPE_WIDTH, topHeightDynamic).refreshBody();
    topPipe.setVelocityX(speed);
    topPipe.setFlipY(true);

    const bottomPipe = this.pipes.create(
      this.W + PIPE_WIDTH,
      bottomYDynamic + bottomHeightDynamic / 2,
      'pipe',
    ) as Phaser.Physics.Arcade.Sprite;
    bottomPipe.setDisplaySize(PIPE_WIDTH, bottomHeightDynamic).refreshBody();
    bottomPipe.setVelocityX(speed);

    const scorer = this.add.zone(this.W + PIPE_WIDTH + 8, gapCenterDynamic, 10, gap) as ScorerZone;
    this.physics.add.existing(scorer);
    this.scorers.add(scorer);
    scorer.body.setAllowGravity(false);
    scorer.body.setImmovable(true);
    scorer.body.setVelocityX(speed);
    scorer.scored = false;
  }

  private addPoint(
    _bird: unknown,
    scorerObject: unknown,
  ): void {
    const scorer = scorerObject as ScorerZone;

    if (scorer.scored) {
      return;
    }

    scorer.scored = true;
    scorer.destroy();
    this.score += 1;
    this.scoreText.setText(String(this.score));

    this.tweens.add({
      targets: this.scoreText,
      scale: 1.18,
      duration: 90,
      yoyo: true,
    });
  }

  private endGame(): void {
    if (this.isGameOver) {
      return;
    }

    this.isGameOver = true;
    hapticNotification('error');
    this.pipeTimer?.remove(false);
    this.bird.setTint(0xff7777);
    this.bird.setVelocity(0, 220);
    this.bird.setAngularVelocity(180);
    this.pipes.setVelocityX(0);
    this.scorers.setVelocityX(0);

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.writeBestScore(this.bestScore);
    }

    this.bestText.setText(`Лучший: ${this.bestScore}`);
    this.liquidatedText.setVisible(true);
    this.helpText.setText(`Счет: ${this.score}\nНажми R, пробел или тапни`).setVisible(true);
  }

  private resetGame(): void {
    if (!this.isGameOver) {
      return;
    }

    this.scene.restart();
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

  private getDifficultyLevel(): number {
    return Math.min(Math.floor(this.score / 5), 8);
  }

  private getPipeSpeed(): number {
    return PIPE_SPEED - this.getDifficultyLevel() * 15;
  }

  private getPipeGap(): number {
    return Math.max(PIPE_GAP - this.getDifficultyLevel() * 6, 140);
  }

  private getBirdBody(): Phaser.Physics.Arcade.Body {
    return this.bird.body as Phaser.Physics.Arcade.Body;
  }

  private readBestScore(): number {
    const savedScore = localStorage.getItem(STORAGE_BEST_SCORE_KEY);
    return savedScore === null ? 0 : Number(savedScore) || 0;
  }

  private writeBestScore(score: number): void {
    localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(score));
  }

  private createWorldTextures(): void {
    this.createWallTexture();
    this.createCeilingTexture();
    this.createChainsTexture();
    this.createDecorTexture();
    this.createGroundTexture();
  }

  private createWallTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Dark mortar/background
    g.fillStyle(0x0d0006, 1);
    g.fillRect(0, 0, 128, 64);
    // Row 1 bricks
    g.fillStyle(0x3e1022, 1);
    g.fillRect(2, 2, 58, 28);
    g.fillRect(68, 2, 58, 28);
    // Row 2 bricks (offset half-brick)
    g.fillStyle(0x300c1a, 1);
    g.fillRect(2, 34, 28, 28);
    g.fillRect(36, 34, 58, 28);
    g.fillRect(100, 34, 26, 28);
    // Subtle top highlight on each brick
    g.fillStyle(0x4e1830, 1);
    g.fillRect(2, 2, 58, 3);
    g.fillRect(68, 2, 58, 3);
    g.fillRect(2, 34, 28, 3);
    g.fillRect(36, 34, 58, 3);
    g.fillRect(100, 34, 26, 3);
    // Random darker spots for worn look
    g.fillStyle(0x1a0610, 1);
    g.fillRect(10, 6, 12, 8);
    g.fillRect(80, 10, 8, 6);
    g.fillRect(44, 38, 10, 7);
    g.fillRect(110, 36, 6, 5);
    g.generateTexture('wall', 128, 64);
    g.destroy();
  }

  private createCeilingTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const W = 480, H = 40;
    // Stone ceiling base
    g.fillStyle(0x150810, 1);
    g.fillRect(0, 0, W, H);
    // Stone blocks
    g.fillStyle(0x2a1420, 1);
    for (let x = 0; x < W; x += 80) {
      g.fillRect(x + 2, 2, 76, H - 6);
    }
    // Block joints
    g.fillStyle(0x0a0408, 1);
    for (let x = 80; x < W; x += 80) {
      g.fillRect(x - 1, 0, 3, H);
    }
    // Chain hooks / ring bolts
    g.fillStyle(0x999999, 1);
    for (let x = 55; x < W; x += 120) {
      g.fillCircle(x, H - 5, 6);
      g.fillStyle(0x111111, 1);
      g.fillCircle(x, H - 5, 3);
      g.fillStyle(0x999999, 1);
    }
    // Bottom shadow drip
    g.fillStyle(0x050203, 1);
    g.fillRect(0, H - 4, W, 4);
    g.generateTexture('ceiling', W, H);
    g.destroy();
  }

  private createChainsTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const W = 320, H = 200;

    const drawLink = (x: number, y: number, vertical: boolean) => {
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

    const drawChain = (x: number, links: number) => {
      for (let i = 0; i < links; i++) {
        drawLink(x, i * 13, i % 2 === 0);
      }
    };

    const drawCandle = (x: number, baseY: number, h: number) => {
      g.fillStyle(0xcca060, 1);
      g.fillRect(x - 4, baseY - h, 9, h);
      g.fillStyle(0x2a2a2a, 1);
      g.fillRect(x, baseY - h - 5, 2, 6);
      g.fillStyle(0xff4400, 1);
      g.fillEllipse(x + 1, baseY - h - 10, 9, 14);
      g.fillStyle(0xff9900, 1);
      g.fillEllipse(x + 1, baseY - h - 13, 6, 10);
      g.fillStyle(0xffee66, 1);
      g.fillEllipse(x + 1, baseY - h - 15, 4, 7);
      g.fillStyle(0xcca060, 1);
      g.fillEllipse(x + 1, baseY, 11, 7);
    };

    // Chain cluster left
    drawChain(28, 8);
    drawChain(40, 6);

    // Candelabra (hanging chandelier) at x=130
    drawChain(130, 10);
    g.fillStyle(0x777777, 1);
    g.fillRect(104, 130, 54, 5);
    g.fillRect(100, 125, 8, 10);
    g.fillRect(154, 125, 8, 10);
    drawCandle(110, 130, 24);
    drawCandle(131, 130, 24);
    drawCandle(152, 130, 24);

    // Chain cluster center-right
    drawChain(230, 7);
    drawChain(244, 11);

    // Single chain far right
    drawChain(295, 5);

    g.generateTexture('chains', W, H);
    g.destroy();
  }

  private createDecorTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const W = 520, H = 210;

    // St. Andrew's X-cross at x=65
    const cx = 65, cw = 72, ch = 188, hw = 7;
    const by = H;
    g.fillStyle(0x3c0e20, 1);
    // Beam \ (top-left to bottom-right)
    g.fillTriangle(cx - cw / 2 - hw, by - ch, cx - cw / 2 + hw, by - ch, cx + cw / 2 + hw, by);
    g.fillTriangle(cx - cw / 2 - hw, by - ch, cx + cw / 2 + hw, by, cx + cw / 2 - hw, by);
    // Beam / (top-right to bottom-left)
    g.fillTriangle(cx + cw / 2 - hw, by - ch, cx + cw / 2 + hw, by - ch, cx - cw / 2 + hw, by);
    g.fillTriangle(cx + cw / 2 + hw, by - ch, cx - cw / 2 + hw, by, cx - cw / 2 - hw, by);
    // Wrist/ankle cuffs — metal rings at each arm
    g.fillStyle(0x888888, 1);
    g.fillCircle(cx - cw / 2, by - ch + 6, 7);
    g.fillCircle(cx + cw / 2, by - ch + 6, 7);
    g.fillCircle(cx - cw / 2, by - 6, 7);
    g.fillCircle(cx + cw / 2, by - 6, 7);
    g.fillStyle(0x444444, 1);
    g.fillCircle(cx - cw / 2, by - ch + 6, 4);
    g.fillCircle(cx + cw / 2, by - ch + 6, 4);
    g.fillCircle(cx - cw / 2, by - 6, 4);
    g.fillCircle(cx + cw / 2, by - 6, 4);

    // Stretching rack / bench at x=225
    const rx = 168;
    g.fillStyle(0x2e0c18, 1);
    g.fillRect(rx, H - 62, 110, 10);
    g.fillRect(rx + 6, H - 52, 10, 52);
    g.fillRect(rx + 94, H - 52, 10, 52);
    g.fillRect(rx, H - 32, 110, 6);
    // Chain restraints
    g.fillStyle(0x777777, 1);
    g.fillRect(rx + 10, H - 62, 4, 16);
    g.fillRect(rx + 96, H - 62, 4, 16);
    g.fillCircle(rx + 12, H - 46, 5);
    g.fillCircle(rx + 98, H - 46, 5);

    // Cage at x=360
    const cageX = 352, cageH = 148, cageW = 64;
    g.fillStyle(0x666666, 1);
    for (let i = 0; i <= 4; i++) {
      g.fillRect(cageX + i * 16, H - cageH, 4, cageH);
    }
    g.fillRect(cageX, H - cageH, cageW + 4, 5);
    g.fillRect(cageX, H - Math.round(cageH * 0.6), cageW + 4, 4);
    g.fillRect(cageX, H - 5, cageW + 4, 5);
    // Door hinges
    g.fillStyle(0x999999, 1);
    g.fillCircle(cageX + 4, H - cageH + 12, 4);
    g.fillCircle(cageX + 4, H - cageH + 30, 4);

    // Wall torch at x=470
    const tx = 462;
    g.fillStyle(0x3c0e20, 1);
    g.fillRect(tx + 2, H - 115, 7, 75);
    g.fillRect(tx - 18, H - 115, 26, 7);
    g.fillStyle(0x5a2a00, 1);
    g.fillRect(tx - 10, H - 128, 10, 16);
    g.fillStyle(0xff4400, 1);
    g.fillEllipse(tx - 5, H - 136, 12, 16);
    g.fillStyle(0xff9900, 1);
    g.fillEllipse(tx - 5, H - 140, 8, 12);
    g.fillStyle(0xffee44, 1);
    g.fillEllipse(tx - 5, H - 143, 5, 8);

    g.generateTexture('decor', W, H);
    g.destroy();
  }

  private createGroundTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Base dark stone
    g.fillStyle(0x181010, 1);
    g.fillRect(0, 0, 96, 72);
    // Stone tile faces
    g.fillStyle(0x271518, 1);
    g.fillRect(2, 4, 44, 30);
    g.fillRect(52, 4, 44, 30);
    g.fillRect(27, 40, 44, 30);
    // Lighter stone top face
    g.fillStyle(0x1f1014, 1);
    g.fillRect(2, 4, 44, 4);
    g.fillRect(52, 4, 44, 4);
    g.fillRect(27, 40, 44, 4);
    // Mortar joints
    g.fillStyle(0x0c0808, 1);
    g.fillRect(0, 36, 96, 3);
    g.fillRect(50, 0, 2, 36);
    g.fillRect(25, 38, 2, 34);
    g.fillRect(75, 38, 2, 34);
    // Top edge (blood-red smear where floor meets room)
    g.fillStyle(0x2a0510, 1);
    g.fillRect(0, 0, 96, 4);
    g.generateTexture('ground', 96, 72);
    g.destroy();
  }

}
