import {
  ObjectNodeData,
  ObjectNodeAttribute,
  ObjectNodeMethod,
} from "@/components/nodes/object-node";

export type SuggestionSeverity = "warning" | "info";

export interface NodeSuggestion {
  id: string;
  severity: SuggestionSeverity;
  title: string;
  details: string;
  fix?: string;
}

interface SuggestionSettings {
  encapsulation_violation: boolean;
  naming_convention_class: boolean;
  naming_convention_members: boolean;
  god_class: boolean;
  empty_class: boolean;
  missing_return_type: boolean;
  mutable_getter_exposure: boolean;
  missing_constructor: boolean;
  unused_abstract: boolean;
  too_many_parameters: boolean;
}

const PASCAL_CASE = /^[A-Z][a-zA-Z0-9]*$/;
const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;
const PLURAL_ENDINGS = /(?:s|es|ies|ves)$/i;
const COLLECTION_TYPES = /^(?:list|array|set|map|collection|dictionary|hashmap|hashset|arraylist|vector|queue|stack|deque)/i;
const UNMODIFIABLE_TYPE_PREFIX = /^i?(?:immutable|unmodifiable|readonly|frozen)/i;

function isPascalCase(name: string): boolean {
  return PASCAL_CASE.test(name);
}

function isCamelCase(name: string): boolean {
  return CAMEL_CASE.test(name);
}

function isPlural(name: string): boolean {
  return PLURAL_ENDINGS.test(name);
}

function isCollectionType(type: string): boolean {
  return COLLECTION_TYPES.test(type.trim());
}

function isUnmodifiableType(type: string): boolean {
  return UNMODIFIABLE_TYPE_PREFIX.test(type.trim());
}

function isMutableCollectionType(type: string): boolean {
  const trimmed = type.trim();
  return isCollectionType(trimmed) && !isUnmodifiableType(trimmed);
}

function isGetterFor(method: ObjectNodeMethod, attr: ObjectNodeAttribute): boolean {
  const lowerAttr = attr.name.toLowerCase();
  const lowerMethod = method.name.toLowerCase();
  return (
    lowerMethod === `get${lowerAttr}` ||
    lowerMethod === `is${lowerAttr}` ||
    lowerMethod === `has${lowerAttr}`
  );
}

function checkEncapsulationViolation(
  data: ObjectNodeData,
): NodeSuggestion | null {
  const attrs = data.attributes ?? [];
  const methods = data.methods ?? [];

  const issues: string[] = [];

  // Check public attributes (not static — static public constants are fine)
  const publicAttrs = attrs.filter(
    (a) => a.accessModifier === "public" && !a.static,
  );
  if (publicAttrs.length > 0) {
    issues.push(
      `Public attributes: ${publicAttrs.map((a) => a.name).join(", ")}`,
    );
  }

  // Check getters that return mutable collection types for private fields.
  // Attribute may hold an unmodifiable view internally, so we only judge by
  // the getter's declared return type.
  const privateCollectionAttrs = attrs.filter(
    (a) =>
      a.accessModifier !== "public" &&
      a.type &&
      isCollectionType(a.type),
  );
  for (const attr of privateCollectionAttrs) {
    const exposingGetters = methods.filter(
      (m) =>
        m.accessModifier === "public" &&
        isGetterFor(m, attr) &&
        m.returnType &&
        isMutableCollectionType(m.returnType),
    );
    for (const getter of exposingGetters) {
      issues.push(
        `${getter.name}() returns a mutable ${getter.returnType} — may expose internal state of '${attr.name}'`,
      );
    }
  }

  if (issues.length === 0) return null;

  return {
    id: "encapsulation_violation",
    severity: "warning",
    title: "Encapsulation violation",
    details: issues.join("\n"),
    fix: publicAttrs.length > 0
      ? "Make attributes private and provide getters/setters. For collections, return defensive copies."
      : "Return a defensive copy or an unmodifiable view from getters.",
  };
}

