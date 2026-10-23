# RESPIRAR v3.1 — Rodolfo Valle

Aplicación psicoeducativa gratuita de respiración guiada y ambientes sonoros. Publicación estática en GitHub Pages con HTML/CSS/JavaScript, sin cuentas, formularios clínicos, analíticas, cookies propias ni dependencias de JavaScript externas.

Sitio previsto: https://respirar.rodolfovalle.com/  
Autor: https://rodolfovalle.com/

## Funciones de v3.1

- Guía respiratoria con ritmos **3 / 4 s (predeterminado)**, 4 / 4 s y 4 / 6 s; sin retenciones obligatorias.
- **Metrónomo suave activado por defecto para el modo Respirar:** un pulso cada segundo del mismo ciclo que utiliza la esfera. Los tonos distinguen inhalación y exhalación, con un pequeño acento al cambiar de fase. Se puede silenciar en cualquier momento desde *Mostrar ajustes*.
- Campanillas de transición independientes, desactivadas por defecto.
- Modo *Solo escuchar* sin instrucciones respiratorias y sin metrónomo, con temporizador o sin límite.
- Sonidos locales sintéticos de mar, brisa, lluvia, bosque y cafetería, además de silencio. MP3 recodificados desde los WAV maestros a **112 kb/s mono** para reducir artefactos de compresión; no son grabaciones reales.
- Contador, pausa, continuar, terminar, transición del sonido ambiental, volumen y animación opcional.
- Estado de audio visible también durante la sesión inmersiva: preparación, reproducción, pausa y fallos de reproducción.
- Ajustes de contraste de texto y reducción de la altura en móvil para que el botón de inicio aparezca en una pantalla emulada de 390 × 844.
- Respetar `prefers-reduced-motion`; detener sonido y metrónomo al ocultar pestaña. No inicia reproducción hasta que la persona pulsa Comenzar.

## Privacidad

La app no transmite respuestas personales ni guarda sesiones. Las peticiones normales al alojamiento GitHub Pages sí pueden generar registros técnicos del servidor. Los audios se solicitan a este mismo dominio cuando se inicia la sesión con ambiente seleccionado.

## Seguridad y límites

Recurso de acompañamiento y educación; no equivale a tratamiento psicológico, atención de urgencia ni garantía de regulación emocional. No fuerces ni retengas la respiración; usa *Solo escuchar* si centrarte en respirar te incomoda. Detén el ejercicio si aparece mareo, angustia o malestar.

## Publicación en GitHub Pages

Repositorio `rbvk/Respirar`, rama `main` y carpeta raíz. `CNAME` apunta a `respirar.rodolfovalle.com`. El DNS del host `respirar` debe apuntar mediante CNAME a `rbvk.github.io`. La presencia de `CNAME` no establece DNS ni habilita Pages: verifícalo en **Settings > Pages**. Para pruebas locales, ejecuta `python3 -m http.server 8000` en esta carpeta.

## Verificación

- Código JS validado con `node --check`.
- Pruebas automatizadas Chromium con HTML y CSS reales y MP3 reales para inicio, duración, ritmos, pulso por segundo, sincronización de 3/4, pausa, reanudación, interrupción y modo *Solo escuchar*.
- Reproducción y decodificación MP3 de mar, botones de volumen y estado audio en modo inmersivo.
- Pantallas emuladas a 1440, 390, 375 y 320 px sin desplazamiento horizontal; CTA visible sin desplazamiento a 390 × 844.
- Movimiento reducido validado en Chromium.
- Se corrigieron textos de contraste inferior a WCAG AA. No se declara que exista certificación completa WCAG ni pruebas con tecnología de asistencia física.
- **No se ha podido ejecutar Safari en un iPhone físico**: falta la prueba en dispositivo antes de asegurar compatibilidad móvil real.

© 2026 Rodolfo Valle. Los audios fueron sintetizados específicamente para Respirar; no son muestras de terceros.
