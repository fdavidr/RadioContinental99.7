# Radio Continental 99.7 FM

Aplicación React + TypeScript + Vite. La experiencia editorial pública consulta noticias, programas, categorías, etiquetas e imágenes publicados en Firestore/Storage. Cuando Firebase no está configurado, la aplicación informa de la falta de conexión y no presenta el contenido de demostración como contenido real.

## Desarrollo local sin Firebase

```sh
npm install
npm run dev
npm run build
```

`.env.example` no incluye credenciales. Si las variables `VITE_FIREBASE_*` están vacías, no se puede leer ni escribir contenido en los servicios cloud; la interfaz pública muestra estados vacíos o de error, no noticias ni programas inventados. Los intentos de usar un servicio sin configuración generan un error explícito.

El contenido ilustrativo no es guardado automáticamente en Firebase. No hay migraciones ni seeds que escriban o alteren datos existentes.

## Configuración de Firebase

1. Crear un proyecto en Firebase Console y registrar una aplicación web.
2. Habilitar Authentication con el proveedor **Email/Password**. No existe registro público ni guardado de contraseñas en Firestore.
3. Crear Firestore en modo producción y un bucket de Storage.
4. Copiar `.env.example` a `.env` y completar:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Las claves de configuración web identifican el proyecto, no sustituyen las reglas. Nunca añadir claves privadas de cuentas de servicio ni secretos a `VITE_*`.
6. Desplegar reglas e índices desde el proyecto Firebase correcto:

```sh
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Los archivos de despliegue son `firebase.json`, `firestore.rules`, `firestore.indexes.json` y `storage.rules`. El repositorio no incluye una cuenta de servicio ni selecciona o despliega un proyecto por sí solo.

## Authentication y roles

La autenticación del panel usa Firebase Authentication (correo/contraseña), persistencia local del SDK y observación de cambios de token. No hay registro público. Las rutas `/admin` requieren sesión, correo verificado y custom claim; la autorización real de los datos sigue en las reglas de Firestore y Storage.

| Rol | Claim Firebase | Permisos |
|---|---|---|
| Superadministrador | `superadmin: true` | Contenido editorial, multimedia, configuración y lectura de registros administrativos |
| Editor | `editor: true` | Crear/editar/archivar contenido editorial y añadir registros de auditoría |

Las reglas también exigen `email_verified: true`. Los perfiles `users/{uid}` no son autoridad de roles y las escrituras de perfil están denegadas. Un usuario ordinario no puede registrarse, autoasignarse roles ni cambiar sus custom claims. El frontend aplica los mismos límites para la experiencia de usuario, pero nunca sustituye las reglas del servidor.

### Acceso, correo y configuración de la consola

- `/admin/login`: acceso. Una ruta administrativa solicitada antes del login se conserva y se restaura después de autenticar.
- `/admin/recuperar` y `/admin/restablecer`: solicitud genérica de recuperación y confirmación de contraseña mediante los códigos de acción de Firebase.
- `/admin/verificar-correo`: aplica el código de verificación y permite reenviar el mensaje a una sesión autenticada que aún no verificó su dirección.
- Los mensajes de recuperación no confirman si la dirección está registrada. Si Firebase no está configurado, la UI informa que la autenticación no está disponible y no afirma que se envió un correo.
- El cliente establece persistencia `browserLocalPersistence`; Firebase renueva los ID tokens. Cambios de claims se reflejan al refrescar el token o volver a iniciar sesión.

En Firebase Console, antes de usar estos flujos:

1. Habilitar Email/Password en Authentication, activar **Email enumeration protection** y configurar una política de contraseña acorde al mínimo de 10 caracteres al que valida la pantalla.
2. Añadir a **Authorized domains** el dominio de desarrollo y cada dominio real de producción.
3. Configurar y traducir las plantillas de restablecimiento y verificación. Para usar las pantallas propias, configurar el handler de acción de restablecimiento como `/admin/restablecer` y el de verificación como `/admin/verificar-correo`; el handler debe conservar `mode`, `oobCode` y los parámetros que Firebase incluya. Si se deja el handler web estándar, Firebase procesa la acción en su propia página y no envía el código a las pantallas de la app.
4. El `continueUrl` se fija en `/admin/login`; los handlers personalizados reciben el código en sus URLs de acción. Usar HTTPS en producción y mantener el dominio autorizado.
5. Hacer las pruebas con Authentication Emulator o un proyecto Firebase de staging antes de activar la integración en producción.

### Procedimiento para el primer superadministrador

1. Un operador autorizado crea la cuenta inicial en Firebase Console (Authentication > Users); no existe un formulario de alta en el sitio.
2. El titular inicia sesión y verifica su correo desde el enlace enviado por Firebase. No conceder claims antes de verificar la identidad y controlar el acceso a la cuenta.
3. Un operador con acceso privilegiado ejecuta, desde una estación/entorno seguro con Firebase Admin SDK y Application Default Credentials, una operación administrativa puntual `setCustomUserClaims(uid, { superadmin: true })`. Obtener el UID de la consola; no codificar UID, email o contraseña en el cliente ni guardar credenciales de servicio en el repositorio. La asignación debe ser una acción auditada y de acceso restringido.
4. El titular vuelve a iniciar sesión o renueva su token para recibir el claim; verificar acceso permitido al superadmin y denegado a un editor.
5. Proteger y rotar el acceso privilegiado. No habilitar una ruta pública de bootstrap ni exponer Admin SDK al bundle de Vite.

No ejecutar `setCustomUserClaims` desde código cliente o un endpoint público sin una autorización privilegiada independiente. Si ya hay usuarios con el antiguo claim `admin`, revisar cada UID y migrar manualmente a `superadmin` desde el entorno confiable; las reglas nuevas no aceptan `admin`.

Los módulos administrativos usan los servicios Firestore/Storage y solo muestran éxito cuando Firebase confirma la operación. Sin variables Firebase, el panel explica que el servicio no está disponible y no simula persistencia.

## Descubrimiento editorial público

La portada, deportes, noticias, programas, búsqueda global y fichas individuales obtienen contenido desde Firestore. Todas las consultas públicas exigen `status == published` e `isArchived == false`; las imágenes se leen únicamente si el documento de medio está publicado, no archivado y marcado público en Storage. No se descargan colecciones completas: los listados usan cursores y lotes limitados, y los slugs se normalizan y verifican contra duplicados antes de mostrar una ficha.

Firestore no ofrece búsqueda full-text. La búsqueda usa `searchTerms`, términos normalizados indexados al crear o editar noticias y programas. Busca el primer término con `array-contains` y valida los términos restantes sobre resultados limitados; no es búsqueda difusa ni reemplaza un motor dedicado. Un rastreo por página se limita a 400 documentos candidatos y ofrece continuar cuando hay más documentos por revisar. Los filtros de categoría/etiqueta que no se pueden combinar en una consulta de Firestore se validan sobre ese conjunto acotado.

Antes de habilitar búsqueda en un proyecto existente:

1. Desplegar las reglas e índices de `firestore.rules` y `firestore.indexes.json` con Firebase CLI.
2. Ejecutar un backfill administrativo privilegiado para generar `searchTerms` en publicaciones/programas ya existentes. Los documentos antiguos sin ese campo siguen apareciendo en listados y fichas, pero no coincidirán en búsquedas de texto hasta ser actualizados. No hay un backfill cliente ni se modifica la base de datos automáticamente.
3. Confirmar índices creados en Firebase Console. Firestore puede solicitar índices adicionales para combinaciones de rango de fecha y facetas; crear solo los índices indicados por el error de consulta para el esquema concreto.

La portada destaca la publicación más reciente disponible, no una selección editorial manual. El buscador global cubre noticias y programas; los filtros de noticias incluyen categoría, etiqueta y rango de fechas. La paginación conserva filtros en la URL y los enlaces a fichas guardan el listado de retorno durante la navegación interna; los cursores de página no se serializan en la URL.

## Modelo de datos (Firestore)

Todos los documentos editoriales usan `status` (`draft | published | archived`), `isArchived`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy` y, al publicar, `publishedAt`. Los IDs son IDs de documento Firebase; no crear IDs desde datos no confiables.

