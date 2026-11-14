# Auditoría integral y lista de lanzamiento — Radio Continental 99.7 FM

**Actualización de Fase 1 — Infraestructura y despliegue: 2026-11-07**

Este documento conserva los 29 puntos, responsables, prioridades y etapas de la auditoría anterior. Los estados solo cambian cuando hay evidencia verificable. La lista anterior se entregó en la conversación y no existía como archivo del repositorio; por ello queda persistida aquí para dar continuidad a su seguimiento.

Estados: **Pendiente**, **En proceso**, **Completado**, **Requiere verificación**. Prioridades: **P0** bloquea lanzamiento; **P1** necesaria antes de una salida profesional; **P2** recomendada o posterior al lanzamiento.

## 1. Infraestructura y servicios

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 1 | Confirmar acceso propietario a Firebase, Render y GoDaddy, el proyecto Firebase de producción (`radio997-d5380`) y responsables de cada cuenta. No enviar contraseñas ni claves privadas. | Consolas oficiales de Firebase, Render y GoDaddy. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |
| 2 | Confirmar que Render despliega un Static Site desde `main`, construye y publica `dist`, tiene las variables de producción correctas y muestra un deploy exitoso. Nunca poner secretos de Admin SDK en variables `VITE_*`. | Render → servicio → Settings / Environment / Events; `.env.example`. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |

## 2. Firebase y seguridad

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 3 | Confirmar que Firestore está habilitado en el proyecto correcto y diagnosticar el `PERMISSION_DENIED` comparando proyecto, reglas desplegadas y consultas desde staging. El error no identifica por sí solo la causa. | Firebase Console → Firestore; proyecto `radio997-d5380`. | ME CORRESPONDE A MÍ | P0 | Requiere verificación |
| 4 | Comparar/desplegar reglas e índices solo tras autorización y revisión. Probar acceso de visitante, editor y superadministrador; no habilitar escritura pública ni borrado. | `firestore.rules`, `storage.rules`, `firestore.indexes.json`, Firebase Emulator/staging. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |
| 5 | Verificar forma y valores reales de documentos en `posts`, `programs`, `categories` y otras colecciones. Las consultas públicas requieren `status == "published"` e `isArchived == false`; probar que borradores/archivados no sean públicos. | Firestore Console y reglas activas. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |
| 6 | Confirmar Email/Password, protección contra enumeración, plantillas de correo, dominios autorizados y URLs de acción para recuperación/verificación. Probar flujos con cuentas de prueba. | Firebase Console → Authentication; dominio HTTPS oficial. | ME CORRESPONDE A MÍ | P0 | Requiere verificación |
| 7 | Crear cuentas aprobadas, verificar correo y asignar claims de rol con Admin SDK desde un entorno privilegiado auditado. Probar que editor y usuario ordinario no se otorguen privilegios. | Authentication y entorno administrativo protegido; seguir el procedimiento de `README.md`. | ME CORRESPONDE A MÍ | P0 | Requiere verificación |
| 8 | Confirmar bucket, cuotas y reglas de Storage; probar límites de tamaño/formato, carga autorizada y denegación de accesos privados/no autorizados. | Firebase Console → Storage; `storage.rules`. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |

## 3. Dominio y alojamiento

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 9 | Aplicar rewrites SPA en el servicio existente. `render.yaml` mantiene Rewrite exactos para listados y `/admin/*`; se quitaron los comodines de `/noticias/*` y `/programas/*`. El build genera archivos por slug publicado, para que archivos existentes sirvan páginas y slugs no generados respondan 404. La comprobación de producción aún halló `301 Location: /index.html`; cambiar la acción efectiva a Rewrite y verificar que se preserve la URL. | `render.yaml`; Render Dashboard → Static Site → Redirects/Rewrites; inspección HTTP con `curl`. | ME CORRESPONDE A MÍ | P0 | En proceso |
| 10 | `VITE_SITE_URL=https://continental997.fm` está reflejado en `robots.txt`, sitemap y canonical de raíz observados en producción. Falta aplicar/revisar Rewrite en Render y desplegar. La generación local de páginas editoriales está implementada, pero el build estricto depende de recuperar lectura Firestore; producción sigue sin entradas editoriales verificadas por 403. | Environment de Render; `scripts/site-config.mjs`, `scripts/check-production-config.mjs`, `scripts/generate-sitemap.mjs`. | ME CORRESPONDE A MÍ | P0 | En proceso |
| 11 | Verificar DNS de GoDaddy, redirección entre dominio raíz y `www`, certificado TLS y HTTP→HTTPS. La raíz HTTPS respondió, pero no se verificó la configuración DNS completa ni `www`. No cambiar DNS en esta fase. | GoDaddy DNS y Render → Custom Domains. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |

## 4. Contenido institucional

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 12 | Entregar y aprobar nombre oficial, historia, misión, ubicación, datos institucionales y descripciones definitivas; reemplazar el contenido provisional. | Emisora y panel, cuando esté operativo. | ME CORRESPONDE A MÍ | P1 | Pendiente |
| 13 | Entregar logotipo y fotografías aprobadas con créditos, permisos y textos alternativos; comprobar visualización en escritorio, móvil y redes. | Equipo de la emisora y biblioteca multimedia. | ME CORRESPONDE A MÍ | P1 | Pendiente |
| 14 | Confirmar conductores, biografías, imágenes, categorías, redes, días y horarios; registrar programas reales y revisar la grilla. | Emisora y panel administrativo. | ME CORRESPONDE A MÍ | P1 | Pendiente |
| 15 | Entregar correo, teléfono, WhatsApp, dirección y perfiles sociales oficiales; probar enlaces. Decidir si se necesita un formulario: hoy no hay formulario activo. | Emisora, configuración del sitio y panel. | ME CORRESPONDE A MÍ | P1 | Pendiente |

## 5. Radio en vivo

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 16 | Confirmar o contratar proveedor; entregar URL HTTPS y formato/códec; probar reproducción y reconexión en móviles y computadoras. La web actualmente indica que el streaming no está configurado. | Proveedor de streaming y configuración de la emisora. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 17 | Confirmar zona horaria y grilla. Si se desea mostrar canción/programa al aire, verificar disponibilidad de metadatos del proveedor y autorizar integración. | Proveedor y equipo de programación. | REQUIERE MI AUTORIZACIÓN | P2 | Pendiente |

## 6. Panel administrativo

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 18 | Decidir si el módulo de usuarios de solo lectura y el procedimiento externo de claims son suficientes o si se requiere otra herramienta privilegiada. No permitir asignación de roles desde cliente. | Panel y Firebase Authentication. | REQUIERE MI AUTORIZACIÓN | P1 | Requiere verificación |
| 19 | Tras arreglar acceso/rutas, probar ciclo de noticias y programas: crear, editar, previsualizar, guardar borrador, publicar, despublicar y archivar; confirmar escritura real y mensajes de éxito solo tras confirmación del servidor. | Panel y Firebase staging primero. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente |
| 20 | Probar permisos efectivos por rol en cada módulo y reglas Firestore/Storage, más registros de actividad. Confirmar que el frontend no sea la única barrera. | Cuentas de prueba, Authentication, reglas y panel. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente |

## 7. SEO y posicionamiento

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 21 | Evaluar si el SEO de la SPA satisface rastreadores y previsualizaciones sin JavaScript. Decidir si hace falta prerender/SSR; probar metadatos en noticias reales después de habilitar rutas y Firestore. | `SeoHead.tsx`, Render y decisión de alcance técnico. | REQUIERE MI AUTORIZACIÓN | P1 | Requiere verificación |
| 22 | Verificar el dominio en Search Console y enviar sitemap canónico una vez corregido. Decidir si usar GA4; configurar ID real y avisos/consentimiento aplicables. | Google Search Console y propiedad de analítica de la emisora. | ME CORRESPONDE A MÍ | P2 | Pendiente |

## 8. Pruebas técnicas

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 23 | Probar reglas, lecturas públicas, borradores, escrituras denegadas, roles, Authentication, Storage y operaciones CRUD en Emulator Suite o staging. Las pruebas unitarias/build no validan reglas desplegadas. | Firebase Emulator Suite o proyecto staging. | LE CORRESPONDE AL DESARROLLADOR | P0 | Pendiente |
| 24 | Revisar enlaces, teclado, accesibilidad básica, rendimiento, carga de imágenes y reproducción en dispositivos/navegadores reales. La comprobación de anchos no sustituye pruebas físicas. | Dispositivos reales y entorno de prueba. | ME CORRESPONDE A MÍ | P1 | Pendiente |
| 25 | Decidir si se requiere formulario de contacto. Si se autoriza, conectarlo a un servicio real con protección anti-spam y verificar respuesta del servidor antes de mostrar éxito. | Emisora y servicio aprobado; implementación del desarrollador. | REQUIERE MI AUTORIZACIÓN | P1 | Pendiente |

## 9. Lanzamiento oficial

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 26 | Aprobar aviso legal, privacidad, términos, cookies cuando corresponda y derechos sobre música, fotografías, marcas y contenido de terceros. Los textos actuales son preliminares. | Emisora y asesoría legal apropiada. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 27 | Autorizar publicación solo después de cerrar bloqueadores, probar rutas/dominio/Firebase/roles/contenido/streaming/legal y registrar plan de reversión. | Responsable propietario, Render y Firebase. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente |

## 10. Mantenimiento posterior

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 28 | Acordar política de respaldos de Firestore y Storage, responsable, retención y costo; probar restauración en staging y revisar integridad de referencias a archivos. | Firebase/Google Cloud y entorno de staging. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |
| 29 | Nombrar responsables editoriales y de acceso; definir alertas, revisión de costos/cuotas, logs, incidentes y actualizaciones periódicas. | Equipo de la emisora, Firebase, Render y proveedor de streaming. | ME CORRESPONDE A MÍ | P2 | Pendiente |

## Tareas nuevas de Fase 1

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 30 | En el servicio existente, cambiar cualquier acción Redirect de rutas SPA a Rewrite. Producción respondió `301 Location: /index.html`; el app React entonces interpreta `/index.html` y presenta su 404. Reprobar las seis rutas tras guardar la regla. | Render Dashboard → Static Site → Redirects/Rewrites; `render.yaml`. | ME CORRESPONDE A MÍ | P0 | Pendiente; confirmado nuevamente en 2026-11-09: `curl` obtiene 301 para `/admin/login`, `/admin` y `/noticias`; requiere corrección en el servicio existente |
| 31 | Canonical raíz, `robots.txt` y sitemap de producción observados usan `continental997.fm`; aún falta deploy/verificación tras cambiar Rewrite. Confirmar también sitemap editorial cuando se resuelva Firestore, y canonical/noindex correctos en contenido existente y no existente. | Render → Environment / Events; dominio `continental997.fm`. | ME CORRESPONDE A MÍ | P0 | En proceso |
| 32 | Diagnosticar el `PERMISSION_DENIED` de Firestore sin modificar reglas: confirmar proyecto y reglas desplegadas, revisar la estructura/valores reales de categorías y publicaciones, y validar la misma consulta en staging. No relajar permisos ni cambiar datos en producción sin autorización. | Firebase Console / staging; comparar con `firestore.rules` y filtros del sitemap. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |
| 33 | Estrategia autorizada: prerender estático de noticias/programas publicados. Se implementó la generación de páginas por slug con metadatos/canonical y contenido de texto seguro; se quitaron rewrites wildcard para que slugs no generados no devuelvan la SPA. Falta que Firestore permita las consultas anónimas y probar el deploy/rutas en Render. | Build `npm run deploy:prepare`; Render Static Site; Firestore público y solo lectura. | LE CORRESPONDE AL DESARROLLADOR / ME CORRESPONDE A MÍ | P0 | En proceso |
| 34 | En Render, comparar `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_API_KEY` del build con el proyecto web real en Firebase Console. Confirmar que frontend y script usan el mismo Project ID; revisar variables sin copiar credenciales al chat. | Render → Environment; Firebase Console → Project settings → General; build output/configuración. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 35 | Tras confirmar el proyecto, diagnosticar en Firebase Emulator/staging: reglas desplegadas, lectura de consulta exacta por visitante, documentos y campos (`status`, `isArchived`, `slug`), y resultado HTTP/código completo. Confirmar índices; un índice ausente suele ser `FAILED_PRECONDITION`, mientras el `403 PERMISSION_DENIED` apunta a API/IAM/reglas/proyecto no equivalente. No cambiar reglas/datos productivos sin autorización. | Firebase Console, Emulator/staging, `firestore.rules`, `firestore.indexes.json`, `scripts/generate-sitemap.mjs`. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente |

## Segunda intervención — diagnóstico, decisión y despliegue

### A. Soft 404: evidencia y alternativas

Prueba pública de esta revisión (2026-11-07, reconfirmada el 2026-11-09): los paths solicitados reciben HTTP 301 hacia `/index.html`; tras cargar la SPA, React muestra “Página no encontrada” para rutas funcionales y slugs inexistentes. El canonical resultante también es `/404`. `curl` confirma `Location: /index.html`. Esto indica que las reglas efectivas del servicio desplegado están actuando como redirects, aunque el `render.yaml` local define rewrites. Un Rewrite debe entregar `index.html` manteniendo la URL solicitada.

