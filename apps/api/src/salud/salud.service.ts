import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type EstadoBaseDatos = 'operativa' | 'caida';

@Injectable()
export class SaludService {
  constructor(private readonly prisma: PrismaService) {}

  async estadoBaseDatos(): Promise<EstadoBaseDatos> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'operativa';
    } catch {
      return 'caida';
    }
  }
}
