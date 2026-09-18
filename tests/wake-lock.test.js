const test = require("node:test");
const assert = require("node:assert/strict");
const { WakeLockController } = require("../wake-lock");

function harness({ native = true } = {}) {
  const listeners = {};
  const sentinel = { released: false, addEventListener() {}, async release() { this.released = true; } };
  const document = { visibilityState: "visible", addEventListener(name, handler) { listeners[name] = handler; } };
  const navigator = native ? { wakeLock: { async request(type) { assert.equal(type, "screen"); return sentinel; } } } : {};
  return { controller: new WakeLockController({ navigator, document }), document, listeners, sentinel };
}

test("uses the Screen Wake Lock API and releases it when disabled", async () => {
  const { controller, sentinel } = harness();
  assert.equal(await controller.toggle(), true);
  assert.equal(controller.method, "wake-lock");
  assert.equal(await controller.toggle(), false);
  assert.equal(sentinel.released, true);
});

test("does not start while the page is hidden", async () => {
  const { controller, document } = harness();
  document.visibilityState = "hidden";
  assert.equal(await controller.enable(), false);
  assert.equal(controller.enabled, false);
});

test("stays off when the Wake Lock API is unavailable", async () => {
  const { controller } = harness({ native: false });
  assert.equal(await controller.toggle(), false);
  assert.equal(controller.enabled, false);
  assert.equal(controller.lastStartFailed, true);
});
