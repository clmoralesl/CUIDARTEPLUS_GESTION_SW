CREATE TYPE "EstadoProyecto" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'CERRADO');

CREATE TYPE "NivelTarea" AS ENUM ('ETAPA', 'ACTIVIDAD', 'SUBACTIVIDAD');

CREATE TYPE "TipoDependencia" AS ENUM ('FS', 'SS', 'FF', 'SF');

CREATE TYPE "RolUsuario" AS ENUM ('JEFE_PROYECTO', 'COMITE_CAMBIOS');

CREATE TYPE "AmbitoKpi" AS ENUM ('PROYECTO', 'HITO', 'CAMBIO');

CREATE TYPE "UnidadKpi" AS ENUM ('PORCENTAJE', 'INDICE', 'DIAS', 'CLP', 'NUMERO');

CREATE TYPE "DireccionKpi" AS ENUM ('MAYOR_MEJOR', 'MENOR_MEJOR');

CREATE TYPE "Semaforo" AS ENUM ('VERDE', 'AMARILLO', 'ROJO');

CREATE TYPE "TipoAlerta" AS ENUM ('SOBREASIGNACION', 'KPI', 'PRESUPUESTO', 'HITO', 'ETAPA_VENCIDA');

CREATE TYPE "SeveridadAlerta" AS ENUM ('INFO', 'ADVERTENCIA', 'CRITICA');

CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

CREATE TYPE "CategoriaCambio" AS ENUM ('ALCANCE', 'PLAZO', 'COSTO', 'RECURSO', 'CALIDAD');

CREATE TYPE "EstadoSolicitud" AS ENUM ('REGISTRADA', 'EN_EVALUACION', 'APROBADA', 'RECHAZADA', 'IMPLEMENTADA', 'CERRADA');

CREATE TYPE "EstadoEtapa" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'OMITIDA');

CREATE TYPE "EstadoAccion" AS ENUM ('PENDIENTE', 'EN_CURSO', 'CERRADA');

CREATE TYPE "TipoImpacto" AS ENUM ('DURACION', 'ASIGNACION', 'NUEVA_TAREA', 'PRESUPUESTO');

