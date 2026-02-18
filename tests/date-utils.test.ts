import { describe, it, expect } from 'vitest';
import {
  toBsaleTimestamp,
  fromBsaleTimestamp,
  formatBsaleDate,
  todayBsaleTimestamp,
} from '../src/utils/date.utils';

describe('date.utils', () => {
  describe('toBsaleTimestamp', () => {
    it('should convert a Date to Unix seconds', () => {
      const date = new Date('2014-01-01T03:00:00.000Z');
      const timestamp = toBsaleTimestamp(date);
      expect(timestamp).toBe(1388545200);
    });

    it('should truncate milliseconds', () => {
      const date = new Date(1388545200_999);
      expect(toBsaleTimestamp(date)).toBe(1388545200);
    });
  });

  describe('fromBsaleTimestamp', () => {
    it('should convert Unix seconds to a Date', () => {
      const date = fromBsaleTimestamp(1388545200);
      expect(date.toISOString()).toBe('2014-01-01T03:00:00.000Z');
    });

    it('should handle zero timestamp (epoch)', () => {
      const date = fromBsaleTimestamp(0);
      expect(date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('formatBsaleDate', () => {
    it('should format a timestamp with default locale (es-CL)', () => {
      const formatted = formatBsaleDate(1388545200);
      // es-CL format: DD-MM-YYYY
      expect(formatted).toMatch(/\d{2}[-/.]\d{2}[-/.]\d{4}/);
    });

    it('should format a timestamp with a custom locale', () => {
      const formatted = formatBsaleDate(1388545200, 'en-US');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('todayBsaleTimestamp', () => {
    it('should return a timestamp for today at midnight', () => {
      const ts = todayBsaleTimestamp();
      const date = new Date(ts * 1000);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should return a value in seconds (not milliseconds)', () => {
      const ts = todayBsaleTimestamp();
      // Unix timestamp in seconds should be roughly 10 digits
      expect(ts.toString().length).toBeLessThanOrEqual(10);
    });
  });
});
