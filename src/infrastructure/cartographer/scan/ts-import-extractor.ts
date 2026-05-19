import path from "node:path";

const IMPORT_RE = /(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']/g;
const REQUIRE_RE = /\brequire\(\s*["']([^"']+)["']\s*\)/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const DYNAMIC_VARIABLE_RE = /\bimport\(\s*[^"')]+\)/;

export interface ExtractedImports {
  readonly specifiers: readonly string[];
  readonly hasDynamicUncertainty: boolean;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

export function extractImportSpecifiers(rawSource: string): ExtractedImports {
  const source = stripComments(rawSource);
  const specifiers = new Set<string>();
  for (const re of [IMPORT_RE, REQUIRE_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null = re.exec(source);
    while (match !== null) {
      if (match[1] !== undefined) {
        specifiers.add(match[1]);
      }
      match = re.exec(source);
    }
  }
  return {
    specifiers: [...specifiers],
    hasDynamicUncertainty: DYNAMIC_VARIABLE_RE.test(source),
  };
}

export function resolveRelativeImport(
  fromRelativePath: string,
  specifier: string,
  knownFiles: ReadonlySet<string>,
): string | null {
  if (!specifier.startsWith(".")) {
    return null;
  }
  const fromDir = path.posix.dirname(fromRelativePath.replace(/\\/g, "/"));
  const joined = path.posix.normalize(path.posix.join(fromDir, specifier));
  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}.mjs`,
    `${joined.replace(/\.js$/, ".ts")}`,
    path.posix.join(joined, "index.ts"),
    path.posix.join(joined, "index.js"),
  ];
  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function collapseCycles(
  adjacency: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, boolean> {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const sccStack: string[] = [];
  const cyclic = new Map<string, boolean>();
  let counter = 0;

  const hasSelfLoop = (node: string): boolean => {
    const out = adjacency.get(node) ?? [];
    return out.includes(node);
  };

  type Frame = { readonly node: string; childIndex: number };

  for (const root of adjacency.keys()) {
    if (index.has(root)) {
      continue;
    }
    const work: Frame[] = [{ node: root, childIndex: 0 }];
    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const node = frame.node;
      if (frame.childIndex === 0) {
        index.set(node, counter);
        low.set(node, counter);
        counter += 1;
        sccStack.push(node);
        onStack.add(node);
      }
      const children = adjacency.get(node) ?? [];
      if (frame.childIndex < children.length) {
        const next = children[frame.childIndex]!;
        frame.childIndex += 1;
        if (!index.has(next)) {
          work.push({ node: next, childIndex: 0 });
        } else if (onStack.has(next)) {
          low.set(node, Math.min(low.get(node)!, index.get(next)!));
        }
        continue;
      }
      if (low.get(node) === index.get(node)) {
        const component: string[] = [];
        let popped = "";
        do {
          popped = sccStack.pop()!;
          onStack.delete(popped);
          component.push(popped);
        } while (popped !== node);
        const isCyclic = component.length > 1 || hasSelfLoop(component[0]!);
        for (const member of component) {
          cyclic.set(member, isCyclic);
        }
      }
      work.pop();
      const parent = work[work.length - 1];
      if (parent !== undefined) {
        low.set(parent.node, Math.min(low.get(parent.node)!, low.get(node)!));
      }
    }
  }
  return cyclic;
}