| Colección | Campos de dominio principales | Acceso |
|---|---|---|
| `programs` | `title`, `slug`, `description`, `categoryId`, `hostNames[]`, `imageMediaId`, `durationMinutes` | Lectura pública solo publicado/no archivado; escritura editor/superadmin |
| `schedule` | `programId`, `dayOfWeek` (0–6), `startTime`, `endTime` (`HH:mm`), `timeZone` | Lectura pública solo publicado/no archivado; escritura editor/superadmin |
| `posts` | `title`, `slug`, `excerpt`, `body`, `categoryIds[]`, `tagIds[]`, `heroMediaId`, `authorUid` | Lectura pública solo publicado/no archivado; escritura editor/superadmin |
| `categories` | `name`, `slug`, `description`, `sortOrder` | Lectura pública solo publicado/no archivado; escritura editor/superadmin |
| `tags` | `name`, `slug` | Lectura pública solo publicado/no archivado; escritura editor/superadmin |
| `media` | `originalName`, `storagePath`, `contentType`, `sizeBytes`, `altText`, `visibility` | Lectura pública solo publicado/no archivado y con `visibility=public`; escritura superadmin |
| `banners` | `label`, `placement`, `mediaId`, `altText`, `sortOrder`, `targetUrl`, `startsAt`, `endsAt` | Lectura pública solo publicado/no archivado; escritura solo superadmin |
| `publicConfig/site` | nombre/slogan, URL de señal/contacto/redes, `stationTimeZone` y `updatedAt` | Lectura pública; escritura solo superadmin |
| `privateConfig/{id}` | configuración privada, si se incorpora | Solo superadmin puede leer; escritura cliente denegada |
| `users/{uid}` | `uid`, `email`, `displayName`, `disabled`, `createdAt` | El usuario puede leer su perfil; superadmin puede leer; escritura cliente denegada |
| `adminLogs/{id}` | `actorUid`, `action`, `collection`, `documentId`, `createdAt`, `summary` | Superadmin puede leer; editor/superadmin solo puede añadir su propio actor; no editar ni borrar |

Los roles viven en custom claims confiables, nunca en un perfil que el usuario pueda modificar. No almacenar contraseñas. Los servicios de contenido en `src/services/content.ts` hacen create/update/archive lógico, consultan solo contenido público y escriben un log junto con los cambios mediante un batch de Firestore. No se permite borrado físico desde el cliente.

