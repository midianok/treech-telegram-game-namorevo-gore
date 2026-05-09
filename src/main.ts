import Phaser from 'phaser';

import { createGameConfig } from './game/config';
import { t } from './i18n';
import { initTelegram } from './telegram';
import './styles.css';

document.documentElement.lang = t('app.language');
document.title = t('app.title');
document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'));

initTelegram();
new Phaser.Game(createGameConfig());
