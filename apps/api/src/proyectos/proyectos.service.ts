import { Injectable } from '@nestjs/common';
import { EstadoProyecto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ResumenProyecto {
  id: number;
  nombre: string;
  estado: EstadoProyecto;
}

@Injectable()
export class ProyectosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<ResumenProyecto[]> {
    return this.prisma.proyecto.findMany({
      select: {
        id: true,
        nombre: true,
        estado: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }
}
