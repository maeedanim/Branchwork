
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { BranchesService } from '../branches/branches.service';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

function createQueryFailedError(code: string): QueryFailedError {
  const driverError = Object.assign(
    new Error('Database query failed.'),
    { code },
  );

  return new QueryFailedError(
    'TEST QUERY',
    [],
    driverError,
  );
}

describe('ProductsService', () => {
  let service: ProductsService;

  let productsRepository: jest.Mocked<
    Pick<
      ProductsRepository,
      'create' | 'findAll' | 'findById' | 'update' | 'delete'
    >
  >;

  let branchesService: jest.Mocked<
    Pick<BranchesService, 'findById'>
  >;

  const organizationId = 'organization-123';
  const branchId = 'branch-123';
  const anotherBranchId = 'branch-456';
  const productId = 'product-123';

  const owner = {
    id: 'owner-123',
    organizationId,
    userType: 'OWNER',
    branchId: null,
    roleId: null,
  };

  const staff = {
    id: 'staff-123',
    organizationId,
    userType: 'STAFF',
    branchId,
    roleId: 'role-123',
  };

  const product = {
    id: productId,
    organizationId,
    branchId,
    name: 'Laptop',
    category: 'Electronics',
    stock: 10,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const pagination = {
    page: 1,
    limit: 10,
  };

  beforeEach(() => {
    productsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    branchesService = {
      findById: jest.fn(),
    };

    service = new ProductsService(
      productsRepository as unknown as ProductsRepository,
      branchesService as unknown as BranchesService,
    );
  });

  describe('create', () => {
    const dto = {
      name: 'Laptop',
      branchId,
      category: 'Electronics',
      stock: 10,
    };

    it('should create a product successfully', async () => {
      productsRepository.create.mockResolvedValue(
        product as any,
      );

      const result = await service.create(
        organizationId,
        dto as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );

      expect(productsRepository.create).toHaveBeenCalledWith(
        organizationId,
        branchId,
        dto.name,
        dto.category,
        dto.stock,
      );

      expect(result).toEqual(product);
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.create('', dto as any),
      ).rejects.toThrow(
        new BadRequestException(
          'Organization ID is required.',
        ),
      );

      expect(productsRepository.create).not.toHaveBeenCalled();
    });

    it('should reject an empty branch ID', async () => {
      await expect(
        service.create(organizationId, {
          ...dto,
          branchId: '',
        } as any),
      ).rejects.toThrow(
        new BadRequestException('Branch ID is required.'),
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
      expect(productsRepository.create).not.toHaveBeenCalled();
    });

    it('should not create a product when the branch does not belong to the organization', async () => {
      branchesService.findById.mockRejectedValue(
        new NotFoundException('Branch not found.'),
      );

      await expect(
        service.create(organizationId, dto as any),
      ).rejects.toThrow(NotFoundException);

      expect(productsRepository.create).not.toHaveBeenCalled();
    });

    it('should map a foreign key database error to ConflictException', async () => {
      productsRepository.create.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.create(organizationId, dto as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should map a unique constraint database error to ConflictException', async () => {
      productsRepository.create.mockRejectedValue(
        createQueryFailedError('23505'),
      );

      await expect(
        service.create(organizationId, dto as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should map an invalid identifier database error to BadRequestException', async () => {
      productsRepository.create.mockRejectedValue(
        createQueryFailedError('22P02'),
      );

      await expect(
        service.create(organizationId, dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should map an out-of-range numeric database error to BadRequestException', async () => {
      productsRepository.create.mockRejectedValue(
        createQueryFailedError('22003'),
      );

      await expect(
        service.create(organizationId, dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return products with pagination metadata for an owner', async () => {
      productsRepository.findAll.mockResolvedValue([
        [product as any],
        25,
      ]);

      const result = await service.findAll(
        owner as any,
        pagination as any,
      );

      expect(productsRepository.findAll).toHaveBeenCalledWith(
        organizationId,
        pagination,
        undefined,
      );

      expect(result).toEqual({
        items: [product],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should allow an owner to filter products by branch', async () => {
      productsRepository.findAll.mockResolvedValue([
        [product as any],
        1,
      ]);

      await service.findAll(
        owner as any,
        pagination as any,
        branchId,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        branchId,
      );

      expect(productsRepository.findAll).toHaveBeenCalledWith(
        organizationId,
        pagination,
        branchId,
      );
    });

    it('should force staff to access only their assigned branch', async () => {
      productsRepository.findAll.mockResolvedValue([
        [product as any],
        1,
      ]);

      await service.findAll(
        staff as any,
        pagination as any,
        anotherBranchId,
      );

      expect(productsRepository.findAll).toHaveBeenCalledWith(
        organizationId,
        pagination,
        branchId,
      );

      expect(branchesService.findById).not.toHaveBeenCalled();
    });

    it('should reject staff without an assigned branch', async () => {
      await expect(
        service.findAll(
          {
            ...staff,
            branchId: null,
          } as any,
          pagination as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Your account is not assigned to a branch.',
        ),
      );

      expect(productsRepository.findAll).not.toHaveBeenCalled();
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.findAll(
          {
            ...owner,
            organizationId: '',
          } as any,
          pagination as any,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(productsRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return an empty product list when no products exist', async () => {
      productsRepository.findAll.mockResolvedValue([
        [],
        0,
      ]);

      const result = await service.findAll(
        owner as any,
        pagination as any,
      );

      expect(result).toEqual({
        items: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return a product for an owner', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      const result = await service.findById(
        owner as any,
        productId,
      );

      expect(productsRepository.findById).toHaveBeenCalledWith(
        organizationId,
        productId,
        undefined,
      );

      expect(result).toEqual(product);
    });

    it('should restrict staff product lookup to their assigned branch', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      await service.findById(
        staff as any,
        productId,
      );

      expect(productsRepository.findById).toHaveBeenCalledWith(
        organizationId,
        productId,
        branchId,
      );
    });

    it('should reject staff without an assigned branch', async () => {
      await expect(
        service.findById(
          {
            ...staff,
            branchId: null,
          } as any,
          productId,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(productsRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject an empty product ID', async () => {
      await expect(
        service.findById(owner as any, ''),
      ).rejects.toThrow(
        new BadRequestException('Product ID is required.'),
      );

      expect(productsRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the product does not exist', async () => {
      productsRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById(owner as any, productId),
      ).rejects.toThrow(
        new NotFoundException('Product not found.'),
      );
    });
  });

  describe('organize', () => {
    it('should update product category', async () => {
      const updatedProduct = {
        ...product,
        category: 'Computers',
      };

      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.update.mockResolvedValue(
        updatedProduct as any,
      );

      const result = await service.organize(
        owner as any,
        productId,
        {
          category: 'Computers',
        } as any,
      );

      expect(productsRepository.update).toHaveBeenCalledWith(
        product,
        {
          category: 'Computers',
        },
      );

      expect(result).toEqual(updatedProduct);
    });

    it('should update product stock', async () => {
      const updatedProduct = {
        ...product,
        stock: 20,
      };

      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.update.mockResolvedValue(
        updatedProduct as any,
      );

      const result = await service.organize(
        owner as any,
        productId,
        {
          stock: 20,
        } as any,
      );

      expect(productsRepository.update).toHaveBeenCalledWith(
        product,
        {
          stock: 20,
        },
      );

      expect(result.stock).toBe(20);
    });

    it('should move a product to another branch after validating the destination branch', async () => {
      const updatedProduct = {
        ...product,
        branchId: anotherBranchId,
      };

      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.update.mockResolvedValue(
        updatedProduct as any,
      );

      await service.organize(
        owner as any,
        productId,
        {
          branchId: anotherBranchId,
        } as any,
      );

      expect(branchesService.findById).toHaveBeenCalledWith(
        organizationId,
        anotherBranchId,
      );

      expect(productsRepository.update).toHaveBeenCalledWith(
        product,
        {
          branchId: anotherBranchId,
        },
      );
    });

    it('should reject an empty update DTO', async () => {
      await expect(
        service.organize(
          owner as any,
          productId,
          {} as any,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'At least one field must be provided.',
        ),
      );

      expect(productsRepository.findById).not.toHaveBeenCalled();
      expect(productsRepository.update).not.toHaveBeenCalled();
    });

    it('should not update a product when the destination branch is invalid', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      branchesService.findById.mockRejectedValue(
        new NotFoundException('Branch not found.'),
      );

      await expect(
        service.organize(
          owner as any,
          productId,
          {
            branchId: anotherBranchId,
          } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(productsRepository.update).not.toHaveBeenCalled();
    });

    it('should reject staff attempting to organize a product outside their branch', async () => {
      productsRepository.findById.mockResolvedValue(null);

      await expect(
        service.organize(
          staff as any,
          productId,
          {
            stock: 20,
          } as any,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(productsRepository.update).not.toHaveBeenCalled();
    });

    it('should map database constraint errors during update', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.update.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.organize(
          owner as any,
          productId,
          {
            stock: 20,
          } as any,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete an existing product', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.delete.mockResolvedValue(undefined);

      await expect(
        service.delete(organizationId, productId),
      ).resolves.toBeUndefined();

      expect(productsRepository.findById).toHaveBeenCalledWith(
        organizationId,
        productId,
      );

      expect(productsRepository.delete).toHaveBeenCalledWith(
        organizationId,
        productId,
      );
    });

    it('should reject an empty organization ID', async () => {
      await expect(
        service.delete('', productId),
      ).rejects.toThrow(BadRequestException);

      expect(productsRepository.findById).not.toHaveBeenCalled();
      expect(productsRepository.delete).not.toHaveBeenCalled();
    });

    it('should reject an empty product ID', async () => {
      await expect(
        service.delete(organizationId, ''),
      ).rejects.toThrow(BadRequestException);

      expect(productsRepository.findById).not.toHaveBeenCalled();
      expect(productsRepository.delete).not.toHaveBeenCalled();
    });

    it('should not delete a product that does not exist', async () => {
      productsRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete(organizationId, productId),
      ).rejects.toThrow(
        new NotFoundException('Product not found.'),
      );

      expect(productsRepository.delete).not.toHaveBeenCalled();
    });

    it('should map database constraint errors during deletion', async () => {
      productsRepository.findById.mockResolvedValue(
        product as any,
      );

      productsRepository.delete.mockRejectedValue(
        createQueryFailedError('23503'),
      );

      await expect(
        service.delete(organizationId, productId),
      ).rejects.toThrow(ConflictException);
    });
  });
});
