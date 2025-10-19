import { Injectable } from '@nestjs/common';
import axios from 'axios';

const finnhubApi = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  params: {
    token: process.env.FINNHUB_API_KEY,
  },
});

export type Quote = {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  d: number; // Change
  dp: number; // Percent change
  t: number; // Timestamp
};

@Injectable()
export class FinnhubService {
  async fetchStockPrice(symbol: string): Promise<Quote> {
    const { data: quote } = await finnhubApi.get<Quote>('/quote', {
      params: { symbol },
    });
    return quote;
  }
}