Los registros de auditoría escritos desde el cliente son informativos, no una bitácora inviolable: para auditoría regulatoria o acciones privilegiadas hace falta mover esa escritura a Cloud Functions/servidor confiable.

## Panel administrativo implementado

El panel incluye dashboard con conteos Firestore; publicaciones/noticias; programas con emisiones semanales; programación; categorías y etiquetas; biblioteca multimedia; banners; configuración pública; perfiles de usuarios de solo lectura; y actividad administrativa. Los listados administrativos paginan por cursores, y las publicaciones permiten borrador, edición, previsualización, publicación, despublicación, duplicado de programas y archivado lógico. Los formularios validan antes de guardar; las actualizaciones comparan `updatedAt` para detectar ediciones concurrentes y las acciones no destructivas no eliminan documentos físicamente.

Los editores pueden gestionar contenido editorial y programación. Solo superadministradores pueden gestionar medios, banners y configuración, y consultar perfiles/logs. La aplicación no enumera cuentas de Firebase Authentication ni asigna claims; la creación de usuarios y la promoción de roles requieren un operador privilegiado y Firebase Admin SDK fuera del navegador.

El editor enriquecido ofrece formato básico con textarea y sanea al guardar y en la vista previa usando DOMPurify con una lista permitida. No se debe renderizar HTML almacenado en ninguna otra superficie sin sanearlo. La búsqueda de listados opera sobre la página cargada, no sobre todo el conjunto. Los slugs se verifican antes de crear, pero no hay una reserva atómica frente a dos creaciones simultáneas.

## Streaming y programación de radio

El reproductor público obtiene la URL desde `publicConfig/site.streamUrl`; no usa una señal local de reserva ni inicia audio automáticamente. El elemento de audio y su contexto persisten al navegar entre rutas públicas; mientras reproduce aparece un control compacto global. El reproductor ofrece play/pausa, volumen, reintento, conexión/error y controles accesibles por teclado. Acepta URLs HTTP/HTTPS, pero una página HTTPS no puede reproducir un flujo HTTP por bloqueo de contenido mixto. El códec y el formato deben ser compatibles con el navegador (por ejemplo, MP3/AAC/OGG según el navegador y servidor); los errores de red, formato, CORS/proveedor se muestran sin afirmar que el stream está audible.

Desde Configuración de emisora, el superadministrador establece `streamUrl` y `stationTimeZone`. La zona inicial es `America/La_Paz` y debe ser una zona IANA válida. “Comprobar disponibilidad técnica” realiza una solicitud HEAD desde el navegador y distingue respuesta HTTP, rechazo y resultado no verificable. CORS, un endpoint que no acepte HEAD o un error de red pueden impedir el diagnóstico; una respuesta HTTP correcta no garantiza audio audible.

La programación pública se lee de `schedule` y de los `programs` publicados. Cada emisión tiene `programId`, día 0–6 (domingo–sábado), `startTime`, `endTime`, `timeZone` y `status`; los horarios se interpretan con la zona de la emisora configurada. La hora final menor a la inicial significa que termina al día siguiente; las horas iguales se rechazan. La grilla pública permite elegir día y señala “Al aire” solo cuando existe exactamente una emisión publicada que coincide con la hora local y tiene un programa publicado asociado. Horarios publicados solapados o empatados se tratan como ambiguos y no se presentan como una confirmación. El panel verifica solapamientos con las emisiones publicadas existentes al guardar, incluidos los cruces de medianoche y semana; por ser validación cliente antes de la escritura Firestore, operaciones concurrentes simultáneas todavía pueden requerir revisión.

`publicConfig/site` incorpora `stationTimeZone`. Las reglas se deben volver a desplegar junto con el código para que el cliente publique y lea la configuración ampliada.

La carga multimedia valida formato y tamaño individual, y limita la consulta de medios activos a 500. Ese tope de cantidad está aplicado por el cliente y no equivale a una cuota inviolable del bucket; para imponer cuotas ante uso directo del SDK se necesita un backend confiable. La publicación/privacidad sincroniza Storage y Firestore mediante operaciones separadas, por lo que un fallo entre ambas puede requerir revisión manual del estado del archivo.

## Storage y publicación de medios

`src/services/media.ts` restringe las cargas a JPEG, PNG, WebP, AVIF (10 MiB), MP3/AAC/OGG/WAV (25 MiB) y MP4 (50 MiB). Solo `superadmin` puede cargar o cambiar visibilidad. Los archivos empiezan privados y no se pueden borrar desde el cliente. La visibilidad pública de Storage se controla con metadatos Firebase `visibility=public`; hay que ponerla en privado antes de archivar un documento de medio. `archiveRecord` hace ese cierre antes del archivado lógico en Firestore.

`readPublicMedia` usa `getBlob` y las reglas de Storage, no genera URLs con token de descarga que puedan continuar siendo accesibles después de retirar la publicación. Para dominios de producción, configurar CORS del bucket según los orígenes permitidos de la aplicación.

## Seguridad, separación de datos e índices

- Firestore y Storage deniegan por defecto. Las reglas no confían en rutas ocultas ni en validaciones del cliente.
- Público: solo documentos editoriales publicados/no archivados y `publicConfig/site`.
- Privado: borradores y registros archivados; `users`, logs y `privateConfig`.
- Las cuentas ordinarias no escriben datos editoriales, perfiles ni configuración.
- No se permite borrado duro desde el cliente.
- Storage valida rol, MIME type, tamaño y metadatos. Los archivos no se eliminan por reglas del cliente.
- `firestore.indexes.json` cubre los listados por estado/actualización y horarios por día/programa. La búsqueda de slug usa consultas acotadas sin índice compuesto. Firestore también puede solicitar índices adicionales si se agregan consultas.

