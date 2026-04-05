/**
 * Code generator - port of generator.rs
 * Parses Java, Python, and C++ source files to extract UML class information.
 * Uses regex-based parsing as a lightweight alternative to tree-sitter.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

function uuid() {
  return crypto.randomUUID();
}

// ─── Data Structures ──────────────────────────────────────────────────────────

/**
 * @typedef {{ name: string, fieldType: string, accessModifier: string }} UmlField
 * @typedef {{ name: string, returnType: string, accessModifier: string, isStatic: boolean, parameters: UmlField[] }} UmlMethod
 * @typedef {{ name: string, isInterface: boolean, extends: string[], implements: string[], fields: UmlField[], methods: UmlMethod[], path: string, groupId: string|null }} UmlClass
 */

// ─── Modifier Stripping ──────────────────────────────────────────────────────

const MODIFIER_KEYWORDS = new Set([
  // Java
  "public", "private", "protected",
  "static", "final", "abstract",
  "volatile", "transient", "synchronized",
  "native", "strictfp", "default",
  // C++ / general OOP
  "virtual", "override", "const", "inline",
  "explicit", "extern", "mutable",
  "constexpr", "consteval", "constinit",
  // Common annotation names (bare, without @) as a fallback
  "Override", "Deprecated", "SuppressWarnings",
  "NotNull", "Nullable", "Nonnull",
]);

function stripModifiers(typeStr) {
  if (!typeStr) return typeStr;
  // Remove annotations like @Override, @NotNull, etc.
  const noAnnotations = typeStr.replace(/@\w+\s*/g, "");
  return noAnnotations
    .split(/\s+/)
    .filter((word) => !MODIFIER_KEYWORDS.has(word))
    .join(" ")
    .trim();
}

// ─── Language Detection ───────────────────────────────────────────────────────

const LANG_MAP = {
  ".java": "java",
  ".py": "python",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".cc": "cpp",
  ".hpp": "cpp",
  ".h": "cpp",
  ".c": "cpp",
};

function getLanguageForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LANG_MAP[ext] || null;
}

// ─── Java Parser ──────────────────────────────────────────────────────────────

function parseJava(source) {
  const classes = [];
  // Remove comments, then annotations (e.g. @Override, @SuppressWarnings(...))
  const cleaned = source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@\w+(?:\s*\([^)]*\))?\s*/g, "");

  // Match class and interface declarations
  const classRegex =
    /(?:(?:public|private|protected|abstract|static|final)\s+)*(?:(class|interface))\s+(\w+)(?:\s+extends\s+([\w.,\s]+?))?(?:\s+implements\s+([\w.,\s]+?))?\s*\{/g;

  let match;
  while ((match = classRegex.exec(cleaned)) !== null) {
    const isInterface = match[1] === "interface";
    const className = match[2];
    const extendsStr = match[3] || "";
    const implementsStr = match[4] || "";

    const cls = {
      name: className,
      isInterface,
      extends: extendsStr
        ? extendsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      implements: implementsStr
        ? implementsStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      fields: [],
      methods: [],
      path: "",
      groupId: null,
    };

    // Find the matching closing brace for this class body
    const bodyStart = match.index + match[0].length;
    const body = extractBody(cleaned, bodyStart);

    // Parse fields and methods from body
    parseJavaBody(body, cls);

    classes.push(cls);
  }

  return classes;
}

