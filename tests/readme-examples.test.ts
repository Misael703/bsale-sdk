import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, it, expect } from 'vitest';

// Type-checks every ```typescript block of README.md against src/, so the
// documented API cannot drift from the real one without failing CI.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README_PATH = resolve(ROOT, 'README.md');
const PACKAGE_NAME = '@misael703/bsale-sdk';
const CODE_BLOCK = /^```(?:typescript|ts)\n([\s\S]*?)^```$/gm;
const CONTEXT_FILE = resolve(ROOT, '__readme-context.d.ts');

// Snippets are fragments: they use a client and a few values that an earlier
// snippet (or the reader's own app) declares. A block that declares one of
// these itself shadows the ambient declaration.
const AMBIENT_CONTEXT = `
type Sdk = typeof import('${PACKAGE_NAME}');
declare const BsaleClient: Sdk['BsaleClient'];
declare const bsale: import('${PACKAGE_NAME}').BsaleClient;
declare const accessToken: string;
declare const signal: AbortSignal;
declare const productId: number;
declare const documentPayload: import('${PACKAGE_NAME}').BsaleDocumentCreatePayload;
declare const app: {
  post(
    path: string,
    handler: (
      req: { body: import('${PACKAGE_NAME}').BsaleWebhookPayload },
      res: { sendStatus(status: number): void },
    ) => void,
  ): void;
};
declare function startSpan(name: string): { setStatus(status: number): void; end(): void };
declare function generateTraceId(): string;
`;

interface ReadmeBlock {
  readonly line: number;
  readonly fileName: string;
  readonly code: string;
}

function extractBlocks(markdown: string): ReadmeBlock[] {
  return [...markdown.matchAll(CODE_BLOCK)].map((match) => {
    const line = markdown.slice(0, match.index).split('\n').length;
    // `export {}` makes each block a module: isolated scope and top-level await.
    const code = `${match[1]}\nexport {};\n`;
    return { line, fileName: resolve(ROOT, `__readme-line-${line}.ts`), code };
  });
}

function loadCompilerOptions(): ts.CompilerOptions {
  const configPath = resolve(ROOT, 'tsconfig.json');
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);
  return {
    ...options,
    noEmit: true,
    declaration: false,
    declarationMap: false,
    sourceMap: false,
    rootDir: ROOT,
    // Snippets show a call and drop its result; that is not an error in docs.
    noUnusedLocals: false,
    noUnusedParameters: false,
    paths: { [PACKAGE_NAME]: [resolve(ROOT, 'src/index.ts')] },
  };
}

function typeCheck(blocks: readonly ReadmeBlock[]): Map<string, string[]> {
  const virtualFiles = new Map<string, string>([[CONTEXT_FILE, AMBIENT_CONTEXT]]);
  for (const block of blocks) virtualFiles.set(block.fileName, block.code);

  const options = loadCompilerOptions();
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile.bind(host);
  const fileExists = host.fileExists.bind(host);
  host.readFile = (fileName) => virtualFiles.get(fileName) ?? readFile(fileName);
  host.fileExists = (fileName) => virtualFiles.has(fileName) || fileExists(fileName);

  const program = ts.createProgram([...virtualFiles.keys()], options, host);
  const errorsByFile = new Map<string, string[]>();
  for (const diagnostic of ts.getPreEmitDiagnostics(program)) {
    const fileName = diagnostic.file?.fileName ?? '<global>';
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const position =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : undefined;
    const where = position ? `snippet line ${position.line + 1}: ` : '';
    errorsByFile.set(fileName, [...(errorsByFile.get(fileName) ?? []), `${where}${message}`]);
  }
  return errorsByFile;
}

const blocks = extractBlocks(readFileSync(README_PATH, 'utf8'));
const errorsByFile = typeCheck(blocks);

describe('README.md code examples', () => {
  it('has typescript blocks to check', () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('compiles the ambient context and nothing outside the snippets', () => {
    const outside = [...errorsByFile].filter(
      ([fileName]) => !blocks.some((block) => block.fileName === fileName),
    );
    expect(outside).toEqual([]);
  });

  it.each(blocks.map((block) => [block.line, block] as const))(
    'block at README.md:%i compiles',
    (_line, block) => {
      expect(errorsByFile.get(block.fileName) ?? []).toEqual([]);
    },
  );
});