Separado de ese defecto, una SPA estática sin contenido prerenderizado no puede contestar HTTP 404 para un slug dinámico al que Render aplica un rewrite. Las opciones son:

1. **Prerender estático por contenido publicado — recomendado para esta arquitectura.** Durante build, consultar solo publicaciones públicas, generar `dist/noticias/<slug>/index.html` y `dist/programas/<slug>/index.html` con contenido/canonical/SEO y bundle de cliente. Quitar rewrites wildcard para esas rutas; Render sirve los archivos válidos y devuelve 404 real cuando el archivo no existe. Mantener Rewrite para listados (`/noticias`, `/programas`) y `/admin/*`; el panel sigue siendo SPA. Ventajas: conserva Static Site, poco costo operativo, páginas crawlables y 404 HTTP real para slugs no generados. Desventajas: el 403 actual impide generar fichas; cada nuevo artículo/programa requiere redeploy para actualizar HTML/sitemap (se puede automatizar después con un deploy hook); debe cuidarse el escaping de contenido y el formato de Firestore. Riesgo/costo operativo bajo-medio, limitado a minutos de build y despliegues de contenido.
2. **SSR/servicio Node en Render.** Migrar la entrada React Router a renderizado en servidor y resolver slugs contra Firestore en cada solicitud; devolver status 404 desde servidor y renderizar `/admin` con el mismo shell cliente. Ventajas: contenido fresco sin redeploy por publicación, status HTTP exacto. Desventajas: adaptación sustancial del bootstrap/browser-only code, servicio persistente, monitorización, cold-start/latencia/costo y prueba cuidadosa de sesión/auth. Riesgo/costo alto.
3. **Backend/edge separado para rutas de contenido.** Mantener SPA y servir páginas editoriales desde una función/worker, usando Firestore con lecturas públicas o identidad de servicio restringida; las rutas administrativas siguen en Static Site. Ventajas: limita el cambio a las rutas públicas. Desventajas: segundo servicio/plataforma, routing/CORS/caché/observabilidad y potencial costo, más complejidad operativa. Riesgo/costo medio-alto.

El propietario autorizó la opción 1. Se implementó el prerender de páginas editoriales estáticas durante el build: crea `dist/noticias/<slug>/index.html` y `dist/programas/<slug>/index.html` solo para documentos `published` y `isArchived == false`, incluye canonical/metadatos y texto escapado (sin inyectar HTML editorial crudo), conserva el bundle SPA y elimina los rewrites wildcard para slugs. Los rewrites exactos de los listados y `/admin/*` se conservan. Se conserva el sitemap estático de respaldo si falla una consulta manual; en `deploy:prepare`, el modo `--require-editorial-prerender` genera los respaldos pero falla el build si no puede completar ambas consultas. Esto evita desplegar con fichas que se sabe que quedarían en 404. No se modificaron reglas ni datos de Firebase ni se desplegó a producción.

### B. Diagnóstico Firestore — hechos y pasos

- **Frontend:** `src/lib/firebaseConfig.ts` carga `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID` de variables de build.
- **Sitemap/prerender:** `scripts/generate-sitemap.mjs` carga `.env.production.local`, `.env.local`, `.env.production`, `.env` (sin reemplazar variables de proceso ya presentes) y utiliza `VITE_FIREBASE_PROJECT_ID`/`VITE_FIREBASE_API_KEY` para llamar `https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents:runQuery`. No usa Admin SDK ni autenticación privilegiada. Frontend y script quedan en el mismo proyecto solo si sus variables en el build son las mismas. El comando de despliegue ahora requiere que se consulten `posts` y `programs`; el 403 debe resolverse antes de que Render publique.
- **Entorno local:** en esta sesión no hay variables `VITE_*` relevantes ni archivos `.env` locales; solo existe `.env.example`, con valores Firebase vacíos. Por eso no se puede afirmar qué valores están configurados en Render.
- **Producción:** se observó en la aplicación pública `permission-denied`; el build de validación local también produjo 403 al consultar el endpoint REST. No se puede deducir el Project ID productivo ni inspeccionar reglas/datos/índices desplegados solo a partir de ese código de error. Las claves Firebase del cliente no eluden Firestore Rules.
- **Consulta del sitemap:** colecciones `posts` y `programs`; `status == "published"` AND `isArchived == false`, orden por `__name__` ascendente, límite 1000 y cursor. `createPublicEntries` valida esos campos otra vez y admite slugs `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- **Lectura en cliente:** las fichas buscan `slug == valor` AND `status == "published"` AND `isArchived == false` con límite 2; listados públicos también ordenan por `publishedAt`. Portada y ficha consultan además categorías/etiquetas publicadas. Las reglas fuente definen `isPublicRecord()` con igualdad exacta de status/archivado y lectura pública en colecciones editoriales; las escrituras exigen claims de editor/superadmin y borrado está denegado.
- **Índices fuente:** `firestore.indexes.json` declara compuestos para slugs de `posts`/`programs` con status e isArchived, y para status/isArchived/publishedAt en listados; comprobar que estén desplegados. El query REST de sitemap ordena por nombre; el error index missing debe verificarse por respuesta específica, no inferirse del 403.
- **Procedimiento de diagnóstico sin mutaciones:** (1) comparar Project ID y API key de Render con el app web de Firebase; (2) confirmar Firestore API habilitada y base `(default)` en ese proyecto; (3) exportar/leer la versión de reglas desplegadas y compararla con el repo; (4) en Emulator/staging ejecutar exactamente la consulta visitante con los mismos filtros y campos; (5) revisar documentos publicados y campos tipados boolean/string, categorías y slugs; (6) confirmar índices de cliente en consola; (7) guardar código y respuesta del error. No copiar API keys/tokens a logs compartidos. No escribir ni cambiar reglas en producción sin autorización.

### C. Configuración a aplicar en el servicio Render existente

- **Build Command:** `npm ci --include=dev && npm run deploy:prepare`
- **Publish Directory:** `dist`
- **Environment Variables:** `VITE_SITE_URL=https://continental997.fm`; `VITE_FIREBASE_PROJECT_ID` del proyecto confirmado `radio997-d5380`; completar `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` desde la aplicación web del mismo proyecto; `VITE_USE_FIREBASE_EMULATORS=false`. No poner secretos/Admin SDK en variables `VITE_*`.
- **Redirects/Rewrites:** acción **Rewrite**, nunca Redirect, para rutas SPA; no usar regla global `/*`. Mantener rewrite exacto `/noticias`, `/programas`, `/programacion`, `/admin` y los paths estáticos restantes del manifiesto. `/admin/login` y `/admin/recuperar` entran bajo `/admin/*`. No configurar `/noticias/*` ni `/programas/*`: esos directorios se sirven como archivos prerenderizados y el host debe devolver 404 si no existe el slug.
- **No crear otro servicio ni cambiar DNS.** Verificar después de guardar con `curl -i` que una ruta SPA devuelve `200` sin `Location: /index.html`, y que la URL final del navegador conserva el path.

### D. Estado de pruebas de producción

El dominio raíz devuelve 200; `robots.txt` y sitemap devuelven 200 y señalan `https://continental997.fm`; canonical de raíz coincide. En la comprobación HTTP más reciente, las ocho rutas públicas/admin y slugs desconocidos probados aún redirigen a `/index.html` con 301; robots y sitemap responden 200. Esos resultados son de producción anterior a estos cambios y no validan los archivos prerenderizados. No se pudo obtener evidencia de un slug válido porque Firestore deniega lecturas. El deploy activo no se puede asociar a un SHA específico con acceso público únicamente; en Render Dashboard verificar el commit desplegado y aplicar Rewrite.

## Evidencia registrada en esta actualización

- El Static Site público en `https://continental997.fm/` respondió por HTTPS, pero en la comprobación anterior las rutas directas probadas devolvieron 404. La configuración de Render no se puede aplicar desde este repositorio.
- El sitio público observado todavía entregaba canonical y `robots.txt` con `https://radiocontinental99-7.onrender.com`; el sitemap contenía únicamente rutas estáticas. En la portada, Firestore informó `permission-denied` al cargar `categories`.
- El código fuente del sitemap filtra por `status == "published"` e `isArchived == false`, valida slugs y tiene fallback con warning a rutas estáticas ante un error de consulta. La regla fuente de Firestore expresa la misma condición de lectura pública. La consola, reglas realmente desplegadas y documentos reales no son verificables desde el repositorio.
- En esta fase `npm run deploy:prepare` pasó con configuración local de validación y el sitemap produjo las 10 rutas estáticas con el dominio canónico; las consultas de Firestore recibieron 403 porque no se usó la configuración de producción y ejercitaron el fallback. `npm test` pasó 6/6 y `npm run lint` terminó con código 0, con advertencias.
- En esta fase no se cambiaron DNS, reglas Firebase ni documentos de producción.
- El propietario autorizó prerender estático. `npm test` pasa 9/9; `npm run build` pasa con TypeScript y Vite; `npm run lint` termina con código 0 y conserva advertencias preexistentes. `npm run deploy:prepare` no pudo validarse localmente porque faltan las seis variables `VITE_FIREBASE_*` requeridas por el chequeo de configuración. Antes de esta actualización, el mismo comando había encontrado 403 de Firestore en el entorno de validación.
- El modo estricto del build solo publica si ambas consultas se completan; ante fallo conserva sitemap/robots estáticos para diagnóstico, pero devuelve error para impedir deploy con páginas dinámicas ausentes. Para lanzar, el propietario debe verificar proyecto/variables y reglas de lectura pública sin permitir escrituras, cambiar Redirect a Rewrite en el servicio Render existente, y luego autorizar/verificar despliegue.

## Fase 1 — tercera intervención: diagnóstico Firestore (2026-11-09)

### Resultado y límites de verificación

- **Configuración del cliente:** `src/lib/firebaseConfig.ts` carga las seis variables `VITE_FIREBASE_*` y `src/lib/firebaseApp.ts` inicializa Firebase solo si todas tienen valor. El cliente y el generador usan el mismo nombre de variable `VITE_FIREBASE_PROJECT_ID`, pero no se pudo afirmar que apunten al mismo proyecto efectivo: en el entorno local no existe un `.env` con valores ni están definidas variables del proceso; la configuración efectiva de Render no es visible desde el repositorio. El proyecto `radio997-d5380` fue proporcionado anteriormente por el propietario; eso no demuestra que Render lo tenga configurado actualmente.
- **Generador:** `scripts/generate-sitemap.mjs` consulta la API REST de Firestore en `projects/{VITE_FIREBASE_PROJECT_ID}/databases/(default)` y adjunta `?key=...` si `VITE_FIREBASE_API_KEY` está disponible. No usa Firebase Admin ni una cuenta de servicio. Lee `.env.production.local`, `.env.local`, `.env.production` y `.env`, respetando variables de proceso preexistentes.
- **Prueba reproducible, con limitación:** se envió desde este entorno una consulta REST anónima para `posts` al proyecto `radio997-d5380`, sin API key porque no está disponible localmente. La respuesta fue HTTP 403 `PERMISSION_DENIED`, mensaje `Missing or insufficient permissions.` Esta prueba confirma que el endpoint de ese proyecto no permitió esa petición anónima concreta, pero **no es idéntica al build de Render** si Render sí adjunta su API key. No permite distinguir por sí sola entre reglas realmente desplegadas, proyecto/base seleccionados, requisitos de la petición de la aplicación o una configuración diferente de Render. No se consultaron datos privados ni se realizó ninguna escritura.
- **Evidencia histórica diferenciada:** en un log anterior el servicio respondió `SERVICE_DISABLED` indicando que `firestore.googleapis.com` no se había usado o estaba deshabilitado en `radio997-d5380`. En el sondeo actual la respuesta fue `PERMISSION_DENIED` genérico, no `SERVICE_DISABLED`. Esto sugiere que el error anterior de API deshabilitada pudo cambiar, pero solo el estado actual de Google Cloud Console confirma si la API sigue habilitada.
- **Causa exacta:** aún no determinada. El 403 actual es compatible principalmente con reglas efectivas que no permiten esa lectura, proyecto/base equivocada o diferencia entre la petición de prueba y la aplicación. La falta de variables local es un problema de configuración local confirmado, pero no demuestra que sea la causa del 403 que vio Render. Un índice faltante es menos probable: normalmente Firestore informa `FAILED_PRECONDITION` (habitualmente HTTP 400) y no `PERMISSION_DENIED`; debe evaluarse con el error de una consulta ejecutada con la configuración efectiva.

### Consultas, reglas fuente e índices