## Emuladores

Los emuladores usan los puertos Auth `9099`, Firestore `8080` y Storage `9199`:

```sh
firebase emulators:start --only auth,firestore,storage --project demo-radio-continental
```

Para que el cliente use emuladores, configurar las variables web Firebase y `VITE_USE_FIREBASE_EMULATORS=true` en desarrollo. Esa bandera no conecta emuladores en una compilación de producción. No cargar datos reales ni secretos en el proyecto `demo-*`.

## Comprobación de permisos antes del despliegue

1. Probar reglas con Firebase Emulator Suite/Rules Playground: visitante lee un post publicado; visitante no lee un borrador ni puede escribir; usuario autenticado sin claims no puede escribir; editor verificado puede escribir contenido pero no configuración ni Storage; superadmin verificado puede gestionar contenido/configuración/medios; claims ausentes o email no verificado deniegan escrituras privilegiadas; ningún usuario puede cambiar `users/{uid}`, borrar contenido o leer un archivo privado.
2. Probar también el caso de archivo publicado: tras `visibility=private` debe dejar de poder leerse mediante `readPublicMedia`.
3. Revisar los logs del emulador y comprobar que las consultas públicas siempre filtran `status == published` e `isArchived == false`.
4. Desplegar primero a un proyecto de staging, repetir pruebas con una cuenta sin claims y cuentas editor/superadmin controladas, y luego desplegar reglas/índices a producción.

No se han proporcionado credenciales Firebase. Por lo tanto, Firebase no está conectado, las reglas no han sido desplegadas y no se afirma que exista escritura/lectura cloud activa.

## Difusión, SEO y monetización

### Metadatos e indexación

La app actual es una SPA de React/Vite: actualiza title, description, canonical, Open Graph, Twitter Cards y JSON-LD en el navegador cuando carga cada ruta. Las páginas de noticias publicadas emiten `NewsArticle` y `BreadcrumbList`; los programas usan `RadioSeries`; la portada declara `RadioStation`. Rutas administrativas y búsqueda tienen `noindex`; `robots.txt` bloquea `/admin`. El 404 de cliente también es `noindex`.

Los metadatos de cliente no son suficientes para redes sociales y buscadores que no ejecutan JavaScript: tampoco pueden ver el contenido de Firestore al primer HTML. No se migró la arquitectura, de acuerdo con el requisito de presentar las consecuencias antes de un cambio importante. Para indexación fiable se recomienda una fase separada de SSG/ISR o SSR:

- **SSG/ISR (recomendado si el hosting es estático):** generar HTML, metadatos, JSON-LD y páginas de noticia/programa en cada despliegue o al recibir una señal confiable de publicación. Es rápido y de bajo costo por visita, pero requiere regeneración para reflejar cambios y adaptar las lecturas Firestore al build.
- **SSR:** renderizar HTML por petición permite contenido más fresco, pero requiere runtime/hosting de servidor, caché, disponibilidad y monitoreo adicionales, además de asegurar las lecturas públicas y metadatos.
- En cualquiera de las opciones, compartir imágenes requiere una URL HTTPS públicamente accesible. Storage hoy entrega imágenes al navegador con `getBlob` y reglas, no con URL de descarga permanente; no se debe poner un blob local en OG. `VITE_SOCIAL_PREVIEW_IMAGE_URL` acepta una imagen HTTPS pública verificada para vistas sociales genéricas.

`public/404.html` es una página estática de respaldo. La ruta React `*` ofrece la experiencia 404, pero una SPA no puede establecer el estado HTTP 404. La configuración Firebase Hosting reescribe únicamente las rutas públicas y administrativas conocidas a `index.html`; las rutas desconocidas reciben `404.html` con status 404, sin una reescritura indiscriminada que produzca soft-404.

### Sitemap de despliegue

No se codifica ni inventa un dominio. Configurar `VITE_SITE_URL` con el origen HTTPS real y `VITE_FIREBASE_PROJECT_ID`, desplegar reglas que permitan las consultas públicas y luego ejecutar `npm run generate:sitemap` después de la compilación. Para preparar un release completo, usar `npm run deploy:prepare`.

```sh
npm run generate:sitemap
```

El generador escribe `dist/sitemap.xml` y agrega su URL absoluta en `dist/robots.txt`. Consulta únicamente documentos con `status == published` e `isArchived == false`, que son exactamente las condiciones de `isPublicRecord()` en `firestore.rules`, pagina en lotes, valida nuevamente esos campos y omite slugs inválidos. No incorpora `/buscar`, `/admin` ni documentos privados. La consulta usa la API REST pública de Firestore, sin Admin SDK ni credenciales privilegiadas; por ello queda sujeta a las reglas publicadas y solo debe poder leer documentos públicos.

