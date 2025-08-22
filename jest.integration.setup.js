/**
 * Jest Integration Test Setup
 * Global setup and configuration for integration tests
 */

// Mock React Native modules before importing testing library
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(() => ({})),
  get: jest.fn(() => ({})),
}));

// Extend Jest matchers
require('@testing-library/jest-native/extend-expect');

// Mock global objects that might not be available in test environment
global.fetch = require('jest-fetch-mock');

// Mock Canvas API for image processing tests
global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor(width = 300, height = 150) {
    this.width = width;
    this.height = height;
    this._context = null;
  }

  getContext(contextType) {
    if (contextType === '2d') {
      if (!this._context) {
        this._context = {
          drawImage: jest.fn(),
          getImageData: jest.fn(() => ({
            data: new Uint8ClampedArray(this.width * this.height * 4),
            width: this.width,
            height: this.height,
          })),
          putImageData: jest.fn(),
          createImageData: jest.fn((width, height) => ({
            data: new Uint8ClampedArray(width * height * 4),
            width,
            height,
          })),
          fillRect: jest.fn(),
          fillText: jest.fn(),
          strokeText: jest.fn(),
          measureText: jest.fn(() => ({ width: 100 })),
          createLinearGradient: jest.fn(() => ({
            addColorStop: jest.fn(),
          })),
          save: jest.fn(),
          restore: jest.fn(),
          translate: jest.fn(),
          rotate: jest.fn(),
          scale: jest.fn(),
          clearRect: jest.fn(),
          beginPath: jest.fn(),
          closePath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          stroke: jest.fn(),
          fill: jest.fn(),
        };
      }
      return this._context;
    }
    return null;
  }

  toDataURL(type = 'image/png', quality = 0.92) {
    return `data:${type};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }

  toBlob(callback, type = 'image/png', quality = 0.92) {
    const dataURL = this.toDataURL(type, quality);
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    setTimeout(() => callback(blob), 0);
  }
};

// Mock Image constructor
global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
  }

  set src(value) {
    this._src = value;
    // Simulate async image loading
    setTimeout(() => {
      if (value && value.startsWith('data:')) {
        this.width = 100;
        this.height = 100;
        this.naturalWidth = 100;
        this.naturalHeight = 100;
        if (this.onload) this.onload();
      } else if (this.onerror) {
        this.onerror(new Error('Mock image load error'));
      }
    }, 10);
  }

  get src() {
    return this._src;
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.onprogress = null;
    this.readyState = 0;
    this.result = null;
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
      if (this.onload) this.onload({ target: this });
    }, 10);
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'Mock file content';
      if (this.onload) this.onload({ target: this });
    }, 10);
  }

  abort() {
    this.readyState = 0;
  }
};

// Mock File constructor
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || '';
    this.size = bits.reduce((size, bit) => size + (bit.length || bit.byteLength || 0), 0);
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock Blob constructor
global.Blob = class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.type = options.type || '';
    this.size = parts.reduce((size, part) => size + (part.length || part.byteLength || 0), 0);
  }

  slice(start = 0, end = this.size, contentType = '') {
    return new Blob(this.parts.slice(start, end), { type: contentType });
  }

  text() {
    return Promise.resolve(this.parts.join(''));
  }

  arrayBuffer() {
    const buffer = new ArrayBuffer(this.size);
    return Promise.resolve(buffer);
  }
};

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
};

// Mock Worker for OCR processing
global.Worker = class Worker {
  constructor(scriptURL) {
    this.scriptURL = scriptURL;
    this.onmessage = null;
    this.onerror = null;
    this.onmessageerror = null;
  }

  postMessage(message) {
    // Simulate worker processing
    setTimeout(() => {
      if (this.onmessage) {
        // Mock OCR result
        const mockResult = {
          data: {
            text: 'MANIFIESTO DE SALIDA\nFECHA: 15/01/2024\nVUELO: AM-123',
            confidence: 0.85,
            processingTime: 2500,
          },
        };
        this.onmessage(mockResult);
      }
    }, 100);
  }

  terminate() {
    // Mock termination
  }

  addEventListener(type, listener) {
    if (type === 'message') this.onmessage = listener;
    if (type === 'error') this.onerror = listener;
    if (type === 'messageerror') this.onmessageerror = listener;
  }

  removeEventListener(type, listener) {
    if (type === 'message' && this.onmessage === listener) this.onmessage = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
    if (type === 'messageerror' && this.onmessageerror === listener) this.onmessageerror = null;
  }
};

// Mock IndexedDB
const mockIDBRequest = (result = null, error = null) => ({
  result,
  error,
  onsuccess: null,
  onerror: null,
  readyState: error ? 'done' : 'pending',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

const mockIDBDatabase = {
  name: 'MockDB',
  version: 1,
  objectStoreNames: ['manifiestos'],
  createObjectStore: jest.fn(() => ({
    name: 'manifiestos',
    keyPath: 'id',
    indexNames: [],
    add: jest.fn(() => mockIDBRequest()),
    put: jest.fn(() => mockIDBRequest()),
    get: jest.fn(() => mockIDBRequest({ id: 1, data: 'mock' })),
    delete: jest.fn(() => mockIDBRequest()),
    clear: jest.fn(() => mockIDBRequest()),
    createIndex: jest.fn(),
  })),
  transaction: jest.fn(() => ({
    objectStore: jest.fn(() => ({
      add: jest.fn(() => mockIDBRequest()),
      put: jest.fn(() => mockIDBRequest()),
      get: jest.fn(() => mockIDBRequest({ id: 1, data: 'mock' })),
      delete: jest.fn(() => mockIDBRequest()),
      clear: jest.fn(() => mockIDBRequest()),
    })),
    oncomplete: null,
    onerror: null,
    onabort: null,
  })),
  close: jest.fn(),
};

global.indexedDB = {
  open: jest.fn(() => {
    const request = mockIDBRequest();
    setTimeout(() => {
      request.result = mockIDBDatabase;
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 10);
    return request;
  }),
  deleteDatabase: jest.fn(() => mockIDBRequest()),
  databases: jest.fn(() => Promise.resolve([{ name: 'MockDB', version: 1 }])),
};

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  configurable: true,
});

Object.defineProperty(navigator, 'onLine', {
  value: true,
  configurable: true,
});

Object.defineProperty(navigator, 'language', {
  value: 'es-MX',
  configurable: true,
});

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Increase timeout for integration tests
jest.setTimeout(60000);

// Global test utilities
global.testUtils = {
  // Helper to create mock image data
  createMockImageData: (width = 100, height = 100) => {
    const canvas = new HTMLCanvasElement(width, height);
    return canvas.toDataURL();
  },
  
  // Helper to create mock file
  createMockFile: (name = 'test.jpg', type = 'image/jpeg', content = 'mock content') => {
    return new File([content], name, { type });
  },
  
  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to simulate user delay
  simulateUserDelay: () => new Promise(resolve => setTimeout(resolve, 50)),
};

// Console warnings for missing implementations
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out known warnings from test environment
  const message = args.join(' ');
  if (
    message.includes('React Native Web') ||
    message.includes('expo-') ||
    message.includes('Warning: ReactDOM.render')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Setup cleanup
afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  if (global.fetch && global.fetch.resetMocks) {
    global.fetch.resetMocks();
  }
});

console.log('✅ Integration test environment setup complete');