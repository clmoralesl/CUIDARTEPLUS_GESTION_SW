# Motor de Cronograma: Método de la Ruta Crítica (CPM)

Documentación técnica del motor de cálculo de cronogramas (`packages/core/src/cronograma.ts`) del proyecto AutoFix Gestión, correspondiente al Issue #8.

---

## 1. Fundamentos del Método de la Ruta Crítica (CPM)

El Método de la Ruta Crítica (_Critical Path Method_, CPM) es una técnica de planificación de proyectos. Su objetivo es calcular los límites temporales tempranos y tardíos de cada tarea de un grafo dirigido acíclico de dependencias, determinando la holgura disponible y la ruta crítica que define la duración mínima total del proyecto.

El cálculo se ejecuta en dos pasadas complementarias sobre el grafo dirigido de tareas:

1. **Paso hacia adelante (_Forward Pass_):**
   Calcula la fecha de inicio temprano (`inicioTemprano`) y fin temprano (`finTemprano`) de cada tarea, comenzando por las tareas sin predecesoras (o cuya base es el inicio del proyecto) y propagando las restricciones hacia las sucesoras en orden topológico.

2. **Paso hacia atrás (_Backward Pass_):**
   Calcula la fecha de fin tardío (`finTardio`) e inicio tardío (`inicioTardio`) de cada tarea, partiendo del fin global del proyecto y propagando las restricciones hacia las predecesoras en orden topológico inverso.

3. **Determinación de holgura y criticidad:**
   La holgura total representa el margen de días hábiles que una tarea puede retrasarse sin demorar la fecha final del proyecto:
   $$\text{holguraDias} = \text{diasHabilesEntre}(\text{finTemprano}, \text{finTardio}, \text{calendario})$$
   Medir la holgura al fin es equivalente a medirla al inicio para tareas sin fechas reales, pero garantiza el margen verdadero cuando existen fechas reales en días no laborables (donde la referencia limitante hacia sucesoras y proyecto es la fecha de término). Una tarea es crítica (`esCritica = true`) cuando su holgura es menor o igual a cero ($\le 0$).

---

## 2. Modelo de tiempo y fórmulas de dependencias

El motor opera bajo un modelo de tiempo discreto en días hábiles (según el calendario laboral del proyecto, respetando fines de semana y feriados). Una tarea empieza al inicio de su primer día hábil y concluye al final de su último día hábil.

Sean $P$ la tarea predecesora, $S$ la tarea sucesora, $L$ el desfase (_lag_) en días hábiles (positivo para espera, negativo para solapamiento o adelanto) y $\text{dur}(S)$ la duración en días hábiles de la sucesora.

### 2.1 Fórmulas por tipo de relación

| Tipo                       | Relación                                             | Paso hacia adelante (Restricción sobre $S$)                              | Paso hacia atrás (Restricción sobre $P$)                                                |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **FS** (_Fin a Inicio_)    | $S$ empieza el día hábil siguiente al fin de $P + L$ | $\text{inicio}(S) \ge \text{sumar}(\text{fin}(P), \text{pasoFs}(S) + L)$ | $\text{finTardio}(P) \le \text{sumar}(\text{inicioTardio}(S), -(\text{pasoFs}(S) + L))$ |
| **SS** (_Inicio a Inicio_) | $S$ empieza tras el inicio de $P + L$                | $\text{inicio}(S) \ge \text{sumar}(\text{inicio}(P), L)$                 | $\text{inicioTardio}(P) \le \text{sumar}(\text{inicioTardio}(S), -L)$                   |
| **FF** (_Fin a Fin_)       | $S$ termina tras el fin de $P + L$                   | $\text{fin}(S) \ge \text{sumar}(\text{fin}(P), L)$                       | $\text{finTardio}(P) \le \text{sumar}(\text{finTardio}(S), -L)$                         |
| **SF** (_Inicio a Fin_)    | $S$ termina cuando empieza $P + L$                   | $\text{fin}(S) \ge \text{sumar}(\text{inicio}(P), L - 1)$                | $\text{inicioTardio}(P) \le \text{sumar}(\text{finTardio}(S), 1 - L)$                   |

Donde:

- $\text{sumar}(fecha, n)$ denota la adición o sustracción de días hábiles mediante `sumarDiasHabiles(fecha, n, calendario)`.
- Si la restricción calcula directamente $\text{fin}(S)$ (en FF y SF), el inicio correspondiente se determina hacia atrás:
  $$\text{inicio}(S) = \text{sumar}(\text{fin}(S), -(\text{dur}(S) - 1))$$