CREATE TYPE "AccionBitacora" AS ENUM ('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'RECALCULAR', 'APROBAR', 'RECHAZAR', 'IMPORTAR', 'CERRAR');

CREATE TABLE "proyectos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "responsable" VARCHAR(120) NOT NULL,
    "presupuesto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'PLANIFICADO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "calendarios" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "dias_laborables" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "horas_por_dia" DECIMAL(4,2) NOT NULL DEFAULT 8,

    CONSTRAINT "calendarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feriados" (
    "id" SERIAL NOT NULL,
    "calendario_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" VARCHAR(120) NOT NULL,

    CONSTRAINT "feriados_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tareas" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "padre_id" INTEGER,
    "nivel" "NivelTarea" NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "responsable" VARCHAR(120),
    "duracion_dias" INTEGER NOT NULL DEFAULT 1,
    "inicio_plan" DATE,
    "fin_plan" DATE,
    "inicio_real" DATE,
    "fin_real" DATE,
    "fecha_fija" DATE,
    "porcentaje_avance" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "inicio_tardio" DATE,
    "fin_tardio" DATE,
    "holgura_dias" INTEGER,
    "es_critica" BOOLEAN NOT NULL DEFAULT false,
    "costo_plan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costo_real" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dependencias" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "predecesora_id" INTEGER NOT NULL,
    "sucesora_id" INTEGER NOT NULL,
    "tipo" "TipoDependencia" NOT NULL DEFAULT 'FS',
    "desfase_dias" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dependencias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "profesionales" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "cargo" VARCHAR(120) NOT NULL,
    "tarifa_hora" DECIMAL(12,2) NOT NULL,
    "horas_diarias" DECIMAL(4,2) NOT NULL DEFAULT 8,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profesionales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tipos_recurso" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipos_recurso_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recursos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "tipo_recurso_id" INTEGER NOT NULL,
    "unidad" VARCHAR(30) NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "recursos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asignaciones" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER NOT NULL,
    "profesional_id" INTEGER,
    "recurso_id" INTEGER,
    "dedicacion" DECIMAL(5,2),
    "horas_plan" DECIMAL(10,2),
    "horas_plan_manual" BOOLEAN NOT NULL DEFAULT false,
    "horas_reales" DECIMAL(10,2),
    "cantidad_plan" DECIMAL(12,2),
    "cantidad_real" DECIMAL(12,2),

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "registros_avance" (
    "id" SERIAL NOT NULL,
    "tarea_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "porcentaje" DECIMAL(5,2) NOT NULL,
    "comentario" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_avance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hitos" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "tarea_id" INTEGER,
    "nombre" VARCHAR(160) NOT NULL,
    "criterio" TEXT,
    "responsable" VARCHAR(120),
    "fecha_objetivo" DATE NOT NULL,
    "fecha_cumplimiento" DATE,

    CONSTRAINT "hitos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lineas_base" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "descripcion" TEXT,
    "solicitud_cambio_id" INTEGER,
    "fecha_fin_proyecto" DATE,
    "costo_plan_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lineas_base_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lineas_base_tareas" (
    "id" SERIAL NOT NULL,
    "linea_base_id" INTEGER NOT NULL,
    "tarea_id" INTEGER,
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "nivel" "NivelTarea" NOT NULL,
    "duracion_dias" INTEGER NOT NULL,
    "inicio_plan" DATE,
    "fin_plan" DATE,
    "costo_plan" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "lineas_base_tareas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kpi_definiciones" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT,
    "ambito" "AmbitoKpi" NOT NULL,
    "formula" TEXT NOT NULL,
    "unidad" "UnidadKpi" NOT NULL,
    "meta" DECIMAL(14,4),
    "direccion" "DireccionKpi" NOT NULL,
    "es_adicional" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "kpi_definiciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kpi_umbrales" (
    "id" SERIAL NOT NULL,
    "kpi_id" INTEGER NOT NULL,
    "semaforo" "Semaforo" NOT NULL,
    "valor_desde" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "kpi_umbrales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kpi_mediciones" (
    "id" SERIAL NOT NULL,
    "kpi_id" INTEGER NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "hito_id" INTEGER,
    "valor" DECIMAL(18,4),
    "semaforo" "Semaforo",
    "origen" VARCHAR(200),
    "medido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_mediciones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alertas" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "severidad" "SeveridadAlerta" NOT NULL DEFAULT 'ADVERTENCIA',
    "clave" VARCHAR(160) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "detalle" JSONB,
    "entidad" VARCHAR(60),
    "entidad_id" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" TIMESTAMP(3),

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "solicitudes_cambio" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "solicitante" VARCHAR(120) NOT NULL,
    "responsable" VARCHAR(120) NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "categoria" "CategoriaCambio" NOT NULL,
    "probabilidad_riesgo" INTEGER NOT NULL,
    "impacto_riesgo" INTEGER NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'REGISTRADA',
    "etapa_actual" INTEGER NOT NULL DEFAULT 1,
    "motivo_rechazo" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_decision" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_cambio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "etapas_cambio" (
    "id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "responsable" VARCHAR(120),
    "estado" "EstadoEtapa" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "fecha_completada" TIMESTAMP(3),
    "comentario" TEXT,
    "porcentaje_adopcion" DECIMAL(5,2),

    CONSTRAINT "etapas_cambio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "acciones_correctivas" (
    "id" SERIAL NOT NULL,
    "etapa_id" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "responsable" VARCHAR(120) NOT NULL,
    "fecha_compromiso" DATE NOT NULL,
    "fecha_cierre" DATE,
    "estado" "EstadoAccion" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "acciones_correctivas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidencias" (
    "id" SERIAL NOT NULL,
    "etapa_id" INTEGER NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(120) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "subido_por" "RolUsuario" NOT NULL,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "impactos_cambio" (
    "id" SERIAL NOT NULL,
    "solicitud_id" INTEGER NOT NULL,
    "tipo" "TipoImpacto" NOT NULL,
    "tarea_id" INTEGER,
    "datos" JSONB NOT NULL,
    "descripcion" TEXT,
    "aplicado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "impactos_cambio_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bitacora" (
    "id" SERIAL NOT NULL,
    "proyecto_id" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol" "RolUsuario",
    "entidad" VARCHAR(60) NOT NULL,
    "entidad_id" INTEGER,
    "accion" "AccionBitacora" NOT NULL,
    "campo" VARCHAR(60),
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "origen" VARCHAR(200),
    "solicitud_cambio_id" INTEGER,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "calendarios_proyecto_id_key" ON "calendarios"("proyecto_id");

CREATE UNIQUE INDEX "feriados_calendario_id_fecha_key" ON "feriados"("calendario_id", "fecha");

CREATE INDEX "tareas_padre_id_idx" ON "tareas"("padre_id");

CREATE UNIQUE INDEX "tareas_proyecto_id_codigo_key" ON "tareas"("proyecto_id", "codigo");

CREATE INDEX "dependencias_sucesora_id_idx" ON "dependencias"("sucesora_id");

CREATE UNIQUE INDEX "dependencias_predecesora_id_sucesora_id_key" ON "dependencias"("predecesora_id", "sucesora_id");

CREATE UNIQUE INDEX "profesionales_nombre_key" ON "profesionales"("nombre");

CREATE UNIQUE INDEX "tipos_recurso_nombre_key" ON "tipos_recurso"("nombre");

CREATE UNIQUE INDEX "recursos_nombre_key" ON "recursos"("nombre");

CREATE INDEX "asignaciones_profesional_id_idx" ON "asignaciones"("profesional_id");

CREATE INDEX "asignaciones_recurso_id_idx" ON "asignaciones"("recurso_id");

CREATE UNIQUE INDEX "asignaciones_tarea_id_profesional_id_key" ON "asignaciones"("tarea_id", "profesional_id");

CREATE UNIQUE INDEX "asignaciones_tarea_id_recurso_id_key" ON "asignaciones"("tarea_id", "recurso_id");

CREATE INDEX "registros_avance_tarea_id_fecha_idx" ON "registros_avance"("tarea_id", "fecha");

CREATE INDEX "hitos_proyecto_id_idx" ON "hitos"("proyecto_id");

CREATE UNIQUE INDEX "lineas_base_proyecto_id_version_key" ON "lineas_base"("proyecto_id", "version");

CREATE UNIQUE INDEX "lineas_base_tareas_linea_base_id_codigo_key" ON "lineas_base_tareas"("linea_base_id", "codigo");

CREATE UNIQUE INDEX "kpi_definiciones_codigo_key" ON "kpi_definiciones"("codigo");

CREATE UNIQUE INDEX "kpi_umbrales_kpi_id_semaforo_key" ON "kpi_umbrales"("kpi_id", "semaforo");

CREATE INDEX "kpi_mediciones_kpi_id_proyecto_id_medido_en_idx" ON "kpi_mediciones"("kpi_id", "proyecto_id", "medido_en");

CREATE INDEX "alertas_proyecto_id_activa_idx" ON "alertas"("proyecto_id", "activa");

CREATE INDEX "alertas_proyecto_id_clave_idx" ON "alertas"("proyecto_id", "clave");

CREATE INDEX "solicitudes_cambio_proyecto_id_estado_idx" ON "solicitudes_cambio"("proyecto_id", "estado");

CREATE UNIQUE INDEX "solicitudes_cambio_proyecto_id_codigo_key" ON "solicitudes_cambio"("proyecto_id", "codigo");

CREATE UNIQUE INDEX "etapas_cambio_solicitud_id_numero_key" ON "etapas_cambio"("solicitud_id", "numero");

CREATE INDEX "impactos_cambio_solicitud_id_idx" ON "impactos_cambio"("solicitud_id");

CREATE INDEX "bitacora_proyecto_id_fecha_idx" ON "bitacora"("proyecto_id", "fecha");

CREATE INDEX "bitacora_entidad_entidad_id_idx" ON "bitacora"("entidad", "entidad_id");

ALTER TABLE "calendarios" ADD CONSTRAINT "calendarios_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feriados" ADD CONSTRAINT "feriados_calendario_id_fkey" FOREIGN KEY ("calendario_id") REFERENCES "calendarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tareas" ADD CONSTRAINT "tareas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tareas" ADD CONSTRAINT "tareas_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dependencias" ADD CONSTRAINT "dependencias_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dependencias" ADD CONSTRAINT "dependencias_predecesora_id_fkey" FOREIGN KEY ("predecesora_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dependencias" ADD CONSTRAINT "dependencias_sucesora_id_fkey" FOREIGN KEY ("sucesora_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recursos" ADD CONSTRAINT "recursos_tipo_recurso_id_fkey" FOREIGN KEY ("tipo_recurso_id") REFERENCES "tipos_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "profesionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registros_avance" ADD CONSTRAINT "registros_avance_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hitos" ADD CONSTRAINT "hitos_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hitos" ADD CONSTRAINT "hitos_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lineas_base" ADD CONSTRAINT "lineas_base_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lineas_base" ADD CONSTRAINT "lineas_base_solicitud_cambio_id_fkey" FOREIGN KEY ("solicitud_cambio_id") REFERENCES "solicitudes_cambio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lineas_base_tareas" ADD CONSTRAINT "lineas_base_tareas_linea_base_id_fkey" FOREIGN KEY ("linea_base_id") REFERENCES "lineas_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lineas_base_tareas" ADD CONSTRAINT "lineas_base_tareas_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "kpi_umbrales" ADD CONSTRAINT "kpi_umbrales_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "kpi_definiciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kpi_mediciones" ADD CONSTRAINT "kpi_mediciones_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "kpi_definiciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kpi_mediciones" ADD CONSTRAINT "kpi_mediciones_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kpi_mediciones" ADD CONSTRAINT "kpi_mediciones_hito_id_fkey" FOREIGN KEY ("hito_id") REFERENCES "hitos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "alertas" ADD CONSTRAINT "alertas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "solicitudes_cambio" ADD CONSTRAINT "solicitudes_cambio_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "etapas_cambio" ADD CONSTRAINT "etapas_cambio_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_cambio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "acciones_correctivas" ADD CONSTRAINT "acciones_correctivas_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapas_cambio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapas_cambio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "impactos_cambio" ADD CONSTRAINT "impactos_cambio_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes_cambio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "impactos_cambio" ADD CONSTRAINT "impactos_cambio_tarea_id_fkey" FOREIGN KEY ("tarea_id") REFERENCES "tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_solicitud_cambio_id_fkey" FOREIGN KEY ("solicitud_cambio_id") REFERENCES "solicitudes_cambio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "proyectos"
  ADD CONSTRAINT "proyectos_presupuesto_check" CHECK ("presupuesto" >= 0),
  ADD CONSTRAINT "proyectos_fechas_check" CHECK ("fecha_fin" IS NULL OR "fecha_fin" >= "fecha_inicio");

ALTER TABLE "calendarios"
  ADD CONSTRAINT "calendarios_horas_check" CHECK ("horas_por_dia" > 0 AND "horas_por_dia" <= 24),
  ADD CONSTRAINT "calendarios_dias_check" CHECK (cardinality("dias_laborables") > 0 AND "dias_laborables" <@ ARRAY[0,1,2,3,4,5,6]);

ALTER TABLE "tareas"
  ADD CONSTRAINT "tareas_duracion_check" CHECK ("duracion_dias" >= 0),
  ADD CONSTRAINT "tareas_avance_check" CHECK ("porcentaje_avance" >= 0 AND "porcentaje_avance" <= 100),
  ADD CONSTRAINT "tareas_fechas_plan_check" CHECK ("inicio_plan" IS NULL OR "fin_plan" IS NULL OR "fin_plan" >= "inicio_plan"),
  ADD CONSTRAINT "tareas_fechas_real_check" CHECK ("inicio_real" IS NULL OR "fin_real" IS NULL OR "fin_real" >= "inicio_real"),
  ADD CONSTRAINT "tareas_costos_check" CHECK ("costo_plan" >= 0 AND "costo_real" >= 0),
  ADD CONSTRAINT "tareas_etapa_sin_padre_check" CHECK (("nivel" = 'ETAPA') = ("padre_id" IS NULL)),
  ADD CONSTRAINT "tareas_padre_distinto_check" CHECK ("padre_id" IS NULL OR "padre_id" <> "id");

ALTER TABLE "dependencias"
  ADD CONSTRAINT "dependencias_sin_autorreferencia_check" CHECK ("predecesora_id" <> "sucesora_id");

ALTER TABLE "profesionales"
  ADD CONSTRAINT "profesionales_tarifa_check" CHECK ("tarifa_hora" >= 0),
  ADD CONSTRAINT "profesionales_horas_check" CHECK ("horas_diarias" > 0 AND "horas_diarias" <= 24);

ALTER TABLE "recursos"
  ADD CONSTRAINT "recursos_costo_check" CHECK ("costo_unitario" >= 0);

ALTER TABLE "asignaciones"
  ADD CONSTRAINT "asignaciones_un_destino_check" CHECK (num_nonnulls("profesional_id", "recurso_id") = 1),
  ADD CONSTRAINT "asignaciones_dedicacion_check" CHECK ("dedicacion" IS NULL OR ("dedicacion" > 0 AND "dedicacion" <= 100)),
  ADD CONSTRAINT "asignaciones_cantidades_check" CHECK (
    coalesce("horas_plan", 0) >= 0 AND coalesce("horas_reales", 0) >= 0
    AND coalesce("cantidad_plan", 0) >= 0 AND coalesce("cantidad_real", 0) >= 0
  );

ALTER TABLE "registros_avance"
  ADD CONSTRAINT "registros_avance_porcentaje_check" CHECK ("porcentaje" >= 0 AND "porcentaje" <= 100);

ALTER TABLE "lineas_base"
  ADD CONSTRAINT "lineas_base_version_check" CHECK ("version" >= 1),
  ADD CONSTRAINT "lineas_base_costo_check" CHECK ("costo_plan_total" >= 0);

ALTER TABLE "lineas_base_tareas"
  ADD CONSTRAINT "lineas_base_tareas_valores_check" CHECK ("duracion_dias" >= 0 AND "costo_plan" >= 0);

ALTER TABLE "solicitudes_cambio"
  ADD CONSTRAINT "solicitudes_cambio_probabilidad_check" CHECK ("probabilidad_riesgo" BETWEEN 1 AND 5),
  ADD CONSTRAINT "solicitudes_cambio_impacto_check" CHECK ("impacto_riesgo" BETWEEN 1 AND 5),
  ADD CONSTRAINT "solicitudes_cambio_etapa_check" CHECK ("etapa_actual" BETWEEN 1 AND 10);

ALTER TABLE "etapas_cambio"
  ADD CONSTRAINT "etapas_cambio_numero_check" CHECK ("numero" BETWEEN 1 AND 10),
  ADD CONSTRAINT "etapas_cambio_adopcion_check" CHECK ("porcentaje_adopcion" IS NULL OR ("porcentaje_adopcion" >= 0 AND "porcentaje_adopcion" <= 100)),
  ADD CONSTRAINT "etapas_cambio_fechas_check" CHECK ("fecha_inicio" IS NULL OR "fecha_fin" IS NULL OR "fecha_fin" >= "fecha_inicio");

ALTER TABLE "evidencias"
  ADD CONSTRAINT "evidencias_tamano_check" CHECK ("tamano_bytes" > 0 AND "tamano_bytes" <= 10485760);
