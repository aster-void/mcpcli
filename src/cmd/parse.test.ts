import { describe, test, expect } from "bun:test";
import {
  parseInvocation,
  parseJson5Payload,
  parseQueryStyle,
  parseQueryStyleArgs,
  parsePayload,
} from "./parse.ts";

describe("parseInvocation", () => {
  test("parses tool name only", () => {
    const result = parseInvocation("my_tool");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toolName).toBe("my_tool");
      expect(result.value.payloadText).toBe("");
    }
  });

  test("parses tool name with payload", () => {
    const result = parseInvocation("my_tool { key: 'value' }");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toolName).toBe("my_tool");
      expect(result.value.payloadText).toBe("{ key: 'value' }");
    }
  });

  test("fails on empty input", () => {
    const result = parseInvocation("");
    expect(result.ok).toBe(false);
  });
});

describe("parseJson5Payload", () => {
  test("parses JSON object", () => {
    const result = parseJson5Payload('{ "key": "value" }');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ key: "value" });
    }
  });

  test("parses JSON5 (unquoted keys, trailing commas)", () => {
    const result = parseJson5Payload("{ key: 'value', }");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ key: "value" });
    }
  });

  test("fails on non-object", () => {
    const result = parseJson5Payload('"just a string"');
    expect(result.ok).toBe(false);
  });

  test("allows empty when allowEmpty is true", () => {
    const result = parseJson5Payload("", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({});
    }
  });

  test("fails on empty when allowEmpty is false", () => {
    const result = parseJson5Payload("", false);
    expect(result.ok).toBe(false);
  });
});

describe("parseQueryStyle", () => {
  test("parses simple key=value", () => {
    const result = parseQueryStyle("path=.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });

  test("parses multiple key=value pairs", () => {
    const result = parseQueryStyle("path=. recursive=true");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: ".", recursive: true });
    }
  });

  test("parses quoted values", () => {
    const result = parseQueryStyle("message=\"hello world\" name='John Doe'");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        message: "hello world",
        name: "John Doe",
      });
    }
  });

  test("converts boolean strings", () => {
    const result = parseQueryStyle("enabled=true disabled=false");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ enabled: true, disabled: false });
    }
  });

  test("converts number strings", () => {
    const result = parseQueryStyle("count=42 ratio=3.14");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ count: 42, ratio: 3.14 });
    }
  });

  test("converts null string", () => {
    const result = parseQueryStyle("value=null");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ value: null });
    }
  });

  test("fails on invalid format (no equals)", () => {
    const result = parseQueryStyle("invalid-no-equals");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("expected key=value");
    }
  });

  test("returns empty object for empty input", () => {
    const result = parseQueryStyle("");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({});
    }
  });

  test("nested keys are expanded into nested objects", () => {
    const result = parseQueryStyle("foo.bar=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: "value" } });
    }
  });

  test("deeply nested keys work", () => {
    const result = parseQueryStyle("a.b.c.d=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: { b: { c: { d: "value" } } } });
    }
  });

  test("multiple nested keys are merged", () => {
    const result = parseQueryStyle("foo.bar=1 foo.baz=2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: 1, baz: 2 } });
    }
  });

  test("bracketed keys with dots are treated as literal", () => {
    const result = parseQueryStyle("[foo.bar]=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ "foo.bar": "value" });
    }
  });

  test("mixed nested and flat keys", () => {
    const result = parseQueryStyle("foo.bar=nested flat=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: "nested" }, flat: "value" });
    }
  });

  test("nested keys with type conversion", () => {
    const result = parseQueryStyle(
      "config.enabled=true config.count=42 config.name=test",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        config: { enabled: true, count: 42, name: "test" },
      });
    }
  });

  test("overwriting nested value replaces object", () => {
    // When foo.bar=1 then foo=2, foo becomes 2 (not an object)
    const result = parseQueryStyle("foo.bar=1 foo=2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: 2 });
    }
  });

  test("overwriting flat value with nested creates object", () => {
    // When foo=1 then foo.bar=2, foo becomes {bar: 2}
    const result = parseQueryStyle("foo=1 foo.bar=2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: 2 } });
    }
  });

  test("bracketed key without dots", () => {
    const result = parseQueryStyle("[simple]=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ simple: "value" });
    }
  });

  test("mixed bracketed and nested keys", () => {
    const result = parseQueryStyle("[literal.key]=1 nested.key=2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        "literal.key": 1,
        nested: { key: 2 },
      });
    }
  });

  test("empty string in nested path", () => {
    // "foo..bar" splits to ["foo", "", "bar"]
    const result = parseQueryStyle("foo..bar=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { "": { bar: "value" } } });
    }
  });

  test("single dot key", () => {
    const result = parseQueryStyle(".=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ "": { "": "value" } });
    }
  });
});

describe("parseQueryStyleArgs", () => {
  test("parses pre-split CLI args with nested keys", () => {
    // Simulates: tool foo.bar=value (shell splits into ["foo.bar=value"])
    const result = parseQueryStyleArgs(["foo.bar=value"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: "value" } });
    }
  });

  test("handles values with spaces (pre-split by shell)", () => {
    // Simulates: tool path="foo bar" (shell gives ["path=foo bar"])
    const result = parseQueryStyleArgs(["path=foo bar"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "foo bar" });
    }
  });

  test("nested keys with spaces in value", () => {
    // Simulates: tool config.message="hello world"
    const result = parseQueryStyleArgs(["config.message=hello world"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ config: { message: "hello world" } });
    }
  });

  test("multiple nested args from CLI", () => {
    const result = parseQueryStyleArgs([
      "user.name=John",
      "user.age=30",
      "user.active=true",
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        user: { name: "John", age: 30, active: true },
      });
    }
  });

  test("bracketed literal key from CLI", () => {
    const result = parseQueryStyleArgs(["[dotted.key]=value"]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ "dotted.key": "value" });
    }
  });
});

describe("parsePayload", () => {
  test("auto-detects JSON format", () => {
    const result = parsePayload('{ "path": "." }');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });

  test("auto-detects query format", () => {
    const result = parsePayload("path=.");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ path: "." });
    }
  });

  test("nested keys in query format via parsePayload", () => {
    const result = parsePayload("foo.bar.baz=value");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ foo: { bar: { baz: "value" } } });
    }
  });
});
