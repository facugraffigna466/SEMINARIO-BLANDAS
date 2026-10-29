# Modo Acompañado · Siempre Cerca

Prototipo navegable para el Demo Day.

## Cómo abrirlo en Visual Studio Code

1. En VS Code: **Archivo › Abrir carpeta…** y elegí `modo-acompanado`.
2. Instalá la extensión recomendada **Live Server** (VS Code la sugiere sola).
3. Clic derecho en `index.html` › **Open with Live Server**. Se abre en el navegador y se actualiza solo cada vez que guardás.

También funciona con doble clic en `index.html`.

## Cómo presentarlo

- La página ocupa toda la pantalla, como una web real. En el navegador, poné pantalla completa (⌃⌘F en Mac o F11 en Windows).
- El logo chico abajo a la izquierda abre la **Guía de la demo**: prender o apagar el Modo Acompañado, saltar a cualquier paso, elegir el caso del semáforo (verde, amarillo, rojo), el «Por qué esta pantalla» y la tabla de real vs. simulado. Se cierra con la ✕ o con Esc.

## Archivos

- `index.html`: la tienda a pantalla completa y el panel de la Guía de la demo.
- `css/estilos.css`: colores de la marca, tienda ficticia Mercadia y panel de Siempre Cerca.
- `js/app.js`: pantallas, recorrido, foco que resalta el próximo paso, semáforo Cerca, voz y llamada simulada.
- `img/logo-siempre-cerca.jpg`: logo.

## Qué cambiar fácil

- Nombre, dirección y familiar: objeto `USER` al principio de `js/app.js`.
- Producto y precios: objetos `PROD` y `GAR`.
- Textos del "Por qué esta pantalla": objeto `WHY`.

## Real vs. simulado

Funciona: recorrido completo, agrandar letra, esconder distracciones, resaltar el paso, voz en voz alta y "Tocar y escuchar".
Simulado: detección de la tienda, semáforo Cerca (3 casos), búsqueda por voz y llamadas.
Mercadia es una tienda ficticia: no compra, no cobra ni llama de verdad.
