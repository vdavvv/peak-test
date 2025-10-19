import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { StockPricesModule } from '../src/stock-prices/stock-prices.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { FinnhubService } from '../src/finnhub/finnhub.service';

describe('StockPricesController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: PrismaService;
  let finnhubMock: FinnhubService;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ScheduleModule.forRoot(), StockPricesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaMock = moduleFixture.get<PrismaService>(PrismaService);
    finnhubMock = moduleFixture.get<FinnhubService>(FinnhubService);
    schedulerRegistry = moduleFixture.get<SchedulerRegistry>(SchedulerRegistry);
    jest.useFakeTimers();
  });

  afterEach(() => {
    schedulerRegistry.getCronJobs().forEach((_, key) => {
      schedulerRegistry.deleteCronJob(key);
    });
    jest.clearAllMocks();
  });

  it('/:symbol (GET) for symbol with registered job', () => {
    const symbol = 'AAPL';
    jest
      .spyOn(prismaMock.stockPrice, 'findMany')
      .mockResolvedValue([
        { price: 150 },
        { price: 160 },
        { price: 170 },
      ] as any[]);

    return request(app.getHttpServer())
      .get(`/stock-prices/${symbol}?period=3`)
      .expect(200)
      .expect({ symbol, SMA: [150, 155, 160] });
  });

  it('/:symbol (GET) for symbol without registered job', () => {
    const symbol = 'AAPL';
    jest.spyOn(prismaMock.stockPrice, 'findMany').mockResolvedValue([]);

    return request(app.getHttpServer())
      .get(`/stock-prices/${symbol}?period=3`)
      .expect(404);
  });
  it('/:symbol (PUT) for valid symbol', () => {
    const symbol = 'AAPL';
    jest
      .spyOn(finnhubMock, 'fetchStockPrice')
      .mockResolvedValue({ d: 150 } as any);
    jest.spyOn(prismaMock.stockPrice, 'create').mockResolvedValue({} as any);
    jest.spyOn(schedulerRegistry, 'addCronJob').mockReturnValue();
    return request(app.getHttpServer())
      .put(`/stock-prices/${symbol}`)
      .expect(200)
      .expect({});
  });

  it('/:symbol (PUT) for invalid symbol', () => {
    const symbol = 'AAPL';
    jest
      .spyOn(finnhubMock, 'fetchStockPrice')
      .mockResolvedValue({ d: null } as any);
    jest.spyOn(prismaMock.stockPrice, 'create').mockResolvedValue({} as any);
    return request(app.getHttpServer())
      .put(`/stock-prices/${symbol}`)
      .expect(404);
  });
});
