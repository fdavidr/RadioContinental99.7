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
| 3 | Confirmar que Firestore está habilitado en el proyecto correcto y diagnosticar el `PERMISSION_DENIED` comparando proyecto, reglas desplegadas y consultas desde staging. El error no identifica por sí solo la causa. | Firebase Console → Firestore; proyecto `radio997-d5380`. | ME CORRESPONDE A MÍ | P0 | Rules API confirmó hasta 2026-11-09T22:51:31.496502Z la versión anterior globalmente denegatoria; luego se publicó el candidato local. La causa histórica del error era la denegación global; validar ahora la lectura de `publicConfig/site` sigue pendiente y no se creó el documento |
| 4 | Comparar/desplegar reglas e índices solo tras autorización y revisión. Probar acceso de visitante, editor y superadministrador; no habilitar escritura pública ni borrado. | `firestore.rules`, `storage.rules`, `firestore.indexes.json`, Firebase Emulator/staging. | REQUIERE MI AUTORIZACIÓN | P0 | Reglas exclusivamente publicadas en intervención 27; nuevo ruleset verificado por Rules API y contenido coincide con hash autorizado. Índices/Storage no publicados. Emulator previo 11/11. Pendientes las pruebas funcionales productivas separadas y revisar índices/Storage según autorización |
| 5 | Verificar forma y valores reales de documentos en `posts`, `programs`, `categories` y otras colecciones. Las consultas públicas requieren `status == "published"` e `isArchived == false`; probar que borradores/archivados no sean públicos. | Firestore Console y reglas activas. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |
| 6 | Confirmar Email/Password, protección contra enumeración, plantillas de correo, dominios autorizados y URLs de acción para recuperación/verificación. Probar flujos con cuentas de prueba. | Firebase Console → Authentication; dominio HTTPS oficial. | ME CORRESPONDE A MÍ | P0 | Pendiente: producción reportó `auth/unauthorized-continue-uri`. El código usa `https://continental997.fm/admin/login` cuando `VITE_SITE_URL` es el canónico; falta comprobar/agregar `continental997.fm` en Authorized domains y hacer un envío autorizado |
| 7 | Crear cuentas aprobadas, verificar correo y asignar claims de rol con Admin SDK desde un entorno privilegiado auditado. Probar que editor y usuario ordinario no se otorguen privilegios. | Authentication y entorno administrativo protegido; seguir el procedimiento de `README.md`. | ME CORRESPONDE A MÍ | P0 | Requiere verificación |
| 8 | Confirmar bucket, cuotas y reglas de Storage; probar límites de tamaño/formato, carga autorizada y denegación de accesos privados/no autorizados. | Firebase Console → Storage; `storage.rules`. | ME CORRESPONDE A MÍ | P1 | Requiere verificación |

## 3. Dominio y alojamiento

| N.º | Tarea / qué hacer y cómo comprobarlo | Dónde / insumos | Responsable | Prioridad | Estado |
|---:|---|---|---|---|---|
| 9 | Aplicar rewrites SPA en el servicio existente. `render.yaml` mantiene Rewrite exactos para listados y `/admin/*`; se quitaron los comodines de `/noticias/*` y `/programas/*`. El build genera archivos por slug publicado, para que archivos existentes sirvan páginas y slugs no generados respondan 404. | `render.yaml`; Render Dashboard → Static Site → Redirects/Rewrites; inspección HTTP con `curl`. | ME CORRESPONDE A MÍ | P0 | Comportamiento HTTP verificado el 2026-11-09: las 15 rutas solicitadas devuelven 200, sin redirect y conservan la URL. Dashboard/Blueprint no verificado; páginas editoriales individuales siguen sin prueba |
| 10 | `VITE_SITE_URL=https://continental997.fm` está reflejado en `robots.txt`, sitemap y canonical de raíz observados en producción. La generación local de páginas editoriales está implementada, pero requiere contenido editorial consultable para generar páginas individuales. | Environment de Render; `scripts/site-config.mjs`, `scripts/check-production-config.mjs`, `scripts/generate-sitemap.mjs`. | ME CORRESPONDE A MÍ | P0 | Dominio canónico confirmado en robots, sitemap y canonical de inicio; sitemap XML válido con 10 rutas estáticas, sin URLs de noticias/programas individuales. Prerender editorial no verificable todavía |
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
| 30 | En el servicio existente, cambiar cualquier acción Redirect de rutas SPA a Rewrite. Producción respondió `301 Location: /index.html`; el app React entonces interpreta `/index.html` y presenta su 404. Reprobar las seis rutas tras guardar la regla. | Render Dashboard → Static Site → Redirects/Rewrites; `render.yaml`. | ME CORRESPONDE A MÍ | P0 | Comportamiento corregido según HTTP 2026-11-09: 15 rutas comprobadas devuelven 200, sin Location ni redirecciones y conservan la ruta. Dashboard/Blueprint no inspeccionado |
| 31 | Verificar dominio canónico, sitemap editorial, canonical/noindex para contenido existente/no existente y rutas públicas. | Render → Environment / Events; dominio `continental997.fm`. | ME CORRESPONDE A MÍ | P0 | GET de producción 2026-11-09: sitemap XML válido con 10 rutas del dominio canónico, sin noticias/programas individuales; canonical de raíz coincide. Fichas y metadatos por ruta no verificables en producción todavía |
| 32 | Diagnosticar el `PERMISSION_DENIED` de Firestore sin modificar reglas: confirmar proyecto y reglas desplegadas, revisar estructura/valores reales y validar la consulta pública exacta en staging. No relajar permisos ni cambiar datos sin autorización. | Firebase Console / staging; `firestore.rules`; consulta de `scripts/generate-sitemap.mjs`. | REQUIERE MI AUTORIZACIÓN | P0 | La última revisión previa confirmó Firestore `(default)` sin colecciones visibles y reglas activas que denegaban lecturas/escrituras. En esta intervención no se repitió consulta Firebase; causa actual entre ausencia de documentos y denegación sigue sin recertificar |
| 33 | Mantener el prerender estático de noticias/programas publicados y comprobar páginas reales por slug. El generador produce HTML con contenido textual seguro, canonical y metadatos cuando la consulta devuelve documentos elegibles. | `npm run deploy:prepare`; `dist/noticias/<slug>/index.html`; `dist/programas/<slug>/index.html`; hosting estático. | LE CORRESPONDE AL DESARROLLADOR / ME CORRESPONDE A MÍ | P0 | Pruebas simuladas verifican el HTML de ambos tipos y exclusión de borradores. En producción no hay URLs individuales en el sitemap; generación real no comprobada porque falta configuración local y no se consultó Firebase |
| 34 | En Render, comparar `VITE_FIREBASE_PROJECT_ID` y la configuración Firebase web del build con el proyecto real. Confirmar que frontend y generador usan el mismo Project ID, exactamente `radio997-d5380`. | Render → Environment; Firebase Console → Project settings → General; build output/configuración. | ME CORRESPONDE A MÍ | P0 | Proyecto activo local de gcloud confirmado como `radio997-d5380` (número `527560734998`), y consulta Admin SDK fijada explícitamente a ese proyecto. Variable del build de Render no verificada; localmente falta |
| 35 | Tras confirmar el proyecto, diagnosticar en Emulator/staging la consulta exacta por visitante: reglas, documentos/campos (`status`, `isArchived`, `slug`), respuesta/código y paginación. No cambiar reglas/datos productivos sin autorización. | Firebase Emulator/staging; `firestore.rules`, `firestore.indexes.json`, `scripts/generate-sitemap.mjs`. | REQUIERE MI AUTORIZACIÓN | P0 | Pendiente; la consulta del generador filtra `status == published` y `isArchived == false`, pagina en bloques de 1000 y corta con error sobre 50.000 documentos |

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
| 38 | Instalar/preparar JDK 21, añadirlo temporalmente al `PATH` de PowerShell y ejecutar la suite `firebase emulators:exec` con `demo-radio-rules`; verificar todos los escenarios antes de solicitar aprobación de publicación. | Eclipse Temurin JDK 21, Firebase CLI y `scripts/firestore-rules.emulator.mjs`. | ME CORRESPONDE A MÍ | P0 | Completada; suite actual 11/11 aprobada en la intervención 24 |

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
| 41 | Ejecutar, solo con aprobación, el procedimiento controlado para primer superadministrador: comprobar proyecto, UID, email verificado, claims existentes; asignar claim desde Admin SDK/ADC protegido; renovar token y probar rutas. Documentar custodia, revocación y recuperación sin exponer credenciales. | Firebase Authentication `radio997-d5380`; Console; Admin SDK/ADC fuera del cliente; `README.md`; `src/services/auth.ts`; `firestore.rules`. | ME CORRESPONDE A MÍ / REQUIERE MI AUTORIZACIÓN | P0 | Completada según evidencia del propietario: claim `superadmin: true` confirmado por Admin SDK, sesión renovada y acceso a `/admin/configuracion` comprobado visualmente. El error Firestore de configuración se registra y sigue en tareas 3/4; no implica que la protección de ruta/claim haya fallado |

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
| 45 | Corregir en el Static Site existente la regla efectiva que responde con `301 Location: /index.html`; sincronizar Blueprint/branch y convertir reglas de rutas SPA a Rewrite, desplegar solo con autorización y verificar que `/admin/login` conserve URL y cargue el formulario. | Render Dashboard → Static Site `radiocontinental99-7` → Redirects/Rewrites/Blueprint; `render.yaml`; pruebas HTTP posteriores. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | Resultado HTTP ya corregido: rutas solicitadas conservan URL y devuelven 200 sin Location. No se verificó Dashboard/Blueprint ni se desplegó desde esta sesión; login HTML sirve shell SPA |
| 46 | Con credenciales/configuración de build aprobadas, ejecutar `deploy:prepare` contra `radio997-d5380` y registrar por colección cuántos documentos fueron devueltos y cuántas páginas se generaron; si no existen publicaciones aprobadas, mantener el sitemap base sin inventar contenido. | `VITE_FIREBASE_*` del cliente web, `VITE_SITE_URL`, consulta pública aprobada y salida de build local/Render. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | Lectura real con Admin SDK/ADC: 0 documentos en ambas colecciones y 0 elegibles; no hay prerender. `deploy:prepare` sigue bloqueado por seis variables Firebase ausentes; también falta `VITE_SITE_URL` en el entorno local. El comando fija el proyecto esperado `radio997-d5380` antes del build |
| 47 | Verificar metadatos/versión y contenido de las reglas activas de Firestore desde Firebase Console o con permisos de lectura de Firebase Rules API, sin publicar cambios. | Firebase Console → Firestore → Rules; Firebase Rules API, lectura de releases/rulesets. | ME CORRESPONDE A MÍ | P0 | Pendiente: Rules API respondió HTTP 403 al listar releases; la versión, fecha y estado activo actual no quedaron comprobados |
| 48 | Corregir y verificar el error `auth/unauthorized-continue-uri` sin modificar la cuenta. Confirmar el hostname de `VITE_SITE_URL` autorizado en Authentication y probar el reenvío solo con autorización del propietario. | Firebase Console → Authentication → Settings → Authorized domains; `src/services/auth.ts`; pantalla `/admin/verificar-correo`. | ME CORRESPONDE A MÍ | P0 | Propietario aportó captura que confirma `continental997.fm`, `www.continental997.fm` y el dominio Render autorizados. Helper local usa `VITE_SITE_URL`; faltan comprobar variables reales de Render y probar el build desplegado. No se envió correo |
| 49 | Verificar en Render las variables de build sin exponer sus valores y confirmar que `VITE_SITE_URL=https://continental997.fm`, `VITE_FIREBASE_PROJECT_ID=radio997-d5380` y las seis variables Firebase requeridas estén presentes antes de autorizar un despliegue. | Render → Static Site `radiocontinental99-7` → Environment; Build Command de `render.yaml`. | REQUIERE ACCIÓN Y AUTORIZACIÓN DEL PROPIETARIO | P0 | No se pudo consultar Render desde este entorno: no hay CLI, token ni acceso a Environment. Localmente las siete variables comprobadas no están definidas |

## Fase 1 — decimotercera intervención: verificación de producción tras cambios de rewrites (2026-11-09)

### Rutas HTTP GET

Se hicieron GET públicos al dominio canónico. Todas las rutas enumeradas respondieron HTTP 200, `Content-Type: text/html; charset=utf-8`, URL final idéntica a la solicitada, cero redirecciones y sin cabecera `Location`.

| Ruta | HTTP | URL final | Location | Content-Type | ¿Conserva ruta? |
|---|---:|---|---|---|---|
| `/` | 200 | `https://continental997.fm/` | — | `text/html; charset=utf-8` | Sí |
| `/noticias` | 200 | `https://continental997.fm/noticias` | — | `text/html; charset=utf-8` | Sí |
| `/programas` | 200 | `https://continental997.fm/programas` | — | `text/html; charset=utf-8` | Sí |
| `/programacion` | 200 | `https://continental997.fm/programacion` | — | `text/html; charset=utf-8` | Sí |
| `/admin` | 200 | `https://continental997.fm/admin` | — | `text/html; charset=utf-8` | Sí |
| `/admin/login` | 200 | `https://continental997.fm/admin/login` | — | `text/html; charset=utf-8` | Sí |
| `/admin/recuperar` | 200 | `https://continental997.fm/admin/recuperar` | — | `text/html; charset=utf-8` | Sí |
| `/admin/verificar-correo` | 200 | `https://continental997.fm/admin/verificar-correo` | — | `text/html; charset=utf-8` | Sí |
| `/buscar` | 200 | `https://continental997.fm/buscar` | — | `text/html; charset=utf-8` | Sí |
| `/en-vivo` | 200 | `https://continental997.fm/en-vivo` | — | `text/html; charset=utf-8` | Sí |
| `/contacto` | 200 | `https://continental997.fm/contacto` | — | `text/html; charset=utf-8` | Sí |
| `/nosotros` | 200 | `https://continental997.fm/nosotros` | — | `text/html; charset=utf-8` | Sí |
| `/deportes` | 200 | `https://continental997.fm/deportes` | — | `text/html; charset=utf-8` | Sí |
| `/privacidad` | 200 | `https://continental997.fm/privacidad` | — | `text/html; charset=utf-8` | Sí |
| `/terminos` | 200 | `https://continental997.fm/terminos` | — | `text/html; charset=utf-8` | Sí |

### Robots, sitemap y prerender editorial

| Recurso/comprobación | Resultado | Evidencia |
|---|---|---|
| `/robots.txt` | 200; `text/plain; charset=utf-8`; URL conservada; sin redirect. | Indica `Disallow: /admin` y `Sitemap: https://continental997.fm/sitemap.xml`. |
| `/sitemap.xml` | 200; `application/xml`; URL conservada; XML válido. | Contiene 10 `<loc>`: todas empiezan por `https://continental997.fm/`; no se hallaron otros hosts. |
| Sitemap de noticias/programas individuales | No contiene URLs individuales. | Conteo de `<loc>` bajo `/noticias/`: 0; bajo `/programas/`: 0. Solo hay ruta estática `/noticias` y `/programas`. |
| Página individual prerenderizada | No comprobable en esta ejecución. | No hay URLs reales de fichas en el sitemap de las que seleccionar ejemplos; no se inventaron rutas ni se afirmaron pruebas de fichas. |
| Canonical de inicio | Correcto en el HTML recibido: `<link rel="canonical" href="https://continental997.fm/" />`. | GET de `/`; título estático `Radio 99.7 FM`. |
| Canonical del shell de rutas | El HTML estático recibido para `/noticias`, `/programas` y `/admin/login` también incluye canonical de raíz y título genérico. | El cliente React puede actualizar metadatos durante hidratación; no se considera prueba de canonical específico de cada ruta ni de SEO prerenderizado. |

### Conclusión y límites

- El comportamiento HTTP ahora corresponde a Rewrite: no se observó el `301 Location: /index.html` previo. `/admin/login` alcanza el shell SPA y conserva la URL. No se modificó ni desplegó nada desde esta sesión.
- Las respuestas HTTP verifican el comportamiento, pero no permiten probar que Render Dashboard esté sincronizado con `render.yaml` o determinar la fuente exacta de configuración activa.
- No se verificó el formulario interactivo contra producción en esta pasada ni se inició sesión, pues la tarea se limitó a GET. La autenticación local antes comprobada muestra “Autenticación no configurada” sin variables Firebase.
- El sitemap no aporta ejemplos de fichas editoriales; la disponibilidad de prerender de noticias/programas sigue pendiente. Su ausencia no demuestra por sí sola si Firestore está vacío o si la generación fue un fallback.
- Se actualizaron estados relacionados en tareas 30, 31, 33 y 45; no se borraron tareas anteriores. No se accedió a Firebase ni se cambiaron usuarios, claims, reglas, datos, Storage, Render o DNS. Sin commits, pushes o despliegues.

## Fase 1 — decimocuarta intervención: sitemap, prerender y metadatos (2026-11-09)

### Causa del sitemap de 10 URLs

**Hechos verificados en producción:** un GET nuevo a `https://continental997.fm/sitemap.xml` respondió 200 con `application/xml`; el XML se parseó correctamente, tiene 10 `<loc>`, todas en `https://continental997.fm`, y ninguna URL individual bajo `/noticias/` o `/programas/`.

**Comportamiento comprobado del generador:**

- `scripts/generate-sitemap.mjs` inicia con `staticPaths`, que contiene exactamente 10 páginas generales. Solo agrega fichas cuando una consulta de Firestore devuelve documentos con `status == "published"`, `isArchived == false` y un `slug` con el formato permitido.
- La consulta itera `posts` y `programs`, pagina en bloques de 1000 y falla si supera 50.000 documentos. No hay un límite pequeño que explique por sí solo la ausencia de fichas.
- Cada página individual se escribe como `dist/noticias/<slug>/index.html` o `dist/programas/<slug>/index.html`; borradores, archivados y slugs inválidos no generan página ni entrada de sitemap.
- Sin `VITE_FIREBASE_PROJECT_ID`, `generate:sitemap` avisa y produce el sitemap estático. En cambio, `deploy:prepare` primero exige la configuración Firebase completa y ejecuta el generador con `--require-editorial-prerender`; ante un error de consulta devuelve código de fallo y no constituye una preparación exitosa para publicar.
- La consulta usa `VITE_FIREBASE_PROJECT_ID`, igual que `src/lib/firebaseConfig.ts`. El comando `deploy:prepare` no pasa el argumento opcional de proyecto al validador para fijar `radio997-d5380`; por eso la identidad del proyecto depende de la variable configurada y sigue pendiente de cotejo en Render.
- Se añadió un log por colección con documentos recibidos y páginas prerenderizadas, para que una preparación futura distinga respuesta vacía de error de permisos y de documentos que no producen rutas.

**Causas diferenciadas:**

| Posible causa | Evidencia y conclusión |
|---|---|
| No existen documentos publicados | En una intervención previa se observó en la consola Firestore `(default)` sin colecciones. Es evidencia histórica, no una nueva consulta de esta intervención; no se afirma que el estado siga igual hoy. Si aún no hay documentos aprobados, 10 URLs es el resultado esperado. |
| Hay documentos pero la consulta no los obtiene | No se volvió a consultar Firestore en esta intervención: faltan las variables Firebase locales y no se ejecutó una petición productiva. No se puede confirmar o descartar esta hipótesis con el XML. |
| La consulta no tiene permisos | La última revisión previa reportó reglas activas que denegaban lecturas/escrituras. Es una causa plausible si esas reglas siguen vigentes; no se recertificó el estado actual. Las pruebas locales simulan HTTP 403, no prueban reglas de producción. |
| Se generó con datos incompletos/fallback | Comprobado localmente: con `VITE_SITE_URL` pero sin `VITE_FIREBASE_PROJECT_ID`, el generador informa el fallback y produce exactamente las 10 rutas estáticas. El sitemap público de 10 URLs, por sí solo, no revela si provino de una consulta exitosa con cero documentos, del fallback no estricto o de un build anterior. |

### Colecciones y estado real conocido

| Colección | Uso en el generador | Estado/evidencia de esta intervención |
|---|---|---|
| `posts` | Noticias publicadas; exige estado publicado, no archivado y slug válido; genera entrada XML y HTML individual. | Consulta Firebase no ejecutada ahora. La última evidencia de consola registrada decía que `(default)` no tenía colecciones. |
| `programs` | Programas publicados; aplica los mismos filtros y genera ficha/HTML individual. | Consulta Firebase no ejecutada ahora. No hay URLs de programas individuales en el sitemap de producción. |

No se crearon documentos de prueba ni se consultó contenido privado. El resultado actual no permite certificar el estado presente de las colecciones; el propietario debe verificarlo con credenciales/configuración autorizadas. El generador no usa datos de ejemplo ni el contenido provisional de `src/data/site.ts` para construir el sitemap editorial.

### Prerenderizado individual

La implementación existente genera HTML propio cuando una consulta de lectura exitosa devuelve fichas elegibles. La plantilla incluye título, canonical por slug, descripción, robots, Open Graph, Twitter y contenido visible de texto escapado; en noticias incluye autor y fecha cuando existen. La imagen social se añade si está configurada. La prueba simulada cubre noticia y programa públicos, sus metadatos/canonical y la exclusión de borradores.

En esta ejecución el build local no produjo directorios editoriales porque no se configuró el Project ID. No se pudo probar ningún HTML individual de producción, pues el sitemap no incluye URLs reales para solicitar. Por tanto, las páginas individuales están **cubiertas por pruebas con fixtures**, pero no **verificadas con contenido real**.

### Metadatos de rutas iniciales

El HTML base `index.html` contiene el título/canonical/metadatos generales de inicio y un `#root` vacío. `SeoHead` modifica el `<head>` dentro de `useEffect`, después de cargar y montar React; no convierte la respuesta HTML inicial por ruta en SSR. Además, Render reescribe las rutas SPA configuradas hacia `/index.html`.

| Ruta | Metadatos existentes en React | Situación del HTML inicial |
|---|---|---|
| Inicio | `SeoHead` con título y descripción de inicio. | El HTML base muestra título y canonical de raíz, genéricos. |
| Noticias | `SeoHead` con título y descripción de sección. | No hay HTML estático de sección; el rewrite entrega `index.html`. |
| Programas | `SeoHead` con título y descripción de sección. | No hay HTML estático de sección; el rewrite entrega `index.html`. |
| Programación | No se encontró `SeoHead`. | HTML base genérico. |
| Contacto | No se encontró `SeoHead`. | HTML base genérico. |
| Nosotros | No se encontró `SeoHead`. | HTML base genérico. |
| Deportes | `SeoHead` con título y descripción de sección. | No hay HTML estático de sección; el rewrite entrega `index.html`. |
| Privacidad y términos | `LegalPage` no incluye `SeoHead`. | HTML base genérico. |

No se inventaron títulos/descripciones ni se hizo una corrección parcial que no cambie lo que el servidor entrega. Para que esas rutas tengan metadatos específicos en el HTML recibido hace falta generar HTML por ruta y dirigir cada rewrite a su archivo, o adoptar SSR/prerender de rutas; ambas opciones implican un cambio del comportamiento de hosting/arquitectura que no se hizo bajo la restricción de no cambiar Render ni desplegar. Los metadatos de rutas que sí usan `SeoHead` solo pueden actualizarse después de cargar JavaScript.

### Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `npm test` | Aprobado: 27/27; incluye query paginada/filtros, error 403, sitemap estático, salida fallida en modo de publicación y HTML individual simulado. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado; genera `dist/index.html` y assets. No genera fichas individuales sin documentos consultados. |
| `npm run lint` | Exit code 0; emitió advertencias de Oxlint preexistentes en varias áreas de la aplicación, no errores del cambio del generador. |
| `npm run deploy:prepare` | No ejecutó build ni consulta: se detuvo correctamente porque faltan las seis variables `VITE_FIREBASE_*` requeridas en el entorno local. Solo existe `.env.example` con valores vacíos. |
| `npm run generate:sitemap` local sin Project ID | Ejecutado con el origen canónico; reportó fallback estático y generó 10 URLs. XML parseado correctamente; todas las URLs del dominio canónico y cero fichas editoriales. |
| Sitemap de producción | GET 200, XML válido, 10 URLs canónicas, cero noticias/programas individuales. |
| Consulta real de Firestore / reglas | No ejecutada en esta intervención; no se declara aprobada. |

### Archivos cambiados y límites

- `scripts/generate-sitemap.mjs`: ahora informa por colección el número de documentos devueltos y páginas prerenderizadas.
- `scripts/generate-sitemap.test.mjs`: verifica esos mensajes para las consultas simuladas.
- `docs/AUDITORIA-INTEGRAL.md`: estados y hallazgos de esta intervención; se conservan las tareas previas y se agrega la tarea 46.

Pendiente del propietario: facilitar/configurar localmente la configuración Firebase web del proyecto aprobado (sin pegar secretos en el chat), confirmar que el Project ID sea exactamente `radio997-d5380`, comprobar la consulta pública/reglas en Emulator o staging y decidir qué contenido real, aprobado y publicado debe existir. Después ejecutar `npm run deploy:prepare` y revisar los conteos de documentos/páginas. No se publicaron reglas, no se tocaron Firestore, Authentication, Storage, Render o DNS; no hubo despliegue, commit ni push.

## Fase 1 — decimoquinta intervención: lectura real de Firestore y preparación (2026-11-09)

### Identidad/proyecto y consulta de datos

- Se encontró Google Cloud CLI instalada fuera del `PATH`; se invocó desde su ruta de instalación de usuario. La configuración activa indicó `radio997-d5380`; `gcloud projects describe` confirmó el número `527560734998`.
- Application Default Credentials estaba presente y Firebase Admin SDK pudo ejecutar consultas de solo lectura al proyecto explícito `radio997-d5380`, base `(default)`. No se imprimieron identidad detallada, tokens ni credenciales.
- Se consultaron conteos de colección y campos de estado, junto con solo `slug` para documentos candidatos; no se leyeron títulos, texto editorial u otros campos de contenido. Todas las consultas finalizaron con éxito, no con error de permisos/proyecto/conexión.

| Colección | Documentos totales | `status=published` | `isArchived=true` | `status=archived` | Publicados no archivados | Slug válido entre candidatos | Elegibles para prerender |
|---|---:|---:|---:|---:|---:|---:|---:|
| `posts` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `programs` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Conclusión: en el momento de la consulta ambas colecciones no contenían documentos. Firestore no conserva colecciones vacías como objetos independientes; cero documentos significa que están ausentes/vacías. No se crearon colecciones ni documentos. Como no hay publicaciones elegibles, el prerender editorial real produciría cero páginas y las 10 rutas generales son el sitemap esperado, siempre que el build use el proyecto objetivo y termine exitosamente.

### Reglas activas

- El servicio `firebaserules.googleapis.com` aparece habilitado en el proyecto.
- La llamada de lectura a Firebase Rules API para listar releases del proyecto respondió HTTP 403. No se pudo obtener la release activa, su ruleset, fecha/versión ni el texto de las reglas en esta sesión. El resultado no es una consulta denegada de Firestore: Admin SDK sí pudo consultar sus colecciones.
- Intervenciones previas registraron que las reglas activas denegaban globalmente lecturas y escrituras. Ese registro es antecedente histórico; esta intervención no certifica que las reglas sigan iguales. No se modificaron reglas.
- Para comprobarlo, el propietario debe abrir Firebase Console → Firestore Database → Rules y registrar el contenido publicado y la fecha/versión; alternativamente, conceder al operador permiso de solo lectura sobre releases/rulesets de Firebase Rules API. No conceder permisos desde este proceso.

### Configuración del generador/build

`package.json` define `deploy:prepare` como preflight, build y `generate-sitemap.mjs --require-editorial-prerender`. El preflight requiere estas seis variables Firebase, además de un origen válido `VITE_SITE_URL`:

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_PROJECT_ID`
4. `VITE_FIREBASE_STORAGE_BUCKET`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. `VITE_FIREBASE_APP_ID`
7. `VITE_SITE_URL=https://continental997.fm`

`VITE_USE_FIREBASE_EMULATORS` no puede ser `true`. `VITE_SOCIAL_PREVIEW_IMAGE_URL` es opcional; se usa para la tarjeta social del HTML prerenderizado. Las seis `VITE_FIREBASE_*` son configuración web de Firebase y se embeben en el bundle; no se deben sustituir por claves privadas/Admin SDK ni enviar al chat.

El generador toma `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_API_KEY` del entorno y consulta Firestore REST; la configuración del cliente usa el mismo `VITE_FIREBASE_PROJECT_ID`. El `PATH` local no contenía `gcloud`, aunque la instalación estaba presente; el proyecto se comprobó invocando el ejecutable por su ruta completa. La variable de proyecto de Render no se pudo consultar desde este entorno.

Se endureció el comando local: `deploy:prepare` pasa ahora `radio997-d5380` al validador para rechazar una configuración apuntando a otro proyecto antes de construir. Se agregó una prueba para ese rechazo. Esto no comprueba ni cambia la configuración que Render tiene guardada.

### Preparación y salida

- `npm run deploy:prepare` fue ejecutado localmente y se detuvo en el preflight porque faltan las seis variables `VITE_FIREBASE_*`; tampoco está definida `VITE_SITE_URL` en el entorno del proceso. El preflight informa primero las seis variables y termina antes de validar el origen, por lo que habrá que configurar también `VITE_SITE_URL=https://continental997.fm`. No llegó a compilar ni a consultar Firestore mediante el generador. No se tomaron ni copiaron variables de Render.
- El resultado real de Firestore demuestra que actualmente no hay documentos para prerender; no se inventó contenido.
- El generador produce HTML por ficha en `dist/noticias/<slug>/index.html` o `dist/programas/<slug>/index.html` solo cuando recibe un documento publicado, no archivado y con slug válido. En esta consulta ambos conteos elegibles fueron cero. No se publicaron artefactos.
- Para una preparación autorizada, el operador debe cargar la configuración web del proyecto `radio997-d5380` en variables locales protegidas o ejecutar en el entorno de build autorizado. Verificar el proyecto sin mostrar valores, ejecutar `npm run deploy:prepare`, y revisar los conteos por colección. Si las reglas públicas deniegan el REST anónimo, el modo estricto debe fallar; no relajar reglas para forzar el build.

### Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Proyecto activo y número con Google Cloud CLI | Aprobado: `radio997-d5380`, `527560734998`. CLI hallada fuera de PATH y ejecutada por ruta completa. |
| Consulta real de `posts` y `programs` con Admin SDK/ADC | Aprobada como lectura: ambas sin documentos; 0 publicaciones, 0 archivados y 0 elegibles. |
| Lectura de reglas activas | No completada: Firebase Rules API HTTP 403; Console no consultada. |
| `npm test` | Aprobado: 28/28 pruebas, incluyendo el rechazo del proyecto distinto y pruebas simuladas del generador. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado en esta intervención; generó `dist/index.html` y assets. La ejecución separada no consulta Firestore ni genera fichas. |
| `npm run deploy:prepare` | Falló deliberadamente en preflight por seis variables `VITE_FIREBASE_*` faltantes; además, el entorno local no tiene definido `VITE_SITE_URL` (no se informa debido al orden de validación). No hubo consulta REST ni generación editorial. |
| XML del sitemap de producción | GET actual: 200 `application/xml`; parseo XML correcto, 10 URLs canónicas, 0 fichas bajo `/noticias/` y `/programas/`. Consistente con los conteos reales sin documentos. |
| Cambios de reglas/datos/despliegue | Ninguno. |

### Próximos pasos con autorización

1. El propietario verifica en Firebase Console el ruleset publicado y su fecha; si desea repetirlo por API, otorga solo lectura para consultar releases/rulesets, no permisos de publicación.
2. El propietario o administrador de Render confirma que la variable de build `VITE_FIREBASE_PROJECT_ID` sea `radio997-d5380` y administra la configuración web del cliente mediante el mecanismo seguro del servicio.
3. Si no existen documentos editoriales aprobados, conservar sitemap de 10 URLs y dejar la inicialización de contenido pendiente. Si posteriormente hay contenido aprobado, volver a generar el sitemap/prerender con build autorizado y revisar el fallo o éxito de acceso público sin modificar reglas en esta intervención.

No se modificaron Firestore Rules, documentos, colecciones, Storage, usuarios, claims, Render ni DNS. No se desplegó, hizo commit ni push. La Fase 1 continúa abierta.

## Fase 1 — decimosexta intervención: diagnóstico de `auth/unauthorized-continue-uri` (2026-11-09)

### Hallazgo

- `resendVerificationEmail(user)` en `src/services/auth.ts` llama `sendEmailVerification(user, actionCodeSettings('/admin/login'))`; por tanto sí entrega `ActionCodeSettings`.
- Antes del cambio, `actionCodeSettings` construía la URL con `window.location.origin`. Si se accedía desde la URL informada, producía `https://continental997.fm/admin/login`; si se abría desde otro host (por ejemplo un hostname alternativo de Render), podía construir un dominio distinto.
- `handleCodeInApp` está en `false`, apropiado para el flujo web del sitio. No se requiere un manejador móvil. El `continueUrl` se usa para volver a la app luego del flujo web de acción.
- `ActionCodeSettings`/`url` es opcional en Firebase. Omitirlo evitaría la validación del dominio de continuación, pero también quitaría el retorno explícito a `/admin/login`; no se eligió esa alternativa porque el flujo documentado necesita volver al sitio.
- La falla `auth/unauthorized-continue-uri` es compatible con que el dominio de `url` no esté autorizado en Authentication. No se pudo inspeccionar Firebase Console durante esta intervención, por lo que la ausencia de `continental997.fm` es la causa más probable, no un hecho confirmado.

### Cambio local y configuración requerida

`src/services/auth.ts` ahora usa `VITE_SITE_URL` como base de la URL de continuación, con `window.location.origin` solo como fallback para desarrollo cuando la variable no existe. En build de producción con `VITE_SITE_URL=https://continental997.fm`, la URL resultante es `https://continental997.fm/admin/login`. Este helper también se usa en recuperación de contraseña, por lo que evita un dominio de retorno alternativo en ambos flujos.

**Acción manual del propietario en Firebase Console:**

1. Abrir el proyecto `radio997-d5380` → **Authentication** → **Settings** → **Authorized domains**.
2. Comprobar si existe el hostname `continental997.fm`; si falta, añadir exactamente `continental997.fm`, sin protocolo, ruta, puerto ni barra final.
3. Solo si la aplicación enviara enlaces con un dominio alternativo de continuación, autorizar también ese hostname. No agregar dominios que no se controlen.
4. Confirmar que el build productivo utiliza `VITE_SITE_URL=https://continental997.fm`. Para las plantillas de correo, revisar que la URL de acción configure el handler deseado y que el servicio siga usando el handler web esperado.
5. Después de confirmar el dominio y dar autorización expresa, reenviar un correo desde la sesión autenticada y comprobar el enlace. No se realizó un envío en esta intervención.

### Resultado y límites

- Causa más probable: dominio de continuación `continental997.fm` no autorizado en Firebase Authentication, o build con un origen distinto al canónico. El cambio local elimina la selección accidental del origen de la pestaña cuando la URL canónica está configurada.
- El código por sí solo no puede autorizar un dominio en Firebase Console. No se modificaron usuarios, correo verificado, claims, plantillas o dominios de Firebase.
- `handleCodeInApp: false` se mantiene; el `continueUrl` permanece en `/admin/login`. La pantalla `/admin/verificar-correo` sigue siendo el destino configurado para procesar `oobCode` cuando se usa un handler de acción personalizado.
- No se determinó el hostname que generó el error en el intento real, ni se consultó la lista de dominios autorizados. No se envió ningún correo de prueba.

### Pruebas y archivos

| Comprobación | Resultado |
|---|---|
| Inspección de llamada Firebase | Confirmado `sendEmailVerification(user, actionCodeSettings('/admin/login'))`. |
| URL destino configurada | Producción prevista: `https://continental997.fm/admin/login`; el código usa `VITE_SITE_URL` y conserva fallback de origen solo si falta. |
| `handleCodeInApp` | Confirmado `false`. |
| Firebase Console / Authorized domains | Pendiente; no hubo acceso/consulta de consola. |
| Envío de correo | No ejecutado, conforme a la restricción. |
| `npm test` | Aprobado: 28/28 pruebas. No incluye envío ni llamada al SDK de Authentication. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado; valida compilación del cambio, no el envío real ni la autorización del dominio en Firebase. |
| `git diff --check` | Aprobado. |

Archivos modificados: `src/services/auth.ts`, `README.md` y este documento. No se cambió Firebase, Render, DNS, usuarios, reglas ni plantillas; no se desplegó y no hubo commit/push. La tarea 48 permanece pendiente de configuración/validación del propietario.

## Fase 1 — decimoséptima intervención: preparación de corrección de correo para producción (2026-11-09)

### Diff y URL de continuación

Se revisó el diff completo de `src/services/auth.ts`. El cambio local es acotado: leer `import.meta.env.VITE_SITE_URL?.trim()` y usarlo como base de `new URL(path, configuredSiteUrl || window.location.origin)`. Cuando `VITE_SITE_URL` es exactamente `https://continental997.fm`, `actionCodeSettings('/admin/login')` produce `https://continental997.fm/admin/login`. Se conserva `handleCodeInApp: false`.

El reenvío ejecuta `sendEmailVerification(user, actionCodeSettings('/admin/login'))`. La recuperación sigue llamando `sendPasswordResetEmail` con el mismo helper y ruta de continuación `/admin/login`; no se cambió su comportamiento de manejo de usuario no encontrado ni otros errores. No se agregaron contraseñas, tokens, claves ni credenciales al código/diff.

### Dominios y variables de producción

