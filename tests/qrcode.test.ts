import { describe, it, expect } from 'vitest';
import { isValidUrl } from '../src/utils/qrcode';

describe('二维码工具函数测试 (isValidUrl)', () => {
  it('应正确识别合法的 HTTP/HTTPS 标准链接', () => {
    expect(isValidUrl('http://localhost:5173')).toBe(true);
    expect(isValidUrl('https://github.com/b-yp/onin-dev-toolbox')).toBe(true);
    expect(isValidUrl('https://example.com/api/v1/users?name=test&age=20')).toBe(true);
  });

  it('应能够识别带有特殊字符、路径的合法网址', () => {
    expect(isValidUrl('https://www.google.com.hk/search?hl=zh-CN&q=vitest+test')).toBe(true);
    expect(isValidUrl('http://192.168.1.100:8080/dashboard')).toBe(true);
  });

  it('应忽略首尾多余空格', () => {
    expect(isValidUrl('   https://onin.dev   ')).toBe(true);
  });

  it('应正确过滤掉非网址的普通文本', () => {
    expect(isValidUrl('hello world')).toBe(false);
    expect(isValidUrl('just normal text without protocol')).toBe(false);
    expect(isValidUrl('12345678')).toBe(false);
  });

  it('应正确识别无协议头但看起来像网址的字符串 (若正则允许)', () => {
    // 我们的 isValidUrl 包含 catch 和模糊正则，我们可以验证一些特定模糊匹配
    expect(isValidUrl('http://example')).toBe(true);
  });

  it('应妥善处理空值或非法输入', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null as any)).toBe(false);
    expect(isValidUrl(undefined as any)).toBe(false);
  });
});
