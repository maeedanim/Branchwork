import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    service = new CryptoService();
  });

  describe('hashPassword', () => {
    it('should return a hashed password instead of the plain password', async () => {
      const password = 'StrongPassword123!';

      const result = await service.hashPassword(password);

      expect(result).toBeDefined();
      expect(result).not.toBe(password);
      expect(result).toMatch(/^\$2[aby]\$/);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'StrongPassword123!';

      const firstHash = await service.hashPassword(password);
      const secondHash = await service.hashPassword(password);

      expect(firstHash).not.toBe(secondHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true when the password matches the hash', async () => {
      const password = 'StrongPassword123!';
      const passwordHash = await service.hashPassword(password);

      const result = await service.comparePassword(
        password,
        passwordHash,
      );

      expect(result).toBe(true);
    });

    it('should return false when the password does not match the hash', async () => {
      const passwordHash = await service.hashPassword(
        'StrongPassword123!',
      );

      const result = await service.comparePassword(
        'WrongPassword123!',
        passwordHash,
      );

      expect(result).toBe(false);
    });
  });
});