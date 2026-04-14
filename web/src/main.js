/**
 * main.js — Application entry point
 * Initializes the screen manager and navigates to the main menu
 */
import './index.css';
import { ScreenManager } from './utils/ScreenManager.js';
import { state } from './utils/StateManager.js';
import { MainMenu } from './screens/MainMenu.js';
import { ChapterSelect } from './screens/ChapterSelect.js';
import { Settings } from './screens/Settings.js';
import { GestureTraining } from './screens/GestureTraining.js';
import { Spellbook } from './screens/Spellbook.js';
import { Leaderboard } from './screens/Leaderboard.js';
import { About } from './screens/About.js';
import { GameScreen } from './screens/GameScreen.js';
import { ResultsScreen } from './screens/ResultsScreen.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { gestureController } from './gesture/GestureController.js';

// Initialize screen manager
const screenManager = new ScreenManager('screen-container');

// Expose globally for screen button handlers
window.__screenManager = screenManager;

// Register all screens
screenManager.register('main-menu', MainMenu);
screenManager.register('chapter-select', ChapterSelect);
screenManager.register('settings', Settings);
screenManager.register('gesture-training', GestureTraining);
screenManager.register('spellbook', Spellbook);
screenManager.register('leaderboard', Leaderboard);
screenManager.register('about', About);
screenManager.register('game-screen', GameScreen);
screenManager.register('results-screen', ResultsScreen);
screenManager.register('login-screen', LoginScreen);

async function init() {
  // Small delay for font loading
  await document.fonts.ready;
  
  // Proactively load the gesture model from IndexedDB into memory
  try {
    await gestureController.initialize(null, null);
  } catch (e) {
    console.warn('Gesture controller background initialization error:', e);
  }

  // Navigate to login screen
  await screenManager.navigate('login-screen', {}, false);
  
  // Hide loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    setTimeout(() => loadingOverlay.remove(), 600);
  }

  console.log('🎮 Bata, Takbo! initialized');
  console.log('📋 Settings:', state.get('settings'));
  console.log('📖 Tutorial state:', state.get('tutorialComplete'));
}

// Prevent default mobile behaviors
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());

// Handle back button / escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && screenManager.canGoBack()) {
    screenManager.back();
  }
});

// PWA: Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// Start the app
init();
