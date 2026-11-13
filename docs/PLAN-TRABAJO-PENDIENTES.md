# Plan de trabajo para cerrar pendientes — Radio Continental 99.7 FM

**Preparado:** 2026-11-12  
**Fuente:** [`AUDITORIA-INTEGRAL.md`](./AUDITORIA-INTEGRAL.md) y [`README.md`](../README.md)

Este plan consolida los pendientes y evita repetir verificaciones ya documentadas. No cambia los estados de la auditoría original: cada punto se cierra solo con evidencia observable. El código local puede prepararse y revisarse desde este repositorio; las consolas, datos y aprobaciones del propietario se atienden por separado.

## Estado ejecutivo

El proyecto tiene una base técnica amplia y el prerender editorial está implementado. **No está listo para lanzamiento**: la auditoría más reciente documenta que Render responde con `301 Location: /index.html` en rutas de la SPA; Firestore devuelve denegación de lectura en las consultas públicas requeridas por el prerender; y la cuenta candidata de superadministrador consultada tiene el correo sin verificar y no tiene claims. También faltan stream y contenido/datos oficiales, y aprobación legal.

Los principales bloqueadores de lanzamiento son las tareas de auditoría **3–7, 9–10, 16, 19–20, 23, 26–27 y 30–35/45**. Varias son subtareas relacionadas y se deben ejecutar como los paquetes siguientes.

## Secuencia recomendada

| Fase | Prioridad | Trabajo consolidado | Responsable principal | Criterio de salida |
|---|---|---|---|---|
| 0. Cerrar acceso y proyecto | P0 | Confirmar proyecto Firebase de producción, variables del Static Site y acceso a Render/Firebase. Comparar Project ID del frontend con el usado por el generador; no copiar claves al chat. | Propietario; desarrollador apoya lectura/configuración | Mismo proyecto confirmado en Render, Firebase Console y build; evidencia sin secretos. Auditoría 1, 2, 34, 36. |
| 1. Resolver rutas de producción | P0 | En el Static Site existente revisar reglas efectivas, quitar Redirect que manda a `/index.html`, aplicar Rewrite para rutas de SPA, sincronizar el Blueprint/rama y publicar el cambio autorizado. | Propietario en Render; desarrollador verifica | `/admin/login`, `/admin`, `/noticias` y otras rutas funcionales conservan su URL y sirven la app; slugs prerenderizados responden 200 y slugs ausentes 404. Reglas visibles concuerdan con `render.yaml`. Auditoría 9–10, 30–31, 45. |
| 2. Desbloquear Firebase de forma segura | P0 | Diagnosticar API/base, reglas activas, esquema y consulta anónima exacta en staging; comprobar filtros `published` y `isArchived == false`. Corregir causa demostrada, probar reglas e índices en Emulator/staging y publicar reglas solo con autorización. | Propietario provee acceso/autoriza; desarrollador diagnostica y valida | Lectura pública mínima funciona para contenido publicado; borradores/archivados y escrituras no autorizadas quedan denegados; ambas colecciones requeridas pueden consultarse para prerender. Sin reglas globales permisivas. Auditoría 3–5, 32, 35–37. |
| 3. Completar identidad y operación del panel | P0 | Verificar el correo de la cuenta aprobada; con autorización separada asignar `superadmin` desde la herramienta protegida. Crear cuentas de prueba por rol y ejercitar Auth, permisos, Storage y ciclo CRUD en staging. | Propietario para identidad/claims; desarrollador para pruebas | Login y recuperación/verificación comprobados; claims esperados confirmados; editor y superadmin tienen permisos correctos; CRUD de noticias/programas y registros se confirman en el servidor. Auditoría 6–8, 18–20, 23 y 41. |
| 4. Preparar contenido y servicio de radio | P0 | Obtener URL HTTPS/formato del stream y probar reproducción/reconexión; confirmar zona horaria y grilla. Reunir historia, logos/fotos con derechos, programas, conductores, contactos y redes oficiales. Cargar solo información aprobada. | Propietario/emisora entrega y aprueba insumos; desarrollador integra cuando estén disponibles | Stream reproduce en móvil/escritorio; contenido, contacto y horarios corresponden a fuentes aprobadas y no hay datos ficticios. Auditoría 12–17. |
| 5. Release candidate y aprobación | P0 | Con configuración real, ejecutar `npm run deploy:prepare`; verificar sitemap/prerender, canonical, `robots.txt`, rutas, 404, seguridad básica, accesibilidad y pruebas de staging/dispositivos. Cerrar textos legales y derechos. Preparar reversión y desplegar solo con aprobación de release. | Desarrollador prepara/evidencia; propietario aprueba y despliega | Build estricto termina sin errores; checklist de lanzamiento firmado; legales y derechos aprobados; producción validada y plan de rollback disponible. Auditoría 21, 23–27, 31, 33. |
| 6. Operación posterior | P1/P2 | Definir respaldos y ensayar restauración en staging; Search Console/sitemap y decisión de analítica; responsables editoriales, alertas, incidentes y revisión de costos. Decidir si se requiere formulario de contacto o metadatos al aire. | Propietario define; desarrollador implementa lo aprobado | Responsables y procedimientos documentados, recuperación probada; mejoras opcionales con alcance aprobado. Auditoría 17–18, 22, 25, 28–29. |

## Próxima acción concreta

Empezar por **Fase 0 y Fase 1**, porque la verificación de producción y el acceso al panel dependen de ellas. El propietario debe revisar el servicio Render existente y confirmar el proyecto/configuración Firebase sin compartir secretos. En paralelo, el desarrollador puede preparar la lista exacta de rutas a contrastar y revisar `render.yaml` y el generador local. Luego se resuelve Firebase en staging antes de intentar el build estricto de producción.

