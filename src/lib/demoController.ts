/**
 * demoController.ts — Unified demo state management
 * 
 * Ensures only one demo overlay (GuidedDemo OR AutoDemoOverlay) is active at a time.
 * Single source of truth for demo state, with clear API.
 */

const KEYS = {
  guided: "sal_demo_active",
  guidedStep: "sal_demo_step",
  auto: "sal_auto_demo_active",
} as const;

const EVENTS = {
  guided: "demo_state_change",
  auto: "auto_demo_change",
} as const;

/** Stop all demo overlays — clean slate */
export function stopAllDemos() {
  localStorage.removeItem(KEYS.guided);
  localStorage.removeItem(KEYS.guidedStep);
  localStorage.removeItem(KEYS.auto);
  window.dispatchEvent(new Event(EVENTS.guided));
  window.dispatchEvent(new Event(EVENTS.auto));
}

/** Start the guided (manual) demo — stops auto if running */
export function startGuidedDemo() {
  // Stop auto first
  localStorage.removeItem(KEYS.auto);
  window.dispatchEvent(new Event(EVENTS.auto));
  // Start guided
  localStorage.setItem(KEYS.guided, "1");
  localStorage.setItem(KEYS.guidedStep, "0");
  window.dispatchEvent(new Event(EVENTS.guided));
}

/** Start the automatic demo — stops guided if running */
export function startAutoDemo() {
  // Stop guided first
  localStorage.removeItem(KEYS.guided);
  localStorage.removeItem(KEYS.guidedStep);
  window.dispatchEvent(new Event(EVENTS.guided));
  // Start auto
  localStorage.setItem(KEYS.auto, "1");
  window.dispatchEvent(new Event(EVENTS.auto));
}

/** Check if any demo is currently active */
export function isAnyDemoActive(): boolean {
  return !!(localStorage.getItem(KEYS.guided) || localStorage.getItem(KEYS.auto));
}

/** Resolve conflicting state on app boot */
export function resolveConflicts() {
  const guidedActive = !!localStorage.getItem(KEYS.guided);
  const autoActive = !!localStorage.getItem(KEYS.auto);
  if (guidedActive && autoActive) {
    // Both active = invalid state. Clear both.
    stopAllDemos();
  }
}
