import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from '../src/utils/base64';

describe('Base64 转换测试', () => {
  it('标准 Base64 编码', () => {
    expect(encodeBase64('hello')).toBe('aGVsbG8=');
    expect(encodeBase64('Onin Dev Toolbox')).toBe('T25pbiBEZXYgVG9vbGJveA==');
  });

  it('标准 Base64 解码', () => {
    expect(decodeBase64('aGVsbG8=')).toBe('hello');
    expect(decodeBase64('T25pbiBEZXYgVG9vbGJveA==')).toBe('Onin Dev Toolbox');
  });

  it('处理 URL 安全的 Base64 编解码', () => {
    const raw = 'subjects?';
    const stdB64 = 'c3ViamVjdHM/';
    const safeB64 = 'c3ViamVjdHM_';
    
    expect(encodeBase64(raw, false)).toBe(stdB64);
    expect(encodeBase64(raw, true)).toBe(safeB64);

    expect(decodeBase64(stdB64, false)).toBe(raw);
    expect(decodeBase64(safeB64, true)).toBe(raw);
  });

  it('处理多字节 UTF-8 字符（如中文）', () => {
    const raw = '你好，开发者！';
    const encoded = encodeBase64(raw);
    expect(decodeBase64(encoded)).toBe(raw);
  });

  it('处理空字符串', () => {
    expect(encodeBase64('')).toBe('');
    expect(decodeBase64('')).toBe('');
  });
});
