# RESPIRAR v3.2 · Rodolfo Valle

Webapp gratuita de respiración guiada y ambientes sonoros. Alojamiento estático en GitHub Pages, sin cuentas, formularios clínicos, trackers, anuncios ni almacenamiento de sesiones. **Creado por Rodolfo Valle.**

## Identidad y funcionalidades

- RESPIRAR es el nombre visible del recurso. «Un momento, a tu ritmo» es su lema. Identidad gráfica nueva, favicon, iconos instalables y tarjeta social de 1200 × 630.
- Dos modos: **Respirar** (3/4 s predeterminado, 4/4, 4/6, sin retenciones) y **Solo escuchar** (1/3/5/10 min o sin límite).
- Cinco ambientes sintéticos, no grabaciones reales: mar, brisa, lluvia, bosque y cafetería; además silencio.
- Metrónomo opcional a un pulso por segundo siguiendo la fase respiratoria, campanillas independientes y ajustes avanzados plegables.
- Pausa automática al cambiar de pestaña, inicio y reanudación manual, reducción de movimiento, volumen y estado de audio visible.
- Autoría enlazada a rodolfovalle.com/#sobre-mi, enlace a Atlas de emociones y página de privacidad específica.

## Instalación (PWA) y uso offline

`manifest.webmanifest` e iconos 192/512 permiten la instalación cuando el navegador lo admite. `sw.js` precarga una copia de los archivos de la aplicación **y los cinco MP3** para que, una vez completada la primera instalación del trabajador de servicio, se pueda volver a abrir sin internet. La descarga inicial es de aproximadamente 2 MB de sonido más la aplicación. La app no recopila datos de uso, pero la caché técnica constituye almacenamiento del navegador. Puedes eliminarla borrando los datos del sitio.

- iPhone: Safari -> Compartir -> Añadir a pantalla de inicio.
- Android y escritorio: menú del navegador -> Instalar aplicación, cuando esté disponible.
- Se requiere HTTPS válido en producción. `localhost` funciona para pruebas.

El trabajador de servicio emplea un nombre de caché por versión. Al instalar una nueva versión elimina las cachés antiguas de RESPIRAR. Los enlaces a otros sitios **no** se guardan en caché. Si no termina la precarga inicial, no hay garantía de acceso offline completo; la app sigue sirviéndose normalmente cuando hay conexión.

## Privacidad y límites

No se solicitan, transmiten ni guardan respuestas clínicas. La aplicación no incluye analíticas ni píxeles. GitHub Pages puede procesar información técnica de la navegación al entregar archivos. La página `privacidad.html` explica estos límites. La web principal rodolfovalle.com utiliza su propia configuración y su privacidad es distinta.

Respirar es un recurso psicoeducativo, no tratamiento individualizado ni servicio de urgencias. No fuerces ni retengas el aire; si aparece mareo, incomodidad o aumenta la angustia, termina o usa Solo escuchar.

## Publicación

Repositorio: `rbvk/Respirar`, rama `main`, GitHub Pages desde `/(root)`. `CNAME` contiene `respirar.rodolfovalle.com`. El proveedor DNS debe tener el registro **CNAME** `respirar` -> `rbvk.github.io`. GitHub Pages y **Enforce HTTPS** se comprueban en Settings -> Pages, una vez que los DNS se han propagado. El archivo CNAME por sí mismo NO configura DNS ni HTTPS. No se realizaron cambios en el proveedor DNS desde este desarrollo.

## Vínculo con Carrd

En `rodolfovalle.com`, conservar o publicar la sección `#respirar` y el menú Recursos con el enlace `https://rodolfovalle.com/#respirar`. La landing presenta el recurso y enlaza a `https://respirar.rodolfovalle.com/`. Carrd necesita publicación independiente; los commits de GitHub no modifican Carrd.

## Validaciones ejecutadas

- Sintaxis de `app.js` y `sw.js` mediante `node --check`, archivo manifiesto JSON y rutas locales.
- HTML y estilos renderizados sin desbordamiento en Chromium (DOM local) a 1440, 390, 375 y 320 px; el CTA queda dentro del primer viewport de 390 × 844 y 375 × 667.
- Inicio, pausa, continuación, finalización, modo Solo escuchar, pantalla de ajustes, acceso a privacidad y preferencia de movimiento reducido.
- Cinco MP3 inspeccionados mediante decodificación: 26.2 segundos cada uno, RMS y saltos en las uniones dentro de tolerancias de la señal. No se reemplazaron sin evidencia comparativa.
- **Limitaciones:** el navegador del entorno bloquea la navegación a servidores locales y no permite completar una prueba real del service worker con red desconectada. La prueba de flujo usó HTML/CSS/JS insertados en Chromium. También siguen pendientes una prueba real en Safari iPhone, VoiceOver, pruebas de escucha y verificación de HTTPS/despliegue con la cuenta de DNS.

Documentación: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/ y https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

© 2026 Rodolfo Valle.
