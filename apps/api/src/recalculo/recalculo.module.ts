import { Module } from '@nestjs/common';
import { Reloj } from '../comun/reloj/reloj';
import { ArbolTareasService } from '../tareas/arbol-tareas.service';
import { PasoFechas } from './paso-fechas';
import { PasoHitos } from './paso-hitos';
import { RecalculoService } from './recalculo.service';
import { PASOS_RECALCULO } from './recalculo.tipos';

@Module({
  providers: [
    RecalculoService,
    ArbolTareasService,
    PasoFechas,
    PasoHitos,
    Reloj,
    {
      provide: PASOS_RECALCULO,
      useFactory: (fechas: PasoFechas, hitos: PasoHitos) => [fechas, hitos],
      inject: [PasoFechas, PasoHitos],
    },
  ],
  exports: [RecalculoService, ArbolTareasService],
})
export class RecalculoModule {}
