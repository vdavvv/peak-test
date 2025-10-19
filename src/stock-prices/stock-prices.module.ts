import { Module } from '@nestjs/common';
import { StockPricesController } from './stock-prices.controller';
import { StockPricesService } from './stock-prices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FinnhubModule } from '../finnhub/finnhub.module';

@Module({
  imports: [PrismaModule, FinnhubModule],
  controllers: [StockPricesController],
  providers: [StockPricesService],
})
export class StockPricesModule {}