- Si la restricción calcula directamente $\text{inicioTardio}(P)$ (en SS y SF), el fin tardío correspondiente se determina hacia adelante:
  $$\text{finTardio}(P) = \text{sumar}(\text{inicioTardio}(P), \text{dur}(P) - 1)$$
- **Múltiples predecesoras/sucesoras:**
  Hacia adelante se toma el máximo temporal ($\max$) entre la fecha base de la tarea y todas las restricciones impuestas por sus predecesoras. Hacia atrás se toma el mínimo temporal ($\min$) entre la fecha límite del proyecto y las restricciones impuestas por sus sucesoras.

### 2.2 Decisiones de diseño en las fórmulas

- **Regla SF (D2):** Se adopta la convención estándar (MS Project) en la cual un desfase $L = 0$ significa que $S$ termina al final del día hábil inmediatamente anterior al día de inicio de $P$. Por ello, $\text{fin}(S) \ge \text{sumar}(\text{inicio}(P), L - 1)$.
- **Hitos de duración 0 (D3):** Para evitar que un hito ($\text{dur} = 0$) consuma un día hábil artificial en una cadena FS ($A \to H \to B$), se define $\text{pasoFs}(S) = 0$ si $\text{dur}(S) = 0$, y $\text{pasoFs}(S) = 1$ si $\text{dur}(S) > 0$. De este modo, el hito comparte la misma fecha que el fin de su predecesora sin demorar a las sucesoras.

---

## 3. Fechas base, restricciones fijas y fechas reales

### 3.1 Fecha base y fecha fija (D4)

Toda tarea sin predecesoras (o como cota mínima ante adelantos) tiene una fecha base:
$$\text{base} = \text{siguienteHabil}(\text{fechaFija} \mathbin{??} \text{inicioProyecto}, \text{calendario})$$
El atributo `fechaFija` opera bajo la semántica _"no comenzar antes de"_ (_Start No Earlier Than_). La tarea puede comenzar después si sus predecesoras la empujan, pero nunca antes de su fecha fija o del inicio del proyecto.

### 3.2 Fechas reales registradas (D5)

Cuando una tarea ya ha comenzado en la ejecución del proyecto:

- Si existe `inicioReal`, se adopta exactamente como `inicioTemprano`, sin normalización por calendario (registra el hecho histórico).
- Su `finTemprano` corresponde a $\text{finReal} \mathbin{??} \text{calcularFinPlan}(\text{inicioReal}, \text{duracionDias}, \text{calendario})$.
- En caso de discrepancia temporal entre lo ocurrido y la red lógica (por ejemplo, una sucesora iniciada antes de que su predecesora termine), el motor preserva la realidad en el paso hacia adelante, lo cual provoca en el paso hacia atrás una holgura negativa en la predecesora. Esto alerta con precisión sobre la incongruencia del plan.

---

## 4. Fin de proyecto, holgura y consolidación de jerarquías

### 4.1 Fin del proyecto (D6)

En el CPM clásico puro, la fecha final del proyecto corresponde a la mayor fecha de fin temprano calculada entre todas las tareas hoja del proyecto:
$$\text{finProyecto} = \max_{t \in \text{Hojas}} (\text{finTemprano}(t))$$
El paso hacia atrás parte de $\text{anteriorHabil}(\text{finProyecto}, \text{calendario})$, normalizando el límite tardío al día hábil inmediatamente anterior si el fin real del proyecto cae en un día no laborable (por ejemplo, un sábado o feriado), mientras que `finProyecto` se informa sin alteraciones como la fecha real de término. Esto garantiza que la cadena crítica determine el plazo del proyecto con holgura cero y fechas tardías estrictamente hábiles.

### 4.2 Holgura y criticidad (D7)

- $\text{holguraDias} = \text{diasHabilesEntre}(\text{finTemprano}, \text{finTardio}, \text{calendario})$.
- Medir la holgura al fin es equivalente a medirla al inicio cuando las duraciones en días hábiles son consistentes. Sin embargo, si una tarea registra un inicio o fin real en día no hábil (por ejemplo, una tarea $A$ que termina en sábado 07-11 y tareas independientes $B$ y $C$ de 1 y 2 días), medir la holgura al fin preserva el margen real de trabajo disponible ($B$ con holgura 4 y $C$ con holgura 3, idénticas a si $A$ hubiera finalizado el viernes 06-11), evitando distorsiones por intervalos que incluyan días no laborables.
- $\text{esCritica} = \text{holguraDias} \le 0$. Se consideran críticas tanto las tareas sin holgura como aquellas con holgura negativa por retrasos en ejecución.

### 4.3 Consolidación de tareas padre (D10)

