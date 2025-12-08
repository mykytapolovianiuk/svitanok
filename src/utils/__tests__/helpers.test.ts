/**
 * Tests for utility helper functions
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, slugify, truncate } from '../helpers';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(100)).toBe('100,00 ₴');
    expect(formatPrice(1500.5)).toBe('1 500,50 ₴');
    expect(formatPrice(0)).toBe('0,00 ₴');
  });

  it('should format price with custom currency', () => {
    expect(formatPrice(100, 'USD')).toBe('100,00 $');
  });
});

describe('slugify', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Продукт для шкіри')).toBe('produkt-dlya-shkiry');
    expect(slugify('Test 123!@#')).toBe('test-123');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle special characters', () => {
    expect(slugify('Product & Co.')).toBe('product-co');
  });
});

describe('truncate', () => {
  it('should truncate text to specified length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('should use default length of 100', () => {
    const longText = 'a'.repeat(150);
    expect(truncate(longText).length).toBeLessThanOrEqual(103); // 100 + '...'
  });

  it('should handle empty string', () => {
    expect(truncate('')).toBe('');
  });
});



