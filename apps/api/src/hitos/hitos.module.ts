import { Module } from '@nestjs/common';
import { Reloj } from '../comun/reloj/reloj';
import { HitosController } from './hitos.controller';
import { HitosService } from './hitos.service';

@Module({
  controllers: [HitosController],
  providers: [HitosService, Reloj],
  exports: [HitosService],
})
export class HitosModule {}
