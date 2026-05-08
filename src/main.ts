import Phaser from 'phaser';

import { createGameConfig } from './game/config';
import { initTelegram } from './telegram';
import './styles.css';

initTelegram();
new Phaser.Game(createGameConfig());