- El propietario aportó evidencia visual de Firebase Authentication → Authorized domains con `continental997.fm`, `www.continental997.fm` y `radiocontinental99-7.onrender.com`. Se registra como comprobación aportada por el propietario; no se accedió a Firebase Console directamente.
- Por tanto, que `continental997.fm` falte en Authorized domains ya no es la hipótesis principal. El error podría corresponder a un build productivo anterior al cambio, a un `VITE_SITE_URL` de Render distinto del canónico, o a una configuración Firebase/Authorized domains de otro proyecto. No se puede determinar cuál mientras no se verifiquen las variables y el bundle actualmente publicado.
- `render.yaml` solo declara `buildCommand: npm ci --include=dev && npm run deploy:prepare` y `staticPublishPath`; no contiene valores de entorno.
- No existe Render CLI, token ni acceso a Environment disponible en esta sesión; no se pudo inspeccionar ni confirmar las variables guardadas en el servicio.
- En el entorno local no están definidas `VITE_SITE_URL` ni las seis variables `VITE_FIREBASE_*`. El único archivo `.env*` presente es `.env.example`; los valores Firebase son vacíos. No se mostró ni copió valor secreto alguno.

Variables que el propietario debe verificar en Render:

1. `VITE_SITE_URL` debe ser `https://continental997.fm`.
2. `VITE_FIREBASE_PROJECT_ID` debe ser `radio997-d5380`.
3. Deben estar presentes las seis variables exigidas por el build: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Son la configuración pública del cliente, no credenciales Admin.

La comprobación se hizo únicamente por presencia/nombre y comparación local: ninguna de las siete variables estaba definida. No se consultaron valores de Render ni se imprimió valor de variable en salida.

### Validación, despliegue y decisión

| Comprobación | Resultado |
|---|---|
| `auth.ts` diff | Solo cambia la base de URL de continuación hacia `VITE_SITE_URL`, con fallback de origen para desarrollo. |
| Verificación URL calculada | Con el valor canónico requerido, resulta `https://continental997.fm/admin/login`; verificado por inspección de la construcción de URL. |
| Recuperación de contraseña | Sigue usando el helper compartido y la misma ruta de continuación `/admin/login`; sin cambios de lógica. |
| Dominios autorizados | La captura del propietario confirma los tres hostnames indicados; no se comprobó directamente en consola. |
| Variables locales | No presentes las seis variables Firebase ni `VITE_SITE_URL`. |
| Variables Render | No verificables desde la sesión; `render.yaml` no las define. |
| `npm test` | Aprobado: 28/28. |
| `npm run typecheck` | Aprobado. |
| `npm run build` | Aprobado localmente; sin Firebase configurado, no demuestra qué valores contiene el build de producción. |
| `npm run deploy:prepare` | Falló en preflight por las seis variables Firebase ausentes. No consultó Firestore ni realizó publicación. |
| Despliegue/email | No realizados conforme a las restricciones. |

**Veredicto:** la corrección del código está lista para incluirse en un build, pero **no está verificada ni lista para declarar lista para producción** hasta confirmar las variables en Render y realizar, con autorización, un despliegue posterior y una prueba de correo. El build local pasa; no se enviaron correos.

### Procedimiento exacto de publicación, cuando el propietario lo autorice

1. En Render → Static Site `radiocontinental99-7` → Environment, verificar sin copiar valores al chat: origen canónico `VITE_SITE_URL`, `VITE_FIREBASE_PROJECT_ID=radio997-d5380` y presencia de las seis variables del cliente Firebase. Mantener fuera las credenciales de Admin SDK.
2. En un checkout con estos cambios aprobados, usar **Manual Deploy → Deploy latest commit** para el servicio existente, solo después de autorizar explícitamente el deploy. El build command configurado en `render.yaml` ejecuta `npm ci --include=dev && npm run deploy:prepare`; el preflight obliga el proyecto a `radio997-d5380`.
3. Confirmar que Render indique el deploy exitoso. No enviar un correo desde el proceso de deploy.
4. Después de autorización separada para probar el envío, iniciar sesión en `/admin/verificar-correo`, solicitar un único reenvío y confirmar que ya no aparece `auth/unauthorized-continue-uri`. No cambiar manualmente `emailVerified`.

Esta intervención no hizo commit, push ni deploy, no envió correos y no cambió Firebase Authentication, usuarios, claims, Firestore Rules, Render ni DNS. Actualizadas las tareas 48 y 49; la Fase 1 sigue abierta.

## Fase 1 — decimoctava intervención: consulta de verificación de correo (2026-11-09)

Se ejecutó exclusivamente la consulta solicitada:

```text
npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com
```

Resultado de Firebase Admin SDK mediante ADC:

| Campo | Resultado |
|---|---|
| Proyecto consultado | `radio997-d5380` |
| UID | `JYpmvFjzLVV0e8u5FIunn9z4YpR2` (coincide con el esperado) |
| Cuenta habilitada | Sí (`disabled: false`) |
| Correo verificado | Sí (`emailVerified: true`) |
| Custom claims actuales | `{}` |

La cuenta está preparada para una asignación administrativa futura, pero no tiene actualmente roles ni claims. La consulta fue de solo lectura: no se asignó ni revocó ningún rol, no se modificó el usuario, no se cambió Firebase/Render/Rules/DNS y no hubo commit o push. La tarea 41 permanece abierta hasta que exista una autorización separada para asignar el claim y comprobar la sesión/rutas.

## Fase 1 — decimonovena intervención: asignación inicial de superadministrador (2026-11-09)

El propietario autorizó explícitamente asignar únicamente `superadmin: true` a `fdavidriojac@gmail.com` (UID `JYpmvFjzLVV0e8u5FIunn9z4YpR2`) en `radio997-d5380`. Se revisó el control de confirmación de `scripts/admin-roles.mjs`: la CLI exige que `stdin` y `stdout` sean una terminal interactiva y rechaza ejecuciones sin TTY antes de registrar una solicitud o modificar claims.

Se volvió a ejecutar la consulta de solo lectura mediante Firebase Admin SDK y ADC:

```text
npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com
```

Resultado: UID esperado, correo esperado, `emailVerified: true`, `disabled: false` y `customClaims: {}`. Por tanto, en esa consulta la identidad y estado coincidieron con la autorización. También se recibió del propietario la frase exacta:

```text
CONFIRMAR ASSIGN superadmin JYpmvFjzLVV0e8u5FIunn9z4YpR2 radio997-d5380
```

Se intentó ejecutar el comando aprobado:

```text
npm run admin:roles -- assign --project radio997-d5380 --uid JYpmvFjzLVV0e8u5FIunn9z4YpR2 --email fdavidriojac@gmail.com --role superadmin
```

La CLI respondió `Las modificaciones requieren una terminal interactiva; ejecución no interactiva rechazada.` No fue posible introducir la frase dentro del prompt TTY en esta sesión; no se usó un método alternativo ni se simuló la confirmación. La operación de escritura no ocurrió y los claims siguen sin cambios según la última consulta de solo lectura. El comando `gcloud` tampoco está disponible en el PATH de esta sesión; esto no impidió la consulta de Admin SDK, que se completó mediante ADC.

**Estado:** tarea 41 sigue abierta. Para continuar, ejecutar el comando anterior en una ventana de PowerShell interactiva donde `stdin` y `stdout` sean TTY, revisar el resumen que presente la CLI e introducir allí la frase exacta. Después, volver a ejecutar `show` para verificar el resultado, renovar el token/iniciar sesión y probar el acceso administrativo. No se modificaron reglas, Storage, Render, DNS ni otros usuarios; no hubo commit, push o despliegue.

## Fase 1 — intervención 20: preparación desde PowerShell interactiva (2026-11-09)

Se revisaron las instrucciones de primer superadministrador en `README.md` y `docs/AUDITORIA-INTEGRAL.md`, así como los controles de `scripts/admin-roles.mjs`. La fuente y `scripts/admin-roles.test.mjs` no tienen cambios locales respecto al árbol Git; SHA-256 observado para el script: `E3C96CCE5C4B6B1F42E5B0BFCFC734D7B4FE6B56BD9F5F010FF94E89FE3EC616`. Se ejecutaron las pruebas específicas con `node --test scripts/admin-roles.test.mjs`: **18/18 aprobadas**.

La consulta actual de solo lectura se ejecutó con:

```text
npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com
```

Resultado de Firebase Admin SDK mediante ADC: UID `JYpmvFjzLVV0e8u5FIunn9z4YpR2`, correo `fdavidriojac@gmail.com`, `emailVerified: true`, `disabled: false`, `customClaims: {}`. Coincide con los datos autorizados y el estado inicial esperado. Esto confirma que el SDK pudo usar ADC para esta consulta. El comando `gcloud` no está disponible en el PATH de la sesión de agente, y la ejecución de comandos de esta interfaz no es una PowerShell con TTY.

No se ejecutó `assign` en esta intervención: requiere `stdin`/`stdout` interactivos y no se debe eludir ese requisito. Para hacerlo personalmente, abrir una nueva ventana de **Windows PowerShell** desde Inicio, navegar al checkout del proyecto y ejecutar estos comandos. La comprobación de token descarta la salida para no mostrarlo; luego `show` vuelve a comprobar la identidad antes de escribir:

```powershell
Set-Location 'C:\Users\Usuario\RadioContinental99.7'

# Verificar ADC sin mostrar el token:
gcloud auth application-default print-access-token | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'ADC no está disponible en esta cuenta de Windows.' }
Write-Output 'ADC disponible.'

# Volver a comprobar identidad, estado y claims antes de la escritura:
npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com
```

Solo si el resultado muestra el UID esperado, `emailVerified: true`, `disabled: false` y claims `{}`, ejecutar:

```powershell
npm run admin:roles -- assign --project radio997-d5380 --uid JYpmvFjzLVV0e8u5FIunn9z4YpR2 --email fdavidriojac@gmail.com --role superadmin
```

Revisar el resumen de la CLI e introducir en su prompt, manualmente y sin pegarlo en otra ubicación, la frase exacta que muestre:

```text
CONFIRMAR ASSIGN superadmin JYpmvFjzLVV0e8u5FIunn9z4YpR2 radio997-d5380
```

Después de que la CLI confirme éxito, verificar el estado desde la misma terminal:

```powershell
npm run admin:roles -- show --project radio997-d5380 --email fdavidriojac@gmail.com
```

El resultado esperado es `customClaims: { "superadmin": true }` y ningún claim adicional inesperado. Si cualquier valor previo a la escritura no coincide, si ADC falla, o si la CLI muestra una discrepancia/error, detenerse sin reintentar ni cambiar claims. Tras verificar la asignación, todavía será necesario renovar el token/cerrar e iniciar sesión y probar el acceso administrativo antes de completar la tarea 41.

No se cambiaron claims ni otros datos de Firebase; no se modificaron Rules, Storage, Render o DNS. Sin commit, push ni despliegue.

## Fase 1 — verificación de AuthContext y rutas tras la asignación (solicitada como intervención 20; 2026-11-09)

El propietario reporta que cerró sesión y volvió a iniciarla después de que Admin SDK confirmara `superadmin: true`. No se inspeccionó ni se expuso ningún ID token. La verificación directa del claim dentro de la sesión autenticada del propietario no pudo realizarse en el navegador compartido disponible: al abrir producción en `/admin/configuracion`, la aplicación redirigió a `/admin/login`, que mostró el formulario de inicio de sesión. Esto evidencia que ese navegador compartido no tenía una sesión autenticada del propietario; no contradice el reporte de su sesión en otro navegador/dispositivo.

| Comprobación | Evidencia y resultado |
|---|---|
| Lectura del rol en cliente | Inspección de `src/services/auth.ts`: `getCurrentEditorialRole` llama a `user.getIdTokenResult()` y reconoce `token.claims.superadmin === true`. |
| Integración con AuthContext | Inspección de `src/contexts/AuthContext.tsx`: al recibir el usuario autenticado, `applyUser` obtiene el rol y almacena `{ status: 'signed-in', user, role }`; los errores se muestran como estado explícito. |
| `/admin/configuracion` con superadmin | No verificado con la cuenta del propietario: el navegador de prueba llegó a `/admin/login` por no tener sesión; no se solicitó ni introdujo contraseña. |
| Protecciones de rutas exclusivas | Inspección de `src/routes/AdminRoutes.tsx`: `multimedia`, `banners`, `configuracion`, `usuarios` y `actividad` están envueltas con `AdminRoleGate` y `allowedRoles={['superadmin']}`. |
| Sesión autenticada sin rol | Inspección de `src/components/auth/AdminGuard.tsx`: `AdminGuard` muestra acceso denegado si no hay rol; `AdminRoleGate` muestra acceso denegado cuando el rol autenticado no está permitido. Prueba runtime con una cuenta sin rol no realizada, para no crear ni modificar usuarios. |
| Usuario no autenticado | Prueba de navegación en producción a `/admin/configuracion`: URL final `/admin/login`. |
| Errores de consola | Recarga de la página de login en producción: no se observaron errores de consola ni errores de página durante la ventana de comprobación. Solo aplica a la ruta de login sin autenticación, no a la sesión superadmin ni a módulos protegidos. |

No se modificaron usuarios, roles, claims, reglas, datos ni configuración de Firebase. No se desplegó ni se hizo commit/push. La tarea 41 permanece abierta hasta que el propietario pruebe con su sesión renovada el acceso permitido a `/admin/configuracion` y se complete una prueba controlada de acceso denegado para un usuario autenticado sin rol.

## Fase 1 — intervención 21: verificación de acceso y diagnóstico Firestore (2026-11-09)

### Sesión, claims y control de rutas

- El propietario informa que, después de la asignación del claim verificada mediante Admin SDK, cerró sesión y volvió a iniciarla. No se inspeccionó el ID token ni se usaron credenciales, cookies o tokens.
- Inspección de código: `getCurrentEditorialRole` llama a `user.getIdTokenResult()` y reconoce `token.claims.superadmin === true` o `editor === true`. `AuthContext` escucha `onIdTokenChanged`, calcula el rol y guarda el usuario/rol en su estado firmado. `refreshCurrentUser` llama a `getIdToken(true)` y luego `AuthContext.refresh()` aplica de nuevo al usuario.
- Las rutas `/admin/multimedia`, `/admin/banners`, `/admin/configuracion`, `/admin/usuarios` y `/admin/actividad` están envueltas por `AdminRoleGate` con `allowedRoles=['superadmin']`. `AdminGuard` también requiere sesión autenticada, email verificado y rol; sin rol muestra acceso denegado.
- La navegación de prueba a `https://continental997.fm/admin/configuracion` desde el navegador compartido sin sesión redirigió a `/admin/login`. La pantalla de login se cargó sin errores de consola/page error observados. No se autenticó al usuario propietario; por lo tanto, ni el claim del token renovado ni el acceso real del propietario a la ruta se comprobaron desde este navegador. El propietario había reportado una captura previa con el rol Superadministrador y la pantalla de configuración; queda como evidencia aportada por el propietario, no como prueba de esta sesión.
- No existe en esta intervención una prueba runtime del frontend para un usuario autenticado sin rol. No se creó ni modificó ninguna cuenta para generarla.

### Diagnóstico de `publicConfig/site`

- `src/services/content.ts` lee exactamente `doc(getDatabase(), 'publicConfig', 'site')` con `getDoc`; si el snapshot existe devuelve los datos y si no existe devuelve `null`. `RadioContext` consume esa función para la configuración pública y tiene valores estáticos de respaldo.
- Una consulta Admin SDK/ADC de solo lectura al proyecto explícito `radio997-d5380` confirmó `documentExists: false` para `publicConfig/site`; no se imprimieron datos de configuración. Admin SDK omite las reglas de cliente, por lo que este resultado confirma ausencia del documento, no el permiso del Client SDK.
- La regla local previa permitía leer `site` solo si `resource.data.keys()` estaba dentro de una lista blanca. En el caso de documento inexistente, el acceso a `resource.data` no permite evaluar la lista y la lectura resulta denegada; el Emulator reprodujo el `permission-denied`. Esto constituye la causa confirmada en la regla local anterior y una causa muy probable del error de producción dado que el documento tampoco existe.
- No se pudo confirmar la causa exacta en producción: las reglas activas siguen sin poder consultarse. El antecedente de lectura de Firebase Rules API fue HTTP 403, y Firebase CLI no ofrece en esta instalación un comando `firestore:rules:list`. Las reglas publicadas podrían coincidir con las locales, o podrían seguir siendo globalmente denegatorias como registraron intervenciones históricas; no se asumió equivalencia.
- Según el diseño del cliente —lectura por el `RadioContext` público y fallback cuando el documento no existe— la configuración debe ser de lectura pública, restringida a campos de configuración no privada. Las escrituras deben continuar limitadas al superadministrador verificado.

### Cambio local y Emulator

Se ajustó únicamente el archivo local `firestore.rules`: la lectura de `publicConfig/site` permite ahora el caso en que el documento no exista (para que el SDK devuelva un snapshot inexistente y el servicio retorne `null`); si existe, mantiene la lista blanca de campos. No se abrió escritura pública: crear/actualizar sigue requiriendo superadmin verificado, y borrar continúa denegado. Se extendió `scripts/firestore-rules.emulator.mjs` para cubrir lectura ausente y existente por visitante, rechazo de creación/actualización anónima, lectura por editor pero rechazo de escritura editorial y de editor en configuración, y lectura/actualización por superadmin.

Comando usado exclusivamente con Firestore Emulator y el proyecto demo `demo-radio-rules`:

```text
firebase emulators:exec --project demo-radio-rules --only firestore "node scripts/firestore-rules.emulator.mjs"
```

Resultado final: **7/7 pruebas aprobadas**. Los mensajes `PERMISSION_DENIED` que aparecen en la salida corresponden a operaciones negativas esperadas por `assertFails`; el proceso terminó con código 0. El Emulator se cerró al terminar.

### Pendientes y límites

1. El propietario debe volver a probar `/admin/configuracion` en su navegador ya autenticado y confirmar que ve la interfaz como Superadministrador; no compartir token ni contraseña.
2. Consultar en Firebase Console el ruleset activo y su fecha, o habilitar/usar lectura IAM autorizada de Rules API. No desplegar la regla local sin cotejar el ruleset y obtener autorización explícita.
3. Si la regla publicada coincide con la versión local anterior, revisar y autorizar por separado el despliegue de la corrección. Si es globalmente denegatoria, diagnosticar primero la publicación activa.
4. Una prueba de frontend con cuenta autenticada sin rol requiere un entorno de prueba adecuado con usuarios de prueba; no usar la cuenta de producción ni crear usuarios en esta intervención.

Sin cambios a Firestore de producción, usuarios, claims, Storage, Render o DNS. Sin deploy, commit o push. La tarea 41 permanece abierta hasta que el propietario pruebe con su sesión renovada el acceso permitido a `/admin/configuracion` y se complete una prueba controlada de acceso denegado para un usuario autenticado sin rol.

## Fase 1 — intervención 22: verificación de Rules API y preparación de configuración inicial (2026-11-09)

### Estado confirmado de reglas de producción

Se consultó Firebase Rules API con ADC de solo lectura y proyecto explícito `radio997-d5380`; no se solicitaron ni cambiaron permisos IAM y no se imprimieron credenciales. A diferencia del intento anterior, la consulta actual tuvo éxito:

| Dato | Resultado |
|---|---|
| Release | `projects/radio997-d5380/releases/cloud.firestore` |
| Ruleset activo | `projects/radio997-d5380/rulesets/8ec72ede-cdb8-4175-8381-5b5c3f025c25` |
| Última actualización de la release | `2026-11-07T20:52:54.854871Z` |
| Creación del ruleset | `2026-11-07T20:52:52.332692Z` |
| Contenido de Firestore activo | `match /{document=**} { allow read, write: if false; }` |

La API devolvió HTTP 200 para listar releases y leer el ruleset; no hubo 403. La versión activa deniega cualquier lectura y escritura de cliente en todas las rutas. No se accedió a Firebase Console; el contenido de Rules API proporciona evidencia directa del release activo.

### Comparación con `firestore.rules` local

Las versiones **no son equivalentes**. Producción contiene únicamente la denegación global descrita arriba. El archivo local `firestore.rules` incluye autenticación y reglas por colección:

- `publicConfig/site`: lectura pública del documento permitido si solo contiene campos de configuración; la versión local actual permite además recibir snapshot inexistente cuando el documento no está creado. Crear/actualizar requiere email verificado y claim `superadmin: true`; borrar se deniega.
- `users`: lectura del propio perfil por sesión autenticada o lectura por superadmin; cualquier escritura se deniega.
- `privateConfig`: lectura solo superadmin; escritura denegada.
- `adminLogs`: lectura solo superadmin; creación limitada a editor verificado y esquema permitido; actualización/borrado denegados.
- `posts`, `programs`, `schedule`, `categories`, `tags`, `media`, `banners`: lectura de registros publicados permitidos según estado/visibilidad, con lectura/gestión editorial autenticada para roles verificados según colección. `media` y `banners` son escritura exclusiva superadmin; otras colecciones de contenido permiten rol editorial (`editor` o `superadmin`) con validación de esquema. Borrado directo se deniega.
- Ninguna escritura anónima está permitida. `isSuperadmin()` requiere sesión autenticada, `email_verified == true` y `superadmin == true`; `isEditor()` acepta esos superadmins o email verificado con `editor == true`.
- La regla final global deniega todo lo no concedido explícitamente.

Por lo tanto, el `permission-denied` de producción tiene causa **confirmada**: el ruleset activo deniega todo acceso de Client SDK, independientemente de que exista `publicConfig/site`, de que el token tenga el claim superadmin o del código local. La ausencia del documento también fue confirmada mediante consulta de solo lectura Admin SDK (`documentExists: false`), pero no es la causa del error en producción mientras rijan las reglas globalmente denegatorias. No se publicó ni cambió el ruleset.

### Inicialización de `publicConfig/site`

`AdminSettingsPage` carga valores desde Firestore y, si el documento no existe, deja el formulario con estos defaults codificados (no son datos reales confirmados ni se guardaron):

- `stationName`: `Radio Continental 99.7 FM`.
- `slogan`: cadena vacía.
- `streamUrl`, `contactEmail`, `contactPhone`, `whatsappUrl`: `null`.
- `stationTimeZone`: `America/La_Paz` (constante `DEFAULT_BROADCAST_TIME_ZONE`).
- `socialLinks`: mapa con `instagram`, `facebook` y `youtube` vacíos.

No se completaron streaming, contactos ni redes sociales con valores inventados. En la UI, nombre y zona horaria son campos HTML `required`; slogan puede quedar vacío; otros campos son opcionales. En el modelo de reglas, la creación debe contener todos estos campos: `stationName`, `slogan`, `streamUrl`, `stationTimeZone`, `contactEmail`, `contactPhone`, `whatsappUrl`, `socialLinks`, `updatedAt`. `updatedAt` debe ser timestamp servidor. El servicio `updatePublicSiteConfig` verifica primero el claim superadmin y la validación del cliente, lee el documento en transacción y usa `serverTimestamp()`; las reglas comparan `updatedAt == request.time`, compatible con el server timestamp. `expectedUpdatedAt === null` hace fallar si el documento ya existe, evitando sobreescribir una creación concurrente; timestamps esperados desactualizados también provocan conflicto.

La escritura usa `transaction.set(configRef, { ...config, updatedAt: serverTimestamp() })` sin `{ merge: true }`: reemplaza el documento completo, por lo que eliminaría campos desconocidos preexistentes. Las reglas locales rechazan esquemas con claves extra en el resultado solicitado y solo permiten la lista blanca, pero conviene confirmar/cotejar el esquema antes de una inicialización real. No se creó ni modificó documento alguno.

### Pruebas y estado del Emulator

Se ejecutó exclusivamente Firestore Emulator con proyecto demo `demo-radio-rules`; los documentos sintéticos se sembraron solo dentro del Emulator y no representan información de producción. Suite actual: **7/7 pruebas aprobadas**, incluido el caso de configuración:

1. Lectura pública de `publicConfig/site` ausente devuelve snapshot inexistente.
2. Lectura pública permitida cuando el documento de prueba existe.
3. Creación y actualización por superadmin verificado permitidas.
4. Creación/actualización anónimas rechazadas.
5. Creación/actualización por editor rechazadas.
6. Lectura de `users`, `privateConfig`, `adminLogs` y gestión de `media` comprobadas según roles; los tests generales también comprueban denegaciones para usuario ordinario/no verificado y accesos editoriales.
7. Emulator terminó con código 0 y se detuvo. Mensajes `PERMISSION_DENIED` emitidos corresponden a aserciones `assertFails` esperadas.

### Archivos y acciones

Archivos locales tocados en esta intervención:

- `firestore.rules`: ya contenía el ajuste local para lectura de documento de configuración ausente; no se publicó.
- `scripts/firestore-rules.emulator.mjs`: prueba creación por superadmin desde estado ausente, lectura pública ausente/existente, y rechazos de escritura anónima/editor.
- `docs/AUDITORIA-INTEGRAL.md`: estado de tareas 3, 4 y 41, evidencia Rules API, comparación, análisis del formulario y pruebas.

Acción manual requerida: no cambiar reglas en Console desde este diagnóstico. El propietario debe revisar/aprobar la propuesta local contra el ruleset activo. Si autoriza publicarla desde el checkout correcto y tras confirmar que el archivo contiene el ruleset final esperado, el comando de publicación sería:

```powershell
firebase deploy --only firestore:rules --project radio997-d5380
```

El comando **no se ejecutó**. La publicación habilitaría accesos cliente definidos por las reglas locales, por lo que requiere autorización explícita y revisión previa; hasta entonces producción seguirá denegando todas las operaciones de Firestore. No se creó la configuración inicial, ni se cambió Firebase, IAM, usuarios, claims, Storage, Render o DNS. Sin despliegue, commit o push. La tarea 41 permanece abierta hasta que el propietario pruebe con su sesión renovada el acceso permitido a `/admin/configuracion` y se complete una prueba controlada de acceso denegado para un usuario autenticado sin rol.

## Fase 1 — intervención 19: asignación de primer superadministrador verificada (2026-11-09)

El propietario ejecutó `assign` desde una PowerShell interactiva y proporcionó la frase exacta solicitada por la CLI. El resultado compartido informa que la CLI confirmó la actualización para UID `JYpmvFjzLVV0e8u5FIunn9z4YpR2` y registró la auditoría local en `%LOCALAPPDATA%\RadioContinental99.7\admin-role-audit.jsonl`.

La consulta `show` posterior, también compartida por el propietario, devolvió:

| Campo | Resultado |
|---|---|
| UID / correo | `JYpmvFjzLVV0e8u5FIunn9z4YpR2` / `fdavidriojac@gmail.com` |
| Cuenta habilitada | Sí (`disabled: false`) |
| Correo verificado | Sí (`emailVerified: true`) |
| Custom claims | `{ "superadmin": true }` |

La verificación de lectura confirma el claim solicitado y no muestra claims adicionales. Esta evidencia fue proporcionada por el propietario en la conversación; no se repitió desde la sesión del agente. La tarea 41 continúa abierta únicamente para renovar el token o iniciar sesión de nuevo y probar que la cuenta accede a las rutas administrativas correspondientes. No se modificaron reglas, Storage, Render o DNS; no hubo commit, push o despliegue.

## Fase 1 — intervención 23: auditoría de seguridad de reglas Firestore (2026-11-09)

### Alcance y reglas de producción

Se revisaron las reglas locales completas, sus validadores por colección, las operaciones de `src/services/content.ts`, `src/services/admin.ts`, `src/services/media.ts`, los formularios administrativos y las consultas públicas. La suite se ejecutó solo contra Firebase Emulator con el proyecto demo `demo-radio-rules`; ningún dato sintético se envió a producción.

La última evidencia directa de producción documentada en la intervención 22 procede de Firebase Rules API: release `projects/radio997-d5380/releases/cloud.firestore`, ruleset `8ec72ede-cdb8-4175-8381-5b5c3f025c25`, actualizado `2026-11-07T20:52:54.854871Z`, con denegación global. No se volvió a consultar la API en esta intervención. Ese ruleset y el archivo local candidato **no son equivalentes**: publicar el candidato cambiaría materialmente la autorización de clientes. La verificación de la versión activa es evidencia histórica de solo lectura y no implica autorización para publicar.

### Matriz de permisos por colección

| Colección | Lectura | Crear / actualizar | Eliminar | Claims y validaciones principales | Acceso anónimo no previsto |
|---|---|---|---|---|---|
| `publicConfig` | Público solo para el ID `site`; si existe, debe respetar la lista blanca. La lectura de un documento inexistente devuelve snapshot inexistente. | Solo superadmin con email verificado; requiere todos los campos configurables, lista blanca, tipos y límites, enlaces sociales HTTPS permitidos y `updatedAt == request.time`. | Denegado. | `superadmin: true`, `email_verified: true`. | No: la lectura pública es intencional; no hay escritura anónima. |
| `users` | Usuario autenticado lee su propio UID; superadmin verificado puede leer perfiles. | Denegado para todos los clientes. | Denegado. | Perfil no puede otorgar claims ni editar roles desde el cliente. | No. |
| `privateConfig` | Solo superadmin verificado. | Denegado. | Denegado. | Email verificado y claim `superadmin`. | No. |
| `adminLogs` | Solo superadmin verificado. | Editor o superadmin verificado, con esquema permitido y log vinculado a una mutación del documento objetivo en la misma operación atómica. | Actualizar y eliminar denegados. | Actor debe ser el UID autenticado; timestamp igual a `request.time`; acción, colección, ID y resumen restringidos. La regla valida el documento de destino con `getAfter`. | No. |
| `posts` | Público solo publicado y no archivado; roles editoriales verificados pueden leer borradores/archivados. | Editor o superadmin verificado, campos permitidos, slug, límites de texto/listas, campos de auditoría y timestamps. | Denegado; archivar es una actualización validada. | `editor` o `superadmin`, con `email_verified`; superadmin también cumple editor. | No: consulta pública debe implicar publicado y no archivado. |
| `programs` | Igual que `posts`. | Editor o superadmin verificado; nombre, slug, categoría, conductores, duración opcional, enlaces sociales y listas validadas. | Denegado; archivado lógico. | Claims verificados; campos `createdBy`/`updatedBy` y timestamps protegidos. | No. |
| `schedule` | Igual que `posts`. | Editor o superadmin verificado; programa, día 0–6, horarios `HH:mm` y zona horaria. | Denegado; archivado lógico. | Claims verificados y auditoría del servidor. | No. |
| `categories` | Igual que `posts`. | Editor o superadmin verificado; nombre, slug, descripción limitada y orden entero no negativo. | Denegado; archivado lógico. | Claims verificados y esquema cerrado. | No. |
| `tags` | Igual que `posts`. | Editor o superadmin verificado; nombre y slug validados. | Denegado; archivado lógico. | Claims verificados y esquema cerrado. | No. |
| `media` | Superadmin verificado puede leer todo; público solo registros publicados, no archivados y con `visibility == public`. | Solo superadmin verificado; nombre, ruta `media/...`, MIME permitido, tamaño máximo 50 MiB, texto alternativo y visibilidad validados. | Denegado; archivado lógico. | Claim `superadmin`, email verificado, límites de esquema. Storage tiene reglas separadas y no queda certificado por esta auditoría de Firestore. | No: los borradores/privados no se leen públicamente. |
| `banners` | Superadmin verificado puede leer todo; público solo publicados y no archivados. | Solo superadmin verificado; etiqueta, ubicación permitida, ID de medio, URL HTTPS opcional, fechas/orden y esquema validados. | Denegado; archivado lógico. | Claim `superadmin`, email verificado. | No: registros no publicados quedan denegados. |

Todas las rutas no concedidas explícitamente caen en denegación global. Las colecciones editoriales cierran campos desconocidos; crear/actualizar exige conservar `createdBy`/`createdAt`, asignar `updatedBy` al UID autenticado y enviar timestamps de servidor. Ninguna regla de cliente permite autoasignarse roles.

### Hallazgo y corrección de integridad de actividad

La versión local previa permitía a un editor verificado crear un log con un actor propio, una acción aprobada y el ID de cualquier documento, incluso inexistente. Eso permitía falsificar eventos en la pantalla de actividad. Se corrigió localmente `firestore.rules`: cada `adminLogs` nuevo debe apuntar a un documento que exista después de la operación atómica y cuyos campos de UID/timestamp correspondan al actor; creación exige además creación simultánea del objetivo; `publish` requiere estado posterior publicado; `archive` requiere estado archivado. Para `publicConfig/site` se exige una actualización simultánea con `updatedAt == request.time`. El log sigue siendo append-only.

Se añadió una prueba negativa de log de publicación hacia documento inexistente y se cambió la prueba positiva para crear el registro editorial y su log en una única transacción, como hace el servicio. Esta restricción aplica solo a las reglas locales y **no se publicó**.

Riesgo residual: los logs son emitidos por clientes autenticados, no por un backend de confianza. La regla vincula el evento a una modificación real y al UID que la ejecutó, pero no puede demostrar por sí sola la veracidad semántica del texto de `summary` o que la etiqueta de acción corresponda exactamente a la intención humana. Si los logs deben ser evidencia forense, trasladar su creación a un backend confiable y conservar las escrituras directas de clientes denegadas.

### Compatibilidad de servicios y formularios

