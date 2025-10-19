# Test project for peak application

Run the following instructions to start the project
  
## Start in docker: 
1. copy .env.example file to .env
2. set `FINNHUB_API_KEY` in .env
3. run `docker compose build`
3. run `docker compose up -d`


## Start without docker: 
1. copy .env.example file to .env
2. set `DATABASE_URL` and `FINNHUB_API_KEY` in .env
3. run `pnpm install`
3. run `pnpm prisma generate`
3. run `pnpm build`
3. run `pnpm prisma migrate deploy`
3. run `pnpm prisma start:prod`


## To run tests:
* run `pnpm test` for unit tests
* run `pnpm test:e2e` for e2e tests