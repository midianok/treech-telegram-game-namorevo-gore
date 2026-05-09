import Phaser from 'phaser';

import type { NamorevoGoreLeaderboardEntry } from '../../api/namorevoGore';

const HUD_DEPTH = 10;
const HUD_FONT_FAMILY = 'Arial, Helvetica, sans-serif';
const LEADERBOARD_SIZE = 10;

export class GameHud {
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private liquidatedText!: Phaser.GameObjects.Text;
  private leaderboardContainer!: Phaser.GameObjects.Container;
  private leaderboardPanel!: Phaser.GameObjects.Rectangle;
  private leaderboardTitle!: Phaser.GameObjects.Text;
  private leaderboardStatus!: Phaser.GameObjects.Text;
  private leaderboardRows: Phaser.GameObjects.Text[] = [];
  private leaderboardPanelWidth = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  create(width: number, height: number, bestScore: number): void {
    this.scoreText = this.scene.add
      .text(width / 2, 72, '0', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '56px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);

    this.helpText = this.scene.add
      .text(width / 2, height / 2 + 90, 'Нажми пробел, кликни или тапни', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '22px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 5,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH);

    this.bestText = this.scene.add
      .text(18, 18, this.formatBestScore(bestScore), {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '20px',
        fontStyle: '700',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 4,
      })
      .setDepth(HUD_DEPTH);

    this.liquidatedText = this.scene.add
      .text(width / 2, Math.max(108, height / 2 - 210), 'ЛИКВИДИРОВАН', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: `${Math.min(52, Math.max(34, width / 9))}px`,
        fontStyle: '900',
        color: '#ff0000',
        stroke: '#1a0000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH)
      .setVisible(false);

    this.createLeaderboard(width, height);
  }

  hideStartPrompt(): void {
    this.helpText.setVisible(false);
  }

  setScore(score: number): void {
    this.scoreText.setText(String(score));
  }

  setBestScore(bestScore: number): void {
    this.bestText.setText(this.formatBestScore(bestScore));
  }

  showBestScoreLoading(): void {
    this.bestText.setText('Лучший: ...');
  }

  showBestScoreUnavailable(): void {
    this.bestText.setText('Лучший: недоступен');
  }

  showGameOver(score: number): void {
    this.liquidatedText.setVisible(true);
    this.helpText
      .setPosition(this.scene.scale.width / 2, this.getGameOverHelpY())
      .setText(`Счет: ${score}\nНажми R, пробел или тапни`)
      .setVisible(true);
    this.showLeaderboardLoading();
  }

  showLeaderboardLoading(): void {
    this.leaderboardContainer.setVisible(true);
    this.leaderboardStatus.setText('Загружаем leaderboard...').setVisible(true);
    this.leaderboardRows.forEach((row) => row.setVisible(false));
  }

  showLeaderboard(entries: NamorevoGoreLeaderboardEntry[], currentUserId: number | null): void {
    this.leaderboardContainer.setVisible(true);
    this.leaderboardStatus.setVisible(entries.length === 0).setText('Пока нет результатов');

    const rows = entries.slice(0, LEADERBOARD_SIZE);

    this.leaderboardRows.forEach((row, index) => {
      const entry = rows[index];

      if (!entry) {
        row.setVisible(false);
        return;
      }

      const isCurrentUser = currentUserId === entry.userId;
      row
        .setText(this.formatLeaderboardRow(index + 1, entry))
        .setColor(isCurrentUser ? '#ffd766' : '#ffffff')
        .setVisible(true);
    });
  }

  showLeaderboardError(message = 'Leaderboard недоступен'): void {
    this.leaderboardContainer.setVisible(true);
    this.leaderboardStatus.setText(message).setVisible(true);
    this.leaderboardRows.forEach((row) => row.setVisible(false));
  }

  animateScore(): void {
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: 1.18,
      duration: 90,
      yoyo: true,
    });
  }

  private formatBestScore(bestScore: number): string {
    return `Лучший: ${bestScore}`;
  }

  private createLeaderboard(width: number, height: number): void {
    this.leaderboardPanelWidth = Math.min(width - 32, 390);
    const panelHeight = Math.min(260, Math.max(224, height * 0.36));
    const panelY = Math.min(height - panelHeight / 2 - 88, Math.max(height / 2 + 46, 290));

    this.leaderboardPanel = this.scene.add.rectangle(0, 0, this.leaderboardPanelWidth, panelHeight, 0x250012, 0.9);
    this.leaderboardPanel.setStrokeStyle(2, 0xffffff, 0.24);

    this.leaderboardTitle = this.scene.add
      .text(0, -panelHeight / 2 + 20, 'LEADERBOARD', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '18px',
        fontStyle: '900',
        color: '#ffffff',
        stroke: '#3d0020',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    this.leaderboardStatus = this.scene.add
      .text(0, 4, '', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '18px',
        fontStyle: '700',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.leaderboardPanelWidth - 32 },
      })
      .setOrigin(0.5);

    this.leaderboardRows = Array.from({ length: LEADERBOARD_SIZE }, (_, index) =>
      this.scene.add
        .text(-this.leaderboardPanelWidth / 2 + 18, -panelHeight / 2 + 52 + index * 19, '', {
          fontFamily: HUD_FONT_FAMILY,
          fontSize: '15px',
          fontStyle: '700',
          color: '#ffffff',
          align: 'left',
          fixedWidth: this.leaderboardPanelWidth - 36,
        })
        .setOrigin(0, 0.5)
        .setVisible(false),
    );

    this.leaderboardContainer = this.scene.add
      .container(width / 2, panelY, [
        this.leaderboardPanel,
        this.leaderboardTitle,
        this.leaderboardStatus,
        ...this.leaderboardRows,
      ])
      .setDepth(HUD_DEPTH)
      .setVisible(false);
  }

  private getGameOverHelpY(): number {
    return Math.min(this.scene.scale.height - 42, this.leaderboardContainer.y + this.leaderboardPanel.height / 2 + 42);
  }

  private formatLeaderboardRow(place: number, entry: NamorevoGoreLeaderboardEntry): string {
    const score = String(entry.score);
    const prefix = `${place}. `;
    const maxNameLength = Math.max(8, Math.floor((this.leaderboardPanelWidth - 92 - score.length * 8) / 8));
    const name = this.truncate(entry.userName?.trim() || `Игрок ${entry.userId}`, maxNameLength);

    return `${prefix}${name} - ${score}`;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
  }
}
