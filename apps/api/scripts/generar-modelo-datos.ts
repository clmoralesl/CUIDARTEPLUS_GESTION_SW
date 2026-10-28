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

function esRelacionPropia(campo: Campo): boolean {
  return campo.kind === 'object' && (campo.relationFromFields?.length ?? 0) > 0;
}

function relacionMermaid(modelo: Modelo, campo: Campo): string {
  const destino = modelos.find((m) => m.name === campo.type);
  const inverso = destino?.fields.find((f) => f.relationName === campo.relationName && f !== campo);
  const ladoPadre = campo.isRequired ? '||' : '|o';
  const ladoHijo = inverso?.isList ? 'o{' : 'o|';
  const etiqueta = (campo.relationFromFields ?? []).join(', ');
  return `  ${campo.type} ${ladoPadre}--${ladoHijo} ${modelo.name} : "${etiqueta}"`;
}

function clavesMermaid(modelo: Modelo, campo: Campo): string[] {
  const claves: string[] = [];
  if (campo.isId) claves.push('PK');
  if (esClaveForanea(modelo, campo)) claves.push('FK');
  if (esUnico(modelo, campo)) claves.push('UK');
  return claves;
}

function atributoMermaid(modelo: Modelo, campo: Campo): string {
  const tipo = campo.isList ? campo.type + '_lista' : campo.type;
  const claves = clavesMermaid(modelo, campo);
  const sufijo = claves.length > 0 ? ' ' + claves.join(', ') : '';
  return `    ${tipo} ${campo.name}${sufijo}`;
}

function entidadMermaid(modelo: Modelo): string[] {
  const atributos = modelo.fields
    .filter((f) => f.kind !== 'object')
    .map((campo) => atributoMermaid(modelo, campo));
  return [`  ${modelo.name} {`, ...atributos, '  }'];
}

function diagramaMermaid(): string {
  const relaciones = modelos.flatMap((modelo) =>
    modelo.fields.filter(esRelacionPropia).map((campo) => relacionMermaid(modelo, campo)),
  );
  const entidades = modelos.flatMap(entidadMermaid);
  return ['```mermaid', 'erDiagram', ...relaciones, ...entidades, '```'].join('\n');
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

function codigo(texto: string): string {
  return '`' + texto + '`';
}

function seccionEnums(): string {
  const filas = enums.map((e) => {
    const valores = e.values.map((v) => codigo(v.name)).join(', ');
    return `| ${codigo(e.name)} | ${valores} |`;
  });
  return ['| Enum | Valores |', '| --- | --- |', ...filas].join('\n');
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
