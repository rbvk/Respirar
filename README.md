# RESPIRAR v3.0 — Rodolfo Valle

Webapp estática de respiración guiada y ambientes sonoros en español chileno. Creada para publicación en **GitHub Pages**, sin dependencias de terceros ni backend.

## Funciones

- **Respirar:** ritmos cómodos de 3/4, 4/4 y 4/6 segundos (inhalar/exhalar), sin retención del aire.
- **Solo escuchar:** paisajes sonoros sin indicaciones respiratorias, con temporizador de 1, 3, 5 o 10 minutos o sin límite.
- Cinco ambientes propios: mar, brisa, lluvia, bosque y cafetería; silencio disponible.
- Volumen, pausa, continuar, finalizar, campanillas opcionales, esfera accesible y modo inmersivo.
- El audio se descarga de este sitio **solo cuando la persona comienza una sesión con sonido**, no al cargar la página.
- `visibilitychange` pausa la sesión y **silencia inmediatamente** al ocultarse la pestaña; se reanuda manualmente.
- Sin cookies propias, localStorage, registro de sesiones, analíticas, cuentas ni integraciones externas.

## Instalación rápida en GitHub Pages

1. Crea un **repositorio público** nuevo, por ejemplo `respirar`, en tu cuenta de GitHub.
2. Descomprime el ZIP de publicación. En el repositorio, pulsa **Add file > Upload files** y arrastra los archivos **y la carpeta `assets`**, conservando su estructura. Verifica que `index.html` quede en la **raíz** y que los MP3 estén en `assets/audio/`.
3. Confirma la subida/commit.
4. En el repositorio entra a **Settings > Pages > Build and deployment** y selecciona `Deploy from a branch`, rama `main`, carpeta `/(root)`. Guarda.
5. En **Settings > Pages > Custom domain** configura `respirar.rodolfovalle.com`.
6. En el proveedor DNS de `rodolfovalle.com`, crea el registro `CNAME` de host `respirar` apuntando a **`TU_USUARIO.github.io`** (sin `/respirar` ni `https://`). **No inventes el nombre de usuario**; usa exactamente el propietario real del repositorio.
7. Tras la validación DNS y expedición del certificado, activa `Enforce HTTPS` cuando esté disponible. Comprueba la web real en Safari iOS y Chrome.

El archivo `CNAME` del ZIP ya contiene el subdominio recomendado. **No cambia el DNS por sí solo**. La URL y metadatos SEO asumen que publicarás en ese subdominio: si eliges otro, modifica `index.html`, `CNAME`, `robots.txt` y `sitemap.xml`.

GitHub Docs: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Publicación desde macOS, alternativamente

Sube los archivos por GitHub web según los pasos previos. **No subas el ZIP como único archivo:** Pages necesita `index.html`, `app.js`, `styles.css` y los MP3 extraídos.

Para una prueba local con navegador, desde la carpeta descomprimida:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000/`. Abrir `index.html` con doble clic (`file://`) puede impedir la carga de audio por políticas de seguridad del navegador.

## Licencias, procedencia del audio y privacidad

Los cinco MP3 incluidos fueron **generados de forma original y procedural específicamente para esta versión**. No son grabaciones reales de olas, de un bosque o de personas conversando; tampoco son los MP3 de SFXMint utilizados mediante enlaces en la v2. No se atribuye falsamente procedencia CC0 a estos MP3.

El generador original está disponible a solicitud (Python, NumPy, SciPy y SoundFile) y permite producir los cinco ambientes sin muestras de terceros. Los MP3 distribuidos son parte de este proyecto de Rodolfo Valle.

La app no solicita información clínica ni almacena preferencias. Las solicitudes web normales sí son procesadas por **GitHub Pages** como servicio de alojamiento: no debe afirmarse que no se transmiten datos técnicos de navegación.

**Advertencia:** recurso psicoeducativo, no tratamiento individualizado. Se recomienda respirar de manera natural y suspender en caso de mareos o aumento del malestar. La opción Solo escuchar no exige centrarse en la respiración.

## Validación

Pruebas automatizadas realizadas con Chromium en entorno controlado: inicio, fin, pausa, reanudación, cambio de ambiente, decodificación de los MP3 reales, volumen, modo sin límite, reducción de movimiento, ocultación de la pestaña, falla de audio, móvil 390 px, inexistencia de dependencias de terceros en el código. **Safari en dispositivo físico y GitHub Pages publicado siguen pendientes de pruebas**.

© 2026 Rodolfo Valle · [rodolfovalle.com](https://rodolfovalle.com/)

## Optimización de publicación (GitHub)

Los cinco paisajes sonoros se codificaron a MP3 mono de 64 kb/s (a partir de los WAV originales) para reducir el peso de transferencia. Sus fuentes WAV originales se conservan en el paquete v3 disponible en esta conversación.
