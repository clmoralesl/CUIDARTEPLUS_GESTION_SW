# Convenciones de API: CuidartePlus Gestión

Estándares y contratos de comunicación entre el frontend (`apps/web`), el backend (`apps/api`) y los servicios externos del sistema.

---

## 1. Alcance y seguridad local

`X-Rol` identifica el rol elegido en el selector; no es un mecanismo de autenticación, porque el sistema solo corre en un equipo local sin conexión.

Al operar exclusivamente en un entorno local aislado con Docker, no existe un modelo de amenazas de atacante remoto. Por ello, la verificación del rol actúa como mecanismo de consistencia y trazabilidad de operaciones conforme a la rúbrica del proyecto.

---

## 2. Nomenclatura de endpoints y parámetros

1. **Rutas en español, plural y kebab-case**:
   - `/salud`
   - `/informacion`
   - `/proyectos`
   - `/proyectos/:proyectoId/tareas`
   - `/solicitudes-cambio/:id/aprobar`
2. **Métodos HTTP estándar**:
   - `GET`: lectura y consulta.
   - `POST`: creación de registros y ejecución de acciones de negocio.
   - `PUT` / `PATCH`: actualización completa o parcial.
   - `DELETE`: eliminación de recursos.
3. **Parámetros y claves JSON en español**:
   - Identificadores: `proyectoId`, `tareaId`, `cambioId`.
   - Propiedades de cuerpo: `nombre`, `descripcion`, `fechaInicio`, `presupuesto`.

---

## 3. Cabecera `X-Rol` y control de acceso

Toda ruta de la API, a excepción de las explícitamente declaradas públicas (`@Publico()`), exige el envío de la cabecera HTTP:

```http
X-Rol: JP | CC
```

### Roles reconocidos

- `JP`: Jefe de Proyecto
- `CC`: Comité de Cambios

### Matriz de permisos

| Permiso                      | JP  | CC  | Descripción                                                    |
| ---------------------------- | --- | --- | -------------------------------------------------------------- |
| `editarPlanificacion`        | Sí  | No  | Creación y modificación de proyectos, tareas, duraciones y CPM |
| `importarDatos`              | Sí  | No  | Carga inicial masiva de datos mediante Excel                   |
| `gestionarSolicitudesCambio` | Sí  | No  | Creación y envío de solicitudes de cambio                      |
| `adjuntarEvidencias`         | Sí  | Sí  | Incorporación de respaldo documental y archivos de evidencia   |
| `avanzarEtapasCambio`        | No  | Sí  | Transición de estados en el flujo de gestión del cambio        |
| `decidirSolicitudesCambio`   | No  | Sí  | Aprobación o rechazo definitivo de solicitudes                 |

### Respuestas ante fallos de rol

- Sin cabecera `X-Rol`: HTTP `400 Bad Request` con código `ROL_REQUERIDO`.
- Con valor inválido (`x-rol: ADMIN`, vacío o con minúsculas): HTTP `400 Bad Request` con código `ROL_INVALIDO`.
- Con rol sin autorización para la ruta: HTTP `403 Forbidden` con código `ROL_NO_PERMITIDO`.

---

## 4. Formato estándar de errores

Todas las respuestas con código HTTP 4xx o 5xx (excepto la sonda `/salud`) devuelven una estructura uniforme en español:

```json
{
  "codigo": "CODIGO_TEXTUAL",
  "error": "Título legible del estado",
  "mensaje": "Mensaje en español comprensible para el usuario",
  "detalles": null
}
```

### Catálogo de códigos de error

| Estado | `codigo`                     | `error`                    | Origen o causa                                 |
| ------ | ---------------------------- | -------------------------- | ---------------------------------------------- |
| 400    | `ROL_REQUERIDO`              | Solicitud inválida         | Petición sin cabecera `X-Rol`                  |
| 400    | `ROL_INVALIDO`               | Solicitud inválida         | Cabecera `X-Rol` con valor no permitido        |
| 400    | `VALIDACION_FALLIDA`         | Solicitud inválida         | Falla de validación en esquema Zod             |
| 400    | `RESTRICCION_VIOLADA`        | Solicitud inválida         | Violación de restricción `CHECK` (PostgreSQL)  |
| 400    | `SOLICITUD_INVALIDA`         | Solicitud inválida         | JSON malformado o error de formato en petición |
| 403    | `ROL_NO_PERMITIDO`           | Acceso denegado            | Rol no autorizado según `@Roles(...)`          |
| 403    | `ACCESO_DENEGADO`            | Acceso denegado            | Acción no permitida                            |
| 404    | `RECURSO_NO_ENCONTRADO`      | No encontrado              | Ruta no mapeada o endpoint inexistente         |
| 404    | `REGISTRO_NO_ENCONTRADO`     | No encontrado              | Registro no encontrado en base de datos        |
| 409    | `REGISTRO_DUPLICADO`         | Conflicto                  | Conflicto de unicidad (`P2002` en Prisma)      |
| 409    | `REGISTRO_RELACIONADO`       | Conflicto                  | Conflicto de clave foránea (`P2003`)           |
| 409    | `CONFLICTO`                  | Conflicto                  | Operación inconsistente con estado actual      |
| 413    | `CONTENIDO_DEMASIADO_GRANDE` | Contenido demasiado grande | Carga útil mayor al límite del analizador      |
| 500    | `ERROR_INTERNO`              | Error interno              | Excepción interna no controlada                |
| 503    | `BD_NO_DISPONIBLE`           | Servicio no disponible     | Conexión con PostgreSQL no establecida         |
| 0      | `SIN_CONEXION`               | Sin conexión               | Cliente web sin conectividad con API           |
| (otro) | `RESPUESTA_INESPERADA`       | Error                      | Respuesta no interpretable en cliente          |

### Comportamiento en rutas no encontradas

Si se solicita una ruta inexistente (por ejemplo `GET /no-existe`), el servidor responde directamente `404 Not Found` con código `RECURSO_NO_ENCONTRADO`, incluso si no se envió la cabecera `X-Rol`.

---

## 5. Sonda de salud (`/salud`)

El endpoint `GET /salud` es público y responde con un contrato especializado de diagnóstico para monitorear el estado de la infraestructura:

- **Operativa:** HTTP `200 OK`
  ```json
  { "estado": "ok", "bd": "operativa" }
  ```
- **Falla en base de datos:** HTTP `503 Service Unavailable`
  ```json
  { "estado": "error", "bd": "caida" }
  ```
