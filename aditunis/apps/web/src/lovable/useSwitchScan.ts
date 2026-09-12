import { useCallback, useEffect, useRef, useState } from "react";

const HIGHLIGHT_CLASS = "aditunis-scan-target";
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="button"]:not([aria-disabled="true"])',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])'
].join(",");

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function collectTargets(): HTMLElement[] {
  const root = document.getElementById("main") ?? document.body;
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

export interface SwitchScanOptions {
  enabled: boolean;
  intervalMs?: number;
  dwellMs?: number;
  scanKey?: string;
}

export function useSwitchScan({ enabled, intervalMs = 1800, dwellMs = 0, scanKey = " " }: SwitchScanOptions) {
  const [running, setRunning] = useState(true);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const targetsRef = useRef<HTMLElement[]>([]);
  const indexRef = useRef(0);
  const stepTimerRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (stepTimerRef.current !== null) window.clearTimeout(stepTimerRef.current);
    if (dwellTimerRef.current !== null) window.clearTimeout(dwellTimerRef.current);
    stepTimerRef.current = null;
    dwellTimerRef.current = null;
  }, []);

  const clearHighlight = useCallback(() => {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((element) => element.classList.remove(HIGHLIGHT_CLASS));
  }, []);

  const refreshTargets = useCallback(() => {
    targetsRef.current = collectTargets();
    setTotal(targetsRef.current.length);
    if (indexRef.current >= targetsRef.current.length) {
      indexRef.current = 0;
      setIndex(0);
    }
  }, []);

  const highlight = useCallback((targetIndex: number) => {
    clearHighlight();
    const element = targetsRef.current[targetIndex];
    if (!element) return;
    element.classList.add(HIGHLIGHT_CLASS);
    element.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [clearHighlight]);

  const activate = useCallback(() => {
    const element = targetsRef.current[indexRef.current];
    if (!element) return;
    element.click();
    window.setTimeout(() => {
      refreshTargets();
      indexRef.current = 0;
      setIndex(0);
      highlight(0);
    }, 50);
  }, [highlight, refreshTargets]);

  const step = useCallback(() => {
    if (targetsRef.current.length === 0) refreshTargets();
    if (targetsRef.current.length === 0) return;
    indexRef.current = (indexRef.current + 1) % targetsRef.current.length;
    setIndex(indexRef.current);
    highlight(indexRef.current);
    if (dwellMs > 0) {
      if (dwellTimerRef.current !== null) window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = window.setTimeout(activate, dwellMs);
    }
  }, [activate, dwellMs, highlight, refreshTargets]);

  useEffect(() => {
    if (!enabled || !running) {
      clearTimers();
      clearHighlight();
      return;
    }
    refreshTargets();
    if (targetsRef.current.length === 0) return;
    highlight(indexRef.current);
    if (dwellMs > 0) dwellTimerRef.current = window.setTimeout(activate, dwellMs);
    const tick = () => {
      stepTimerRef.current = window.setTimeout(() => {
        step();
        tick();
      }, intervalMs);
    };
    tick();
    return clearTimers;
  }, [activate, clearHighlight, clearTimers, dwellMs, enabled, highlight, intervalMs, refreshTargets, running, step]);

  useEffect(() => {
    if (!enabled) return;
    const observer = new MutationObserver(refreshTargets);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, [enabled, refreshTargets]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (event.key === "Escape") {
        event.preventDefault();
        setRunning((value) => !value);
        return;
      }
      if (!typing && (event.key === scanKey || event.key === "Enter")) {
        event.preventDefault();
        activate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activate, enabled, scanKey]);

  useEffect(() => {
    if (!enabled) clearHighlight();
  }, [clearHighlight, enabled]);

  return {
    enabled,
    running,
    index,
    total,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
    step,
    activate
  };
}