function checkNamingConventionClass(
  data: ObjectNodeData,
): NodeSuggestion | null {
  const issues: string[] = [];

  if (!isPascalCase(data.name)) {
    issues.push(`Class name '${data.name}' should use PascalCase (e.g., '${data.name.charAt(0).toUpperCase() + data.name.slice(1)}')`);
  }

  if (isPlural(data.name) && !data.stereotype) {
    issues.push(
      `Class name '${data.name}' appears to be plural — class names should typically be singular`,
    );
  }

  if (issues.length === 0) return null;

  return {
    id: "naming_convention_class",
    severity: "info",
    title: "Class naming convention",
    details: issues.join("\n"),
    fix: "Use singular PascalCase for class names (e.g., 'Customer' instead of 'Customers').",
  };
}

function checkNamingConventionMembers(
  data: ObjectNodeData,
): NodeSuggestion | null {
  const attrs = data.attributes ?? [];
  const methods = data.methods ?? [];
  const issues: string[] = [];

  for (const attr of attrs) {
    if (attr.name && !isCamelCase(attr.name) && !attr.static) {
      issues.push(`Attribute '${attr.name}' should use camelCase`);
    }
  }

  for (const method of methods) {
    if (
      method.name &&
      method.name !== data.name &&
      method.name !== "constructor" &&
      !isCamelCase(method.name)
    ) {
      issues.push(`Method '${method.name}' should use camelCase`);
    }
  }

  if (issues.length === 0) return null;

  return {
    id: "naming_convention_members",
    severity: "info",
    title: "Member naming convention",
    details: issues.join("\n"),
    fix: "Use camelCase for attribute and method names (e.g., 'firstName', 'getAge').",
  };
}

function checkGodClass(data: ObjectNodeData): NodeSuggestion | null {
  const attrCount = data.attributes?.length ?? 0;
  const methodCount = data.methods?.length ?? 0;
  const total = attrCount + methodCount;
  const issues: string[] = [];

  if (attrCount > 10) {
    issues.push(`${attrCount} attributes (recommended: 10 or fewer)`);
  }
  if (methodCount > 15) {
    issues.push(`${methodCount} methods (recommended: 15 or fewer)`);
  }
  if (total > 20) {
    issues.push(`${total} total members — class may have too many responsibilities`);
  }

  if (issues.length === 0) return null;

  return {
    id: "god_class",
    severity: "warning",
    title: "God class",
    details: issues.join("\n"),
    fix: "Consider splitting this class into smaller, focused classes following the Single Responsibility Principle.",
  };
}

function checkEmptyClass(data: ObjectNodeData): NodeSuggestion | null {
  const attrCount = data.attributes?.length ?? 0;
  const methodCount = data.methods?.length ?? 0;

  if (attrCount > 0 || methodCount > 0) return null;
  // Interfaces/abstract markers with stereotype are okay to be empty
  if (data.stereotype) return null;

  return {
    id: "empty_class",
    severity: "info",
    title: "Empty class",
    details: "This class has no attributes or methods.",
    fix: "Add attributes and methods, or consider if this class is needed.",
  };
}

function checkMissingReturnType(data: ObjectNodeData): NodeSuggestion | null {
  const methods = data.methods ?? [];
  const missing = methods.filter(
    (m) =>
      !m.returnType &&
      m.name !== data.name &&
      m.name !== "constructor",
  );

  if (missing.length === 0) return null;

  return {
    id: "missing_return_type",
    severity: "info",
    title: "Missing return type",
    details: `Methods without return type: ${missing.map((m) => m.name + "()").join(", ")}`,
    fix: "Specify return types for all methods (use 'void' if the method returns nothing).",
  };
}

