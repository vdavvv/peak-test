import { Controller, Get, Logger, Param, Put, Query } from '@nestjs/common';
import { StockPricesService } from './stock-prices.service';
import { GetMovingAverageQuery } from './stock-prices.validation';

@Controller('stock-prices')
export class StockPricesController {
  constructor(private readonly stockPricesService: StockPricesService) {}

  private readonly logger = new Logger(StockPricesController.name, {
    timestamp: true,
  });

  @Put(':symbol')
  async monitorStockPrice(@Param('symbol') symbol: string): Promise<void> {
    this.logger.log(`PUT /stock-prices/${symbol}`);
    return await this.stockPricesService.monitorStockPrice(symbol);
  }

  @Get(':symbol')
  async getMovingAverage(
    @Param('symbol') symbol: string,
    @Query() query: GetMovingAverageQuery,
  ) {
    this.logger.log(`GET /stock-prices/${symbol} ${JSON.stringify(query)}`);
    return await this.stockPricesService.getMovingAverage(symbol, query.period);
  }
}