- Las colecciones consultadas para prerender y sitemap son exactamente `posts` y `programs`.
- En ambas se filtra `status == "published"` y `isArchived == false`, se ordena por `__name__` ascendente y se pagina con límite 1000 y cursor de nombre de documento. El generador vuelve a validar los dos valores y el slug (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) antes de escribir sitemap o HTML. El cliente también consulta slugs con `slug == valor`, `status == "published"`, `isArchived == false`; sus listados ordenan por `publishedAt` y pueden incluir filtros editoriales.
- Las reglas fuente en `firestore.rules` definen `isPublicRecord()` como `resource.data.status == 'published' && resource.data.isArchived == false`. El `match /{collectionName}/{documentId}` permite lectura pública de documentos de colecciones editoriales cuando `isPublicRecord()` se cumple; para otras lecturas editoriales exige `isEditor()`. Las escrituras requieren claims/validaciones de editor o superadministrador; `allow delete: if false`. Por tanto, según **el archivo fuente**, el visitante anónimo puede ejecutar consultas cuyos resultados estén limitados a publicados y no archivados, sin autenticación. Firestore Rules no son filtros: los filtros de consulta deben implicar exactamente la condición que la regla permite.
- Los permisos anteriores describen únicamente `firestore.rules` local. No se pudo leer la versión desplegada en Firebase Console ni los documentos reales. Si las reglas activas difieren, ese desfase debe confirmarse antes de considerar un cambio. No se detectó una regla fuente que conceda lectura/escritura pública indiscriminada.
- `firestore.indexes.json` contiene índices para los listados ordenados por `publishedAt` y para búsquedas por slug; no contiene un índice compuesto explícito que mencione `__name__` para la consulta REST del sitemap. La respuesta observada es 403, no el error típico de índice. No se propone añadir un índice sin ejecutar primero la consulta real con la configuración de producción y revisar el error específico.

### Propuesta segura, sin aplicar cambios

1. No cambiar las reglas si la versión desplegada coincide con el código fuente descrito. La regla de lectura necesaria para visitantes es exactamente `resource.data.status == 'published' && resource.data.isArchived == false`, aplicada solo a las colecciones editoriales; no añadir `allow read: if true` ni ningún permiso de escritura anónimo.
2. Si Firebase Console muestra reglas desplegadas distintas, comparar y revisar el diff con el propietario; una eventual publicación de reglas requiere autorización explícita. Mantener intactas las restricciones de claims para crear/editar y el `allow delete: if false`.
3. Si la regla desplegada coincide, verificar que `firestore.googleapis.com` esté habilitada, que el build use el Project ID correcto y la base `(default)`, y que la petición real incluya la API key pública de la aplicación web seleccionada. La API key de Firebase identifica la app/proyecto; no sustituye reglas ni es una credencial privilegiada.
4. Si las reglas activas y el proyecto coinciden, revisar tipos/valores reales de campos (`status` string `"published"` e `isArchived` boolean `false`), colección y base; después comprobar el error exacto por índice. No editar documentos automáticamente ni abrir permisos.

### Variables y acciones del propietario

Las seis variables son `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID`.

- **Local:** crear `.env` ignorado por Git a partir de `.env.example` y cargar los valores de la aplicación web que se confirmó en Firebase Console → Project settings → General. No enviar el archivo ni sus valores por chat.
- **Render:** en el servicio existente → Environment, establecer las seis variables desde la misma aplicación web/proyecto; definir también `VITE_SITE_URL=https://continental997.fm` y `VITE_USE_FIREBASE_EMULATORS=false`. Guardar y usar la función de redeploy solo cuando el propietario autorice el despliegue; no se realizó en esta intervención.
- **Sitemap/prerender:** el script lee las variables anteriores desde el entorno del proceso o los archivos `.env*` mencionados. El build necesita el mismo `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_API_KEY` que el cliente. No se requiere Admin SDK ni clave privada.
- **Comprobación personal en Firebase Console:** (a) seleccionar `radio997-d5380` y confirmar que es el proyecto de producción; (b) habilitar/verificar Cloud Firestore API y la base `(default)`; (c) revisar el historial/reglas activas y compararlas con `firestore.rules`; (d) abrir los documentos editoriales y confirmar los nombres y tipos de campo sin modificar datos; (e) confirmar que los índices estén listos; (f) no pegar API keys ni credenciales en el chat.

### Pruebas necesarias para cerrar el diagnóstico

1. Con las variables correctas en el entorno local privado o en un build de staging, registrar únicamente el Project ID (no la API key) y ejecutar las consultas equivalentes de `posts` y `programs`; conservar status y cuerpo del error, redactando cualquier valor sensible.
2. Confirmar que `posts`/`programs` contienen resultados públicos solo con `published` y `isArchived == false`; verificar que borradores/archivados no sean retornados.
3. Con Authentication Emulator o cuenta anónima de prueba, comprobar lectura pública permitida, lectura de borrador denegada, creación/edición/borrado anónimos denegados, y operaciones editoriales autorizadas según claims en staging. No probar mutaciones en producción.
4. Ejecutar `npm run deploy:prepare` en entorno con configuración de producción/staging, confirmar páginas prerenderizadas y sitemap, y probar el acceso directo a slugs publicados e inexistentes después de un deploy autorizado.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 36 | Confirmar diagnóstico de Firestore con la configuración real: comparar Project ID/API key del servicio Render, estado de Firestore API y base `(default)`, reglas desplegadas, campos e índices. La prueba local al proyecto informado devolvió 403 sin API key y no puede identificar por sí sola la causa de Render. | Firebase Console, Render Environment y entorno de staging; no compartir claves. | ME CORRESPONDE A MÍ | P0 | Requiere verificación |

No se modificaron reglas, índices, datos, configuración de Render, archivos de entorno ni Firebase. No se hizo commit, push ni deploy. La causa exacta queda pendiente de la comparación por el propietario; no se aplicó una corrección.

## Fase 1 — cuarta intervención: propuesta de reglas Firestore (2026-11-09)

### Evidencia nueva proporcionada por el propietario

El propietario confirmó que el proyecto de producción es `radio997-d5380`, que Render tiene ese Project ID, las seis variables `VITE_FIREBASE_*` y que Firestore usa `(default)`. También informó que las reglas actualmente publicadas son una política global que niega todo (`allow read, write: if false`). Esa política explica directamente el HTTP 403 para las lecturas anónimas. Estos datos de consola se registran como confirmación del propietario; no se accedió a Firebase Console para verificarlos independientemente.

### Reglas candidatas y revisión de acceso

El archivo fuente existente [`firestore.rules`](../firestore.rules) se revisó completo y es la propuesta candidata; no requirió cambios. La diferencia respecto a las reglas de producción informadas es reemplazar la denegación global por bloques explícitos de acceso limitado:

- **Posts y programas:** lectura pública solo cuando `resource.data.status == 'published'` y `resource.data.isArchived == false`. Las consultas públicas de sitemap/listados/detalle incluyen filtros que implican esas mismas condiciones. La regla no permite que una query sin esos filtros lea contenido privado.
- **Otras colecciones editoriales:** categorías, tags y schedule publicados también son legibles por visitantes porque la web pública los consume. `media` requiere además `visibility == 'public'`; `banners` solo se leen si son publicados y no archivados.
- **Panel:** los claims confiables `editor` o `superadmin` junto con `email_verified == true` permiten lecturas administrativas de contenido, incluidos borradores. Media y banners quedan bajo superadministrador. El código de autenticación lee claims del token; perfiles `users` no son autoridad de rol.
- **Datos internos:** `users` solo permite lectura del propio perfil o de superadmin y deniega cualquier escritura; `privateConfig` es legible por superadmin y no admite escrituras; `adminLogs` es legible solo por superadmin, permite crear logs al editor verificado y deniega actualizar/borrar.
- **Escrituras:** crear/editar requiere rol y validación de esquema, campos, estado, timestamps y UID. Borrado de documentos editoriales está denegado. No hay `allow read/write` público global.
- **Colecciones no reconocidas:** el match final deniega lectura/escritura.

La regla `isPublicRecord()` se aplica mediante un match editorial limitado al conjunto de colecciones nombrado; no expone automáticamente colecciones desconocidas. La lectura privada de contenido se permite a roles editoriales verificados según el diseño existente. La escritura está más restringida que la lectura, y el rol editor no puede administrar medios o banners.

### Compatibilidad revisada de consultas

- **Prerender/sitemap:** `posts` y `programs`; `status == published`, `isArchived == false`, `orderBy(__name__, asc)`, páginas de hasta 1000.
- **Listados y búsqueda:** `listPublished` y `listPublicContentPage` filtran publicación/archivo; pueden añadir `publishedAt`, `searchTerms`, categoría o etiquetas y ordenar por fecha.
- **Detalle:** `findPublishedBySlug` filtra `slug`, publicación y archivo, límite 2.
- **Programación y datos públicos:** `schedule` publicado/no archivado; horarios de programa también filtran `programId`. Configuración pública lee solo `publicConfig/site`.
- **Panel:** `listAdminRecords`, conteos, búsqueda de duplicados, control de horarios y transacciones usan credenciales autenticadas; `isEditor()`/`isSuperadmin()` permiten lectura autorizada. Usuarios y actividad administrativa consultan `users`/`adminLogs` solo desde las funciones de superadmin.
- El archivo `firestore.indexes.json` declara índices compuestos usados por listados, búsqueda y slugs. La suite del Emulator puede validar autorización pero no certifica que los índices estén desplegados en producción; confirmarlos por separado en Firestore Console. No se añadió índice por suposición.

### Suite de reglas preparada y resultado

Se añadió [`scripts/firestore-rules.emulator.mjs`](../scripts/firestore-rules.emulator.mjs), con seis casos de prueba para lectura anónima filtrada de posts/programs, rechazo de borradores/archivados, denegación de escrituras anónimas, permisos limitados del editor, bloqueo de cuentas no verificadas/sin rol y acceso del superadmin. La prueba pública incluye los filtros/orderBy del sitemap, listado y consulta de slug. La dependencia `@firebase/rules-unit-testing` 4.0.1 es compatible con Firebase JS SDK 11.

Comando de validación local (requiere Firebase CLI, Java 21 y emulador Firestore):

```sh
firebase emulators:exec --only firestore --project demo-radio-rules "node --test scripts/firestore-rules.emulator.mjs"
```

**No se pudieron ejecutar los casos de reglas en esta máquina:** el CLI local es 14.17.0, pero Java no está instalado/disponible (`Could not spawn java -version`). No se reportan como pasados; se deben ejecutar en un entorno con Java 21. Pruebas que sí pasaron: `node --check scripts/firestore-rules.emulator.mjs`, `npm test` (9/9), `npm run build`; `npm run lint` termina con código 0 y muestra advertencias. No se intentó despliegue.

### Pasos de publicación — solo después de autorización

1. Instalar Java 21 y Firebase CLI si faltan; ejecutar primero el comando Emulator anterior.
2. En Firebase Console, seleccionar `radio997-d5380` → Firestore Database → Rules; comparar la política activa de denegación global con `firestore.rules` del repositorio. Confirmar que el proyecto y base sean correctos.
3. Revisar la propuesta completa, especialmente roles, `publicConfig`, `users`, `privateConfig`, `adminLogs` y denegación de borrado. No combinarla con `allow read/write: if true`.
4. Publicación desde CLI, explícitamente no ejecutada:

```sh
firebase deploy --only firestore:rules --project radio997-d5380
```

   En la consola también se puede pegar el contenido de `firestore.rules` en Rules y pulsar **Publish**. No publicar desde Console y CLI ambos; elegir un solo método y confirmar antes de publicar.
5. Después de una autorización y publicación, volver a probar con visitantes: lectura de publicados permitida; borrador/escrituras/borrado denegados. Probar editor, superadmin y usuario sin rol con cuentas de prueba verificadas, y confirmar el build en staging antes de cualquier producción.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 37 | Validar en Firestore Emulator la política candidata `firestore.rules` y revisar en Firebase Console que la regla de producción sigue siendo la denegación global reportada. Emulator completado; la revisión actual de la consola y cualquier publicación siguen pendientes de mi autorización. | `scripts/firestore-rules.emulator.mjs`; Firebase CLI/Java 21; proyecto `radio997-d5380` solo para revisión. | LE CORRESPONDE AL DESARROLLADOR / REQUIERE MI AUTORIZACIÓN | P0 | Emulator validado; consola pendiente |

Se modificó localmente `firestore.rules` para reducir la evaluación redundante de validaciones por colección, después de que la primera prueba del Emulator detectara el límite de 1000 expresiones al crear multimedia como superadministrador. Se conservaron las validaciones y permisos; la suite posterior pasó. No se modificaron índices, datos, usuarios, claims ni servicios Firebase. Las reglas no se publicaron. No hubo commit, push, despliegue Render ni avance a Fase 2.

## Fase 1 — quinta intervención: pruebas de seguridad Firestore (2026-11-09)

### Entorno comprobado

