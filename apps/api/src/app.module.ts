import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { SaludModule } from './salud/salud.module';

@Module({
  imports: [SaludModule],
  controllers: [AppController],
})
export class AppModule {}
