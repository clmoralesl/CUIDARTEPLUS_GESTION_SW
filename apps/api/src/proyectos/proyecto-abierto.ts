import { HttpStatus } from '@nestjs/common';
import { EstadoProyecto, Prisma, Proyecto } from '@prisma/client';
import { ExcepcionApi } from '../comun/errores/excepcion-api';

export const errorProyectoNoEncontrado = () =>
  new ExcepcionApi(HttpStatus.NOT_FOUND, 'REGISTRO_NO_ENCONTRADO', 'El proyecto no existe.');

export const errorProyectoCerrado = () =>
  new ExcepcionApi(
    HttpStatus.CONFLICT,
    'PROYECTO_CERRADO',
    'El proyecto está cerrado y no admite modificaciones.',
  );

export async function obtenerProyectoAbierto(
  tx: Prisma.TransactionClient,
  proyectoId: number,
): Promise<Proyecto> {
  const proyecto = await tx.proyecto.findUnique({ where: { id: proyectoId } });
  if (!proyecto) throw errorProyectoNoEncontrado();
  if (proyecto.estado === EstadoProyecto.CERRADO) throw errorProyectoCerrado();
  return proyecto;
}