- Node.js `v20.18.0`, npm `10.8.2`.
- Firebase CLI `14.17.0`, disponible como `firebase.cmd`.
- Eclipse Temurin JDK `21.0.13+9` quedó instalado mediante Winget (`EclipseAdoptium.Temurin.21.JDK`). Se verificaron `java -version`, `javac -version` y `where.exe java`/`where.exe javac` al agregar la carpeta `bin` al `PATH` únicamente en el proceso PowerShell de prueba. El instalador no dejó `java` disponible en el `PATH` de nuevas sesiones; no se modificaron variables persistentes/globales.
- Dependencias presentes: `firebase@11.10.0` y `@firebase/rules-unit-testing@4.0.1`. No hay instalación local de `firebase-tools`; se usa el CLI disponible en el entorno.
- `firebase.json` apunta a `firestore.rules` y `firestore.indexes.json`; declara Firestore Emulator en el puerto `8080`. El proyecto de las pruebas es `demo-radio-rules`; no se selecciona producción.
- La política candidata local tuvo un ajuste de eficiencia descrito abajo; ninguna regla se publicó en Firebase.

### Calidad y cobertura de pruebas

Se amplió [`scripts/firestore-rules.emulator.mjs`](../scripts/firestore-rules.emulator.mjs) para usar el `initializeTestEnvironment` de Firebase Rules Unit Testing, cargar reglas desde `firestore.rules` y poblar datos artificiales únicamente dentro del Emulator, bajo `withSecurityRulesDisabled`. La suite comprueba:

1. Lectura anónima filtrada de posts y programas publicados/no archivados.
2. Denegación de consultas amplias sin filtros, documentos draft y documentos archivados.
3. Denegación anónima de creación, actualización y eliminación.
4. Permisos del editor verificado para crear/leer/editar contenido y crear audit log; denegación de colecciones solo superadmin, datos privados y borrado.
5. Denegación de escritura para usuario no verificado y usuario sin rol; denegación de lectura de perfil ajeno y de cambios de rol/perfil.
6. Lecturas y operaciones de superadmin, manteniendo eliminación denegada.
7. Queries de prerender/sitemap (`status`, `isArchived`, `__name__`), listados con `publishedAt`, búsquedas `searchTerms` y consultas de ficha por slug para ambas colecciones.

El dataset se crea dentro del Emulator `demo-radio-rules`; no se usa el proyecto real `radio997-d5380`, ni Firebase Console ni credenciales productivas. Las consultas y las reglas de seguridad se prueban juntas. La suite no certifica que los índices estén desplegados en producción.

### Ejecución y resultado

Se intentó ejecutar:

```powershell
firebase.cmd emulators:exec --only firestore --project demo-radio-rules "node --test scripts/firestore-rules.emulator.mjs"
```

La primera ejecución pudo arrancar el Emulator, pero falló una prueba de superadministrador al crear un documento multimedia: la regla alcanzaba el límite de 1000 expresiones por las comprobaciones de esquema redundantes. Se refactorizó localmente `hasAllowedFields` y `validRecord` para seleccionar la validación correspondiente a cada colección, sin cambiar permisos ni campos validados. Luego se ejecutó:

```powershell
$jdk = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot'
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"
firebase.cmd emulators:exec --only firestore --project demo-radio-rules "node --test scripts/firestore-rules.emulator.mjs"
```

Resultado: **6 pruebas aprobadas, 0 fallidas**. Se validaron lecturas públicas filtradas, borradores/archivados privados, escrituras y eliminaciones anónimas denegadas, permisos de editor/superadministrador, usuario ordinario/no verificado, manipulación de roles y consultas de listado, búsqueda y ficha por slug. El Emulator identificó el proyecto `demo-radio-rules`; no se usó `radio997-d5380` ni se contactó Firebase de producción. Los mensajes `PERMISSION_DENIED` esperados corresponden a aserciones de denegación.

La suite no certifica que los índices requeridos estén desplegados en producción. La ubicación del JDK se debe añadir temporalmente a `JAVA_HOME`/`PATH` en cada nueva sesión que necesite ejecutar Firebase Emulator; no se hicieron cambios persistentes de entorno.

No se modificaron índices, Firebase de producción, usuarios, claims, datos, Render, Git remoto ni variables de entorno persistentes. No se hizo commit/push/deploy. Las reglas candidatas ya pasaron Emulator, pero la revisión de producción y la autorización de publicación siguen pendientes.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 38 | Instalar/preparar JDK 21, añadirlo temporalmente al `PATH` de PowerShell y ejecutar la suite `firebase emulators:exec` con `demo-radio-rules`; verificar todos los escenarios antes de solicitar aprobación de publicación. | Eclipse Temurin JDK 21, Firebase CLI y `scripts/firestore-rules.emulator.mjs`. | ME CORRESPONDE A MÍ | P0 | Completada; 6/6 pruebas pasaron |

## Fase 1 — sexta intervención: revisión final para reglas de producción (2026-11-09)

### Revisión del cambio de reglas y pruebas

- Se comparó el diff completo con la versión anterior en `HEAD`. El cambio de `validRecord` separa las validaciones por colección y elige una rama mediante operador condicional; mantiene `validBaseRecord`, `hasAllowedFields` y todos los validadores específicos. No se quitaron restricciones de campos ni se modificaron las funciones de rol, las coincidencias de colecciones, las condiciones de lectura/escritura o las reglas de configuración/usuarios/logs.
- Se confirmó en la fuente que no existe escritura anónima, la escritura de `users` sigue denegada, el borrado editorial sigue denegado, `privateConfig`/logs conservan protección y el acceso de editor/superadministrador sigue condicionado por claims y correo verificado.
- La inspección encontró que dos pruebas de actualización denegada podían fallar también por omitir `updatedAt`/`updatedBy`. Se corrigieron para enviar una actualización válida de esquema y ahora el Emulator demuestra la denegación de autorización sin ese falso positivo.
- Suite ejecutada otra vez con `demo-radio-rules`: **6 aprobadas, 0 fallidas**. Incluye consultas públicas reales (listado, búsqueda, slug y paginación), borradores/archivados, escrituras/borrados anónimos, editor verificado, superadministrador, usuario ordinario/no verificado y cambios de rol. Los documentos sintéticos se cargan solo dentro del Emulator.
- Esta suite es verificación de comportamientos representativos, no una prueba exhaustiva de cada campo/cada operación de cada colección; las verificaciones específicas de campos están en los validadores de reglas. El Emulator no valida disponibilidad de datos ni el estado de índices de producción.

### Verificación de producción e índices

- El cliente y el prerender leen `VITE_FIREBASE_PROJECT_ID`; el script construye la ruta REST de Firestore en `databases/(default)`. No hay `.env*` ni `.firebaserc` local. El proyecto objetivo `radio997-d5380` está reportado por el usuario como proyecto de producción y se mantiene explícito en las instrucciones de despliegue; no se pudo contrastar con una sesión autenticada desde este entorno.
- Intentos de solo lectura con `firebase projects:list` fallaron y `firebase firestore:databases:list --project radio997-d5380` devolvió **HTTP 401: credenciales OAuth inválidas/ausentes**. Por tanto no se verificó la existencia de `(default)`, `posts`, `programs`, documentos ni los tipos reales de campos. No se accedió ni se modificó producción.
- `firestore.indexes.json` es JSON válido y declara 28 índices compuestos. Hay índices de publicaciones por estado/archivado/fecha, búsqueda `searchTerms`, filtros por categoría/etiqueta, slug y vistas editoriales por `updatedAt`.
- El prerender usa filtros de igualdad `status == published` y `isArchived == false`, ordena por `__name__` ascendente y pagina con cursor. No aparece un índice compuesto explícito que copie exactamente esa combinación; la presencia/estado de índices automáticos o de merges en producción no se puede certificar con el Emulator ni con el acceso actual. No se publicaron índices. La respuesta real de Firestore (incluido el enlace de creación de índice si lo requiere) debe guiar cualquier cambio posterior.
- Los listados/búsquedas frontend cuentan con composites correspondientes en el archivo fuente; esto tampoco demuestra que estén desplegados o en estado `READY` en Firebase.

### Preparación controlada y bloqueos

- **No desplegar todavía**: antes se necesita iniciar sesión en Firebase CLI con una cuenta autorizada o completar manualmente la comprobación en Firebase Console. Confirmar proyecto `radio997-d5380`, base `(default)`, datos y campos (`status` string, `isArchived` boolean, `slug` string, `publishedAt` Timestamp), y estado `READY` de índices.
- Cuando haya autorización explícita y esas verificaciones pasen, el comando que limita el despliegue a reglas es:

```powershell
firebase deploy --only firestore:rules --project radio997-d5380
```

- El comando `firebase deploy --only firestore --project radio997-d5380` también incluye la configuración Firestore de índices; no es el comando apropiado si solo se autorizan reglas.
- Para comprobar después: confirmar el proyecto en el CLI; revisar en Console el contenido/versión desplegada de reglas; probar desde el sitio una lectura pública de documentos publicados; confirmar denegación para borrador y escritura anónima; probar editor y superadministrador con cuentas de prueba autorizadas; verificar que los índices estén `READY` y monitorizar errores de permisos.
- Reversión: antes del cambio, guardar la regla activa actual y su versión desde **Firestore → Rules → History**. Si aparece regresión, restaurar esa revisión en History o volver a desplegar un archivo con la versión previa usando `firebase deploy --only firestore:rules --project radio997-d5380`. La política anterior globalmente denegatoria detendría lecturas y escrituras de la aplicación; por eso no se debe publicar sin respaldo y plan de verificación.
- No se publicaron reglas ni índices; no se modificaron datos, usuarios o claims; no hubo commit/push ni despliegue Render.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 39 | Verificar directamente en producción el proyecto, la base `(default)`, existencia y esquema de documentos editoriales y estado de índices; solo después de disponer de acceso de lectura y autorización, decidir si se publica exclusivamente reglas. | Firebase Console / CLI autenticado; `radio997-d5380`; `firestore.rules`, `firestore.indexes.json`. | ME CORRESPONDE A MÍ | P0 | Bloqueada: CLI respondió HTTP 401; no verificado |

## Fase 1 — sexta intervención: investigación de Firestore vacío (2026-11-09)

### Hechos comprobados en el repositorio

- Firestore no tiene un proceso de seed, migración, bootstrap de colecciones o importación de datos de producción. `README.md` indica explícitamente que no hay seeds y que el contenido ilustrativo no se guarda automáticamente. `package.json` solo define build, tests, lint, sitemap y preparación de despliegue. Los únicos datos semilla encontrados están en `scripts/firestore-rules.emulator.mjs` y se escriben en el Emulator `demo-radio-rules` con `withSecurityRulesDisabled`; no se dirigen a producción.
- Firestore crea una colección implícitamente al confirmar el primer documento; el código no crea colecciones vacías. Índices/configuración tampoco crean documentos ni colecciones.
- El cliente inicializa Firebase desde las seis variables `VITE_FIREBASE_*` en `src/lib/firebaseConfig.ts`; no hay un `projectId` productivo hardcodeado. El prerender toma `VITE_FIREBASE_PROJECT_ID` y usa la API REST para `databases/(default)`. Las variables no están en archivos `.env*` locales. El usuario reportó previamente que Render usa `radio997-d5380`; no se pudo comprobar el valor actual en Render desde esta revisión. No se hallaron otras fuentes/proyectos de contenido en el código; los IDs de proyecto no productivos encontrados pertenecen a tests/demos.
- El usuario confirmó en Firebase Console que no aparecen colecciones y que `(default)` es la base seleccionada. No pudimos verificar esa observación independientemente: el CLI autenticado falló con HTTP 401 en la intervención anterior. Tampoco se verificaron documentos, datos, claims o configuración actual en Firebase.
- El usuario reportó reglas activas de producción con denegación global. Las reglas locales del repositorio no se aplican automáticamente a Firebase. Con la denegación global activa, las escrituras normales del panel no pueden crear documentos aunque la persona haya iniciado sesión; el SDK cliente no omite reglas.

### Inventario de colecciones y creación

| Colección / documento | Uso | Qué operación puede crear el primer documento |
|---|---|---|
| `posts` | Noticias y publicaciones | Superadministrador/editor verificado en el formulario de contenido mediante `createRecord`; genera también `adminLogs`. |
| `programs` | Catálogo de programas | Superadministrador/editor verificado mediante `createProgramWithSchedule` o duplicación; la creación habitual genera uno o más documentos `schedule` y `adminLogs`. |
| `schedule` | Emisiones asociadas a programas | Se crea junto con un programa, o desde el módulo de programación; también puede actualizarse/archivarse desde el panel. |
| `categories` | Clasificación editorial | Módulo Categorías, `createRecord`. Para crear programas el formulario necesita una categoría publicada; para posts la lista puede estar vacía, aunque la UI invita a crear categorías. |
| `tags` | Etiquetas | Módulo Etiquetas, `createRecord`; opcional para crear posts. |
| `media` | Metadatos de biblioteca; el archivo se carga aparte en Firebase Storage | Biblioteca Multimedia, solo superadministrador; `uploadMedia` sube primero el archivo privado y luego `createRecord` crea su documento Firestore. |
| `banners` | Banners publicitarios | Módulo Banners, solo superadministrador, `createRecord`. |
| `publicConfig` (`site`) | Configuración pública de emisora | Formulario Configuración; `updatePublicSiteConfig` hace `transaction.set` y puede crear el singleton si no existe. La configuración de stream y metadatos depende de que se complete. |
| `adminLogs` | Registro informativo de operaciones | Se escribe junto con transacciones de creación/edición/archivo; no necesita seed manual. Las reglas permiten crear logs con identidad/acción validadas y deniegan update/delete. |
| `users` (`{uid}`) | Perfiles privados para el módulo de usuarios | No hay un creador de perfiles Firestore en cliente. Authentication y custom claims se administran externamente; escritura `users` está denegada en reglas. El módulo solo lista/lee. |
| `privateConfig` | Datos privados futuros | No tiene uso de lectura/escritura en los servicios cliente actuales ni inicializador; no es necesaria para arrancar. Las reglas cliente deniegan escritura. |

