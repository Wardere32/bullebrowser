import { useCallback, useEffect, useReducer, useRef } from 'react';

export type InputActivityState = 'idle' | 'focus' | 'typing' | 'cooldown';

type InputActivityAction =
  | { type: 'FOCUS' }
  | { type: 'INPUT' }
  | { type: 'IDLE_TIMEOUT' }
  | { type: 'BLUR' }
  | { type: 'DISABLE' };

export function inputActivityReducer(
  state: InputActivityState,
  action: InputActivityAction,
): InputActivityState {
  switch (action.type) {
    case 'FOCUS':
      return 'focus';
    case 'INPUT':
      return 'typing';
    case 'IDLE_TIMEOUT':
      if (state === 'typing') return 'cooldown';
      if (state === 'cooldown') return 'focus';
      return state;
    case 'BLUR':
    case 'DISABLE':
      return 'idle';
    default:
      return state;
  }
}

export interface UseInputActivityOptions {
  disabled?: boolean;
  typingIdleMs?: number;
  cooldownMs?: number;
}

export function useInputActivity(options: UseInputActivityOptions = {}) {
  const {
    disabled = false,
    typingIdleMs = 1200,
    cooldownMs = 420,
  } = options;

  const [state, dispatch] = useReducer(inputActivityReducer, 'idle');
  const focusedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(() => {
    clearTimers();
    idleTimerRef.current = setTimeout(() => {
      if (!focusedRef.current) return;
      dispatch({ type: 'IDLE_TIMEOUT' });
      cooldownTimerRef.current = setTimeout(() => {
        if (!focusedRef.current) return;
        dispatch({ type: 'IDLE_TIMEOUT' });
      }, cooldownMs);
    }, typingIdleMs);
  }, [clearTimers, cooldownMs, typingIdleMs]);

  const onFocus = useCallback(() => {
    if (disabled) return;
    focusedRef.current = true;
    dispatch({ type: 'FOCUS' });
  }, [disabled]);

  const onBlur = useCallback(() => {
    focusedRef.current = false;
    clearTimers();
    dispatch({ type: 'BLUR' });
  }, [clearTimers]);

  const onInputActivity = useCallback(() => {
    if (disabled) return;
    focusedRef.current = true;
    dispatch({ type: 'INPUT' });
    scheduleIdle();
  }, [disabled, scheduleIdle]);

  const reset = useCallback(() => {
    focusedRef.current = false;
    clearTimers();
    dispatch({ type: 'BLUR' });
  }, [clearTimers]);

  useEffect(() => {
    if (!disabled) return;
    focusedRef.current = false;
    clearTimers();
    dispatch({ type: 'DISABLE' });
  }, [clearTimers, disabled]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    state,
    onFocus,
    onBlur,
    onInputActivity,
    reset,
  } as const;
}
