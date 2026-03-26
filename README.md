# Factibiz

Prototipo funcional de una web app académica para evaluar la factibilidad de proyectos de negocio mediante una matriz multicriterio con enfoque ejecutivo.

## Qué hace

Factibiz permite:

- cargar datos de un proyecto en un formulario multipaso
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
- `components/`: UI, wizard, dashboard, charts e informe
- `lib/scoring/`: motor de scoring desacoplado
- `lib/ai/`: capa de insights simulados preparada para LLM real
- `lib/context/`: contexto automático por ubicación
- `lib/report/`: exportación e impresión
- `types/`: tipos de dominio
- `data/`: proyectos demo

## Cómo correrlo localmente

```bash
npm install
npm run dev
```

Luego abre `http://locealhost:3000`.

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

Hoy usa reglas y plantillas contextuales sobre:

- input del proyecto
- contexto geográfico
- resultados del scoring

Para conectar un LLM real más adelante:

1. crea un adaptador de proveedor, por ejemplo `lib/ai/providers/openai.ts`
2. mantén la interfaz de entrada y salida de `generateAiInsights`
3. reemplaza o complementa la generación mock con una llamada a API
4. conserva `InsightReport` como contrato estable para el frontend

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