### Reglas comparadas con formularios

- **Posts:** las reglas exigen `title`, `slug`, `excerpt`, `body`, `categoryIds`, `tagIds`, `heroMediaId` y `authorUid`. `AdminContentPage` envía esos campos (incluye listas vacías y `heroMediaId: null` cuando no se eligen opciones), más `authorName`, `seoTitle`, `seoDescription` y `status`; `createRecord` sanea `body`, calcula `searchTerms`, y agrega `isArchived`, timestamps y UID de auditoría. `publishedAt` se agrega como server timestamp al publicar. Todo encaja con los tipos/campos permitidos de `firestore.rules`.
- **Programs:** las reglas exigen `title`, `slug`, `description`, `categoryId`, `hostNames`, `imageMediaId` y `durationMinutes`. El formulario envía todos, incluso `imageMediaId: null` y `durationMinutes: null` si no se configuran; el servicio agrega `searchTerms`, estado, `isArchived`, timestamps, UID y `publishedAt` cuando corresponde. La programación semanal se escribe con `programId`, día, horario y zona horaria. No encontramos una incompatibilidad de campos entre estos formularios/servicios y las reglas locales.
- `validBaseRecord` exige timestamps Firestore (`createdAt`, `updatedAt`, y `publishedAt` cuando el estado es `published`), booleano `isArchived` y campos de auditoría. Los servicios escriben timestamps del servidor. El formulario no debe enviar directamente estos campos del sistema.
- El primer bloqueo operativo no es un mismatch de esquema: son las reglas de producción globalmente denegatorias reportadas y la ausencia de datos/seed. Aun si se publicaran las reglas locales, la creación de programa requiere una categoría publicada preexistente. Para publicar la primera noticia, las categorías pueden ser vacías; el formulario permite listas de categorías y etiquetas vacías.
- Riesgo relacionado: la carga de medios ocurre antes de la escritura Firestore. Con las reglas productivas actuales, puede quedar un objeto privado en Storage sin documento correspondiente si falla el paso Firestore. No borrar automáticamente esos objetos; revisar/limpiar solo mediante procedimiento autorizado.

### Causa probable, límites y procedimiento recomendado

- **Causa más probable (inferencia respaldada por el código):** la base está vacía porque Firestore no crea colecciones por anticipado y el proyecto no incluye proceso de carga inicial ni migración; además, las reglas de producción reportadas deniegan los writes que el panel necesitaría para crear el primer documento. Esta explicación es consistente con los hechos, pero no prueba el historial de uso del proyecto ni excluye que Render haya apuntado antes a otro proyecto.
- **Proyecto:** la arquitectura de código es coherente con el proyecto productivo cuando `VITE_FIREBASE_PROJECT_ID=radio997-d5380`; la configuración de aplicación y prerender usa esa variable. El valor productivo actual no se inspeccionó remotamente en Render ni se verificó con CLI, así que la coincidencia actual se apoya en la confirmación previa del usuario y requiere volver a confirmarse en el Dashboard antes de operar.
- No hace falta crear manualmente colecciones vacías. Procedimiento propuesto (no ejecutado): confirmar variables/`(default)`; revisar y autorizar por separado la publicación de reglas seguras; crear/verificar la cuenta y claim del superadministrador por el procedimiento privilegiado documentado; con reglas vigentes y usuario verificado, crear `publicConfig/site` desde Configuración y categorías/tags editoriales reales; registrar programas y sus horarios; ingresar posts; cargar medios/banners solo cuando se disponga de archivos y datos aprobados. Cada primer write crea su colección; `adminLogs` se crea automáticamente con las operaciones auditadas. No inventar registros de muestra en producción.
- Para un primer superadministrador con reglas globalmente denegatorias, no hay un bootstrap Firestore en el cliente. No cargar documentos mediante consola/Admin SDK para “arreglarlo” sin autorización, esquema confirmado, auditoría y revisión de reglas; Admin SDK omite las reglas.

### Pruebas y estado

- Verificados estáticamente los formularios, `src/services/content.ts`, `src/services/admin.ts`, reglas locales, configuración Firebase, scripts y documentación. Las pruebas previas de Emulator validan reglas con documentos sintéticos, no datos de producción.
- Pendiente: iniciar sesión autorizada en Firebase Console/CLI para comprobar proyecto y base, estado efectivo de reglas, campos de documentos, Storage huérfano, claims y configuración de Render. Dado el reporte de consola de que no hay colecciones, no existe muestra real de esquema para inspeccionar.
- No se creó ninguna colección/documento; no se modificaron reglas, índices, usuarios, Storage, Render ni datos; no hubo deploy, commit o push.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 40 | Confirmar en Firebase/Render la configuración productiva y, tras autorización independiente de reglas, establecer de forma controlada los primeros datos reales; no introducir seeds inventados. Revisar huérfanos de Storage y comprobar escrituras/consultas con el esquema aprobado. | `radio997-d5380`, `(default)`, Firebase Console/Render, `docs/AUDITORIA-INTEGRAL.md`, panel y reglas. | ME CORRESPONDE A MÍ / REQUIERE MI AUTORIZACIÓN | P0 | Investigación de código completada; producción e inicialización pendientes |

## Fase 1 — séptima intervención: provisionamiento inicial de superadministrador (2026-11-09)

### Estado comprobado de Authentication y roles

- El cliente inicializa Firebase Authentication con la misma configuración web tomada de `VITE_FIREBASE_*`. `src/services/auth.ts` implementa inicio de sesión Email/Password, recuperación/restablecimiento, verificación de correo, renovación de sesión y cierre de sesión. La persistencia es `browserLocalPersistence`.
- No se encontró formulario ni función de registro/alta pública. La cuenta inicial se debe crear externamente desde Firebase Console → Authentication → Users o mediante un operador privilegiado; README ya describe el alta manual en Console.
- Los únicos roles de aplicación son `superadmin` y `editor`, definidos como custom claims de Firebase Authentication. `getCurrentEditorialRole` lee `user.getIdTokenResult()` y reconoce claims booleanos `superadmin === true` o `editor === true`, dando prioridad a superadmin.
- `firestore.rules` exige además `email_verified == true`. `isSuperadmin()` requiere claim `superadmin`; `isEditor()` acepta superadmin o editor, ambos verificados. Las rutas administrativas aplican `AdminGuard` y `AdminRoleGate`, y los servicios verifican roles en cliente, pero la autorización de datos depende de las reglas del servidor.
- No existe en `src`, `scripts`, `package.json` o configuración del repositorio código que llame `setCustomUserClaims`, ni Cloud Function, backend de administración, script de provisioning o dependencia `firebase-admin`. El mecanismo actualmente documentado es una operación puntual fuera del repositorio con Firebase Admin SDK y credenciales privilegiadas.
- `AuthContext` escucha `onIdTokenChanged` y vuelve a calcular rol. La función `refresh()` ejecuta `reload()` y `getIdToken(true)` antes de volver a leer claims; por ello el titular puede actualizar la sesión sin publicar una versión nueva de la app. Cerrar sesión y volver a iniciar también obtiene token actualizado.
- No se halló un camino para que un usuario ordinario eleve su propio rol desde la aplicación: no hay registro público ni acción cliente para asignar claims; los perfiles `users` son de solo lectura y las reglas deniegan sus escrituras. Un titular controla su contraseña/correo, pero no puede fabricar un custom claim firmado por Firebase. El riesgo privilegiado residual es el compromiso/uso indebido de la identidad de operador con permisos IAM/Admin SDK.

### Procedimiento propuesto — aún no ejecutado

**Requisitos previos**

1. Aprobación del propietario del proyecto para crear la cuenta y otorgar privilegios. Confirmar por un canal administrativo el proyecto exacto `radio997-d5380` y el email institucional/propietario esperado; no incluir contraseña ni credenciales en este repositorio o chat.
2. Confirmar que Email/Password está habilitado, que los dominios autorizados y plantillas de correo están preparados, y que el proyecto/base se han verificado. Mantener separada esta tarea de la publicación de reglas: un claim no corrige la política globalmente denegatoria reportada.
3. Operador con permisos IAM mínimos para leer/actualizar usuarios de Firebase Authentication, desde Cloud Shell/entorno seguro con identidad de operador o service account administrada y Application Default Credentials. Evitar claves JSON persistentes; no poner Admin SDK ni credenciales en Vite, Render, archivos públicos, `.env`, repositorio o historial de shell.

**Creación, verificación y asignación**

1. Crear la cuenta desde Firebase Console → Authentication → Users (o dejar que un proceso administrativo autorizado la cree). Usar el email aprobado y entregar el flujo de establecimiento de contraseña por mecanismo seguro; no reutilizar ni compartir una contraseña temporal de forma insegura.
2. En la tabla de Authentication, copiar el UID exacto. El operador privilegiado debe consultar el usuario por UID con Admin SDK y detenerse si no existe, está deshabilitado, el email no coincide exactamente tras normalizar mayúsculas/minúsculas, o `emailVerified` no es `true`. Verificar proyecto antes de hacer cualquier escritura.
3. Registrar la revisión de identidad, UID, email verificado, actor, fecha y motivo en el canal de auditoría aprobado, sin registrar tokens, contraseñas ni credenciales.
4. Asignar `superadmin: true` solo al UID verificado aprobado. Para cambio de rol de un usuario existente, revisar primero todos sus claims actuales: `setCustomUserClaims(uid, claims)` reemplaza el mapa completo de custom claims, no agrega una clave automáticamente. Preservar explícitamente claims ajenos que sigan aprobados o, preferiblemente, hacer la operación de rol bajo una política de claims documentada; remover roles previos incompatibles si corresponde. No aceptar UID/email arbitrarios de usuarios finales.
5. Si posteriormente se provisionan editores, otorgar `editor: true` solo después de comprobar UID, email y verificación, con la misma operación privilegiada. Nunca crear un endpoint público o interfaz cliente para esta tarea.

Pseudocódigo de referencia (no es un script existente ni fue ejecutado; debe implementarse/revisarse y ejecutarse por un operador en un entorno confiable):

```js
const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'radio997-d5380',
})
const auth = getAuth(app)
const user = await auth.getUser(uid)

if (user.disabled) throw new Error('La cuenta está deshabilitada')
if (user.email?.trim().toLowerCase() !== approvedEmail.trim().toLowerCase()) {
  throw new Error('El UID no corresponde al correo aprobado')
}
if (user.emailVerified !== true) throw new Error('El correo no está verificado')

const existing = user.customClaims ?? {}
const claims = { ...existing, superadmin: true }
delete claims.editor
await auth.setCustomUserClaims(user.uid, claims)
```

La selección explícita de proyecto/credenciales y revisión de claims existentes deben preceder al pseudocódigo; la operación no debe automatizarse contra un proyecto recibido sin validar. Si la organización utiliza otros custom claims, el operador debe conservarlos solo tras aprobación. No ejecutar el ejemplo literalmente desde una máquina sin verificar la identidad de la aplicación Admin y las credenciales ADC.

**Activación y verificación de acceso**

1. El usuario inicia sesión en `/admin/login` y completa verificación de email. Después de asignar claim, forzar renovación con `AuthContext.refresh()` (que ya llama `getIdToken(true)`) o cerrar sesión y volver a ingresar.
2. Confirmar que `getIdTokenResult()` informa `superadmin: true` y `email_verified: true`; no compartir/publicar el token.
3. Confirmar acceso a una ruta superadmin como `/admin/configuracion` y que el encabezado muestre “Superadministrador”. Un editor debe seguir sin acceso a rutas exclusivas.
4. La comprobación funcional de escrituras Firestore debe realizarse solo después de revisar/publicar reglas con autorización independiente. Mientras producción mantenga `allow read, write: if false`, el usuario correctamente autenticado seguirá sin poder leer ni escribir Firestore.

### Revocación, recuperación y controles

