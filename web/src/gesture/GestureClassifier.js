/**
 * GestureClassifier
 * Wraps TF.js and KNN Classifier to classify the normalized landmarks.
 * Persists the KNN state to IndexedDB.
 */
const { tf, knnClassifier } = window;

// Basic IndexedDB Promisified wrapper for model persistence
const DB_NAME = 'BataTakboGestureDB';
const STORE_NAME = 'models';
const MODEL_KEY = 'custom_knn_v1';

async function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIDB(data) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, MODEL_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function loadFromIDB() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(MODEL_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearIDB() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export class GestureClassifier {
  constructor() {
    this.classifier = knnClassifier.create();
    this.isLoaded = false;
    this.labels = ['up', 'down', 'left', 'right', 'idle'];
    this.K_VALUE = 4; // Num neighbors to poll
  }

  async initialize() {
    // Force TF.js backend initialization (WebGL preferred)
    await tf.ready();
    await this.loadModel();
  }

  /**
   * Add a normalized landmark snapshot as a training example.
   * @param {Array} features - The 63D normalized vector
   * @param {string} label - One of the labels (up/down/left/right)
   */
  addExample(features, label) {
    if (!features || features.length === 0) return;
    tf.tidy(() => {
      const tensor = tf.tensor(features);
      this.classifier.addExample(tensor, label);
    });
  }

  /**
   * Get total number of samples per class
   */
  getClassExampleCount() {
    try {
      const state = this.classifier.getClassifierDataset();
      const counts = {};
      for (let label of Object.keys(state)) {
        counts[label] = state[label].shape[0]; // Number of samples for this class
      }
      return counts;
    } catch(e) {
      return {};
    }
  }

  /**
   * Predict the current gesture
   * @param {Array} features - The 63D normalized vector
   * @returns {Object} result - { label: string, confidence: number }
   */
  async predict(features) {
    // Provide early exit if no active dataset
    if (this.classifier.getNumClasses() === 0 || !features || features.length === 0) {
      return { label: 'idle', confidence: 1.0 };
    }

    try {
      const counts = this.getClassExampleCount();
      const totalSamples = Object.values(counts).reduce((a, b) => a + b, 0);
      if (totalSamples === 0) return { label: 'idle', confidence: 1.0 };
      
      let k = Math.min(this.K_VALUE, totalSamples);

      // Need tf.tidy to automatically clean up memory, but classifier async makes it tricky.
      const tensor = tf.tensor(features);
      const res = await this.classifier.predictClass(tensor, k);
      tensor.dispose();

      let label = res.label;
      let conf = res.confidences[label] || 0;
      
      // If none of our core classes match or confidence is very low, revert to idle.
      // E.g., if there's an 'idle' class recorded, it might return that.
      
      return {
        label: label,
        confidence: conf
      };
    } catch(e) {
      return { label: 'idle', confidence: 1.0 };
    }
  }

  /**
   * Compress and save the KNN state to IndexedDB.
   */
  async saveModel() {
    let dataset = this.classifier.getClassifierDataset();
    let datasetObj = {};

    Object.keys(dataset).forEach((key) => {
      let data = dataset[key].dataSync();
      datasetObj[key] = {
        data: Array.from(data),
        shape: dataset[key].shape
      };
    });

    const outputStr = JSON.stringify(datasetObj);
    await saveToIDB(outputStr);
    this.isLoaded = true;
  }

  /**
   * Load and restore the KNN state from IndexedDB.
   */
  async loadModel() {
    try {
      const savedStr = await loadFromIDB();
      if (!savedStr) return false;

      const datasetObj = JSON.parse(savedStr);
      let tensorObj = {};
      
      Object.keys(datasetObj).forEach((key) => {
        tensorObj[key] = tf.tensor(datasetObj[key].data, datasetObj[key].shape);
      });

      this.classifier.setClassifierDataset(tensorObj);
      this.isLoaded = true;
      return true;
    } catch(e) {
      console.warn("No previously saved model loaded.");
      return false;
    }
  }

  /**
   * Clear KNN engine and IndexedDB cache.
   */
  async resetModel() {
    this.classifier.clearAllClasses();
    await clearIDB();
    this.isLoaded = false;
  }
}