## Paquete prioritario: resolver carga multimedia

Este paquete cierra el bloqueo de la biblioteca multimedia sin confundir el fallo histórico del Emulator con el estado de producción. La auditoría registra que el límite de expresiones al crear metadatos se corrigió en `firestore.rules` localmente y que la suite posterior pasó; esas reglas no se publicaron. Además, la última consulta documentada de la cuenta candidata encontró `emailVerified=false` y claims `{}`, por lo que esa cuenta no puede cargar medios hasta completar verificación y una asignación autorizada del claim `superadmin`.

| Orden | Acción | Responsable / entorno | Evidencia para cerrar |
|---:|---|---|---|
| 1 | Revisar en local el flujo completo Storage → Firestore → publicación/archivo, las reglas y el mensaje exacto de error si está disponible. Confirmar compatibilidad de MIME, tamaños, metadata y orden de operaciones. No inferir causa sin mensaje/log. | IA de VS Code y supervisor; solo repositorio | Diagnóstico con archivos/líneas, causa confirmada o lista de hipótesis y qué evidencia falta. |
| 2 | Auditar las reglas de Firestore y Storage contra esos flujos. Ejecutar pruebas focalizadas de Emulator para crear metadatos como superadmin, rechazar roles/archivos inválidos y confirmar el flujo permitido; corregir solo defectos reproducibles. | Desarrollador; Emulator local con fixtures | Salida reproducible de pruebas y revisión del diff. No publicar reglas desde este paso. |
| 3 | Verificar correo de la cuenta aprobada desde el flujo normal de Firebase Authentication y confirmar el estado actualizado. | Propietario de la cuenta; Firebase Auth | `emailVerified=true`, sin compartir contraseñas ni códigos en chat. |
| 4 | Con autorización operacional explícita, revisar proyecto/UID/correo/claims actuales y usar la CLI auditada para asignar `superadmin`; renovar token y confirmar el claim. | Operador autorizado; ADC/CLI segura | Evento de auditoría local sin secretos y consulta de solo lectura posterior confirma cuenta verificada y claim correcto. No asignar a una cuenta distinta de la aprobada. |
| 5 | Contrastar en Firebase Console las reglas efectivas con las reglas locales y los índices requeridos; revisar Storage bucket/proyecto. Publicar únicamente las reglas revisadas, después de autorización explícita y plan de reversión. | Propietario/operador autorizado; staging primero, producción después | Versiones efectivas identificadas; permisos negativos y positivos aprobados en staging; publicación y resultado registrados. |
| 6 | Hacer carga controlada en staging con un archivo de prueba aprobado; comprobar registro Firestore privado, lectura admin, rechazo de lectura pública antes de publicar, visibilidad pública tras publicar, y retorno a privado al despublicar/archivar. Revisar errores y objetos huérfanos sin borrarlos automáticamente. | Desarrollador + propietario; staging | Evidencia por operación, ID de documento/ruta anonimizados en auditoría, sin archivos personales. |
| 7 | Repetir la prueba mínima en producción solo con autorización explícita, usando un archivo de prueba no sensible; eliminar/archivar mediante el procedimiento permitido y registrar el resultado. | Propietario/operador autorizado | Carga y ciclo verificados en producción, ninguna lectura no autorizada, no quedan objetos de prueba sin dueño. |

### Criterio de diagnóstico rápido

- `storage/unauthorized`: comprobar correo verificado y claim en el token renovado; después, reglas efectivas de Storage y proyecto/bucket.
- `permission-denied` al crear `media`: comprobar claim/correo y reglas efectivas de Firestore; el arreglo local del Emulator por sí solo no prueba producción.
- Upload exitoso pero error al guardar registro: archivo privado huérfano; localizar por ruta/metadata y reconciliar manualmente, sin borrado automático.
- Límite de 500: es el límite de registros activos Firestore comprobado antes de subir, no una cuota del bucket. La falta de consulta de conteo también impide que el flujo llegue al upload.
- MIME/tamaño rechazado: comparar el `File.type`, bytes reales, formato y límites idénticos del cliente y Storage Rules.

**Definición de terminado:** el caso original se reproduce o se obtiene un mensaje de error concreto; hay prueba local que cubre la causa; identidad aprobada y reglas efectivas permiten la operación requerida; la carga y el ciclo de privacidad funcionan en staging; y producción solo se marca resuelta tras una verificación autorizada allí. Si no se dispone del error original, mantener el diagnóstico como “pendiente de evidencia”, no declarar una causa definitiva.

## Reglas de ejecución y evidencia

- Trabajar primero en Emulator o staging para cambios de reglas, Auth, Storage y CRUD.
- No cambiar datos, reglas, claims, DNS ni variables de producción sin la autorización específica descrita en la auditoría y el README. La autorización general para avanzar en el proyecto no reemplaza la aprobación requerida para publicar o cambiar recursos productivos.
- No marcar una tarea externa como terminada por tener el código preparado: adjuntar resultado de consola, respuesta HTTP, ejecución reproducible o confirmación del responsable.
- No inventar contactos, stream, historia, imágenes ni textos legales; solicitar los insumos oficiales al propietario y continuar con trabajo independiente mientras llegan.
- Actualizar [`AUDITORIA-INTEGRAL.md`](./AUDITORIA-INTEGRAL.md) solo cuando exista evidencia nueva, conservando el historial y evitando duplicar filas.

## Mapa de dependencias

```text
Proyecto/variables confirmados
        ├── Render: corregir Rewrite y verificar rutas
        └── Firebase: diagnosticar permisos en staging
                  └── build estricto + prerender/sitemap
                         └── QA de contenido, SEO y CRUD
Insumos oficiales + stream + legales ───────────────┘
                         └── aprobación y lanzamiento
```

