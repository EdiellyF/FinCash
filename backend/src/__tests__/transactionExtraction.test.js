import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processExtractedData } from '../services/transactionExtractionService.js';
import { logger } from '../config/logger.js';

vi.mock('../config/logger.js', async () => {
  const actual = await vi.importActual('../config/logger.js');
  return {
    ...actual,
    logger: { ...actual.logger, warn: vi.fn(), error: vi.fn(), info: vi.fn() }
  };
});

describe('transactionExtraction', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('truncates long title and description and limits to 200 transactions', () => {
    const longTitle = 'A'.repeat(500);
    const longDesc = 'B'.repeat(2000);

    const txs = Array.from({ length: 250 }).map((_, i) => ({
      type: 'expense',
      amount: 10 + i,
      category: 'Outros',
      title: longTitle,
      description: longDesc,
      transactionDate: '2023-01-01'
    }));

    const categories = [{ id: 'c1', name: 'Outros', type: 'expense', isDefault: true }];

    const result = processExtractedData({ transactions: txs }, categories);

    expect(result.length).toBe(200);
    expect(result[0].title.length).toBeLessThanOrEqual(120);
    expect(result[0].description.length).toBeLessThanOrEqual(500);
  });
});