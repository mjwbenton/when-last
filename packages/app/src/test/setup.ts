import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement the Pointer Capture API; gesture libraries call it unconditionally.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}
