import { Module } from '@nestjs/common';
import { ArbolTareasService } from '../tareas/arbol-tareas.service';
import { PasoFechas } from './paso-fechas';
import { RecalculoService } from './recalculo.service';
import { PASOS_RECALCULO } from './recalculo.tipos';

@Module({
  providers: [
    RecalculoService,
    ArbolTareasService,
    PasoFechas,
    {
      provide: PASOS_RECALCULO,
      useFactory: (fechas: PasoFechas) => [fechas],
      inject: [PasoFechas],
    },
  ],
  exports: [RecalculoService, ArbolTareasService],
})
export class RecalculoModule {}
