import Phaser from 'phaser';

import { NamorevoGoreApi } from '../api/namorevoGore';
import { preloadGameAssets } from '../game/assets';
import { AssetKey, FinishSoundKeys } from '../game/assetKeys';
import { getGameViewportSize } from '../game/config';
import { getPipeSpawnDelay, getPipeSpeed } from '../game/difficulty';
import { Bird } from '../game/entities/Bird';
import { registerGameInput } from '../game/input/registerGameInput';
import { PipeManager } from '../game/obstacles/PipeManager';
import { isScorerZone } from '../game/obstacles/ScorerZone';
import { BestScoreRepository } from '../game/scoring/BestScoreRepository';
import { GameSession } from '../game/state/GameSession';
import { GameHud } from '../game/ui/GameHud';
import { GameWorld } from '../game/world/GameWorld';
import { t } from '../i18n';
import {
  getTelegramPlayerContext,
  hapticImpact,
  hapticNotification,
  offTelegramViewportChanged,
  onTelegramViewportChanged,
} from '../telegram';

const SCENE_KEY = 'FlappyScene';
const OFFSCREEN_TOP_LIMIT = -20;
const OFFSCREEN_BOTTOM_PADDING = 40;

export class FlappyScene extends Phaser.Scene {
  private readonly session = new GameSession();
  private readonly bestScoreRepository = new BestScoreRepository();
  private readonly namorevoGoreApi = new NamorevoGoreApi();

