import { Test, TestingModule } from '@nestjs/testing';
import { StockPricesController } from './stock-prices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StockPricesService } from './stock-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { FinnhubModule } from '../finnhub/finnhub.module';

describe('StockPricesController', () => {
  let controller: StockPricesController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ScheduleModule.forRoot(), FinnhubModule],
      controllers: [StockPricesController],
      providers: [StockPricesService, PrismaService],
    }).compile();
    controller = module.get<StockPricesController>(StockPricesController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
