# RESPIRAR v4.1 · Rodolfo Valle

Webapp gratuita de respiración guiada y ambientes sonoros. Alojamiento estático en GitHub Pages, sin cuentas, formularios clínicos, trackers, anuncios ni almacenamiento de sesiones. **Creado por Rodolfo Valle.**

## Identidad y funcionalidades

- RESPIRAR es el nombre visible del recurso. «Un momento, a tu ritmo» es su lema. Identidad gráfica nueva, favicon, iconos instalables y tarjeta social de 1200 × 630.
- Dos modos: **Respirar** (cuatro tiempos exactos: inhalación 1–15 s, pausa con aire 0–15 s, exhalación 1–15 s, pausa sin aire 0–15 s; pausas opcionales de 0 s; presets 3/0/4/0, 4/0/6/0, 4/4/4/4) y **Solo escuchar** (1/3/5/10 min o sin límite).
- Diez ambientes sintéticos, no grabaciones reales: mar, brisa, lluvia, bosque, cafetería, río, fogata, noche, ventilador y ruido marrón; además silencio.
- Metrónomo opcional a un pulso por segundo siguiendo la fase respiratoria, campanillas independientes y ajustes avanzados plegables.
- Pausa automática al cambiar de pestaña, inicio y reanudación manual, reducción de movimiento, volumen y estado de audio visible.
- Autoría enlazada a rodolfovalle.com/#sobre-mi, enlace a Atlas de emociones y página de privacidad específica.

## Instalación (PWA) y uso offline

`manifest.webmanifest` e iconos 192/512 permiten la instalación cuando el navegador lo admite. `sw.js` precarga una copia de los archivos de la aplicación **y los diez MP3** para que, una vez completada la primera instalación del trabajador de servicio, se pueda volver a abrir sin internet (una vez terminada la precarga de todos los recursos). La descarga inicial es de aproximadamente 3,5 MB de sonido más la aplicación. La app no recopila datos de uso, pero la caché técnica constituye almacenamiento del navegador. Puedes eliminarla borrando los datos del sitio.

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
- HTML y estilos renderizados sin desbordamiento horizontal en Chromium (DOM local) a 1366, 390, 375 y 320 px; campos numéricos y diez ambientes visibles.
- Inicio, pausa, continuación, finalización, modo Solo escuchar, preset cuadrado, segundos exactos 3/2/4/1, límites numéricos, audio decodificado, pantalla de ajustes y movimiento reducido.
- Diez MP3 (cinco previos + cinco nuevos): decodificación y reproducción verificadas en Chromium; los cinco sonidos nuevos tienen amplitud normalizada y bucle tratado. La escucha humana y Safari físico siguen pendientes.
- **Limitaciones:** el navegador del entorno bloquea la navegación a servidores locales y no permite completar una prueba real del service worker con red desconectada. La prueba de flujo usó HTML/CSS/JS insertados en Chromium. También siguen pendientes una prueba real en Safari iPhone, VoiceOver, pruebas de escucha y verificación de HTTPS/despliegue con la cuenta de DNS.

Documentación: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/ y https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

© 2026 Rodolfo Valle.

## Cambios de v4.0

- Presets respiratorios y cuatro inputs numéricos en segundos enteros, con límites 1–15 s para inhalar/exhalar y 0–15 s para pausas opcionales. El cronómetro de cada fase utiliza `performance.now()`; ajustes bloqueados durante ejecución/pausa para no alterar el ciclo a mitad de una sesión.
- La esfera permanece expandida durante la pausa tras inhalar y contraída durante la pausa tras exhalar. El metrónomo marca también los segundos de pausa con tono más discreto.
- Cinco pistas de audio sintetizadas añadidas localmente (río, fogata, noche, ventilador, ruido marrón), guardadas junto a los originales y precargadas para uso sin conexión por el trabajador de servicio.
- En pausas voluntarias no se recomienda forzar la respiración ni soportar incomodidad; se mantiene «Solo escuchar».

## Correcciones v4.1

- Presets verificados; disponibles antes de comenzar y durante una pausa. Al cambiar con sesión pausada, la siguiente reanudación comienza un ciclo nuevo sin reiniciar el temporizador general.
- **Respiración cuadrada animada**: un punto recorre cuatro lados siguiendo inhalación -> pausa con aire -> exhalación -> pausa sin aire. La esfera y la cuenta regresiva se mantienen. Funciona con cuatro intervalos iguales mayores que 0, incluso personalizados.
- Metrónomo más perceptible, con botón «▶ Probar» y recuperación si Web Audio tarda en activarse. El volumen general del dispositivo controla la audibilidad; el deslizador existente regula únicamente los ambientes.
- Caché offline `respirar-static-v4.1.0`: HTML, JS y CSS priorizan red cuando está disponible, preservando respaldo offline y evitando desincronización de versiones. En PWA previamente instalada, puede ser necesario cerrarla y abrirla de nuevo para que el service worker antiguo permita actualizar la interfaz.