- `createRecord` y `updateRecord` validan el esquema en el cliente, saneando el HTML de posts con DOMPurify antes de escribir; las páginas públicas vuelven a sanear el HTML antes de renderizarlo. Los formularios de posts y programas envían los campos requeridos por reglas, incluso campos opcionales como `heroMediaId`, `imageMediaId` y `durationMinutes` como `null` cuando corresponde.
- Categorías, etiquetas, horarios y banners envían los nombres/campos admitidos. Los servicios agregan `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, estado y `publishedAt` cuando corresponde; los timestamps se generan con `serverTimestamp()`. Las transacciones de contenido agregan el log de actividad junto con la modificación, compatible con la nueva validación de `getAfter`.
- Las consultas públicas de posts/programas incluyen `status == published` e `isArchived == false`, incluyendo búsqueda, slug, orden y paginación. La programación pública usa también ambos filtros. La lectura pública de media añade la condición de visibilidad en reglas.
- No se encontró incompatibilidad de payload entre los formularios/servicios inspeccionados y los campos requeridos por las reglas locales. Las reglas no verifican que las referencias de categoría, programa, medio o banner apunten a documentos existentes; una referencia rota puede producir contenido incompleto, pero no concede acceso a Storage privado.
- `updatePublicSiteConfig` guarda con `transaction.set` sin `merge`; reemplaza el documento y eliminaría campos adicionales desconocidos. La lista blanca rechaza extras en el resultado, pero el esquema productivo debe revisarse antes de guardar. No se ejecutó la operación.
- Los límites de tamaño/tipo de cargas se aplican en el servicio y también hay reglas de Storage independientes; esta revisión no ejecutó la suite de Storage ni acredita que sus reglas activas coincidan.

### Pruebas y validación

Suite Firestore Emulator ejecutada con `JAVA_HOME` apuntando al JDK 21 instalado y proyecto demo `demo-radio-rules`: **11 pruebas aprobadas, 0 fallidas**. Se cubrieron:

1. Consultas de posts/programas con filtros públicos, búsqueda y slug; consultas sin filtros denegadas.
2. Lectura pública/privada de cada colección editorial, incluyendo consultas limitadas a publicados/no archivados y media pública.
3. Rechazo de consultas anónimas a `users`, `privateConfig` y `adminLogs`.
4. Creación/actualización por editor y superadmin en colecciones permitidas; rechazo de editor en media/banners.
5. Denegación de usuarios anónimos, cuentas sin correo verificado y usuarios sin rol.
6. Lectura y escritura de `publicConfig/site` por roles permitidos, incluido documento ausente.
7. Rechazo de elevación de rol, manipulación de actor/timestamp y log falso sin una mutación asociada.
8. Rechazo de borrado directo y lectura de borradores/archivados por visitantes.

Resultados complementarios: `npm test` **28/28 aprobadas**; `npm run lint` terminó con código 0 y advertencias existentes en componentes no relacionados; `git diff --check` pasó. Los `PERMISSION_DENIED` que aparecen en la salida del Emulator son aserciones negativas esperadas.

### Archivos, riesgos y veredicto

Modificados por esta intervención:

- `firestore.rules`: vinculación de logs a la mutación atómica objetivo.
- `scripts/firestore-rules.emulator.mjs`: consultas públicas para colecciones, consultas privadas denegadas, y pruebas de integridad de logs.
- `docs/AUDITORIA-INTEGRAL.md`: este registro; se conservaron las tareas y evidencias anteriores, incluidas las tareas originales.

No se tocó Firebase de producción, usuarios/claims, Firestore Rules desplegadas, Storage, IAM, Render, DNS ni datos. No hubo deploy, commit o push.

**Veredicto: NO APTO todavía para publicación.** La suite local pasó, pero la release productiva conocida es globalmente denegatoria y el candidato local concede permisos de cliente diferentes; no se reconsultó producción en esta intervención ni se verificaron colecciones/datos/índices reales actuales. Falta autorización explícita de publicación, revisión final del ruleset en Firebase Console/API y validación independiente de `storage.rules`/reglas activas de Storage. La tarea 41 conserva su estado previo; esta auditoría no verifica una sesión autenticada del propietario ni cambia roles.

## Fase 1 — intervención 24: validación final de candidato Firestore Rules (2026-11-09)

### Candidato y diferencias

Se revisó el candidato local completo y la diferencia relevante introducida desde el estado previo de esta fase: la integridad de `adminLogs` exige que el documento objetivo se cree o actualice en la misma operación atómica, y valida UID/timestamps y estado final para `create`, `publish` y `archive`. El resto de reglas documentadas en la intervención 23 mantiene los permisos específicos por colección, claims y correo verificado, listas de campos, validaciones de estado y denegación global por defecto. No hay `allow write` anónimo; la única lectura pública intencional de configuración es `publicConfig/site`, y el contenido editorial público está condicionado a `status == published` e `isArchived == false` (media además requiere `visibility == public`). Roles solo se aceptan desde `request.auth.token` con `email_verified == true`; no hay escritura cliente a `users`, y borrados directos siguen denegados.

Las reglas de Firestore no son filtros: consultas públicas deben probar que sus filtros implican el predicado de lectura. Las consultas frontend revisadas de publicaciones, programas y programación incluyen estado publicado y no archivado; el acceso público a media añade visibilidad pública. Las pruebas Emulator confirman denegación de consultas amplias que no pueden demostrar esos predicados y de lecturas a `users`, `privateConfig` y `adminLogs` por visitantes. Las lecturas administrativas de borradores requieren rol verificado; un documento privado no se hace legible mediante otra consulta pública.

Firebase Rules API se consultó nuevamente con ADC, usando solo GET para el proyecto explícito `radio997-d5380`; no se imprimieron tokens ni se pidieron permisos. Resultado actual al momento de la consulta:

| Dato | Resultado |
|---|---|
| Release | `projects/radio997-d5380/releases/cloud.firestore` |
| Ruleset activo | `projects/radio997-d5380/rulesets/8ec72ede-cdb8-4175-8381-5b5c3f025c25` |
| Fecha de actualización | `2026-11-07T20:52:54.854871Z` |
| Contenido | `match /{document=**} { allow read, write: if false; }` |

Producción, por tanto, continúa sin permitir operaciones Firestore de cliente; el candidato local difiere materialmente. Publicarlo habilitaría las lecturas públicas acotadas y escrituras administrativas descritas arriba. Esto no es una equivalencia ni un cambio ya aprobado.

### `adminLogs`: compatibilidad con operaciones frontend

La búsqueda de escrituras encontró un solo helper de creación en `src/services/content.ts` (`appendAdminLog`); el resto de apariciones son consultas de lectura en `src/services/admin.ts`. `appendAdminLog` recibe una función de escritura de transacción y se invoca desde:

- `createRecord`, dentro de la misma transacción que crea el documento.
- `createProgramWithSchedule`, dentro de la transacción que crea programa y horarios.
- `updateProgramWithSchedule`, para actualización/creación/archivado de slots y actualización del programa, dentro de una transacción.
- `duplicateProgramWithSchedule`, para el programa duplicado y los slots duplicados, dentro de una transacción.
- `updateRecord`, para cambios editoriales, junto con la actualización del objetivo.
- `archiveRecord`, junto con la actualización de estado a archivado.
- `updatePublicSiteConfig`, junto con `transaction.set` de `publicConfig/site`.

No se encontraron servicios alternativos que creen logs fuera de la transacción asociada. Las reglas permiten esos flujos según su estado final; la suite Emulator verificó una creación atómica con log y rechazó un log de publicación hacia documento inexistente. La revisión de seguridad independiente no identificó vulnerabilidades en los cambios revisados.

Los registros **no son auditoría forense independiente**: los crea el mismo cliente autenticado y el cliente elige la etiqueta/summary. La regla los vincula a una modificación real del UID actor, pero no verifica la intención humana ni ofrece evidencia independiente del servidor. Si se requiere valor probatorio, debe trasladarse la generación a un backend confiable; no se hizo ese cambio.

### Referencias entre documentos y configuración inicial

Las reglas validan tipo, formato, longitud, campos y, en casos concretos, UID/fechas; no comprueban en general que referencias editoriales existan:

- `posts.categoryIds`, `tagIds`, `heroMediaId`; `programs.categoryId`, `imageMediaId`; `schedule.programId`; y `banners.mediaId` son strings/listas validados, pero Rules no hace lookup que garantice existencia ni compatibilidad del documento referenciado.
- La UI limita opciones a registros cargados en formularios y los servicios validan forma; no se encontró una garantía de integridad referencial en el servidor. Un cliente autorizado que construya solicitudes directamente podría guardar referencias colgantes. Esto afecta integridad/calidad de contenido, no concede por sí mismo lectura de documentos privados ni acceso a objetos Storage.
- Para medios, la regla Firestore limita `storagePath` al prefijo `media/` y valida MIME/tamaño declarados, pero la autorización real del objeto depende de `storage.rules`, que está fuera del alcance y no se modificó ni se certificó aquí.

Para `publicConfig/site`, la allowlist tiene nueve campos: `stationName`, `slogan`, `streamUrl`, `stationTimeZone`, `contactEmail`, `contactPhone`, `whatsappUrl`, `socialLinks`, `updatedAt`. Todos son obligatorios en la creación/actualización. `stationName` debe ser string no vacío (máximo 100); `slogan` string (máximo 240, admite vacío); `stationTimeZone` string no vacío (máximo 80 en Rules; el frontend valida que sea una zona IANA); `socialLinks` mapa limitado a `instagram`, `facebook`, `youtube`, con valores vacíos o HTTPS. `streamUrl`, `contactEmail`, `contactPhone` y `whatsappUrl` aceptan `null`; si son no nulos, sus tipos/formatos/límites se validan. `updatedAt` debe coincidir con `request.time` y el frontend envía `serverTimestamp()`.

El servicio crea o actualiza mediante transacción y `transaction.set(ref, data)` **sin merge**, por tanto reemplaza el documento completo y elimina campos desconocidos. Un `expectedUpdatedAt` nulo previene pisar una creación concurrente; un timestamp no coincidente rechaza una edición concurrente. Las reglas locales también restringen los campos guardados. No se creó ni cambió ningún documento en producción.

### Pruebas ejecutadas

| Comando / comprobación | Resultado |
|---|---|
| `firebase emulators:exec --only firestore --project demo-radio-rules "node scripts/firestore-rules.emulator.mjs"` con JDK 21 | 11/11 aprobadas; solo Emulator demo |
| `npm test` | 28/28 aprobadas |
| `npm run typecheck` | Aprobado (`tsc -b --pretty false`) |
| `npm run lint` | Código de salida 0; advertencias Oxlint en código preexistente no relacionado con estas reglas |
| `git diff --check` | Aprobado |
| Firebase Rules API GET para release y ruleset | Aprobado; versión y contenido listados arriba |

No se ejecutaron pruebas de escritura en producción.

### Reversión, veredicto y límites

Procedimiento de reversión: antes de publicar, guardar/registrar la versión activa indicada arriba. Si tras una publicación se requiere revertir, desde Firebase Console → Firestore Database → Rules → History seleccionar y restaurar el ruleset previo `8ec72ede-cdb8-4175-8381-5b5c3f025c25`, y comprobar después release/ruleset por lectura. Ese ruleset es globalmente denegatorio: la reversión detendría todas las lecturas y escrituras de Firestore Client SDK, por lo que debe tratarse como emergencia de contención, no como restauración funcional. Si History no permite restaurarlo, recuperar exactamente su contenido global-deny en un archivo temporal y desplegar solo tras autorización explícita. No se hizo ninguna reversión ni publicación.

**Veredicto: B. APTO CON OBSERVACIONES.** No se detectaron bloqueos técnicos de seguridad en el candidato Firestore; suite de Emulator, pruebas del repositorio y compatibilidad revisada aprobaron. Requiere aceptación expresa de que publicar cambia producción desde denegación global a los permisos especificados; los logs no son forenses, las referencias entre documentos no se verifican en servidor y la configuración usa reemplazo completo. La actividad no tiene autorización de publicación, y Storage/índices/datos reales no son certificados por este examen.

El comando solicitado, si el propietario acepta expresamente esas observaciones y decide publicar, es:

```powershell
firebase deploy --only firestore --project radio997-d5380
```

Ese selector publica la configuración de Firestore del proyecto, incluidas reglas e índices referenciados por `firebase.json`; confirmar que se desea incluir el manifiesto de índices y revisar su diff antes de ejecutarlo. **No se ejecutó.** No se modificaron usuarios/claims, datos, Storage, IAM, Render o DNS. Sin deploy, commit o push. Se preservaron las 29 tareas originales y todas las adicionales; la tarea 41 no se marca como completada por esta intervención.

## Fase 1 — intervención 25: preparación controlada de publicación de reglas (2026-11-09)

### Proyecto y alcance del comando

- Google Cloud CLI indicó proyecto activo `radio997-d5380`; la consulta de solo lectura `gcloud projects describe radio997-d5380` devolvió el mismo ID y número de proyecto `527560734998`.
- `firebase.json` declara `firestore.rules` y `firestore.indexes.json` bajo `firestore`, además de una sección separada `storage.rules`.
- Se consultó `firebase deploy --help` localmente. Su selector `--only` limita por targets. Por la configuración presente, `firebase deploy --only firestore --project radio997-d5380` no es exclusivo de reglas: puede desplegar reglas **e índices** Firestore. No incluye Storage porque Storage es otro target, pero sí excede el alcance de esta preparación.
- Para publicar exclusivamente reglas, el selector específico es `firestore:rules`. Comando preparado:

```powershell
firebase deploy --only firestore:rules --project radio997-d5380
```

Ningún comando de despliegue fue ejecutado. El comando propuesto en el encabezado de esta intervención (`--only firestore`) se registra como demasiado amplio para el requisito “solo reglas”; no debe usarse si no se desea publicar índices.

### Ruleset activo y respaldo verificable

Se repitieron llamadas GET de Firebase Rules API mediante ADC, en el proyecto explícito `radio997-d5380`; no se imprimieron tokens ni se hicieron cambios de IAM. Se recuperó:

| Dato | Resultado |
|---|---|
| Release | `projects/radio997-d5380/releases/cloud.firestore` |
| Ruleset activo | `projects/radio997-d5380/rulesets/8ec72ede-cdb8-4175-8381-5b5c3f025c25` |
| Actualización | `2026-11-07T20:52:54.854871Z` |
| Reglas activas | Denegación global de lectura y escritura |

Se guardó la respuesta de contenido en [firestore-rules-active-8ec72ede-cdb8-4175-8381-5b5c3f025c25.rules](./backups/firestore-rules-active-8ec72ede-cdb8-4175-8381-5b5c3f025c25.rules). Se calculó SHA-256 tanto sobre el contenido recibido de Rules API codificado como UTF-8 sin BOM como sobre el archivo de respaldo; ambos hashes coinciden:

`ECF30F940747DCC3C5BA4993093E9A11AC9FC5DF7E14B2A1512D2446923D84EB`

El respaldo tiene 163 bytes. El contenido es el ruleset globalmente denegatorio exacto; conservarlo no implica que sea una reversión funcional, pues bloquearía todas las operaciones Firestore de cliente.

### Identidad del candidato y pruebas asociadas

- SHA-256 actual de `firestore.rules`: `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38` (17 999 bytes).
- La última modificación del archivo es `2026-11-09T21:16:31Z`, correspondiente al candidato auditado en la intervención 24; en esta intervención no se modificó el archivo de reglas. El diff local respecto del baseline de Git contiene la vinculación de `adminLogs` a la mutación atómica documentada en la intervención 24.
- `scripts/firestore-rules.emulator.mjs` carga directamente `../firestore.rules` mediante `readFile` y entrega esos bytes a `initializeTestEnvironment`, por lo que la suite comprueba el archivo candidato actual, no una copia independiente.
- Se volvió a ejecutar exclusivamente el Emulator con proyecto demo `demo-radio-rules`: **11/11 aprobadas**. No se hicieron escrituras contra producción.
- No se registró un SHA-256 durante la intervención 24; por eso la identidad criptográfica histórica bit a bit no puede compararse con una huella previa. La versión actual coincide con la revisión de intervención 24 por el contenido/diff y fecha de modificación, pero la ausencia de esa huella histórica se conserva como limitación documental.

### Plan de publicación, verificación y reversión (no ejecutado)

Una vez que el propietario dé autorización expresa de publicación, desde la raíz de este checkout:

1. Recalcular y comparar SHA-256 de `firestore.rules` con `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38`.
2. Confirmar el proyecto explícito `radio997-d5380`; no confiar en el proyecto predeterminado local.
3. Ejecutar solo el target de reglas:

   ```powershell
   firebase deploy --only firestore:rules --project radio997-d5380
   ```

4. Después, consultar por GET Rules API `projects/radio997-d5380/releases/cloud.firestore` y su `rulesetName`; verificar actualización/versión y que el ruleset publicado corresponda al hash/candidato revisado. Confirmar también en Firebase Console → Firestore → Rules que el contenido publicado coincide.
5. Realizar pruebas de lectura/escritura autorizadas solo después de la publicación y en un plan separado; no probar escrituras de producción como parte de esta preparación.

Reversión: utilizar Firebase Console → Firestore → Rules → History para restaurar el ruleset previo `8ec72ede-cdb8-4175-8381-5b5c3f025c25`, o, con autorización de reversión independiente, restaurar el archivo de respaldo y ejecutar un despliegue solo de reglas. Luego volver a verificar release y contenido mediante GET. Esa versión de respaldo deniega globalmente todo acceso cliente, por lo que la reversión provocaría indisponibilidad de las funciones Firestore del sitio; es únicamente una opción de contención y requiere aceptación del impacto.

### Bloqueos y estado

1. No existe hash histórico de intervención 24 para demostrar identidad criptográfica retrospectiva.
2. El comando autorizado para “preparar” indicado por el usuario (`firebase deploy --only firestore`) incluye índices y no es adecuado para una publicación exclusiva de reglas. El comando correcto es `--only firestore:rules`; requiere confirmación/autorización antes de cualquier ejecución.
3. Producción mantiene denegación global; publicar el candidato cambiará sustancialmente el acceso cliente. La publicación y las pruebas funcionales productivas quedan pendientes de autorización separada.
4. Storage, contenido/índices reales y su estado no se modificaron ni se certificaron en esta intervención.

La intervención queda **preparada, no publicada**, y espera autorización expresa del propietario. No se modificaron reglas locales, índices, Storage, documentos, usuarios/claims, IAM, Render o DNS. No hubo deploy, commit o push.

## Fase 1 — intervención 25: ejecución bloqueada antes de publicar (2026-11-09)

El propietario autorizó explícitamente la publicación exclusiva de reglas. La autorización inicial contenía un comando contradictorio (`--only firestore`) junto con la restricción de no ejecutar ese comando/no publicar índices. Se pidió aclaración y el propietario seleccionó expresamente sustituirlo por `firebase deploy --only firestore:rules --project radio997-d5380`, manteniendo índices intactos.

Comprobaciones previas realizadas en la raíz `C:\Users\Usuario\RadioContinental99.7`:

| Comprobación | Resultado |
|---|---|
| Raíz del repositorio | Coincide con `C:\Users\Usuario\RadioContinental99.7` |
| SHA-256 de `firestore.rules` | Coincide: `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38` |
| Proyecto y número | `radio997-d5380`, `527560734998` |
| Firebase CLI | `firebase login:list` informa sesión iniciada para el correo del propietario |
| Acceso del CLI al listado de proyectos | No confirmado: `firebase projects:list --json` falló en “Preparing the list of your Firebase projects”; no entregó resultado que permita confirmar el acceso del CLI al target |
| Alcance | `firebase.json` asocia `firestore.rules` y `firestore.indexes.json` al target `firestore`; el selector específico verificado para reglas es `firestore:rules` |
| Rules API lectura | Ruleset previo `8ec72ede-cdb8-4175-8381-5b5c3f025c25`, contenido y respaldo verificado registrados arriba |

Debido al fallo del preflight de acceso del Firebase CLI, se detuvo el procedimiento antes de cualquier comando de despliegue. No se ejecutó ni `firebase deploy --only firestore` ni `firebase deploy --only firestore:rules`. No hubo escritura de producción ni cambios en reglas, índices, Storage, datos, usuarios/claims, IAM, Render o DNS.

**Estado:** publicación no ejecutada; se solicita al propietario resolver/verificar el acceso de Firebase CLI al proyecto y dar nuevas instrucciones. No se interpreta el fallo como prueba de falta de autorización ni se intenta un método alternativo para evitar el bloqueo.

## Fase 1 — intervención 26: diagnóstico de autenticación Firebase CLI (2026-11-09)

Diagnóstico de solo lectura; no se cerró sesión, no se cambió de cuenta, no se modificaron credenciales/configuración, IAM, reglas, variables ni recursos de producción; no hubo despliegue.

| Comprobación | Resultado |
|---|---|
| Directorio | `C:\Users\Usuario\RadioContinental99.7` |
| Firebase CLI | `14.17.0` |
| Cuenta mostrada por `firebase login:list` | `fdavidriojac@gmail.com` |
| `firebase projects:list --json` | Falló, código 2 |
| Error HTTP detallado (`firebase --debug projects:list`) | Renovación contra `https://www.googleapis.com/oauth2/v3/token` devolvió HTTP 400; la petición `GET https://firebase.googleapis.com/v1beta1/projects?pageSize=1000` devolvió HTTP 401 `Unauthenticated`, `invalid authentication credentials`. El CLI intentó refrescar token y volvió a obtener HTTP 400. Los cuerpos de respuesta se omitieron en la salida redactada; no se imprimieron tokens ni credenciales. |
| Estado de red | Las solicitudes llegaron a los endpoints de OAuth y Firebase API y recibieron respuestas HTTP; no hay evidencia de DNS, timeout o bloqueo de conectividad como causa primaria. |
| Estado IAM | No determinable para la sesión efectiva de Firebase CLI: la llamada falla en autenticación HTTP 401, antes de una evaluación de autorización IAM (403). No se puede concluir que esa cuenta tenga o no permisos IAM sobre el proyecto a partir de este resultado. |
| Google Cloud CLI independiente | `gcloud` 592.0.0; cuenta configurada `fdavidriojac@gmail.com`; proyecto activo `radio997-d5380`. `gcloud projects describe radio997-d5380` devolvió proyecto `radio997-d5380`, número `527560734998`. |
| ADC independiente | `gcloud auth application-default print-access-token` terminó correctamente sin revelar token; la consulta de lectura de proyecto tuvo éxito. En la intervención 25 también funcionó Rules API GET con ADC. Esto acredita ADC para esas consultas, no valida el token guardado por Firebase CLI ni autoriza a sustituir su login. |

### Causa y resolución mínima propuesta

Causa inmediata comprobada: **las credenciales OAuth almacenadas/usadas por Firebase CLI no son válidas o no pueden renovarse** (HTTP 400 del endpoint de token y 401 de Firebase Management API), aunque `login:list` muestre una identidad guardada. No parece ser un problema de conectividad. El acceso IAM de la cuenta CLI al proyecto permanece sin comprobar porque la API no llegó a la fase de autorización.

Procedimiento mínimo pendiente de autorización/acción del propietario: desde la sesión interactiva de Windows del propietario, volver a autenticar únicamente Firebase CLI con la cuenta autorizada (por ejemplo, `firebase login --reauth`; no usar el token de ADC como sustituto), completar la autenticación en el navegador y luego ejecutar `firebase projects:list`. Confirmar que `radio997-d5380` aparece y que el proyecto/número son correctos. Si el listado da HTTP 403 después de reautenticar, entonces el problema restante sí apunta a acceso/permisos de esa identidad y debe resolverlo un administrador en IAM/Firebase Console; no solicitar ni cambiar IAM desde este diagnóstico. No se ejecutó ni se recomienda ningún despliegue hasta completar esa comprobación.

La publicación exclusiva de reglas sigue detenida. El comando, solo después de acceso confirmado y revalidación del hash autorizado, permanece `firebase deploy --only firestore:rules --project radio997-d5380`; no se ejecutó. No se hicieron escrituras en producción.

## Fase 1 — intervención 27: publicación exclusiva de Firestore Rules (2026-11-09)

### Preflight y despliegue autorizado

El propietario autorizó explícitamente publicar únicamente `firestore.rules`. Desde la raíz `C:\Users\Usuario\RadioContinental99.7` se verificó:

- Proyecto objetivo `radio997-d5380`, número `527560734998`.
- SHA-256 de `firestore.rules`: `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38`, igual al hash autorizado.
- Firebase CLI autenticado con la cuenta del propietario; `firebase projects:list --json` mostró el proyecto esperado y número.
- El selector fue exclusivamente `firestore:rules`, no `firestore`. `firebase.json` declara por separado reglas/índices Firestore y Storage; el target específico no incluyó índices ni Storage.

Comando ejecutado:

```powershell
firebase deploy --only firestore:rules --project radio997-d5380
```

Resultado de Firebase CLI: `firestore.rules` compiló correctamente y se publicó a `cloud.firestore`; el comando terminó `Deploy complete!`. El log anunció la lectura de `firestore.indexes.json` como parte de la inspección de configuración, pero no seleccionó ni reportó publicación de índices. No se desplegó ningún otro target.

### Verificación posterior de Rules API

Se consultó Rules API con ADC y únicamente operaciones GET después del despliegue:

| Dato | Resultado |
|---|---|
| Proyecto | `radio997-d5380` (`527560734998`) |
| Release activa | `projects/radio997-d5380/releases/cloud.firestore` |
| Ruleset nuevo | `projects/radio997-d5380/rulesets/a1efe076-671c-4d04-83b7-8bb0d1a6f47e` |
| Fecha de actualización | `2026-11-09T22:51:31.496502Z` |
| Archivos fuente del ruleset | 1 |
| SHA-256 del contenido devuelto por Rules API | `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38` |
| SHA-256 del archivo local | `E31F6B82CC931121AB322A49A963B660F05474786B8047A29021557C2480FB38` |
| Comparación de contenido | Coincide carácter por carácter tras normalizar saltos de línea |

Esto confirma que la release activa contiene el candidato autorizado. No se realizaron otras escrituras productivas. No se creó `publicConfig/site`, ni se probaron escrituras contra producción. No se ejecutó una prueba de lectura de la aplicación después de publicar.

### Estado y siguientes verificaciones

La tarea 4 queda actualizada con evidencia de publicación exclusiva de reglas; no implica que índices o Storage se hayan publicado ni que se haya validado acceso funcional del sitio. La tarea 41 conserva su estado anterior y no se marca completada por esta publicación. La Fase 1 sigue abierta hasta revisar el efecto de las nuevas reglas y continuar la inicialización de forma autorizada.

Siguiente acción separada: el propietario debe revisar el resultado y autorizar explícitamente la prueba funcional de lectura de configuración; no crear aún `publicConfig/site`. Para una reversión, el respaldo del ruleset previo está en `docs/backups/firestore-rules-active-8ec72ede-cdb8-4175-8381-5b5c3f025c25.rules`; como contiene denegación global, restaurarlo dejaría inaccesibles desde el cliente todas las operaciones Firestore. Toda reversión requiere autorización expresa, publicación exclusiva `firestore:rules` y verificación posterior por Rules API.

Sin modificación de índices, Storage, documentos, colecciones, usuarios/claims, IAM, Render o DNS. Sin commit ni push. La auditoría documental es el único archivo actualizado después del despliegue.

## Fase 1 — intervención 28: pruebas funcionales posteriores a la publicación (2026-11-09)

### Alcance y restricciones

Se revisó la aplicación pública de `https://continental997.fm/` en navegador, sin iniciar sesión, sin usar credenciales del propietario y sin ejecutar escrituras. No se crearon documentos ni se modificaron reglas, índices, usuarios, claims, IAM, Storage, Render o DNS. No se avanzó a Fase 2.

### Resultados de producción

| Comprobación | Estado | Evidencia y limitaciones |
|---|---|---|
| Lectura pública de categorías | FALLIDO | La página de inicio muestra el error de Firebase `failed-precondition`: la consulta pública de `categories` requiere un índice compuesto. El mensaje incluye el enlace generado por Firebase para crearlo. No es `permission-denied`; no permite concluir si hay documentos de categoría. No se creó el índice. |
| Lectura pública de publicaciones | FALLIDO | La carga de publicaciones muestra `failed-precondition`: la consulta pública de `posts` requiere un índice compuesto. No es `permission-denied`; no permite concluir si hay publicaciones publicadas. No se creó el índice. |
| Lectura pública de programas | PENDIENTE | La portada muestra “Programas pendientes”/“Los programas se mostrarán al publicarse en la grilla”, pero la sesión disponible no produjo evidencia suficiente para distinguir colección vacía de error de consulta. No se clasificó como documento inexistente ni como permiso denegado. |
| Lectura de programación | PENDIENTE | La interfaz muestra “Sin programación confirmada” y “No disponible”. No se obtuvo evidencia suficiente para distinguir ausencia de documentos de error de consulta. |
| Lectura de `publicConfig/site` | PENDIENTE | La interfaz muestra streaming pendiente de configuración. No expone si `getPublicSiteConfig()` recibió un snapshot inexistente (`null`) o si la lectura falló. El servicio implementa ambas rutas por separado, pero no se obtuvo resultado de esa consulta en producción. No se creó el documento. |
| Acceso al panel administrativo con sesión existente | PENDIENTE | El navegador disponible no tenía sesión de superadministrador; se observó la pantalla de login. No se inició sesión, no se cambiaron credenciales y no se solicitó información sensible. Perfil, datos administrativos y secciones del panel quedan sin comprobar. |
| Rutas públicas directas `/noticias`, `/programas` y `/programacion` | FALLIDO | Al solicitar cada ruta directamente, la navegación terminó en `https://continental997.fm/index.html` con respuesta HTTP 200; una vez cargada la aplicación, el router mostró “404 · Página no encontrada”. La respuesta HTTP exitosa no significa que la ruta funcione. Debe revisarse el rewrite/redirect existente sin cambiar Render desde esta intervención. |
| Consola y red durante la carga de portada | APROBADO | En la captura instrumentada inicial no hubo errores de consola JavaScript, `pageerror` ni solicitudes fallidas de red. Sí hubo errores de consulta Firebase mostrados por la propia interfaz: faltan índices. Las respuestas HTTP 200 del canal Firestore no descartan errores de aplicación enviados en el protocolo. |
| Permisos de escritura en producción | NO APLICA | No se hicieron escrituras de prueba, de acuerdo con las restricciones. Los permisos se cubrieron previamente en Emulator (11/11); una verificación funcional de escritura productiva requeriría autorización y un plan de prueba controlado, que no se ejecutó. |

### Diagnóstico y siguientes pasos

Los errores reproducidos de categorías y publicaciones son de precondición por falta de índices compuestos requeridos por las consultas, no de permisos. La aplicación no pudo completar esas lecturas públicas. Las consultas de programas, programación y configuración deben mantenerse como pendientes hasta obtener evidencia inequívoca de snapshot vacío o error específico; no inferir ausencia de documentos a partir de textos predeterminados.

Antes de considerar validada la lectura pública, el propietario debe revisar los índices requeridos para `categories` y `posts` en Firebase Console y autorizar explícitamente cualquier publicación de índices. Las rutas directas necesitan un diagnóstico independiente del hosting/router. La verificación administrativa solo puede continuar con el propietario utilizando su sesión preexistente en su propio navegador; no compartir ni exportar tokens o credenciales.

La suite anterior del Emulator no cambia este resultado: valida reglas contra datos de prueba en `demo-radio-rules`, pero no acredita que índices, documentos y consultas de producción estén listos. No se publicaron índices ni se hicieron cambios de producción. Fase 1 permanece abierta; no se recomienda avanzar a Fase 2.

## Fase 1 — diagnóstico solicitado como intervención 27: índices, rutas y lecturas (2026-11-09)

> Nota de historial: el repositorio ya contiene una intervención 27 de despliegue exclusivo de Firestore Rules y una intervención 28 de pruebas funcionales. Se conserva ese historial y se registra este pedido posterior como diagnóstico solicitado con número 27, sin renumerar intervenciones previas.

### A. Índices Firestore

#### Consultas y causa

`listPublished()` en `src/services/content.ts` filtra `status == "published"` e `isArchived == false`, ordena `publishedAt DESC` y limita resultados. Esa es la consulta exacta observada para `categories` en portada. `listPublicContentPage('posts', { pageSize: 4 })`, también usada en portada, filtra los mismos dos campos y ordena `publishedAt DESC`, sin faceta ni término de búsqueda.

La aplicación de producción mostró estos errores de Firestore:

- `categories`: `failed-precondition`, la consulta requiere un índice; Firestore generó un enlace de creación para `collectionGroups/categories`, con campos `isArchived ASC`, `status ASC`, `publishedAt DESC` y el orden implícito de `__name__`.
- `posts`: `failed-precondition`, la consulta requiere un índice; Firestore generó un enlace de creación para `collectionGroups/posts`, con campos `isArchived ASC`, `status ASC`, `publishedAt DESC` y el orden implícito de `__name__`.

Son fallos de índice y no `permission-denied`; no indican si las colecciones contienen documentos.

#### Comparación con `firestore.indexes.json`

El archivo local contiene 28 índices compuestos. Los dos índices requeridos sí están declarados y sus campos y direcciones coinciden con las consultas/error reportados:

```json
{
  "collectionGroup": "categories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isArchived", "order": "ASCENDING" },
    { "fieldPath": "publishedAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isArchived", "order": "ASCENDING" },
    { "fieldPath": "publishedAt", "order": "DESCENDING" }
  ]
}
```

Las URLs de Firebase incluyen `__name__` como campo de desempate implícito; no se declara manualmente en la configuración normal. El orden textual de los campos de igualdad en el JSON es independiente del orden de filtros en el código.

No se detectó una definición faltante en el archivo local para esos dos errores. La respuesta `failed-precondition` de producción demuestra que el índice requerido no estaba disponible para esa consulta en el momento de la prueba (ausente o aún no listo), pero no determina cuál de esos dos estados. No se pudo obtener el catálogo de índices de producción mediante API: `gcloud` no está disponible en el PATH de esta sesión, y no se hizo otra autenticación ni se solicitaron permisos. Por tanto, la comparación de estado de despliegue se limita a la evidencia de consulta y no afirma una lectura directa del catálogo productivo.

#### Otras consultas e índices relacionados

- Contenido público (`posts`/`programs`) sin filtros de categoría/búsqueda usa los índices base `status ASC`, `isArchived ASC`, `publishedAt DESC`.
- Búsqueda usa `searchTerms ARRAY_CONTAINS` junto con estado/archivo/publicación; están declarados índices para ambas colecciones.
- Filtros de categoría: `posts.categoryIds ARRAY_CONTAINS` y `programs.categoryId ASC` con estado/archivo/publicación tienen índices declarados.
- Filtro por etiqueta de posts (`tagIds ARRAY_CONTAINS`) tiene índice declarado.
- Fechas `from`/`to` filtran el mismo `publishedAt` ya ordenado; el índice base/faceta correspondiente está declarado.
- `findPublishedBySlug()` usa `slug`, `status`, `isArchived`; ambos índices posts/programs están declarados.
- `listPublicSchedule()` usa `status`, `isArchived` y orden por `startTime`; el índice está declarado. Su variante por `dayOfWeek` también tiene índice declarado.
- `listPublicProgramSchedule()` usa `programId`, `status`, `isArchived`, luego `dayOfWeek` y `startTime`; el índice exacto está declarado.
- Las consultas de listado administrativo por `status`/`updatedAt` tienen índices declarados para las colecciones editoriales. Las consultas de conteo y solapamiento usan igualdades sin orden compuesto; su necesidad debe revisarse por la consulta real si Firebase devuelve un nuevo `failed-precondition`.

Como posible redundancia/no uso: el índice `schedule(status, isArchived, publishedAt DESC)` aparece en el JSON, pero las búsquedas de `schedule` encontradas en el frontend no filtran/ordenan por `publishedAt`; la lectura pública ordena por `startTime`, las de programa usan `programId` y la administración usa `updatedAt`. No se elimina: antes de depurarlo, verificar todos los consumidores y el catálogo productivo. No hay evidencia suficiente para declarar redundantes otros índices sin contrastar usos fuera del frontend inspeccionado.

**Clasificación:** causa identificada: índices requeridos no disponibles en producción al probar; riesgo alto de que fallen los listados públicos. Solución recomendada: comparar la consola/catálogo Firestore con las 28 definiciones locales y, con autorización, publicar únicamente índices Firestore y esperar estado `READY`, sin volver a desplegar reglas. No se publicó ni creó índice en esta intervención.

### B. Rutas de producción

El router local registra las tres páginas como rutas públicas anidadas en `PublicLayout`: `programas` → `ProgramsPage`, `noticias` → `NewsPage` y `programacion` → `SchedulePage`, con ruta comodín a `NotFoundPage`. `main.tsx` monta `BrowserRouter` sin `basename`. No se encontraron redirecciones de estas rutas a `/index.html` en los componentes.

`render.yaml` contiene rewrites exactos de `/noticias`, `/programas` y `/programacion` a `/index.html`; los componentes y rutas del SPA son compatibles con la URL original si el rewrite es interno. Sin embargo, navegación instrumentada en producción observó para `/noticias` una respuesta HTTP `301 Location: /index.html`; el mismo comportamiento final se reprodujo al navegar directamente a `/programas` y `/programacion`. Luego `/index.html` carga la aplicación y React muestra su 404 porque `index.html` no coincide con ninguna ruta pública declarada. `curl` de esta sesión obtuvo HTTP 200 para las rutas y el mismo HTML que `/`, discrepancia que puede depender de la capa/request o caché; por eso el `301` instrumentado es evidencia concreta de navegación, no una atribución concluyente a una regla específica.

**Causa identificada:** el fallo visible ocurre porque la navegación llega como `/index.html`, que el router correctamente considera no encontrado. El origen inmediato del cambio de URL es una respuesta HTTP 301 antes de la selección del componente. La configuración local declara un rewrite, no una redirección; esto apunta a configuración efectiva del servidor/CDN distinta de la local o una regla externa, no a ausencia de rutas en React. No se pudo verificar el Blueprint/configuración activa de Render ni reglas de Cloudflare desde el dashboard.

**Clasificación:** fallo de servidor/ruta en producción; riesgo alto porque las rutas editoriales y de programación no abren por URL directa y la navegación enlazada puede verse afectada. Solución recomendada: el propietario debe revisar la configuración activa del static site y reglas/redirects de CDN, confirmar que el rewrite preserva la URL solicitada y luego probar navegación directa y enlaces internos. Requiere autorización para modificar Render/CDN y desplegar; no se hizo.

### C. Cómo verificar lecturas pendientes sin escribir

| Recurso | Lectura correcta | Cómo distinguir estados |
|---|---|---|
| `programs` | Consultar `listPublished('programs', n)` o `listPublicContentPage('programs', options)` con los mismos filtros y orden de la app. | `[]`/página vacía tras promesa resuelta significa consulta exitosa sin documentos que cumplan filtros; `failed-precondition` indica índice no disponible; `permission-denied` indica reglas/permisos; otros errores conservan su código/mensaje traducido. Una consulta exitosa vacía no demuestra que la colección completa carezca de borradores/archivados. |
| `schedule` | Consultar `listPublicSchedule()` o su variante con día; para horarios de un programa usar `listPublicProgramSchedule(programId)`. | `[]` exitoso indica que no hay documentos que cumplan los filtros públicos; excepción de índice, permiso o red debe conservarse como error, no presentarse como vacío. |
| `publicConfig/site` | Usar `getPublicSiteConfig()`, que hace `getDoc(doc(db, 'publicConfig', 'site'))`. | Snapshot resuelto con `exists() === false` se convierte en `null` y significa documento inexistente. Excepción `permission-denied` es fallo de reglas. `failed-precondition` indica índice solo si la lectura concreta lo reporta (este acceso por ID no requiere índice); errores de red/configuración se conservan como excepción de aplicación. No crear el documento. |

Para una comprobación inequívoca, registrar en una sesión de solo lectura el resultado de la promesa (`fulfilled` más cantidad/existencia) o el código Firebase original preservado por `toFirebaseServiceError`; no inferirlo desde etiquetas genéricas de la UI. La sesión actual no obtuvo resultados verificables para programs/schedule/config, por lo que permanecen pendientes.

### D. Panel administrativo: lista manual para el propietario

Usar únicamente su sesión ya autenticada y su dispositivo; no compartir contraseñas, tokens ni capturas que expongan datos sensibles:

1. Abrir `/admin`; observar el estado de carga y si se conserva la sesión. Confirmar encabezado/identidad y rol esperado, sin exportar el token.
2. Recargar la página y confirmar persistencia; revisar que correo verificado y rol provienen del estado autenticado/claims, no de campos editables.
3. Abrir dashboard y secciones lectura de publicaciones, programas y programación; registrar si carga datos, muestra vacío o presenta código/mensaje de error.
4. Como superadministrador, abrir configuración, usuarios y actividad solo en lectura; no guardar formularios ni ejecutar botones de mutación durante esta prueba.
5. Si aparece error, anotar ruta, hora, texto/código Firebase visible y operación que falló, sin copiar credenciales ni datos personales.

El código revisado usa persistencia local de Firebase Auth (`browserLocalPersistence`), escucha `onIdTokenChanged`, consulta claims `superadmin`/`editor` y exige email verificado en `AdminGuard`. Esta revisión estática no sustituye la comprobación en sesión real; panel, perfil y módulos administrativos permanecen **PENDIENTES**.

### E. Registro de hallazgos y orden sugerido

