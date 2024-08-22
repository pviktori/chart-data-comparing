import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './entities';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { DataSourcesModule } from 'src/data-sources/data-sources.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity]),
    HttpModule,
    forwardRef(() => DataSourcesModule),
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
