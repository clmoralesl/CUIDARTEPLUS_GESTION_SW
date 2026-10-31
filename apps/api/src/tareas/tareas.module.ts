import { Module } from '@nestjs/common';
import { Reloj } from '../comun/reloj/reloj';
import { RecalculoModule } from '../recalculo/recalculo.module';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

@Module({
  imports: [RecalculoModule],
  controllers: [TareasController],
  providers: [TareasService, Reloj],
  exports: [TareasService],
})
export class TareasModule {}
