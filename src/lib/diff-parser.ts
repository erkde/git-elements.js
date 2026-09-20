export type LineType = "context" | "addition" | "deletion";
export type FileStatus = "modified" | "added" | "deleted" | "renamed" | "copied";

export interface DiffLine {
  type: LineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface ParsedDiff {
  oldPath: string | null;
  newPath: string | null;
  status: FileStatus;
  oldMode: string | null;
  newMode: string | null;
  similarity: number | null;
  isBinary: boolean;
  binaryMessage: string | null;
  hunks: DiffHunk[];
}

export interface DiffShortstat {
  files: number;
  additions: number;
  deletions: number;
}

export interface DiffFileStat {
  oldPath: string | null;
  newPath: string | null;
  isBinary: boolean;
  additions: number;
  deletions: number;
}

export function formatDiffPath(file: ParsedDiff): string {
  return file.oldPath && file.newPath && file.oldPath !== file.newPath
    ? `${file.oldPath} → ${file.newPath}`
    : (file.newPath ?? file.oldPath ?? "(unknown file)");
}

export function countDiffByFile(files: ParsedDiff[]): DiffFileStat[] {
  return files.map((file) => {
    const stat: DiffFileStat = {
      oldPath: file.oldPath,
      newPath: file.newPath,
      isBinary: file.isBinary,
      additions: 0,
      deletions: 0,
    };

    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === "addition") stat.additions++;
        if (line.type === "deletion") stat.deletions++;
      }
    }

    return stat;
  });
}

export function summarizeDiff(files: ParsedDiff[]): DiffShortstat {
  const summary: DiffShortstat = { files: 0, additions: 0, deletions: 0 };

  for (const stat of countDiffByFile(files)) {
    summary.files++;
    summary.additions += stat.additions;
    summary.deletions += stat.deletions;
  }

  return summary;
}

const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function createFile(oldPath: string | null = null, newPath: string | null = null): ParsedDiff {
  return {
    oldPath,
    newPath,
    status: "modified",
    oldMode: null,
    newMode: null,
    similarity: null,
    isBinary: false,
    binaryMessage: null,
    hunks: [],
  };
}

function decodeQuotedPath(value: string): string {
  const path = value.trim();
  if (!path.startsWith('"') || !path.endsWith('"')) {
    return path;
  }

  const bytes: number[] = [];
  const escapeCharacters: Record<string, string> = {
    a: "\x07",
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    v: "\v",
    "\\": "\\",
    '"': '"',
  };

  for (let index = 1; index < path.length - 1; index++) {
    let character = path[index]!;
    if (character === "\\") {
      const escaped = path[++index];
      if (escaped === undefined) {
        break;
      }

      if (/[0-7]/.test(escaped)) {
        let octal = escaped;
        while (octal.length < 3 && /[0-7]/.test(path[index + 1] ?? "")) {
          octal += path[++index];
        }
        bytes.push(parseInt(octal, 8));
        continue;
      }

      character = escapeCharacters[escaped] ?? escaped;
    }

    bytes.push(...textEncoder.encode(character));
  }

  return textDecoder.decode(new Uint8Array(bytes));
}