Las dependencias lógicas se definen exclusivamente entre tareas hoja (subactividades ejecutables). Para tareas agrupadoras (etapas y actividades):

- $\text{inicioTemprano} = \min(\text{inicioTemprano de sus hijas})$
- $\text{finTemprano} = \max(\text{finTemprano de sus hijas})$
- $\text{inicioTardio} = \min(\text{inicioTardio de sus hijas})$
- $\text{finTardio} = \max(\text{finTardio de sus hijas})$
- $\text{holguraDias} = \min(\text{holguraDias de sus hijas})$
- $\text{esCritica} = \text{alguna hija es crítica}$

---

## 5. Detección determinista de ciclos y ordenación

El cálculo utiliza el algoritmo de Kahn para obtener el orden topológico en tiempo $O(V + E)$:

1. Se calcula el grado de entrada de cada nodo según sus dependencias entrantes.
2. Se procesan los nodos con grado 0 en una cola, decrementando el grado de sus sucesores.
3. Si al vaciarse la cola quedan nodos sin procesar, existe al menos un ciclo.
4. Para reportar el ciclo de manera determinista (D8), se ejecuta una búsqueda en profundidad (DFS) sobre los nodos no resueltos, recorriendo vecinos ordenados según el orden natural de sus códigos (`1.2` antes que `1.10`). El ciclo encontrado se normaliza rotándolo para que comience con el menor código según el orden natural y se cierra repitiendo dicho código al final (ejemplo: `['1.1', '1.2', '2.1', '1.1']`). Se lanza un error `CicloDetectadoError`.

Asimismo, cualquier incoherencia estructural (dependencias inexistentes, autoreferencias, dependencias que involucran tareas padre, pares duplicados o desfases no enteros) lanza `DependenciaInvalidaError` (D9).

---

## 6. Firma y justificación de parámetros (D12)

```ts
function calcularCronograma(
  tareas: readonly TareaCronograma[],
  dependencias: readonly DependenciaCronograma[],
  calendario: CalendarioLaboral,
  inicioProyecto: string,
): ResultadoCronograma;
```

Se incorpora `inicioProyecto: string` (formato ISO `AAAA-MM-DD`) como cuarto parámetro. Esta fecha es indispensable para establecer la cota temporal inferior de las tareas iniciales que carecen de dependencias predecesoras o de fecha fija, asegurando un cálculo determinista e independiente del contexto de persistencia.

---

## 7. Ejemplo de referencia del proyecto AutoFix (Cálculo a mano)

A continuación se detalla la resolución manual paso a paso del grafo de 7 dependencias sembradas en el proyecto principal (`AutoFix · Implementación`), con fecha de inicio del proyecto `2026-11-02` y calendario chileno (lunes a viernes laborables, feriados oficiales).

### 7.1 Tareas hoja involucradas

| Código  | Nombre                                 | Duración | Fecha fija | Fechas reales                 |
| ------- | -------------------------------------- | -------- | ---------- | ----------------------------- |
| `1.1.1` | Entrevistas con el jefe de taller      | 3 días   | -          | Real: 2026-11-02 a 2026-11-04 |
| `1.1.2` | Mapeo del flujo de órdenes de trabajo  | 4 días   | -          | Real: 2026-11-05 (en curso)   |
| `1.2.1` | Modelo de datos de vehículos y órdenes | 5 días   | -          | -                             |
| `1.2.2` | Prototipo de pantallas de recepción    | 4 días   | -          | -                             |
| `2.1.1` | Registro de vehículos y clientes       | 6 días   | -          | -                             |
| `2.1.2` | Ingreso y seguimiento de órdenes       | 8 días   | -          | -                             |
| `2.2.1` | Calendario de turnos por mecánico      | 5 días   | -          | -                             |

_Nota sobre feriados:_ Durante este período existe el feriado martes 08-12-2026 (Inmaculada Concepción).

### 7.2 Red de dependencias

1. `1.1.1 -> 1.1.2` (FS, desfase 0)
2. `1.1.2 -> 1.2.1` (SS, desfase +2)
3. `1.2.1 -> 1.2.2` (SS, desfase +3)
4. `1.1.2 -> 1.2.2` (FF, desfase +5)
5. `1.2.1 -> 2.1.1` (FS, desfase 0)
6. `2.1.1 -> 2.1.2` (FS, desfase 0)
7. `2.1.2 -> 2.2.1` (SS, desfase +7)

### 7.3 Paso hacia adelante (_Forward Pass_)

