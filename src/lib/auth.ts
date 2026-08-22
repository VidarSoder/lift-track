const FLAG = "training.unlocked";

export function persistUnlock() {
  window.localStorage.setItem(FLAG, "1");
}

export function clearUnlock() {
  window.localStorage.removeItem(FLAG);
}

export function hasUnlockFlag() {
  return window.localStorage.getItem(FLAG) === "1";
}
