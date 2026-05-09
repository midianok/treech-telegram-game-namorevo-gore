import Phaser from 'phaser';

const HUD_DEPTH = 10;
const HUD_FONT_FAMILY = 'Arial, Helvetica, sans-serif';

export class GameHud {
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private liquidatedText!: Phaser.GameObjects.Text;

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
      .text(width / 2, height / 2 - 60, 'ЛИКВИДИРОВАН', {
        fontFamily: HUD_FONT_FAMILY,
        fontSize: '52px',
        fontStyle: '900',
        color: '#ff0000',
        stroke: '#1a0000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH)
      .setVisible(false);
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

  showGameOver(score: number): void {
    this.liquidatedText.setVisible(true);
    this.helpText.setText(`Счет: ${score}\nНажми R, пробел или тапни`).setVisible(true);
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
}
