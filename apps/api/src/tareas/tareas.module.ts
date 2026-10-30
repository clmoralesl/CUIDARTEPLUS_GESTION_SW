import { Module } from '@nestjs/common';
import { ArbolTareasService } from './arbol-tareas.service';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';

@Module({
  controllers: [TareasController],
  providers: [TareasService, ArbolTareasService],
  exports: [TareasService, ArbolTareasService],
})
export class TareasModule {}
