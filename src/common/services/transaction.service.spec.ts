import { DataSource, EntityManager } from 'typeorm';

import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
  let manager: EntityManager;

  beforeEach(() => {
    manager = {} as EntityManager;

    dataSource = {
      transaction: jest.fn(),
    };

    service = new TransactionService(
      dataSource as unknown as DataSource,
    );
  });

  describe('runInTransaction', () => {
    it('should execute the callback inside a transaction', async () => {
      const expectedResult = { id: '123' };

      dataSource.transaction.mockImplementation(
        async (callback: any) => callback(manager),
      );

      const callback = jest.fn().mockResolvedValue(expectedResult);

      const result = await service.runInTransaction(callback);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(manager);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors thrown by the transaction callback', async () => {
      const error = new Error('Transaction failed.');

      dataSource.transaction.mockImplementation(
        async (callback: any) => callback(manager),
      );

      const callback = jest.fn().mockRejectedValue(error);

      await expect(
        service.runInTransaction(callback),
      ).rejects.toThrow(error);
    });
  });
});