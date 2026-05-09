import Phaser from 'phaser';

type GameInputHandler = () => void;

type GameInputActions = {
  flap: GameInputHandler;
  reset: GameInputHandler;
};

export function registerGameInput(scene: Phaser.Scene, actions: GameInputActions): void {
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, actions.flap);
  scene.input.keyboard?.on('keydown-SPACE', actions.flap);
  scene.input.keyboard?.on('keydown-UP', actions.flap);
  scene.input.keyboard?.on('keydown-R', actions.reset);
}
