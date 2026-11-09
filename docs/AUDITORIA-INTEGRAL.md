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
| 30 | En el servicio existente, cambiar cualquier acción Redirect de rutas SPA a Rewrite. Producción respondió `301 Location: /index.html`; el app React entonces interpreta `/index.html` y presenta su 404. Reprobar las seis rutas tras guardar la regla. | Render Dashboard → Static Site → Redirects/Rewrites; `render.yaml`. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 31 | Canonical raíz, `robots.txt` y sitemap de producción observados usan `continental997.fm`; aún falta deploy/verificación tras cambiar Rewrite. Confirmar también sitemap editorial cuando se resuelva Firestore, y canonical/noindex correctos en contenido existente y no existente. | Render → Environment / Events; dominio `continental997.fm`. | ME CORRESPONDE A MÍ | P0 | En proceso |
| 32 | Diagnosticar el `PERMISSION_DENIED` de Firestore sin modificar reglas: confirmar proyecto y reglas desplegadas, revisar la estructura/valores reales de categorías y publicaciones, y validar la misma consulta en staging. No relajar permisos ni cambiar datos en producción sin autorización. | Firebase Console / staging; comparar con `firestore.rules` y filtros del sitemap. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |
| 33 | Estrategia autorizada: prerender estático de noticias/programas publicados. Se implementó la generación de páginas por slug con metadatos/canonical y contenido de texto seguro; se quitaron rewrites wildcard para que slugs no generados no devuelvan la SPA. Falta que Firestore permita las consultas anónimas y probar el deploy/rutas en Render. | Build `npm run deploy:prepare`; Render Static Site; Firestore público y solo lectura. | LE CORRESPONDE AL DESARROLLADOR / ME CORRESPONDE A MÍ | P0 | En proceso |
| 34 | En Render, comparar `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_API_KEY` del build con el proyecto web real en Firebase Console. Confirmar que frontend y script usan el mismo Project ID; revisar variables sin copiar credenciales al chat. | Render → Environment; Firebase Console → Project settings → General; build output/configuración. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 35 | Tras confirmar el proyecto, diagnosticar en Firebase Emulator/staging: reglas desplegadas, lectura de consulta exacta por visitante, documentos y campos (`status`, `isArchived`, `slug`), y resultado HTTP/código completo. Confirmar índices; un índice ausente suele ser `FAILED_PRECONDITION`, mientras el `403 PERMISSION_DENIED` apunta a API/IAM/reglas/proyecto no equivalente. No cambiar reglas/datos productivos sin autorización. | Firebase Console, Emulator/staging, `firestore.rules`, `firestore.indexes.json`, `scripts/generate-sitemap.mjs`. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente |

## Segunda intervención — diagnóstico, decisión y despliegue

### A. Soft 404: evidencia y alternativas

Prueba pública de esta revisión (2026-11-07): los paths solicitados reciben HTTP 301 hacia `/index.html`; tras cargar la SPA, React muestra “Página no encontrada” para rutas funcionales y slugs inexistentes. El canonical resultante también es `/404`. `curl` confirma `Location: /index.html`. Esto sugiere que las reglas actualmente activas en el Dashboard son redirects o no corresponden al `render.yaml` publicado. Un Rewrite debe entregar `index.html` manteniendo la URL solicitada.

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
