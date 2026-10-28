import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export type EstadoBaseDatos = 'operativa' | 'caida';

@Injectable()
export class SaludService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 2000,
    idleTimeoutMillis: 5000,
    max: 1,
  });

  constructor() {
    this.pool.on('error', () => undefined);
  }

  async estadoBaseDatos(): Promise<EstadoBaseDatos> {
    try {
      await this.pool.query('SELECT 1');
      return 'operativa';
    } catch {
      return 'caida';
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
