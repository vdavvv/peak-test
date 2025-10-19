import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from '../finnhub/finnhub.service';

export type MovingAverageResult = {
  symbol: string;
  SMA: number[];
};

@Injectable()
export class StockPricesService {
  constructor(
    private prisma: PrismaService,
    private finnhubService: FinnhubService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(StockPricesService.name, {
    timestamp: true,
  });

  async monitorStockPrice(symbol: string): Promise<void> {
    const result = await this.finnhubService.fetchStockPrice(symbol);

    //finnhub api returns 200 even for invalid symbol, so we need to check d field
    if (result.d === null) {
      throw new NotFoundException(`Stock symbol ${symbol} not found`);
    }
    const jobName = `fetch-stock-price-${symbol}`;
    if (!this.schedulerRegistry.doesExist('cron', jobName)) {
      this.logger.log(`Starting to monitor stock price for ${symbol}`);
      this.schedulerRegistry.addCronJob(
        jobName,
        new CronJob(`0 */1 * * * *`, () => {
          void this.getStockPrice(symbol);
        }),
      );
      this.schedulerRegistry.getCronJob(jobName).start();
    }
  }

  private async getStockPrice(symbol: string): Promise<void> {
    const quote = await this.finnhubService.fetchStockPrice(symbol);
    await this.prisma.stockPrice.create({
      data: {
        symbol: symbol,
        price: quote.c,
      },
    });

    this.logger.log(`The current price of ${symbol} is $${quote.c}`);
  }

  async getMovingAverage(
    symbol: string,
    period: number = 3,
  ): Promise<MovingAverageResult> {
    const points = await this.prisma.stockPrice.findMany({
      select: { price: true },
      where: { symbol },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (points.length === 0) {
      throw new NotFoundException(`No stock prices found for symbol ${symbol}`);
    }

    const movingAverages: number[] = this.calculateSimpleMovingAverage(
      points.map((p) => p.price),
      period,
    );

    return { symbol, SMA: movingAverages };
  }

  private calculateSimpleMovingAverage(
    points: number[],
    period: number,
  ): number[] {
    const movingAverages: number[] = [];

    if (period <= 0) {
      throw new Error('Period must be a positive integer');
    }

    for (let i = 0; i < points.length; i++) {
      const window = points.slice(Math.max(i - period + 1, 0), i + 1);
      const sum = window.reduce((acc, point) => acc + point, 0);
      movingAverages.push(sum / window.length);
    }
    return movingAverages;
  }
}
