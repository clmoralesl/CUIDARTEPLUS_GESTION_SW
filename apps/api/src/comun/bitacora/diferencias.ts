import { Prisma } from '@prisma/client';

export type ValorBitacora = string | number | boolean | null | Record<string, unknown>;

export interface CambioCampo {
  campo: string;
  anterior: ValorBitacora;
  nuevo: ValorBitacora;
}

export function normalizarValor(valor: unknown): ValorBitacora {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (Prisma.Decimal.isDecimal(valor)) return Number(valor);
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return valor;
  }
  if (typeof valor === 'object') {
    return valor as Record<string, unknown>;
  }
  return String(valor);
}

export function diferencias<T extends object>(
  antes: T,
  despues: T,
  campos: readonly (keyof T & string)[],
): CambioCampo[] {
  return campos
    .map((campo) => ({
      campo,
      anterior: normalizarValor(antes[campo]),
      nuevo: normalizarValor(despues[campo]),
    }))
    .filter((cambio) => cambio.anterior !== cambio.nuevo);
}
