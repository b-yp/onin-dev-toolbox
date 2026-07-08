import { describe, it, expect } from 'vitest';
import {
  tokenize,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  toConstantCase,
  toTitleCase
} from '../src/utils/case';

describe('命名风格转换测试', () => {
  it('分词 tokenize()', () => {
    expect(tokenize('camelCaseTest')).toEqual(['camel', 'case', 'test']);
    expect(tokenize('PascalCaseTest')).toEqual(['pascal', 'case', 'test']);
    expect(tokenize('kebab-case-test')).toEqual(['kebab', 'case', 'test']);
    expect(tokenize('snake_case_test')).toEqual(['snake', 'case', 'test']);
    expect(tokenize('APIClient123')).toEqual(['api', 'client123']);
    expect(tokenize('on-inDevToolbox')).toEqual(['on', 'in', 'dev', 'toolbox']);
    expect(tokenize('')).toEqual([]);
  });

  it('转换为 camelCase (小驼峰)', () => {
    const words = ['hello', 'world', 'case'];
    expect(toCamelCase(words)).toBe('helloWorldCase');
    expect(toCamelCase([])).toBe('');
  });

  it('转换为 PascalCase (大驼峰)', () => {
    const words = ['hello', 'world', 'case'];
    expect(toPascalCase(words)).toBe('HelloWorldCase');
    expect(toPascalCase([])).toBe('');
  });

  it('转换为 snake_case', () => {
    const words = ['hello', 'world', 'case'];
    expect(toSnakeCase(words)).toBe('hello_world_case');
  });

  it('转换为 kebab-case', () => {
    const words = ['hello', 'world', 'case'];
    expect(toKebabCase(words)).toBe('hello-world-case');
  });

  it('转换为 CONSTANT_CASE', () => {
    const words = ['hello', 'world', 'case'];
    expect(toConstantCase(words)).toBe('HELLO_WORLD_CASE');
  });

  it('转换为 Title Case', () => {
    const words = ['hello', 'world', 'case'];
    expect(toTitleCase(words)).toBe('Hello World Case');
  });
});
