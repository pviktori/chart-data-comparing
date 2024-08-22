import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule.forApp());
  app.enableCors();
  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.httpPort);
  console.log(`Listening on port ${configService.httpPort}`);
}
bootstrap();
