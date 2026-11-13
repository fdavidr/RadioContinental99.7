# Prompts de trabajo para el asistente de VS Code

Usa estos prompts en orden, en el workspace `RadioContinental99.7`. Pide al asistente que inspeccione y edite el repositorio local; no lo dejes operar servicios externos. Después de cada prompt, revisa el diff y pide una explicación de archivos modificados, evidencia y dudas. La auditoría fuente es [`AUDITORIA-INTEGRAL.md`](./AUDITORIA-INTEGRAL.md), y el plan consolidado está en [`PLAN-TRABAJO-PENDIENTES.md`](./PLAN-TRABAJO-PENDIENTES.md).

## Paquete: error al subir multimedia

Ejecutar estos prompts en orden. El asistente de VS Code trabaja únicamente sobre el repositorio y Emulator local. Las operaciones en Authentication, Storage/Firestore de producción, IAM, despliegue o cuentas requieren intervención/confirmación del propietario y no se autorizan mediante estos prompts. No se debe inventar el mensaje de error: si falta, solicitarlo al usuario mientras se avanza con la auditoría local.

### Prompt maestro 1 — diagnosticar el flujo sin asumir la causa

```text
Actúa como ingeniero senior de Firebase Storage, Firestore Rules y React. Trabaja en el workspace RadioContinental99.7. Lee README.md, docs/AUDITORIA-INTEGRAL.md y la sección “Paquete prioritario: resolver carga multimedia” de docs/PLAN-TRABAJO-PENDIENTES.md. Inspecciona src/services/media.ts, src/pages/admin/AdminMediaPage.tsx, src/services/content.ts, firestore.rules, storage.rules, firebase.json, índices y pruebas existentes.

Objetivo: determinar con evidencia por qué puede fallar la subida multimedia y separar lo ya probado localmente de lo que se desconoce de Firebase producción. La auditoría dice que el Emulator antes alcanzaba 1000 expresiones al crear metadatos y que luego se refactorizaron las reglas localmente; no afirma que las reglas estén publicadas. También registra que la cuenta candidata estaba sin verificar y sin claim superadmin. No presentes esos datos históricos como estado actual sin volver a consultarlos, y no declares una causa definitiva sin el mensaje/log del incidente.

Traza las operaciones y requisitos en este orden: consulta del conteo de activos; autorización del cliente; validación MIME/tamaño; upload a Storage y metadata; creación del documento Firestore; publicación/despublicación; archivo; manejo de errores/objeto huérfano. Comprueba diferencias entre cliente y reglas, proyecto/bucket, metadata requerida, índices y posibles errores de permisos/red.

No accedas a Internet, Render, Firebase Console, Google Cloud, DNS, cuentas o datos reales. No uses secretos ni ADC. No cambies reglas o configuración. No ejecutes operaciones de escritura. No ejecutes tests todavía. Primero entrega: (1) diagrama breve del flujo; (2) tabla de fallos posibles, evidencia local y evidencia que falta; (3) causa confirmada solo si existe evidencia; (4) parche local mínimo propuesto, si corresponde. Si necesitas el error original, pídelo claramente, pero continúa la revisión independiente.
```

### Prompt maestro 2 — corregir y comprobar en Emulator

```text
Con el diagnóstico revisado, implementa únicamente los defectos locales confirmados del flujo multimedia. Antes de editar, revisa git diff para preservar cambios preexistentes y limita el parche a archivos necesarios. Mantén los roles, el requisito de email verificado, archivos privados por defecto, límites MIME/tamaño, denegación de borrado y reglas de lectura pública. No reduzcas controles ni añadas permisos comodín.

Añade o ajusta pruebas focalizadas usando los patrones existentes: superadmin verificado puede crear metadato válido; usuario anónimo/editor/no verificado no puede subir ni crear registros multimedia; Storage rechaza MIME, tamaño y metadata inválidos; publicación requiere registro publicado con visibilidad pública; despublicación/archivo devuelve Storage a privado; un fallo Firestore posterior al upload queda claramente reportado sin borrado automático. Si el repositorio ya tiene pruebas equivalentes, no las dupliques.

Ejecuta solo las verificaciones locales necesarias para estos cambios (Emulator/tests ya configurados; no instales dependencias ni cambies archivos lock sin necesidad). Si Java/Emulator o configuración faltan, detente y reporta el bloqueo exacto; no lo eludas con Firebase real. Revisa el diff final. No publiques reglas ni cambies Firebase/Render/IAM/Authentication. No afirmes que producción está reparada. Devuelve archivos cambiados, comandos y resultados exactos, riesgos residuales y qué requiere al propietario.
```

### Prompt maestro 3 — cerrar la comprobación operacional con el propietario