1. **`1.1.1` (duración 3):**
   - Sin predecesoras. Base = `2026-11-02`.
   - Tiene `inicioReal = 2026-11-02` y `finReal = 2026-11-04`.
   - $\text{inicioTemprano} = \mathbf{2026-11-02}$, $\text{finTemprano} = \mathbf{2026-11-04}$.

2. **`1.1.2` (duración 4):**
   - Predecesora: `1.1.1` con FS + 0 $\implies$ restricción: $\text{sumar}(2026-11-04, 1 + 0) = 2026-11-05$.
   - Tiene `inicioReal = 2026-11-05`, fin real pendiente.
   - $\text{inicioTemprano} = \mathbf{2026-11-05}$.
   - Fin temprano: 4 días hábiles desde el jueves 05-11 (jue 05, vie 06, lun 09, mar 10):
     $\text{finTemprano} = \mathbf{2026-11-10}$.

3. **`1.2.1` (duración 5):**
   - Predecesora: `1.1.2` con SS + 2 $\implies$ restricción: $\text{sumar}(2026-11-05, +2)$.
   - Jueves 05-11 $+ 2$ días hábiles = lunes 09-11-2026.
   - $\text{inicioTemprano} = \mathbf{2026-11-09}$.
   - Fin temprano: 5 días hábiles (lun 09, mar 10, mié 11, jue 12, vie 13):
     $\text{finTemprano} = \mathbf{2026-11-13}$.

4. **`1.2.2` (duración 4):**
   - Predecesora 1: `1.2.1` con SS + 3 $\implies$ $\text{sumar}(2026-11-09, +3) = 2026-11-12$.
     Inicio candidato $1 = 2026-11-12$. Fin temprano candidato $1$ (4 días: jue 12, vie 13, lun 16, mar 17) $= 2026-11-17$.
   - Predecesora 2: `1.1.2` con FF + 5 $\implies$ restricción en fin: $\text{sumar}(2026-11-10, +5)$.
     Martes 10-11 $+ 5$ días hábiles = martes 17-11-2026.
     Fin candidato $2 = 2026-11-17$, inicio candidato $2 = \text{sumar}(2026-11-17, -(4 - 1)) = 2026-11-12$.
   - Ambas restricciones coinciden:
     $\text{inicioTemprano} = \mathbf{2026-11-12}$, $\text{finTemprano} = \mathbf{2026-11-17}$.

5. **`2.1.1` (duración 6):**
   - Predecesora: `1.2.1` con FS + 0 $\implies$ restricción: $\text{sumar}(2026-11-13, 1 + 0) = 2026-11-16$ (lunes).
   - $\text{inicioTemprano} = \mathbf{2026-11-16}$.
   - Fin temprano: 6 días hábiles (lun 16, mar 17, mié 18, jue 19, vie 20, lun 23):
     $\text{finTemprano} = \mathbf{2026-11-23}$.

6. **`2.1.2` (duración 8):**
   - Predecesora: `2.1.1` con FS + 0 $\implies$ restricción: $\text{sumar}(2026-11-23, 1 + 0) = 2026-11-24$ (martes).
   - $\text{inicioTemprano} = \mathbf{2026-11-24}$.
   - Fin temprano: 8 días hábiles (mar 24, mié 25, jue 26, vie 27, lun 30, mar 01, mié 02, jue 03):
     $\text{finTemprano} = \mathbf{2026-12-03}$.

7. **`2.2.1` (duración 5):**
   - Predecesora: `2.1.2` con SS + 7 $\implies$ restricción: $\text{sumar}(2026-11-24, +7)$.
     Martes 24-11 $+ 7$ días hábiles = jueves 03-12-2026.
   - $\text{inicioTemprano} = \mathbf{2026-12-03}$.
   - Fin temprano: 5 días hábiles contados a partir del jueves 03-12 (jue 03, vie 04, lun 07, [mar 08 feriado], mié 09, jue 10):
     $\text{finTemprano} = \mathbf{2026-12-10}$.

**Fin global del proyecto:** $\max(2026-11-17, 2026-12-03, 2026-12-10) = \mathbf{2026-12-10}$.

---

### 7.4 Paso hacia atrás (_Backward Pass_)

Se fija como meta tardía global: $\text{finGlobal} = 2026-12-10$.

1. **`2.2.1` (duración 5):**
   - Sin sucesoras. $\text{finTardio} = 2026-12-10$.
   - $\text{inicioTardio} = \text{sumar}(2026-12-10, -(5 - 1)) = \mathbf{2026-12-03}$.

