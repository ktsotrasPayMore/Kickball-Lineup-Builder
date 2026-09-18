(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WakeLockController = api.WakeLockController;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  class WakeLockController {
    constructor({ navigator, document, onChange = () => {} }) {
      this.navigator = navigator;
      this.document = document;
      this.onChange = onChange;
      this.enabled = false;
      this.sentinel = null;
      this.method = null;
      this.lastStartFailed = false;
      this.handleVisibility = () => {
        if (this.enabled && this.document.visibilityState === "visible") this.start();
      };
      this.document.addEventListener("visibilitychange", this.handleVisibility);
      this.notify();
    }

    notify() {
      this.onChange({ enabled: this.enabled, active: Boolean(this.sentinel), method: this.method });
    }

    async start() {
      if (!this.enabled || this.document.visibilityState === "hidden") return false;
      if (this.sentinel) return true;

      if (!this.navigator.wakeLock?.request) return false;

      try {
        const sentinel = await this.navigator.wakeLock.request("screen");
        if (!this.enabled) {
          await sentinel.release();
          return false;
        }
        this.sentinel = sentinel;
        this.method = "wake-lock";
        sentinel.addEventListener("release", () => {
          if (this.sentinel === sentinel) this.sentinel = null;
          this.method = null;
          this.notify();
        }, { once: true });
        this.notify();
        return true;
      } catch (_) {
        this.method = null;
        this.notify();
        return false;
      }
    }

    async enable() {
      this.enabled = true;
      this.lastStartFailed = false;
      this.notify();
      const started = await this.start();
      if (!started) {
        this.enabled = false;
        this.lastStartFailed = true;
        this.notify();
      }
      return started;
    }

    async disable() {
      this.enabled = false;
      const sentinel = this.sentinel;
      this.sentinel = null;
      this.method = null;
      if (sentinel) await sentinel.release();
      this.notify();
    }

    async toggle() {
      if (this.enabled) await this.disable();
      else await this.enable();
      return this.enabled;
    }
  }

  return { WakeLockController };
});