function normalizePath(value: string, stripPrefix = false): string | null {
  const withoutTimestamp = value.startsWith('"') ? value : (value.split("\t", 1)[0] ?? value);
  const path = decodeQuotedPath(withoutTimestamp);
  if (path === "/dev/null") {
    return null;
  }
  return stripPrefix ? path.replace(/^[ab]\//, "") : path;
}

function readQuotedToken(value: string, start: number): { token: string; end: number } | null {
  let index = start;
  while (value[index] === " ") index++;
  if (value[index] !== '"') return null;

  const tokenStart = index++;
  let escaped = false;
  for (; index < value.length; index++) {
    const character = value[index];
    if (character === '"' && !escaped) {
      return { token: value.slice(tokenStart, index + 1), end: index + 1 };
    }
    if (character === "\\" && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  return null;
}

function parseDiffHeaderPaths(line: string): [string | null, string | null] {
  const value = line.slice("diff --git ".length);
  if (value.startsWith('"')) {
    const oldToken = readQuotedToken(value, 0);
    const newToken = oldToken ? readQuotedToken(value, oldToken.end) : null;
    return [
      oldToken ? normalizePath(oldToken.token, true) : null,
      newToken ? normalizePath(newToken.token, true) : null,
    ];
  }

  const separator = value.lastIndexOf(" b/");
  if (value.startsWith("a/") && separator !== -1) {
    return [
      normalizePath(value.slice(0, separator), true),
      normalizePath(value.slice(separator + 1), true),
    ];
  }

  const [oldPath, newPath] = value.split(/\s+/, 2);
  return [
    oldPath === undefined ? null : normalizePath(oldPath, true),
    newPath === undefined ? null : normalizePath(newPath, true),
  ];
}

export function parseDiff(rawDiff: string): ParsedDiff[] {
  const files: ParsedDiff[] = [];
  if (!rawDiff.trim()) return files;

  const lines = rawDiff.split(/\r?\n/);
  let currentFile: ParsedDiff | null = null;
  let currentHunk: DiffHunk | null = null;
  let expectingFileHeaders = false;
  let oldLineCounter = 0;
  let newLineCounter = 0;
  let oldLinesRemaining = 0;
  let newLinesRemaining = 0;

  for (const line of lines) {
    if (line.startsWith("\\ No newline at end of file")) {
      continue;
    }

    if (currentHunk) {
      let parsedLine: DiffLine | null = null;

      if (line.startsWith("+")) {
        parsedLine = {
          type: "addition",
          content: line.slice(1),
          oldLineNumber: null,
          newLineNumber: newLineCounter++,
        };
        newLinesRemaining--;
      } else if (line.startsWith("-")) {
        parsedLine = {
          type: "deletion",
          content: line.slice(1),
          oldLineNumber: oldLineCounter++,
          newLineNumber: null,
        };
        oldLinesRemaining--;
      } else if (line.startsWith(" ")) {
        parsedLine = {
          type: "context",
          content: line.slice(1),
          oldLineNumber: oldLineCounter++,
          newLineNumber: newLineCounter++,
        };
        oldLinesRemaining--;
        newLinesRemaining--;
      }

      if (parsedLine) {
        currentHunk.lines.push(parsedLine);
        if (oldLinesRemaining <= 0 && newLinesRemaining <= 0) {
          currentHunk = null;
        }
        continue;
      }
    }

    if (line.startsWith("diff --git ")) {
      const [oldPath, newPath] = parseDiffHeaderPaths(line);
      currentFile = createFile(oldPath, newPath);
      files.push(currentFile);
      currentHunk = null;
      expectingFileHeaders = true;
      continue;
    }

    if (line.startsWith("--- ")) {
      if (!currentFile || !expectingFileHeaders) {
        currentFile = createFile();
        files.push(currentFile);
      }

      currentFile.oldPath = normalizePath(line.slice(4), true);
      if (currentFile.oldPath === null) {
        currentFile.status = "added";
      }
      expectingFileHeaders = true;
      continue;
    }

    if (line.startsWith("+++ ") && currentFile) {
      currentFile.newPath = normalizePath(line.slice(4), true);
      if (currentFile.newPath === null) {
        currentFile.status = "deleted";
      }
      expectingFileHeaders = false;
      continue;
    }

    if (!currentFile && line.startsWith("@@")) {
      currentFile = createFile();
      files.push(currentFile);
    }

    const hunkMatch = line.match(HUNK_HEADER_REGEX);
    if (hunkMatch && currentFile) {
      const [, oldStartText, oldLinesText, newStartText, newLinesText] = hunkMatch;
      if (oldStartText === undefined || newStartText === undefined) {
        continue;
      }

      const oldStart = parseInt(oldStartText, 10);
      const oldLines = oldLinesText !== undefined ? parseInt(oldLinesText, 10) : 1;
      const newStart = parseInt(newStartText, 10);
      const newLines = newLinesText !== undefined ? parseInt(newLinesText, 10) : 1;

      oldLineCounter = oldStart;
      newLineCounter = newStart;
      oldLinesRemaining = oldLines;
      newLinesRemaining = newLines;

      currentHunk = {
        header: line,
        oldStart,
        oldLines,
        newStart,
        newLines,
        lines: [],
      };
      currentFile.hunks.push(currentHunk);
      continue;
    }

    if (!currentFile) {
      continue;
    }

    if (line.startsWith("new file mode ")) {
      currentFile.status = "added";
      currentFile.oldPath = null;
      currentFile.newMode = line.slice("new file mode ".length).trim();
    } else if (line.startsWith("deleted file mode ")) {
      currentFile.status = "deleted";
      currentFile.newPath = null;
      currentFile.oldMode = line.slice("deleted file mode ".length).trim();
    } else if (line.startsWith("old mode ")) {
      currentFile.oldMode = line.slice("old mode ".length).trim();
    } else if (line.startsWith("new mode ")) {
      currentFile.newMode = line.slice("new mode ".length).trim();
    } else if (line.startsWith("similarity index ")) {
      currentFile.similarity = parseInt(line.slice("similarity index ".length), 10);
    } else if (line.startsWith("dissimilarity index ")) {
      currentFile.similarity = 100 - parseInt(line.slice("dissimilarity index ".length), 10);
    } else if (line.startsWith("rename from ")) {
      currentFile.status = "renamed";
      currentFile.oldPath = normalizePath(line.slice("rename from ".length));
    } else if (line.startsWith("rename to ")) {
      currentFile.status = "renamed";
      currentFile.newPath = normalizePath(line.slice("rename to ".length));
    } else if (line.startsWith("copy from ")) {
      currentFile.status = "copied";
      currentFile.oldPath = normalizePath(line.slice("copy from ".length));
    } else if (line.startsWith("copy to ")) {
      currentFile.status = "copied";
      currentFile.newPath = normalizePath(line.slice("copy to ".length));
    } else if (line.startsWith("Binary files ") || line === "GIT binary patch") {
      currentFile.isBinary = true;
      currentFile.binaryMessage = line;
    } else {
      const indexMatch = line.match(/^index \S+\.\.\S+(?: (\d{6}))?$/);
      const mode = indexMatch?.[1];
      if (mode !== undefined) {
        currentFile.oldMode ??= mode;
        currentFile.newMode ??= mode;
      }
    }
  }

  return files;
}
