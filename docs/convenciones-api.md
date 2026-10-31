# Convenciones de API: AutoFix Gestión

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
   - `/proyectos/:proyectoId`
   - `/proyectos/:proyectoId/iniciar`
   - `/proyectos/:proyectoId/cerrar`
   - `/proyectos/:proyectoId/tareas`
   - `/solicitudes-cambio/:id/aprobar`
2. **Métodos HTTP estándar**:
   - `GET`: lectura y consulta.
   - `POST`: creación de registros y ejecución de acciones de negocio.
   - `PUT` / `PATCH`: actualización completa o parcial.
   - `DELETE`: eliminación de recursos (no aplica para proyectos, cuya historia se preserva cerrándolos).
3. **Parámetros y claves JSON en español**:
   - Identificadores: `proyectoId`, `tareaId`, `cambioId`.
   - Propiedades de cuerpo: `nombre`, `descripcion`, `fechaInicio`, `fechaFin`, `presupuesto`, `responsable`.

---

## 3. Endpoints del módulo de proyectos

| Método  | Ruta                             | Rol     | Código | Descripción                                   | Errores específicos                         |
| ------- | -------------------------------- | ------- | ------ | --------------------------------------------- | ------------------------------------------- |
| `GET`   | `/proyectos`                     | JP y CC | `200`  | Listado resumen de proyectos                  | —                                           |
| `GET`   | `/proyectos/:proyectoId`         | JP y CC | `200`  | Detalle completo de un proyecto               | `400` id inválido, `404`                    |
| `POST`  | `/proyectos`                     | JP      | `201`  | Creación de proyecto y calendario por defecto | `400`, `403`                                |
| `PATCH` | `/proyectos/:proyectoId`         | JP      | `200`  | Actualización de campos editables             | `400`, `403`, `404`, `409 PROYECTO_CERRADO` |
| `POST`  | `/proyectos/:proyectoId/iniciar` | JP      | `200`  | Transición a EN_CURSO                         | `403`, `404`, `409 TRANSICION_INVALIDA`     |
| `POST`  | `/proyectos/:proyectoId/cerrar`  | JP      | `200`  | Transición a CERRADO                          | `403`, `404`, `409 TRANSICION_INVALIDA`     |

---

## 4. Endpoints del módulo de tareas (árbol de trabajo)

| Método   | Ruta                            | Rol     | Código | Descripción                                      | Errores específicos                                                   |
| -------- | ------------------------------- | ------- | ------ | ------------------------------------------------ | --------------------------------------------------------------------- |
| `GET`    | `/proyectos/:proyectoId/tareas` | JP y CC | `200`  | Árbol completo de tareas (`ArbolTareas`)         | `400` id inválido, `404` proyecto no encontrado                       |
| `POST`   | `/proyectos/:proyectoId/tareas` | JP      | `201`  | Creación de tarea (`ResultadoRecalculo`)         | `400`, `403`, `404`, `409 PROYECTO_CERRADO`, `422 JERARQUIA_INVALIDA` |
| `PATCH`  | `/tareas/:tareaId`              | JP      | `200`  | Edición parcial de campos (`ResultadoRecalculo`) | `400`, `403`, `404`, `409 PROYECTO_CERRADO`, `422 CAMPO_CALCULADO`    |
| `POST`   | `/tareas/:tareaId/mover`        | JP      | `200`  | Reubicación o reorden (`ResultadoRecalculo`)     | `400`, `403`, `404`, `409 PROYECTO_CERRADO`, `422 JERARQUIA_INVALIDA` |
| `DELETE` | `/tareas/:tareaId`              | JP      | `200`  | Eliminación en cascada (`ResultadoRecalculo`)    | `400`, `403`, `404`, `409 PROYECTO_CERRADO`                           |

Todas las mutaciones devuelven un sobre (_envelope_) `ResultadoRecalculo`:

```json
{
  "arbol": { "proyectoId": 1, "porcentajeAvanceProyecto": 35.72, "tareas": [...] },
  "tareasAfectadas": [
    {
      "id": 10,
      "codigo": "2.1.2",
      "inicioAnterior": "2026-11-24",
      "inicioNuevo": "2026-11-26",
      "finAnterior": "2026-12-03",
      "finNuevo": "2026-12-07"
    }
  ]
}
```

---

## 5. Endpoints del módulo de dependencias