| Orden | Hallazgo / clasificación | Evidencia y archivos involucrados | Riesgo | Acción recomendada y autorización |
|---:|---|---|---|---|
| 1 | Índices faltantes/no listos en producción para consultas públicas de categorías y posts. | Errores `failed-precondition`; consultas en `src/services/content.ts`; definiciones ya presentes en `firestore.indexes.json`. | Alto: listas públicas no cargan. | Propietario compara índices activos y candidato, autoriza publicación solo de índices y espera `READY`; después repetir lectura sin escritura. |
| 2 | Respuesta de navegación cambia las rutas a `/index.html` antes de React. | Respuesta instrumentada `301 Location: /index.html`; rutas declaradas en `src/App.tsx`; `BrowserRouter` en `src/main.tsx`; rewrites locales en `render.yaml`. | Alto: rutas directas muestran 404 y la configuración local no coincide con comportamiento observado. | Revisar Render/CDN activos; toda modificación/despliegue requiere autorización expresa. |
| 3 | Resultado real de programs/schedule/config no distinguido de estado vacío/error. | Servicios `listPublished`, `listPublicSchedule`, `getPublicSiteConfig` en `src/services/content.ts`; UI de portada. | Medio: disponibilidad no confirmada, riesgo de ocultar fallos bajo mensajes de estado. | Obtener evidencia de solo lectura como en la tabla C; no crear `publicConfig/site`. |
| 4 | Panel autenticado no verificado funcionalmente. | `src/contexts/AuthContext.tsx`, `src/services/auth.ts`, `src/components/auth/AdminGuard.tsx`, `src/routes/AdminRoutes.tsx`, `src/services/admin.ts`. | Medio: revisión de código positiva, comportamiento real de sesión y consultas no probado. | Propietario completa checklist en sesión existente; no compartir credenciales ni ejecutar escrituras. |

No se marcó como completada ninguna tarea de lectura productiva, índices, rutas ni acceso administrativo. Sin cambios de código/configuración, Rules, Storage, datos, usuarios, claims, IAM, Render o DNS. Sin deploy, commit ni push. La tarea es de diagnóstico; Fase 1 permanece abierta.

### Ampliación de evidencia — verificación productiva de índices y redirect 301 (2026-11-09)

Esta ampliación responde a la solicitud de diagnóstico de índices y rutas. Se conserva el historial anterior. Fecha local de consulta: 2026-11-09, zona `-04:00`; catálogo y HTTP se consultaron en modo de lectura.

#### Catálogo real de índices Firestore

Se localizó Google Cloud SDK en `C:\Users\Usuario\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd` aunque `gcloud` no estaba agregado a `PATH`. ADC funcionó sin imprimir ni copiar el token. `gcloud config get-value project` informó `radio997-d5380`; la lista de cuentas activas mostró `fdavidriojac@gmail.com`. Se corroboró con `gcloud projects describe` el ID `radio997-d5380` y número `527560734998`, y con `gcloud firestore databases describe` la base `(default)`, tipo `FIRESTORE_NATIVE`, ubicación `nam5`.

Comando de solo lectura ejecutado:

```powershell
& 'C:\Users\Usuario\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json
```

Resultado completo: `[]`, código de salida 0. No hubo error de autenticación ni de permisos; se consultó el catálogo de índices compuestos de la base explícita. Los filtros por `collectionGroup=categories` y `collectionGroup=posts` avisaron que el campo no estaba presente en recursos y también devolvieron `[]`, coherente con el catálogo vacío. La lectura completa es evidencia más fuerte y no filtrada.

| Grupo/consulta | Índice local requerido | Estado en producción | ID |
|---|---|---|---|
| `categories` listado público: `status ASC`, `isArchived ASC`, `publishedAt DESC` | Existe en `firestore.indexes.json` | **Ausente**; el catálogo de índices compuestos está vacío. No está `READY`, `BUILDING` ni `ERROR` porque no hay recurso de índice. | No disponible |
| `posts` listado público: `status ASC`, `isArchived ASC`, `publishedAt DESC` | Existe en `firestore.indexes.json` | **Ausente**; el catálogo de índices compuestos está vacío. No está `READY`, `BUILDING` ni `ERROR` porque no hay recurso de índice. | No disponible |
| `programs` listado/búsqueda/facetas | Definiciones base, búsqueda, categoría y slug presentes localmente | No hay índices compuestos en producción; cualquier consulta que requiera un compuesto está igualmente desprovista. | No disponible |
| `schedule` programación pública y horarios por programa | Definiciones para `status/isArchived/startTime`, variante por `dayOfWeek` y variante `programId/status/isArchived/dayOfWeek/startTime` presentes localmente | No hay índices compuestos en producción. | No disponible |

Las direcciones de campos de las dos definiciones que explican los errores productivos son:

```json
{
  "collectionGroup": "categories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isArchived", "order": "ASCENDING" },
    { "fieldPath": "publishedAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "isArchived", "order": "ASCENDING" },
    { "fieldPath": "publishedAt", "order": "DESCENDING" }
  ]
}
```

Firebase puede incluir `__name__` como desempate implícito en el enlace generado; no se agrega manualmente a esas definiciones estándar. El `failed-precondition` observado en la aplicación queda explicado: las definiciones están en el archivo local, pero no se habían creado en el catálogo productivo. No hay evidencia de que estuvieran en construcción ni listas. Para los demás grupos, catálogo vacío prueba que no hay índices compuestos productivos, pero no afirma que todas las consultas necesiten uno; las consultas simples que solo filtran por un campo pueden usar índices de campo único.

Consumidores de `schedule` revisados en `src/services/content.ts` y `src/services/admin.ts`:

- `listPublicSchedule()` filtra `status` e `isArchived`, ordena `startTime`; su variante con `dayOfWeek` agrega igualdad de ese campo. La configuración local declara ambos compuestos.
- `listPublicProgramSchedule()` filtra `programId`, `status`, `isArchived` y ordena `dayOfWeek`, `startTime`; la definición local de cinco campos coincide.
- `findAdminScheduleOverlap()` y `assertScheduleDoesNotOverlap()` solo filtran `isArchived`; no requieren esos compuestos por su consulta actual.
- `listAdminRecords()` ordena por `updatedAt` y filtra opcionalmente `status`; existe definición local `status/updatedAt`.
- Dashboard usa consultas de conteo con filtros de igualdad.

El compuesto local `schedule(status, isArchived, publishedAt DESC)` no corresponde a los consumidores de `schedule` encontrados en el frontend inspeccionado. Se clasifica como candidato a revisar, no como redundancia confirmada; no se eliminó ni se cambió.

**Causa confirmada de índices:** faltan los índices compuestos en producción; no es una diferencia de orden/campos entre la consulta y el archivo local. **Riesgo:** alto para consultas públicas/administrativas que los requieren. **Corrección recomendada:** el propietario debe autorizar publicar solo los índices Firestore declarados que se requieran; después esperar estado `READY` en el catálogo y repetir las consultas de lectura. Ningún índice se creó ni publicó en este diagnóstico.

#### Redirección HTTP y atribución

Se consultaron `/`, `/noticias`, `/programas`, `/programacion` y `/index.html`. Hubo dos resultados según ruta de solicitud/caché:

| Solicitud/condición | Resultado observado |
|---|---|
| Navegación con navegador compartido, `2026-11-09` aprox. 19:42 local, caché de CDN en `BYPASS` | `/` y `/index.html`: HTTP 200, sin `Location`. `/noticias`, `/programas`, `/programacion`: HTTP 301 con `Location: /index.html`, luego HTTP 200 en `/index.html`. En las respuestas de ruta aparecieron `Server: cloudflare`, `CF-Cache-Status: BYPASS`, `CF-Ray` y `rndr-id`. |
| GET de `curl`/PowerShell posterior aprox. 19:43 local | Las cinco rutas respondieron HTTP 200 sin `Location`, `CF-Cache-Status: HIT`; las respuestas compartían ETag `W/"0550d439a113992b46fd271262b0bf97"` y `Last-Modified: Sat, 07 Nov 2026 22:15:02 UTC`. |
| Host directo `https://radiocontinental99-7.onrender.com/…` | Las rutas solicitadas respondieron HTTP 200 sin redirección y conservaron el path en las pruebas; respuestas con `rndr-id`, también proxied por Cloudflare (`Server: cloudflare`). |
| `https://www.continental997.fm/noticias` | HTTP 301 hacia `https://continental997.fm/noticias`, después HTTP 200. La respuesta 301 de canonicalización de `www` no tuvo `rndr-id`; no es el 301 de path a `/index.html`. |

Cabeceras relevantes: Cloudflare reportó `Server: cloudflare`, `CF-Ray` y estados `HIT`/`BYPASS`; las respuestas del servicio mostraron `rndr-id`. Las respuestas de ruta cacheadas con 200 y las respuestas de navegador con 301 no son consistentes, por lo que un único `curl` no representa necesariamente el comportamiento que observó el navegador. El hostname `www` tiene CNAME público a `radiocontinental99-7.onrender.com`; el dominio raíz aparece detrás de Cloudflare. `render.yaml` configura rewrites internos de las tres rutas a `/index.html`; `src/App.tsx` declara sus páginas y `BrowserRouter` está montado sin `basename`.

Se intentó la API oficial de Render en modo GET (`GET https://api.render.com/v1/services?limit=1`); respondió HTTP 401. No había credencial de API de Render disponible en el entorno. Por ello no se pudo leer la configuración activa del static site ni comparar sus reglas efectivas con `render.yaml`. No se abrió sesión ni se modificó configuración.

**Conclusión del redirect:** está confirmado que el navegador recibió un 301 hacia `/index.html` durante las solicitudes sin caché observadas, y que ese cambio de URL causa que React muestre 404. **No está confirmado qué producto/regla emitió ese 301.** `CF-Cache-Status: BYPASS` y `rndr-id` en esa respuesta sugieren que la solicitud alcanzó el servicio Render detrás del proxy, mientras el host `.onrender.com` respondió sin redirect; esto es compatible con comportamiento dependiente del hostname o con reglas activas de Render/CDN, pero no permite atribuirlo definitivamente a Render ni a Cloudflare. La diferencia HIT/BYPASS necesita reproducirse con configuración de caché controlada. El `301` de `www` al dominio raíz sí es distinto y no debe confundirse con el path redirect.

**Riesgo:** alto, porque las rutas pueden terminar en 404 según el camino de caché/host. **Siguiente comprobación:** propietario inspecciona en modo lectura Redirects/Rewrites y dominio primario del Static Site en Render, además de reglas de redirect/cache de Cloudflare; compara con `render.yaml` y repite en navegador/curl con caché documentada. Para la lectura de la API de Render se requiere credencial/token autorizado con alcance de lectura; no se solicitó ni se cambió. Cualquier modificación de Render/CDN o despliegue necesitaría autorización expresa separada.

#### Lecturas pendientes, estado y limitaciones

Los errores previos de categorías y posts son ahora atribuibles a índices compuestos ausentes, no a reglas ni permisos. Para distinguir los estados pendientes de programas, programación y `publicConfig/site` siguen siendo necesarias lecturas que registren explícitamente: resultado resuelto y cantidad de documentos, snapshot `exists() == false` para el documento individual, o código Firebase de la excepción (`failed-precondition`, `permission-denied`, red/configuración). Ninguna lectura de este apartado escribió datos; `publicConfig/site` no se creó.

| Tema | Resultado |
|---|---|
| Índices compuestos `categories` y `posts` | **AUSENTES en producción**, confirmados por catálogo oficial vacío; presentes en archivo local. |
| Índices `programs` y `schedule` | **No hay compuestos en el catálogo productivo**; los compuestos candidatos de la app están descritos localmente. |
| Origen del 301 a `/index.html` | **No confirmado**; respuesta observada por navegador, discrepante con respuestas cacheadas 200 y directas `.onrender.com`. Render API inaccesible por 401 sin token. |
| Cambios ejecutados | Solo actualización documental. Sin cambios de índices, Rules, datos, código, Storage, Render, DNS, IAM o usuarios. Sin deploy, commit ni push. |

Orden recomendado: (1) autorización expresa para publicar únicamente los índices requeridos y luego confirmar `READY`; (2) lectura funcional posterior de categorías/posts, diferenciando error de resultado vacío; (3) inspección de solo lectura por el propietario de Render/Cloudflare para localizar la regla del redirect; (4) autorizar por separado cualquier corrección y despliegue. Ninguna tarea se marca completada sin esa evidencia. Fase 1 permanece abierta.

## Fase 1 — intervención 29: preparación controlada de índices Firestore (2026-11-09)

### Alcance y evidencia de producción

Diagnóstico y preparación solamente. No se ejecutó despliegue, ni se crearon/eliminaron índices, ni se modificaron reglas, datos, Storage, Render, DNS, código o configuración. No hubo commit ni push. La única modificación de esta intervención es este registro en la auditoría.

Se revisó el archivo completo `firestore.indexes.json`: contiene **28 índices compuestos** y `fieldOverrides: []`. Se volvió a consultar con la herramienta oficial Google Cloud SDK, de solo lectura, proyecto explícito `radio997-d5380`, base `(default)`. ADC respondió; no se imprimió el token.

```powershell
& 'C:\Users\Usuario\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json
```

Resultado: `[]`, código de salida 0. No hay índices compuestos productivos en ningún collection group. Consulta de campos/overrides:

```powershell
& 'C:\Users\Usuario\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' firestore indexes fields list --project=radio997-d5380 --database='(default)' --format=json
```

Resultado: solo el recurso global `collectionGroups/__default__/fields/*`, con los índices de campo ascendente, descendente y array en estado `READY`. El Firebase CLI excluye explícitamente ese recurso predeterminado al comparar overrides. No se observaron overrides personalizados. El ID/número de proyecto y base fueron corroborados en la intervención anterior: `radio997-d5380`, `527560734998`, `(default)`, ubicación `nam5`.

### Matriz de consultas e índices compuestos

Los índices listados abajo son definiciones locales exactas en `firestore.indexes.json`, todos con `queryScope: COLLECTION`. En campos no expresados como `CONTAINS`, las direcciones son `ASC` o `DESC` explícitas. Firestore puede añadir `__name__` como desempate implícito según la consulta.

#### `categories` — 2 índices; ambos utilizados

| Definición exacta de campos | Consulta/consumidor |
|---|---|
| `status ASC, isArchived ASC, publishedAt DESC` | `listPublished('categories')`: portada, noticias, programas, búsqueda, deportes y detalles para resolver nombres de categorías. Es el índice que exige la consulta pública que falló. |
| `status ASC, updatedAt DESC` | `listAdminRecords('categories', { status })`: listado administrativo ordenado por `updatedAt`, con estado opcional. |

#### `posts` — 6 índices; todos utilizados

| Definición exacta de campos | Consulta/consumidor |
|---|---|
| `status ASC, isArchived ASC, publishedAt DESC` | `listPublicContentPage('posts')` sin búsqueda/faceta; portada, listado y páginas. Es el índice de la consulta pública que falló. |
| `searchTerms CONTAINS, status ASC, isArchived ASC, publishedAt DESC` | `listPublicContentPage('posts', { search })`; búsqueda editorial. |
| `categoryIds CONTAINS, status ASC, isArchived ASC, publishedAt DESC` | Filtro por categoría de posts, incluyendo listado deportivo; puede combinarse con rango de `publishedAt`. |
| `tagIds CONTAINS, status ASC, isArchived ASC, publishedAt DESC` | Filtro por etiqueta de posts; puede combinarse con rango de `publishedAt`. |
| `slug ASC, status ASC, isArchived ASC` | `findPublishedBySlug('posts', slug)`: abrir una publicación por slug. |
| `status ASC, updatedAt DESC` | `listAdminRecords('posts', { status })`: listado administrativo/editorial. |

La implementación no agrega a la consulta de Firestore una faceta al mismo tiempo que una búsqueda: cuando hay término, filtra categorías/etiquetas en cliente después de recuperar lotes. Esto evita requerir combinaciones de `searchTerms` con category/tag en el índice compuesto.

#### `programs` — 5 índices; todos utilizados

| Definición exacta de campos | Consulta/consumidor |
|---|---|
| `status ASC, isArchived ASC, publishedAt DESC` | `listPublished('programs')` / listado público base. |
| `searchTerms CONTAINS, status ASC, isArchived ASC, publishedAt DESC` | Búsqueda pública por programas. |
| `categoryId ASC, status ASC, isArchived ASC, publishedAt DESC` | Listado público por categoría. |
| `slug ASC, status ASC, isArchived ASC` | `findPublishedBySlug('programs', slug)`: detalle por slug. |
| `status ASC, updatedAt DESC` | `listAdminRecords('programs', { status })`. |

#### `schedule` — 5 índices utilizados; 1 candidato a excluir

| Definición exacta de campos | Consulta/consumidor |
|---|---|
| `status ASC, isArchived ASC, startTime ASC` | `listPublicSchedule()` sin día: horarios públicos ordenados por hora. |
| `status ASC, isArchived ASC, dayOfWeek ASC, startTime ASC` | `listPublicSchedule(dayOfWeek)`: horarios públicos de un día ordenados por hora. |
| `programId ASC, status ASC, isArchived ASC, dayOfWeek ASC, startTime ASC` | `listPublicProgramSchedule(programId)`: detalle de programa, horario por día/hora. |
| `programId ASC, isArchived ASC` | `listProgramSchedule()`, duplicación de programa y consultas editoriales de sus emisiones. |
| `status ASC, updatedAt DESC` | `listAdminRecords('schedule', { status })`: listado administrativo. |
| `status ASC, isArchived ASC, publishedAt DESC` | **No se encontró consumidor** en los usos de `schedule` revisados. La lectura pública ordena por `startTime`; editoriales, por `updatedAt`. Candidato a excluir del despliegue preparado, sin eliminarlo del archivo en esta intervención. |

Las verificaciones de solapamiento y otras comprobaciones que solo filtran `isArchived`, así como los conteos con igualdades, no justifican por sí mismos compuestos adicionales en esta lista.

#### Colecciones fuera de la matriz solicitada

Se revisaron también los demás índices para decidir el alcance real de la app:

- `tags` (2): ambos tienen consumidor (`listPublished('tags')` y listado administrativo por estado/`updatedAt`).
- `media` (3 de 4 recomendados): `searchTerms` no aplica; las tres definiciones con uso localizado son (1) `status ASC, isArchived ASC, visibility ASC, publishedAt DESC` para `listPublishedMedia`; (2) `storagePath ASC, status ASC, isArchived ASC, visibility ASC` para comprobar una referencia pública; (3) `status ASC, updatedAt DESC` para administración. El índice local `status ASC, isArchived ASC, publishedAt DESC` no corresponde a `listPublishedMedia` (que incluye `visibility`) ni a otro consumidor localizado.
- `banners` (2 de 3 recomendados): (1) `placement ASC, status ASC, isArchived ASC` para `listPublicBanners`; (2) `status ASC, updatedAt DESC` para listado administrativo. El índice `status ASC, isArchived ASC, publishedAt DESC` no tiene consumidor localizado: la consulta pública filtra por placement y no ordena por publicación.

La matriz de consultas fue rastreada en `src/services/content.ts`, `src/services/admin.ts`, `src/services/media.ts` y sus superficies públicas/administrativas. “Sin consumidor localizado” no significa garantía global de que ningún script externo use el índice; cualquier export, herramienta o consulta fuera del repositorio debe revisarse antes de excluirlo.

### Recomendación de manifiesto para publicar

De las 28 definiciones locales, **25 tienen consumidores identificables** en la aplicación examinada. Se recomienda incluir esos 25 índices (los 2 de categories, 6 de posts, 5 de programs, 5 de schedule, 2 de tags, 3 de media y 2 de banners) y dejar fuera estos tres candidatos sin uso identificado:

1. `schedule`: `status ASC, isArchived ASC, publishedAt DESC`.
2. `media`: `status ASC, isArchived ASC, publishedAt DESC`.
3. `banners`: `status ASC, isArchived ASC, publishedAt DESC`.

Los índices imprescindibles inmediatos para corregir los errores de portada son `categories(status ASC, isArchived ASC, publishedAt DESC)` y `posts(status ASC, isArchived ASC, publishedAt DESC)`. El resto de los 23 índices recomendados soporta funciones reales de búsqueda, filtros, detalle por slug, listados editoriales, horarios, medios y banners; si se busca minimizar riesgo/costo por etapas, pueden priorizarse primero los dos anteriores y desplegar los restantes después de validación individual, siempre con autorización.

**Restricción técnica importante:** `firebase deploy --only firestore:indexes` no selecciona índices por colección/ID. El target procesa la totalidad del `indexes` y `fieldOverrides` del archivo configurado en `firebase.json`. Con el manifiesto actual, crearía los 28 compuestos, incluidos los tres candidatos sin consumidor localizado. Para desplegar solo los 25 recomendados hay que, después de autorización, actualizar el manifiesto canónico o preparar un manifiesto/configuración alternativos revisables; no se alteró ni creó tal archivo en esta intervención.

### Comportamiento y riesgo de Firebase CLI

Se verificó `npx firebase-tools --version`: **14.17.0**. El código de Firebase CLI de la etiqueta `v14.17.0` en `src/firestore/api.ts` y `src/deploy/firestore/deploy.ts` implementa este comportamiento:

- **Crea** definiciones de índices que no tienen coincidencia en el proyecto; la operación es asíncrona y el índice puede permanecer en `BUILDING` antes de `READY`.
- **Omite** índices que ya coinciden con la especificación. Los índices compuestos no se actualizan in-place: una diferencia de campos/orden se interpreta como nuevo índice deseado y el anterior como candidato a borrar.
- **Detecta y propone borrar** índices productivos que no aparecen en `firestore.indexes.json`. En una ejecución interactiva pregunta y el valor predeterminado de la confirmación es no. En modo no interactivo sin `--force`, avisa y continúa sin borrarlos. `--force` habilita borrar automáticamente. Por eso el proceso no es inherentemente aditivo; se debe evitar `--force`.
- **Procesa `fieldOverrides`** del mismo archivo: crea o actualiza (PATCH) las configuraciones declaradas. Los overrides productivos que no están en el archivo quedan como candidatos a borrado, también con confirmación; `--force` los elimina automáticamente. Un cambio puede alterar índices de campo único y configuración TTL asociada. El CLI ignora el recurso predeterminado `__default__`.
- **Alcance del selector:** `--only firestore:indexes` selecciona índices Firestore sin crear/releasear Firestore Rules. No selecciona Storage, Hosting, Authentication, Functions ni otros recursos; sí incluye índices compuestos y field overrides porque ambos son parte de la configuración de índices.

Fuentes consultadas:

