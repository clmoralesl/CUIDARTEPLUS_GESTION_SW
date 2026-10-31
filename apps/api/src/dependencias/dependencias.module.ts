import { Module } from '@nestjs/common';
import { RecalculoModule } from '../recalculo/recalculo.module';
import { DependenciasController } from './dependencias.controller';
import { DependenciasService } from './dependencias.service';

@Module({
  imports: [RecalculoModule],
  controllers: [DependenciasController],
  providers: [DependenciasService],
  exports: [DependenciasService],
})
export class DependenciasModule {}