| Método   | Ruta                                  | Rol     | Código | Descripción                                       | Errores específicos                                                                                                      |
| -------- | ------------------------------------- | ------- | ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/proyectos/:proyectoId/dependencias` | JP y CC | `200`  | Lista de dependencias del proyecto                | `400` id inválido, `404` proyecto no encontrado                                                                          |
| `POST`   | `/proyectos/:proyectoId/dependencias` | JP      | `201`  | Creación de dependencia y recálculo automático    | `400`, `403`, `404`, `409 REGISTRO_DUPLICADO`, `409 PROYECTO_CERRADO`, `422 DEPENDENCIA_INVALIDA`, `422 CICLO_DETECTADO` |
| `DELETE` | `/dependencias/:dependenciaId`        | JP      | `200`  | Eliminación de dependencia y recálculo automático | `400`, `403`, `404 REGISTRO_NO_ENCONTRADO`, `409 PROYECTO_CERRADO`                                                       |

### Contrato de Dependencia

```ts
interface DependenciaTarea {
  id: number;
  predecesoraId: number;
  sucesoraId: number;
  tipo: 'FS' | 'SS' | 'FF' | 'SF';
  desfaseDias: number; // Rango: -365 a 365 días hábiles
}
```

---

## 6. Endpoints del módulo de calendario laboral

| Método   | Ruta                                                | Rol     | Código | Descripción                                                          |
| -------- | --------------------------------------------------- | ------- | ------ | -------------------------------------------------------------------- |
| `GET`    | `/proyectos/:proyectoId/calendario`                 | JP y CC | `200`  | Configuración de días laborables y feriados                          |
| `PUT`    | `/proyectos/:proyectoId/calendario/dias-laborables` | JP      | `200`  | Actualización de días laborables y recálculo (`RespuestaCalendario`) |
| `POST`   | `/proyectos/:proyectoId/calendario/feriados`        | JP      | `201`  | Inclusión de feriado y recálculo (`RespuestaCalendario`)             |
| `DELETE` | `/feriados/:feriadoId`                              | JP      | `200`  | Eliminación de feriado y recálculo (`RespuestaCalendario`)           |

`RespuestaCalendario` devuelve `{ calendario, tareasAfectadas }`, unificando el reporte de reprogramaciones con el resto de la API.

### Reglas de jerarquía, consolidación y concurrencia

1. **Jerarquía estricta**: Los tres niveles (`ETAPA`, `ACTIVIDAD`, `SUBACTIVIDAD`) deben respetar su relación padre permitida: `ETAPA` solo con padre `null`, `ACTIVIDAD` solo bajo `ETAPA`, y `SUBACTIVIDAD` solo bajo `ACTIVIDAD`. Cualquier otra combinación responde `422 JERARQUIA_INVALIDA`.
2. **Renumeración en dos fases**: Al alterar la estructura (crear, mover o eliminar), los códigos (`1`, `1.1`, `1.1.1`) se renumeran en dos fases dentro de la misma transacción (asignando primero un código temporal `~id` a las filas que cambian de código), evitando colisiones con el índice único `unique(proyectoId, codigo)`.
3. **Consolidación persistida**: En las tareas contenedoras (con hijas), `inicioPlan`, `finPlan`, `duracionDias`, `inicioReal`, `finReal` y `porcentajeAvance` se calculan y persisten automáticamente. Cualquier intento de editar estos campos directamente en una tarea con hijas responde `422 CAMPO_CALCULADO`.
4. **Bloqueo pesimista por proyecto**: Toda mutación sobre el árbol ejecuta `SELECT id FROM proyectos WHERE id = :id FOR UPDATE` al inicio de la transacción, serializando escrituras concurrentes y evitando carreras frente al cierre del proyecto.

---

## 5. Reglas de validación y ciclo de vida

1. **Orden de comprobación**: Las validaciones de esquema sintáctico y tipado (código HTTP `400`) se evalúan antes de las reglas de negocio o estado en base de datos (`409`). Si un cuerpo incluye campos desconocidos o no permitidos (como intentar enviar `estado` vía `PATCH`), el servidor responde `400 VALIDACION_FALLIDA` inmediatamente.
2. **Esquemas estrictos**: Se aplica `.strict()` en Zod para prevenir la asignación masiva (_mass assignment_). Los estados solo pueden alterarse mediante sus respectivas rutas de acción (`/iniciar` y `/cerrar`).
3. **Regla de proyecto cerrado**: Un proyecto con estado `CERRADO` es inmutable. Toda escritura sobre el proyecto o sus elementos dependientes (tareas, dependencias, recursos e hitos) debe verificar `obtenerProyectoAbierto(tx, proyectoId)` dentro de la transacción, respondiendo `409 PROYECTO_CERRADO` ante cualquier intento de edición.

---

## 4. Representación de fechas y montos

### Fechas

- **Interfaz y visualización (D3)**: El usuario visualiza, introduce y exporta fechas exclusivamente en formato `DD-MM-AAAA` (`formatearFecha`).
- **Transporte interno**: En los cuerpos JSON y parámetros de API, las fechas viajan como cadenas ISO 8601 en formato `AAAA-MM-DD` (`esquemaFechaIso`), asegurando orden lexicográfico y neutralidad de zonas horarias. Las marcas temporales de auditoría (`creadoEn`, `actualizadoEn`) se transfieren en ISO 8601 completo con zona horaria UTC (`formatearFechaHora`).

### Montos

- **Precisión en almacenamiento (D4)**: Los montos se guardan en base de datos como pesos con dos decimales (`Decimal(14,2)`), admitiendo valores hasta `999.999.999.999,99`.
- **Cálculos y redondeo**: Todo cálculo que produzca un monto (costos, totales, valor ganado) debe redondearse al final a dos decimales con `redondearMonto`, preservando la precisión completa en los cálculos intermedios.
- **Visualización**: En tablas, tarjetas y vistas generales, los montos se presentan formateados en CLP sin decimales (`formatearMonto`).

---

## 5. Cabecera `X-Rol` y control de acceso

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

## 6. Formato estándar de errores

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

| Estado | `codigo`                     | `error`                    | Origen o causa                                                      |
| ------ | ---------------------------- | -------------------------- | ------------------------------------------------------------------- |
| 400    | `ROL_REQUERIDO`              | Solicitud inválida         | Petición sin cabecera `X-Rol`                                       |
| 400    | `ROL_INVALIDO`               | Solicitud inválida         | Cabecera `X-Rol` con valor no permitido                             |
| 400    | `VALIDACION_FALLIDA`         | Solicitud inválida         | Falla de validación en esquema Zod o identificador inválido         |
| 400    | `RESTRICCION_VIOLADA`        | Solicitud inválida         | Violación de restricción `CHECK` o longitud máxima en base de datos |
| 400    | `SOLICITUD_INVALIDA`         | Solicitud inválida         | JSON malformado o error de formato en petición                      |
| 403    | `ROL_NO_PERMITIDO`           | Acceso denegado            | Rol no autorizado según `@Roles(...)`                               |
| 403    | `ACCESO_DENEGADO`            | Acceso denegado            | Acción no permitida                                                 |
| 404    | `RECURSO_NO_ENCONTRADO`      | No encontrado              | Ruta no mapeada o endpoint inexistente                              |
| 404    | `REGISTRO_NO_ENCONTRADO`     | No encontrado              | Registro no encontrado en base de datos                             |
| 409    | `REGISTRO_DUPLICADO`         | Conflicto                  | Conflicto de unicidad (`P2002` en Prisma)                           |
| 409    | `REGISTRO_RELACIONADO`       | Conflicto                  | Conflicto de clave foránea (`P2003`)                                |
| 409    | `PROYECTO_CERRADO`           | Conflicto                  | Intento de modificación sobre un proyecto en estado CERRADO         |
| 409    | `TRANSICION_INVALIDA`        | Conflicto                  | Transición de estado no admitida por la máquina de estados          |
| 409    | `CONFLICTO`                  | Conflicto                  | Conflicto de concurrencia optimista (`P2034`)                       |
| 413    | `CONTENIDO_DEMASIADO_GRANDE` | Contenido demasiado grande | Carga útil mayor al límite del analizador                           |
| 422    | `JERARQUIA_INVALIDA`         | Operación no permitida     | Incoherencia en relación jerárquica nivel/padre                     |
| 422    | `CAMPO_CALCULADO`            | Operación no permitida     | Intento de edición de campos calculados en tarea con subtareas      |
| 422    | `CICLO_DETECTADO`            | Operación no permitida     | La dependencia genera un ciclo en el grafo de planificación         |
| 422    | `DEPENDENCIA_INVALIDA`       | Operación no permitida     | Tareas no pertenecen al proyecto o alguna posee subtareas           |
| 500    | `ERROR_INTERNO`              | Error interno              | Excepción interna no controlada                                     |
| 503    | `BD_NO_DISPONIBLE`           | Servicio no disponible     | Conexión con PostgreSQL no establecida                              |
| 0      | `SIN_CONEXION`               | Sin conexión               | Cliente web sin conectividad con API                                |
| (otro) | `RESPUESTA_INESPERADA`       | Error                      | Respuesta no interpretable en cliente                               |

---

## 7. Sonda de salud (`/salud`)

El endpoint `GET /salud` es público y responde con un contrato especializado de diagnóstico para monitorear el estado de la infraestructura:

- **Operativa:** HTTP `200 OK`
  ```json
  { "estado": "ok", "bd": "operativa" }
  ```
- **Falla en base de datos:** HTTP `503 Service Unavailable`
  ```json
  { "estado": "error", "bd": "caida" }
  ```