```text
Prepara una checklist paso a paso, sin ejecutar acciones externas, para que el propietario valide una carga controlada de multimedia. Basa cada paso en la implementación actual y en docs/AUDITORIA-INTEGRAL.md. Incluye: confirmar proyecto Firebase y bucket; verificar que la cuenta aprobada tiene email verificado; revisar claims y renovar token; comparar reglas efectivas Firestore/Storage con las versiones revisadas; revisar índices; cargar un archivo no sensible en staging; confirmar Firestore privado y Storage privado; publicar y comprobar lectura pública; despublicar/archivar y comprobar que vuelve a privado; recopilar mensaje/código de error y revisar posibles objetos huérfanos.

Para cada operación que escriba, publique reglas, modifique claims o toque producción, marca claramente “requiere autorización/operador propietario” y explica la evidencia que debe guardarse sin secretos. No pidas ni copies contraseñas, códigos, tokens, ADC o claves. No incluyas comandos destructivos. Distingue staging de producción y no marques como resuelto hasta contar con una prueba observada en el entorno correspondiente.
```

## Prompt 1 — Auditoría local de Render y prerender

```text
Actúa como ingeniero senior de React/Vite y hosting estático. Revisa el estado actual de este repositorio, empezando por README.md, docs/AUDITORIA-INTEGRAL.md y docs/PLAN-TRABAJO-PENDIENTES.md. Contrasta render.yaml, scripts/check-production-config.mjs, scripts/generate-sitemap.mjs, la configuración SEO y el router con el hallazgo de producción: varias rutas reciben 301 Location: /index.html aunque el Blueprint local declara rewrites.

No accedas a Render, Firebase, Google Cloud, DNS, cuentas, navegadores ni red. No cambies variables, datos, reglas, claims, archivos de credenciales ni configuración de producción. No debilites reglas de seguridad. No cambies la arquitectura acordada de prerender estático.

Primero entrega un diagnóstico con referencias archivo/línea y una lista de discrepancias entre repositorio y producción. Si encuentras un defecto demostrable en el código local, corrígelo con el cambio mínimo y explica por qué. Si no hay defecto local, no inventes cambios. No dupliques entradas de auditoría ni marques como resuelto algo que depende de Render/Firebase. No ejecutes tests ni builds.

Al terminar, informa: archivos cambiados, diff resumido, evidencia revisada, pendientes que requieren al propietario y cualquier riesgo residual.
```

## Prompt 2 — Revisión de seguridad del prerender

```text
Revisa scripts/generate-sitemap.mjs y sus pruebas existentes como auditor de seguridad. Comprueba tratamiento de slugs, escapes HTML/XML, filtros de publicación, paginación, colisiones de slugs, errores de permisos, limpieza/idempotencia del directorio dist y que el modo --require-editorial-prerender no permita desplegar un sitemap o páginas incompletas. No cambies Firebase Rules ni uses datos reales o credenciales.

No ejecutes tests/builds. Reporta primero cada hallazgo con severidad y referencia exacta. Corrige solo fallos confirmados con cambios mínimos, añade cobertura de prueba únicamente si es necesaria para una corrección, y luego detente: el agente supervisor revisará el diff antes de aceptar nada. No actualices docs/AUDITORIA-INTEGRAL.md salvo que la evidencia local cambie un estado verificable.
```

## Prompt 3 — Preparar QA local sin publicar

```text
Prepara una checklist reproducible para validar localmente las rutas SPA y los artefactos de prerender de este proyecto usando únicamente fixtures de prueba y configuración demo. No uses producción, credenciales, datos personales, Firebase real, Render ni DNS. No alteres reglas ni hagas deploy.

Inspecciona package.json y pruebas existentes. No instales paquetes ni ejecutes comandos. Propón los pasos mínimos para comprobar que listados/admin conservan su URL, que documentos publicados generan HTML y canonical por slug, y que slugs no generados reciben 404 con el hosting simulado. Distingue qué puede comprobarse localmente y qué requiere staging/Render. No afirmes resultados que no ejecutaste.
```

## Revisión del agente supervisor

Antes de aceptar cualquier cambio sugerido por el asistente:

1. Revisar el diff completo y confirmar que solo toca archivos autorizados.
2. Rechazar cambios que amplíen acceso público, introduzcan datos ficticios, secretos, reglas de Redirect globales o una segunda arquitectura de hosting.
3. Contrastar las afirmaciones con evidencia local; distinguir claramente diagnóstico de producción y configuración del repositorio.
4. Ejecutar verificaciones solo cuando el propietario las solicite o autorice como parte de la fase correspondiente.
5. Registrar resultados en la auditoría solo con evidencia reproducible; las acciones de Firebase/Render siguen la autorización específica del README.
