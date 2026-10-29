/* =========================================================
   Modo Acompañado · Siempre Cerca
   Prototipo navegable para el Demo Day.
   Funciona: navegación, adaptación visual, foco, voz del navegador.
   Simulado: detección de la tienda, semáforo Cerca, búsqueda por voz, llamadas.
   ========================================================= */
(function () {
  "use strict";

  // ---------- Datos ----------
  const USER = { nombre: "Marta", hija: "Laura", calle: "Av. Colón 1450, dpto. 3", ciudad: "Córdoba", tarjeta: "Débito •••• 4821" };
  const PROD = { titulo: "Tensiómetro digital de brazo con memoria y pantalla grande", corto: "tensiómetro digital", precio: 29000, antes: 50000, off: 42, vendedor: "Salud Hogar", ventas: "+100 mil vendidos", rating: "4,8" };
  const GAR = { "1": { nombre: "1 año", precio: 5900 }, "1.5": { nombre: "1 año y medio", precio: 7400 }, "2": { nombre: "2 años", precio: 8900, antes: 10200 } };
  const ENVIO_SORPRESA = 8900;
  const LOGO = "img/logo-siempre-cerca.jpg";

  const PAGES = ["ofertas", "producto", "proteccion", "checkout", "listo"];
  const STEP = { ofertas: "Elegir", producto: "Revisar", proteccion: "Protección", checkout: "Pagar", listo: "Listo" };
  const URLS = { ofertas: "mercadia.com.ar/ofertas", producto: "mercadia.com.ar/tensiometro-digital-brazo", proteccion: "mercadia.com.ar/checkout/proteccion", checkout: "mercadia.com.ar/checkout/finalizar", listo: "mercadia.com.ar/compra/confirmada" };

  const ROUTE = [
    { id: "sin", label: "La tienda sin ayuda", tg: "hoy" },
    { id: "ofertas", label: "Detecta y elige", tg: "guiar" },
    { id: "producto", label: "Revisar producto", tg: "guiar" },
    { id: "proteccion", label: "Garantía marcada", tg: "verificar" },
    { id: "checkout", label: "Pago con Cerca", tg: "verificar" },
    { id: "llamada", label: "Ayuda humana", tg: "asistir" },
    { id: "listo", label: "Compra lista", tg: "cierre" }
  ];

  const WHY = {
    sin: { t: "Así ve Marta la tienda hoy", n: "Letra chica, banners, filtros, cupones, cookies y 10.000 productos en la primera pantalla.", d: "Mostramos la tienda tal cual es, sin tocar nada, para comparar.", f: "El contraste hace visible el problema: no es falta de ganas, es exceso de estímulos." },
    ofertas: { t: "Reconoce la tienda y la simplifica", n: "La persona mayor no encuentra lo que busca entre tantas opciones.", d: "Siempre Cerca se acopla a la derecha, agranda todo, esconde lo que distrae y resalta solo el producto buscado.", f: "No reemplazamos la tienda: la misma página, adaptada. Así sirve para cualquier tienda o banco." },
    producto: { t: "Lo importante, explicado", n: "Hay dos botones azules casi iguales y mucha información en letra chica.", d: "Un resumen con 4 datos en lenguaje simple y el foco sobre «Comprar ahora».", f: "Jerarquía visual: lo que define la compra va primero. Una acción por vez." },
    proteccion: { t: "Avisa lo que viene marcado", n: "La garantía extra ya aparece seleccionada y suma dinero sin que la persona lo pida.", d: "Cerca lo detecta, lo explica en voz alta y le recuerda que es opcional. Ella decide.", f: "Protegemos su dinero y su autonomía sin hacer las cosas por ella." },
    checkout: { t: "Cerca verifica antes de pagar", n: "Las estafas y los cobros sorpresa aparecen justo en el momento de pagar.", d: "Un semáforo revisa vendedor, forma de pago, dirección y total. En rojo bloquea y ofrece una persona.", f: "El semáforo es un código que todos conocen: convierte una verificación técnica en una decisión simple." },
    llamada: { t: "Una persona real, a un toque", n: "Cuando algo falla, la persona mayor queda sola y abandona.", d: "«Llamar» está siempre arriba a la derecha: a un familiar o a un operador que ve en qué paso está y le señala dónde tocar, sin ver sus claves.", f: "La ayuda humana es la red de seguridad que ninguna tienda ofrece hoy." },
    listo: { t: "Un cierre que da confianza", n: "Después de pagar queda la duda: ¿salió bien?", d: "Confirmación grande, resumen claro y la opción de contarle a un familiar.", f: "Terminar con certeza le da ganas de hacerlo sola la próxima vez." }
  };

  const CASE_HINT = {
    verde: "Vendedor verificado, pago dentro de la tienda y total igual al publicado.",
    amarillo: "Al final aparece un costo de envío de $ 8.900 que la publicación decía gratis.",
    rojo: "Llega un mensaje del «vendedor» pidiendo pagar por transferencia, fuera de la tienda."
  };

  // ---------- Estado ----------
  const S = {
    page: "ofertas", acomp: false, offer: true, gar: "1", garOk: null,
    caso: "verde", chatClosed: false, listen: false, voice: true, lvl: 1, said: null,
    sheet: false, call: null, listening: false, query: ""
  };

  const $ = (id) => document.getElementById(id);
  const $store = $("store");
  let tCall, tRing, tToast;

  // ---------- Utilidades ----------
  const money = (n) => "$ " + n.toLocaleString("es-AR");
  const garPrice = () => (S.garOk ? GAR[S.gar].precio : 0);
  const envio = () => (S.caso === "amarillo" ? ENVIO_SORPRESA : 0);
  const total = () => PROD.precio + garPrice() + envio();
  const strip = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // ---------- Íconos ----------
  const I = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11.2V5a2 2 0 1 1 4 0v4.5l5.1 1.1c1 .2 1.7 1.2 1.6 2.2l-.8 6A2.5 2.5 0 0 1 16.4 21h-5.1c-.7 0-1.4-.3-1.9-.9L5 15.2l1-1c.6-.6 1.5-.7 2.2-.3l.8.5z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm-2 16-4-4 1.4-1.4L10 14.2l6.6-6.6L18 9l-8 8z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5l-3-4zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13.5-9 2 2.5H17V9.5h2.5zM18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.4 11.6-9-9A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7c0 .6.2 1.1.6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8zM5.5 7A1.5 1.5 0 1 1 5.5 4a1.5 1.5 0 0 1 0 3z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>',
    hang: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9c-1.6 0-3.2.3-4.6.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.7 1.8a1 1 0 0 1-1.4 0L.3 13.1a1 1 0 0 1 0-1.4C3.3 8.8 7.5 7 12 7s8.7 1.8 11.7 4.7a1 1 0 0 1 0 1.4l-2.4 2.4a1 1 0 0 1-1.4 0c-.8-.7-1.7-1.3-2.7-1.8a1 1 0 0 1-.6-.9V9.7C15.2 9.3 13.6 9 12 9z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="#3466F6" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>'
  };
  const face = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 28a16 16 0 0 1 28 0" fill="none" stroke="#1F7560" stroke-width="3" stroke-linecap="round"/><path d="M11 28a10.5 10.5 0 0 1 18 0" fill="none" stroke="#1F7560" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="25" r="5" fill="#EE9B2A"/></svg>';

  // Ilustraciones de productos (genéricas)
  const ART = {
    tensio: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M70 22c22 0 38 10 38 30s-16 30-38 30" fill="none" stroke="#2D3440" stroke-width="16" stroke-linecap="round"/><path d="M70 82c0 12-6 18-16 22" fill="none" stroke="#2D3440" stroke-width="3"/><rect x="12" y="34" width="56" height="70" rx="12" fill="#F4F6F8" stroke="#2D3440" stroke-width="3"/><rect x="20" y="42" width="40" height="38" rx="5" fill="#CFE6F2"/><text x="40" y="58" font-family="Arial" font-weight="700" font-size="14" text-anchor="middle" fill="#1B2D4F">120</text><text x="40" y="74" font-family="Arial" font-weight="700" font-size="12" text-anchor="middle" fill="#1B2D4F">80</text><circle cx="40" cy="92" r="6" fill="#3466F6"/></svg>',
    hidro: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="34" y="34" width="46" height="58" rx="10" fill="#F2C230" stroke="#2D3440" stroke-width="3"/><circle cx="57" cy="56" r="12" fill="#2D3440"/><circle cx="40" cy="98" r="10" fill="#2D3440"/><circle cx="78" cy="98" r="10" fill="#2D3440"/><path d="M70 34V14h14" fill="none" stroke="#2D3440" stroke-width="5" stroke-linecap="round"/><path d="M30 70c-14 2-16 18-6 22" fill="none" stroke="#2D3440" stroke-width="4"/></svg>',
    espejo: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="22" y="14" width="76" height="92" rx="6" fill="#8796A8"/><rect x="28" y="20" width="64" height="80" rx="3" fill="#C9D6E2" stroke="#fff" stroke-width="3"/><path d="M40 30l30 0M40 90h20" stroke="#fff" stroke-width="2" opacity=".7"/></svg>',
    auri: '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M26 70V58a34 34 0 0 1 68 0v12" fill="none" stroke="#2D3440" stroke-width="8"/><rect x="18" y="64" width="20" height="34" rx="8" fill="#E8573F"/><rect x="82" y="64" width="20" height="34" rx="8" fill="#E8573F"/></svg>',
    pava: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="26" y="98" width="68" height="9" rx="4" fill="#2D3440"/><path d="M34 96 38 42q22-11 44 0l4 54z" fill="#C3CCD4" stroke="#2D3440" stroke-width="3"/><path d="M82 48q20 4 15 30-2 9-12 9" fill="none" stroke="#2D3440" stroke-width="6"/><rect x="50" y="30" width="20" height="9" rx="3" fill="#2D3440"/></svg>',
    silla: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="30" y="20" width="60" height="44" rx="10" fill="#3D6E9E"/><rect x="26" y="62" width="68" height="16" rx="6" fill="#2F5A84"/><path d="M36 78l-6 30M84 78l6 30M60 78v28" stroke="#2D3440" stroke-width="5" stroke-linecap="round"/></svg>'
  };

  // ---------- Tienda: piezas ----------
  function head(simple) {
    if (simple) {
      return `<header class="m-head simple"><div class="m-head-in">
        <div class="m-logo"><i>m</i>mercadia</div><span></span>
        <div class="m-user"><span><span class="av">MG</span>Marta</span><span class="hide-acomp">Ayuda</span></div>
      </div></header>`;
    }
    return `<header class="m-head"><div class="m-head-in">
      <div class="m-logo"><i>m</i>mercadia</div>
      <div class="m-search" data-say="Esta es la barra para buscar. Podés escribir lo que querés comprar, o pedírmelo con tu voz."><span>${S.query ? S.query : "Buscar productos, marcas y más…"}</span><span>⌕</span></div>
      <div class="m-promo">ENVÍO GRATIS <span>en tu primera compra</span></div>
      <nav class="m-nav"><span class="send">Enviar a<b>Córdoba 5000</b></span><span>Categorías ▾</span><span>Ofertas</span><span>Cupones</span><span>Supermercado</span><span>Moda</span><span>Vender</span><span>Ayuda</span>
        <span class="right"><span>Mis compras</span><span>Marta ▾</span><span>🛒</span></span></nav>
    </div></header>`;
  }

  function card(key, title, seller, price, old, off, extra, spot) {
    const say = `${title}. Cuesta ${money(price)}. Antes costaba ${money(old)}, por eso dice ${off} por ciento menos.`;
    return `<button type="button" class="m-card" ${spot ? 'data-spot="card" data-nav="producto"' : 'data-act="other-prod"'} data-say="${say}">
      <span class="img">${ART[key]}<span class="tagday">OFERTA DEL DÍA</span></span>
      <span class="body"><span class="t">${title}</span><span class="seller">${seller} ✔</span><span class="rate">★ 4,8 | +10 mil vendidos</span>
      <span class="old">${money(old)}</span><span class="price">${money(price)} <span class="off">${off}% OFF</span></span>
      <span class="cuotas hide-acomp">6 cuotas de ${money(Math.round(price / 5.2))}</span>${extra}</span></button>`;
  }

  const PAGE = {
    ofertas() {
      const cats = [["Todas las ofertas", "M5 12l7-7 7 7-7 7z", true], ["Ofertas relámpago", "M13 2 4 14h7l-1 8 9-12h-7z"], ["Precios imbatibles", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v10M9 9h5a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h5"], ["Celulares", "M8 2h8v20H8zM11 19h2"], ["Notebooks", "M4 5h16v11H4zM2 19h20"], ["Liquidación", "M6 7h12l-1 14H7zM9 7a3 3 0 0 1 6 0"]];
      return head(false) +
        `<section class="m-cats hide-acomp"><div class="m-cats-in"><div><h2>Ofertas</h2><p>¡Encontrá precios increíbles cada día!</p></div>
          ${cats.map((c) => `<div class="m-cat ${c[2] ? "on" : ""}"><svg viewBox="0 0 24 24"><path d="${c[1]}"/></svg>${c[0]}</div>`).join("")}</div></section>
        <div class="m-wrap"><div class="m-list">
          <aside class="m-side hide-acomp"><h4>Todas</h4><p>10.000 productos</p>
            <div class="full"><b>⚡FULL</b> te ahorra envíos<br><small>Con tu carrito de compras</small></div>
            <h4>Tipo de promoción</h4><ul><li>Oferta relámpago <span>(3063)</span></li><li>Oferta del día <span>(255)</span></li></ul>
            <h4>Categorías</h4><ul><li>Accesorios para vehículos <span>(712)</span></li><li>Agro <span>(143)</span></li><li>Alimentos y bebidas <span>(316)</span></li><li>Antigüedades <span>(24)</span></li><li>Arte y librería <span>(396)</span></li><li>Bebés <span>(249)</span></li><li>Belleza <span>(828)</span></li></ul></aside>
          <div class="m-grid">
            ${S.acomp ? "" : card("hidro", "Hidrolavadora eléctrica alta presión 2000 W con manguera", "HERRAMIENTAS DELTA", 161500, 299999, 46, '<span class="ver">$ 151.500 con cupón</span><span class="green-t">Llega gratis mañana <span class="full-t">⚡FULL</span></span>', false)}
            ${card("tensio", "Tensiómetro digital de brazo con memoria y pantalla grande", "SALUD HOGAR", 29000, 50000, 42, '<span class="green-t">Llega gratis el viernes <span class="full-t hide-acomp">⚡FULL</span></span>', true)}
            ${S.acomp ? card("pava", "Pava eléctrica 1,7 litros de acero", "HOGAR NORTE", 27500, 39000, 29, '<span class="green-t">Llega gratis el lunes</span>', false) : card("espejo", "Espejo LED táctil antiempañante 80x60 cm aluminio", "BAÑO DISEÑO", 99999, 195478, 48, '<span class="green-t">Llega gratis mañana <span class="full-t">⚡FULL</span></span><span class="cuotas">Disponible en 2 colores</span>', false)}
            ${S.acomp ? "" : card("auri", "Auriculares inalámbricos con cancelación de ruido", "SONIDO PRO", 18499, 32000, 42, '<span class="ver">Mismo precio en 3 cuotas</span>', false)}
            ${S.acomp ? "" : card("pava", "Pava eléctrica 1,7 litros de acero", "HOGAR NORTE", 27500, 39000, 29, '<span class="green-t">Llega gratis el lunes</span>', false)}
            ${S.acomp ? "" : card("silla", "Silla de escritorio ergonómica con apoyabrazos", "OFICINA YA", 74900, 128000, 41, '<span class="green-t">Envío gratis</span>', false)}
          </div></div></div>
        <div class="m-cookie hide-acomp"><span>Usamos cookies para mejorar tu experiencia en Mercadia. Consultá más en nuestro <span class="blue">Centro de Privacidad</span>.</span><button type="button" data-act="cookie">Aceptar cookies</button><button type="button" data-act="cookie">Configurar cookies</button></div>`;
    },

    producto() {
      return head(false) + `<div class="m-wrap">
        <div class="m-also hide-acomp"><b>También puede interesarte:</b> tensiómetro muñeca · oxímetro de dedo · balanza digital · termómetro infrarrojo</div>
        <div class="m-crumbs hide-acomp"><span>Volver | Salud y equipamiento médico › Tensiómetros › Digitales de brazo</span><span>Vender uno igual | Compartir</span></div>
        <div class="m-prod">
          <div class="m-thumbs hide-acomp"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div class="m-gallery">${ART.tensio}</div>
          <div class="m-info">
            <span class="store-link" data-say="Lo vende Salud Hogar. Es una tienda oficial y está verificada.">Visitá la Tienda oficial de Salud Hogar ✔</span>
            <span class="meta hide-acomp">Nuevo | +100 mil vendidos</span>
            <span class="badge-hot hide-acomp">MÁS VENDIDO</span>
            <h3>${PROD.titulo}</h3>
            <span class="stars" data-say="Tiene 4,8 estrellas sobre 5. Quiere decir que a la mayoría de los compradores les gustó.">4,8 ★★★★★ (2830)</span>
            <span class="old" style="color:#999;text-decoration:line-through">${money(PROD.antes)}</span>
            <span class="price" data-say="El precio es ${money(PROD.precio)}. Está ${PROD.off} por ciento más barato que antes.">${money(PROD.precio)} <span class="off">${PROD.off}% OFF</span></span>
            <span data-say="Podés pagarlo en 6 cuotas. Si pagás en una sola vez, son ${money(PROD.precio)}.">6 cuotas de $ 5.766</span>
            <span class="tax hide-acomp" data-say="Este dato es para trámites de impuestos. No cambia lo que pagás.">Precio sin impuestos nacionales: $ 23.967</span>
            <span class="coupon hide-acomp" data-say="Es un cupón de descuento. Es opcional y no hace falta para comprar.">🎟 $ 27.500 con cupón</span>
            <div class="feat hide-acomp"><b>Lo que tenés que saber de este producto</b><ul><li>Mide presión y pulso en 30 segundos.</li><li>Memoria para 2 personas, 60 mediciones cada una.</li><li>Brazalete de 22 a 42 cm.</li></ul></div>
          </div>
          <div class="m-buy">
            <p data-say="Te llega gratis el viernes a tu casa."><span class="green-t">Llega gratis el viernes</span> por ser tu primera compra</p>
            <p class="hide-acomp"><span class="green-t">Retirá gratis</span> a partir del viernes en correos y otros puntos</p>
            <p class="stock hide-acomp">Stock disponible</p>
            <p class="hide-acomp">Cantidad: <b>1 unidad</b> ▾ (+50 disponibles)</p>
            <button type="button" class="btn-m primary" data-spot="buy" data-nav="proteccion" data-say="Comprar ahora. Este es el botón para comprarlo.">Comprar ahora</button>
            <button type="button" class="btn-m soft" data-act="cart" data-say="Agregar al carrito. Este botón lo guarda para después, pero todavía no lo compra.">🛒 Agregar al carrito</button>
            <p class="shopinfo hide-acomp">Tienda oficial <span class="blue">Salud Hogar</span> ✔ · +250 mil ventas · Devolución gratis: 30 días desde que lo recibís.</p>
          </div>
        </div></div>`;
    },

    proteccion() {
      const opt = (k, rec) => {
        const g = GAR[k];
        return `<button type="button" class="opt ${S.gar === k ? "sel" : ""}" data-gar="${k}" data-say="Garantía extra de ${g.nombre}. Cuesta ${money(g.precio)} más.">
          <span class="radio"></span><span class="name">${g.nombre}</span>
          <span class="p">${g.antes ? `<s>${money(g.antes)}</s>` : ""}${money(g.precio)}${g.antes ? `<small>Ahorrás ${money(g.antes - g.precio)}</small>` : ""}</span>
          ${rec ? '<span class="rec">RECOMENDADO</span>' : ""}</button>`;
      };
      return head(true) + `<div class="m-white"><div class="m-prot">
        <h2>Agregá una protección</h2>
        <p style="margin:0">Extendé la garantía de fábrica por más tiempo y protegé tu producto contra fallas. <span class="blue hide-acomp">Ver detalles</span></p>
        <div class="for"><i>${ART.tensio}</i><div><small>Garantía extendida para:</small>${PROD.titulo}</div></div>
        <div data-spot="gar-actions" style="display:flex;flex-direction:column;gap:1em;padding-top:.6em">${opt("1")}${opt("1.5")}${opt("2", true)}
        <div class="actions"><p class="hide-acomp">Al agregar aceptás el envío del certificado de la garantía y los <span class="blue">Términos y condiciones</span>.</p>
          <button type="button" class="btn-m soft" data-act="gar-no" data-say="No, gracias. Seguís sin la garantía extra y no pagás de más.">No, gracias</button>
          <button type="button" class="btn-m primary" data-act="gar-add" data-say="Agregar. Suma la garantía extra a tu compra.">Agregar</button></div></div>
      </div></div>`;
    },

    checkout() {
      const lnGar = S.garOk ? `<div class="ln" data-say="Garantía extra de ${GAR[S.gar].nombre}: ${money(garPrice())}. La agregaste vos en el paso anterior."><span>Garantía extendida (1)</span><span>${money(garPrice())}</span></div>` : "";
      const lnEnv = S.caso === "amarillo"
        ? `<div class="ln" data-say="Envío: ${money(ENVIO_SORPRESA)}. Antes decía gratis."><span>Envío</span><span>${money(ENVIO_SORPRESA)}</span></div>`
        : `<div class="ln" data-say="El envío es gratis."><span>Envío</span><span><s style="color:#999">$ 20.650</s> <span class="green-t">Gratis</span></span></div>`;
      return head(true) + `<div class="m-check">
        <div>
          <h2>Finalizá tu compra</h2>
          <div class="m-item"><i>${ART.tensio}</i><div><span class="tagday hide-acomp">OFERTA DEL DÍA</span><div>${PROD.titulo}</div>${S.garOk ? '<small>🛡 Garantía extendida</small>' : ""}</div></div>
          <section class="m-box" data-spot="addr"><h4>Forma de entrega</h4>
            <div class="m-tabs hide-acomp"><span class="on">Envío<small>Gratis</small></span><span>Retiro<small>Gratis</small></span></div>
            <div class="m-addr" data-say="Te lo mandan a ${USER.calle}, en ${USER.ciudad}."><b>📍 ${USER.calle}</b><span class="blue">Cambiar dirección</span></div>
            <div class="m-tip hide-acomp">Revisá la dirección donde recibirás tu compra ✕</div>
            <div class="m-row"><span class="r"><span class="rd on"></span>Llega el viernes</span><span>${S.caso === "amarillo" ? money(ENVIO_SORPRESA) : '<span class="green-t">Gratis</span>'}</span></div>
            <div class="m-row hide-acomp"><span class="r"><span class="rd"></span>Llega entre el sábado y el lunes</span><span class="green-t">Gratis</span></div>
          </section>
          <section class="m-box"><h4>Medios de pago</h4>
            <div class="m-pay" data-say="Vas a pagar con tu tarjeta de débito terminada en 4821."><span class="m-row" style="padding:0"><span class="rd on"></span></span><span class="card">${I.card}</span>${USER.tarjeta} <small style="color:#777">· guardada</small></div>
            <div class="m-pay hide-acomp"><span class="card">${I.card}</span>Nueva tarjeta de crédito</div>
            <span class="blue hide-acomp">Mostrar todos</span>
          </section>
        </div>
        <aside class="m-sum" data-spot="sum"><h4>Resumen de compra</h4>
          <div class="ln" data-say="El producto sale ${money(PROD.antes)} sin descuento."><span>Producto</span><span>${money(PROD.antes)}</span></div>
          <div class="ln disc" data-say="Te descuentan ${money(PROD.antes - PROD.precio)} por la oferta."><span>Descuento del producto</span><span>- ${money(PROD.antes - PROD.precio)}</span></div>
          ${lnGar}${lnEnv}
          <div class="ln hide-acomp"><span class="blue">🎟 Ingresar código de cupón</span><span></span></div>
          <div class="ln tot" data-say="En total vas a pagar ${money(total())}."><span>Total</span><span>${money(total())}</span></div>
          <div class="save hide-acomp">Ahorraste ${money(PROD.antes - PROD.precio)}</div>
          <button type="button" class="btn-m primary" data-spot="pay" data-act="pay" data-say="Pagar y finalizar. Con este botón se hace el pago.">Pagar y finalizar</button>
        </aside>
      </div>
      ${S.caso === "rojo" && !S.chatClosed ? `<div class="m-chat" data-spot="chat"><header><span>Mensaje de «saludhogar_ventas»</span><button type="button" class="x" data-act="close-chat" aria-label="Cerrar mensaje">✕</button></header>
        <p>¡Hola Marta! 😊 Si me pagás por <b>transferencia</b> al alias <b>SALUD.HOGAR.PROMO</b> te hago 20% de descuento. Mandame el comprobante por WhatsApp y te lo despacho hoy.</p>
        <button type="button" class="btn-m" data-act="whatsapp">Ir a WhatsApp</button></div>` : ""}`;
    },

    listo() {
      return head(true) + `<div class="m-white"><div class="m-done">
        <span class="ok">${I.check}</span><h2>¡Listo! Tu compra está confirmada</h2>
        <p style="margin:0;color:#555">Te enviamos el detalle por correo.</p>
        <div class="m-box"><div class="m-item" style="margin:0"><i>${ART.tensio}</i><div><b>${PROD.titulo}</b><small>Llega el viernes a ${USER.calle} · Pagaste ${money(total())}</small></div></div></div>
      </div></div>`;
    }
  };

  // ---------- Panel Siempre Cerca ----------
  function scPanel() {
    const i = PAGES.indexOf(S.page);
    return `<aside class="sc" aria-label="Siempre Cerca">
      <div class="sc-top">
        <div class="sc-brand"><img src="${LOGO}" alt=""><div><b>Modo Acompañado</b><small>Te acompaño en Mercadia</small></div></div>
        <button type="button" class="sc-call" data-sc="open-call" aria-label="Llamar a alguien para que me ayude">${I.phone}Llamar</button>
      </div>
      <div class="sc-tools">
        <button type="button" class="tool" data-sc="voice" aria-pressed="${S.voice}">${I.speaker}Voz ${S.voice ? "activada" : "apagada"}</button>
        <button type="button" class="tool" data-sc="size" aria-label="Cambiar tamaño de letra"><span class="sizes"><span class="${S.lvl === 1 ? "on" : ""}" style="font-size:16px">A</span><span class="${S.lvl === 1.15 ? "on" : ""}" style="font-size:21px">A</span><span class="${S.lvl === 1.3 ? "on" : ""}" style="font-size:26px">A</span></span>Letra</button>
        <button type="button" class="tool" data-sc="listen" aria-pressed="${S.listen}">${I.hand}Tocar y escuchar</button>
      </div>
      ${S.page !== "listo" && !S.sheet && !S.call ? `<div class="sc-prog"><div class="lbl"><span>Paso ${i + 1} de 4</span><span>${STEP[S.page]}</span></div><div class="dots" style="grid-template-columns:repeat(4,1fr)">${[0, 1, 2, 3].map((k) => `<i class="${k < i ? "done" : k === i ? "now" : ""}"></i>`).join("")}</div></div>` : ""}
      <div class="sc-body">${S.call ? callView() : S.sheet ? callChooser() : stepView()}</div>
      <div class="sc-foot"><button type="button" class="sc-link" data-sc="back">Volver un paso</button><button type="button" class="sc-link" data-sc="off">Salir del modo</button></div>
    </aside>`;
  }

  function sayBlock(html) {
    return `<div class="say"><span class="face">${face}</span><div class="bubble">${html}</div></div>
      <button type="button" class="repeat" data-sc="repeat" data-text="${strip(html).replace(/"/g, "")}">${I.speaker}Escuchar de nuevo</button>`;
  }

  function listenBox() {
    if (!S.listen) return "";
    return `<div class="listen-box"><small>Tocar y escuchar</small>${S.said ? S.said : "Tocá cualquier cosa de la página (un precio, un botón, un cartel) y te explico qué es. Mientras esté activo, tocar no compra nada."}</div>`;
  }

  function kf(icon, b, p) { return `<div class="kf"><span class="ic">${icon}</span><p><b>${b}</b>${p}</p></div>`; }
  function chk(l, b, p) { const s = { v: "✓", a: "!", r: "✕" }[l]; return `<li><span class="mk ${l}" aria-hidden="true">${s}</span><span><b>${b}</b>${p}</span></li>`; }

  function guideText() {
    switch (S.page) {
      case "ofertas": return `Hola, ${USER.nombre}. Buscabas un <b>tensiómetro</b>. Lo encontré: es el que está <b>resaltado</b>. Tocalo para verlo.`;
      case "producto": return `Este es tu tensiómetro. Si te convence, tocá <b>«Comprar ahora»</b>. El otro botón lo guarda para después, pero no lo compra.`;
      case "proteccion": return `Ojo: te ofrecen una <b>garantía extra</b> y ya viene marcada. <b>No es obligatoria</b>. Si no la querés, tocá «No, gracias».`;
      case "checkout": return {
        verde: `Revisé todo y está <b>en orden</b>. Si estás de acuerdo, tocá <b>«Pagar y finalizar»</b>.`,
        amarillo: `<b>Antes de pagar, mirá esto:</b> el envío decía gratis y ahora cobra ${money(ENVIO_SORPRESA)}.`,
        rojo: S.chatClosed ? `Bien hecho: cerraste ese mensaje. Ahora sí, pagá con tu tarjeta <b>dentro de la tienda</b> con «Pagar y finalizar».` : `<b>No pagues por transferencia.</b> Ese mensaje no es de la tienda. Cerralo con la <b>✕</b>.`
      }[S.caso];
      case "listo": return `Tu compra salió bien. El tensiómetro llega el <b>viernes</b> y te aviso cuando esté en camino.`;
    }
    return "";
  }

  function stepView() {
    const g = guideText();
    if (S.page === "ofertas") {
      return sayBlock(g) +
        kf(I.shield, "Solo vendedores verificados", "Escondí publicidad, filtros y 9.998 productos que no buscabas.") +
        `<button type="button" class="sc-btn mic ${S.listening ? "on" : ""}" data-sc="mic"><span class="mi">${I.mic}</span>${S.listening ? "Te escucho…" : "Buscar otra cosa con mi voz"}</button>` + listenBox();
    }
    if (S.page === "producto") {
      return sayBlock(g) + `<div class="keyfacts"><h4>Lo importante</h4>
        ${kf(I.tag, "Cuesta " + money(PROD.precio), "Antes " + money(PROD.antes) + ". Podés pagarlo en una vez.")}
        ${kf(I.truck, "Llega gratis el viernes", "A " + USER.calle)}
        ${kf(I.shield, "Lo vende Salud Hogar", "Tienda oficial verificada · 4,8 estrellas")}
        ${kf(I.back, "Devolución gratis", "Tenés 30 días desde que te llega")}
      </div>` + listenBox();
    }
    if (S.page === "proteccion") {
      return sayBlock(g) +
        `<div class="alert amarillo"><div class="lamp"><i></i><i class="on a"></i><i></i></div><p><b>Suma ${money(GAR[S.gar].precio)} a tu compra</b>Tu tensiómetro ya trae 1 año de garantía de fábrica. La extra es solo si querés más tiempo.</p></div>` + listenBox();
    }
    if (S.page === "checkout") {
      const c = S.caso === "rojo" && S.chatClosed ? "verde" : S.caso;
      const lamp = `<div class="lamp"><i class="${c === "rojo" ? "on r" : ""}"></i><i class="${c === "amarillo" ? "on a" : ""}"></i><i class="${c === "verde" ? "on v" : ""}"></i></div>`;
      const head = { verde: ["Todo en orden", "Podés pagar tranquila."], amarillo: ["Revisá antes de pagar", "El total es más alto que lo que viste."], rojo: ["No pagues", "Te piden pagar por fuera de la tienda."] }[c];
      return sayBlock(g) +
        `<div class="alert ${c}">${lamp}<p><b>${head[0]}</b>${head[1]}</p></div>
        <ul class="checks">
          ${chk("v", "Vendedor", "Salud Hogar, tienda oficial verificada.")}
          ${c === "rojo" ? chk("r", "Forma de pago", "Un mensaje pide transferir a un alias personal. La tienda nunca pide eso.") : chk("v", "Forma de pago", USER.tarjeta + ", dentro de Mercadia.")}
          ${chk("v", "Dirección", USER.calle + ". ¿Es tu casa?")}
          ${c === "amarillo" ? chk("a", "Total " + money(total()), "Se sumó un envío de " + money(ENVIO_SORPRESA) + ".") : chk("v", "Total " + money(total()), S.garOk ? "Incluye la garantía extra que agregaste (" + money(garPrice()) + ")." : "Igual al precio publicado.")}
        </ul>
        ${c === "amarillo" ? `<button type="button" class="sc-btn line" data-sc="open-call">${I.phone}Consultar con una persona</button>` : ""}
        ${c === "rojo" ? `<button type="button" class="sc-btn primary" data-sc="call-op">${I.phone}Hablar con una persona ahora</button>` : ""}` + listenBox();
    }
    if (S.page === "listo") {
      return `<div class="done-hero"><span class="ok">${I.check}</span><p>¡Lo hiciste vos, ${USER.nombre}!</p></div>` +
        sayBlock(g) +
        `<div class="keyfacts">${kf(I.tag, "Pagaste " + money(total()), PROD.corto + (S.garOk ? " + garantía extra" : ""))}${kf(I.truck, "Llega el viernes", USER.calle)}</div>
        <button type="button" class="sc-btn primary" data-sc="tell">Contarle a ${USER.hija}</button>
        <button type="button" class="sc-btn line" data-sc="restart">Terminar</button>`;
    }
    return "";
  }

  function callChooser() {
    return `<p style="margin:0;font-size:22px;font-weight:700;line-height:1.2">¿A quién querés llamar?</p>
      <p style="margin:0;color:#4A5770">La persona va a ver en qué paso estás para ayudarte. No ve tus claves ni tu tarjeta.</p>
      <button type="button" class="who" data-sc="call" data-who="laura"><span class="av" style="background:#7A3E9D">L</span><span><b>${USER.hija}, tu hija</b><small>Contacto de confianza</small></span></button>
      <button type="button" class="who" data-sc="call" data-who="op"><span class="av" style="background:#1F7560">SC</span><span><b>Una persona de Siempre Cerca</b><small>Te atiende alguien real, de 8 a 22 h, sin costo</small></span></button>
      <button type="button" class="sc-btn line" data-sc="close-call">Cancelar</button>`;
  }

  function callLine() {
    const c = S.call;
    if (c.who === "laura") return "¡Hola, ma! Ya veo tu pantalla. Te marco en verde dónde tocar; vos lo hacés tranquila.";
    if (S.page === "checkout" && S.caso === "rojo") return S.chatClosed ? "Muy bien, Marta. Ahora pagá con tu tarjeta, dentro de Mercadia. Te señalo el botón." : "Hola, Marta, soy Sofía. Hiciste muy bien en no transferir: ese alias no es de la tienda. Cerrá ese mensaje con la cruz; te lo señalo.";
    if (S.page === "checkout" && S.caso === "amarillo") return "Hola, Marta, soy Sofía. El envío pasó a costar " + money(ENVIO_SORPRESA) + ". Si preferís, elegimos retirarlo gratis en el correo. Vos decidís.";
    if (S.page === "proteccion") return "Hola, Marta, soy Sofía. La garantía extra es opcional. Si no la querés, tocá «No, gracias», te lo marco en verde.";
    return "Hola, Marta, soy Sofía de Siempre Cerca. Veo que estás en «" + STEP[S.page] + "». Contame tu duda; te marco en verde dónde tocar.";
  }

  function callView() {
    const c = S.call, op = c.who === "op";
    const on = c.phase === "on";
    const tm = Math.floor(c.secs / 60) + ":" + String(c.secs % 60).padStart(2, "0");
    return `<div class="call">
      <span class="av ${on ? "" : "ring"}" style="background:${op ? "#1F7560" : "#7A3E9D"}">${op ? "SC" : "L"}</span>
      <h4>${op ? "Sofía · Siempre Cerca" : USER.hija + ", tu hija"}</h4>
      <p class="st" id="call-st">${on ? "En llamada · " + tm : "Llamando…"}</p>
      ${on ? `<div class="share"><i></i>${op ? "Sofía" : USER.hija} ve tu pantalla y te señala dónde tocar. No ve tus claves.</div><div class="line">${callLine()}</div>` : ""}
      <div class="call-actions"><button type="button" class="round hang" data-sc="hang"><span>${I.hang}</span>Cortar</button></div>
    </div>`;
  }

  // ---------- Oferta (modo apagado) ----------
  function offerView() {
    if (S.offer) {
      return `<div class="sc-offer" role="dialog" aria-labelledby="offer-t">
        <div class="hd"><img src="${LOGO}" alt="">Siempre Cerca</div>
        <h3 id="offer-t">Entraste a Mercadia, una tienda online.</h3>
        <p>¿Querés que te acompañe? Agrando la letra, te muestro un paso por vez y reviso todo antes de pagar.</p>
        <button type="button" class="sc-btn primary" data-sc="on">${I.check}Sí, acompañame</button>
        <button type="button" class="sc-btn line" data-sc="dismiss">Ahora no</button>
      </div>`;
    }
    return `<button type="button" class="sc-fab" data-sc="on"><img src="${LOGO}" alt="">Acompañame</button>`;
  }

  // ---------- Render ----------
  function render(keepScroll) {
    const prevScroll = keepScroll && $store.querySelector(".site") ? $store.querySelector(".site").scrollTop : 0;
    $store.className = "store" + (S.acomp ? " acomp" : "") + (S.acomp && S.listen ? " listen" : "");
    $store.style.setProperty("--lvl", S.lvl);
    $store.innerHTML = `<div class="site"><div class="site-inner">${PAGE[S.page]()}<div class="spot" id="spot" hidden><span class="spot-tag" id="spot-tag">Tocá acá</span></div></div>${S.acomp ? "" : offerView()}</div>${S.acomp ? scPanel() : ""}`;
    const site = $store.querySelector(".site");
    site.scrollTop = prevScroll;
    site.addEventListener("scroll", placeSpot, { passive: true });
    document.title = (S.acomp ? "Modo Acompañado · " : "") + "Mercadia";
    $("sw-mode").setAttribute("aria-checked", String(S.acomp));
    $("mode-state").textContent = S.acomp ? "Activado" : "Apagado";
    renderControls();
    requestAnimationFrame(() => { placeSpot(true); });
  }

  function spotTarget() {
    if (!S.acomp || S.sheet || (S.call && S.call.phase !== "on")) return null;
    const map = { ofertas: "card", producto: "buy", proteccion: S.call ? "gar-actions" : "gar-actions", checkout: S.caso === "rojo" && !S.chatClosed ? "chat" : "pay" };
    const key = map[S.page];
    return key ? $store.querySelector('[data-spot="' + key + '"]') : null;
  }

  function placeSpot(scrollInto) {
    const spot = $("spot");
    if (!spot) return;
    const el = spotTarget();
    if (!el) { spot.hidden = true; return; }
    const inner = $store.querySelector(".site-inner");
    const scale = currentScale();
    const r = el.getBoundingClientRect(), b = inner.getBoundingClientRect();
    const pad = 8;
    const top = (r.top - b.top) / scale - pad, left = (r.left - b.left) / scale - pad;
    spot.style.transform = "translate(" + left + "px," + top + "px)";
    spot.style.width = r.width / scale + pad * 2 + "px"; spot.style.height = r.height / scale + pad * 2 + "px";
    spot.hidden = false;
    spot.classList.toggle("remote", !!(S.call && S.call.phase === "on"));
    spot.classList.toggle("below", top < 60);
    const tags = { card: "Tocá acá para verlo", buy: "Tocá «Comprar ahora»", "gar-actions": "Elegí vos: con o sin garantía", pay: "Tocá para pagar", chat: "Cuidado: esto no es la tienda. Cerralo con la ✕" };
    $("spot-tag").textContent = S.call && S.call.phase === "on" ? (S.call.who === "op" ? "Sofía te señala esto" : S.call.who === "laura" ? "Laura te señala esto" : "") : tags[el.dataset.spot] || "Tocá acá";
    if (scrollInto === true) {
      const site = $store.querySelector(".site");
      const vh = site.clientHeight;
      if (top < site.scrollTop + 40 || top + r.height / scale > site.scrollTop + vh - 60) site.scrollTop = Math.max(0, top - 140);
    }
  }

  function renderControls() {
    const active = !S.acomp ? "sin" : S.call ? "llamada" : S.page;
    $("route").innerHTML = ROUTE.map((r, i) => `<li><button type="button" data-route="${r.id}" ${r.id === active ? 'aria-current="step"' : ""}><span class="n">${i + 1}</span>${r.label}<span class="tg">${r.tg}</span></button></li>`).join("");
    document.querySelectorAll("#case-seg .seg-btn").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.case === S.caso)));
    $("case-hint").textContent = CASE_HINT[S.caso];
    const w = WHY[active];
    $("why").innerHTML = `<h3>Por qué esta pantalla</h3><p class="t">${w.t}</p><dl><dt>Necesidad</dt><dd>${w.n}</dd><dt>Decisión</dt><dd>${w.d}</dd><dt>Fundamento</dt><dd>${w.f}</dd></dl>`;
  }

  // ---------- Escala de la ventana ----------
  function currentScale() { return 1; }
  window.addEventListener("resize", () => placeSpot());

  // ---------- Voz (real, del navegador) ----------
  let speakingBtn = null;
  function speak(text, force) {
    try {
      if (!("speechSynthesis" in window)) { if (force) toast("Este navegador no puede leer en voz alta."); return; }
      if (!S.voice && !force) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR"; u.rate = 0.92; u.pitch = 1;
      const v = synth.getVoices();
      const pick = v.find((x) => /es[-_](AR|UY)/i.test(x.lang)) || v.find((x) => /es[-_](419|MX|US)/i.test(x.lang)) || v.find((x) => /^es/i.test(x.lang));
      if (pick) u.voice = pick;
      const btn = $store.querySelector(".repeat");
      if (btn) { btn.classList.add("is-on"); speakingBtn = btn; }
      u.onend = u.onerror = () => { if (speakingBtn) speakingBtn.classList.remove("is-on"); };
      synth.speak(u);
    } catch (e) { /* sin voz */ }
  }
  function hush() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
  const speakStep = () => setTimeout(() => speak(strip(guideText())), 250);

  // ---------- Acciones ----------
  function goPage(p) {
    S.page = p; S.said = null; S.sheet = false;
    render();
    const site = $store.querySelector(".site"); if (site) site.scrollTop = 0;
    requestAnimationFrame(() => placeSpot(true));
    if (S.acomp && !S.call) speakStep();
  }

  function setAcomp(on) {
    S.acomp = on; S.offer = false;
    if (!on) { S.listen = false; S.sheet = false; endCall(true); hush(); }
    render();
    if (on) speakStep();
  }

  function startCall(who) {
    clearTimeout(tRing); clearInterval(tCall); hush();
    S.sheet = false; S.call = { who, phase: "ring", secs: 0 };
    render(true);
    tRing = setTimeout(() => {
      if (!S.call) return;
      S.call.phase = "on"; render(true);
      speak(callLine(), true);
      tCall = setInterval(() => {
        if (!S.call) return clearInterval(tCall);
        S.call.secs++;
        const st = $("call-st"); if (st) st.textContent = "En llamada · " + Math.floor(S.call.secs / 60) + ":" + String(S.call.secs % 60).padStart(2, "0");
      }, 1000);
    }, 2000);
  }
  function endCall(silent) {
    clearTimeout(tRing); clearInterval(tCall);
    const had = !!S.call; S.call = null;
    if (!silent) { hush(); render(true); if (had) toast("Llamada terminada. Seguís en el mismo paso."); }
  }

  function toast(msg) {
    clearTimeout(tToast);
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    tToast = setTimeout(() => { t.hidden = true; }, 2800);
  }

  function voiceSearch() {
    if (S.listening) return;
    S.listening = true; S.query = ""; render(true);
    const target = "tensiómetro"; let i = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        i++; S.query = target.slice(0, i);
        const sp = $store.querySelector(".m-search span"); if (sp) sp.textContent = S.query;
        if (i >= target.length) { clearInterval(iv); S.listening = false; render(true); speak("Busqué tensiómetro. Es el que está resaltado."); }
      }, 80);
    }, 700);
  }

  function pay() {
    if (S.acomp && S.caso === "rojo" && !S.chatClosed) {
      toast("Siempre Cerca: primero cerrá ese mensaje. Si querés, te ayuda una persona.");
      speak("Antes de pagar, no respondas ese mensaje. Si querés, te comunico con una persona.");
      return;
    }
    goPage("listo");
  }

  function restart() {
    hush(); endCall(true);
    Object.assign(S, { chatClosed: false, page: "ofertas", acomp: false, offer: true, gar: "1", garOk: null, listen: false, lvl: 1, said: null, sheet: false, call: null, listening: false, query: "" });
    render();
    const site = $store.querySelector(".site"); if (site) site.scrollTop = 0;
  }

  // Clicks dentro de la tienda y del panel
  $store.addEventListener("click", (e) => {
    const scBtn = e.target.closest("[data-sc]");
    if (scBtn) return onSc(scBtn);

    // Tocar y escuchar: explica en vez de actuar
    if (S.acomp && S.listen) {
      const sayEl = e.target.closest("[data-say]");
      if (sayEl && $store.querySelector(".site").contains(sayEl)) {
        e.preventDefault(); e.stopPropagation();
        S.said = sayEl.dataset.say;
        speak(S.said, true);
        render(true);
        return;
      }
    }

    const t = e.target.closest("[data-nav],[data-act],[data-gar]");
    if (!t) return;
    if (t.dataset.nav) return goPage(t.dataset.nav);
    if (t.dataset.gar) { S.gar = t.dataset.gar; render(true); return; }
    switch (t.dataset.act) {
      case "gar-no": S.garOk = false; goPage("checkout"); break;
      case "gar-add": S.garOk = true; goPage("checkout"); break;
      case "pay": pay(); break;
      case "cart": toast("Se guardó en el carrito. Todavía no lo compraste."); break;
      case "cookie": toast("En la demo, este aviso aparece siempre."); break;
      case "other-prod": toast("En la demo, probá con el tensiómetro."); break;
      case "close-chat": S.chatClosed = true; render(true); if (S.acomp && !S.call) speakStep(); break;
      case "whatsapp": toast(S.acomp ? "Siempre Cerca bloqueó este enlace: no es de la tienda." : "Así empiezan muchas estafas. Con Modo Acompañado, Cerca lo frena."); break;
    }
  });

  function onSc(b) {
    switch (b.dataset.sc) {
      case "on": setAcomp(true); break;
      case "off": setAcomp(false); break;
      case "dismiss": S.offer = false; render(true); break;
      case "voice": S.voice = !S.voice; if (!S.voice) hush(); render(true); if (S.voice) speak("Voz activada.", true); break;
      case "size": S.lvl = S.lvl === 1 ? 1.15 : S.lvl === 1.15 ? 1.3 : 1; render(true); break;
      case "listen": S.listen = !S.listen; S.said = null; render(true); if (S.listen) speak("Tocá cualquier cosa de la página y te explico qué es.", true); break;
      case "repeat": speak(b.dataset.text, true); break;
      case "mic": voiceSearch(); break;
      case "open-call": S.sheet = true; hush(); render(true); break;
      case "close-call": S.sheet = false; render(true); break;
      case "call": startCall(b.dataset.who); break;
      case "call-op": startCall("op"); break;
      case "hang": endCall(false); break;
      case "back": { const i = PAGES.indexOf(S.page); if (i > 0) goPage(PAGES[i - 1]); break; }
      case "tell": toast("Le contamos a " + USER.hija + " que compraste el tensiómetro."); break;
      case "restart": restart(); break;
    }
  }

  // Controles de la demo
  $("sw-mode").addEventListener("click", () => setAcomp(!S.acomp));
  $("btn-reset").addEventListener("click", restart);
  $("case-seg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-case]"); if (!b) return;
    S.caso = b.dataset.case; S.chatClosed = false;
    if (S.page !== "checkout") { if (S.garOk === null) S.garOk = false; S.acomp = true; S.offer = false; goPage("checkout"); }
    else { render(true); if (S.acomp) speakStep(); }
  });
  $("route").addEventListener("click", (e) => {
    const b = e.target.closest("[data-route]"); if (!b) return;
    const id = b.dataset.route;
    endCall(true); hush();
    if (id === "sin") { S.acomp = false; S.offer = false; S.listen = false; goPage("ofertas"); return; }
    if (id === "llamada") {
      S.acomp = true; S.offer = false;
      if (S.page === "ofertas" || S.page === "listo") { S.caso = "rojo"; if (S.garOk === null) S.garOk = false; S.page = "checkout"; }
      render(); startCall("op"); return;
    }
    if (id === "checkout" && S.garOk === null) S.garOk = false;
    if (id === "listo" && S.garOk === null) S.garOk = false;
    S.acomp = true; S.offer = false;
    goPage(id);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!$pres.hidden) setPres(false); else if (S.call) endCall(false); else if (S.sheet) { S.sheet = false; render(true); } }
  });

  try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (e) {}
  // Guía de la demo
  const $pres = $("pres"), $presOpen = $("pres-open");
  function setPres(open) { $pres.hidden = !open; $presOpen.hidden = open; $presOpen.setAttribute("aria-expanded", String(open)); if (open) $("pres-close").focus(); else $presOpen.focus(); }
  $presOpen.addEventListener("click", () => setPres(true));
  $("pres-close").addEventListener("click", () => setPres(false));

  render();
})();