- Para revocar el privilegio, operador autorizado vuelve a leer los claims actuales, elimina `superadmin` (y `editor` si corresponde), conserva únicamente claims aprobados y llama `setCustomUserClaims` con el mapa resultante. Después, revocar sesiones/refresh tokens cuando se requiera cortar accesos de inmediato y pedir al usuario cerrar sesión; un ID token ya emitido puede permanecer utilizable hasta expirar si no se aplican controles de revocación apropiados.
- Para recuperación de cuenta, usar los flujos oficiales de Firebase Authentication para email/contraseña y verificación; no asignar claims a una cuenta nueva hasta repetir la validación independiente de titularidad. Si se pierde acceso al único superadmin, un propietario de proyecto con IAM puede recuperar el acceso a través de un proceso Admin SDK auditado; mantener al menos dos custodios aprobados o una ruta de break-glass controlada, no un endpoint público.
- La asignación Admin SDK evita Firestore Rules, por lo que su abuso puede otorgar privilegios independientemente de las reglas de cliente. Proteger IAM/ADC, MFA del operador, registro de auditoría, revisión dual para cambios críticos y separación de credenciales. No almacenar claves de cuenta de servicio en GitHub, Render, frontend o artefactos de build.

### Diferencias: existente vs pendiente

- **Ya existe:** autenticación del panel por correo/contraseña; verificación de correo; persistencia y renovación de sesión; lectura de custom claims; protección de rutas y roles; reglas que exigen claims y correo verificado; denegación de escritura cliente en perfiles; documentación de alta manual en Console y asignación puntual por Admin SDK/ADC.
- **No existe:** script/servicio privilegiado de provisioning, procedimiento ejecutable con validación automática UID-email-verificación-proyecto, flujo auditado automatizado de asignación/revocación, ni prueba real de claims contra Firebase Authentication de producción. No se creó durante esta intervención.
- **Pendiente:** aprobación y verificación del propietario, confirmar Authentication/Email-Password y dominio/plantillas en Console, crear la cuenta real, verificar email, asignar claim mediante operador privilegiado, renovar token y probar rutas. Todo sigue sin ejecutar.

No se crearon usuarios, no se asignaron ni revocaron claims, no se ejecutaron scripts privilegiados, no se modificaron reglas/configuración/Firebase, ni hubo despliegue, commit o push.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 41 | Ejecutar, solo con aprobación, el procedimiento controlado para primer superadministrador: comprobar proyecto, UID, email verificado, claims existentes; asignar claim desde Admin SDK/ADC protegido; renovar token y probar rutas. Documentar custodia, revocación y recuperación sin exponer credenciales. | Firebase Authentication `radio997-d5380`; Console; Admin SDK/ADC fuera del cliente; `README.md`; `src/services/auth.ts`; `firestore.rules`. | ME CORRESPONDE A MÍ / REQUIERE MI AUTORIZACIÓN | P0 | Procedimiento auditado y propuesto; ejecución pendiente |

## Fase 1 — octava intervención: herramienta local de administración de roles (2026-11-09)

### Arquitectura y controles implementados

- Se eligió una CLI Node.js local en `scripts/admin-roles.mjs`, fuera de `src`, sin endpoints ni Cloud Functions. `firebase-admin@13.10.0` es dependencia de desarrollo y admite Node.js 20; no se importa en el frontend ni se incluye en el bundle.
- Comandos `show`, `assign` y `revoke` permiten consultar por UID o correo, asignar `superadmin`/`editor` y revocar un rol específico o ambos roles de la aplicación. La herramienta nunca crea usuarios.
- El proyecto se exige como argumento y se valida contra el literal `radio997-d5380`; se rechazan variables de entorno de proyecto contradictorias y `FIREBASE_AUTH_EMULATOR_HOST`. Admin SDK se inicializa con `applicationDefault()` y un `projectId` explícito, y solo después de validar el argumento.
- Asignar requiere UID y correo aprobado coincidente, cuenta habilitada y `emailVerified == true`. Para revocar no se exige correo verificado, para permitir retirar privilegios de una cuenta cuyo email haya dejado de estar verificado.
- Una modificación requiere TTY y la frase exacta que contiene operación, rol, UID y proyecto. Antes de confirmar se muestran roles actuales/resultantes. No hay `--yes`, ejecución batch ni modo no interactivo para mutar.
- Al asignar, los roles propios se hacen mutuamente excluyentes; el mapa restante de custom claims se conserva. Revocar un rol quita solo ese claim y `all` quita `superadmin` y `editor`; claims adicionales se preservan. No se registran valores de claims adicionales.
- La herramienta registra intento, éxito o fallo de modificación en un JSONL local fuera del repositorio (`%LOCALAPPDATA%` en Windows; estado del usuario en otros sistemas), sin correo, contraseñas, tokens ni credenciales. Registra UID objetivo, proyecto, acción, roles anteriores/resultantes, cuenta local y host. Los permisos de archivo en POSIX se restringen al usuario; Windows hereda ACL de LocalAppData. El log local es modificable por el usuario de la máquina y no sustituye Cloud Audit Logs ni auditoría central.
- Si Firebase acepta el cambio pero falla la escritura del evento de éxito, la CLI informa explícitamente que los claims ya cambiaron y que se debe revisar inmediatamente cuenta y registro local. Un fallo al escribir el evento de intento bloquea la llamada de modificación.
- Después de la confirmación, la CLI vuelve a leer usuario y claims y cancela si cambiaron, para evitar sobrescribir cambios concurrentes ocurridos durante la espera. Firebase Admin SDK no ofrece compare-and-set atómico para custom claims; una actualización concurrente después de esa última lectura sigue requiriendo coordinación operativa.
- Las mutaciones adquieren un archivo de bloqueo exclusivo en el directorio local de auditoría para impedir ejecuciones simultáneas de la CLI en la misma ubicación de usuario/equipo. No coordina máquinas ni herramientas externas; un bloqueo dejado por un cierre abrupto requiere inspección manual de PID/host antes de retirarlo.

### Pruebas y estado

- `scripts/admin-roles.test.mjs` usa un adaptador Auth falso en memoria; no carga ADC ni hace llamadas de red. Cubre usuario inexistente por UID/correo, consulta de claims, rechazo de correo no verificado o discrepante, asignación de ambos roles, preservación de claims ajenos, revocación parcial/total, confirmación exacta obligatoria, proyecto incorrecto y rechazo de Emulator, detección de claims concurrentes, no-op y error de operación no interactiva.
- Pruebas focalizadas al cierre de esta auditoría: **18 aprobadas, 0 fallidas**; suite completa **27 aprobadas, 0 fallidas**. No se ejecutó la CLI con credenciales, cuentas reales o proyecto Firebase.
- En la auditoría inicial `npm audit` reportó 8 paquetes moderados alcanzables por la alerta transitiva de `uuid`; se resolvió mediante un override compatible con el API usado y pruebas, sin degradar `firebase-admin`. El audit posterior completo y `npm audit --omit=dev` reportaron 0 vulnerabilidades.
- `README.md` documenta requisitos ADC, comandos, confirmación, auditoría local, renovación del token, revocación y límites. No se cambió `firestore.rules`; no se creó usuario ni se ejecutó ninguna operación privilegiada. La tarea 41 de provisionar realmente al primer superadministrador sigue pendiente de autorización, credenciales IAM y verificación de cuenta. La implementación de la herramienta no inicializa Firebase ni cierra la Fase 1.

### Comandos manuales — únicamente después de aprobación y revisión

```powershell
gcloud auth application-default login
npm run admin:roles -- show --project radio997-d5380 --email EMAIL_APROBADO
npm run admin:roles -- show --project radio997-d5380 --uid UID_CONFIRMADO
npm run admin:roles -- assign --project radio997-d5380 --uid UID_CONFIRMADO --email EMAIL_APROBADO --role superadmin
npm run admin:roles -- assign --project radio997-d5380 --uid UID_CONFIRMADO --email EMAIL_APROBADO --role editor
npm run admin:roles -- revoke --project radio997-d5380 --uid UID_CONFIRMADO --role superadmin
npm run admin:roles -- revoke --project radio997-d5380 --uid UID_CONFIRMADO --role all
```

`gcloud auth application-default login` es solo un ejemplo para preparar ADC bajo la identidad del operador y no se ejecutó. No autorizar un cambio por CLI hasta revisar la identidad ADC y sus permisos IAM, confirmar proyecto/cuenta/claims, verificar reglas publicadas por separado y obtener confirmación del responsable. Una asignación de claim no anula reglas Firestore de denegación global.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 42 | Revisar la CLI privilegiada de roles, sus límites de proyecto, confirmación y auditoría; completar pruebas simuladas y documentar la ejecución manual aprobada sin usar credenciales reales en pruebas. La asignación efectiva del primer superadministrador permanece en tarea 41. | `scripts/admin-roles.mjs`, `scripts/admin-roles.test.mjs`, Firebase Admin SDK, ADC, `README.md`. | LE CORRESPONDE AL DESARROLLADOR / REQUIERE MI AUTORIZACIÓN PARA OPERAR | P0 | Auditoría independiente y 18 pruebas focalizadas aprobadas; árbol npm audit limpio. Operación real pendiente de autorización y preflight de ADC/exclusividad |

## Fase 1 — novena intervención: auditoría de seguridad de la CLI de roles (2026-11-09)

### Alcance y controles confirmados

- Revisión independiente de `scripts/admin-roles.mjs` y `scripts/admin-roles.test.mjs`; no se cargó ADC ni se contactó Authentication/Firestore/Storage.
- Solo acepta el proyecto literal `radio997-d5380`, inicializa Admin SDK con `applicationDefault()` y un `projectId` explícito; rechaza variables de proyecto contradictorias y `FIREBASE_AUTH_EMULATOR_HOST`. Estas comprobaciones fijan el destino del SDK, pero no identifican por sí solas a la cuenta ADC. Antes de operar, el responsable debe comprobar la identidad IAM activa y sus permisos mínimos.
- La CLI está fuera de `src`, el frontend no importa el script ni `firebase-admin`, y `firebase-admin` es dependencia de desarrollo. No hay endpoint ni ruta de navegador para administrar roles.
- La asignación exige UID, correo aprobado coincidente, cuenta habilitada y correo verificado. La revocación individual quita únicamente el claim solicitado; las claims desconocidas y adicionales se conservan. Asignar `editor` o `superadmin` mantiene el comportamiento de exclusión mutua actual entre esos dos roles, por diseño.
- Una mutación requiere TTY y frase exacta con operación, rol, UID y proyecto. Se leen claims después de confirmar y de nuevo inmediatamente antes de `setCustomUserClaims`; se cancela si cambia el usuario, el correo relevante o el mapa de claims. El intento de auditoría se registra antes de la última relectura, y los errores de escritura del SDK se propagan y generan evento `failed` cuando el registro lo permite.
- Los logs no incluyen correo objetivo, valores de claims adicionales, contraseñas, tokens ni credenciales. Son locales y modificables por el usuario del equipo; no reemplazan Cloud Audit Logs.

### Hallazgos y riesgo residual

| Severidad | Hallazgo | Evidencia / estado |
|---|---|---|
| Crítica | Ninguno encontrado en el alcance revisado. | — |
| Alta | Ninguno encontrado en el alcance revisado. | — |
| Moderada | `setCustomUserClaims` reemplaza el mapa completo y Firebase no proporciona compare-and-set atómico. La relectura final y el bloqueo local reducen el riesgo, pero otro operador o proceso externo aún podría modificar claims entre la última lectura y la aplicación del cambio del servidor. | Revisión independiente; `scripts/admin-roles.mjs`. Sigue siendo necesaria una ventana sin otros cambios de roles. |
| Baja | El registro y bloqueo son locales y no demuestran qué identidad ADC ejecutó el comando ni coordinan varias estaciones. | Riesgo operativo residual; verificar identidad ADC/IAM por separado. |

### npm audit: resultados y tratamiento

Antes de la corrección se ejecutaron `npm audit` y `npm audit --omit=dev` sin aplicar fixes: el árbol completo reportó **8 paquetes moderados** y el árbol de producción reportó **0 vulnerabilidades**. Las 8 entradas eran el camino de dependencia alcanzable de una alerta de `uuid`, no ocho advisories independientes. El advisory GHSA-w5hq-g745-h8pq indica que las funciones UUID `v3()`, `v5()` y `v6()` no validan los límites al escribir en un buffer externo; `v4()` no está afectada. La CLI no llama directamente a UUID. Se comprobó que los paquetes consumidores instalados (`gaxios`, `teeny-request`, `google-gax`) usan `v4()`. Se fijó `uuid@11.1.1` mediante `overrides` y se conservó `firebase-admin@13.10.0`; el árbol completo y producción vuelven a reportar cero vulnerabilidades.