function parseJavaBody(body, cls) {
  // Remove nested class/interface bodies to avoid confusion
  const cleaned = removeNestedBodies(body);

  // Parse fields: access_modifier type name ;
  const fieldRegex =
    /(?:(public|private|protected)\s+)?(?:(static)\s+)?(?:(final)\s+)?([\w<>\[\],\s.?]+?)\s+(\w+)\s*(?:=\s*[^;]+)?\s*;/g;
  let match;
  while ((match = fieldRegex.exec(cleaned)) !== null) {
    const access = match[1] || "private";
    const type = match[4].trim();
    const name = match[5];
    // Skip if it looks like a method (has parens nearby) or is a common keyword
    if (
      ["class", "interface", "return", "import", "package", "new", "throw"].includes(type)
    )
      continue;
    if (
      ["class", "interface", "return", "import", "package", "new", "throw"].includes(name)
    )
      continue;
    cls.fields.push({ name, fieldType: stripModifiers(type), accessModifier: access });
  }

  // Parse methods: access_modifier [static] returnType name(params)
  const methodRegex =
    /(?:(public|private|protected)\s+)?(?:(static)\s+)?(?:(abstract)\s+)?([\w<>\[\],\s.?]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w.,\s]+)?\s*[{;]/g;
  while ((match = methodRegex.exec(cleaned)) !== null) {
    const access = match[1] || "public";
    const isStatic = !!match[2];
    const returnType = match[4].trim();
    const name = match[5];
    const paramsStr = match[6];

    // Skip if looks like a control statement
    if (["if", "for", "while", "switch", "catch", "class", "new"].includes(name))
      continue;

    const parameters = parseJavaParams(paramsStr);

    // Detect constructor
    const isConstructor = name === cls.name;

    cls.methods.push({
      name,
      returnType: isConstructor ? cls.name : stripModifiers(returnType),
      accessModifier: access,
      isStatic: isConstructor ? true : isStatic,
      parameters,
    });
  }
}

function parseJavaParams(paramsStr) {
  if (!paramsStr.trim()) return [];
  const params = [];
  // Split by comma, but respect generics
  const parts = splitParams(paramsStr);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Handle "final Type name" or "Type name" or "@Ann Type name"
    const cleaned = trimmed.replace(/@\w+\s*/g, "").replace(/\bfinal\s+/g, "");
    const lastSpace = cleaned.lastIndexOf(" ");
    if (lastSpace > 0) {
      const type = cleaned.substring(0, lastSpace).trim();
      const name = cleaned.substring(lastSpace + 1).trim();
      params.push({ name, fieldType: stripModifiers(type), accessModifier: "" });
    }
  }
  return params;
}

function splitParams(str) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of str) {
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) parts.push(current);
  return parts;
}

// ─── Python Parser ────────────────────────────────────────────────────────────

function parsePython(source) {
  const classes = [];
  const lines = source.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const classMatch = line.match(/^class\s+(\w+)(?:\(([^)]*)\))?\s*:/);
    if (classMatch) {
      const cls = {
        name: classMatch[1],
        isInterface: false,
        extends: classMatch[2]
          ? classMatch[2]
              .split(",")
              .map((s) => s.trim())
              .filter(
                (s) =>
                  s &&
                  s !== "object" &&
                  !s.startsWith("metaclass") &&
                  !s.includes("="),
              )
          : [],
        implements: [],
        fields: [],
        methods: [],
        path: "",
        groupId: null,
      };

      // Parse class body (indented lines)
      i++;
      const baseIndent = getIndent(lines[i] || "");
      while (i < lines.length) {
        const bodyLine = lines[i];
        if (
          bodyLine.trim() === "" ||
          getIndent(bodyLine) >= baseIndent
        ) {
          // Check for method definition
          const methodMatch = bodyLine.match(
            /^\s+def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\S+))?\s*:/,
          );
          if (methodMatch) {
            const methodName = methodMatch[1];
            const returnType = methodMatch[3] || "Any";
            const isInit =
              methodName === "__init__" || methodName === "__new__";

            cls.methods.push({
              name: methodName,
              returnType: isInit ? cls.name : returnType,
              accessModifier: "public",
              isStatic: isInit,
              parameters: [],
            });

            // If __init__, scan for self.x = assignments
            if (methodName === "__init__") {
              const methodIndent = getIndent(bodyLine);
              let j = i + 1;
              while (j < lines.length) {
                const mLine = lines[j];
                if (
                  mLine.trim() !== "" &&
                  getIndent(mLine) <= methodIndent
                )
                  break;
                const assignMatch = mLine.match(
                  /\s+self\.(\w+)\s*(?::\s*(\w+))?\s*=/,
                );
                if (assignMatch) {
                  cls.fields.push({
                    name: assignMatch[1],
                    fieldType: assignMatch[2] || "Any",
                    accessModifier: "public",
                  });
                }
                j++;
              }
            }
          }

          // Check for class-level assignment (field)
          const assignMatch = bodyLine.match(
            /^\s+(\w+)\s*(?::\s*(\w+))?\s*=\s*/,
          );
          if (
            assignMatch &&
            !bodyLine.trimStart().startsWith("def ") &&
            !bodyLine.trimStart().startsWith("class ")
          ) {
            const name = assignMatch[1];
            if (
              name !== "self" &&
              !["def", "class", "return", "if", "for", "while"].includes(name)
            ) {
              cls.fields.push({
                name,
                fieldType: assignMatch[2] || "Any",
                accessModifier: "public",
              });
            }
          }

          i++;
        } else {
          break;
        }
      }

      classes.push(cls);
    } else {
      i++;
    }
  }

  return classes;
}

