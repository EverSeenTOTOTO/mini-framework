// Jest setup file - polyfill MessageChannel for jsdom
// MessageChannel is a browser API not included in jsdom

class MockMessagePort {
  constructor() {
    this.onmessage = null;
    this._messageQueue = [];
    this._closed = false;
  }

  postMessage(data) {
    if (this._closed) return;
    
    // Simulate async message delivery
    setTimeout(() => {
      if (this.onmessage && !this._closed) {
        this.onmessage({ data });
      }
    }, 0);
  }

  close() {
    this._closed = true;
    this.onmessage = null;
  }
}

class MockMessageChannel {
  constructor() {
    this.port1 = new MockMessagePort();
    this.port2 = new MockMessagePort();
  }
}

// Only polyfill if not already available
if (typeof MessageChannel === 'undefined') {
  global.MessageChannel = MockMessageChannel;
}
