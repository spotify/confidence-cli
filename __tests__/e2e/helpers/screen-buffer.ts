class ScreenBuffer {
  private cells: string[][];
  private row = 0;
  private col = 0;

  constructor(
    private rows: number,
    private cols: number,
  ) {
    this.cells = Array.from({ length: rows }, () => Array(cols).fill(' ') as string[]);
  }

  write(data: string): void {
    let i = 0;
    while (i < data.length) {
      const ch = data[i]!;

      if (ch === '\x1B') {
        i = this.parseEscape(data, i);
      } else if (ch === '\n') {
        this.lineFeed();
        i++;
      } else if (ch === '\r') {
        this.col = 0;
        i++;
      } else if (ch === '\t') {
        this.col = Math.min(this.col + (8 - (this.col % 8)), this.cols - 1);
        i++;
      } else if (ch === '\x08') {
        this.col = Math.max(0, this.col - 1);
        i++;
      } else if (ch < '\x20') {
        i++;
      } else {
        if (this.col < this.cols) {
          this.cells[this.row]![this.col] = ch;
          this.col++;
        }
        i++;
      }
    }
  }

  toText(): string {
    const lines: string[] = [];

    for (let r = 0; r < this.rows; r++) {
      lines.push(this.cells[r]!.join('').trimEnd());
    }

    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines.join('\n');
  }

  private lineFeed(): void {
    this.col = 0;
    if (this.row < this.rows - 1) {
      this.row++;
    } else {
      this.scrollUp();
    }
  }

  private scrollUp(): void {
    this.cells.shift();
    this.cells.push(Array(this.cols).fill(' ') as string[]);
  }

  private parseEscape(data: string, start: number): number {
    if (start + 1 >= data.length) return start + 1;

    const next = data[start + 1];

    if (next === '[') {
      return this.parseCSI(data, start + 2);
    }

    if (next === ']') {
      let j = start + 2;
      while (j < data.length) {
        if (data[j] === '\x07') return j + 1;
        if (data[j] === '\x1B' && j + 1 < data.length && data[j + 1] === '\\') return j + 2;
        j++;
      }
      return j;
    }

    return start + 2;
  }

  private parseCSI(data: string, start: number): number {
    let j = start;

    if (
      j < data.length &&
      (data[j] === '?' || data[j] === '>' || data[j] === '<' || data[j] === '=')
    ) {
      j++;
    }

    while (j < data.length) {
      const ch = data[j]!;
      if ((ch >= '0' && ch <= '9') || ch === ';') {
        j++;
      } else if (ch >= ' ' && ch <= '/') {
        j++;
      } else if (ch >= '@' && ch <= '~') {
        this.handleCSI(data.slice(start, j), ch);
        return j + 1;
      } else {
        return j;
      }
    }

    return j;
  }

  private handleCSI(paramStr: string, cmd: string): void {
    const clean = paramStr.replace(/^[?>=<]/, '');
    if (clean !== paramStr) return;

    const parts = clean === '' ? [0] : clean.split(';').map((p) => parseInt(p, 10) || 0);

    switch (cmd) {
      case 'A':
        this.row = Math.max(0, this.row - (parts[0] || 1));
        break;
      case 'B':
        this.row = Math.min(this.rows - 1, this.row + (parts[0] || 1));
        break;
      case 'C':
        this.col = Math.min(this.cols - 1, this.col + (parts[0] || 1));
        break;
      case 'D':
        this.col = Math.max(0, this.col - (parts[0] || 1));
        break;
      case 'G':
        this.col = Math.max(0, Math.min(this.cols - 1, (parts[0] || 1) - 1));
        break;
      case 'H':
      case 'f':
        this.row = Math.max(0, Math.min(this.rows - 1, (parts[0] || 1) - 1));
        this.col = Math.max(0, Math.min(this.cols - 1, (parts[1] || 1) - 1));
        break;
      case 'J':
        this.eraseDisplay(parts[0] || 0);
        break;
      case 'K':
        this.eraseInLine(parts[0] || 0);
        break;
    }
  }

  private eraseDisplay(mode: number): void {
    if (mode === 2 || mode === 3) {
      for (let r = 0; r < this.rows; r++) {
        this.cells[r] = Array(this.cols).fill(' ') as string[];
      }
      this.row = 0;
      this.col = 0;
    } else if (mode === 0) {
      this.cells[this.row]!.fill(' ', this.col);
      for (let r = this.row + 1; r < this.rows; r++) {
        this.cells[r] = Array(this.cols).fill(' ') as string[];
      }
    } else if (mode === 1) {
      for (let r = 0; r < this.row; r++) {
        this.cells[r] = Array(this.cols).fill(' ') as string[];
      }
      this.cells[this.row]!.fill(' ', 0, this.col + 1);
    }
  }

  private eraseInLine(mode: number): void {
    const row = this.cells[this.row]!;
    if (mode === 0) {
      row.fill(' ', this.col);
    } else if (mode === 1) {
      row.fill(' ', 0, this.col + 1);
    } else if (mode === 2) {
      row.fill(' ');
    }
  }
}

export function renderScreen(raw: string, cols: number, rows: number): string {
  const buf = new ScreenBuffer(rows, cols);
  buf.write(raw);
  return buf.toText();
}

export function normalizeSnapshot(text: string, cwd: string): string {
  let result = text.replaceAll(cwd, '<project-dir>');
  result = result.replace(/v\d+\.\d+\.\d+(-[\w.]+)?/g, (m) => 'vX.Y.Z'.padEnd(m.length));
  result = result.replace(/(?<=[\s])\d+\.\d+\.\d+/gm, (m) => 'X.Y.Z'.padEnd(m.length));
  result = result.replace(/\n{4,}/g, '\n\n\n');
  return result;
}
