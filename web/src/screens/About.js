/**
 * About — Credits, licenses, privacy policy, and game info
 */
export const About = {
  render() {
    return `
      <div class="about-screen screen">
        <button class="back-btn" id="btn-about-back">Back</button>
        
        <h1 class="screen-title" style="animation: fadeInUp 0.4s ease forwards;">
          About
        </h1>
        
        <div class="about-screen__content scrollable" style="animation: fadeInUp 0.4s ease 0.15s forwards; opacity: 0;">
          
          <!-- About the Game -->
          <div class="about-section">
            <div class="about-section__title">🎮 About the Game</div>
            <div class="about-section__text">
              <strong>Bata, Takbo!</strong> (Filipino: "Kid, Run!") is a gesture-controlled
              boss-battle survival game. Use your hands to dodge projectiles and defeat
              fearsome bosses across 3 challenging chapters.
              <br/><br/>
              The game uses your device camera with machine learning to recognize
              custom hand gestures that YOU train — making every player's controls unique.
              <br/><br/>
              Version: 0.1.0
            </div>
          </div>

          <!-- Privacy -->
          <div class="about-section">
            <div class="about-section__title">🔒 Privacy & Camera</div>
            <div class="about-section__text">
              Your privacy is our highest priority:
              <br/><br/>
              • <strong>No video data is ever sent to servers.</strong> All camera processing
              happens entirely on your device using MediaPipe.
              <br/><br/>
              • <strong>Gesture models stay local.</strong> Your trained hand gestures are
              stored only on your device and never uploaded.
              <br/><br/>
              • <strong>Privacy Mode</strong> lets you hide the camera feed while still
              using gesture controls.
              <br/><br/>
              • <strong>Webcam captures</strong> are saved only to your device — never
              uploaded automatically.
              <br/><br/>
              • No tracking, no analytics, no third-party cookies.
            </div>
          </div>
          
          <!-- Developers -->
          <div class="about-section">
            <div class="about-section__title">👨‍💻 Developers</div>
            <div class="about-section__text">
              Built with ❤️ by the Bata, Takbo! team.
            </div>
          </div>

          <!-- Asset Credits -->
          <div class="about-section">
            <div class="about-section__title">🎨 Asset Credits</div>
            <div class="about-section__text">
              • <strong>Character Sprites</strong> — Pixel art character animations
              <br/>
              • <strong>Platform Tilesets</strong> — Dungeon environment tiles
              <br/>
              • <strong>Game FX</strong> — Explosion, impact, and spell effects
              <br/>
              • <strong>UI Elements</strong> — Health bars, buttons, inventory frames
              <br/>
              • <strong>Item Icons</strong> — Static loot / projectile sprites
              <br/>
              • <strong>Fonts</strong> — VCR OSD Neue by Riciery Leal, DirtyHarold
              <br/><br/>
              <em>All assets used under their respective licenses.
              See individual license files for full terms.</em>
            </div>
          </div>

          <!-- Technology -->
          <div class="about-section">
            <div class="about-section__title">⚙️ Built With</div>
            <div class="about-section__text">
              • <strong>Phaser 3</strong> — Game engine (MIT License)
              <br/>
              • <strong>MediaPipe</strong> — Hand tracking by Google
              <br/>
              • <strong>TensorFlow.js</strong> — On-device ML (Apache 2.0)
              <br/>
              • <strong>Vite</strong> — Build tool (MIT License)
              <br/>
              • <strong>Firebase</strong> — Auth & leaderboard
              <br/>
              • <strong>Howler.js</strong> — Audio engine (MIT License)
            </div>
          </div>
          
          <!-- License -->
          <div class="about-section">
            <div class="about-section__title">📄 License</div>
            <div class="about-section__text">
              © 2026 Bata, Takbo! All rights reserved.
              <br/><br/>
              This game and its original code are proprietary.
              Third-party assets and libraries are used under their respective open-source licenses.
            </div>
          </div>

        </div>
      </div>
    `;
  },

  onEnter(el) {
    el.querySelector('#btn-about-back').addEventListener('click', () => {
      window.__screenManager.back();
    });
  },
};