Si Firestore rechaza temporalmente una colección (incluido 403), el generador registra un warning y escribe un sitemap válido con rutas estáticas y con documentos recuperados completamente de las demás colecciones. No debilita las reglas ni considera éxito una inclusión parcial de una colección fallida. Si `VITE_FIREBASE_PROJECT_ID` está ausente, también produce el sitemap estático; `VITE_SITE_URL` sigue siendo obligatorio para formar URLs absolutas. Revisa los warnings del build y corrige reglas, proyecto o disponibilidad de Firestore para que noticias y programas publicados aparezcan en el sitemap. El sitemap estático de fallback no contiene las URLs editoriales dinámicas. Volver a generarlo después de publicar cambios y enviarlo al buscador; no se incluye en `npm run build` para mantener builds locales sin Firebase utilizables.

Las reglas fuente permiten lecturas anónimas en `posts` y `programs` solamente para registros que satisfacen `status == 'published'` e `isArchived == false`; el query de sitemap incluye ambos filtros y no necesita Admin SDK. Un 403 en producción no se corrige abriendo permisos: comparar las reglas activas del mismo `VITE_FIREBASE_PROJECT_ID` con `firestore.rules`, confirmar que Firestore está creado/activo y que los documentos usan esos campos. El código local de reglas no se aplica automáticamente a Firebase.

### Banners

El módulo administrativo `/admin/banners` permite creatividad basada en un medio publicado, texto alternativo, destino HTTPS, ubicación, período y orden. `Publicado` equivale a activo; `Borrador` a inactivo. Los banners archivados, fuera de fechas, medios privados y registros no publicados no se muestran. Las ubicaciones se sirven en portada principal/entre noticias, noticias, programas y pie. En cada ubicación se muestra el banner activo con menor `sortOrder` (empate por etiqueta), limitando recursos y cambios de layout; no hay rotación automática ni red publicitaria externa. Un destino vacío muestra la creatividad sin enlace. Los clics solo se envían a analítica con consentimiento.

Desplegar `firestore.rules` y `firestore.indexes.json` tras el cambio del esquema de banners. Los registros antiguos sin `altText`/`sortOrder` siguen siendo legibles; el texto alternativo usa como respaldo el configurado en el medio y el orden predeterminado es cero.

### Analítica y consentimiento

Google Analytics 4 es opcional: completar `VITE_GA4_MEASUREMENT_ID` con un ID `G-...` en el entorno de despliegue. El identificador no es un secreto. Sin un ID válido no se carga ningún script ni se muestra el control de consentimiento. Con ID configurado, la medición permanece apagada hasta que el visitante acepte; aceptar/rechazar se recuerda en el navegador y puede cambiarse desde “Preferencias de privacidad”. No se envían eventos a GA antes del consentimiento. La política legal y la base de consentimiento deben ser revisadas para los países donde opere la emisora.

Se registran page views y eventos de clic en escuchar/reproducir/pausar/reintentar, WhatsApp y banners. `live_click` significa interacción del usuario, no conexión ni cantidad de oyentes; GA4 no mide oyentes concurrentes reales. No se envían correos, teléfonos, términos de búsqueda ni identidad del usuario. La carga del script requiere conectividad con Google y puede ser bloqueada por navegador/consent manager.

### Contacto

No hay un formulario web activo ni backend de recepción, persistencia, antispam o confirmación de mensajes; la página solo presenta canales verificados que estén configurados desde Firebase o variables de despliegue. No se muestra un formulario que finja haber enviado algo. Configurar email/teléfono/WhatsApp oficiales antes de producción. Los clics de WhatsApp se miden solo con consentimiento. Antes de incorporar un formulario, implementar un endpoint confiable con validación en servidor, límites/rate limiting, protección antispam, almacenamiento de acceso restringido y confirmación únicamente tras aceptación del servidor.

### Rendimiento

Las páginas públicas secundarias se cargan por ruta; inicio permanece en el paquete inicial. La inicialización de Firebase está separada por servicio, de modo que la carga inicial pública no incluye los SDK de Authentication o Storage. Las consultas de programación se hacen al visitar inicio, en vivo o programación; listados editoriales siguen usando cursores y límites de página.

Las imágenes editoriales y las creatividades publicitarias esperan a estar próximas a la ventana visible antes de leer el medio desde Firebase Storage. Los espacios reservan altura y el audio conserva `preload="none"`; nunca se inicia automáticamente. No se descargan fuentes web externas. Esto reduce transferencias iniciales, pero no redimensiona medios existentes: las imágenes aún pueden ocupar hasta 10 MB. Para garantizar variantes adaptables y tamaños óptimos en producción se requiere un pipeline de imágenes/Storage y validar imágenes reales.

En una comprobación local del build de producción sin Firebase configurado, los recursos referenciados estáticamente por el HTML bajaron de 260.815 a 105.967 bytes (−59,4%); el servicio Firestore y sus dependencias comenzaron a solicitarse después del evento `load`. Tras cargar esos imports diferidos, el total medido fue 219.046 bytes (−16,0% frente al baseline), sin descargas de Authentication o Storage. Son mediciones del navegador en localhost, sin limitación de red ni contenido real; no representan Core Web Vitals de usuarios. En esa prueba el documento completó `DOMContentLoaded` en 59 ms y `load` en 60 ms, y no hubo overflow horizontal a 360 px; son cifras locales de una sola ejecución. No se pudo obtener una medición fiable de LCP/INP: Lighthouse no está instalado, y faltan métricas de producción con Firestore, Storage, anuncios y dispositivos móviles. Firebase Hosting configura caché larga e inmutable para recursos versionados en `/assets/`, revalidación para `index.html` y cabeceras de seguridad básicas.

