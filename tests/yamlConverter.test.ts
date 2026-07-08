import { describe, it, expect } from 'vitest';
import { convertYamlToJson, convertJsonToYaml } from '../src/utils/yamlConverter';

describe('YAML ↔ JSON 互转工具函数测试', () => {
  describe('convertYamlToJson (YAML ➔ JSON)', () => {
    it('应正确将基础嵌套的 YAML 转为格式化好的 JSON 串', () => {
      const yaml = `
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: test
      image: test-image:latest
      `;

      const jsonStr = convertYamlToJson(yaml, 2);
      const obj = JSON.parse(jsonStr);

      expect(obj.apiVersion).toBe('v1');
      expect(obj.metadata.name).toBe('test-pod');
      expect(obj.spec.containers).toHaveLength(1);
      expect(obj.spec.containers[0].name).toBe('test');
    });

    it('支持将 JSON 以压缩单行模式输出', () => {
      const yaml = 'name: tester\nlevel: 5';
      const jsonStr = convertYamlToJson(yaml, 0); // 0 代表压缩

      expect(jsonStr).toBe('{"name":"tester","level":5}');
    });

    it('非法 YAML 语法输入时应能捕获并抛出有意义的错误', () => {
      const invalidYaml = `
foo: { bar
      `;

      expect(() => {
        convertYamlToJson(invalidYaml);
      }).toThrowError();
    });

    it('空白输入应安全返回空字符串', () => {
      expect(convertYamlToJson('')).toBe('');
      expect(convertYamlToJson('   ')).toBe('');
    });
  });

  describe('convertJsonToYaml (JSON ➔ YAML)', () => {
    it('应正确将 JSON 转为指定缩进的 YAML', () => {
      const json = '{"name": "tester", "tags": ["dev", "test"], "conf": {"port": 80}}';
      
      const yamlStr2 = convertJsonToYaml(json, 2);
      expect(yamlStr2).toContain('name: tester');
      expect(yamlStr2).toContain('tags:\n  - dev'); // 2空格缩进下
      
      const yamlStr4 = convertJsonToYaml(json, 4);
      expect(yamlStr4).toContain('tags:\n    - dev'); // 4空格缩进下
    });

    it('非法 JSON 语法输入时应能捕获并抛出错误', () => {
      const invalidJson = '{name: "no_quotes_on_key"}';

      expect(() => {
        convertJsonToYaml(invalidJson);
      }).toThrowError();
    });

    it('空白输入应安全返回空字符串', () => {
      expect(convertJsonToYaml('')).toBe('');
      expect(convertJsonToYaml('   ')).toBe('');
    });
  });
});