2. **`2.1.2` (duración 8):**
   - Sucesora: `2.2.1` con SS + 7 $\implies$ restricción en inicio tardío:
     $\text{sumar}(\text{inicioTardio}(2.2.1), -7) = \text{sumar}(2026-12-03, -7) = 2026-11-24$.
   - $\text{inicioTardio} = \mathbf{2026-11-24}$.
   - $\text{finTardio} = \text{sumar}(2026-11-24, 8 - 1) = \mathbf{2026-12-03}$.

3. **`2.1.1` (duración 6):**
   - Sucesora: `2.1.2` con FS + 0 $\implies$ restricción en fin tardío:
     $\text{sumar}(\text{inicioTardio}(2.1.2), -(1 + 0)) = \text{sumar}(2026-11-24, -1) = 2026-11-23$.
   - $\text{finTardio} = \mathbf{2026-11-23}$.
   - $\text{inicioTardio} = \text{sumar}(2026-11-23, -(6 - 1)) = \mathbf{2026-11-16}$.

4. **`1.2.2` (duración 4):**
   - Sin sucesoras. $\text{finTardio} = 2026-12-10$.
   - $\text{inicioTardio} = \text{sumar}(2026-12-10, -(4 - 1)) = \mathbf{2026-12-04}$.
   - (El viernes 04-12, lunes 07-12, feriado 08-12, miércoles 09-12, jueves 10-12 conforman los 4 días hábiles).

5. **`1.2.1` (duración 5):**
   - Sucesora 1: `2.1.1` con FS + 0 $\implies \text{finTardio} \le \text{sumar}(2026-11-16, -1) = 2026-11-13$.
   - Sucesora 2: `1.2.2` con SS + 3 $\implies \text{inicioTardio} \le \text{sumar}(2026-12-04, -3) = 2026-12-01 \implies \text{finTardio} \le 2026-12-07$.
   - El mínimo restrictivo impone $\text{finTardio} = \mathbf{2026-11-13}$.
   - $\text{inicioTardio} = \text{sumar}(2026-11-13, -(5 - 1)) = \mathbf{2026-11-09}$.

6. **`1.1.2` (duración 4):**
   - Sucesora 1: `1.2.1` con SS + 2 $\implies \text{inicioTardio} \le \text{sumar}(2026-11-09, -2) = 2026-11-05 \implies \text{finTardio} \le 2026-11-10$.
   - Sucesora 2: `1.2.2` con FF + 5 $\implies \text{finTardio} \le \text{sumar}(2026-12-10, -5) = 2026-12-02$.
   - El mínimo restrictivo impone $\text{finTardio} = \mathbf{2026-11-10}$.
   - $\text{inicioTardio} = \text{sumar}(2026-11-10, -(4 - 1)) = \mathbf{2026-11-05}$.

7. **`1.1.1` (duración 3):**
   - Sucesora: `1.1.2` con FS + 0 $\implies \text{finTardio} \le \text{sumar}(2026-11-05, -1) = 2026-11-04$.
   - $\text{finTardio} = \mathbf{2026-11-04}$.
   - $\text{inicioTardio} = \text{sumar}(2026-11-04, -(3 - 1)) = \mathbf{2026-11-02}$.

---

### 7.5 Matriz consolidada de resultados

| Código  | Inicio temprano | Fin temprano | Inicio tardío | Fin tardío | Holgura (días) | ¿Crítica? |
| ------- | --------------- | ------------ | ------------- | ---------- | -------------- | --------- |
| `1.1.1` | 2026-11-02      | 2026-11-04   | 2026-11-02    | 2026-11-04 | 0              | Sí        |
| `1.1.2` | 2026-11-05      | 2026-11-10   | 2026-11-05    | 2026-11-10 | 0              | Sí        |
| `1.2.1` | 2026-11-09      | 2026-11-13   | 2026-11-09    | 2026-11-13 | 0              | Sí        |
| `1.2.2` | 2026-11-12      | 2026-11-17   | 2026-12-04    | 2026-12-10 | 16             | No        |
| `2.1.1` | 2026-11-16      | 2026-11-23   | 2026-11-16    | 2026-11-23 | 0              | Sí        |
| `2.1.2` | 2026-11-24      | 2026-12-03   | 2026-11-24    | 2026-12-03 | 0              | Sí        |
| `2.2.1` | 2026-12-03      | 2026-12-10   | 2026-12-03    | 2026-12-10 | 0              | Sí        |

- **Fin del proyecto:** `2026-12-10`
- **Ruta crítica:** `1.1.1 -> 1.1.2 -> 1.2.1 -> 2.1.1 -> 2.1.2 -> 2.2.1`
- **Tarea no crítica:** `1.2.2` con 16 días hábiles de holgura total (puede postergar su inicio desde el 12-11 hasta el 04-12 sin alterar la fecha final del proyecto).