function getIndent(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

// ─── C++ Parser ───────────────────────────────────────────────────────────────

function parseCpp(source) {
  const classes = [];
  // Remove comments
  const cleaned = source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Match class/struct declarations
  const classRegex =
    /(?:class|struct)\s+(\w+)(?:\s*:\s*((?:(?:public|private|protected)\s+)?[\w:]+(?:\s*,\s*(?:(?:public|private|protected)\s+)?[\w:]+)*)?)?\s*\{/g;

  let match;
  while ((match = classRegex.exec(cleaned)) !== null) {
    const cls = {
      name: match[1],
      isInterface: false,
      extends: [],
      implements: [],
      fields: [],
      methods: [],
      path: "",
      groupId: null,
    };

    if (match[2]) {
      const bases = match[2].split(",").map((s) => s.trim());
      for (const base of bases) {
        const baseName = base.replace(/^(?:public|private|protected)\s+/, "").trim();
        if (baseName) cls.extends.push(baseName);
      }
    }

    classes.push(cls);
  }

  return classes;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function extractBody(source, startIndex) {
  let depth = 1;
  let i = startIndex;
  while (i < source.length && depth > 0) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    i++;
  }
  return source.substring(startIndex, i - 1);
}

function removeNestedBodies(body) {
  // Remove nested class/interface/enum bodies
  let result = "";
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "{") {
      depth++;
      if (depth === 1) {
        result += "{";
      }
    } else if (body[i] === "}") {
      if (depth === 1) {
        result += "}";
      }
      depth--;
    } else if (depth <= 0) {
      result += body[i];
    }
  }
  return result;
}

// ─── Walk Directory ───────────────────────────────────────────────────────────

