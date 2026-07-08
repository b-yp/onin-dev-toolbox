import { describe, it, expect } from 'vitest';
import { parseJwt, formatJwtTimestamp } from '../src/utils/jwt';

describe('JWT 解析测试', () => {
  const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6MTc4MDg4NDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('正常解析合法的 JWT', () => {
    const res = parseJwt(validJwt);
    expect(res.header.alg).toBe('HS256');
    expect(res.header.typ).toBe('JWT');
    expect(res.payload.sub).toBe('1234567890');
    expect(res.payload.name).toBe('John Doe');
    expect(res.payload.admin).toBe(true);
    expect(res.payload.exp).toBe(1780884000);
    expect(res.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  });

  it('处理多字节字符的 payload (如中文)', () => {
    // payload: {"name":"张三","role":"管理员"}
    // Base64Url: eyJuYW1lIjoi5byg5LiJIiwicm9sZSI6IueuoeeQhuWRmCJ9
    const jwtWithChinese = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoi5byg5LiJIiwicm9sZSI6IueuoeeQhuWRmCJ9.sig';
    const res = parseJwt(jwtWithChinese);
    expect(res.payload.name).toBe('张三');
    expect(res.payload.role).toBe('管理员');
  });

  it('JWT 格式错误抛出异常', () => {
    expect(() => parseJwt('invalid-token')).toThrow();
    expect(() => parseJwt('part1.part2')).toThrow();
    expect(() => parseJwt('')).toThrow();
  });

  it('格式化 JWT 内的时间戳', () => {
    const exp = 1780884000;
    const date = new Date(exp * 1000);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const expectedStr = `${y}-${m}-${d} ${hh}:${mm}:${ss}`;

    expect(formatJwtTimestamp(exp)).toBe(expectedStr);
    expect(formatJwtTimestamp(NaN)).toBeNull();
  });
});
