import * as Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data) {
    this.chapterId = data.chapterId;
    this.startTime = Date.now();
    this.elapsed = 0;
  }

  create() {
    const { width, height } = this.scale;
    
    // Top Bar Background
    const topBar = this.add.graphics();
    topBar.fillStyle(0x151530, 0.8); // Panel background logic
    topBar.fillRect(0, 0, width, 50);
    
    // Left side: Lives
    this.lifeText = this.add.text(20, 15, 'LIVES: ♥ ♥ ♥', {
      fontFamily: 'VCR',
      fontSize: '20px',
      color: '#e63946'
    });

    // Left side: Powerup
    this.powerupText = this.add.text(20, 45, 'POWERUP: NONE', {
      fontFamily: 'VCR',
      fontSize: '16px',
      color: '#4cff4c'
    });

    // Center: Timer
    this.timerText = this.add.text(width / 2, 15, '00:00', {
      fontFamily: 'VCR',
      fontSize: '24px',
      color: '#f0e6d3',
      align: 'center'
    }).setOrigin(0.5, 0);

    // Right side: Score
    this.scoreText = this.add.text(width - 20, 15, 'SCORE: 0', {
      fontFamily: 'VCR',
      fontSize: '20px',
      color: '#f0e6d3',
      align: 'right'
    }).setOrigin(1, 0);
  }

  updateScore(score) {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  updateLives(lives) {
    let hearts = '';
    for(let i=0; i<Math.floor(lives/2); i++) hearts += '♥ ';
    if (lives % 2 === 1) hearts += '♡ ';
    this.lifeText.setText(`LIVES: ${hearts}`);
  }

  update(time, delta) {
    this.elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(this.elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySecs = seconds % 60;
    
    this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`);
  }
}