  private bird!: Bird;
  private hud!: GameHud;
  private pipes!: PipeManager;
  private world!: GameWorld;
  private flySound!: Phaser.Sound.BaseSound;
  private playerContext = getTelegramPlayerContext();
  private pipeTimer: Phaser.Time.TimerEvent | null = null;
  private scoreSyncRequestId = 0;
  private bestScoreRequestId = 0;
  private userBestScoreLoaded = false;
  private readonly handleViewportResize = () => this.resizeToViewport();

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
    const progressEl = document.getElementById('loading-progress');
    if (progressEl) {
      this.load.on('progress', (value: number) => {
        progressEl.style.width = `${Math.round(value * 100)}%`;
      });
    }
    preloadGameAssets(this);
  }

  create(): void {
    this.scoreSyncRequestId += 1;
    this.playerContext = getTelegramPlayerContext();
    this.userBestScoreLoaded = false;
    this.session.reset(this.playerContext ? 0 : this.bestScoreRepository.read());

    this.world = new GameWorld(this);
    this.bird = new Bird(this);
    this.hud = new GameHud(this);
    this.pipes = new PipeManager(this);

    this.world.create(this.width, this.height);
    this.bird.create(this.height / 2);
    this.hud.create(this.width, this.height, this.session.bestScore);
    this.pipes.create();
    this.flySound = this.sound.add(AssetKey.FlySound);

    if (this.playerContext) {
      this.hud.showBestScoreLoading();
      void this.loadUserBestScore(++this.bestScoreRequestId);
    }

    this.registerPhysics();
    registerGameInput(this, {
      flap: () => this.flap(),
      reset: () => this.resetGame(),
    });

    window.addEventListener('resize', this.handleViewportResize);
    window.visualViewport?.addEventListener('resize', this.handleViewportResize);
    onTelegramViewportChanged(this.handleViewportResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', this.handleViewportResize);
      window.visualViewport?.removeEventListener('resize', this.handleViewportResize);
      offTelegramViewportChanged(this.handleViewportResize);
    });
    this.time.delayedCall(0, this.handleViewportResize);

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      loadingScreen.addEventListener('transitionend', () => loadingScreen.remove(), { once: true });
    }
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
    if (this.flySound.isPlaying) {
      this.flySound.stop();
    }
    this.flySound.play();
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
    this.pipes.setSpeed(getPipeSpeed(this.session.score));
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
    const finishKey = FinishSoundKeys[Math.floor(Math.random() * FinishSoundKeys.length)];
    const finishSound = this.sound.add(finishKey);
    finishSound.once(Phaser.Sound.Events.COMPLETE, () => finishSound.destroy());
    finishSound.play();

    if (!this.playerContext && this.session.commitBestScore()) {
      this.bestScoreRepository.write(this.session.bestScore);
    }

    if (!this.playerContext || this.userBestScoreLoaded) {
      this.hud.setBestScore(this.session.bestScore);
    }

    this.hud.showGameOver(this.session.score);
    this.bestScoreRequestId += 1;
    void this.syncNamorevoGoreScore(++this.scoreSyncRequestId, this.session.score);
  }

  private async loadUserBestScore(requestId: number): Promise<void> {
    if (!this.playerContext) {
      return;
    }

    try {
      const userScore = await this.namorevoGoreApi.getUserScore(this.playerContext.userId);

      if (requestId !== this.bestScoreRequestId) {
        return;
      }

      const bestScore = userScore?.score ?? 0;
      this.session.bestScore = bestScore;
      this.userBestScoreLoaded = true;
      this.hud.setBestScore(bestScore);
    } catch (error) {
      if (requestId !== this.bestScoreRequestId) {
        return;
      }

      console.error(t('log.failedToLoadUserScore'), error);
      this.userBestScoreLoaded = false;
      this.hud.showBestScoreUnavailable();
    }
  }

  private async syncNamorevoGoreScore(requestId: number, score: number): Promise<void> {
    await this.saveScoreIfHigherThanServer(requestId, score);

    try {
      const leaderboard = await this.namorevoGoreApi.getLeaderboard();
      if (requestId !== this.scoreSyncRequestId) {
        return;
      }

      this.hud.showLeaderboard(leaderboard, this.playerContext?.userId ?? null);
    } catch (error) {
      if (requestId !== this.scoreSyncRequestId) {
        return;
      }

      console.error(t('log.failedToSyncLeaderboard'), error);
      this.hud.showLeaderboardError();
    }
  }

  private async saveScoreIfHigherThanServer(requestId: number, score: number): Promise<void> {
    if (!this.playerContext) {
      return;
    }

    const { userId, chatId } = this.playerContext;
    let currentBestScore = 0;

    try {
      const currentUserScore = await this.namorevoGoreApi.getUserScore(userId);
      currentBestScore = currentUserScore?.score ?? 0;

      if (requestId === this.scoreSyncRequestId) {
        this.session.bestScore = Math.max(this.session.bestScore, currentBestScore);
        this.userBestScoreLoaded = true;
        this.hud.setBestScore(this.session.bestScore);
      }
    } catch (error) {
      if (requestId === this.scoreSyncRequestId) {
        console.error(t('log.failedToSyncUserScore'), error);
        if (!this.userBestScoreLoaded) {
          this.hud.showBestScoreUnavailable();
        }
      }
      // currentBestScore остаётся 0, чтобы не блокировать отправку очков
    }

    if (score <= currentBestScore) {
      return;
    }

    try {
      // Отправляем очки вне зависимости от requestId — рестарт сцены не должен прерывать отправку
      await this.namorevoGoreApi.submitScore({ userId, chatId, score });

      if (requestId !== this.scoreSyncRequestId) {
        return;
      }

      this.session.bestScore = score;
      this.userBestScoreLoaded = true;
      this.hud.setBestScore(score);
    } catch (error) {
      if (requestId !== this.scoreSyncRequestId) {
        return;
      }

      console.error(t('log.failedToSyncUserScore'), error);
      if (!this.userBestScoreLoaded) {
        this.hud.showBestScoreUnavailable();
      }
    }
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

  private resizeToViewport(): void {
    const { width, height } = getGameViewportSize();

    if (width === this.width && height === this.height) {
      return;
    }

    this.scale.resize(width, height);
    this.physics.world.setBounds(0, 0, width, height);
    this.world.resize(width, height);
    this.hud.resize(height);
  }
}
