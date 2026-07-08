import { describe, it, expect } from 'vitest';
import { formatDate, timestampToDate, dateToTimestamp } from '../src/utils/datetime';

describe('日期时间转换测试', () => {
  it('格式化 Date 对象', () => {
    const date = new Date(2026, 6, 8, 10, 0, 0); // 2026-07-08 10:00:00
    expect(formatDate(date)).toBe('2026-07-08 10:00:00');
  });

  it('时间戳转日期 (秒)', () => {
    const ts = 1780884000;
    const dateStr = formatDate(new Date(ts * 1000));
    expect(timestampToDate(ts, 's')).toBe(dateStr);
    expect(timestampToDate(ts.toString(), 's')).toBe(dateStr);
  });

  it('时间戳转日期 (毫秒)', () => {
    const ts = 1780884000000;
    const dateStr = formatDate(new Date(ts));
    expect(timestampToDate(ts, 'ms')).toBe(dateStr);
    expect(timestampToDate(ts.toString(), 'ms')).toBe(dateStr);
  });

  it('日期转时间戳', () => {
    const dateStr = '2026-07-08 10:00:00';
    const date = new Date(dateStr.replace(/-/g, '/'));
    const expectedS = Math.floor(date.getTime() / 1000).toString();
    const expectedMs = date.getTime().toString();
    
    const result = dateToTimestamp(dateStr);
    expect(result.s).toBe(expectedS);
    expect(result.ms).toBe(expectedMs);
  });

  it('处理异常情况', () => {
    expect(() => timestampToDate('invalid', 's')).toThrow();
    expect(() => dateToTimestamp('invalid')).toThrow();
    expect(() => dateToTimestamp('')).toThrow();
  });
});
