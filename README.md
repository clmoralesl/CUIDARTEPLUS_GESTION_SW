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

## Levantar con Docker

Requisito: Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | URL                         | Descripción                                |
| -------- | --------------------------- | ------------------------------------------ |
| web      | http://localhost:5173       | Frontend con recarga en caliente           |
| api      | http://localhost:3000/salud | Estado de la API y de la base de datos     |
| adminer  | http://localhost:8088       | Cliente web de PostgreSQL (servidor `db`)  |
| db       | `localhost:5432`            | PostgreSQL 16 (usuario/clave/BD en `.env`) |

Los datos de PostgreSQL viven en el volumen `cuidarteplus_pgdata` y sobreviven a `docker compose down`. Para borrarlos: `docker compose down -v`.

Al editar archivos en `apps/` o `packages/`, la API y la web se recargan solas (por sondeo de archivos, compatible con Windows).

Si cambian las dependencias (`pnpm-lock.yaml`), reconstruir renovando los volúmenes de `node_modules`:

```bash
docker compose up --build -V
```

## Desarrollo sin Docker

Requisitos: Node.js 22 (ver `.nvmrc`) y pnpm 10 (`npm install -g pnpm@10`).

## Comandos

| Comando          | Qué hace                                         |
| ---------------- | ------------------------------------------------ |
| `pnpm install`   | Instala las dependencias de todo el monorepo     |
| `pnpm build`     | Compila `core`, luego `api` y `web`              |
| `pnpm lint`      | ESLint + verificación de formato con Prettier    |
| `pnpm format`    | Formatea el código con Prettier                  |
| `pnpm test`      | Ejecuta los tests (Vitest) de todos los paquetes |
| `pnpm typecheck` | Verifica tipos sin compilar                      |

Desarrollo por paquete: `pnpm --filter @cuidarte/api dev` (requiere `DATABASE_URL`), `pnpm --filter @cuidarte/web dev`.

## Planificación

El plan del sprint está en [docs/SPRINT_01.md](docs/SPRINT_01.md) y en los issues del milestone "Sprint 01".
