/// <reference types="vitest" />
import { expect, test, it, vi, describe, beforeEach, afterEach } from 'vitest';

declare global {
  const expect: typeof expect;
  const test: typeof test;
  const it: typeof it;
  const vi: typeof vi;
  const describe: typeof describe;
  const beforeEach: typeof beforeEach;
  const afterEach: typeof afterEach;
}