| Paquete marcado inicialmente | Versión antes → después | Tipo | Rango que reportó npm | Corrección / impacto |
|---|---:|---|---|---|
| `firebase-admin` | 13.10.0 → 13.10.0 | Directa, solo desarrollo | `7.0.0–8.2.0` o `11.0.0–14.3.0` | Quedó limpio al fijar UUID. npm proponía `10.3.0` con `audit fix --force`; no se degradó el SDK. Se usa solo Authentication. |
| `@google-cloud/firestore` | 7.11.6 → 7.11.6 | Transitiva | `7.5.0-pre.0` o `7.6.0–7.11.6` | Quedó limpio al resolver la dependencia vulnerable aguas abajo; la CLI no usa Firestore. |
| `@google-cloud/storage` | 7.22.0 → 7.22.0 | Transitiva | `5.19.0–8.0.0` (y rango histórico `2.2.0–2.5.0`) | Quedó limpio al resolver la dependencia vulnerable aguas abajo; la CLI no usa Storage. |
| `gaxios` | 6.7.1 → 6.7.1 (y 7.3.1 → 7.3.1) | Transitiva | `6.4.0–6.7.1` | La copia 6 usa UUID `v4()` y ahora resuelve `uuid@11.1.1`; la copia 7 ya estaba fuera del rango. |
| `google-gax` | 4.6.1 → 4.6.1 | Transitiva | `4.0.5-experimental–4.6.1` | Quedó limpio; esta ruta usa UUID `v4()`. No se importa directamente desde la CLI. |
| `retry-request` | 7.0.2 → 7.0.2 | Transitiva | `7.0.0–7.0.2` | Quedó limpio en el árbol auditado; se alcanza vía Storage. |
| `teeny-request` | 9.0.0 → 9.0.0 | Transitiva | `3.9.1–9.0.0` | Quedó limpio; su uso de UUID es `v4()`. |
| `uuid` | 9.0.1 → 11.1.1 | Transitiva | `<11.1.1` | Actualizado mediante override al parche upstream. Sus consumidores usados aquí llaman `v4()`. |

El override es un cambio major transitivo, aunque compatible con las funciones `v4()` efectivamente llamadas y validado con pruebas y ambos audits. Riesgo residual: dependencias futuras podrían requerir APIs específicas de UUID 9; revisar el árbol y repetir pruebas/audit al actualizar Firebase Admin o sus dependencias. El `npm audit fix --force` automático no se usó.

### Cobertura de pruebas y veredicto

- `scripts/admin-roles.test.mjs` usa un Auth falso en memoria y no usa cuentas, ADC ni red. Cubre proyecto incorrecto y variables contradictorias, rechazo del emulador, usuario inexistente, consulta UID/correo, correo cambiado/no verificado/no coincidente, cuenta deshabilitada, asignación de ambos roles, preservación de claims desconocidas/adicionales, revocación de cada rol y de todos, confirmación inválida/ausente, no-op, cambios durante confirmación y registro de intención, bloqueo de dos operaciones locales y errores de lectura/escritura del SDK. **18 pruebas focalizadas aprobadas; suite total: 27 aprobadas.**
- Verificado explícitamente: revocar `editor` conserva `superadmin` y claims desconocidas; revocar `superadmin` conserva `editor` y claims desconocidas. La operación `all` retira ambos roles de la aplicación y preserva los claims restantes.
- **Veredicto: NO APTA hasta completar el preflight operativo; apta condicionalmente para una primera mutación única y supervisada.** El override de UUID eliminó los advisories npm audit y el bloqueo local serializa procesos de la CLI en el mismo usuario/equipo. Firebase no ofrece compare-and-set: un cambio concurrente desde otro host o herramienta externa entre la lectura final y el write todavía podría sobrescribir el mapa. Antes de ejecutar, un responsable debe autorizar una ventana exclusiva, detener otros cambios de roles, verificar identidad ADC e IAM, y observar la consulta, confirmación y resultado. El bloqueo local no sustituye esta coordinación.
- Tarea 41 continúa pendiente. No se asignaron claims ni se crearon usuarios, no se cambió Firebase, Render o Firestore Rules, y no hubo commit/push/despliegue.

## Fase 1 — décima intervención: preflight de producción sin modificaciones (2026-11-09, estado inicial)

### Resultado de las comprobaciones

