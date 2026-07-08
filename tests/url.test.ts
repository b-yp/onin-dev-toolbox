import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl } from '../src/utils/url';

describe('URL 编解码测试', () => {
  it('Component 模式编码', () => {
    expect(encodeUrl('https://example.com/api?a=1&b=2', 'component')).toBe('https%3A%2F%2Fexample.com%2Fapi%3Fa%3D1%26b%3D2');
    expect(encodeUrl('hello world', 'component')).toBe('hello%20world');
  });

  it('URI 模式编码', () => {
    expect(encodeUrl('https://example.com/api?a=1&b=2', 'uri')).toBe('https://example.com/api?a=1&b=2');
    expect(encodeUrl('https://example.com/api?a=你好', 'uri')).toBe('https://example.com/api?a=%E4%BD%A0%E5%A5%BD');
  });

  it('Component 模式解码', () => {
    expect(decodeUrl('https%3A%2F%2Fexample.com%2Fapi%3Fa%3D1%26b%3D2', 'component')).toBe('https://example.com/api?a=1&b=2');
  });

  it('URI 模式解码', () => {
    expect(decodeUrl('https://example.com/api?a=%E4%BD%A0%E5%A5%BD', 'uri')).toBe('https://example.com/api?a=你好');
  });

  it('处理空字符串', () => {
    expect(encodeUrl('')).toBe('');
    expect(decodeUrl('')).toBe('');
  });
});
