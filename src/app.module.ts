import { Module } from '@nestjs/common';
import { StockPricesModule } from './stock-prices/stock-prices.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [StockPricesModule, ScheduleModule.forRoot()],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
