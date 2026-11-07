"use client";

import { useEffect, useRef } from "react";

/** Idle timeout — 10 minutes (legacy AutoLogout intent). */
const IDLE_MS = 10 * 60 * 1000;
const WARN_BEFORE_MS = 60 * 1000;

export function AutoLogout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearTimers() {
      if (timer.current) clearTimeout(timer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    }

    function logout() {
      clearTimers();
      window.location.href = "/api/idle-logout";
    }

    function arm() {
      clearTimers();
      warnTimer.current = setTimeout(() => {
        // eslint-disable-next-line no-alert
        window.alert("เซสชันจะหมดอายุใน 1 นาที หากไม่มีการใช้งาน");
      }, IDLE_MS - WARN_BEFORE_MS);
      timer.current = setTimeout(logout, IDLE_MS);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    for (const ev of events) window.addEventListener(ev, arm, { passive: true });
    arm();

    return () => {
      clearTimers();
      for (const ev of events) window.removeEventListener(ev, arm);
    };
  }, []);

  return null;
}
