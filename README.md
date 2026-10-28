# CuidartePlus Gestión

Sistema de planificación, seguimiento y gestión del cambio: proyectos, tareas jerárquicas, Carta Gantt con dependencias FS/SS/FF/SF, recursos y costos, hitos, KPI configurables, gestión del cambio en 10 etapas y dos tableros de comando.

## Estructura

```
apps/
  api/    API REST (NestJS)
  web/    Frontend (React + Vite)
packages/
  core/   Lógica de dominio pura y compartida (cronograma, costos, KPI, esquemas)
docs/     Plan del sprint y documentación técnica
```

## Requisitos

- Node.js 22 (ver `.nvmrc`)
- pnpm 10 (`npm install -g pnpm@10`)

## Comandos

| Comando          | Qué hace                                         |
| ---------------- | ------------------------------------------------ |
| `pnpm install`   | Instala las dependencias de todo el monorepo     |
| `pnpm build`     | Compila `core`, luego `api` y `web`              |
| `pnpm lint`      | ESLint + verificación de formato con Prettier    |
| `pnpm format`    | Formatea el código con Prettier                  |
| `pnpm test`      | Ejecuta los tests (Vitest) de todos los paquetes |
| `pnpm typecheck` | Verifica tipos sin compilar                      |

Desarrollo por paquete: `pnpm --filter @cuidarte/api dev`, `pnpm --filter @cuidarte/web dev`.

La ejecución con Docker Compose se agrega en el issue #2.

## Planificación

El plan del sprint está en [docs/SPRINT_01.md](docs/SPRINT_01.md) y en los issues del milestone "Sprint 01".