function walkDirectory(dirPath, groups, parentGroup, generateGroups, files) {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const groupId = `group_${entry.name}`;
      let nextParent = parentGroup;

      if (generateGroups) {
        groups.set(groupId, {
          id: groupId,
          type: "group",
          position: { x: 0, y: 0 },
          style: {
            width: 0,
            height: 0,
            border: "none",
            background: "transparent",
          },
          zIndex: -1,
          data: { name: entry.name, color: "#18181b50" },
          parentId: parentGroup || undefined,
        });
        nextParent = groupId;
      }

      walkDirectory(fullPath, groups, nextParent, generateGroups, files);
    } else if (entry.isFile()) {
      files.push({ path: fullPath, groupId: parentGroup });
    }
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateDiagram(paths, recursive, generateGroups, onProgress) {
  const report = (current, total, message) => {
    if (onProgress) onProgress({ current, total, message });
  };

  report(0, 1, "Scanning directories...");

  const groups = new Map();
  const files = [];

  for (const p of paths) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory() && recursive) {
        walkDirectory(p, groups, null, generateGroups, files);
      } else if (stat.isFile()) {
        files.push({ path: p, groupId: null });
      }
    } catch {
      // Skip inaccessible paths
    }
  }

  const supportedFiles = files.filter((f) => getLanguageForFile(f.path));
  const totalFiles = supportedFiles.length;

  // Parse all files
  const allClasses = [];
  let processed = 0;
  for (const file of files) {
    const lang = getLanguageForFile(file.path);
    if (!lang) continue;

    processed++;
    report(processed, totalFiles, `Parsing file ${processed} of ${totalFiles}...`);

    let source;
    try {
      source = fs.readFileSync(file.path, "utf-8");
    } catch {
      continue;
    }

    let fileClasses = [];
    switch (lang) {
      case "java":
        fileClasses = parseJava(source);
        break;
      case "python":
        fileClasses = parsePython(source);
        break;
      case "cpp":
        fileClasses = parseCpp(source);
        break;
    }

    for (const cls of fileClasses) {
      cls.groupId = file.groupId;
      cls.path = file.path;
    }
    allClasses.push(...fileClasses);

    // Yield to event loop so progress IPC messages can be sent
    await new Promise((r) => setTimeout(r, 0));
  }

  report(totalFiles, totalFiles, "Generating diagram...");

  // Build nodes
  const nodes = [];

  // Add group nodes
  for (const [, group] of groups) {
    nodes.push(group);
  }

  // Build class→id map
  const classIdMap = new Map();
  for (const cls of allClasses) {
    classIdMap.set(cls.name, `generated-${uuid()}`);
  }

  const edges = [];
  let x = 0;
  let y = 0;

  for (const cls of allClasses) {
    const nodeId = classIdMap.get(cls.name);

    const attributes = cls.fields.map((f) => ({
      id: uuid(),
      name: f.name,
      type: f.fieldType,
      accessModifier: f.accessModifier.toLowerCase(),
    }));

    const methods = cls.methods.map((m) => ({
      id: uuid(),
      name: m.name,
      returnType: m.returnType,
      accessModifier: m.accessModifier.toLowerCase(),
      static: m.isStatic,
      parameters: m.parameters.map((p) => ({
        id: uuid(),
        name: p.name,
        type: p.fieldType,
      })),
    }));

    const node = {
      id: nodeId,
      type: "object",
      position: { x, y },
      data: {
        name: cls.name,
        stereotype: cls.isInterface ? "interface" : "",
        attributes,
        methods,
        extends: cls.extends,
        implements: cls.implements,
      },
    };

    if (cls.groupId) {
      node.parentId = cls.groupId;
    }

    nodes.push(node);

    x += 300;
    if (x > 1500) {
      x = 0;
      y += 400;
    }

    // Implementation edges
    for (const impl of cls.implements) {
      const targetId = classIdMap.get(impl);
      if (targetId) {
        edges.push({
          id: uuid(),
          source: nodeId,
          target: targetId,
          type: "implementation",
          style: { stroke: "var(--foreground)", strokeWidth: 2 },
          markerEnd: { color: "var(--foreground)", type: "arrowclosed" },
        });
      }
    }

    // Generalization edges
    for (const ext of cls.extends) {
      const targetId = classIdMap.get(ext);
      if (targetId) {
        edges.push({
          id: uuid(),
          source: nodeId,
          target: targetId,
          type: "generalization",
          style: { stroke: "var(--foreground)", strokeWidth: 2 },
          markerEnd: { color: "var(--foreground)", type: "arrowclosed" },
        });
      }
    }

    // Association edges from fields
    for (const field of cls.fields) {
      const t = field.fieldType
        .replace("[]", "")
        .replace(/List</, "")
        .replace(/>/, "");
      const targetId = classIdMap.get(t);
      if (targetId && t !== cls.name) {
        edges.push({
          id: uuid(),
          source: nodeId,
          target: targetId,
          type: "association",
          style: { stroke: "var(--foreground)", strokeWidth: 2 },
          markerEnd: { color: "var(--foreground)", type: "arrow" },
        });
      }
    }
  }

  return { nodes, edges };
}
