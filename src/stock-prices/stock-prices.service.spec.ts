import { Test, TestingModule } from '@nestjs/testing';
import { StockPricesService } from './stock-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { FinnhubModule } from '../finnhub/finnhub.module';
import { FinnhubService } from '../finnhub/finnhub.service';

describe('StockPricesService', () => {
  let stockPricesService: StockPricesService;
  let prismaMock: PrismaService;
  let finnhubMock: FinnhubService;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ScheduleModule.forRoot(), FinnhubModule],
      providers: [StockPricesService],
    }).compile();

    stockPricesService = module.get<StockPricesService>(StockPricesService);
    prismaMock = module.get<PrismaService>(PrismaService);
    finnhubMock = module.get<FinnhubService>(FinnhubService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  const symbol = 'AAPL';

  afterEach(() => {
    schedulerRegistry.getCronJobs().forEach((_, key) => {
      schedulerRegistry.deleteCronJob(key);
    });
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(stockPricesService).toBeDefined();
  });

  describe('getMovingAverage', () => {
    it('should return not found when there is no data', async () => {
      const period = 3;
      const mockPrices = [];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);

      await expect(
        stockPricesService.getMovingAverage(symbol, period),
      ).rejects.toThrow(`No stock prices found for symbol ${symbol}`);
    });
    it('should return the correct moving average for array with one element', async () => {
      const period = 3;
      const mockPrices = [{ price: 150 }];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);

      const result = await stockPricesService.getMovingAverage(symbol, period);
      expect(result.SMA).toEqual([150]);
    });
    it('should return the correct moving average for perion of', async () => {
      const period = 1;
      const mockPrices = [{ price: 150 }, { price: 160 }, { price: 170 }];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);
      const result = await stockPricesService.getMovingAverage(symbol, period);
      expect(result.SMA).toEqual([150, 160, 170]);
    });
    it('should return the correct moving average for period greater than array length', async () => {
      const period = 5;
      const mockPrices = [{ price: 150 }, { price: 160 }, { price: 170 }];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);

      const result = await stockPricesService.getMovingAverage(symbol, period);
      expect(result.SMA).toEqual([150, 155, 160]);
    });
    it('should return the correct moving average for normal case', async () => {
      const period = 3;
      const mockPrices = [
        { price: 150 },
        { price: 160 },
        { price: 170 },
        { price: 180 },
        { price: 190 },
      ];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);

      const result = await stockPricesService.getMovingAverage(symbol, period);
      expect(result.SMA).toEqual([150, 155, 160, 170, 180]);
    });
    it('should throw error for negative period', async () => {
      const period = -3;
      const mockPrices = [{ price: 150 }, { price: 160 }, { price: 170 }];

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockResolvedValue(mockPrices as any[]);

      await expect(
        stockPricesService.getMovingAverage(symbol, period),
      ).rejects.toThrow();
    });
    it('should throw error when prisma fails', async () => {
      const period = 3;

      jest
        .spyOn(prismaMock.stockPrice, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        stockPricesService.getMovingAverage(symbol, period),
      ).rejects.toThrow('Database error');
    });
  });

  describe('monitorStockPrice', () => {
    it('should start monitoring stock price for valid symbol', async () => {
      jest
        .spyOn(finnhubMock, 'fetchStockPrice')
        .mockResolvedValue({ d: 1 } as any);

      jest.spyOn(prismaMock.stockPrice, 'create').mockResolvedValue({} as any);

      const result = await stockPricesService.monitorStockPrice(symbol);
      const jobName = `fetch-stock-price-${symbol}`;
      expect(schedulerRegistry.doesExist('cron', jobName)).toBeTruthy();
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException for invalid symbol', async () => {
      jest
        .spyOn(finnhubMock, 'fetchStockPrice')
        .mockResolvedValue({ d: null } as any);
      jest.spyOn(prismaMock.stockPrice, 'create').mockResolvedValue({} as any);
      await expect(
        stockPricesService.monitorStockPrice('INVALID'),
      ).rejects.toThrow('Stock symbol INVALID not found');
    });
  });
});
