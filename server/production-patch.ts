/**
 * Production patch for import.meta.dirname undefined issue
 * This module provides fallbacks for production environments
 */
import path from "path";

// Monkey patch for import.meta when dirname is undefined
if (typeof import.meta.dirname === 'undefined') {
  // @ts-ignore - We're deliberately patching import.meta
  import.meta.dirname = process.cwd();
  console.log('✅ Patched import.meta.dirname for production compatibility');
}

// Export safe path resolver that never receives undefined
export function safeResolve(...paths: (string | undefined)[]): string {
  const validPaths = paths.filter((p): p is string => typeof p === 'string' && p.length > 0);
  
  if (validPaths.length === 0) {
    // Fallback to current working directory
    return process.cwd();
  }
  
  return path.resolve(...validPaths);
}

// Export safe dirname getter
export function getSafeDirname(): string {
  return import.meta.dirname || process.cwd() || '/usr/src/app';
}