function checkMutableGetterExposure(
  data: ObjectNodeData,
): NodeSuggestion | null {
  const methods = data.methods ?? [];
  const issues: string[] = [];

  const publicGetters = methods.filter(
    (m) =>
      m.accessModifier === "public" &&
      m.name.match(/^(get|is|has)/i) &&
      m.returnType &&
      isMutableCollectionType(m.returnType),
  );

  for (const getter of publicGetters) {
    issues.push(
      `${getter.name}() returns '${getter.returnType}' — mutable collection type`,
    );
  }

  if (issues.length === 0) return null;

  return {
    id: "mutable_getter_exposure",
    severity: "warning",
    title: "Mutable collection exposure",
    details: issues.join("\n"),
    fix: "Return unmodifiable views or defensive copies from getters (e.g., Collections.unmodifiableList()).",
  };
}

function checkMissingConstructor(data: ObjectNodeData): NodeSuggestion | null {
  const attrs = data.attributes ?? [];
  const methods = data.methods ?? [];

  if (attrs.length === 0) return null;
  if (data.abstract) return null;

  const hasConstructor = methods.some(
    (m) => m.name === data.name || m.name === "constructor",
  );

  if (hasConstructor) return null;

  const nonStaticAttrs = attrs.filter((a) => !a.static);
  if (nonStaticAttrs.length === 0) return null;

  return {
    id: "missing_constructor",
    severity: "info",
    title: "Missing constructor",
    details: `Class has ${nonStaticAttrs.length} instance attribute(s) but no constructor: ${nonStaticAttrs.map((a) => a.name).join(", ")}`,
    fix: "Add a constructor to initialize instance attributes.",
  };
}

function checkUnusedAbstract(data: ObjectNodeData): NodeSuggestion | null {
  if (!data.abstract) return null;

  const methods = data.methods ?? [];
  const hasAbstractMethods = methods.some((m) => m.abstract);

  if (hasAbstractMethods) return null;

  return {
    id: "unused_abstract",
    severity: "info",
    title: "Abstract class without abstract methods",
    details:
      "This class is marked as abstract but has no abstract methods.",
    fix: "Add abstract methods or remove the abstract modifier if this class can be instantiated directly.",
  };
}

function checkTooManyParameters(data: ObjectNodeData): NodeSuggestion | null {
  const methods = data.methods ?? [];
  const issues: string[] = [];

  for (const method of methods) {
    if (method.parameters.length > 4) {
      issues.push(
        `${method.name}() has ${method.parameters.length} parameters`,
      );
    }
  }

  if (issues.length === 0) return null;

  return {
    id: "too_many_parameters",
    severity: "warning",
    title: "Too many parameters",
    details: issues.join("\n"),
    fix: "Consider using a parameter object or builder pattern to reduce parameter count (recommended: 4 or fewer).",
  };
}

export function analyzeObjectNode(
  data: ObjectNodeData,
  settings: SuggestionSettings,
): NodeSuggestion[] {
  const suggestions: NodeSuggestion[] = [];

  const checks: Array<{
    key: keyof SuggestionSettings;
    fn: (data: ObjectNodeData) => NodeSuggestion | null;
  }> = [
    { key: "encapsulation_violation", fn: checkEncapsulationViolation },
    { key: "naming_convention_class", fn: checkNamingConventionClass },
    { key: "naming_convention_members", fn: checkNamingConventionMembers },
    { key: "god_class", fn: checkGodClass },
    { key: "empty_class", fn: checkEmptyClass },
    { key: "missing_return_type", fn: checkMissingReturnType },
    { key: "mutable_getter_exposure", fn: checkMutableGetterExposure },
    { key: "missing_constructor", fn: checkMissingConstructor },
    { key: "unused_abstract", fn: checkUnusedAbstract },
    { key: "too_many_parameters", fn: checkTooManyParameters },
  ];

  for (const check of checks) {
    if (!settings[check.key]) continue;
    const result = check.fn(data);
    if (result) suggestions.push(result);
  }

  return suggestions;
}
