# Factibiz

Prototipo funcional de una web app académica para evaluar la factibilidad de proyectos de negocio mediante una matriz multicriterio con enfoque ejecutivo.

## Qué hace

Factibiz permite:

- conversar con una IA que entrevista al usuario y arma el caso paso a paso
- extraer automáticamente datos estructurados del proyecto a partir del chat
- usar también un formulario clásico como modo alternativo
- enriquecer el análisis con contexto automático por ubicación
- calcular un score final de factibilidad entre `0.0` y `10.0`
- clasificar el caso como `No factible`, `Factible con riesgos` o `Factible`
- visualizar resultados en un dashboard con gráficos
- generar un informe ejecutivo imprimible y exportable a PDF desde el navegador
- exportar el resultado en JSON
- comparar el caso actual con proyectos demo incluidos

## Stack

- Next.js 14 con App Router
- TypeScript
- Tailwind CSS
- react-hook-form + zod
- Recharts
- lucide-react
- arquitectura modular para despliegue en Vercel

## Estructura

- `app/`: rutas principales
- `components/`: UI, entrevista IA, wizard, dashboard, charts e informe
- `lib/scoring/`: motor de scoring desacoplado
- `lib/ai/`: entrevista guiada, insights simulados e integración real con LLM
- `lib/context/`: contexto automático por ubicación
- `lib/report/`: exportación e impresión
- `types/`: tipos de dominio
- `data/`: proyectos demo

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Validación de calidad

```bash
npm run lint
npm run build
```

## Cómo usar demos

Hay dos proyectos demo incluidos:

- `Dominó Urbano Buenos Aires`
- `Hotel de Experiencias Selva Viva`

Puedes cargarlos de tres formas:

- desde la landing con el botón `Cargar demo`
- desde las tarjetas de demo en la landing
- entrando a `/evaluacion?demo=domino_buenos_aires` o `/evaluacion?demo=hotel_amazonia`

## Despliegue en Vercel

1. Sube el repositorio a GitHub, GitLab o Bitbucket.
2. Importa el proyecto en Vercel.
3. Vercel detectará automáticamente Next.js.
4. Usa los comandos por defecto:

```bash
npm install
npm run build
```

No requiere variables de entorno para esta versión del prototipo.

Si quieres usar la experiencia conversacional con Gemini real, agrega:

```bash
GEMINI_API_KEY=tu_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

## Informe PDF

La exportación usa una estrategia razonable basada en impresión del navegador:

- abre `/informe`
- pulsa `Descargar informe PDF`
- el navegador abre la vista de impresión
- guarda como PDF

Esto deja la solución simple, portable y adecuada para demo académica.

## Cómo extender la capa de IA

La lógica actual está en:

- `lib/ai/aiInsights.ts`
- `lib/ai/gemini.ts`
- `lib/ai/interview.ts`
- `app/api/insights/route.ts`
- `app/api/interview/route.ts`

Hoy soporta:

- insights mock locales
- insights reales con Gemini
- entrevista guiada por IA para construir el proyecto

Ambos modos trabajan sobre:

- input del proyecto
- contexto geográfico
- resultados del scoring
- conversación con el usuario

Para conectar un LLM real más adelante:

1. crea un adaptador de proveedor adicional
2. mantén `InsightReport` y `InterviewTurnResult` como contratos estables
3. reutiliza las route handlers como punto único de orquestación
4. conserva el fallback mock para demo offline o contingencia

## Cómo conectar datos reales

La capa actual de contexto está en:

- `lib/context/locationContextService.ts`

Hoy devuelve presets para:

- Buenos Aires, Argentina
- Santiago, Chile
- Bogotá, Colombia
- Iquitos / Lima, Perú

Y usa una heurística de fallback cuando no hay un preset.

Para usar datos reales:

1. reemplaza los presets por llamadas a una API o base propia
2. mapea la respuesta a `LocationContext`
3. conserva la heurística como fallback offline
4. si agregas fetch en servidor, evalúa mover la obtención de contexto a una route handler o server action

## Motor de scoring

El cálculo está desacoplado en:

- `lib/scoring/engine.ts`

Incluye:

- subscore por bloque
- score final ponderado
- interpretación textual
- riesgos y oportunidades derivados
- proyección simple de ventas

Los pesos iniciales están en:

- `lib/constants.ts`

Y pueden editarse desde el paso final del wizard.

La experiencia principal recomendada ahora es la entrevista con IA en `/evaluacion`.
