const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";

export function cyan(s: string): string {
  return `${CYAN}${s}${RESET}`;
}

export function blue(s: string): string {
  return `${BLUE}${s}${RESET}`;
}

export function yellow(s: string): string {
  return `${YELLOW}${s}${RESET}`;
}

export function green(s: string): string {
  return `${GREEN}${s}${RESET}`;
}

export function dim(s: string): string {
  return `${DIM}${s}${RESET}`;
}
