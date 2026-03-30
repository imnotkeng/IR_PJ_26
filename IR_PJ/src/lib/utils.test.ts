import { describe, it, expect } from 'vitest';
import { cn, formatDuration } from './utils';

describe('Utility Functions', () => {
  
  // ==========================================
  // Test the Tailwind merge utility (cn)
  // ==========================================
  describe('cn()', () => {
    it('merges basic classes correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('resolves Tailwind class conflicts intelligently', () => {
      expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
    });

    it('handles conditional class rendering', () => {
      const isActive = true;
      const isHidden = false;
      
      expect(cn('flex', isActive && 'bg-blue-500', isHidden && 'hidden')).toBe('flex bg-blue-500');
    });
  });

  // ==========================================
  // Test the time formatting utility (formatDuration)
  // ==========================================
  describe('formatDuration()', () => {
    
    it('returns "0 mins" for missing or falsy values', () => {
      expect(formatDuration()).toBe('0 mins');
      expect(formatDuration('')).toBe('0 mins');
      expect(formatDuration(0)).toBe('0 mins');
    });

    it('appends "mins" if the input is a pure number', () => {
      expect(formatDuration(45)).toBe('45 mins');
      expect(formatDuration(120)).toBe('120 mins');
    });

    it('appends "mins" if the input is a normal string that does not start with PT', () => {
      expect(formatDuration('30')).toBe('30 mins');
      expect(formatDuration('random')).toBe('random mins');
    });

    it('formats ISO 8601 PT strings with HOURS only', () => {
      expect(formatDuration('PT1H')).toBe('1 hr');
      expect(formatDuration('PT3H')).toBe('3 hrs');
    });

    it('formats ISO 8601 PT strings with MINUTES only', () => {
      expect(formatDuration('PT1M')).toBe('1 min');
      expect(formatDuration('PT45M')).toBe('45 mins');
    });

    it('formats ISO 8601 PT strings with BOTH hours and minutes', () => {
      expect(formatDuration('PT1H30M')).toBe('1 hr 30 mins');
      expect(formatDuration('PT2H1M')).toBe('2 hrs 1 min');
    });

    it('returns "0 mins" for a PT string with zero values', () => {
      expect(formatDuration('PT0H')).toBe('0 mins');
      expect(formatDuration('PT')).toBe('0 mins'); 
    });

  });
});