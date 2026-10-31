UPDATE "tareas" AS t
SET "fecha_fija" = t."inicio_plan"
FROM "proyectos" AS p
WHERE p."id" = t."proyecto_id"
  AND t."inicio_plan" IS NOT NULL
  AND t."fecha_fija" IS NULL
  AND t."inicio_plan" > p."fecha_inicio"
  AND NOT EXISTS (SELECT 1 FROM "tareas" AS h WHERE h."padre_id" = t."id")
  AND NOT EXISTS (SELECT 1 FROM "dependencias" AS d WHERE d."sucesora_id" = t."id");

ALTER TABLE "dependencias"
  ADD CONSTRAINT "dependencias_desfase_check" CHECK ("desfase_dias" BETWEEN -365 AND 365);