- [Firebase: administrar índices de Cloud Firestore](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase: referencia JSON de índices y `fieldOverrides`](https://firebase.google.com/docs/reference/firestore/indexes)
- [Firebase CLI v14.17.0 — implementación de deploy de índices](https://github.com/firebase/firebase-tools/blob/v14.17.0/src/firestore/api.ts#L60-L220)
- [Firebase CLI v14.17.0 — selección de recursos Firestore](https://github.com/firebase/firebase-tools/blob/v14.17.0/src/deploy/firestore/prepare.ts)

En el catálogo productivo actual no existen compuestos que puedan borrarse; solo se observó el recurso global de configuración predeterminada, que el CLI excluye de borrados. Tampoco se observaron overrides personalizados que pudieran borrarse. Por tanto, con evidencia de este momento, publicar el manifiesto completo crearía compuestos en vez de eliminar los inexistentes; pero esto no convierte el comando en seguro frente a una deriva futura.

### Comando preparado, verificación y recuperación

Comando exacto **no ejecutado**; solo deberá usarse tras autorización expresa y decisión aprobada sobre el manifiesto (25 necesarios frente a los 28 actuales):

```powershell
npx firebase-tools deploy --only firestore:indexes --project radio997-d5380
```

No añadir `--force`. Antes de autorizar una futura publicación:

1. Acordar si se publican los 25 índices con consumidor identificado o los 28 del manifiesto actual; si 25, autorizar primero la edición controlada de las tres definiciones candidatas.
2. Guardar evidencia de solo lectura del catálogo compuesto y de `firestore indexes fields list`; confirmar proyecto `radio997-d5380`, base `(default)`, archivo revisado y hash SHA-256 del manifiesto aprobado.
3. Ejecutar el comando solo después de autorización expresa; si Firebase CLI presenta una propuesta de borrado inesperada, responder no y detener el procedimiento para revisar la diferencia.
4. Consultar el catálogo con `gcloud firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json` y `gcloud firestore indexes fields list ...`; confirmar cada ID, campos y estado `READY` (no basta con que el deploy termine mientras el índice esté `BUILDING`).
5. Repetir las consultas públicas de categorías/posts con lecturas únicamente y verificar que se resuelven sin `failed-precondition`; distinguir páginas vacías de excepciones.

Si la operación falla, no ejecutar deploy alternativo ni borrar índices automáticamente. Conservar salida del CLI y catálogo actual, identificar IDs/estados, detenerse y pedir autorización. Para recuperar un índice borrado accidentalmente, restaurar su definición desde el manifiesto/respaldo revisado y crearla de nuevo; esto no es instantáneo, requiere que vuelva a `READY`, y durante la construcción las consultas dependientes pueden seguir fallando. Para un índice nuevo no deseado, eliminarlo requiere una operación separada y autorización expresa. Los índices agregan almacenamiento/costo y pueden tardar en construirse; no cambian documentos, pero eliminaciones pueden romper consultas.

### Estado final

| Hallazgo | Estado | Riesgo/acción |
|---|---|---|
| Índices compuestos productivos | Catálogo consultado: vacío, sin índices `READY` ni `BUILDING`; las 28 definiciones locales no existen en producción al momento de consulta. | Alto para consultas compuestas reales. Requiere autorización explícita de publicación. |
| Consultas/categories y posts | Dos definiciones precisas presentes localmente y ausentes del catálogo productivo; explican los `failed-precondition`. | Prioridad inmediata: aprobar publicación de esos dos índices; después validar lectura. |
| Definiciones no utilizadas localizadas | Tres candidatos: schedule/media/banners con `status,isArchived,publishedAt`. | No publicar en la preparación recomendada salvo que un consumidor externo sea confirmado. |
| `fieldOverrides` | Archivo local vacío; producción solo devuelve configuración global predeterminada, ignorada por CLI; no se ven overrides personalizados. | Sin cambio de overrides esperado ahora; revisar catálogo justo antes del deploy. |
| Riesgo de CLI | Puede eliminar índices/overrides que falten del manifiesto tras confirmación o `--force`; índice equivalente existente se omite y cambios requieren crear nueva definición + eventual borrado. | No usar `--force`; revisar cualquier aviso de borrado. |
| Cambios ejecutados | Solo este documento de auditoría. | No hubo despliegue ni escrituras productivas. |

La preparación queda entregada para aceptación o rechazo del propietario. Ninguna tarea se marca completada por esta preparación; Fase 1 sigue abierta.

## Fase 1 — intervención 30: manifiesto mínimo de índices para revisión (2026-11-09)

### Artefactos y estado

Se creó el manifiesto alternativo [firestore.indexes.review.json](../firestore.indexes.review.json) con las 25 definiciones del subconjunto recomendado en la intervención 29. El archivo original `firestore.indexes.json` no se modificó. Se guardó la respuesta de solo lectura del catálogo productivo en [docs/backups/firestore-indexes-production-2026-11-09.json](./backups/firestore-indexes-production-2026-11-09.json).

| Comprobación | Resultado |
|---|---|
| Índices original | 28 |
| Índices alternativo | 25 |
| `fieldOverrides` alternativo | `[]` |
| Definiciones nuevas o inventadas | 0 |
| Definiciones omitidas del original | 3, las identificadas como sin consumidor localizado |
| SHA-256 `firestore.indexes.json` | `0EAFC3825DA68D5613E7A15EB9432340326A5551072F9A99FB71958E51370A17` |
| SHA-256 `firestore.indexes.review.json` | `61AD4BD9CD79492E3245735AFE8D1616A6A6E280863E1AEB5833109D829915BD` |

Hashes calculados localmente con SHA-256; los cambios de formato del manifiesto alternativo también forman parte de su hash. La validación comparó la clave exacta de cada índice (`collectionGroup`, `queryScope`, campos y orden/configuración), confirmó que el alternativo es subconjunto exacto del original y comprobó los conteos por colección: `categories` 2, `posts` 6, `programs` 5, `schedule` 5, `tags` 2, `media` 3 y `banners` 2.

### Consumidores de las 25 definiciones

Las referencias fueron comprobadas de nuevo en el código:

| Colección | Índices incluidos | Consumidores identificados |
|---|---:|---|
| `categories` | 2 | `listPublished('categories')` en home, noticias, programas, búsqueda, deportes y detalle; `listAdminRecords` ordenado por `updatedAt`, estado opcional. |
| `posts` | 6 | Listado público; búsqueda por `searchTerms`; facetas `categoryIds` y `tagIds`; detalle `findPublishedBySlug`; listado admin por estado/`updatedAt`. |
| `programs` | 5 | Listado público; búsqueda; categoría; detalle por slug; listado admin por estado/`updatedAt`. |
| `schedule` | 5 | Listado público por hora y variante por día; horario de programa por día/hora; horario editorial por `programId`/archivo; listado admin por estado/`updatedAt`. |
| `tags` | 2 | `listPublished('tags')`; listado admin por estado/`updatedAt`. |
| `media` | 3 | Listado público con visibilidad; comprobación por `storagePath`/publicación/visibilidad; listado admin por estado/`updatedAt`. |
| `banners` | 2 | `listPublicBanners` filtrado por placement; listado admin por estado/`updatedAt`. |

Los filtros y ordenamientos coinciden con la matriz de consultas de la intervención 29. Fuentes revisadas: `src/services/content.ts`, `src/services/admin.ts`, `src/services/media.ts`, `src/pages/public/*`, `src/components/public/PublicBannerSlot.tsx` y componentes administrativos que invocan listados.

### Definiciones excluidas (28 → 25)

| Colección | Campos excluidos | Justificación / riesgo |
|---|---|---|
| `schedule` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | No hay consulta localizada que ordene programación por `publishedAt`; consultas de agenda usan `startTime`, programa o `updatedAt`. Si una herramienta o cliente externo consulta esta combinación, puede requerir el compuesto y fallar con `failed-precondition`. |
| `media` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | La consulta pública localizada incluye además `visibility` antes de ordenar por `publishedAt`; está incluido el índice correspondiente a esa consulta real. Si un consumidor externo omite `visibility`, podría necesitar el índice excluido. |
| `banners` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | La consulta pública localizada filtra `placement` y no ordena por `publishedAt`; se incluye el índice por placement. Un consumidor externo con filtros distintos podría requerir el excluido. |

La exclusión limita solo la provisión de esos compuestos; no altera documentos ni el índice automático de campos individuales. La revisión de consumidores cubre el frontend y servicios del repositorio, no clientes externos o integraciones no presentes aquí. Antes de desplegar, confirmar con el propietario si hay consumidores externos.

### Validación del JSON y Firebase CLI

- `JSON.parse` leyó ambos archivos sin error.
- Conteos y `fieldOverrides` verificados; diferencias exactas: 3 omitidos, 0 añadidos.
- La validación local usó la implementación de validación de especificación del Firebase CLI instalado (v14.17.0): `new FirestoreApi().validateSpec(reviewSpec)` terminó correctamente. Se invocó únicamente el validador de esquema sobre el objeto local; no el método `deploy`, no hubo llamadas de escritura, ni despliegue. No se usó `firebase deploy --dry-run` porque la documentación del CLI advierte que un dry-run todavía puede habilitar APIs en el proyecto.
- Se confirmó también el estado productivo mediante lectura oficial al preparar esta intervención: catálogo compuesto `[]`, y el catálogo de campos devuelve únicamente el recurso global predeterminado con estados `READY`. La salida se conserva en `docs/backups/firestore-indexes-production-2026-11-09.json`. No se detectaron índices compuestos productivos que la publicación deba preservar ni overrides personalizados al momento de esa consulta.

### Alcance del comando y preparación de publicación

La configuración canónica `firebase.json` apunta a `firestore.indexes.json`, no al manifiesto alternativo. Para usar este candidato será necesario proporcionar a Firebase CLI una configuración auxiliar revisada que apunte al archivo alternativo (sin editar `firebase.json`), o, después de autorización, cambiar temporalmente de forma controlada el archivo apuntado y restaurar el original. La primera opción es preferible para conservar el manifiesto original sin tocarlo.

Comando propuesto sujeto a crear y revisar antes una configuración auxiliar, por ejemplo `firebase.indexes-review.json` que declare solo el archivo alternativo bajo `firestore.indexes`:

```powershell
npx firebase-tools deploy --only firestore:indexes --project radio997-d5380 --config firebase.indexes-review.json
```

**Este comando no se ejecutó y el archivo auxiliar de configuración no se creó.** No añadir `--force`. Firebase CLI puede proponer eliminar índices productivos que no estén en el manifiesto; rechazar cualquier propuesta y detenerse para inspeccionar. En el catálogo consultado actualmente no hay compuestos que borrar, pero el estado debe volver a revisarse justo antes de cualquier despliegue.

Después de una autorización separada y una publicación futura: volver a consultar `gcloud firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json`, confirmar cada índice por collection group/campos y esperar `READY`; después repetir lecturas públicas de categorías/posts. Si falla, detenerse, guardar la salida y consultar nuevamente el catálogo. Recuperar un índice eliminado requiere recrear su definición autorizada y esperar a `READY`; las consultas pueden fallar mientras se construye. No ejecutar limpieza o rollback de índices sin autorización específica.

### Estado final y restricciones

Manifiesto alternativo **listo para revisión**, no autorizado ni desplegado. El único cambio de tarea es el nuevo archivo `firestore.indexes.review.json`, el respaldo local de la consulta de producción y la actualización documental. No se modificó el manifiesto original, reglas, datos, Storage, Render, DNS, código o IAM; no se ejecutó despliegue ni se realizó commit/push. La publicación y cualquier creación del archivo auxiliar requieren autorización expresa del propietario. Fase 1 continúa abierta.

## Fase 1 — intervención 31: verificación final del procedimiento (2026-11-09)

### Integridad y mecanismo de configuración

Se volvió a calcular SHA-256 de `firestore.indexes.review.json`: `61AD4BD9CD79492E3245735AFE8D1616A6A6E280863E1AEB5833109D829915BD`, coincidente con el hash aprobado para revisión. El archivo conserva 25 índices y `fieldOverrides: []`. La configuración permanente [firebase.json](../firebase.json) permanece intacta y apunta al manifiesto original.

Se comprobó la ayuda del Firebase CLI local v14.17.0: la opción global `-c, --config <path>` carga el archivo de configuración Firebase alternativo. No es una selección de manifiesto directo; el archivo auxiliar debe indicar el manifiesto alternativo. Contenido propuesto (no creado):

```json
{
  "firestore": {
    "indexes": "firestore.indexes.review.json"
  }
}
```

Al estar el archivo auxiliar en la raíz y el manifiesto de revisión junto a él, la ruta relativa resuelve al candidato revisado. La configuración auxiliar contiene solo la sección `firestore.indexes`, no reglas, Storage ni Hosting. El `--only firestore:indexes` reduce además los objetivos del comando a índices. No se editarían `firebase.json` ni archivos permanentes adicionales; el auxiliar sería temporal y debería eliminarse solo después de comprobar el resultado, en una intervención autorizada.

### Comando exacto propuesto (no ejecutar sin autorización)

Desde la raíz `C:\Users\Usuario\RadioContinental99.7`, una vez creada y revisada manualmente la configuración auxiliar:

```powershell
npx firebase-tools --config firebase.indexes-review.json deploy --only firestore:indexes --project radio997-d5380
```

La opción explícita `--project radio997-d5380` fija el proyecto destino; `--only firestore:indexes` excluye Rules, Storage, Hosting y otros recursos. El comando no lleva `--force` ni su alias `-f`. La configuración no es creada por esta intervención y el despliegue no se ejecutó.

### Preflight y guardas de eliminación

Inmediatamente antes de una eventual publicación autorizada:

1. Verificar raíz del repositorio, hash SHA-256 exacto del manifiesto y que el contenido del archivo coincida con el candidato aprobado.
2. Leer de nuevo el catálogo para el proyecto y base correctos:

   ```powershell
   gcloud firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json
   ```

3. Comparar el catálogo con el respaldo de intervención 30 y detenerse ante cualquier cambio, índice no esperado, error de acceso o proyecto/base diferente. No continuar si el preflight no permite explicar cualquier diferencia.
4. Crear/revisar la configuración auxiliar propuesta y verificar que contiene únicamente la ruta al manifiesto de revisión.
5. Iniciar el comando exacto anterior de forma interactiva. Si Firebase CLI muestra cualquier operación de eliminación, propuesta de borrado o alcance distinto de los 25 índices, responder `N` si ofrece confirmación, o cancelar con `Ctrl+C`; no aceptar ni continuar. Si el CLI no ofrece una forma segura de detener la reconciliación, cancelar el proceso antes de la escritura.

La consulta productiva más reciente registrada al cierre de intervención 30 mostró cero índices compuestos; no equivale a un preflight del día de una futura publicación. El catálogo debe consultarse de nuevo y preservarse antes de obtener autorización para publicar.

### Verificación posterior propuesta (solo lectura)

Después de una publicación futura que haya sido autorizada, consultar y conservar la respuesta completa:

```powershell
gcloud firestore indexes composite list --project=radio997-d5380 --database='(default)' --format=json
```

Inspeccionar en cada recurso `collectionGroup`, `queryScope`, `fields` (incluyendo `fieldPath`, `order` o `arrayConfig`), `state` y `name`. Comparar las 25 tuplas de definición con `firestore.indexes.review.json`; confirmar que las 25 estén presentes y `READY`, sin definiciones faltantes, extras ni estados `CREATING`, `ERROR` u otros. Si la lista no coincide, conservar la salida íntegra, detener operaciones posteriores e informar al propietario. No declarar éxito mientras haya índices aún en construcción.

Para registrar además las configuraciones de campos, solo lectura:

```powershell
gcloud firestore indexes fields list --project=radio997-d5380 --database='(default)' --format=json
```

Esta consulta complementaria no publica ni cambia configuraciones.

### Recuperación definida

Si el CLI falla antes de escribir, conservar el error y no probar otro comando de despliegue. Si la creación inicia pero un índice queda en `ERROR` o no llega a `READY`, guardar el catálogo y el diagnóstico, no borrar recursos y solicitar revisión. Si se detectara una eliminación o cambio inesperado, detener toda acción; preservar la evidencia y contrastarla con el respaldo local de catálogo [firestore-indexes-production-2026-11-09.json](./backups/firestore-indexes-production-2026-11-09.json). La recuperación de un compuesto requiere recrear su definición exacta desde un manifiesto aprobado y esperar `READY`; eso es una escritura productiva, por tanto requiere autorización expresa adicional y no se ejecuta como rollback automático. Mientras se recupera, las consultas que dependen del índice podrían fallar.

### Resultado de intervención

**APROBADO para revisión del procedimiento; publicación PENDIENTE.** Hash verificado. El mecanismo `--config` y su forma de invocación quedaron comprobados con la ayuda local de Firebase CLI v14.17.0. No se creó `firebase.indexes-review.json`, no se ejecutó `deploy`, no hubo llamadas de escritura a Firebase, no se modificaron reglas, datos, Storage, Render o DNS, y no hubo commit/push. Se conserva el historial y la fase continúa detenida a la espera de autorización expresa del propietario.

## Fase 1 — intervención 32: publicación autorizada de 25 índices (2026-11-09)

### Autorización y preflight

Se recibió autorización expresa del propietario para crear la configuración auxiliar temporal y publicar exclusivamente los 25 índices del manifiesto alternativo con SHA-256 aprobado `61AD4BD9CD79492E3245735AFE8D1616A6A6E280863E1AEB5833109D829915BD`.

| Comprobación | Resultado |
|---|---|
| Raíz | `C:\Users\Usuario\RadioContinental99.7` |
| Manifiesto existe | Sí |
| SHA-256 recalculado | `61AD4BD9CD79492E3245735AFE8D1616A6A6E280863E1AEB5833109D829915BD` — coincide |
| Índices / `fieldOverrides` | 25 / 0 |
| Firebase CLI | v14.17.0, cuenta `fdavidriojac@gmail.com`; `projects:list` mostró `radio997-d5380`, número `527560734998` |
| Google Cloud SDK | v592.0.0, cuenta activa `fdavidriojac@gmail.com`; `projects describe` confirmó ID y número autorizados |
| Proyecto/base | `radio997-d5380` / `(default)` |
| Catálogo compuesto antes | 0 índices; lectura oficial de solo lectura |
| Respaldo prepublicación | [firestore-indexes-pre-deploy-2026-11-09.json](./backups/firestore-indexes-pre-deploy-2026-11-09.json), SHA-256 `50056C08CE479CC2F54C4D6595A4264BDF32BF84F2995D59FF3BD513897AB414` |

El manifiesto se cargó mediante el parser de configuración de Firebase CLI, el cual resolvió `firestore.indexes.review.json` a la ruta absoluta esperada. La validación oficial de especificación del CLI aceptó 25 índices y cero overrides.

### Publicación

Se creó temporalmente en la raíz `firebase.indexes.review.config.json` con solo:

```json
{
  "firestore": {
    "indexes": "firestore.indexes.review.json"
  }
}
```

Se ejecutó exactamente:

```powershell
npx firebase-tools deploy --only firestore:indexes --project radio997-d5380 --config firebase.indexes.review.config.json
```

Resultado de CLI: `firestore: reading indexes from firestore.indexes.review.json`, `firestore: deploying indexes`, `firestore: deployed indexes ... successfully for (default) database`, `Deploy complete!`. El CLI mostró únicamente el target `firestore` con despliegue de índices; no hubo propuestas de eliminación. Dado que el catálogo prepublicación tenía cero índices y el catálogo posterior contiene exactamente los 25 autorizados, no se eliminó ningún índice.

### Verificación posterior y estado individual

La consulta oficial de solo lectura se repitió hasta que todos los índices llegaron a `READY`. Observaciones: en el primer sondeo, 25 `CREATING`; en el séptimo, 11 `READY` y 14 `CREATING`; en el octavo, los 25 `READY`. Se compararon individualmente collection group, query scope y secuencia de campos con el manifiesto; se omitió del cotejo el campo `__name__` que Firestore añade automáticamente al recurso creado. Resultado: 25 coincidencias exactas, cero faltantes, cero extras, cero `ERROR`.

El respaldo final es [firestore-indexes-ready-2026-11-09.json](./backups/firestore-indexes-ready-2026-11-09.json), SHA-256 `FDE053B8EC47FD2F4C3DAA231B30051E747E2780BFBA8BF3EF45F3129BDE1C24`.

| Colección | Campos (en orden) | Estado | Identificador |
|---|---|---|---|
| `banners` | `status ASC`, `updatedAt DESC` | READY | `CICAgJiH2JAK` |
| `banners` | `placement ASC`, `status ASC`, `isArchived ASC` | READY | `CICAgOi3kJAK` |
| `categories` | `status ASC`, `updatedAt DESC` | READY | `CICAgLjRnZMK` |
| `categories` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgNi4-ZIK` |
| `media` | `status ASC`, `isArchived ASC`, `visibility ASC`, `publishedAt DESC` | READY | `CICAgNiroIEK` |
| `media` | `status ASC`, `updatedAt DESC` | READY | `CICAgNirtJAK` |
| `media` | `storagePath ASC`, `status ASC`, `isArchived ASC`, `visibility ASC` | READY | `CICAgNjpgYIK` |
| `posts` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgJiUsZIK` |
| `posts` | `categoryIds CONTAINS`, `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgJj7z4EK` |
| `posts` | `searchTerms CONTAINS`, `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgJjF9oIK` |
| `posts` | `slug ASC`, `status ASC`, `isArchived ASC` | READY | `CICAgLjRyYIK` |
| `posts` | `tagIds CONTAINS`, `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgNi47oMK` |
| `posts` | `status ASC`, `updatedAt DESC` | READY | `CICAgNjp84oK` |
| `programs` | `categoryId ASC`, `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgJim14AK` |
| `programs` | `searchTerms CONTAINS`, `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgJiUpoMK` |
| `programs` | `status ASC`, `updatedAt DESC` | READY | `CICAgJjFqZMK` |
| `programs` | `slug ASC`, `status ASC`, `isArchived ASC` | READY | `CICAgLjy8IAK` |
| `programs` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgOjXh4EK` |
| `schedule` | `status ASC`, `isArchived ASC`, `dayOfWeek ASC`, `startTime ASC` | READY | `CICAgLiIkYMK` |
| `schedule` | `status ASC`, `updatedAt DESC` | READY | `CICAgNi4o4sK` |
| `schedule` | `status ASC`, `isArchived ASC`, `startTime ASC` | READY | `CICAgNjp5ZMK` |
| `schedule` | `programId ASC`, `status ASC`, `isArchived ASC`, `dayOfWeek ASC`, `startTime ASC` | READY | `CICAgNjpr5sK` |
| `schedule` | `programId ASC`, `isArchived ASC` | READY | `CICAgPig2YMK` |
| `tags` | `status ASC`, `updatedAt DESC` | READY | `CICAgLiT6IEK` |
| `tags` | `status ASC`, `isArchived ASC`, `publishedAt DESC` | READY | `CICAgNiav4AK` |

Los identificadores anteriores son el sufijo del nombre completo en el respaldo; todos pertenecen a `projects/radio997-d5380/databases/(default)/collectionGroups/{colección}/indexes/{id}`.

### Comprobación de alcance y limitaciones

- El catálogo compuesto pasó de 0 a los 25 índices autorizados, sin extras ni eliminaciones.
- El CLI ejecutó el único target solicitado, `firestore:indexes`; no desplegó Rules, Storage, Hosting ni otros recursos. El catálogo de reglas no fue modificado por el comando observado.
- La consulta posterior de configuraciones de campos mostró solo la configuración global predeterminada `__default__`, con los índices individuales en `READY`; no se observó ningún override personalizado. Se conservó en [firestore-fields-post-deploy-2026-11-09.json](./backups/firestore-fields-post-deploy-2026-11-09.json), SHA-256 `C683F49CDEBD164C1B5C5A532E9E633615A3CB37DAD8E00423778BD6AD21E3A2`.
- La verificación adicional directa de Rules API no pudo completarse: la llamada GET devolvió HTTP 403 indicando que las ADC locales no tienen quota project configurado para `firebaserules.googleapis.com` (reason `SERVICE_DISABLED`, consumer `projects/32555940559`). No se configuró quota project ni se modificó IAM. La evidencia de alcance disponible es la salida completa del CLI, que muestra únicamente publicación de índices; no se afirma haber confirmado Rules mediante Rules API.

### Limpieza y resultado

Tras completar las verificaciones, se eliminó únicamente `firebase.indexes.review.config.json`; el manifiesto alternativo y los respaldos permanecen. No se modificaron `firebase.json`, Rules, Storage, documentos, usuarios, claims, IAM, Render o DNS. No se hizo commit ni push.

**Publicación de índices: COMPLETADA.** Los 25 índices autorizados están `READY`. La limitación pendiente es la comprobación independiente de Rules API debido al requisito de quota project de ADC; no afecta la confirmación del alcance reportado por Firebase CLI.

## Fase 1 — intervención 33: comprobaciones funcionales posteriores a índices (2026-11-10)

Proyecto consultado: `radio997-d5380`, base `(default)`. Se realizaron lecturas de solo lectura y navegación pública, sin cambios de datos o configuración. No se modificaron reglas, índices, usuarios, Storage, Render ni DNS.

### A. Consultas de Firestore

Se reprodujeron las consultas públicas con Firestore REST `runQuery` sin credenciales de administrador, usando los filtros/ordenamientos de `src/services/content.ts` y el proyecto/base explícitos. Todas las consultas terminaron HTTP 200 con cero documentos; no devolvieron excepción Firebase ni `failed-precondition`. Se comprobó también la interfaz pública de producción: los listados muestran estados vacíos, no estados de error.

| Estado | Función y consulta | Resultado | Cantidad / error |
|---|---|---|---|
| APROBADO | `listPublished('categories', 50)`: `categories`, `status == published`, `isArchived == false`, `publishedAt DESC`, límite 50. | Consulta respondió correctamente; filtro de categorías público sin opciones adicionales. | 0 documentos; sin error Firebase. |
| APROBADO | `listPublicContentPage('posts', { pageSize: 12 })`: `posts`, `status == published`, `isArchived == false`, `publishedAt DESC`, lote 50 (la página inspeccionada usa tamaño 12). | La ruta `/noticias` mostró “No encontramos noticias”, sin panel de error. | 0 documentos; sin `failed-precondition`. |
| APROBADO | `listPublicContentPage('programs', { pageSize: 12 })`: `programs`, mismos filtros públicos y orden por `publishedAt DESC`. | `/programas` mostró “No encontramos programas”, sin panel de error. | 0 documentos; sin error Firebase. |
| APROBADO | `listPublicSchedule()`: `schedule`, `status == published`, `isArchived == false`, `startTime ASC`, límite 500. | `/programacion` mostró “Programación pendiente”, no error de consulta. | 0 documentos; sin error Firebase. |
| APROBADO | `listPublished('tags', 50)`: `tags`, `status == published`, `isArchived == false`, `publishedAt DESC`, límite 50. | Las opciones de etiquetas en noticias quedaron en “Todas las etiquetas”. | 0 documentos; sin error Firebase. |
| APROBADO | `listPublishedMedia(20)`: `media`, `status == published`, `isArchived == false`, `visibility == public`, `publishedAt DESC`, límite 20. | Lectura pública permitida, sin registros listados. El servicio se usa además en superficies administrativas; la comprobación fue de lectura con filtro público. | 0 documentos; HTTP 200; sin error. |
| APROBADO | `listPublicBanners(placement)`: `banners`, placement permitido, `status == published`, `isArchived == false`, límite 50; se consultaron `home-top`, `home-feed`, `news`, `programs`, `footer`. | Los espacios publicitarios muestran sus marcadores, sin banners cargados. | 0 en cada placement; HTTP 200; sin error. |
| APROBADO | `getPublicSiteConfig()`: lectura de `publicConfig/site`. | Documento ausente; la lectura del recurso individual devolvió HTTP 404 / Firebase `NOT_FOUND`, no `permission-denied`. La app usa configuración por defecto. | 0 documento; error REST `NOT_FOUND` que representa ausencia, no fallo de permisos. |

Evidencia: el endpoint REST de Firestore devolvió `HTTP 200` y cero documentos para las consultas de categorías, publicaciones, programas, programación, etiquetas, medios y los cinco placements de banners. La lectura de `publicConfig/site` devolvió `NOT_FOUND` con el mensaje de recurso inexistente. En el navegador onrender de `/noticias` se observaron cero errores de consola y un empty state; no se observaron mensajes de error de Firebase. Al cambiar de ruta, algunos canales Firestore en tiempo real se cancelaron con `net::ERR_ABORTED`; son solicitudes abortadas por navegación, no errores de consulta confirmados. La evidencia disponible demuestra que las consultas con índices compuestos requeridos ya no fallan, pero no demuestra que haya contenido publicado: todos los resultados están vacíos.

### B. Rutas públicas

Las rutas se solicitaron en ambos hosts con `curl` y se inspeccionaron en navegador. Las respuestas HTTP de `curl` en esta fecha mostraron `200 OK`, sin `Location` ni redirecciones en las diez URLs. Los headers comunes incluyeron `Server: cloudflare`, `rndr-id`, `Cache-Control: public, max-age=0, s-maxage=300`, `ETag` y `Last-Modified`; en el dominio principal se observaron `cf-cache-status` `HIT`/`EXPIRED`, y en `.onrender.com`, `HIT`/`MISS`/`EXPIRED`. `Age`, `CF-RAY` y `rndr-id` variaron por solicitud.

| Host / ruta | HTTP/Location observado con curl | Navegador / ruta renderizada | Estado |
|---|---|---|---|
| `continental997.fm/` | 200; sin `Location`; cero redirects | URL queda en `/`; Home, título “Radio 99.7 FM | Actualidad, deportes y comunidad”. | APROBADO |
| `continental997.fm/noticias` | 200; sin `Location`; cero redirects | 301 `Location: /index.html`, luego 200; termina en `index.html` y la app renderiza 404. | FALLIDO |
| `continental997.fm/programas` | 200; sin `Location`; cero redirects | 301 `Location: /index.html`, luego 200; termina en 404 de la app. | FALLIDO |
| `continental997.fm/programacion` | 200; sin `Location`; cero redirects | 301 `Location: /index.html`, luego 200; termina en 404 de la app. | FALLIDO |
| `continental997.fm/index.html` | 200; sin `Location`; cero redirects | 200; la app renderiza 404. | FALLIDO |
| `radiocontinental99-7.onrender.com/` | 200; sin `Location`; cero redirects | URL queda en `/`; renderiza Home. | APROBADO |
| `radiocontinental99-7.onrender.com/noticias` | 200; sin `Location`; cero redirects | URL queda en `/noticias`; renderiza la página Noticias y su estado vacío. | APROBADO |
| `radiocontinental99-7.onrender.com/programas` | 200; sin `Location`; cero redirects | URL queda en `/programas`; renderiza Programas y su estado vacío. | APROBADO |
| `radiocontinental99-7.onrender.com/programacion` | 200; sin `Location`; cero redirects | URL queda en `/programacion`; renderiza Programación y su estado vacío. | APROBADO |
| `radiocontinental99-7.onrender.com/index.html` | 200; sin `Location`; cero redirects | 200; la app renderiza 404 porque `/index.html` no es una ruta de cliente. | APROBADO para ruta inexistente esperada |

La respuesta 301 de navegación del navegador para `continental997.fm/noticias` incluyó `Server: cloudflare`, `CF-Cache-Status: BYPASS`, `CF-RAY` y `rndr-id`; la respuesta subsiguiente de `/index.html` fue 200 con `Server: cloudflare` y `CF-Cache-Status: HIT`. El navegador reprodujo el mismo 301 hacia `/index.html` para `/programas` y `/programacion`. Sin embargo, `curl` desde este entorno, también con User-Agent y cabeceras de navegación similares, recibió 200 sin `Location` para esas mismas rutas. Por tanto, el redirect persiste en la ruta de navegador, pero es intermitente/dependiente del camino o caché y no es reproducible uniformemente con HTTP CLI.

Origen exacto del 301: **PENDIENTE**. La presencia de `Server: cloudflare` no demuestra que Cloudflare originó el redirect; `rndr-id` indica tránsito/procesamiento de Render, pero no identifica quién emitió el `Location`. No se consultó la configuración activa de Cloudflare/Render ni se modificó ninguna configuración. Requiere correlacionar el `CF-RAY` y `rndr-id` de una respuesta 301 con logs/configuración de ambos servicios, con autorización de lectura apropiada.

Errores de router: el cliente trata `/index.html` como ruta inexistente, que es el 404 esperado de la aplicación; el error de despliegue/ruteo consiste en que el host `continental997.fm` envía las rutas de SPA a esa ubicación en navegador. En `.onrender.com` las rutas solicitadas se resuelven correctamente.

### C. Panel administrativo

**PENDIENTE — no había sesión autenticada del propietario disponible en el navegador compartido.** La visita de solo lectura a `/admin` redirigió a `/admin/login`; la pantalla mostró el formulario de inicio de sesión. No se intentó iniciar sesión, no se solicitaron credenciales y no se realizaron escrituras.

Comprobaciones manuales propuestas para el propietario en su navegador ya autenticado:

1. Abrir `/admin` y comprobar que la sesión llega al panel sin pedir de nuevo autenticación.
2. Confirmar que el encabezado identifica la cuenta y el rol “superadministrador” conforme a los claims/perfil visibles.
3. Abrir en modo lectura Dashboard, publicaciones, programas, programación, categorías/etiquetas, multimedia, banners, configuración, usuarios/permisos y actividad; registrar cualquier `permission-denied` junto con ruta y sección.
4. No guardar formularios, cambiar roles ni ejecutar acciones de edición/destrucción durante esta comprobación.

### D. Limpieza e integridad

| Comprobación | Resultado |
|---|---|
| `firebase.indexes.review.config.json` eliminado | APROBADO; `Test-Path` devolvió `False`. |
| Manifiesto alternativo | APROBADO; SHA-256 continúa `61AD4BD9CD79492E3245735AFE8D1616A6A6E280863E1AEB5833109D829915BD`. |
| Respaldo prepublicación | APROBADO; archivo presente y SHA-256 `50056C08CE479CC2F54C4D6595A4264BDF32BF84F2995D59FF3BD513897AB414`. |
| Respaldo final de índices READY | APROBADO; archivo presente, 25 recursos `READY`, SHA-256 `FDE053B8EC47FD2F4C3DAA231B30051E747E2780BFBA8BF3EF45F3129BDE1C24`. |
| Árbol de trabajo | APROBADO sin cambios en esta intervención; `git diff --check` terminó correctamente. Permanecen modificaciones previas en README, reglas, package/scripts y auth, además del manifiesto alternativo y respaldos; no se revirtieron. |

### E. Resultado, riesgos y siguiente paso

- **APROBADO:** lecturas de categorías y publicaciones responden sin `failed-precondition`; también responden los listados públicos de programas, programación, etiquetas, multimedia y banners. Todos están vacíos, así que falta confirmar contenido publicado.
- **APROBADO:** `publicConfig/site` se distingue como documento inexistente (`NOT_FOUND`), no como denegación de permisos.
- **FALLIDO:** rutas SPA en `continental997.fm` continúan llegando a `/index.html` y muestran 404 en el navegador. El estado diverge de las respuestas `curl` 200 y del host `.onrender.com`, por lo que la causa y consistencia del redirect quedan **PENDIENTES**.
- **PENDIENTE:** sesión real del propietario para verificar rol superadministrador y lectura del panel.
- **Riesgos:** contenido editorial/configuración pública no disponible; visitantes del dominio principal pueden recibir 404 en rutas profundas; no se confirmó origen exacto del redirect; no se validó sesión autenticada ni consultas administrativas.
- **Siguiente intervención recomendada:** correlacionar el 301 mediante logs/respuesta de origen de Cloudflare y Render y corregir únicamente el componente responsable tras autorización; después repetir navegación directa y recarga de las tres rutas. En paralelo, realizar la prueba de lectura del panel con la sesión real del propietario y registrar resultados sin escribir.

Fase 1 sigue abierta; no se avanza a Fase 2.

### Complemento a intervención 33 — evidencia del panel aportada por el propietario (2026-11-10)

Este complemento actualiza únicamente la evaluación del panel de la intervención 33. Se conserva la nota anterior de que durante aquella sesión no había una sesión autenticada disponible en el navegador de esta auditoría; la evidencia nueva es una captura real de producción proporcionada por el propietario. No se realizaron pruebas adicionales en el panel para este complemento.

| Comprobación | Estado actualizado | Evidencia y alcance |
|---|---|---|
| Login / sesión reconocida y rol Superadministrador | APROBADO | La captura aportada por el propietario muestra el Dashboard de producción con el usuario identificado como Superadministrador. Evidencia visual del estado autenticado; no se repitió el flujo de ingreso. |
| Acceso y visualización del Dashboard | APROBADO | La captura muestra Dashboard cargado, menú administrativo e indicadores de Firestore cargados. |
| Actividad reciente | APROBADO | La captura muestra el panel de actividad reciente sin registros. Esto evidencia una lista vacía, no un error de lectura. |
| Acceso y lectura funcional de cada módulo | PENDIENTE | El menú visible demuestra navegación disponible, no que cada módulo haya completado consultas o leído datos correctamente. |
| Operaciones de escritura | NO VERIFICADAS | La captura no prueba que una escritura se haya enviado ni confirmada por el servidor. No se realizaron escrituras para esta revisión. |
| Integración real de los módulos con Firestore | PENDIENTE | Indicadores cargados en Dashboard no prueban persistencia ni lecturas/escrituras funcionales de cada módulo. |

La captura incluye un aviso del Dashboard que indica que la persistencia solo está activa para las operaciones conectadas y que el contenido público todavía muestra datos editoriales provisionales. Se registra como limitación/riesgo explícito: no debe interpretarse la persistencia parcial como integración completa, y los datos editoriales provisionales no constituyen evidencia de contenido productivo real publicado. Antes de afirmar que el panel está integrado de extremo a extremo, se requiere una verificación autorizada de lectura por módulo y pruebas controladas de escritura con confirmación del servidor; esas pruebas no forman parte de este complemento.

No se modificaron código, Firestore, usuarios, claims, Render o DNS. La Fase 1 sigue abierta y no se avanza a Fase 2.

## Fase 1 — intervención 34: resolución de rutas, redirecciones y dominio canónico (2026-11-11)

### Resultado ejecutivo

**BLOQUEADO — origen externo del 301 no atribuible con certeza desde el acceso disponible.** No se modificó ni desplegó código/configuración: la configuración local ya usa reglas `rewrite`, el router declara las rutas y el dominio `.onrender.com` las sirve directamente. En `continental997.fm`, navegaciones de navegador sin query a rutas profundas reciben intermitentemente/reproduciblemente desde una ruta de red `301 Location: /index.html`; `curl` y algunas visitas navegador reciben `200` sin redirect para las mismas rutas. El `/index.html` resultante renderiza el 404 de React. La diferencia entre puntos de presencia/rutas de red, la falta de lectura autorizada de la configuración activa y los headers compartidos impiden determinar si el 301 se origina en Cloudflare, Render o una interacción entre ambos.

### Investigación de configuración

| Componente | Evidencia | Estado |
|---|---|---|
| React Router | `src/App.tsx` declara `noticias`, `programas`, `programacion` y `admin/*`; `src/main.tsx` usa `BrowserRouter` sin `basename`. No se encontró una instrucción React que redirija estas rutas a `/index.html`. | APROBADO para las rutas declaradas |
| Render en repositorio | `render.yaml` declara `type: rewrite`, destino `/index.html`, para las rutas públicas solicitadas, `/admin` y `/admin/*`; no declara acciones `redirect`. El contenido remoto de `render.yaml` leído del repositorio coincide con el local. | APROBADO como configuración versionada |
| Firebase Hosting | `firebase.json` también contiene rewrites de SPA, pero el sitio está desplegado como Render Static Site; esas reglas no explican por sí mismas las respuestas del dominio de producción. No se publicó Firebase Hosting. | NO APLICA como origen demostrado |
| Otras configuraciones del repo | No se localizaron `_redirects`, `_headers`, `netlify.toml`, `vercel.json` ni archivos Wrangler en los archivos revisados. `index.html` usa canonical de `https://continental997.fm/`. | APROBADO en el alcance revisado |
| Render activo | La API de servicios de Render respondió `401 Unauthorized` sin token. No se dispone de token de lectura; no se inspeccionaron las rutas efectivas, dominio primario, deploy activo ni reglas heredadas del Dashboard. | PENDIENTE |
| Cloudflare activo | La cadena DNS del host `.onrender.com` consultado pasa por `origin.onrender.com.cdn.cloudflare.net`; las respuestas de ambos dominios incluyen `Server: cloudflare`. La consulta sin autenticar a Cloudflare Zones API respondió `403 Forbidden`; no se revisaron Redirect Rules, Page Rules, Bulk Redirects, Workers/routes, Transform/Origin Rules, Cache Rules ni normalización activa. Esto no confirma qué servicio emitió el 301 del dominio canónico. | PENDIENTE |

No se atribuye el redirect por la sola presencia de `Server: cloudflare` o `rndr-id`: esos headers prueban tránsito por esas capas, pero no identifican cuál generó el `Location`. Tampoco se conoce la configuración activa del servicio Render, así que la configuración local no basta para descartar una diferencia de despliegue o regla heredada.

### Matriz HTTP

Se solicitaron los paths requeridos con GET y HEAD sin seguir redirects, y se hicieron solicitudes GET repetidas; adicionalmente se inspeccionaron navegaciones reales, rutas con/sin barra final y query string.

| Dominio | Ruta(s) | GET/HEAD con curl | Navegador / render final | Estado |
|---|---|---|---|---|
| `https://continental997.fm` | `/` | GET y HEAD 200, sin `Location`; cero redirects. | Home carga; canonical permanece `https://continental997.fm/`. | APROBADO |
| Dominio canónico | `/noticias`, `/programas`, `/programacion` | GET y HEAD 200, sin `Location`; tres solicitudes GET repetidas por ruta también 200. | Navegación sin query llegó en las pruebas reproducidas a 301 `Location: /index.html`; respuesta final 200 en `/index.html` renderiza 404. En otras visitas y con query se cargaron las páginas. | FALLIDO / intermitente |
| Dominio canónico | `/index.html` | GET/HEAD 200, sin `Location`; cero redirects. | Renderiza el 404 esperado por el router para la ruta `/index.html`; canonical de la página 404 `/404`. | APROBADO para 404 de ruta no declarada |
| Dominio canónico | `/admin` | GET/HEAD 200, sin `Location` desde curl. | Hubo navegaciones directas que recibieron 301 a `/index.html` y mostraron 404; con query o en otra navegación `/admin` llegó a `/admin/login`. | FALLIDO / intermitente |
| Dominio canónico | `/admin/login` | GET/HEAD 200, sin `Location`. | Formulario de login renderiza, sin intentar autenticación. | APROBADO |
| `https://radiocontinental99-7.onrender.com` | `/` | GET/HEAD 200, sin `Location`; cero redirects. | Home carga correctamente. | APROBADO |
| Dominio Render | `/noticias`, `/programas`, `/programacion` | GET/HEAD 200, sin `Location`; cero redirects. | Rutas directas renderizan sus páginas respectivas y estados vacíos, sin error JavaScript observado. | APROBADO |
| Dominio Render | `/admin`, `/admin/login` | GET/HEAD 200, sin `Location` HTTP. | `/admin` navega internamente en React a `/admin/login`; el formulario carga. No había sesión autenticada. | APROBADO para protección visual/ruta de acceso |
| Dominio Render | `/index.html` | GET/HEAD 200, sin `Location`. | Renderiza el 404 esperado por el router. | APROBADO para 404 de ruta no declarada |
| Dominio Render | `/noticias/`, `/programas/` | GET 200, sin redirect. | Ambas páginas públicas cargan. | APROBADO |
| Dominio Render | `/noticias/prueba-ruta-no-existente`, `/programas/prueba-ruta-no-existente` | GET 200 por fallback de SPA. | React renderiza NotFound de contenido no existente; no es 404 de servidor. | APROBADO para fallback |

Las rutas requeridas también se probaron con `?probe=route` y `?check=<timestamp>` en el dominio canónico: respondieron 200 y varias cargaron sus páginas. Una repetición con `Cache-Control: no-cache`/`Pragma: no-cache` desde curl continuó recibiendo 200 `HIT`, por lo que esa solicitud no llegó a exponer una respuesta distinta de origen.

### Evidencia del redirect y CDN

En navegación de navegador registrada:

- `/noticias`, `/programas`, `/programacion` y `/admin` recibieron HTTP 301 con `Location: /index.html`, seguido por HTTP 200 para `/index.html`; la aplicación mostró “404 · Página no encontrada”.
- El 301 mostró `Server: cloudflare`, `CF-Cache-Status: BYPASS`, `CF-Ray` con sufijo `GRU` y un `rndr-id`. La respuesta posterior de `/index.html` mostró `CF-Cache-Status: HIT`, `CF-Ray` con sufijo `SCL` y `rndr-id`.
- En contraste, desde curl ambas zonas atendieron GET/HEAD con 200 y sin `Location`; las respuestas traían `Server: cloudflare`, `rndr-id` y `CF-Cache-Status` `HIT`/`MISS` (con `Age` variable).

La diferencia observada de sufijos PoP (`GRU`/`SCL`) sugiere variación del camino de entrega; no demuestra por sí misma una regla de Cloudflare ni un error de Render. La aparición de `BYPASS` en el 301 no es evidencia suficiente para excluir una regla externa, ni `rndr-id` identifica qué componente emitió el status. **Causa raíz: PENDIENTE de acceso a configuración/logs activos.**

### Calidad del frontend y pruebas

- `npm run typecheck`: APROBADO, exit code 0.
- `npm test`: APROBADO, 28/28 pruebas.
- `npm run lint`: APROBADO con exit code 0; 46 advertencias y cero errores (21 `react-hooks/exhaustive-deps`, 19 `react(set-state-in-effect)`, 5 `react(only-export-components)`, 1 `react(purity)`). No se modificó código para esta intervención.
- `npm run build`: APROBADO; Vite 6.4.5 completó el bundle.
- Navegación directa/recarga: APROBADO en `.onrender.com` para Home, Noticias, Programas, Programación y login; FALLIDO/intermitente en dominio canónico para rutas profundas sin query.
- Móvil: se probó layout a viewport solicitado de 390 px (ancho CSS disponible observado 375 px); no hubo overflow horizontal en Home, Noticias, Programas, Programación o login en las cargas que renderizaron la página.
- Consola: no se observaron errores de consola para las páginas principales y rutas previstas en `.onrender.com`; las visitas de dominio canónico que terminan en `/index.html` muestran el 404 de React sin error de consola asociado. Las pruebas de slug inventado devolvieron NotFound de aplicación y no se usan como prueba de datos reales.
- Canonical: páginas cargadas en ambos dominios apuntan a `https://continental997.fm/...`; no se observó canonical con `onrender.com`. Las pruebas de canonical/sitemap existentes pasaron dentro de `npm test`.
- No se ejecutó `npm ci`: las dependencias estaban instaladas y los comandos de typecheck, test, lint y build terminaron. `package.json` no define script `deploy`; no se intentó despliegue. `deploy:prepare` es una preparación de build/prerender, no despliega por sí sola, y no era necesaria para verificar este cambio (no hubo cambio de código).

### Cambios, acciones externas y cierre

Archivos de aplicación/configuración modificados: **ninguno**. No se cambió `render.yaml`, `firebase.json`, `vite.config.ts`, `index.html`, `src/App.tsx` ni `src/main.tsx`; los rewrites locales ya cubren las rutas exactas probadas y la evidencia no autoriza a inventar una causa ni a añadir redirects.

Para identificar/corregir el origen fuera del repositorio, el propietario debe revisar en sus cuentas, sin compartir tokens en el chat:

1. En Cloudflare para `continental997.fm`, revisar **Rules → Redirect Rules**, **Bulk Redirects**, **Page Rules** heredadas y **Workers & Routes**; buscar cualquier regla que para este hostname y rutas `/noticias`, `/programas`, `/programacion` o `/admin` emita status 301 y destino `/index.html`. Si existe, deshabilitar solo esa regla de path/SPA (no la canonicalización HTTP→HTTPS ni una redirección `www` deseada), conservando el proxy y HTTPS. Revisar también Cache Rules si el 301 aparece cacheado.
2. En Render Dashboard, Static Site `radiocontinental99-7`, comparar el deploy/commit activo con el `render.yaml` revisado, confirmar el dominio `continental997.fm` unido al servicio correcto y que las rutas son **Rewrite** a `/index.html`, no **Redirect**. Revisar configuraciones heredadas/redirects del servicio.
3. Si no se localiza el origen, proporcionar al soporte/propietario los `CF-Ray` y `rndr-id` de un 301 concreto con timestamp/URL y pedir correlación de logs; no es necesario revelar credenciales al agente.
4. Después de cualquier corrección autorizada y deploy externo, repetir las rutas sin query desde al menos dos redes/PoPs. No declarar resuelto por un HTTP 200 aislado; exigir que el navegador conserve el path y React renderice la página correcta, incluido `/admin/login`, en ambos dominios.

**Criterio final: BLOQUEADO** por ausencia de acceso de lectura a reglas activas de Cloudflare y configuración/logs de Render, sumado a resultados dependientes del PoP. Las correcciones locales posibles se evaluaron y no se aplicaron porque los archivos de routing ya usan rewrites y cambiar código no elimina la evidencia externa/intermitente. No hubo cambios externos, deploy, DNS, Firestore, IAM, commit ni push. La Fase 1 permanece abierta; no se avanza a Fase 2.

## Fase 2 — intervención inicial: auditoría de seguridad Firebase (2026-11-11)

### Estado y alcance

**Fase 2 EN CURSO — no publicada en producción y no completada.** Se revisaron las reglas versionadas, el flujo de Authentication/claims, guardas de rutas, servicios administrativos/editoriales, carga multimedia y pruebas locales. No se consultaron ni modificaron recursos productivos, usuarios, claims, IAM, Rules, Storage, Render o DNS. Las pruebas usaron exclusivamente Firebase Emulator Suite con el proyecto ficticio `demo-radio-rules`.

La lectura del árbol mostró cambios locales previos del propietario/intervenciones anteriores en README, auditoría, reglas, scripts, `package.json`, servicio de autenticación, respaldos y manifiesto de índices. Se conservaron. Los únicos cambios de esta intervención son las reglas locales y pruebas descritas abajo; ningún cambio fue publicado.

### Arquitectura y matriz de autorización observada

Las reglas de Firestore y Storage toman la identidad del token verificado de Firebase Authentication; no se encontró un fallback de roles desde localStorage ni desde el estado visual de React. La interfaz vuelve a leer los claims mediante `getIdTokenResult()`. Las reglas exigen correo verificado para permisos editoriales y el claim confiable `superadmin` o `editor`. La CLI privilegiada de roles restringe el proyecto, exige UID y correo concordantes al asignar, cuenta verificada/no deshabilitada, confirmación literal y relectura de claims antes de escribir.

| Actor | Lectura | Escritura | Denegaciones comprobadas |
|---|---|---|---|
| Anónimo | Contenido editorial publicado/no archivado; medios solo publicados, no archivados y `visibility: public`; `publicConfig/site` con campos permitidos. | Ninguna. | Borradores/archivados, perfiles, configuración privada, logs y escrituras. |
| Autenticado sin rol | Igual que público; puede leer su propio documento `users/{uid}` si existe. | Ninguna. | Contenido administrativo, perfiles ajenos y toda escritura. |
| Editor con correo verificado | Todos los registros editoriales de noticias/programas/programación/categorías/etiquetas, incluidos borradores; medios/banners y módulos superadmin no disponibles. | Crear/actualizar colecciones editoriales permitidas; logs correlacionados con el cambio. | Medios, banners, `publicConfig`, `privateConfig`, usuarios y borrado. |
| Superadministrador con correo verificado | Lecturas administrativas permitidas, incluidos `adminLogs`, `privateConfig` y documentos de usuario. | Contenido editorial y módulos superadmin; `publicConfig/site`; log de actividad dentro de la operación. | Escritura de `users`/`privateConfig`, actualizaciones/borrados de logs y borrado de registros editoriales/archivos desde cliente. |
| Correo no verificado | Lecturas públicas. | Ninguna operación administrativa. | Escrituras editoriales, administrativas y de Storage. |
| Usuario suspendido/deshabilitado | `adminAccess/{uid}` ahora funciona como marcador server-side consultado por Rules para operaciones Firestore con rol. | APROBADO localmente en Emulator: `suspended: true` deniega; `false` permite; ausencia permite en migración; forma inválida/error de evaluación deniega. | Storage no consulta ese marcador; un ID token vigente conserva las decisiones de Storage hasta renovación/expiración. |

No existen permisos de registro público; `/admin` y las operaciones se protegen además en Rules. Los controles de UI no se cuentan como control de servidor.

### Hallazgos y acciones

| ID | Severidad/estado | Evidencia y escenario | Corrección o tratamiento |
|---|---|---|---|
| F2-01 | 🟡 MEDIO — MITIGADO LOCALMENTE; STORAGE PENDIENTE | Antes de esta intervención las Rules autorizaban por claims sin estado de suspensión server-side. Ahora `isNotSuspended()` consulta `adminAccess/{uid}`. Un marcador `true` bloquea operaciones Firestore protegidas incluso con ID token anterior; ausente se considera activo para migración; marcador malformado/error de Rules se deniega. La prueba cubre editor y superadministrador. | Se añadió `scripts/admin-access.mjs` para suspender/reactivar solo el marcador protegido con proyecto fijo, verificación UID/correo y confirmación; no modifica Auth users ni claims. Storage Rules no evalúan este marcador, por lo que su acceso queda sujeto a validez/expiración del ID token. Para cierre, publicar Rules autorizadas y decidir si se acepta ese límite o se diseña revocación Storage. |
| F2-02 | ⚪ BAJO — CORREGIDO LOCALMENTE | `validAdminLogTarget()` permitía que una actualización real de un registro existente se acompañara de un `adminLogs` con acción distinta (por ejemplo, editar un post y etiquetarlo `visibility-change`). Las Rules verificaban actor/fecha/target, pero no la transición que representa el tipo de acción. Esto podía confundir la auditoría del superadministrador; no habilitaba acceso ni escalamiento. | Ahora la regla relaciona `create`, `update`, `publish`, `archive` y `visibility-change` con campos y transiciones concretas, y requiere cambios de contenido para `update`. Se añadió regresión de mismatch denegado y update correspondiente permitido. Sin publicar. |
| F2-03 | ⚪ BAJO — CORREGIDO LOCALMENTE | La evaluación de Storage Rules contra una solicitud sin claim `superadmin` emitía `EvaluationException` por leer una propiedad inexistente del token, aunque el acceso terminaba denegado. | Se cambió la lectura de claims a `Map.get(key, false)` dentro de guardas de identidad, evitando excepciones por claims ausentes. Firestore conserva las mismas condiciones de acceso. Emulator posterior sin esas excepciones. |
| F2-04 | ⚪ BAJO — PENDIENTE | El máximo de 500 registros multimedia activos se comprueba solo en cliente antes de cargar; no es una cuota global/transaccional y puede superarse con escrituras concurrentes o llamadas directas de un superadministrador. Las Rules sí imponen límites por archivo. | Si se requiere cuota resistente a concurrencia/cuentas comprometidas, implementar cuota server-side con backend confiable; no se añadió infraestructura nueva en esta intervención. |
| F2-05 | ⚪ BAJO — PENDIENTE | La carga a Storage y la creación posterior de `media/{id}` en Firestore son dos operaciones separadas. Si la segunda falla, queda un archivo huérfano; Storage prohíbe el borrado desde cliente. Las reglas no permiten a usuarios no autorizados crear estos objetos. | Documentar limpieza privilegiada controlada o implementar reconciliación confiable antes de declarar integridad de ciclo multimedia completa. No se habilitó borrado de Storage. |
| F2-06 | ℹ️ INFORMATIVO — LIMITACIÓN | Storage Rules validan `contentType` declarado, metadata, rol y tamaño, pero no leen la firma/binario del archivo. Un superadministrador que envíe bytes maliciosos con MIME permitido puede evadir una comprobación basada solo en MIME; el riesgo se limita a una cuenta privilegiada y no a cargas anónimas/editoriales. | Para escaneo real de bytes se necesita proceso confiable de análisis/normalización. No se afirmó que Rules verifiquen firmas. Se excluyen SVG, HTML, JavaScript y ejecutables como tipos declarados. |

### Revisión por componente

**Firestore Rules — APROBADO en el alcance cubierto por Emulator, con el hallazgo local F2-02 corregido.** Las reglas usan allowlist de campos, tipos/longitudes/estados, verifican actor y timestamps del servidor, protegen `createdBy`/`createdAt`, limitan colecciones por rol y niegan borrados. `users` solo se lee a sí mismo o por superadmin y no admite escrituras de cliente; `privateConfig` es solo lectura superadmin/no escritura cliente; `adminLogs` solo permite creación correlacionada, sin update/delete. `publicConfig/site` tiene allowlist de campos, validación de enlaces y escritura superadmin.

Las queries públicas inspeccionadas restringen status/archivo a lo que autorizan las reglas. Las pruebas existentes cubren consultas públicas, datos publicados, roles, correo no verificado, autoasignación, campos protegidos, colecciones y borrados; no se usan datos reales.

**Storage Rules — APROBADO para las reglas actuales y los casos añadidos en Emulator; auditoría de contenido binario/cuota global y revocación inmediata pendiente.** Todo path salvo `media/{fileName}` queda denegado. Lectura superadmin o archivo explícitamente `public`; alta solo superadmin verificado; update conserva tamaño, MIME y `uploadedBy`; delete siempre denegado. Allowlist actual: JPEG/PNG/WebP/AVIF, MPEG/AAC/OGG/WAV y MP4; máximos 10 MiB imagen, 25 MiB audio y 50 MiB video. La UI de carga expone imágenes; formatos de audio/video siguen permitidos por las reglas para consumidores/uso futuro. Las reglas no consultan `adminAccess/{uid}`: la suspensión Firestore no revoca instantáneamente acceso a Storage de un ID token todavía vigente.

**Authentication y guardas — APROBADO para flujos inspeccionados; PENDIENTE de pruebas funcionales con Auth Emulator.** La app usa persistencia local, `onIdTokenChanged`, fuerza refresh al completar verificación, obtiene roles de Firebase ID token, requiere correo verificado para administración, presenta carga/error y cierra sesión en Firebase. La recuperación no revela si el correo está registrado: devuelve mensaje genérico ante éxito, usuario inexistente o correo inválido. No se encontró ruta/formulario público de registro. El reset verifica `oobCode` con Firebase antes de guardar. El estado de suspensión no modifica ni invalida claims: Firestore Rules hace cumplir el marcador server-side; la UI puede seguir mostrando el panel según el claim hasta que cambie la sesión, aunque Firestore deniega las operaciones. La verificación de plantillas, dominios autorizados y entrega de correo requiere acceso al proyecto/propietario y no se afirmó como comprobada.

**Roles y servicios — APROBADO PARCIALMENTE.** La matriz arriba refleja reglas y rutas. Los servicios realizan validación cliente además de Rules; los cambios editoriales usan transacciones y `adminLogs`, y las ediciones comparan `updatedAt` cuando se entrega el valor esperado. El contenido HTML se limpia con DOMPurify al guardar y también al renderizar, con tags/atributos permitidos y URLs restringidas. La gestión de roles/suspensión está fuera del cliente; `AdminUsersPage` muestra perfiles de Firestore, no enumera Authentication. Persisten el límite Storage de F2-01 y las cuestiones operativas F2-04/F2-05.

### Cambios locales de esta intervención

- `firestore.rules`: acceso seguro a claims ausentes y correlación semántica entre acción de auditoría y cambio documental.
- `storage.rules`: acceso seguro a claims ausentes sin cambiar matriz de permisos.
- `scripts/admin-access.mjs`, `scripts/admin-access.test.mjs`: CLI privilegiada y pruebas para marcador protegido, identidad, confirmación y reactivación; no modifica usuarios Auth ni claims.
- `scripts/firestore-rules.emulator.mjs`: regresiones para acción de log desajustada y marcador ausente, suspendido, reactivado, malformado y ataques de escalamiento.
- `scripts/storage-rules.emulator.mjs`: nuevas pruebas de editor/no verificado/anónimo, MIME rechazado, límite de tamaño, path anidado, lectura privada/pública, metadata y borrado.
- `README.md`: comandos locales y procedimiento seguro del marcador de suspensión, migración y límite Storage.
- `docs/AUDITORIA-INTEGRAL.md`: esta sección, sin eliminar historial.

No se modificaron manifiestos/dependencias, Authentication/claims reales, perfiles, Storage productivo, Firestore productivo ni configuración de despliegue. No se ejecutó `npm ci`: las dependencias ya estaban instaladas y restaurarlas reemplazaría `node_modules`; no hubo cambio de dependencias en esta intervención.

### Validación técnica real

| Comando | Resultado |
|---|---|
| `node --test` (`npm test`) | APROBADO: 32/32 pruebas, 0 fallos; incluye cuatro nuevas pruebas del CLI de suspensión/reactivación. |
| Firebase Emulator Suite, Firestore + Storage, `node --test scripts/firestore-rules.emulator.mjs scripts/storage-rules.emulator.mjs` | APROBADO: 19/19 pruebas, 0 fallos; incluye suspensión, reactivación, escalamiento, marcador malformado/ausente y regresiones. Se usó JDK 21 encontrado localmente y `demo-radio-rules`; no se accedió a producción. |
| `npm run typecheck` | APROBADO, exit code 0. |
| `npm run lint` | APROBADO, exit code 0; 46 advertencias preexistentes (21 `react-hooks/exhaustive-deps`, 19 `react(set-state-in-effect)`, 5 `react(only-export-components)`, 1 `react(purity)`); no se trataron por ser ajenas a esta intervención. |
| `npm run build` | APROBADO; Vite 6.4.5 completó build de producción local. |
| `node --check` sobre ambos harnesses Emulator | APROBADO. |
| `git diff --check` | APROBADO. |

Un primer intento de ejecutar emuladores con Java fuera de PATH falló; se localizó JDK 21 existente y se repitió correctamente con `JAVA_HOME`/`PATH` temporal del proceso. El segundo resultado no reportó `EvaluationException`.

### Autorización y cierre de Fase 2

Las reglas corregidas están **solo en el árbol local**. Su publicación requiere autorización expresa del propietario y una intervención separada con preflight, hash/backup del estado productivo, comparación de Rules/Storage activas y verificación posterior. Esta intervención no crea marcadores productivos ni publica recursos. La migración es compatible porque los documentos `adminAccess/{uid}` ausentes permiten acceso existente; al escribir un marcador, `true` bloquea y `false` reactiva en Firestore. No se debe confundir 19/19 pruebas de emulador con estado de producción.

Para cerrar Fase 2 aún falta: revisar/aprobar y publicar Rules localmente corregidas con autorización; comprobar reglas activas de Storage; documentar/aceptar explícitamente que la suspensión no revoca inmediatamente Storage y que un ID token vigente puede durar hasta expirar/renovarse; decidir cuota global y reconciliación de Storage si son requisitos operativos; comprobar la configuración Firebase externa de correo/domains; ejecutar Auth Emulator/casos integrales de login, expiración y suspensión. **Fase 2 queda EN CURSO y no se avanza a Fase 3.**

## Intervención correctiva — Error de carga multimedia en el panel administrativo (2026-11-11)

### Síntoma y alcance

Se informó que la sección Multimedia muestra el nombre y la vista previa, pero el botón queda indefinidamente en «Subiendo a Storage...» y no aparece el registro en la biblioteca. Se pausó el trabajo de Fase 2; esta intervención se limita al flujo multimedia. No se usaron credenciales, no se hicieron escrituras productivas ni despliegues.

### Diagnóstico

**Causa demostrada en el código local:** la interfaz mostraba un único estado «Subiendo a Storage...» durante toda la función `uploadMedia`, aunque antes de iniciar la carga se verificaban el rol y el conteo de Firestore. La llamada de Storage usaba `uploadBytes` sin progreso, cancelación ni límite temporal. El alta del documento de Firestore ocurría después y la interfaz no diferenciaba esas etapas. Por tanto, cualquier promesa de preflight, Storage o escritura que no terminara dejaba el formulario en estado de carga sin informar dónde estaba detenida.

**Límite de evidencia:** no se pudo determinar qué solicitud concreta quedó pendiente en la incidencia de producción ni confirmar un fallo de permisos, bucket, CORS o red. La página de producción disponible en el navegador era `/admin/login`; no había sesión autenticada y no se intentó iniciar sesión. No se atribuye el incidente a Storage ni se presenta la corrección local como una reproducción del fallo productivo.

### Cambios locales

| Archivo | Cambio |
|---|---|
| `src/services/media.ts` | Sustituye `uploadBytes` por carga reanudable con progreso y plazo máximo de 120 segundos; limita a 30 segundos la verificación de rol y el conteo previo. Valida antes de iniciar, mantiene los MIME/límites existentes y registra eventos `UPLOAD_STARTED`, `STORAGE_UPLOAD_COMPLETED` y `UPLOAD_FAILED` con etapa, ruta opaca, duración y código Firebase, sin token/correo/nombre de archivo. |
| `src/pages/admin/AdminMediaPage.tsx` | Distingue validación, preflight, carga y guardado Firestore; muestra el progreso, bloquea doble envío y recupera el botón/estado después de éxito o error. Si Storage terminó pero Firestore falla, conserva la operación pendiente y permite reintentar el registro sin volver a cargar. Informa la ruta para recuperación y no borra objetos automáticamente. |
| `src/services/content.ts` | Permite un ID determinista únicamente para un registro multimedia. Al reintentar una operación con resultado incierto, la transacción comprueba si el mismo usuario ya creó ese mismo registro y lo trata como éxito sin sobrescribirlo ni duplicar el log; una colisión con otros datos falla explícitamente. |
| `scripts/storage-rules.emulator.mjs` | Añade verificación de cargas reanudables JPEG, PNG y WebP bajo las reglas actuales. |
| `docs/AUDITORIA-INTEGRAL.md` | Se añade esta sección sin reemplazar el historial de auditoría. |

El sistema editorial usa `storagePath` y lecturas autenticadas mediante `getBlob`; no guarda una URL con token de descarga. Se omitió intencionalmente `getDownloadURL`: para un archivo que empieza privado, el token incluido en esa URL funcionaría como enlace portador y podría evadir el control de lectura esperado. No hay una etapa de recuperación de URL en el flujo actual ni se cambió ese modelo de privacidad.

### Pruebas y resultados

| Prueba | Resultado | Evidencia |
|---|---|---|
| JPEG, PNG y WebP con operación reanudable | APROBADO en Storage Emulator | La prueba nueva verifica que las tres cargas terminan y conservan el MIME esperado. |
| Formato no permitido, archivo excedido, rol editor/no verificado y lectura privada | APROBADO en Storage Emulator | Casos negativos existentes del harness; el cambio no amplía Rules ni MIME aceptados. |
| Firestore y Storage Rules | APROBADO: 20/20 | `firebase emulators:exec --only firestore,storage --project demo-radio-rules "node --test scripts/firestore-rules.emulator.mjs scripts/storage-rules.emulator.mjs"`; proyecto de demostración, sin acceso productivo. |
| Suite unitaria del repositorio | APROBADO: 32/32 | `npm test`. |
| Typecheck y build | APROBADO | `npm run typecheck`; `npm run build`. |
| Lint de archivos modificados | APROBADO, exit code 0 | `npx oxlint src/services/media.ts src/services/content.ts src/pages/admin/AdminMediaPage.tsx`; reportó advertencias de hooks ya presentes en la página, no errores. |
| Integridad del diff | APROBADO | `git diff --check`. |
| Fallo inducido de cada etapa del servicio, timeout real, render React del estado/reenviar y recuperación tras recargar la página | PENDIENTE | No hay un harness de pruebas de integración de la página/servicio en el repositorio. El Emulator comprobó Rules y operaciones reanudables; no simula los timeouts de red ni el ciclo React completo. |
| Fallo de obtención de URL de descarga | NO APLICA | El flujo no obtiene una URL portadora; usa `storagePath` y `getBlob` autorizado para conservar la privacidad. |

Los límites se aplican además al guardado de Firestore (30 segundos). Si una transacción termina en el servidor después del timeout visible, el mismo ID idempotente evita crear un segundo registro al reintentar. Una carga completada cuyo documento no se guarda puede permanecer privada y sin referencia: la interfaz conserva la ruta, no intenta eliminarla y permite reintentar el registro en la página actual. Si se abandona la página, la recuperación automática no está implementada; la ruta registrada permite investigación manual privilegiada.

### Seguridad y producción

Se conservaron los límites de 10 MiB para imágenes y los tipos aceptados en las reglas existentes. No se modificaron `firestore.rules` ni `storage.rules` en esta intervención (sus cambios locales preexistentes de Fase 2 se preservaron). Tampoco se modificaron datos, usuarios, claims, IAM o configuración externa. No se ejecutó Firebase deploy, no se desplegó la aplicación y no hubo commit/push.

**Producción: PENDIENTE.** No se pudo probar la sección Multimedia sin sesión autenticada. La corrección solo está en el árbol local; resultados del Emulator/build no prueban producción.

### Estado

**CORREGIDO Y VALIDADO LOCALMENTE** para los defectos de UX/control de terminación identificados en el código. La causa de red o plataforma específica de la incidencia productiva permanece **no determinada**, y el recorrido visual autenticado aún requiere verificación. Fase 2 sigue pausada según la solicitud; no se avanza a otra fase.

**Siguiente comprobación:** revisar esta corrección local y, si el propietario autoriza por separado su despliegue, probar una imagen válida en la instancia desplegada observando las etapas y códigos estructurados de diagnóstico. Si persiste un error, compartir únicamente etapa y código Firebase (sin tokens, correo ni datos privados) para localizar la dependencia responsable.

### Revisión final previa al despliegue (2026-11-11)

Se revisó el diff completo de la intervención correctiva, las reglas locales vigentes y el SDK Firebase Storage 11.10.0. Esta revisión no cambió código, reglas, datos ni configuración; no hubo despliegues ni operaciones productivas.

| Comprobación | Resultado | Evidencia y observación |
|---|---|---|
| Timeout Storage cancela la tarea | APROBADO por inspección del SDK | Al vencer el timer, `waitForUpload` llama a `task.cancel()`. En el SDK fijado, `UploadTask.cancel()` transiciona a `canceling` y cancela el `Request` activo. La tarea queda cancelada; si el servidor ya confirmó el objeto antes de recibir la cancelación, el objeto puede existir aun cuando el cliente recibió timeout. No se probó un stall de red de 120 segundos en Emulator. |
| Liberación de listeners | APROBADO por inspección | Los listeners se desuscriben en éxito, error y timeout; el timer se limpia en éxito y error. La ruta de timeout primero desuscribe y cancela. La prueba Emulator añadida cubre finalización reanudable, no espía la liberación de listeners en una cancelación temporizada. |
| Recuperación del formulario | APROBADO con alcance | `finally` libera el lock; `catch` cambia a error y habilita reintento/descartar. La recuperación pendiente reside solo en el estado de React y se pierde al abandonar o recargar la página. |
| Reintento de Firestore e idempotencia | APROBADO para el mismo documento | Reusa `documentId`; la transacción lee el registro existente y solo acepta el reintento si coinciden usuario creador, estado borrador, ruta y metadatos. Si el primer commit llegó tarde, el reintento no vuelve a crear documento ni log. No hay prueba automatizada directa de esta transacción en el conjunto actual. |
| Aislamiento de archivo y no sobrescritura | FALLIDO — bloqueante | En un resultado ambiguo de Storage, el estado pendiente no tiene `uploadedMedia` y «Reintentar carga» vuelve a ejecutar `uploadBytesResumable` sobre la misma ruta. `storage.rules` permite `update` a un superadministrador si coinciden MIME, tamaño y `metadata.uploadedBy`; no verifica igualdad de bytes. Por tanto, el reintento puede reemplazar un objeto ya existente en esa ruta. Además, `createRecord` valida el formato del `documentId`, pero no verifica la propiedad/metadata del objeto Storage ni que el `storagePath` corresponda a ese ID. El flujo normal genera UUID y metadata del usuario actual, pero eso no demuestra la propiedad en recuperación ni excluye asociación con otro objeto. |
| Errores de permisos | PARCIAL | Firestore pasa por `toFirebaseServiceError`, que convierte `permission-denied` en mensaje claro. La subida Storage construye `MediaUploadError` desde el error original en vez de usar el mapeo existente para `storage/unauthorized`; presenta el texto del SDK directamente y puede no ser consistente/localizado. |
| Exposición de tokens/credenciales/URLs privadas | APROBADO por inspección | El código no solicita ni registra tokens, credenciales o `getDownloadURL`; mantiene `storagePath` y usa lecturas autorizadas con `getBlob`. Los logs estructurados incluyen la ruta `media/<UUID>`, etapa, duración y código de error, sin nombre ni correo. |
| Compatibilidad de las reglas locales | APROBADO parcialmente | El Storage Emulator acepta las cargas reanudables JPEG/PNG/WebP bajo las reglas actuales y deniega formatos, tamaños y roles no permitidos. El flujo Firestore combina el documento `media` y su `adminLogs` mediante transacción; las Rules versionadas conservan validaciones de rol, campos y log correlacionado. Esto valida el Emulator, no el estado activo de producción. La regla de `update` citada arriba es precisamente el impedimento para aprobar el reintento seguro. |

#### Pruebas ejecutadas en esta revisión

| Comando | Resultado |
|---|---|
| `npm test` | APROBADO: 32/32. |
| Firebase Emulator Firestore + Storage (`node --test scripts/firestore-rules.emulator.mjs scripts/storage-rules.emulator.mjs`) | APROBADO: 20/20; incluye cargas reanudables JPEG, PNG y WebP, pero no timeout/cancelación ni overwrite de ruta existente. |
| `npm run typecheck` | APROBADO. |
| `npm run lint` | Exit code 0; 46 advertencias reportadas en el repositorio. |
| `npm run build` | APROBADO. |
| `git diff --check` | APROBADO. |

#### Veredicto

**NO APTO PARA DESPLIEGUE.** No se cumple el requisito de recuperación sin sobrescritura ni asociación de archivos ajenos. El timeout sí ordena cancelar la tarea según el SDK, pero esa cancelación no puede descartar que el servidor ya haya finalizado el objeto sin que el cliente recibiera confirmación. En ese caso el retry puede volver a escribir una ruta que Rules permite actualizar.

Antes de reconsiderar el despliegue, debe resolverse y probarse la recuperación de un resultado de Storage ambiguo sin hacer una segunda carga ciega, y debe comprobarse la propiedad del objeto antes de asociarlo al documento. También debe verificarse una denegación de permisos Storage con mensaje claro y probarse en Emulator que no se sobrescribe un objeto existente. Esta revisión no implementó esas correcciones.

Si más adelante se aprueba una versión corregida, la entrega sería únicamente la aplicación web construida desde `src/pages/admin/AdminMediaPage.tsx`, `src/services/media.ts` y `src/services/content.ts` (más sus artefactos normales de build). No ejecutar `firebase deploy`, ni publicar `firestore.rules`, `storage.rules`, índices u otros recursos Firebase. En este estado no se recomienda publicar ningún archivo.

### Continuación correctiva — verificación servidor-autorizada de multimedia

Esta continuación reemplaza la recomendación de despliegue web-only anterior: la revisión confirmó que un cliente React no puede demostrar la relación entre los bytes de Storage y un registro Firestore, y que las Rules no pueden consultar Storage. Por eso se añadió localmente un backend mínimo; no se desplegó ningún recurso.

#### Cambios locales

| Archivo | Cambio |
|---|---|
| `functions/index.mjs` | Exporta las Callable Functions `finalizeMediaUpload` y `setMediaState`; limitan instancias y tiempos, y no requieren credenciales fijas. |
| `functions/src/media-operations.mjs` | Exige sesión, claim `superadmin` y correo verificado. Antes de registrar el medio comprueba ruta, uploader, MIME, tamaño, SHA-256 de los bytes descargados y colisión de ID. Documento multimedia y log se escriben en una transacción idempotente. Las transiciones de publicación usan el servidor para cambiar metadata de Storage y Firestore; si Firestore falla, se intenta regresar el objeto a privado y se informa explícitamente si esa compensación falla. Un contador transaccional limita los medios activos a 500. |
| `functions/package.json`, `functions/package-lock.json` | Aíslan las dependencias de Functions en Node 20; `uuid` queda fijado a `11.1.1`, acorde con el override ya usado por el repositorio. `npm audit --omit=dev` devuelve cero vulnerabilidades para las dependencias de ejecución de Functions. |
| `functions/test/media-operations.test.mjs` | Añade pruebas unitarias simuladas del backend: autorización, hash, colisión, reintento concurrente, límite, estados, compensación y activos antiguos. Son pruebas de lógica con dobles, no sustituyen al Emulator. |
| `firebase.json` | Declara el código fuente y runtime Node 20 de Functions y el puerto local del Emulator Functions. No se publicó Hosting. |
| `firestore.rules` | Niega creación y actualización directa de documentos `media`; esas escrituras solo las hace el Admin SDK de las Functions. |
| `storage.rules` | Permite únicamente crear el objeto inicial privado con metadata de UID, ID de operación y SHA-256; deniega update y delete desde clientes. El límite de bytes y MIME se conserva. |
| `src/lib/firebaseFunctions.ts` | Inicializa Functions y la conexión al Emulator cuando `VITE_USE_FIREBASE_EMULATORS=true`. |
| `src/services/media.ts` | Genera UUID y SHA-256, comprueba los datos antes y después de la carga, carga con `uploadBytesResumable`, cancela al superar 120 segundos, libera los listeners al terminar y delega alta/publicación/archivo a las Callable Functions. No genera ni guarda enlaces portadores. |
| `src/pages/admin/AdminMediaPage.tsx` | Conserva en `sessionStorage` —sin tokens— los datos mínimos de una operación asociada al UID para reintentar en la misma pestaña, incluso tras recarga. Verifica primero una finalización posiblemente ambigua; si falta el objeto exige seleccionar de nuevo el mismo archivo y reutiliza su ID. El estado del formulario se libera en éxito o error. |
| `src/services/content.ts`, `src/services/firebaseErrors.ts` | Impide registrar medios por el camino genérico, enruta estados a Functions y traduce errores pertinentes de Storage/Functions. |
| `scripts/storage-rules.emulator.mjs`, `scripts/firestore-rules.emulator.mjs` | Actualiza los casos esperados: el cliente no puede sobrescribir ni cambiar visibilidad del objeto, ni crear/actualizar el documento de medio directamente. |

No se inicializa App Check en esta aplicación; por eso las Functions no lo exigen todavía. El control de servidor sigue exigiendo autenticación, claim privilegiado y correo verificado. La exposición de las Callable Functions sin App Check debe revisarse antes de aumentar el volumen de uso.

#### Compatibilidad de activos anteriores

Los activos nuevos solo se publican tras la comprobación de hash. Un medio antiguo cuyo objeto no tenga metadata/hash verificable puede despublicarse o archivarse desde el backend si la ruta, MIME, tamaño y UID heredado coinciden; no puede volver a publicarse mediante el flujo nuevo. No se migraron objetos ni documentos. Para volver a publicar esos medios, hace falta re-subirlos por el flujo nuevo o aprobar una migración privilegiada separada. No se borran huérfanos automáticamente.

La operación pendiente se conserva en `sessionStorage`, por lo que sobrevive a una recarga en la misma pestaña, no al cierre de esa sesión de pestaña. Una transferencia cuyo servidor completó antes de recibir la cancelación puede dejar un objeto privado; la recuperación lo reconoce por UID, ID y hash. Si se pierde el estado local, no existe todavía una pantalla de inventario/recuperación automática de esos huérfanos.

#### Verificación realizada

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Firebase Storage SDK: timeout/cancelación | APROBADO por inspección del SDK instalado | `UploadTask.cancel()` solo devuelve `true` para tareas `running`/`pausing`, transiciona a `canceling` y cancela el Request activo. El cliente espera el evento terminal antes de soltar el listener; contempla una notificación inicial síncrona y desuscribe también en ese caso. No se simuló una red detenida durante 120 segundos. Si el servidor ya completó el objeto, su existencia se verifica, no se reescribe ciegamente. |
| Backend de medios | APROBADO en pruebas unitarias simuladas: 7/7 | `Set-Location functions; npm test`. Incluye verificación de hash/UID, reintentos, colisiones, contador de 500, estados, compensación de conflictos y restricción de publicación de activos antiguos. No prueba una transacción real de Firestore ni una transferencia real de Storage. |
| Suite del repositorio | APROBADO: 39/39 | `npm test`, después de los cambios finales. |
| TypeScript y build | APROBADO | `npm run build` incluye `tsc -b` y `vite build`; completó correctamente después de los cambios finales. |
| Lint | APROBADO, exit code 0 en los archivos cliente revisados | `npx oxlint src/services/media.ts src/services/content.ts src/services/firebaseErrors.ts src/pages/admin/AdminMediaPage.tsx`. Presentó advertencias de hooks/estado en efectos de `AdminMediaPage`; no errores. |
| Emulator Rules Firestore/Storage/Functions | PENDIENTE — no se pudo ejecutar | Firebase CLI devolvió `Could not spawn java -version`; no hay Java disponible en este entorno. Por tanto no se declara que las Rules nuevas sean compatibles ni que los casos de overwrite/denegación pasen. |
| Producción | NO EJECUTADO | No hubo lectura/escritura de producción, creación de recursos, cambios de Rules, deploy, commit o push. |

#### Dependencias y despliegue

Esta solución ya no es exclusivamente una corrección de la web. La nueva interfaz requiere Functions; además, las Rules deben negar los caminos de escritura cliente para que la integridad no dependa de la interfaz. Por tanto **no debe publicarse solo el bundle web** ni ejecutarse un `firebase deploy` general. El procedimiento, sujeto a autorización expresa y a pasar Emulator, debe ser coordinado y limitado a:

1. Revisar el archivo completo actual de Rules, porque publicarlo reemplaza el conjunto activo, no solo las líneas multimedia. En una ventana de mantenimiento, publicar únicamente `firestore:rules,storage` con `--project radio997-d5380`; esto bloquea las escrituras antiguas de medios hasta que se despliegue el cliente nuevo.
2. Publicar únicamente `functions:finalizeMediaUpload,functions:setMediaState` con el mismo proyecto explícito.
3. Publicar la aplicación web en su plataforma habitual (Render), sin Firebase Hosting.
4. Verificar carga, recuperación con resultado ambiguo, publicación, despublicación, archivado y denegación de overwrite con un usuario de prueba autorizado. Los índices Firestore no forman parte del cambio.

No ejecutar estos comandos sin autorización independiente para Rules, Functions y aplicación. La falta de Java y de pruebas reales del Emulator bloquea la autorización técnica en este momento.

#### Veredicto actualizado

**NO APTO PARA DESPLIEGUE por ahora.** La ruta de escritura cliente y la sobrescritura directa quedan cerradas en el código candidato; el backend verifica el objeto y hace idempotente el registro. Sin embargo, faltan las pruebas de Emulator de las nuevas Rules y la integración real entre Auth, Functions, Storage y Firestore. Además, el despliegue es necesariamente coordinado con Rules y Functions y no puede tratarse como una publicación web-only. Los resultados son locales y no constituyen evidencia de producción.

Esta continuación no modificó recursos productivos, datos, usuarios, claims, IAM, dominios ni DNS; tampoco ejecutó despliegues, commits o pushes.

## Continuación correctiva — ejecución de Firebase Emulator (2026-11-11)

### Entorno y seguridad de la ejecución

| Componente | Evidencia |
|---|---|
| Raíz de trabajo | `C:\Users\Usuario\RadioContinental99.7` |
| Java | Eclipse Temurin JDK `21.0.13+9-LTS`, en `C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot`. No estaba en `PATH` ni definido en `JAVA_HOME`; se configuraron ambos solo en los procesos de prueba. No se instaló Java ni se cambiaron variables persistentes. |
| Node / npm | Node `v20.18.0`, npm `10.8.2`. |
| Firebase CLI | El instalado era `14.17.0`. Su Functions Emulator llama `firebase-functions.config()`, eliminado por el SDK Functions `7.4.0`; la invocación terminaba con `functions.config() has been removed` y mataba la función. Para continuar se ejecutó Firebase CLI `15.36.0` mediante `npx --yes firebase-tools@15.36.0`, sin cambiar la instalación global ni los manifiestos del proyecto. |
| SDK | Firebase Web `11.10.0`, `@firebase/rules-unit-testing` `4.0.1`, Firebase Admin `13.10.0`, Firebase Functions `7.4.0`. |
| Emuladores | Auth `9099`, Firestore `8080`, Functions `5001`, Storage `9199`; puertos distintos y libres antes del inicio. Functions cargó desde `functions/`, runtime Node 20. Firestore Emulator `v1.22.0`; Storage Rules runtime `v1.1.3`. |
| Rules cargadas | Los harnesses leen directamente los archivos locales actuales `firestore.rules` y `storage.rules`. El harness integrado también entrega esos mismos contenidos a `initializeTestEnvironment`. |
| Proyecto | Únicamente `demo-radio-rules`; no se usó `radio997-d5380`. El harness de integración exige un ID `demo-*` y las direcciones locales de Auth, Firestore y Storage Emulator. No se usaron cuentas, tokens ni documentos productivos. |

Firebase CLI avisó que hay ADC locales y que los servicios no emulados podrían usar producción. Las pruebas solo utilizaron Auth, Firestore, Storage y Functions emulados; los SDK web se conectaron a los puertos locales, el Admin SDK heredó las variables de emulador y el proyecto fue `demo-radio-rules`. El aviso no se tomó como prueba de acceso productivo. No se realizaron operaciones productivas.

### Resultado de Rules e integración

| Prueba | Resultado | Evidencia/alcance |
|---|---|---|
| Firestore Rules | **APROBADO: 17/17** | `npx --yes firebase-tools@15.36.0 emulators:exec --project demo-radio-rules --only auth,firestore "node --test scripts/firestore-rules.emulator.mjs"`. Incluye roles, correo no verificado, lecturas públicas/privadas, escrituras directas de `media`, manipulación de roles y borrados. Usa contextos de Rules Unit Testing, no tokens de Auth Emulator. |
| Storage Rules | **APROBADO: 3/3** | `npx --yes firebase-tools@15.36.0 emulators:exec --project demo-radio-rules --only auth,storage "node --test scripts/storage-rules.emulator.mjs"`. Cubre superadmin, editor, email no verificado, tipo/tamaño, carga reanudable, lectura privada, overwrite secuencial, cambio de metadata y borrado. Usa contextos de Rules Unit Testing. |
| Auth + Functions + Storage + Firestore | **FALLIDO: 5/6** | `npx --yes firebase-tools@15.36.0 emulators:exec --project demo-radio-rules --only auth,firestore,storage,functions "node --test scripts/media-functions.emulator.mjs"`. Cinco casos aprobaron: carga y finalización reales; timeout del cliente tras completar Storage y recuperación/idempotencia; publicación, lectura pública, despublicación, archivado y contador; rechazo de usuario sin claim/no verificado, propietario ajeno, hash incorrecto, ruta inexistente y colisión; rechazo por contador Firestore inválido, publicación de activo heredado y objeto Storage ausente. |
| Dos cargas simultáneas con el mismo ID | **FALLIDO** | En el caso real de Storage Emulator, dos llamadas simultáneas a `uploadBytes` sobre `media/{mismo UUID}`, con bytes y SHA-256 distintos, terminaron ambas con éxito. La aserción esperaba una carga rechazada. La condición local `resource == null` impide el overwrite secuencial probado, pero no evita que ambas solicitudes concurrentes pasen la comprobación cuando el objeto aún no existe. No se afirma que la política proteja esa carrera. |
| Dos finalizaciones concurrentes del mismo medio | **APROBADO** | En Functions Emulator ambas llamadas reales a `finalizeMediaUpload` devolvieron el mismo ID y quedó un solo documento, log y registro de capacidad. |
| Compensación al fallar Firestore después de Storage | **APROBADO** | En Functions Emulator se envió una versión `expectedUpdatedAt` obsoleta: Storage se marcó público, la transacción Firestore abortó, la Function devolvió `aborted` y compensó el objeto a privado sin cambiar el documento. La prueba es una falla determinista de concurrencia/versionado, no una caída de servicio inyectada. |
| Timeout tras completar Storage | **APROBADO con alcance delimitado** | El cliente callable de prueba expiró a los 500 ms después de subir el objeto; la Function siguió ejecutándose en Emulator, Firestore confirmó el registro y un reintento real fue idempotente. Esto prueba el timeout/respuesta ambigua de finalización, no una transferencia de 120 segundos detenida en medio del upload. |
| Fallo de Storage durante transición | **APROBADO parcialmente** | Se eliminó un objeto únicamente en Storage Emulator y la Function rechazó publicar sin cambiar el estado Firestore. No se inyectó una caída de red/servicio en mitad de `setMetadata`. |
| Error inicial de CLI | **DIAGNÓSTICO RESUELTO LOCALMENTE** | Firebase CLI `14.17.0` no puede emular correctamente este paquete con Functions SDK `7.4.0`: el propio runtime llama al método eliminado `functions.config()`. Usar CLI `15.36.0` en caché permitió iniciar y ejecutar Functions Emulator. No se alteró el CLI global. |

El harness integrado y sus fallas/simulaciones están en `scripts/media-functions.emulator.mjs`. La concurrencia es una prueba real de dos uploads del SDK contra Storage Emulator, no un doble. Las pruebas de Firestore inválido, versión obsoleta y objeto ausente son fixtures/situaciones deterministas sobre emuladores; no simulan una caída física del servicio.

### Validación general del repositorio

| Comando | Resultado |
|---|---|
| `npm test` | **APROBADO: 39/39** |
| `Push-Location functions; npm test; Pop-Location` | **APROBADO: 7/7** |
| `npm run typecheck` | **APROBADO** |
| `npm run build` | **APROBADO** |
| Oxlint dirigido a cliente, Functions y harnesses | Exit code 0; **7 advertencias preexistentes** de hooks/estado en efectos en `AdminMediaPage`, sin errores. |
| `git diff --check` | **APROBADO** |

### App Check — análisis, sin habilitar

La aplicación revisada es web React con Firebase JS SDK `11.10.0`; no se identificaron clientes nativos Android/iOS. App Check reduciría llamadas desde clientes no autorizados y abuso de APIs; no sustituye Authentication, claims, Rules ni validación del backend. Para web, los proveedores aplicables son reCAPTCHA Enterprise (preferido) o reCAPTCHA v3; el token de depuración debe limitarse a desarrollo local.

Propuesta no ejecutada: registrar la app web en Firebase App Check; inicializar `initializeAppCheck` con el proveedor web elegido antes de crear/usar los servicios; observar métricas sin enforcement para Firestore y Storage; probar cliente y Callable Functions en un entorno de staging; luego configurar `enforceAppCheck: true` en las opciones de ambas Functions y habilitar enforcement de los productos solo tras confirmar tokens válidos. Las Functions v2 soportan enforcement por opción de `onCall`; el cliente Callable agrega el token cuando App Check está inicializado. En el Emulator las llamadas observadas indicaron `app: MISSING`, esperado porque App Check no fue configurado ni exigido. Activar enforcement antes de entregar tokens válidos podría bloquear a todos los usuarios administrativos. No se cambió código, Firebase Console ni producción.

### Propuesta de migración de medios anteriores — no ejecutada

1. Hacer inventario de solo lectura y conservar un manifiesto local con ID/documento, UID, `storagePath`, MIME/tamaño, generación de Storage y metadata existente; identificar ausencia/inconsistencia de SHA-256 sin descargar ni cambiar objetos inicialmente.
2. Solo para candidatos con documento, UID, ruta y metadata coherentes, descargar bytes a staging controlado, calcular SHA-256 localmente y comprobar MIME/longitud; preservar objeto original, UID y ruta. Investigar separadamente cualquier discrepancia y excluirla del lote.
3. Guardar copia de los bytes y metadata previa en almacenamiento de respaldo con acceso restringido; calcular hash del respaldo y del manifiesto. No publicar enlaces ni hacer públicos objetos.
4. Preparar dry-run y lote pequeño. Si se autoriza migración, un proceso privilegiado debe actualizar solo la metadata necesaria y condicionar el cambio a la generación previamente inventariada (`ifGenerationMatch`); nunca usar overwrite incondicional ni alterar UID/ruta para hacer coincidir artificialmente el registro.
5. Leer de nuevo metadata, descargar y volver a comparar SHA-256. Registrar cada resultado. Si la ruta no es `media/{documentId}` o la identidad no se puede demostrar, mantener el objeto privado y no habilitar su publicación: actualizar metadata por sí solo no hace que el código actual lo reconozca como carga nueva.
6. Reversión: restaurar metadata desde la copia solo si la generación continúa siendo la esperada; si el objeto cambió, detenerse y revisar manualmente. Conservar respaldo y auditoría; no borrar objetos durante la migración.

Cada paso de escritura necesita autorización independiente y explícita; esta propuesta no accedió a producción ni a medios productivos.

### Cambios locales, límites y veredicto

Se añadió a `storage.rules` la condición explícita `resource == null`, y se aislaron los nombres de archivos en `scripts/storage-rules.emulator.mjs`. El test nuevo de integración `scripts/media-functions.emulator.mjs` demuestra los flujos reales anteriores y deja visible la carrera concurrente. La suite no se declara verde mientras esa prueba falle.

No se ejecutó Firebase Deploy, Render Deploy, commit, push, migración ni operación productiva. No se modificaron usuarios, claims, IAM o configuración persistente de Java/CLI. El árbol ya contenía cambios locales de intervenciones anteriores, preservados.

**VEREDICTO: NO APTO.** Las Rules secuenciales y la integración del backend pasan, pero dos cargas directas simultáneas al mismo ID son aceptadas por Storage Emulator. Por ello no está demostrado el requisito de no sobrescribir bytes ni de mantener la asociación documento/objeto bajo esa carrera. No publicar Rules, Functions ni web hasta diseñar y probar una escritura atómica de objeto (por ejemplo, carga mediada por backend con precondición de generación `ifGenerationMatch=0` o mecanismo equivalente) y repetir el caso concurrente, incluyendo la verificación de que exactamente una carga puede confirmar y que los bytes/documentos no quedan inconsistentes. App Check y migración de activos antiguos permanecen como trabajos separados.

## Fase 2 — intervención 1: Storage y concurrencia multimedia (2026-11-12)

### Inspección de infraestructura — solo lectura

| Dato | Resultado |
|---|---|
| Proyecto | `radio997-d5380`, número `527560734998`. |
| Bucket esperado | `radio997-d5380.firebasestorage.app`. La consulta devolvió 404; el inventario no encontró buckets ni alternativas. No se creó ninguno. |
| Firestore | Base `(default)`, modo `FIRESTORE_NATIVE`, ubicación `nam5`. |
| Functions | Antes del cambio, `functions/index.mjs` no declaraba región y dependía del default de Firebase Functions, `us-central1`. El código local ahora fija explícitamente `us-central1` para preservar ese comportamiento. No se pudo confirmar si hay Functions desplegadas. |
| APIs observadas | Habilitadas: `storage.googleapis.com`, `storage-component.googleapis.com`, `firestore.googleapis.com`, `firebase.googleapis.com`, `firebaserules.googleapis.com`, `pubsub.googleapis.com`, `serviceusage.googleapis.com`. Deshabilitadas: `firebasestorage.googleapis.com`, `cloudfunctions.googleapis.com`, `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `eventarc.googleapis.com`, `iam.googleapis.com`. |
| Facturación | No verificable: Cloud Billing API no estaba habilitada. La creación de un nuevo bucket de Firebase Storage requiere el plan Blaze; el estado actual de vinculación a facturación queda pendiente de confirmación en Firebase Console. |
| Restricciones de ubicación | No verificables para el proyecto: Organization Policy API estaba deshabilitada. La documentación de Google lista `southamerica-west1` (Santiago) y `southamerica-east1` (São Paulo), pero no se demostró que la política del proyecto permita ambas. |

Como recomendación operativa inicial se propone `us-central1` para el bucket: conserva la región actual de Functions y queda cerca de Firestore `nam5`, donde la Function descarga y verifica el archivo completo antes de registrarlo. Esto reduce transferencias y saltos entre Storage y el backend. `southamerica-west1` podría reducir latencia de carga directa desde Bolivia, pero requeriría confirmar disponibilidad y evaluar/cambiar la región de Functions para evitar transferir los bytes entre Sudamérica y `us-central1`; Firestore seguiría en `nam5`. La decisión final debe confirmarse en la consola antes de crear el bucket. No se hizo una selección productiva ni se validó facturación o elegibilidad de región.

### Corrección local de concurrencia y arquitectura de carga

El intento inicial contra Storage Emulator confirmó que este emulador acepta dos sesiones reanudables sobre la misma ruta aun cuando se solicita `ifGenerationMatch=0`. Esa precondición, por sí sola, no sirve como evidencia de exclusión mutua dentro del Emulator.

La corrección local usa ahora dos controles complementarios:

1. `finalizeMediaUpload` acepta fases `start` y `finalize`. Al iniciar, una transacción de Firestore crea `mediaUploadReservations/{operationId}` ligada al UID, SHA-256, tipo, tamaño, nombre y texto alternativo. Una operación concurrente con el mismo ID pero payload distinto se rechaza antes de emitir una sesión de carga. El reintento de la misma operación conserva su reserva.
2. Solo después de reservar, la Function crea una sesión GCS resumible con `preconditionOpts.ifGenerationMatch: 0` y metadata de UID, ID y SHA-256. La reserva transaccional da cobertura verificable en Emulator; la precondición GCS es una segunda barrera prevista para Storage real. La respuesta callable entrega la URI de sesión al cliente para uso en memoria, no se escribe en Firestore ni en logs.
3. La Function de finalización exige una reserva coincidente, verifica UID/ID/ruta, descarga el objeto y vuelve a calcular SHA-256 antes de la transacción que crea el documento multimedia y su log. Un hash o registro conflictivo no se acepta.
4. El cliente usa `XMLHttpRequest` hacia la sesión resumible con progreso y timeout de 120 segundos; al expirar llama `abort()` para cancelar la transferencia y libera sus listeners. Los errores HTTP 401/403/404/412 reciben mensajes específicos. El cliente valida HTTPS y el host de GCS en producción, y limita la URL local al Storage Emulator en desarrollo.
5. `storage.rules` deniega toda escritura directa del cliente, incluyendo superadministradores; conserva las lecturas administrativas y públicas por visibilidad. Las Functions usan Admin SDK, no quedan sujetas a esa denegación. `firestore.rules` no se modificó.
6. La inicialización Admin fija el bucket a `MEDIA_STORAGE_BUCKET` o, en su ausencia, `${GCLOUD_PROJECT}.firebasestorage.app`; así el código no depende de una inferencia del SDK. No se introdujo configuración local con credenciales.

El Emulator no prueba que GCS real respete la precondición de generación: el bucket no existe. La prueba concurrente sí demuestra que dos payloads diferentes no pueden obtener simultáneamente sesiones aceptadas para el mismo ID, gracias a la transacción de reserva; la prueba con un mismo payload/hash puede iniciar más de una sesión y depende también de la precondición GCS para que Storage real limite la creación del objeto. La verificación en GCS real queda pendiente de habilitar Storage y requiere autorización separada. Las reservas se conservan como marcadores para impedir reutilizar IDs; esto consume un documento Firestore por operación iniciada y debe considerarse en costos/retención.

### Pruebas y validación ejecutadas

Entorno de esta ejecución: Eclipse Temurin JDK `21.0.13+9-LTS` (configurado solo en el proceso), Node `v20.18.0`, npm `10.8.2`, Firebase CLI `15.36.0`, Firebase Web SDK `11.10.0`, Firebase Admin `13.10.0`, Firebase Functions `7.4.0` y `@firebase/rules-unit-testing` `4.0.1`. Los emuladores usaron los puertos Auth `9099`, Firestore `8080`, Functions `5001` y Storage `9199`; las Rules de los harnesses se leyeron desde los archivos locales indicados.

| Suite/comando | Resultado |
|---|---|
| Firebase Emulator, comando: `npx --yes firebase-tools@15.36.0 emulators:exec --project demo-radio-rules --only auth,firestore,storage,functions "node --test --test-concurrency=1 scripts/firestore-rules.emulator.mjs scripts/storage-rules.emulator.mjs scripts/media-functions.emulator.mjs"` | **APROBADO: 25/25**; proyecto `demo-radio-rules` únicamente. |
| Firestore Rules | **17/17**; se cargó `firestore.rules` local. Incluye autorización, lecturas públicas/privadas y denegación de escrituras directas de registros multimedia. |
| Storage Rules | **2/2**; se cargó `storage.rules` local. Incluye denegación de escrituras directas/resumibles incluso para superadmin y lectura pública/privada. |
| Auth + Functions + Storage + Firestore | **6/6**; autenticación y claims de Auth Emulator, sesiones de Storage Emulator, llamadas Functions Emulator y documentos/logs Firestore Emulator. Incluye reintento/idempotencia, permisos, hash/ruta/UID, transición, compensación y dos payloads distintos concurrentes con el mismo ID; exactamente una sesión obtuvo transferencia exitosa y quedó el objeto/documento de esa operación. |
| Unit tests integrados `npm test` | **41/41**. |
| Functions aisladas (`Push-Location functions; npm test; Pop-Location`) | **9/9**. |
| `npm run typecheck` | **APROBADO**. |
| `npm run build` | **APROBADO**. |
| Oxlint dirigido a cliente, Functions y harnesses | Exit code 0; sin errores. |
| `git diff --check` | **APROBADO**, sin errores de whitespace. |

La prueba de timeout callable usa un deadline corto para forzar respuesta ambigua después de completar la transferencia al Emulator y confirma finalización/idempotencia; no es una simulación de espera real de 120 segundos. La cancelación de XHR está implementada, pero no se ejecutó una prueba de navegador que mantenga una transferencia 120 segundos y observe la cancelación en el servidor. Las fallas de Firestore/Storage siguen siendo fixtures/control de versión en el Emulator, no fallas físicas inyectadas. El Emulator mostró una advertencia de ADC presentes para servicios no emulados; todas las llamadas de esta suite se dirigieron a los puertos locales y al proyecto `demo-radio-rules`.

### APIs, habilitación y procedimiento de despliegue — no ejecutado

La creación de Storage y Functions requiere Blaze y los permisos para habilitar servicios/crear recursos, vincular facturación si no existe, desplegar Rules y administrar Functions. Las APIs indicadas como deshabilitadas pueden habilitarse, solo después de autorización y de confirmar costos/permisos, con:

```powershell
gcloud services enable firebasestorage.googleapis.com cloudfunctions.googleapis.com run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com iam.googleapis.com --project radio997-d5380
```

`storage.googleapis.com`, Firestore, Firebase, Rules y Service Usage ya figuraban habilitadas; no se ejecutó el comando. La habilitación de Cloud Build/Artifact Registry y el despliegue de Functions pueden generar costos; deben verificarse cuotas y facturación antes de continuar.

Orden propuesto, separado y con verificaciones entre pasos:

1. Confirmar Blaze, región aceptada y crear el bucket Firebase predeterminado exacto `radio997-d5380.firebasestorage.app` desde Firebase Console, con ubicación acordada. Comprobar después su existencia, proyecto, región y acceso del Admin SDK. No se recomienda crear un bucket alternativo.
2. Habilitar únicamente las APIs requeridas indicadas arriba, si aún siguen deshabilitadas.
3. Desplegar primero las dos Functions requeridas para habilitar el endpoint antes de que el nuevo cliente lo llame:

   ```powershell
   npx --yes firebase-tools@15.36.0 deploy --only functions:finalizeMediaUpload,functions:setMediaState --project radio997-d5380
   ```

4. Publicar la aplicación web en el servicio Render existente mediante su procedimiento de despliegue desde el commit aprobado. No hay un comando Render verificado para este repositorio; no ejecutar un deploy de Firebase Hosting para sustituirlo.
5. Después de confirmar que la versión nueva del frontend carga y finaliza medios, publicar exclusivamente Storage Rules:

   ```powershell
   npx --yes firebase-tools@15.36.0 deploy --only storage --project radio997-d5380
   ```

   Este paso bloquea las escrituras directas; debe coordinarse con el paso de frontend para evitar que una versión antigua del panel quede sin capacidad de carga. No usar `firebase deploy` general. No desplegar Firestore Rules, índices ni Functions adicionales.
6. Verificar con una cuenta administrativa autorizada una carga nueva, hash/bytes, registro y log, reintento, denegación de carga directa, publicación/despublicación y lectura privada/pública; verificar también los logs y rollback antes de cerrar.

Reversión: si falla el flujo nuevo, detener la publicación de más cambios, restaurar la versión frontend previa y la versión de Functions previamente registrada; inspeccionar las cargas incompletas/reservas sin borrar objetos ni registros automáticamente. No revertir Storage Rules a permisos amplios sin auditoría y autorización explícita. No ejecutar limpieza de reservas ni migración de medios en esta intervención.

### Límites, no ejecutado y veredicto

No se ejecutó `firebase deploy`, `gcloud services enable`, creación de bucket, cambio de facturación, migración, escritura productiva, deploy Render, commit ni push. No se modificaron Firestore Rules, datos, usuarios, claims, IAM, DNS ni App Check. El estado de Rules activas y de Functions desplegadas sigue sin confirmación: las APIs deshabilitadas impidieron verificarlo, y no deben inferirse del estado local.

Continúan pendientes: confirmar billing/ubicación en consola; crear bucket y habilitar APIs; verificar la precondición `ifGenerationMatch=0` contra GCS real; probar cancelación de XHR desde navegador; revisar reglas/Functions activas en producción; desplegar con autorización; y migrar medios antiguos solo con un procedimiento aprobado. App Check sigue sin habilitarse. La anterior evaluación **NO APTO** describía el fallo del flujo antiguo de escritura directa y queda superada únicamente para el nuevo flujo local contra Emulator; no constituye aprobación productiva.

**VEREDICTO: APTO CON OBSERVACIONES para continuar a revisión de despliegue; NO APTO para publicar ahora.** La concurrencia con payloads distintos quedó protegida por reserva transaccional y pasó 25/25 pruebas de Emulator. La precondición GCS real, bucket, billing, políticas de ubicación, estado productivo de Rules/Functions y la prueba de cancelación de navegador siguen sin evidencia; no se autoriza ni recomienda despliegue hasta resolverlos.

## Fase 2 — intervención 2: decisión de región y costos de Storage (2026-11-12)

### Fuentes oficiales y alcance de verificación

Se consultaron el [modelo de precios de Firebase](https://firebase.google.com/pricing), la [selección de ubicaciones de Cloud Storage for Firebase](https://firebase.google.com/docs/storage/locations), la [guía de regiones de Cloud Functions](https://firebase.google.com/docs/functions/locations), la [lista de ubicaciones de Cloud Storage](https://cloud.google.com/storage/docs/locations#available-locations), los [precios de Cloud Storage](https://cloud.google.com/storage/pricing) y la [información de facturación por proyecto](https://cloud.google.com/billing/docs/how-to/modify-project). Los importes de los servicios Google se actualizan por región y producto; esta sección distingue las cuotas oficiales consultadas de los importes variables que no se pudieron verificar para las condiciones de la cuenta.

Las dos ubicaciones existen en el catálogo público de Cloud Storage y Firebase permite seleccionar ubicaciones de Cloud Storage disponibles para nuevos buckets `*.firebasestorage.app`. Esto no demuestra elegibilidad específica del proyecto: `Organization Policy API` seguía deshabilitada y no se verificó la política de ubicación de `radio997-d5380`. Tampoco se verificó nuevamente el estado de facturación: en la inspección anterior `Cloud Billing API` estaba deshabilitada. No se habilitó ninguna API ni se cambió billing.

### Comparación de región

| Criterio | `us-central1` (Iowa) | `southamerica-west1` (Santiago) |
|---|---|---|
| Compatibilidad de Storage/Firebase | Ubicación oficial disponible para un bucket Firebase nuevo. Es una de las tres regiones de `*.firebasestorage.app` elegibles para las cuotas sin costo publicadas por Firebase. La elegibilidad específica del proyecto debe confirmarse al crear. | Ubicación oficial de Cloud Storage disponible para Firebase; no es elegible para esas cuotas sin costo. La elegibilidad específica del proyecto debe confirmarse al crear. |
| Frontend/usuarios en Bolivia | Más distancia geográfica; puede aumentar la latencia de cargas y lecturas comparada con Santiago. No se midió RTT ni tiempo de carga real desde Bolivia. | Geográficamente más cercano a Bolivia; razonablemente favorece latencia de acceso desde usuarios regionales, pero la diferencia real depende de ISP, peering y ruta. No se midió. |
| Firestore `nam5` | Región compatible con la topología norteamericana de Firestore; reduce el riesgo de una ida y vuelta intercontinental en transacciones de reserva/finalización. `nam5` sigue siendo una ubicación multirregional, no una región idéntica a Iowa. | Firestore queda en Norteamérica; cada reserva/finalización que lee o escribe Firestore cruza regiones, agregando latencia y posible transferencia de red. |
| Functions | Las Functions v2 actuales están declaradas en `us-central1`; región oficialmente soportada para 1.ª y 2.ª gen con tarifa Tier 1. Bucket y Function quedan en la misma región para iniciar sesiones, descargar/verificar bytes y cambiar metadata. | Functions `southamerica-west1` está soportada solo para 2.ª gen y es Tier 2. Para evitar el cruce bucket-Function habría que mover ambas Functions a Santiago y especificar la región también en el SDK web; Firestore `nam5` quedaría remoto. El código local actual no hace ese cambio. |
| Transferencia/costos | Los GB públicos servidos a Internet se cotizan según ubicación y destino, pero el bucket puede recibir las cuotas Firebase sin costo descritas abajo. Mantener el backend en Iowa evita trasladar hasta 10 MB por finalización entre Storage y Function. | No hay cuota sin costo Firebase para almacenamiento/descargas/operaciones de ese bucket. Si Functions permanecen en Iowa, la verificación de cada objeto cruza regiones; si se mueven a Santiago, la transacción Firestore cruza regiones. Esos componentes de red deben evaluarse en la calculadora vigente. |
| Seguridad y consistencia | La ubicación no cambia Firebase Auth, Rules, claims, SHA-256 ni la precondición de generación. Cloud Storage conserva consistencia fuerte; se mantiene un bucket regional. | Los mismos controles y consistencia. La región no corrige ni debilita las reglas. Sigue siendo un bucket regional, no una réplica multirregional. |
| Disponibilidad/operación | Cloud Functions es redundante dentro de sus zonas regionales; el bucket regional queda sujeto a la disponibilidad de su región. Se alinea con la región ya explícita en el código y simplifica soporte. | También Functions v2 regional, pero solo 2.ª gen y Tier 2; cambiar Functions exige despliegue coordinado y cambio del cliente. Sigue siendo regional. Se debe evaluar plan de recuperación independiente. |

### Cálculo comparativo de Storage y transferencia

Firebase publica para los buckets `*.firebasestorage.app` las cuotas mensuales sin costo siguientes, **solo** en `us-central1`, `us-east1` y `us-west1`: 5 GB-month almacenados, 100 GB descargados, 5.000 operaciones de carga y 50.000 operaciones de descarga. En otras ubicaciones aplica el precio regular de Cloud Storage desde el primer uso. Las cuotas se agregan según las condiciones publicadas por Firebase y pueden estar sujetas a cambios; no se asumió que la cuenta del proyecto tenga saldo promocional ni descuentos particulares.

Los escenarios de almacenamiento siguientes suponen que el promedio retenido durante todo el mes es el valor indicado, en GB-month. “Facturable” expresa volumen después de la cuota, **no dólares**:

| Promedio almacenado | `us-central1`: incluido / facturable | `southamerica-west1`: incluido / facturable |
|---:|---:|---:|
| 10 GB-month | 5 / 5 GB-month | 0 / 10 GB-month |
| 50 GB-month | 5 / 45 GB-month | 0 / 50 GB-month |
| 100 GB-month | 5 / 95 GB-month | 0 / 100 GB-month |

Escenarios de descarga a clientes por mes (1 TB se define aquí como 1.000 GB decimales):

| Descarga mensual | `us-central1`: cuota / volumen facturable | `southamerica-west1`: cuota / volumen facturable |
|---:|---:|---:|
| 500 GB | 100 / 400 GB | 0 / 500 GB |
| 1 TB (1.000 GB) | 100 / 900 GB | 0 / 1.000 GB |

El costo en USD debe calcularse como `GB-month facturables × tarifa Standard regional de Storage` más `GB de salida facturables × tarifa de transferencia aplicable al destino Bolivia`, más cargos de operaciones. Para Santiago se usan los volúmenes íntegros al no haber cuota Firebase sin costo. No se incluye la transferencia interna entre bucket y Function ni el tráfico de Firestore, que dependen de la arquitectura/región elegida. No se presentan importes en USD porque la página oficial remite los precios efectivos del bucket nuevo a las tablas regionales de Cloud Storage y la tarifa de salida depende también del destino/tipo de transferencia; no se pudo verificar en esta revisión una tarifa vigente única aplicable al bucket y a los usuarios de Bolivia. No se aplican los precios publicados para buckets heredados `*.appspot.com` a este bucket nuevo.

Los cargos de operaciones dependen del número y clase de llamadas (por ejemplo, creación de sesión, carga de objeto, lectura/descarga, metadatos y listados), no solo del tamaño almacenado o descargado. Sin cantidad mensual de cargas, lecturas/listados y objetos no existe una cifra completa de operaciones. Para el bucket US, los primeros 5.000 uploads y 50.000 downloads/mes quedan dentro de las cuotas listadas; en Santiago se aplican las tarifas de operaciones GCS desde el inicio. La Function agrega sus invocaciones, tiempo CPU/memoria, red saliente, Cloud Build, Artifact Registry y Cloud Logging; Functions tiene cuotas sin costo y precios que varían por región, pero no se calculan aquí sin tasa de llamadas, duración/recursos, volúmenes cruzados y precios vigentes por SKU.

### Decisión recomendada

**Recomendación definitiva para el primer bucket: `us-central1`**, manteniendo Firestore en `nam5` y ambas Functions en `us-central1`.

La decisión no se basa solo en la distancia al usuario. Considera que:

1. Este bucket nuevo recibe las cuotas Firebase publicadas para almacenamiento, descargas y operaciones; `southamerica-west1` no.
2. Las Functions locales ya están configuradas en Iowa y hacen operaciones de Storage y Firestore durante carga/finalización. Mantener Storage/Functions juntas evita una transferencia regional de los bytes al calcular SHA-256.
3. Firestore permanece en `nam5`; trasladar Functions a Santiago intercambiaría el cruce Storage-Function por cruces de cada reserva/transacción con Firestore y añade tarifa Tier 2 para Functions v2.
4. Santiago puede ofrecer mejor latencia para Bolivia, especialmente en lectura pública de medios; sin mediciones de red/ISP ni coste de egress comparable no hay evidencia suficiente de que esa ganancia compense perder cuotas y dispersar el backend.
5. La elección de región de un bucket es irreversible por configuración normal. No crear hasta que el propietario confirme billing, política de ubicación y entienda el costo si el consumo excede las cuotas.

Este es el lugar recomendado para iniciar el servicio bajo el patrón de uso y código actuales; no garantiza que sea el costo mínimo para 500 GB–1 TB de tráfico a Bolivia. Antes de superar el nivel de prueba, cargar mediciones de consumo/rutas reales en Google Cloud Pricing Calculator y comparar la tarifa efectiva de salida Iowa→Bolivia frente a Santiago→Bolivia. Si la latencia pública es crítica, medir descargas desde los ISP principales antes de reconsiderar región o una estrategia de CDN. No se recomienda mover Functions a Santiago sin una migración coordinada y estimación de Firestore interregional.

### Requisitos, APIs y costos adicionales

Firebase Storage nuevo requiere proyecto asociado al plan Blaze/pago por uso, método/cuenta de facturación válida y permisos para provisionar el bucket. El estado de billing actual no se pudo consultar. El bucket debe crearse desde Firebase Console con el nombre requerido y la ubicación elegida; su ubicación no podrá cambiarse después. Para desplegar Functions de segunda generación se requiere facturación Blaze y permisos de despliegue sobre Functions, Cloud Run, IAM/Service Accounts, Eventarc, Artifact Registry y Cloud Build, además de habilitar los servicios necesarios. Con base en la inspección previa de solo lectura, se requiere revisar/habilitar antes de desplegar:

- `firebasestorage.googleapis.com`
- `cloudfunctions.googleapis.com`
- `run.googleapis.com`
- `artifactregistry.googleapis.com`
- `cloudbuild.googleapis.com`
- `eventarc.googleapis.com`
- `iam.googleapis.com`

`storage.googleapis.com`, `firestore.googleapis.com`, `firebase.googleapis.com`, `firebaserules.googleapis.com` y `serviceusage.googleapis.com` figuraban habilitadas. Volver a consultar estado antes de cualquier cambio; no ejecutar habilitaciones en esta intervención. Costos adicionales posibles: almacenamiento y operaciones GCS, descarga a usuarios, transferencia interregional de Storage/Functions/Firestore, ejecución de Functions/Cloud Run, builds e imágenes Artifact Registry, Cloud Logging y lecturas/escrituras Firestore de las reservas. Las cuotas de nivel gratuito no equivalen a precio garantizado ni eliminan los costos después de agotarse.

### Validación final de concurrencia

Se repitió la suite completa con Firebase CLI `15.36.0` en JDK 21 temporal y el proyecto `demo-radio-rules`:

```powershell
npx --yes firebase-tools@15.36.0 emulators:exec --project demo-radio-rules --only auth,firestore,storage,functions "node --test --test-concurrency=1 scripts/firestore-rules.emulator.mjs scripts/storage-rules.emulator.mjs scripts/media-functions.emulator.mjs"
```

Resultado real: **25/25 aprobadas** — Firestore Rules 17/17, Storage Rules 2/2 e integración Auth + Functions + Storage + Firestore 6/6. Incluye la prueba concurrente de dos payloads diferentes bajo el mismo ID: solo una reserva obtiene una transferencia confirmada en Emulator; se comprueban bytes y registro coherente. No se modificó código en esta intervención. Esta prueba no valida la precondición de generación contra GCS real, ni demuestra costos/latencia de producción, porque el bucket no existe.

### Siguiente etapa — comandos propuestos, no ejecutados

Primero confirmar facturación Blaze, ubicación permitida por política y aceptación de costos; después crear el bucket predeterminado desde Firebase Console en `us-central1` y verificar su nombre/ubicación. Actualizar la lista de APIs contra el estado vigente; con aprobación, habilitar únicamente las que falten:

```powershell
gcloud services enable firebasestorage.googleapis.com cloudfunctions.googleapis.com run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com eventarc.googleapis.com iam.googleapis.com --project radio997-d5380
```

Luego publicar solo las dos Functions multimedia:

```powershell
npx --yes firebase-tools@15.36.0 deploy --only functions:finalizeMediaUpload,functions:setMediaState --project radio997-d5380
```

Tras desplegar Functions y actualizar Render a la versión que usa sesiones de carga, publicar exclusivamente Storage Rules, coordinando el bloqueo de escrituras directas para no dejar activo el frontend antiguo:

```powershell
npx --yes firebase-tools@15.36.0 deploy --only storage --project radio997-d5380
```

No usar `firebase deploy` general. No desplegar Firestore Rules ni índices. Verificar el flujo con una cuenta autorizada y revisar costos/operaciones antes de carga real. Ninguno de los comandos fue ejecutado.

### Estado final

No se creó bucket, no se habilitaron APIs, no se modificó facturación ni recursos/datos productivos; no se desplegó Rules, Functions o Render, no se migraron medios y no se hizo commit/push. No se midió latencia desde Bolivia ni se pudo confirmar políticas de ubicación o billing del proyecto.

**DECISIÓN RECOMENDADA: `us-central1` para Storage, manteniendo Firestore `nam5` y Functions v2 `us-central1`.** Es la opción mejor sustentada para la arquitectura actual por cuotas Firebase, proximidad entre backend y almacenamiento, menor dispersión hacia Firestore y simplicidad operativa. La decisión es recomendación de configuración, no autorización para provisionar: confirmar billing/ubicación y estimar egress real antes de crear el bucket.

## Intervención de habilitación de Firebase Storage en producción

### Verificaciones previas

- Proyecto activo confirmado: `radio997-d5380`, número `527560734998`.
- Facturación Blaze reportada como habilitada y vinculada; no se modificó.
- La cuenta activa tiene un vínculo directo `roles/owner` en el proyecto.
- La política efectiva de ubicaciones consultada previamente no excluía `us-central1`.
- El bucket exacto `radio997-d5380.firebasestorage.app` no existía antes de la intervención (404).
- Las siete APIs autorizadas estaban deshabilitadas y disponibles para habilitación.

### Cambios realizados y resultado

Se habilitaron únicamente las siete APIs expresamente autorizadas:

```text
firebasestorage.googleapis.com
cloudfunctions.googleapis.com
run.googleapis.com
artifactregistry.googleapis.com
cloudbuild.googleapis.com
eventarc.googleapis.com
iam.googleapis.com
```

La verificación posterior confirma que las siete aparecen habilitadas. Habilitar APIs no crea por sí solo recursos facturables; el uso posterior de Storage, Functions/Cloud Run, Cloud Build, Artifact Registry y otros servicios puede generar cargos según consumo.

La creación del bucket exacto se intentó en `us-central1`, con clase `STANDARD`, acceso uniforme a nivel de bucket y prevención de acceso público. Google Cloud rechazó la operación con HTTP 403 indicando que otra cuenta reclama el dominio `radio997-d5380.firebasestorage.app`. Una comprobación posterior volvió a obtener 404 para el bucket en este proyecto; el inventario del proyecto no muestra buckets. No se creó un bucket alternativo.

### Límites y estado de seguridad

- El bucket no está provisionado, por lo que su ubicación y controles de acceso no se pudieron verificar como configuración creada.
- La solicitud fallida no creó recursos de almacenamiento ni objetos.
- No se ejecutó ningún despliegue de Firestore Rules, Storage Rules, Functions o Render; no se ejecutaron migraciones ni se crearon documentos/archivos de prueba.
- No se modificaron las Rules ni la facturación. La lectura directa de metadatos de releases de Firebase Rules recibió HTTP 403, así que el estado activo de Rules no se pudo volver a inspeccionar por esa API; la confirmación de no modificación corresponde a que no se ejecutó operación de escritura/despliegue.
- No se modificaron otros buckets.

### Bloqueo y siguiente paso requerido

La creación queda bloqueada hasta resolver la reclamación global del nombre. No intentar crear un bucket alternativo ni verificar un dominio por cuenta propia como atajo. El propietario del dominio/cuenta debe investigar la titularidad indicada por Google y, tras resolverla, volver a verificar el nombre y crear el bucket predeterminado desde el flujo de Firebase Storage. Después se deben comprobar nombre, región, prevención de acceso público y asociación con Firebase antes de desplegar Rules o Functions.

**Resultado de esta intervención:** APIs habilitadas; bucket no creado; ningún despliegue ni cambio de facturación realizado.

## Verificación posterior a la creación manual de Firebase Storage

Verificación de solo lectura realizada el 2026-11-12. Esta sección actualiza el estado de la intervención anterior: Firebase Console creó después el bucket predeterminado.

### Bucket y asociación con Firebase

Cloud Storage identifica `radio997-d5380.firebasestorage.app` dentro del proyecto consultado `radio997-d5380` (número `527560734998`), región `US-CENTRAL1`, tipo `region`. La metadata del bucket indica clase de almacenamiento `REGIONAL`, acceso uniforme a nivel de bucket **desactivado** y prevención de acceso público `inherited`. No hay una propiedad `cors` configurada en la respuesta del bucket. La ACL de bucket contiene únicamente los grupos de propietarios, editores y lectores del proyecto; no contiene `allUsers` ni `allAuthenticatedUsers`.

Firebase CLI identifica `radio997-d5380` como proyecto Firebase y muestra la etiqueta `firebase/storage-default-bucket=created`. La API Firebase Rules muestra además el release de Storage llamado `projects/radio997-d5380/releases/firebase.storage/radio997-d5380.firebasestorage.app`, asociado al mismo nombre de bucket. En conjunto, la metadata Firebase y el bucket listado por Google Cloud corresponden al bucket predeterminado esperado.

Las siete APIs autorizadas se verificaron habilitadas: `firebasestorage.googleapis.com`, `cloudfunctions.googleapis.com`, `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `eventarc.googleapis.com` e `iam.googleapis.com`. No se habilitaron APIs adicionales en esta intervención.

**Observación de seguridad:** no hay ACL pública, pero el acceso uniforme está desactivado y la prevención de acceso público aparece como `inherited`, no como una imposición explícita a nivel de bucket. La consulta de Organization Policy no pudo completarse porque `orgpolicy.googleapis.com` está deshabilitada; no se habilitó para esta verificación. Se debe revisar la política efectiva y decidir sobre UBLA/PAP antes de producción, en una intervención autorizada aparte.

### Storage Rules activas frente a las locales

Se leyó el release activo de Firebase Storage (`ruleset 68c627fb-2203-4205-91a3-f4875b857ad8`). Su contenido actual deniega todas las lecturas y escrituras. No coincide con [`storage.rules`](../storage.rules):

- Las Rules locales permiten leer medios con `visibility == 'public'` y permiten lectura autenticada a superadministradores que tengan `email_verified == true` y `superadmin == true`.
- Las Rules locales deniegan **todas** las escrituras directas desde clientes, incluidos superadministradores; por ello las cargas deben pasar por Functions, que exige superadministrador con correo verificado y valida UID, ruta, hash, tamaño, reserva e integridad.
- El release activo también deniega todas las escrituras, pero deniega además las lecturas públicas y administrativas permitidas localmente.

El release activo es restrictivo, pero no corresponde a la política local y puede impedir las lecturas de medios desde el cliente. No se modificaron ni desplegaron Rules.

### Functions y frontend

[`functions/index.mjs`](../functions/index.mjs) inicializa Admin Storage con `MEDIA_STORAGE_BUCKET` si está configurado; si no, usa `${GCLOUD_PROJECT}.firebasestorage.app`, que para este proyecto produce el bucket verificado. `finalizeMediaUpload` y `setMediaState` están declaradas explícitamente en `us-central1`. El código de operaciones exige identidad superadministradora verificada y usa reserva transaccional, sesión resumible con `ifGenerationMatch: 0`, ruta `media/<UUID>` y comprobación SHA-256 antes de registrar/publicar.

La aplicación local obtiene el bucket exclusivamente de `VITE_FIREBASE_STORAGE_BUCKET`. En este entorno no hay archivo `.env` local de producción y la variable de proceso no está definida; `.env.example` la deja vacía. Por eso el build local comprobado no puede considerarse configurado para producción. `node scripts/check-production-config.mjs radio997-d5380` falló correctamente indicando que faltan las seis variables obligatorias de Firebase; no se imprimieron valores de credenciales.

Render respondió HTTP 200 y sirvió el entry asset `index-DMZJ82k_.js`. Se inspeccionaron los 29 assets JavaScript referenciados por ese bundle y no se encontraron los marcadores `finalizeMediaUpload`, `setMediaState` ni `createResumableUpload`. El build local actualizado genera `index-DwYNaUJC.js` y contiene los marcadores de las Functions multimedia en los chunks de administración/medios. Esto confirma que Render aún sirve la versión anterior de frontend.

### Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm test` | **41/41 aprobadas** |
| `npm --prefix functions test` | **9/9 aprobadas** |
| Firestore Rules Emulator | **17/17 aprobadas** |
| Storage Rules Emulator | **2/2 aprobadas** |
| Integración Auth + Functions + Firestore + Storage Emulator | **6/6 aprobadas** |
| Suite completa de emuladores | **25/25 aprobadas**; incluye concurrencia y coherencia de bytes/hash/registro |
| `npm run typecheck` | Aprobado |
| `npm run build` | Aprobado; Vite generó el bundle local actualizado |
| `npm run lint` (Oxlint) | Exit code 0; reportó advertencias de React/hooks ya existentes |
| `npm run lint -- --deny-warnings` | No aprobado: las advertencias existentes se elevan a error; no se cambiaron archivos ajenos a esta tarea |
| `git diff --check` | Aprobado |
| `node scripts/check-production-config.mjs radio997-d5380` | No aprobado: faltan las variables de configuración de producción; bloqueo esperado en este entorno |

La suite de emuladores se ejecutó en el proyecto ficticio `demo-radio-rules` con JDK 21; no creó datos de producción.

### Procedimiento preparado; no ejecutado

Orden recomendado: (1) revisar UBLA/PAP/CORS y aprobar las Rules locales que reemplazarían el release deny-all; (2) configurar/verificar el entorno de build de Render con el bucket exacto y los valores de la aplicación Firebase; (3) desplegar solo las dos Functions; (4) desplegar solo Storage Rules; (5) publicar el frontend nuevo en Render y hacer pruebas con usuarios autorizados. No continuar a publicación del frontend si la configuración de producción está incompleta o si las Rules aprobadas no permiten la lectura de medios requerida.

Desplegar exclusivamente las Functions multimedia:

```powershell
npx --yes firebase-tools@15.36.0 deploy --only functions:finalizeMediaUpload,functions:setMediaState --project radio997-d5380
```

Publicar exclusivamente Storage Rules, luego de aprobarlas:

```powershell
npx --yes firebase-tools@15.36.0 deploy --only storage --project radio997-d5380
```

Para Render, revisar en el Dashboard las variables `VITE_FIREBASE_PROJECT_ID=radio997-d5380`, `VITE_FIREBASE_STORAGE_BUCKET=radio997-d5380.firebasestorage.app`, las demás variables de la app web Firebase, `VITE_USE_FIREBASE_EMULATORS=false` y `VITE_SITE_URL` igual al origen canónico HTTPS. Después de que el commit autorizado llegue a la rama conectada, ejecutar **Manual Deploy → Deploy latest commit** en el Static Site existente `radiocontinental99-7`, cuyo `render.yaml` publica `dist` mediante `npm ci --include=dev && npm run deploy:prepare`. Verificar los markers de Functions en los nuevos assets y el flujo de medios; no desplegar Firebase Hosting.

No se ejecutaron los dos comandos de Firebase ni se solicitó un deploy de Render. No se subieron archivos ni se crearon documentos de producción, no se modificaron Firestore Rules, no se migraron medios y no se hizo commit/push.

## Auditoría final de seguridad y preparación de despliegue multimedia

Revisión de solo lectura y suites locales repetidas el 2026-11-12. Ninguna sección de este plan autoriza cambios productivos; no se modificaron UBLA, ACL, CORS, Rules, Functions, Render ni datos.

### UBLA y dependencias de ACL

- El bucket reporta `uniform_bucket_level_access=false`. El inventario actual del bucket contiene **0 objetos**.
- La ACL de bucket contiene únicamente los grupos de proyecto de owners, editors y viewers; no se observaron grants `allUsers` ni `allAuthenticatedUsers`.
- La búsqueda del código de aplicación, Functions y scripts no encontró operaciones de ACL (`makePublic`, `makePrivate`, `acl`, `predefinedAcl`, etc.). El navegador usa Firebase SDK + Firebase Storage Rules; las Functions usan Admin SDK/Google credentials, cuyo acceso debe concederse mediante IAM. No se encontró un proceso actual ni objeto que dependa de ACL por objeto.
- La documentación oficial diferencia las solicitudes Firebase SDK, autorizadas por Firebase Authentication/Storage Rules, de operaciones directas con Google Cloud Storage, que usan IAM/ACL. El patrón local no hace llamadas GCS desde el navegador que dependan de ACL. En principio, UBLA es compatible con el flujo implementado si la cuenta de ejecución de Functions dispone de los permisos IAM de objeto necesarios y no se introduce un cliente GCS externo dependiente de ACL.
- Riesgo irreversible: Cloud Storage desactiva ACL al activar UBLA; después de 90 días consecutivos no se puede volver a desactivarlo. Aunque no hay objetos ni dependencia ACL hallada, antes de aplicarlo hay que confirmar el IAM efectivo del service account que ejecutará las Functions y conservar el estado actual. No se activó UBLA.

Comando preparado, **no ejecutado**:

```powershell
gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --uniform-bucket-level-access --project radio997-d5380
```

Reversa posible solo antes de completar 90 días (confirmar que ninguna dependencia ACL haya aparecido):

```powershell
gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --no-uniform-bucket-level-access --project radio997-d5380
```

Fuentes oficiales: [Firebase Storage y Google Cloud](https://firebase.google.com/docs/storage/gcp-integration) y [Uniform bucket-level access](https://cloud.google.com/storage/docs/uniform-bucket-level-access).

### Storage Rules y alineación con Firestore

El archivo local [`storage.rules`](../storage.rules) completo:

- Reconoce un superadministrador solo cuando hay sesión, `email_verified == true` y `superadmin == true`.
- En `media/{fileName}`, permite lectura al superadministrador verificado o si metadata `visibility == 'public'`.
- Deniega toda escritura en esa ruta; la regla catch-all deniega lectura/escritura en el resto del bucket. Así no se permiten cargas, sobrescrituras, cambios de metadata ni borrados directos por clientes, incluidos superadministradores.
- La ruta real de archivos nuevos es exactamente `media/<UUIDv4>` y el documento asociado es `media/<mismo UUID>`. Finalización valida UID/ruta/reserva y SHA-256 antes de crear el documento; el estado multimedia valida el objeto y su ruta antes de cambiar metadata/Firestore. `firestore.rules` además limita `storagePath` a `media/<segmento>`.
- El cliente lee medios privados con cuenta superadministradora y medios públicos mediante `getBlob`. Los cambios de estado solo se realizan a través de `setMediaState`.

El release activo de producción se verificó otra vez: actualmente deniega **todas** las lecturas y escrituras. No coincide con las reglas locales. Esto mantiene bloqueadas las escrituras directas, pero también bloquea las lecturas públicas y administrativas de Storage. No se publicó ninguna regla.

Casos de prueba de permisos para exigir antes/después de publicar reglas:

| Caso | Resultado esperado con reglas locales |
|---|---|
| Anónimo lee objeto con `visibility=public` en `media/<id>` | Permitir |
| Anónimo lee objeto privado | Denegar |
| Superadministrador con correo verificado lee objeto privado/público | Permitir |
| Editor, usuario ordinario o superadministrador no verificado lee objeto privado | Denegar |
| Cualquier usuario cliente intenta upload directo, incluido upload resumible | Denegar |
| Cliente intenta sobreescribir objeto, cambiar metadata o borrar | Denegar |
| Cualquier cliente lee/escribe fuera de `media/` | Denegar |
| Objeto y documento/media ID/ruta/metadata no coinciden | Finalización/Functions deben denegar o no registrar |
| Hash, UID, UUID o propietario no coincide | Functions deben denegar y no registrar |

La suite Storage Rules actual cubre lectura pública/privada, lectura superadmin, y denegación de upload, overwrite, metadata update y delete; no tiene casos separados para editor y claim superadmin no verificado. La suite Functions/integración cubre autenticación, verificación, rol, UID, hash, colisiones y ruta. Añadir los dos casos de Rules indicados a la matriz de Emulator antes de considerar completa la cobertura sería recomendable; no se alteraron pruebas ni reglas en esta intervención.

Límite de consistencia a considerar: Storage Rules autorizan lectura pública por metadata `visibility`, no consultando el estado del documento Firestore. `setMediaState` cambia primero la metadata de Storage y después hace la transacción Firestore, con compensación a privado si falla. Hay una ventana breve en la que el objeto puede ser legible antes de que Firestore confirme `published`; si la transacción y la compensación fallan, la Function devuelve error, pero hace falta intervención para comprobar el estado real. Las pruebas verifican el resultado final/compensación, no ausencia de esa ventana temporal. No se publicó ni cambió el código.

### CORS y protocolo real del cliente

El flujo usa ambos servicios, con roles distintos:

1. Firebase Storage SDK: el cliente consulta metadata y verifica bytes mediante `getMetadata()` y `getBlob()` en el host de Firebase Storage. La documentación de Firebase indica expresamente que `getBlob()` en navegador requiere configurar CORS en el bucket.
2. Cloud Functions callable: el cliente solicita una URL/sesión a `finalizeMediaUpload` (acción `start`); esta llamada no es una carga al bucket ni se autoriza mediante su CORS.
3. Sesión resumible GCS: el Admin SDK crea la sesión y el navegador hace `PUT` directo a la URL de `storage.googleapis.com`, con `Content-Type` y `Content-Range`. Por método y encabezados no simples, el navegador debe hacer preflight `OPTIONS`.
4. Finalización vuelve a invocar la callable `finalizeMediaUpload` para validar bytes/hash y crear el documento. `setMediaState` también es una callable, no una operación cliente directa al bucket.

Por tanto, sí hay evidencia en código y en documentación oficial para preparar CORS de bucket. No se envió una petición OPTIONS productiva ni se cambió CORS. La metadata del bucket no informa una configuración CORS activa.

La aplicación canónica es `https://continental997.fm`. `https://www.continental997.fm` redirige al apex y no necesita su propia entrada si el redirect se conserva. Render actualmente sirve desde `https://radiocontinental99-7.onrender.com`; incluirlo temporalmente evita bloquear llamadas del panel si se accede por ese host. CORS candidato, **archivo de preparación solamente**, sin wildcard:

```json
[
  {
    "origin": [
      "https://continental997.fm",
      "https://radiocontinental99-7.onrender.com"
    ],
    "method": ["GET", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

`GET` corresponde a metadata/lectura directa (`getMetadata`, `getBlob`); `PUT` corresponde a la transferencia resumible personalizada. `OPTIONS` es el preflight que el servicio debe responder, no un método de aplicación que se agrega a la lista. Los encabezados solicitados que se deben observar en `Access-Control-Request-Headers` son los de Firebase SDK (`Authorization`, `X-Firebase-Storage-Version`, `X-Firebase-GMPID`, opcional `X-Firebase-AppCheck`) y, para el PUT resumible, `Content-Type` y `Content-Range`. La configuración CORS de GCS no contiene una propiedad configurable `allowedHeaders`; la comprobación es que la respuesta del preflight autorice los headers solicitados. No se agrega `responseHeader` porque el cliente no lee headers de respuesta personalizados.

Comando preparado, no ejecutado:

```powershell
gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --cors-file=cors.json --project radio997-d5380
```

Prueba de navegador para una futura ventana autorizada: en DevTools → Network, cargar la app canónica y abrir un medio público debe mostrar `GET` exitoso; una cuenta superadministradora verificada debe poder cargar la biblioteca privada. Al iniciar una carga de prueba autorizada, observar `OPTIONS` seguido de `PUT` contra la URL de sesión y verificar origen, método y encabezados en la preflight; luego verificar éxito HTTP de PUT, callable de finalización, documento `media/<UUID>` y metadata/hash coincidentes. No ejecutar hasta contar con autorización explícita para subir un objeto productivo; no se hizo esa prueba en esta intervención.

Fuente oficial: [Firebase Storage direct downloads y CORS](https://firebase.google.com/docs/storage/web/download-files#cors_configuration) y [Cloud Storage CORS](https://cloud.google.com/storage/docs/cross-origin).

### Render y Functions

En el entorno local no están presentes las ocho variables requeridas para producción:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_SITE_URL
VITE_USE_FIREBASE_EMULATORS
```

No hay archivos `.env`, `.env.local`, `.env.production` ni `.env.production.local`; no se mostraron valores. La variable de emuladores debe definirse como `false`, no dejarse habilitada.

No hay acceso autenticado al dashboard de Render para consultar sus variables. La versión pública continúa anterior: el bundle servido no contiene identificadores de proyecto/bucket ni los marcadores `finalizeMediaUpload`, `setMediaState` o `createResumableUpload`; el build local sí contiene la implementación multimedia, aunque no se puede certificar como build productivo por falta de variables. No se modificaron variables de Render.

El Static Site existente está descrito por [`render.yaml`](../render.yaml): publica `dist`, con build `npm ci --include=dev && npm run deploy:prepare`. El script valida configuración para el proyecto/origen canónico, compila y genera sitemap que requiere acceso público a Firestore; ejecutar el build exige que esas dependencias/configuración estén preparadas.

[`functions/index.mjs`](../functions/index.mjs) declara ambas Functions en `us-central1` y selecciona `MEDIA_STORAGE_BUCKET` o `${GCLOUD_PROJECT}.firebasestorage.app`. Con `GCLOUD_PROJECT=radio997-d5380` y sin override, selecciona el bucket verificado. [`functions/src/media-operations.mjs`](../functions/src/media-operations.mjs) comprueba superadmin y correo verificado, reserva transaccional de ID/payload, UID/ruta, UUIDv4, tamaño/tipo y SHA-256; crea sesión resumible con `ifGenerationMatch: 0`, revalida bytes del objeto antes de registrar, hace finalización/idempotencia y compensa metadata a privado ante fallo de transacción al cambiar estado. El objeto Firestore es `media/<operationId>`, el Storage path `media/<operationId>` y el log `adminLogs/media-<operationId>`.

La lista de Functions de producción está vacía; no hay `finalizeMediaUpload` ni `setMediaState` desplegadas. Comando preparado para desplegar exclusivamente las dos:

```powershell
npx --yes firebase-tools@15.36.0 deploy --only functions:finalizeMediaUpload,functions:setMediaState --project radio997-d5380
```

### Pruebas ejecutadas en esta intervención

| Comprobación | Resultado |
|---|---|
| `npm test` | **41/41 aprobadas** |
| `npm --prefix functions test` | **9/9 aprobadas** |
| Firestore Rules Emulator | **17/17 aprobadas** |
| Storage Rules Emulator | **2/2 aprobadas** |
| Integración Auth + Functions + Firestore + Storage Emulator | **6/6 aprobadas** |
| Suite completa Emulator | **25/25 aprobadas**; incluye concurrencia y retries/idempotencia |
| `npm run typecheck` | Aprobado |
| `npm run build` | Aprobado |
| `npm run lint` (Oxlint) | Exit code 0; imprime advertencias React/hooks preexistentes |
| `git diff --check` | Aprobado |

Las pruebas usan solo `demo-radio-rules` y emuladores locales; no validan UBLA, CORS, IAM de runtime, Rules activas, Functions productivas, variables del dashboard ni la operación real en el bucket. No se marcó ninguna de esas comprobaciones como probada.

### Orden de despliegue propuesto y reversión

El orden necesario para evitar exponer una interfaz nueva sin backend/reglas es:

1. **Infraestructura (aprobación separada):** guardar metadata actual y CORS vacío, confirmar permisos del service account de Functions, activar UBLA solo tras aceptar su ventana irreversible de 90 días, y aplicar/validar CORS propuesto. No tocar ACL manualmente, Firestore Rules ni datos.
2. **Functions:** desplegar solo `finalizeMediaUpload` y `setMediaState`; revisar estado/región en consola y confirmar que ambas usan el bucket default. El inventario actual está vacío, por lo que no hay endpoints productivos anteriores a los que hacer rollback. Ante fallo, no publicar el frontend; corregir y redesplegar la versión validada.
3. **Storage Rules:** publicar solo `storage.rules` local después de aprobación, restaurando lecturas pública/admin mientras mantiene `allow write: if false`. Hasta que llegue el frontend nuevo, cualquier cliente antiguo que intente escritura directa seguirá denegado (igual que con el release actual deny-all).
4. **Frontend Render:** configurar en el servicio existente las seis variables `VITE_FIREBASE_*` con valores de la app web correcta, `VITE_SITE_URL=https://continental997.fm`, `VITE_USE_FIREBASE_EMULATORS=false`; revisar que las variables estén presentes sin registrarlas en logs, y hacer Manual Deploy del commit/build aprobado en Static Site `radiocontinental99-7`. No usar Firebase Hosting. La UI nueva depende de los dos callables y del nuevo flujo.
5. **Pruebas funcionales productivas (aprobación explícita de carga):** revisar OPTIONS/GET/PUT y los headers permitidos; usar un objeto pequeño autorizado y un superadmin verificado; completar sesión, verificar hash y documento, probar lectura pública/privada y cambios publish/unpublish/archive; archivar/limpiar el objeto de prueba según el procedimiento aprobado. Si cualquier etapa falla, parar nuevas cargas y preservar evidencia sin exponer tokens/URL de sesión.

Reversiones preparadas:

- **CORS:** restaurar el archivo de CORS anterior (actualmente vacío) con `gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --clear-cors --project radio997-d5380`; esto puede volver a romper `getBlob` desde navegador.
- **UBLA:** dentro de los primeros 90 días, evaluar y usar `--no-uniform-bucket-level-access`; después de 90 días consecutivos no es reversible. No cambiar ACL para simular una reversión.
- **Functions:** como no hay versión anterior desplegada, evitar borrar endpoints automáticamente. Si fallan antes de publicar frontend, mantener el deploy de frontend detenido; corregir y redesplegar ambas desde código revisado. Si ya hay frontend nuevo, revertir primero Render para evitar llamadas incompatibles.
- **Storage Rules:** restaurar la fuente deny-all activa guardada solo ante incidente de seguridad, entendiendo que bloquea toda lectura de medios. Coordinar con rollback de Render y no usarla como rollback normal del frontend.
- **Render:** desde el Dashboard del Static Site, volver al deploy anterior conocido; validar nuevamente assets. El bundle anterior no soporta las Functions ni carga resumible y las Rules actuales niegan writes directos, así que el rollback restablece una interfaz anterior, pero no restaura capacidad de carga multimedia.

**Estado:** solo auditoría y documentación. No se cambiaron UBLA, ACL o CORS; no se publicaron Storage Rules ni Functions; no se cambiaron Firestore Rules ni Render; no se subieron objetos ni se crearon documentos; no se migraron medios y no se hizo commit/push.

## Intervención de primera publicación controlada multimedia — detenida en preflight

Revisión previa realizada el 2026-11-12. No se ejecutó ninguna escritura de producción porque el árbol contiene cambios locales funcionales sin commit y la intervención exige detenerse si hay cambios no respaldados.

### Estado comprobado

- Proyecto activo y destino confirmados: `radio997-d5380`, número `527560734998`; bucket `radio997-d5380.firebasestorage.app`, `US-CENTRAL1`.
- El bucket sigue sin CORS declarado, con UBLA desactivado; la metadata visible no se modificó.
- Inventario del bucket: **0 objetos**.
- No hay Functions desplegadas en `us-central1`. El source exporta exactamente `finalizeMediaUpload` y `setMediaState`, ambas en `us-central1`; usa `MEDIA_STORAGE_BUCKET` o `${GCLOUD_PROJECT}.firebasestorage.app`.
- La suite local volvió a pasar: `npm test` **41/41**, `npm --prefix functions test` **9/9**, Emulator completo **25/25**. Los emuladores usan exclusivamente `demo-radio-rules`.
- El commit local `05605c43f170eb5faca2a56ae96db641f6e778ef` coincide con `origin/backup/media-integration-progress`, pero hay ocho archivos modificados después de ese commit y sin respaldo remoto: `docs/AUDITORIA-INTEGRAL.md`, `functions/index.mjs`, `functions/src/media-operations.mjs`, `functions/test/media-operations.test.mjs`, `scripts/media-functions.emulator.mjs`, `scripts/storage-rules.emulator.mjs`, `src/services/media.ts` y `storage.rules`. Como Functions deploy empaquetaría código local no respaldado y las Rules también están modificadas, se detuvo antes de cualquier cambio productivo. No se hizo commit/push por la restricción expresa.
- No se pudieron confirmar permisos de un runtime service account real porque no existen Functions desplegadas. El código no fija `serviceAccount`; la identidad default prevista por Cloud Functions v2 sería la cuenta de cómputo `527560734998-compute@developer.gserviceaccount.com`, que aparece habilitada y tiene `roles/editor` en el proyecto. Ese rol es amplio; antes del deploy se debe confirmar la identidad efectiva que escogerá el despliegue y verificar los permisos requeridos de lectura/escritura de objetos en el bucket. No se cambió IAM.

### CORS preparado, no aplicado

El protocolo requiere CORS para `getBlob()` de Firebase Storage en navegador y para el `PUT` resumible GCS. El cliente hace preflight por el método `PUT` y encabezados `Content-Type` y `Content-Range`; las lecturas `GET` del SDK pueden incluir `Authorization`, `X-Firebase-Storage-Version`, `X-Firebase-GMPID` y opcionalmente `X-Firebase-AppCheck`. `OPTIONS` es el preflight que responde GCS, no un método de aplicación que se agrega al archivo CORS. El cliente no requiere headers de respuesta personalizados expuestos. No se incluyó el host de Render: el frontend publicado allí es anterior, y el origen canónico de producción es `https://continental997.fm`.

Política candidata mínima para revisar (sin archivo aplicado ni comando ejecutado):

```json
[
  {
    "origin": ["https://continental997.fm"],
    "method": ["GET", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

El archivo de configuración CORS de GCS no tiene una propiedad `allowedHeaders`; la validación debe comprobar las cabeceras solicitadas y la respuesta real del preflight. Al seguir bloqueada la intervención, no se cambió CORS ni se realizaron preflight de verificación.

Comando preparado, no ejecutado:

```powershell
gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --cors-file=cors.json --project radio997-d5380
```

La verificación OPTIONS completa deberá hacerse después de aplicar CORS y tras tener una URL de sesión resumible real; no se puede generar esa sesión de producción actualmente porque las Functions aún no están desplegadas. No se creó sesión, objeto ni documento.

### Estado de la intervención y desbloqueo

No se ejecutó `gcloud storage buckets update`, no se desplegaron Functions, Rules ni frontend; no se modificaron IAM, UBLA, ACL, CORS ni Firestore Rules. La causa de detención es el cambio local sin respaldo requerido por el preflight, junto a la falta de una identidad runtime desplegada cuya política efectiva pueda verificarse. La siguiente etapa requiere respaldar y revisar los cambios locales bajo una autorización de Git independiente, luego repetir `git status` y la comparación remota; confirmar permisos IAM efectivos de la cuenta runtime; recién entonces, con el mismo alcance de autorización de producción, aplicar CORS, verificar preflight y desplegar exclusivamente las dos Functions.

## Preflight IAM y CORS para runtime multimedia — 2026-11-12

Revisión de solo lectura y preparación de código. No se creó la cuenta de servicio, no se cambió IAM ni CORS, y no se desplegaron Functions, Storage Rules, Firestore Rules o Render.

### Respaldo y estado local

- `backup/media-integration-progress` remoto y rama local apuntaban a `9fc3079c0c2196b3e3cdfc74befa033eb0d100f4` al iniciar esta intervención.
- Ese commit remoto contiene exactamente los ocho archivos funcionales de la intervención previa: este documento, `functions/index.mjs`, `functions/src/media-operations.mjs`, `functions/test/media-operations.test.mjs`, `scripts/media-functions.emulator.mjs`, `scripts/storage-rules.emulator.mjs`, `src/services/media.ts` y `storage.rules`.
- El árbol estaba limpio y no había commits locales posteriores al empezar. Esta intervención modifica `functions/index.mjs` y este documento, por lo que ambos cambios nuevos requieren verificación y respaldo antes de cualquier despliegue.

### Identidad y matriz IAM propuesta

La cuenta propuesta `radio-media-runtime@radio997-d5380.iam.gserviceaccount.com` **no existe todavía**. La identidad de ejecución de `finalizeMediaUpload` y `setMediaState` no estaba fijada en el código. Se modificó `functions/index.mjs` para que ambas Functions declaren explícitamente esa cuenta en sus opciones. El despliegue debe esperar hasta que la cuenta y sus permisos estén creados y comprobados.

El service account predeterminado `527560734998-compute@developer.gserviceaccount.com` sí existe y tiene `roles/editor` en el proyecto; no debe usarse como runtime. La política IAM de bucket mostraba únicamente las vinculaciones legacy asociadas a grupos de proyecto, sin una concesión directa de objetos a la cuenta dedicada (aún inexistente).

| Principal/recurso | Permisos requeridos | Asignación mínima propuesta | Observación |
|---|---|---|---|
| Runtime → Firestore | `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.list`, `datastore.entities.create`, `datastore.entities.update` | Rol personalizado de proyecto `radioMediaRuntimeFirestore` con solo esos permisos | El código necesita transacciones/lecturas, consulta limitada de `media` si el contador todavía no existe, y crear/actualizar reservas, documentos multimedia, logs y contador. No necesita borrar documentos. IAM no limita esos permisos por colección dentro de la base; el rol sigue dando lectura/creación/actualización en otras colecciones de Firestore del proyecto. Si ese alcance no se acepta, aislar los datos multimedia en otra base/proyecto o interponer un servicio antes de producción. |
| Runtime → Storage | `storage.objects.create`, `storage.objects.get`, `storage.objects.update` | Rol personalizado `radioMediaRuntimeStorage`, definido en el proyecto y vinculado solo al bucket | Crear sesión/objeto, leer metadata y bytes para verificar SHA-256, y actualizar metadata `visibility`. No se propone `storage.objects.delete` ni `storage.objects.list`. |
| Runtime → logs | Ningún permiso adicional para el logging actual | Ningún rol de logging | Las Functions escriben por la salida estándar/errores capturados por la plataforma. Si en el futuro se llama directamente a Cloud Logging API, evaluar `roles/logging.logWriter` aparte. |
| Operador de despliegue → runtime SA | `iam.serviceAccounts.actAs` | `roles/iam.serviceAccountUser` vinculado al service account dedicado para la identidad operadora que despliegue | No otorgar `roles/iam.serviceAccountTokenCreator`; no se requiere impersonación para adjuntar la cuenta. El operador actualmente aparece con `roles/owner` en el proyecto, pero no se certificó el permiso efectivo sobre la cuenta propuesta. |

Se inspeccionó `roles/datastore.user`: incluye `datastore.entities.delete`, además de permisos de lista/estadísticas/namespaces y otros no necesarios. Por eso se prefiere un rol personalizado sin borrado. No se ejecutó Policy Troubleshooter: `policytroubleshooter.googleapis.com` está deshabilitada y la cuenta propuesta no existe; no se habilitó esa API. En consecuencia, la autorización efectiva `actAs` y la evaluación de políticas IAM/deny heredadas quedan pendientes de comprobar después de crear la cuenta. No se afirmará que los permisos estén verificados hasta completar esa prueba.

Procedimiento propuesto, **no ejecutado**:

```powershell
$project = "radio997-d5380"
$runtime = "radio-media-runtime@radio997-d5380.iam.gserviceaccount.com"
$bucket = "gs://radio997-d5380.firebasestorage.app"

gcloud iam service-accounts create radio-media-runtime --project=$project --display-name="Radio multimedia Functions runtime"

gcloud iam roles create radioMediaRuntimeFirestore --project=$project --title="Radio Media Runtime Firestore" --description="Lectura, consulta, creación y actualización requeridas por las Functions multimedia; sin borrado." --permissions=datastore.databases.get,datastore.entities.get,datastore.entities.list,datastore.entities.create,datastore.entities.update --stage=GA
gcloud projects add-iam-policy-binding $project --member="serviceAccount:$runtime" --role="projects/$project/roles/radioMediaRuntimeFirestore"

gcloud iam roles create radioMediaRuntimeStorage --project=$project --title="Radio Media Runtime Storage Objects" --description="Crear objetos, leer objeto/metadata y actualizar metadata del flujo multimedia." --permissions=storage.objects.create,storage.objects.get,storage.objects.update --stage=GA
gcloud storage buckets add-iam-policy-binding $bucket --member="serviceAccount:$runtime" --role="projects/$project/roles/radioMediaRuntimeStorage"

# Ejecutar como operador de despliegue, con el email real de su principal:
gcloud iam service-accounts add-iam-policy-binding $runtime --project=$project --member="user:<DEPLOYER_EMAIL>" --role="roles/iam.serviceAccountUser"

# Tras habilitar Policy Troubleshooter por autorización separada, comprobar permisos efectivos,
# incluida cualquier política condicional/deny; no inferirlos solo de bindings visibles.
gcloud policy-intelligence troubleshoot-policy iam "//storage.googleapis.com/projects/_/buckets/radio997-d5380.firebasestorage.app/objects/media/example" --principal-email=$runtime --permission=storage.objects.create --project=$project
gcloud policy-intelligence troubleshoot-policy iam "//storage.googleapis.com/projects/_/buckets/radio997-d5380.firebasestorage.app/objects/media/example" --principal-email=$runtime --permission=storage.objects.get --project=$project
gcloud policy-intelligence troubleshoot-policy iam "//storage.googleapis.com/projects/_/buckets/radio997-d5380.firebasestorage.app/objects/media/example" --principal-email=$runtime --permission=storage.objects.update --project=$project
gcloud policy-intelligence troubleshoot-policy iam "//cloudresourcemanager.googleapis.com/projects/radio997-d5380" --principal-email=$runtime --permission=datastore.entities.create --project=$project
gcloud policy-intelligence troubleshoot-policy iam "//iam.googleapis.com/projects/radio997-d5380/serviceAccounts/$runtime" --principal-email="<DEPLOYER_EMAIL>" --permission=iam.serviceAccounts.actAs --project=$project
```

Los comandos de creación/vinculación alteran IAM y requieren aprobación independiente. Antes de usarlos se debe validar que los permisos propuestos sean roles personalizados admitidos por las APIs activas, crear los roles y bindings, volver a leer sus políticas y ejecutar Troubleshooter. La política de Firestore es de alcance de proyecto y no constituye una frontera por colección.

### Política CORS preparada

La lectura actual de metadata GCS devolvió `cors_config: null`: el bucket no tiene CORS explícito. No se aplicó configuración. Archivo candidato `cors.json`:

```json
[
  {
    "origin": [
      "https://continental997.fm",
      "https://radiocontinental99-7.onrender.com"
    ],
    "method": ["GET", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

No usar comodines, no agregar `OPTIONS` (lo gestiona como preflight el navegador/GCS) ni `allowedHeaders` (no es campo de la configuración CORS de GCS). Comando pendiente de autorización:

```powershell
gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --cors-file=cors.json --project=radio997-d5380
gcloud storage buckets describe gs://radio997-d5380.firebasestorage.app --project=radio997-d5380 --format="json(cors_config)"
```

Tras desplegar las Functions, verificar OPTIONS contra la URL de sesión resumible real con ambos `Origin`, método solicitado `PUT` y encabezados `Content-Type`/`Content-Range`; revisar código HTTP y `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` y `Access-Control-Allow-Headers`. No imprimir ni guardar URLs de sesión: son credenciales portadoras. Probar también el GET de medios en navegador. No se realizaron preflights en esta intervención.

### Orden y reversión pendientes

1. Revisar/aprobar la matriz IAM; crear la identidad/roles/bindings en una intervención autorizada; comprobar permisos efectivos, especialmente `actAs`, con Troubleshooter habilitado y una cuenta existente.
2. Desplegar únicamente las dos Functions desde el commit respaldado que contiene `serviceAccount`; verificar identidad runtime en la configuración desplegada, región, runtime e inicialización.
3. Aplicar solo el CORS candidato al bucket y verificar OPTIONS/GET. Mantener Storage Rules, Firestore Rules y Render sin cambios en esta etapa.
4. En una autorización posterior, publicar Rules/frontend y ejecutar pruebas funcionales productivas con alcance aprobado.

Reversión IAM: eliminar primero los bindings de bucket/proyecto vinculados al rol personalizado, luego borrar esos roles y finalmente deshabilitar/eliminar la cuenta solo cuando no esté adjunta a Functions. Reversión CORS: restaurar la política anterior vacía con `gcloud storage buckets update gs://radio997-d5380.firebasestorage.app --clear-cors --project=radio997-d5380`. Reversión de Functions: detener el despliegue del frontend si aún no se publicó; no volver a la identidad default con `roles/editor`. No se ejecutó ninguno de estos comandos.

## Corrección de transiciones multimedia — cambios locales sin publicar

Se corrigió localmente el orden de cambios de visibilidad y se añadieron pruebas. Esta entrada conserva el historial anterior; no implica que el PR esté aprobado ni que se haya publicado código.

- Las transiciones se serializan en `mediaStateTransitions/{operationId}`, una colección privada no legible desde clientes por las reglas actuales. El documento guarda ID de operación, UID, acción, versión esperada, lease de 90 segundos, fase y resultado. No se añaden campos de transición al documento `media` que las reglas exponen en lecturas públicas.
- Para publicar, Firestore confirma primero `status=published`; recién entonces Storage puede cambiar a `visibility=public`. Si la escritura de metadata falla o su respuesta es ambigua, el código vuelve a consultar y trata de confirmar privacidad antes de compensar Firestore a borrador. Si no puede confirmar privacidad, conserva el estado ambiguo y devuelve error para recuperación.
- Para despublicar o archivar, Storage se hace privado antes de la transacción Firestore; un fallo de Firestore no restaura el acceso público. Los cambios de metadata usan `preconditionOpts.ifMetagenerationMatch`, sintaxis verificada en `@google-cloud/storage` 7.22.0 instalada. Los archivos antiguos sin SHA-256 siguen bloqueados para publicación.
- Las pruebas unitarias ahora verifican el orden Storage/Firestore, fallos de metadata/transacción/compensación, respuesta ambigua, concurrencia publicación-despublicación/archivo, recuperación tras expirar el lease, idempotencia, integridad SHA-256 y privacidad del marcador.
- Emulator comprueba el ciclo Auth/Functions/Firestore/Storage, los cambios concurrentes, la denegación de lectura cliente del marcador y la lectura pública/denegación de lectura privada.

Validaciones locales de esta intervención:

| Comando | Resultado |
|---|---|
| `npm test` | **51/51 aprobadas** |
| `npm --prefix functions test` | **19/19 aprobadas** |
| Firebase Emulator (Firestore Rules, Storage Rules, Auth, Functions e integración multimedia) | **26/26 aprobadas** |
| `npm run typecheck` | **Aprobado** |
| `npm run build` | **Aprobado** |
| `npm run lint` | **Código 0**; advertencias preexistentes en frontend, ninguna nueva en `media-state.mjs` |
| `git diff --check` | **Aprobado** antes de esta actualización documental; repetir después de cerrar el diff |

El PR #1 continúa en borrador y en `eafa968479bbeb86d2d3e9122437b6f604e2e012`; estos cambios todavía no están comprometidos ni respaldados en remoto. No se modificaron reglas, IAM, CORS, UBLA, ACL, Render ni datos productivos; no se desplegaron Functions ni Storage Rules. La clasificación completa de los 32 archivos del PR y la revisión de alcance preceden a cualquier integración o publicación.

## Revisión de alcance del PR #1

Clasificación del diff comprometido `origin/main...HEAD` (32 archivos), inspeccionado antes de integrar:

- **A — Multimedia:** `firebase.json`, `functions/index.mjs`, manifiestos de Functions, `src/lib/firebaseFunctions.ts`, `src/services/media.ts`, `src/pages/admin/AdminMediaPage.tsx` y `src/services/firebaseErrors.ts`.
- **B — Seguridad multimedia:** `functions/src/media-operations.mjs` y sus pruebas, `scripts/media-functions.emulator.mjs`, `storage.rules` y sus pruebas, las restricciones de escritura directa de medios en `firestore.rules` y sus pruebas, y las rutas protegidas de medios en `src/services/content.ts`.
- **C — Seguridad administrativa independiente:** `scripts/admin-access.mjs` y sus pruebas; suspensión/reactivación y validación de auditoría en `firestore.rules` y `scripts/firestore-rules.emulator.mjs`; y el pin del proyecto productivo en `package.json` con sus pruebas. Los dos últimos archivos de reglas/pruebas contienen cambios mixtos B/C y requieren conservar solo las partes de media si se separa el alcance.
- **D — Documentación/respaldo:** `README.md`, este documento y los snapshots de índices/campos/reglas bajo `docs/backups/`. Son evidencia/documentación, no entradas de despliegue; no se deben descartar sin conservar el historial.
- **E — No necesario para esta integración:** `firestore.indexes.review.json` (no está referenciado por `firebase.json` ni agrega índices respecto de la configuración activa), el cambio de URL de acción de correo en `src/services/auth.ts`, y el cambio de logging del sitemap y su prueba.

La dependencia de Firestore es específica: las reglas impiden que clientes creen o modifiquen documentos `media`; las Cloud Functions con Admin SDK hacen la reserva y escritura confiable. No se requiere desplegar índices nuevos. El resto de políticas de suspensión/adminAccess y el pin de proyecto son independientes del flujo multimedia. La recomendación de revisión es mantener juntos A/B, separar C en un PR de seguridad administrativa y excluir E; conservar D como historial no desplegable.

Observación de seguridad de C: la suspensión se aplica en Firestore Rules, pero la autorización de las Functions y Storage Rules continúa basada en claims. Un usuario suspendido con claims aún vigentes podría seguir llamando las Functions y leyendo Storage conforme a esos claims; la suspensión no debe presentarse como revocación global inmediata. No se amplió ese mecanismo en esta intervención.

El PR queda en borrador mientras se resuelve esta separación y se revisa el cambio local de transición. No se hizo merge. IAM, CORS, Rules productivas, Render, ACL/UBLA y datos de producción siguen sin cambios.
