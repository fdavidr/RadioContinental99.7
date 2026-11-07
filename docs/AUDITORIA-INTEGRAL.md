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
| 9 | Aplicar rewrites del Static Site de Render para las rutas SPA existentes. Se añadió `render.yaml` sin regla global; rutas ajenas a los módulos listados conservan 404. Los comodines de noticias/programas/admin también reescriben slugs inexistentes dentro de esos módulos y pueden producir soft 404 HTTP 200; eliminar ese riesgo requiere prerender/SSR u otra capa de servidor, decisión fuera del alcance actual. Render debe aplicar las reglas al servicio existente. | `render.yaml`; Render Dashboard → Static Site → Redirects/Rewrites o Blueprint existente. | ME CORRESPONDE A MÍ | P0 | En proceso |
| 10 | Configurar `VITE_SITE_URL=https://continental997.fm` (sin `/` final), redeplegar y comprobar canonical, `robots.txt` y sitemap. El código ahora rechaza otro origen; el sitio público observado todavía publica URLs `onrender.com`. | Environment de Render; `scripts/site-config.mjs`, `scripts/check-production-config.mjs`, `scripts/generate-sitemap.mjs`. | ME CORRESPONDE A MÍ | P0 | En proceso |
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
| 30 | Aplicar las reglas de rewrite del manifiesto al Static Site existente sin crear un servicio duplicado. Luego desplegar y solicitar directamente `/noticias`, `/programas`, `/programacion`, `/admin`, `/admin/login` y `/admin/recuperar`; comprobar que carguen la app. | Render Dashboard; `render.yaml`. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 31 | Cambiar `VITE_SITE_URL` al dominio canónico en Render y ejecutar un deploy de producción. Confirmar build exitoso, rutas directas, canonical, `robots.txt`, sitemap y ausencia de URLs `onrender.com`. No puedo activar el deploy desde el repositorio ni acceder a tu consola. | Render → Environment / Events; dominio `continental997.fm`. | ME CORRESPONDE A MÍ | P0 | Pendiente |
| 32 | Diagnosticar el `PERMISSION_DENIED` de Firestore sin modificar reglas: confirmar proyecto y reglas desplegadas, revisar la estructura/valores reales de categorías y publicaciones, y validar la misma consulta en staging. No relajar permisos ni cambiar datos en producción sin autorización. | Firebase Console / staging; comparar con `firestore.rules` y filtros del sitemap. | REQUIERE MI AUTORIZACIÓN | P0 | Requiere verificación |

## Evidencia registrada en esta actualización

- El Static Site público en `https://continental997.fm/` respondió por HTTPS, pero en la comprobación anterior las rutas directas probadas devolvieron 404. La configuración de Render no se puede aplicar desde este repositorio.
- El sitio público observado todavía entregaba canonical y `robots.txt` con `https://radiocontinental99-7.onrender.com`; el sitemap contenía únicamente rutas estáticas. En la portada, Firestore informó `permission-denied` al cargar `categories`.
- El código fuente del sitemap filtra por `status == "published"` e `isArchived == false`, valida slugs y tiene fallback con warning a rutas estáticas ante un error de consulta. La regla fuente de Firestore expresa la misma condición de lectura pública. La consola, reglas realmente desplegadas y documentos reales no son verificables desde el repositorio.
- En esta fase `npm run deploy:prepare` pasó con configuración local de validación y el sitemap produjo las 10 rutas estáticas con el dominio canónico; las consultas de Firestore recibieron 403 porque no se usó la configuración de producción y ejercitaron el fallback. `npm test` pasó 6/6 y `npm run lint` terminó con código 0, con advertencias.
- En esta fase no se cambiaron DNS, reglas Firebase ni documentos de producción.
