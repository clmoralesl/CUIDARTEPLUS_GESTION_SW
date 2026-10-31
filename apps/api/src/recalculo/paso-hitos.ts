import { Injectable } from '@nestjs/common';
import { Reloj } from '../comun/reloj/reloj';
import { construirListaHitos } from '../hitos/hitos.mapeo';
import type { ContextoRecalculo, PasoRecalculo } from './recalculo.tipos';

@Injectable()
export class PasoHitos implements PasoRecalculo {
  readonly nombre = 'hitos';

  constructor(private readonly reloj: Reloj) {}

  async ejecutar(contexto: ContextoRecalculo): Promise<void> {
    const hitos = await contexto.tx.hito.findMany({ where: { proyectoId: contexto.proyecto.id } });
    contexto.hitos = construirListaHitos(
      contexto.proyecto.id,
      hitos,
      new Map(contexto.tareas.map((t) => [t.id, t])),
      contexto.calendario,
      this.reloj.hoy(),
    );
  }
}