| Comprobación | Resultado |
|---|---|
| Validación local de la herramienta | El proyecto permitido sigue siendo el literal `radio997-d5380`; la CLI `show` usa `getUser`/`getUserByEmail` y no llama a `setCustomUserClaims`. En el estado inicial no se ejecutó `show` porque no había UID/correo aprobado ni ADC. |
| Proyecto/variables | En el estado inicial, `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, `CLOUDSDK_CORE_PROJECT`, `GOOGLE_APPLICATION_CREDENTIALS` y `FIREBASE_AUTH_EMULATOR_HOST` no estaban definidos; tampoco había `gcloud` o archivo estándar ADC. La instalación/configuración posterior se registra en la continuación de esta intervención. |
| Firebase CLI | `firebase login:list` indicó una sesión de Firebase CLI iniciada. Esto no configura ADC para Firebase Admin SDK. `firebase projects:list --json` falló al enumerar proyectos; no se leyó `firebase-debug.log` para evitar divulgar datos potencialmente sensibles. |
| Firebase Admin/ADC | En el estado inicial, la solicitud de token ADC falló con “Could not load the default credentials”; no se imprimió token. ADC se configuró posteriormente, sin consulta de datos de Firebase. |
| Consulta real de Authentication | No realizada. No se pudo confirmar proyecto por ADC ni localizar una cuenta para superadministrador. No hay UID, correo ni claims reales obtenidos en esta intervención. |
| Primera modificación de claims | No realizada, según restricción. La tarea 41 continúa pendiente. |

No se ejecutó ninguna operación de escritura ni se intentó sortear la falta de ADC. La cuenta de Firebase CLI no debe tomarse como prueba de identidad, alcance IAM o credenciales ADC del Admin SDK.

### Acción necesaria del propietario

1. En Google Cloud Console, seleccionar explícitamente `radio997-d5380` y comprobar que la cuenta operadora tenga solo los permisos IAM necesarios para consultar Firebase Authentication. No conceder permisos de modificación para este preflight.
2. En una estación segura aprobada, instalar/configurar Google Cloud CLI desde una fuente oficial si corresponde e iniciar ADC con la cuenta autorizada (`gcloud auth application-default login`). No compartir archivos de credenciales, tokens ni claves por chat o repositorio.
3. Confirmar por un canal controlado el UID o correo exacto de la cuenta candidata y autorizar la consulta de solo lectura. Después ejecutar `npm run admin:roles -- show --project radio997-d5380 --uid UID_CONFIRMADO` o `--email CORREO_CONFIRMADO`. El comando muestra UID, correo, `emailVerified`, estado deshabilitado y custom claims; revisar la salida localmente y compartir solo los campos aprobados, nunca tokens/secrets.
4. Antes de cualquier asignación futura, el propietario debe autorizar separadamente la operación exacta; verificar identidad ADC/proyecto y permisos IAM, email verificado y ventana exclusiva sin otros cambios de roles. La mutación no forma parte de este preflight y requiere nueva autorización explícita.

### Tarea nueva

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 43 | Completar preflight ADC de solo lectura en entorno seguro: verificar identidad y proyecto `radio997-d5380`, permisos mínimos de consulta, consultar por UID/correo aprobado y documentar estado/claims sin ejecutar escritura. La asignación real permanece en tarea 41 y requiere autorización separada. | Google Cloud Console/ADC; `scripts/admin-roles.mjs show`; Authentication. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | Completada para el preflight local: ADC disponible, proyecto verificado y usuario consultado con autorización explícita; no hubo escritura |

## Fase 1 — continuación de la décima intervención: Google Cloud CLI y ADC (2026-11-09)

### Diagnóstico e instalación

- Sistema: Windows 11 Pro x64, versión `10.0.26200`. La sesión PowerShell no está elevada.
- Antes de instalar, no se encontró Google Cloud CLI ni `gcloud` en PATH o en las rutas/entradas estándar de desinstalación. Java no está disponible en PATH; Node.js `v20.18.0` y npm `10.8.2` sí estaban instalados. Java no es requisito para Google Cloud CLI ni para ADC; puede ser necesario si después se vuelven a ejecutar Firebase Emulators.
- Winget encontró `Google.CloudSDK` versión `592.0.0`, editor Google LLC, con instalador desde `https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe`. Winget verificó el hash del instalador. Se intentó `--scope user`, que no encontró un instalador aplicable. La instalación normal indicó que requería administrador; se pidió y recibió autorización del usuario para aprobar UAC. Instalación completada en `%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk`.
- No se generaron claves JSON ni cuentas de servicio; no se instaló Java ni se cambiaron variables de entorno de máquina.

### Versiones, PATH y autenticación local

- `gcloud.cmd --version`: Google Cloud SDK `592.0.0`; core `2026.10.30`; bq `2.1.41`; gsutil `5.38`.
- El directorio `...\google-cloud-sdk\bin` ya figura en el PATH de usuario tras la instalación. Una nueva instancia de PowerShell construida con el PATH persistido encuentra `gcloud.cmd`; las terminales/VS Code que ya estaban abiertas deben reiniciarse para recargar el PATH.
- `gcloud auth login` se completó mediante el navegador con la intervención del usuario; hay una cuenta activa. El identificador de correo no se copia en esta auditoría.
- `gcloud config set project radio997-d5380` actualizó la configuración local de gcloud; `gcloud config get-value project` devolvió `radio997-d5380`. Esto no modifica recursos del proyecto.
- `gcloud auth application-default login` se completó mediante el navegador con la intervención del usuario. ADC se guardó en la ubicación estándar de usuario `%APPDATA%\gcloud\application_default_credentials.json`; el archivo no se leyó ni se copió al repositorio.
- Firebase Admin SDK se inicializó localmente con `applicationDefault()` y `projectId=radio997-d5380`; la credencial obtuvo un token en memoria. Solo se registró un booleano de disponibilidad y expiración; nunca se imprimió ni guardó el token.

### Límites del preflight y próximos pasos

- **Google Cloud CLI instalado:** sí, `592.0.0`.
- **Autenticación de usuario gcloud:** completada en navegador; cuenta activa, correo omitido del informe.
- **ADC:** configurado y detectado por Firebase Admin SDK localmente.
- **Proyecto seleccionado:** `radio997-d5380` en configuración local y en el inicializador de prueba de Admin SDK.
- **Permisos IAM para consultar usuarios:** no comprobados. Obtener un token ADC y fijar un proyecto no demuestran permisos `firebaseauth.users.get`/`firebaseauth.users.list` ni otro alcance IAM equivalente. No se concedieron roles automáticamente.
- **Consulta real de Firebase Authentication:** pendiente. Conforme a la instrucción de no continuar con operaciones administrativas después de instalar, no se llamó a `getUser`, `getUserByEmail` ni `listUsers`; no se conocen UID, correo candidato, estado de verificación, estado habilitado ni claims reales.
- **Primera modificación de claims:** no realizada y no autorizada; la tarea 41 continúa pendiente.

El siguiente paso requiere autorización separada del propietario para una consulta de solo lectura: confirmar un UID o correo candidato por un canal controlado, verificar en Google Cloud Console que la identidad autenticada tenga el rol mínimo de visor de Firebase Authentication, y entonces ejecutar únicamente `npm run admin:roles -- show --project radio997-d5380 --uid UID_CONFIRMADO` (o la variante `--email CORREO_CONFIRMADO`). No compartir ADC, tokens ni claves. Cualquier asignación requerirá autorización independiente posterior.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 44 | Completar verificación IAM y consulta de solo lectura del usuario candidato usando ADC recién configurado. Registrar si la cuenta puede consultar Authentication; no asignar claims como parte de esta tarea. | Google Cloud Console IAM; `gcloud`; `scripts/admin-roles.mjs show`; Firebase Authentication. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | Completada en solo lectura: `firebaseauth.users.get` efectivo; cuenta consultada y resultado entregado al propietario; sin asignación de claims |

## Fase 1 — duodécima intervención: verificación IAM y consulta de Authentication (2026-11-09)

### Comprobaciones realizadas

- Proyecto local de gcloud: `radio997-d5380`. ADC estaba presente y un cliente local de Firebase Admin SDK pudo utilizarlo.
- Se probó el permiso efectivo `firebaseauth.users.get` con ADC mediante el endpoint de prueba de permisos de Cloud Resource Manager. Resultado: **concedido**. No se modificaron roles IAM.
- Tras recibir autorización expresa para consultar el correo indicado, se ejecutó solo `npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com`. La consulta fue exitosa.
- Resultado comunicado al propietario: UID `JYpmvFjzLVV0e8u5FIunn9z4YpR2`; correo `fdavidriojac@gmail.com`; cuenta habilitada (`disabled=false`); correo no verificado (`emailVerified=false`); custom claims actuales `{}`. El registro de auditoría omite UID y correo para limitar la copia de identificadores personales.
- No se ejecutó `assign` ni `revoke`; no se crearon usuarios, no se cambió Authentication, IAM, Firestore, Storage, Render ni reglas. No se hizo commit/push/despliegue.

### Preparación de primera asignación — no ejecutada

- Usuario candidato consultado: el identificado en la tabla de resultado anterior; su correo aún no está verificado.
- Claim propuesto para el primer administrador: `superadmin: true`. Claims actuales: `{}`; no hay claims adicionales que conservar actualmente.
- **Bloqueo:** la herramienta exige `emailVerified == true` y rechazará la asignación en el estado actual. El propietario debe completar la verificación de correo y, posteriormente, autorizar por separado la operación de asignación. No se envió ni se solicitó enviar correo desde esta herramienta.
- Comando preparado, únicamente después de verificar el correo y recibir autorización expresa:

```powershell
npm run admin:roles -- assign --project radio997-d5380 --uid JYpmvFjzLVV0e8u5FIunn9z4YpR2 --email fdavidriojac@gmail.com --role superadmin
```

Al ejecutar, el operador deberá revisar proyecto, identidad ADC, correo verificado, UID, claims anteriores/resultantes y escribir la frase exacta de confirmación que la CLI muestre. No ejecutar el comando en esta intervención. La tarea 41 permanece pendiente hasta una operación real autorizada y su verificación posterior.

## Fase 1 — incidente de `/admin/login` en Render (2026-11-09)

### Diagnóstico verificable

- **Render/configuración efectiva:** el código local `render.yaml` contiene dos reglas `type: rewrite`, para `/admin` y `/admin/*`, ambas destinadas a `/index.html`. Sin embargo, la respuesta HTTP de producción en `https://continental997.fm/admin/login`, `/admin`, `/admin/verificar-correo` y `/noticias` es `301 Moved Permanently` con `Location: /index.html`; `cf-cache-status: BYPASS` y `rndr-id` aparecen en la respuesta. El comportamiento efectivo no coincide con los rewrites locales. No se dispone de acceso al Dashboard/servicio de Render para verificar si el Blueprint fue sincronizado, si el deploy está usando la rama/configuración esperada o si existen reglas manuales de Redirect con mayor precedencia. No se debe afirmar cuál de estas causas es definitiva sin inspeccionar el servicio.
- **React:** `src/App.tsx` monta `admin/*` y `src/routes/AdminRoutes.tsx` declara `login` y `verificar-correo`; por lo tanto, `/admin/login` está implementada en la aplicación. La URL local `/admin/login` devuelve HTTP 200 y muestra la vista de autenticación. La URL de producción se cambia por el 301 a `/index.html`; al iniciar React en esa ruta, la ruta pública wildcard acaba representando `NotFoundPage`. React no origina el redirect HTTP.
- **Verificación local:** Vite devuelve HTTP 200 para `/admin/login` y `/admin/verificar-correo`. La vista local muestra “Autenticación no configurada” porque solo existe `.env.example`, no hay `.env` Firebase local. Por ello la ruta está verificada localmente, pero **no se puede iniciar sesión ni enviar/verificar correo desde esta sesión local** hasta proporcionar la configuración web Firebase correcta y que el proyecto/dominio admita los handlers.
- **Flujo Firebase:** el login usa Firebase Client SDK `signInWithEmailAndPassword`. Tras autenticarse con correo no verificado, la app redirige a `/admin/verificar-correo`; esa pantalla permite reenviar el mensaje con `sendEmailVerification`. El enlace de acción se procesa con `checkActionCode`/`applyActionCode` del Client SDK. La app actualiza el estado de sesión; no requiere ni debe usar Admin SDK para marcar `emailVerified` manualmente. El correo no está verificado en Firebase según la consulta previa autorizada, así que el usuario deberá abrir el enlace recibido.
- **Estado del servicio:** las solicitudes web demuestran el problema desplegado, pero no permiten comprobar directamente si el `render.yaml` fue aplicado al Static Site existente. La corrección de producción es una intervención manual en Render y un nuevo deploy autorizado; no se ejecutó aquí.

### Corrección requerida y verificación

1. En Render Dashboard, abrir el Static Site `radiocontinental99-7` y revisar **Redirects/Rewrites**. Eliminar/cambiar cualquier regla `Redirect` que convierta rutas SPA en `/index.html`. Definir como **Rewrite** a `/index.html` para `/admin` y `/admin/*` (y otras rutas SPA correspondientes), preservando la URL solicitada. No añadir una regla global `/*`.
2. Comprobar la configuración Blueprint conectada al repositorio y a la rama actualmente desplegada; verificar los eventos de deploy y que la versión publicada incluya el `render.yaml` con las reglas esperadas. Las rewrites declaradas en archivo no sirven si el servicio existente no las sincroniza o si reglas manuales divergen.
3. Obtener autorización del propietario y desplegar el servicio existente en Render; no se hizo este paso.
4. Después, `curl -I https://continental997.fm/admin/login` debe devolver un estado exitoso sin `Location: /index.html`; navegador y barra URL deben conservar `/admin/login`. Probar además `/admin/verificar-correo`, `/admin/recuperar`, `/admin`, una ruta pública y una desconocida.
5. Una vez accesible el handler, configurar localmente las seis variables `VITE_FIREBASE_*` con la configuración pública de la aplicación web Firebase (nunca credenciales Admin) y confirmar el dominio de retorno autorizado. Iniciar sesión; la cuenta no verificada debe mostrar la pantalla con opción de reenviar. Abrir el enlace de Firebase para completar verificación.

No se modificaron reglas, cuentas, contraseñas, claims, DNS, archivos de Render ni el código de rutas; no se desplegó, ni hubo commit/push. No se avanzó de fase.

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 45 | Corregir en el Static Site existente la regla efectiva que responde con `301 Location: /index.html`; sincronizar Blueprint/branch y convertir reglas de rutas SPA a Rewrite, desplegar solo con autorización y verificar que `/admin/login` conserve URL y cargue el formulario. | Render Dashboard → Static Site `radiocontinental99-7` → Redirects/Rewrites/Blueprint; `render.yaml`; pruebas HTTP posteriores. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | Pendiente: producción sigue redirigiendo; React/local route funciona, pero Firebase Auth local está sin configurar |

## Fase 1 — cierre de carga multimedia (2026-11-13)

Esta actualización registra evidencia de producción y pruebas locales sin cerrar los bloqueadores generales del lanzamiento. Los estados distinguen configuración desplegada, observación directa y validación local.

### Avances y evidencia

| Avance | Estado | Evidencia |
|---|---|---|
| Cuenta runtime `radio-media-runtime@radio997-d5380.iam.gserviceaccount.com` | VERIFICADO | Ambas funciones activas la muestran como cuenta de servicio; la carga real backend → Storage → Firestore también completó. |
| Roles IAM y acceso al bucket | PUBLICADO | El propietario confirmó que la cuenta tiene los grants requeridos; no se modificaron roles en esta fase. |
| `finalizeMediaUpload` y `setMediaState` | PUBLICADO | Descripciones Gen 2: `ACTIVE`, callable, `us-central1`, Node.js 22; ambas apuntan al mismo digest de imagen de Artifact Registry. |
| Correspondencia del código desplegado | VERIFICADO | Ambas funciones refieren al build `1a81ff49-2db4-47e4-9d93-96209d59c519` y al digest activo `0ce4ff…`; SHA-256 de `index.mjs`, `src/media-operations.mjs`, `package.json` y `package-lock.json` coincide entre los archivos fuente de cada despliegue y el árbol local. |
| Runtime Node.js 22 | PUBLICADO | Funciones activas con `nodejs22`; `firebase.json` y `functions/package.json`/lock fijan 22 localmente. |
| CORS de Functions | VERIFICADO | OPTIONS devolvió HTTP 204 con ACAO exacto para `https://continental99.fm`, `https://www.continental99.fm`, `https://continental997.fm` y `https://www.continental997.fm`; solo se permite POST y `authorization,content-type`. |
| CORS de Cloud Storage | VERIFICADO | Bucket `radio997-d5380.firebasestorage.app`, metageneration 7: GET/PUT; orígenes `https://continental997.fm`, `https://radiocontinental99-7.onrender.com`, `https://continental99.fm` y `https://www.continental99.fm`; headers Firebase y GCS explícitos, sin `*`. |
| Transferencia real desde el panel y registro privado | VERIFICADO | Se transfirió una PNG no sensible de 68 bytes; el documento `media/d723b9f2-2e61-4597-b852-c8c67994893f` se leyó desde Firestore con `status=draft`, `visibility=private`, `isArchived=false`; el objeto correspondiente existe en `media/` del bucket. |
| Lectura privada administrativa | VERIFICADO | Tras publicar Storage Rules, el panel abrió la vista previa del borrador privado. |
| Denegación de lectura privada no autenticada | VERIFICADO | Un GET de producción sin credenciales al objeto que está privado devolvió HTTP 403; la prueba Emulator también deniega lectura anónima, a usuario normal y a superadmin no verificado. |
| Publicación, lectura pública y despublicación | VERIFICADO | El panel confirmó publicación y visibilidad pública; la vista previa pública cargó la imagen (1×1); la despublicación confirmó retorno a privado. Firestore muestra actualmente `draft/private/isArchived=false`. |
| Functions, frontend CORS/multimedia y typecheck | VALIDADO LOCALMENTE | 28/28 pruebas de Functions; 4/4 pruebas frontend multimedia/CORS; `npm run typecheck` correcto. |
| Storage Rules Emulator | VALIDADO LOCALMENTE | La prueba cubre lectura pública anónima, denegación privada anónima y a usuario normal, lectura privada de superadmin verificado, denegación a admin no verificado y denegación de escrituras cliente. |
| `git diff --check` | VALIDADO LOCALMENTE | Sin errores de whitespace en el diff revisado. |
| Reglas Storage de producción | PUBLICADO | El despliegue selectivo de Storage Rules se completó antes de esta actualización; habilitó la lectura prevista. No se desplegaron Firestore Rules. |
| Prueba funcional completa en producción | VERIFICADO | Upload resumible → finalización backend → registro privado → preview administrativa → publicación/preview pública → despublicación; el documento quedó en borrador privado. No se borraron el registro ni el objeto. |

### Dominios: discrepancia que sigue pendiente

Los cuatro orígenes anteriores están permitidos explícitamente por las callables. La inspección DNS/HTTP mostró que `continental99.fm` y `www.continental99.fm` no resuelven desde esta sesión; `continental997.fm` sí responde y fue el host del panel usado para la prueba funcional, mientras `www.continental997.fm` redirige. Por tanto, el CORS está verificado para los cuatro valores exactos, pero queda **PENDIENTE** confirmar cuál dominio `.fm` es el canónico y habilitar DNS/servicio para `.99.fm` si ese es el dominio previsto. No son dominios intercambiables.

### Artifact Registry: diagnóstico y propuesta no aplicada

- **PENDIENTE:** el repositorio de Functions es `us-central1-docker.pkg.dev/radio997-d5380/gcf-artifacts`, formato Docker, ubicación `us-central1`; no tiene políticas de limpieza configuradas. El aviso de deploy se refiere a esta ausencia; no invalida que las funciones estén `ACTIVE`.
- A la consulta actual había tres versiones del paquete `radio997--d5380__us--central1__finalize_media_upload`: digest `sha256:0ce4ff802077bda98f310a7fc5e05891f1ca570dda3e2ebc8242c4216bd5ba41` (`latest`, `version_1`, creado `2026-11-14T01:27:27Z`), y dos sin etiquetas (`sha256:4fc252ef2aa0b88c7582c20161753db24e47293201f520af621e6314a4c70e28`, `2026-11-14T00:20:18Z`; `sha256:e0e9fc2095a1b0c8707d3cfe235dca8b37deb6915c8c1f2e6154aebda885221d`, `2026-11-14T01:23:46Z`). Ambos servicios Cloud Run activos usan la etiqueta `version_1` y el digest `0ce4ff…`. También existe la imagen `cache:latest`, digest `sha256:4394d34ed76d57dae6cb153ff08a199897123fad4aae9bb4d7cdc13692ab8866`, creada `2026-11-14T00:20:31Z`.
- **Propuesta conservadora, no aplicada:** política `keep` para las 10 versiones más recientes de cada paquete y `delete` solo para versiones `untagged` con más de `30d`. Artifact Registry permite combinar políticas de conservación y borrado; la conservación prevalece sobre borrado. Antes de aplicarla, revisar la ventana de rollback y confirmar que cualquier digest al que se necesite volver está etiquetado o protegido. No se borró ninguna imagen ni se creó política.
- Las marcas de creación de Artifact Registry y Firestore que aparecen en UTC después de medianoche corresponden a la noche del 13 de noviembre en la zona local `-04:00`.

### Pruebas que quedan pendientes

- **PENDIENTE — denegación a usuario autenticado normal en producción:** el GET anónimo de producción fue denegado (403) y el Emulator deniega al usuario normal; no se usó una cuenta real no autorizada para probar el caso autenticado en producción.
- **PENDIENTE — dominio canónico:** resolver la discrepancia DNS entre `.99.fm` y el host `.997.fm` usado en producción.
- **PENDIENTE — limpieza de Artifact Registry:** aplicar solo tras aprobación del propietario y revisión del rollback; no ejecutar borrado manual.
- `git diff --check` se ejecutó al cerrar el cambio local. Esta actualización documental no implica que el sistema completo esté listo para lanzamiento; siguen abiertos los demás bloqueadores de esta auditoría.
