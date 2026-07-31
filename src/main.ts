import { init } from './game';

// Wait for DOM + PixiJS
document.addEventListener('DOMContentLoaded', () => {
  // PixiJS is loaded via npm import, available immediately
  init();
});
