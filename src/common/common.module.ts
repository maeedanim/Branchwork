
import { Module } from '@nestjs/common';

import { CryptoService } from './services/crypto.service';
import { TransactionService } from './services/transaction.service';

@Module({
  providers: [
    CryptoService,
    TransactionService,
  ],
  exports: [
    CryptoService,
    TransactionService,
  ],
})
export class CommonModule {}
