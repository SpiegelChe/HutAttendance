import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_MS = 1 * 60 * 1000; // warning starts 1 minute before logout

export function useInactivityLogout(
  onLogout: () => void,
  enabled: boolean,
) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const logoutTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const warningTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const countdownTimer = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Always keep the latest logout callback
  const onLogoutRef = useRef(onLogout);

  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const clearAll = useCallback(() => {
    if (logoutTimer.current !== null) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }

    if (warningTimer.current !== null) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }

    if (countdownTimer.current !== null) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  const resetTimers = useCallback(() => {
    if (!enabled) return;

    clearAll();

    setShowWarning(false);
    setSecondsLeft(60);

    // Warning after 9 minutes of inactivity
    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(60);

      countdownTimer.current = setInterval(() => {
        setSecondsLeft((seconds) => {
          if (seconds <= 1) {
            if (countdownTimer.current !== null) {
              clearInterval(countdownTimer.current);
              countdownTimer.current = null;
            }

            return 0;
          }

          return seconds - 1;
        });
      }, 1000);
    }, INACTIVITY_MS - WARNING_MS);

    // Hard logout after exactly 10 minutes
    logoutTimer.current = setTimeout(() => {
      clearAll();
      onLogoutRef.current();
    }, INACTIVITY_MS);
  }, [enabled, clearAll]);

  const stayLoggedIn = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAll();
      setShowWarning(false);
      setSecondsLeft(60);
      return;
    }

    const onActivity = () => {
      resetTimers();
    };

    // Reset inactivity timer on mouse click, keyboard input, or touch
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, {
      passive: true,
    });

    // Start the initial 10-minute timer
    resetTimers();

    return () => {
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      clearAll();
    };
  }, [enabled, resetTimers, clearAll]);

  return {
    showWarning,
    secondsLeft,
    stayLoggedIn,
  };
}