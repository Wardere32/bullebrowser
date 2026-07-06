import { describe, expect, it } from 'vitest';
import { inputActivityReducer, type InputActivityState } from './useInputActivity.js';

describe('inputActivityReducer', () => {
  it('moves through focus -> typing -> cooldown -> focus', () => {
    let state: InputActivityState = 'idle';
    state = inputActivityReducer(state, { type: 'FOCUS' });
    expect(state).toBe('focus');

    state = inputActivityReducer(state, { type: 'INPUT' });
    expect(state).toBe('typing');

    state = inputActivityReducer(state, { type: 'IDLE_TIMEOUT' });
    expect(state).toBe('cooldown');

    state = inputActivityReducer(state, { type: 'IDLE_TIMEOUT' });
    expect(state).toBe('focus');
  });

  it('always returns idle on blur or disable', () => {
    expect(inputActivityReducer('typing', { type: 'BLUR' })).toBe('idle');
    expect(inputActivityReducer('cooldown', { type: 'DISABLE' })).toBe('idle');
  });
});
