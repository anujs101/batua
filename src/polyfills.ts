import { Buffer } from 'buffer';

// Polyfill Buffer globally
window.Buffer = window.Buffer || Buffer;

// Ensure global is defined
if (typeof window !== 'undefined') {
  window.global = window;
}