## Comprobaciones del proyecto

```sh
npm run build
npm run typecheck
npm run lint
```

`npm run build` incluye la compilación TypeScript del proyecto. `npm test` ejecuta pruebas unitarias Node para el filtro de documentos públicos, el shape de la consulta REST y el fallback del sitemap ante errores de permisos. Las pruebas de extremo a extremo y la Emulator Suite no están configuradas en este repositorio; no se han probado ciclos reales con Firestore/Storage, ya que el proyecto no proporciona credenciales y este entorno no tiene Java para los emuladores.

## Preparación y publicación en producción

### Estado y requisitos previos

El proyecto está preparado para Firebase Hosting como SPA estática. `firebase.json` sirve `dist/`, habilita recarga directa en las rutas conocidas, devuelve el `404.html` estático para rutas desconocidas y configura caché y cabeceras de seguridad. Las rutas administrativas también sirven el bundle de la aplicación, pero la autenticación y las reglas de Firebase deben permanecer habilitadas; ocultar una ruta no es una medida de autorización.

**No se ha publicado el sitio.** No hay proyecto Firebase, dominio, configuración de producción, URL real del stream ni autorización de despliegue proporcionados en este entorno. El build local anterior no acredita que el entorno de producción esté listo.

### Configurar Render (Static Site)

Render debe configurarse como **Static Site**, no como Web Service: Vite genera los archivos estáticos en `dist/`. La configuración de hosting de `firebase.json` no se aplica en Render; Firebase seguirá siendo el backend para Auth, Firestore y Storage.

1. Confirma que el repositorio y la rama con el código estén en GitHub/GitLab y que tengas permiso para conectarlos a Render.
2. En Render, elige **New → Static Site**, conecta el repositorio correcto y selecciona la rama que se publicará.
3. Usa estos valores:
   - Root Directory: vacío (raíz del repositorio).
   - Build Command inicial: `npm run build`.
   - Publish Directory: `dist`.
