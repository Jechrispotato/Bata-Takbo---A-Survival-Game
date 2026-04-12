/**
 * StateManager — Global state & event bus
 * Centralized state management with pub/sub events
 */
class StateManager {
  constructor() {
    this._state = {
      currentScreen: null,
      gestureModel: null,
      gestureModelTrained: false,
      settings: this._loadSettings(),
      user: null,
      isAuthenticated: false,
      tutorialComplete: this._loadTutorialState(),
      bestiary: this._loadBestiary(),
      chapterProgress: this._loadChapterProgress(),
    };
    this._listeners = new Map();
  }

  /**
   * Get a state value by key
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set a state value and emit change event
   */
  set(key, value) {
    const oldValue = this._state[key];
    this._state[key] = value;
    this.emit(`${key}:changed`, { key, value, oldValue });
    this.emit('state:changed', { key, value, oldValue });
  }

  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event with data
   */
  emit(event, data = null) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      });
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('bata_takbo_settings', JSON.stringify(this._state.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  /**
   * Load settings with defaults
   */
  _loadSettings() {
    const defaults = {
      camera: {
        privacyMode: false,
        position: 'bottom-left',
        showSkeleton: true,
      },
      audio: {
        master: 0.8,
        music: 0.7,
        sfx: 0.9,
        muted: false,
      },
      gesture: {
        sensitivity: 0.75,
        debounce: 150,
        preferredHand: 'any',
      },
      display: {
        screenShake: true,
        particles: true,
        showFps: false,
      },
    };

    try {
      const saved = localStorage.getItem('bata_takbo_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with defaults
        return this._deepMerge(defaults, parsed);
      }
    } catch (e) {
      console.warn('Failed to load settings, using defaults:', e);
    }
    return defaults;
  }

  _loadTutorialState() {
    try {
      const saved = localStorage.getItem('bata_takbo_tutorial');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { firstLaunchComplete: false, chapterTutorialComplete: {} };
  }

  _loadBestiary() {
    try {
      const saved = localStorage.getItem('bata_takbo_bestiary');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {};
  }

  _loadChapterProgress() {
    try {
      const saved = localStorage.getItem('bata_takbo_progress');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return { chaptersUnlocked: [1], chaptersCompleted: [], bestScores: {} };
  }

  saveTutorialState() {
    try {
      localStorage.setItem('bata_takbo_tutorial', JSON.stringify(this._state.tutorialComplete));
    } catch (e) { /* ignore */ }
  }

  saveBestiary() {
    try {
      localStorage.setItem('bata_takbo_bestiary', JSON.stringify(this._state.bestiary));
    } catch (e) { /* ignore */ }
  }

  saveChapterProgress() {
    try {
      localStorage.setItem('bata_takbo_progress', JSON.stringify(this._state.chapterProgress));
    } catch (e) { /* ignore */ }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

// Singleton
export const state = new StateManager();
