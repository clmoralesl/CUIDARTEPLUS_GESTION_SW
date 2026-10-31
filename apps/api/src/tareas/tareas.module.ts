import { Module } from '@nestjs/common';
import { RecalculoModule } from '../recalculo/recalculo.module';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

@Module({
  imports: [RecalculoModule],
  controllers: [TareasController],
  providers: [TareasService],
  exports: [TareasService],
})
export class TareasModule {}
