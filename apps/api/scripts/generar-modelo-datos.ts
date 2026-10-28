import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Prisma } from '@prisma/client';

type Modelo = Prisma.DMMF.Model;
type Campo = Prisma.DMMF.Field;

const RUTA_DOCUMENTO = resolve(__dirname, '../../../docs/modelo-datos.md');
const MARCA_INICIO = '<!-- inicio-generado -->';
const MARCA_FIN = '<!-- fin-generado -->';

const modelos = Prisma.dmmf.datamodel.models as readonly Modelo[];
const enums = Prisma.dmmf.datamodel.enums;

function tablaDe(modelo: Modelo): string {
  return modelo.dbName ?? modelo.name;
}

function columnaDe(campo: Campo): string {
  return campo.dbName ?? campo.name;
}

function esClaveForanea(modelo: Modelo, campo: Campo): boolean {
  return modelo.fields.some((f) => f.relationFromFields?.includes(campo.name));
}

function esUnico(modelo: Modelo, campo: Campo): boolean {
  return campo.isUnique || modelo.uniqueFields.some((u) => u.length === 1 && u[0] === campo.name);
}

function diagramaMermaid(): string {
  const lineas = ['erDiagram'];
  for (const modelo of modelos) {
    for (const campo of modelo.fields) {
      if (campo.kind !== 'object' || !campo.relationFromFields?.length) continue;
      const destino = modelos.find((m) => m.name === campo.type);
      const inverso = destino?.fields.find(
        (f) => f.relationName === campo.relationName && f !== campo,
      );
      const ladoPadre = campo.isRequired ? '||' : '|o';
      const ladoHijo = inverso?.isList ? 'o{' : 'o|';
      lineas.push(
        `  ${campo.type} ${ladoPadre}--${ladoHijo} ${modelo.name} : "${campo.relationFromFields.join(', ')}"`,
      );
    }
  }
  for (const modelo of modelos) {
    lineas.push(`  ${modelo.name} {`);
    for (const campo of modelo.fields.filter((f) => f.kind !== 'object')) {
      const tipo = `${campo.type}${campo.isList ? '_lista' : ''}`;
      const claves = [
        campo.isId ? 'PK' : null,
        esClaveForanea(modelo, campo) ? 'FK' : null,
        esUnico(modelo, campo) ? 'UK' : null,
      ].filter(Boolean);
      lineas.push(`    ${tipo} ${campo.name}${claves.length ? ` ${claves.join(', ')}` : ''}`);
    }
    lineas.push('  }');
  }
  return ['```mermaid', ...lineas, '```'].join('\n');
}

function reglaBorrado(modelo: Modelo, campo: Campo): string {
  const relacion = modelo.fields.find((f) => f.relationFromFields?.includes(campo.name));
  if (!relacion) return '';
  return `${relacion.type} (${relacion.relationOnDelete ?? 'NoAction'})`;
}

function tablaEntidad(modelo: Modelo): string {
  const filas = modelo.fields
    .filter((f) => f.kind !== 'object')
    .map((campo) => {
      const tipo = `${campo.type}${campo.isList ? '[]' : ''}`;
      const restricciones = [
        campo.isId ? 'PK' : '',
        esUnico(modelo, campo) ? 'único' : '',
        campo.hasDefaultValue ? 'con valor por defecto' : '',
      ]
        .filter(Boolean)
        .join(', ');
      return `| \`${columnaDe(campo)}\` | ${tipo} | ${campo.isRequired ? 'sí' : 'no'} | ${reglaBorrado(modelo, campo)} | ${restricciones} |`;
    });
  const unicos = modelo.uniqueFields
    .filter((u) => u.length > 1)
    .map((u) => `\`(${u.join(', ')})\``);
  return [
    `### ${modelo.name} · \`${tablaDe(modelo)}\``,
    '',
    '| Columna | Tipo | Obligatorio | Referencia (al borrar) | Restricciones |',
    '| --- | --- | --- | --- | --- |',
    ...filas,
    ...(unicos.length ? ['', `Únicos compuestos: ${unicos.join(', ')}.`] : []),
  ].join('\n');
}

function seccionEnums(): string {
  return [
    '| Enum | Valores |',
    '| --- | --- |',
    ...enums.map((e) => `| \`${e.name}\` | ${e.values.map((v) => `\`${v.name}\``).join(', ')} |`),
  ].join('\n');
}

const generado = [
  MARCA_INICIO,
  '',
  `## Diagrama entidad-relación (${modelos.length} entidades)`,
  '',
  diagramaMermaid(),
  '',
  '## Entidades',
  '',
  modelos.map(tablaEntidad).join('\n\n'),
  '',
  '## Enumeraciones',
  '',
  seccionEnums(),
  '',
  MARCA_FIN,
].join('\n');

const actual = readFileSync(RUTA_DOCUMENTO, 'utf-8');
const inicio = actual.indexOf(MARCA_INICIO);
const fin = actual.indexOf(MARCA_FIN);
if (inicio === -1 || fin === -1) {
  throw new Error(
    `No se encontraron las marcas ${MARCA_INICIO} / ${MARCA_FIN} en ${RUTA_DOCUMENTO}`,
  );
}
writeFileSync(
  RUTA_DOCUMENTO,
  actual.slice(0, inicio) + generado + actual.slice(fin + MARCA_FIN.length),
  'utf-8',
);
console.log(`Modelo de datos actualizado en ${RUTA_DOCUMENTO}`);