4. En **Environment**, añade las variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID` con los valores de la app web Firebase de producción. Añade `VITE_USE_FIREBASE_EMULATORS=false`. No agregues claves privadas, contraseñas ni credenciales de Admin SDK: los valores `VITE_*` se incorporan al JavaScript que recibe cada visitante.
5. Para el primer deploy, `VITE_SITE_URL` puede quedar sin configurar; la aplicación pública usa el origen actual como canonical temporal. No se generará sitemap en este build. El contenido seguirá mostrando los estados de Firebase si el backend o sus permisos todavía no están configurados.
6. Después de crear el Static Site, copia el hostname HTTPS que Render asignó y úsalo como `VITE_SITE_URL` (solo origen, sin ruta ni `/` final). Agrega ese hostname en Firebase Authentication → **Authorized domains**. Configura las reglas, índices, Auth y Storage de Firebase desde un entorno autorizado; no ejecutes `firebase deploy --only hosting` para Render.
7. En Render → **Redirects/Rewrites**, agrega reglas **Rewrite** a `/index.html` para `/noticias`, `/noticias/*`, `/programas`, `/programas/*`, `/buscar`, `/en-vivo`, `/contacto`, `/nosotros`, `/programacion`, `/deportes`, `/privacidad`, `/terminos`, `/admin` y `/admin/*`. No uses una regla global `/*`: causaría soft-404 y serviría la aplicación con estado 200 para rutas inexistentes. La regla de `/` tampoco hace falta: `dist/index.html` ya está en la raíz.
8. En **Custom Headers**, se recomiendan `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy: camera=(), microphone=(), geolocation=()` para `/*`; `Cache-Control: public, max-age=31536000, immutable` para `/assets/*`; y `Cache-Control: no-cache` para `/` y `/index.html`. Render documenta estas reglas en el dashboard y las aplica al Static Site.
9. Comprueba el hostname `onrender.com` por HTTPS y abre directamente/recarga `/noticias`, una ruta de noticia, `/admin/login` y una URL inexistente. Las rutas de contenido deben abrir la SPA; la inexistente debe presentar la página 404 estática. Verifica además consola, variables y requests de Firebase.
10. Cuando tengas el dominio definitivo, configúralo en Render → **Settings → Custom Domains**, sigue exactamente las instrucciones DNS que Render muestre y espera el certificado HTTPS activo. Cambia `VITE_SITE_URL` al origen HTTPS canónico final y agrega el dominio a Authorized domains de Firebase Authentication. Si cambian las variables de entorno, vuelve a desplegar para que Vite las incorpore al bundle.
11. Tras configurar `VITE_SITE_URL`, cambia el Build Command de Render a `npm run deploy:prepare` y despliega otra vez. Ese comando verifica Firebase y el origen HTTPS, compila y genera `dist/sitemap.xml` consultando Firestore; requiere reglas de lectura pública, API/Firestore disponibles e índices requeridos. Si falla, no publiques un build sin sitemap como release final.

Las URLs de stream y emisora no se agregan en Render: se administran desde `/admin/configuracion` en Firestore después de habilitar Auth y crear el primer superadministrador. Los datos de contacto y redes opcionales sí pueden añadirse como variables `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_URL`, `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL` y `VITE_YOUTUBE_URL`, pero solo con datos oficiales verificados. `VITE_GA4_MEASUREMENT_ID` es opcional; debe ser un ID real y cumplir la política de consentimiento.

Antes del despliegue, confirmar con el titular de la emisora y en el proyecto elegido:

1. Cuenta de Google/Firebase autorizada, ID de proyecto de producción y facturación habilitada si los servicios elegidos la requieren. No reutilizar un proyecto de demo o staging.
2. Aplicación web registrada en el proyecto y valores Firebase completos. La configuración web se incorpora al bundle de cliente; **no** colocar contraseñas, claves privadas ni JSON de cuentas de servicio en variables `VITE_*`.
3. Authentication con Email/Password; protección contra enumeración de correo; plantillas reales de verificación y recuperación; páginas de acción de Firebase apuntando a `/admin/verificar-correo` y `/admin/restablecer`; dominio final agregado a Authorized domains.
4. Firestore creado en la región acordada; índices y reglas revisados y probados en Emulator Suite o staging antes de producción.
5. Storage activado, reglas verificadas y configuración CORS del bucket limitada a los orígenes HTTPS oficiales. Revisar costos, límites y procedimiento de retiro de medios.
6. Registro DNS y dominio personalizado configurados en Firebase Hosting. Esperar a que Firebase confirme DNS y HTTPS activo antes de añadir ese origen a Authentication o entregar el sitio.
7. Datos institucionales, email/teléfono/WhatsApp/redes, política de privacidad y términos confirmados por la emisora. El sitio contiene textos institucionales y legales provisionales señalados como tales; no deben presentarse como declaraciones oficiales sin aprobación. El stream no tiene un valor por defecto.
8. Revisión en Firebase de `publicConfig/site`: completar información confirmada, zona horaria, enlaces y URL HTTPS del stream. Comprobar reproducción en el dominio HTTPS; una señal HTTP puede ser bloqueada por contenido mixto.
9. GA4 es opcional: proporcionar `VITE_GA4_MEASUREMENT_ID` solo si existe una propiedad real y se aprobaron privacidad/consentimiento. No se inventan contactos, audiencia ni credenciales.
10. La arquitectura sigue siendo SPA: las vistas sociales y algunos rastreadores no ejecutan JavaScript y pueden no recibir el contenido editorial/metadatos dinámicos. SSG/ISR o SSR requiere una decisión de arquitectura aparte; Hosting estático no resuelve esa limitación.

### Entorno y comandos exactos

Usar Node.js y npm compatibles con el lockfile. La CLI de Firebase es una herramienta externa al proyecto; instalarla en el entorno autorizado y comprobar la identidad de la cuenta:

```sh
npm install
npm install --global firebase-tools
firebase login
firebase projects:list
```

Crear `.env.production` (archivo ignorado por Git) basado en `.env.example`. `npm run deploy:prepare` valida todos los campos Firebase, un origen `VITE_SITE_URL` HTTPS y que los emuladores no estén activados; luego compila y genera el sitemap consultando solo contenido público. También se puede usar un gestor de secretos/variables de CI. Variables:

| Variable | Requerida | Uso |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Sí | Configuración pública del cliente Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sí | Dominio Auth del proyecto |
| `VITE_FIREBASE_PROJECT_ID` | Sí | Proyecto Firestore/Authentication |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sí | Bucket del proyecto |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sí | Configuración de la app web |
| `VITE_FIREBASE_APP_ID` | Sí | Configuración de la app web |
| `VITE_SITE_URL` | Sí | Origen HTTPS real para canonical y sitemap, sin ruta |
| `VITE_APP_NAME` | No | Nombre público; valor predeterminado Radio 99.7 FM |
| `VITE_SOCIAL_PREVIEW_IMAGE_URL` | No | Imagen HTTPS aprobada para vista previa social |
| `VITE_GA4_MEASUREMENT_ID` | No | ID real `G-...`; analítica sujeta a consentimiento |
| `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_WHATSAPP_URL` | No | Canales oficiales verificados |
| `VITE_INSTAGRAM_URL`, `VITE_FACEBOOK_URL`, `VITE_YOUTUBE_URL` | No | Perfiles oficiales verificados |
| `VITE_USE_FIREBASE_EMULATORS` | No | Mantener `false`/vacío en producción |

La URL del stream **no** se toma de una variable de entorno: se administra en Firestore desde el panel, en Configuración de emisora. Lo mismo aplica a los datos editables de la emisora. Configurar una señal solo después de comprobar que es la URL real y que el proveedor permite su reproducción desde el dominio HTTPS.

Elegir el proyecto explícitamente en todos los comandos; no crear ni versionar un `.firebaserc` con una selección accidental:

```sh
firebase projects:list
```

En PowerShell, establecer el ID confirmado y usarlo explícitamente:

```powershell
$ProjectId = "ID_REAL_DEL_PROYECTO"
node scripts/check-production-config.mjs $ProjectId
if ($LASTEXITCODE -ne 0) { throw "Configuración inválida; despliegue cancelado." }
firebase deploy --only firestore:rules,firestore:indexes,storage --project $ProjectId
npm run deploy:prepare
node scripts/check-production-config.mjs $ProjectId
if ($LASTEXITCODE -ne 0) { throw "El proyecto no coincide; despliegue cancelado." }
firebase deploy --only hosting --project $ProjectId
```

El argumento del verificador compara el destino CLI con `VITE_FIREBASE_PROJECT_ID`. `npm run deploy:prepare` debe ejecutarse después de configurar `.env.production` y de desplegar/verificar las reglas que permiten las consultas públicas del sitemap. Si falla, **no continuar** con Firebase Hosting. Revisar el proyecto activo en la salida de Firebase CLI antes de cualquier despliegue; estos comandos no deben ejecutarse hasta recibir autorización explícita del responsable.

### Primer acceso y operación cotidiana

Para crear el primer superadministrador, seguir el procedimiento de la sección “Procedimiento para el primer superadministrador”: alta manual en Firebase Authentication, verificación de correo y asignación del claim `superadmin` desde un entorno confiable con Firebase Admin SDK y acceso privilegiado. No hay script de bootstrap, contraseña inicial fija ni registro público. El SDK administrativo no debe añadirse al bundle ni sus credenciales al repositorio.

Para cambiar el stream, iniciar sesión con superadmin verificado, abrir `/admin/configuracion`, ingresar la URL HTTP/HTTPS verificada y guardar. Probar desde la página `/en-vivo` en HTTPS, tanto en escritorio como móvil; el chequeo técnico del servidor no garantiza audio audible.

Para actualizar el sitio: aprobar cambios, validar reglas en staging, completar `.env.production`, ejecutar `npm run deploy:prepare`, revisar `dist/` (incluyendo `404.html`, `robots.txt` y `sitemap.xml`) y desplegar `hosting` con el mismo `--project`. Volver a generar y enviar el sitemap después de altas editoriales importantes. Las reglas/índices/Storage se despliegan separadamente, solo tras verificar cada cambio en staging.

Para revertir Hosting: Firebase Console → Hosting → Release history → seleccionar una versión anterior → **Rollback**. Alternativamente, volver a compilar el commit/tag aprobado y desplegar Hosting; no revertir reglas de base de datos a ciegas porque una versión anterior puede abrir accesos o ser incompatible con el esquema actual. Mantener el ID de release y el commit/tag asociado en el registro operativo.

### Copias de seguridad y recuperación

Antes de producción, acordar frecuencia, retención, región, cifrado, responsable y objetivo de recuperación; usar un bucket de backups dedicado, con IAM mínimo, acceso auditado y política de retención. Las exportaciones administradas de Firestore requieren los permisos y configuración de facturación que exija Google Cloud. Sustituir los marcadores por valores confirmados, nunca ejecutar literalmente:

```powershell
$ProjectId = "ID_REAL_DEL_PROYECTO"
$BackupBucket = "BUCKET_PRIVADO_DE_BACKUPS"
$StorageBucket = "BUCKET_REAL_DE_FIREBASE"
$Timestamp = Get-Date -Format "yyyyMMddTHHmmssZ"
gcloud firestore export "gs://$BackupBucket/firestore/$Timestamp" --project=$ProjectId
gcloud storage rsync "gs://$StorageBucket" "gs://$BackupBucket/storage/$Timestamp" --recursive
```

Probar recuperación periódicamente en un proyecto de staging aislado. La importación de Firestore requiere permisos de importación/exportación y debe probarse con una exportación válida:

```powershell
$StagingProjectId = "ID_REAL_DEL_PROYECTO_STAGING"
$StagingStorageBucket = "BUCKET_REAL_DE_STAGING"
gcloud firestore import "gs://$BackupBucket/firestore/$Timestamp" --project=$StagingProjectId
gcloud storage rsync "gs://$BackupBucket/storage/$Timestamp" "gs://$StagingStorageBucket" --recursive
```

El comando de importación no es una restauración destructiva exacta: verificar el comportamiento y reconciliar/limpiar datos sobrantes en staging antes de cualquier recuperación real. Respaldar Firestore y Storage juntos para conservar referencias a medios. No respaldar ni publicar archivos de cuentas de servicio dentro del repositorio.

### Verificación posterior y límites de publicación

Después de autorizar y completar el despliegue, comprobar con el dominio real:

- HTTP→HTTPS, dominio canónico y certificado válido; origen autorizado en Firebase Authentication.
- Abrir y recargar directamente `/`, `/noticias`, una ficha editorial, `/programas`, `/buscar`, `/admin/login` y una URL inexistente. La última debe devolver HTTP 404; las rutas conocidas deben cargar.
- Que `index.html`, bundles, favicon, `robots.txt`, `sitemap.xml` y `404.html` respondan correctamente; revisar consola y solicitudes de red.
- En consola Firebase, confirmar reglas activas de Firestore/Storage, índices listos, Authentication correcto y que visitante/editor/superadmin tengan únicamente permisos aprobados.
- Confirmar que no hay noticias/programas de muestra publicados, que contactos y legales fueron aprobados, y que un borrador no aparece en la web ni en sitemap.
- Probar login, recuperación/verificación con buzones controlados, persistencia CRUD en staging, stream HTTPS real, consentimiento GA4 si aplica, y cargas/rendimiento desde móvil.

**Estado a esta auditoría:** no publicado y no listo para autorizar publicación. Build, TypeScript y navegación local se habían comprobado antes, pero no hay configuración de Firebase o dominio en este entorno. No se han probado reglas desplegadas, índices productivos, persistencia real, correo, stream, DNS, HTTPS, analítica ni backups restaurados. `firebase-tools`, Java y credenciales de producción no están disponibles; `npm test` no existe y no hay suite E2E configurada. La SPA y los textos institucionales/legales pendientes son riesgos explícitos que requieren aceptación o resolución antes de producción.
