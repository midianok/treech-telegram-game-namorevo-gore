import Phaser from 'phaser';

import { preloadGameAssets } from '../game/assets';
import { getPipeSpawnDelay, getPipeSpeed } from '../game/difficulty';
import { Bird } from '../game/entities/Bird';
import { registerGameInput } from '../game/input/registerGameInput';
import { PipeManager } from '../game/obstacles/PipeManager';
import { isScorerZone } from '../game/obstacles/ScorerZone';
import { BestScoreRepository } from '../game/scoring/BestScoreRepository';
import { GameSession } from '../game/state/GameSession';
import { GameHud } from '../game/ui/GameHud';
import { GameWorld } from '../game/world/GameWorld';
import { hapticImpact, hapticNotification } from '../telegram';

const SCENE_KEY = 'FlappyScene';
const OFFSCREEN_TOP_LIMIT = -20;
const OFFSCREEN_BOTTOM_PADDING = 40;

export class FlappyScene extends Phaser.Scene {
  private readonly session = new GameSession();
  private readonly bestScoreRepository = new BestScoreRepository();

  private bird!: Bird;
  private hud!: GameHud;
  private pipes!: PipeManager;
  private world!: GameWorld;
  private pipeTimer: Phaser.Time.TimerEvent | null = null;

  private get width(): number {
    return this.scale.width;
  }

  private get height(): number {
    return this.scale.height;
  }

  constructor() {
    super(SCENE_KEY);
  }

  preload(): void {
    preloadGameAssets(this);
  }

  create(): void {
    this.session.reset(this.bestScoreRepository.read());

    this.world = new GameWorld(this);
    this.bird = new Bird(this);
    this.hud = new GameHud(this);
    this.pipes = new PipeManager(this);

    this.world.create(this.width, this.height);
    this.bird.create(this.height / 2);
    this.hud.create(this.width, this.height, this.session.bestScore);
    this.pipes.create();

    this.registerPhysics();
    registerGameInput(this, {
      flap: () => this.flap(),
      reset: () => this.resetGame(),
    });
  }

  update(): void {
    this.world.update(this.session.isRunning, getPipeSpeed(this.session.score));

    if (!this.session.isRunning) {
      this.bird.updateIdleRotation();
      return;
    }

    this.bird.updateFlightRotation();

    if (this.isBirdOutsidePlayArea()) {
      this.endGame();
      return;
    }

    this.pipes.update();
  }

  private registerPhysics(): void {
    this.physics.add.collider(this.bird.gameObject, this.world.groundObject, () => this.endGame());
    this.physics.add.overlap(this.bird.gameObject, this.pipes.pipeGroup, () => this.endGame());
    this.physics.add.overlap(this.bird.gameObject, this.pipes.scorerGroup, (_bird, scorer) => {
      this.addPoint(scorer);
    });
  }

  private flap(): void {
    if (this.session.gameOver) {
      this.resetGame();
      return;
    }

    if (!this.session.started) {
      this.startGame();
    }

    hapticImpact('light');
    this.bird.flap();
  }

  private startGame(): void {
    this.session.start();
    this.bird.enableGravity();
    this.bird.stopIdleAnimation();
    this.hud.hideStartPrompt();
    this.spawnPipePair();
    this.schedulePipeSpawn();
  }

  private schedulePipeSpawn(): void {
    this.pipeTimer = this.time.delayedCall(getPipeSpawnDelay(this.session.score), () => {
      if (!this.session.isRunning) {
        return;
      }

      this.spawnPipePair();
      this.schedulePipeSpawn();
    });
  }

  private spawnPipePair(): void {
    if (this.session.gameOver) {
      return;
    }

    this.pipes.spawn(this.session.score, this.width, this.height);
  }

  private addPoint(scorerObject: unknown): void {
    if (!isScorerZone(scorerObject) || scorerObject.scored) {
      return;
    }

    scorerObject.scored = true;
    scorerObject.destroy();
    this.hud.setScore(this.session.addPoint());
    this.hud.animateScore();
  }

  private endGame(): void {
    if (this.session.gameOver) {
      return;
    }

    this.session.end();
    hapticNotification('error');
    this.pipeTimer?.remove(false);
    this.bird.markDead();
    this.pipes.stop();

    if (this.session.commitBestScore()) {
      this.bestScoreRepository.write(this.session.bestScore);
    }

    this.hud.setBestScore(this.session.bestScore);
    this.hud.showGameOver(this.session.score);
  }

  private resetGame(): void {
    if (!this.session.gameOver) {
      return;
    }

    this.scene.restart();
  }

  private isBirdOutsidePlayArea(): boolean {
    return this.bird.y < OFFSCREEN_TOP_LIMIT || this.bird.y > this.height + OFFSCREEN_BOTTOM_PADDING;
  }
}
