<script>
  import Welcome from "./pages/Welcome.svelte";
  import Login from "./pages/Login.svelte";
  import Register from "./pages/Register.svelte";
  import Home from "./pages/Home.svelte";
  import Partidos from "./pages/Partidos.svelte";
  import CrearPartido from "./pages/CrearPartido.svelte";
  import EditarPartido from "./pages/EditarPartido.svelte";
  import DetallePartido from "./pages/DetallePartido.svelte";
  import Amigos from "./pages/Amigos.svelte";
  import Equipos from "./pages/Equipos.svelte";
  import CrearEquipo from "./pages/CrearEquipo.svelte";
  import { tieneSesionActiva } from "./lib/api.js";

  // Únicas rutas públicas sin sesión
  const VISTAS_PUBLICAS = ["welcome", "login", "register"];

  let currentView = $state("welcome");
  let navOptions = $state({});

  // 1. Convierte la URL actual del navegador en { view, options }
  function parsearUrlActual() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(window.location.search);

    if (path === "/" || path === "/welcome") {
      return { view: "welcome", options: {} };
    }
    if (path === "/login") {
      return { view: "login", options: {} };
    }
    if (path === "/register") {
      return { view: "register", options: {} };
    }
    if (path === "/home") {
      return { view: "home", options: {} };
    }
    if (path === "/crear-partido") {
      return { view: "crear-partido", options: {} };
    }
    if (path.startsWith("/partidos/") && path.endsWith("/editar")) {
      const eventoId = decodeURIComponent(
        path.slice("/partidos/".length, -"/editar".length),
      );
      return { view: "editar-partido", options: { eventoId } };
    }
    if (path.startsWith("/partidos/")) {
      const eventoId = decodeURIComponent(path.slice("/partidos/".length));
      return { view: "detalle-partido", options: { eventoId } };
    }
    if (path === "/partidos") {
      return {
        view: "partidos",
        options: { tab: params.get("tab") || "mios" },
      };
    }
    if (path === "/amigos") {
      return { view: "amigos", options: {} };
    }
    if (path === "/equipos") {
      return {
        view: "equipos",
        options: { tab: params.get("tab") || "mios" },
      };
    }
    if (path === "/crear-equipo") {
      return { view: "crear-equipo", options: {} };
    }

    // Si escribe cualquier otra ruta privada (ej: /reservas, /torneos), se trata como ruta protegida
    return { view: "home", options: {} };
  }

  // 2. Convierte { view, options } en la URL del navegador
  function construirUrl(view, options = {}) {
    switch (view) {
      case "welcome":
        return "/welcome";
      case "login":
        return "/login";
      case "register":
        return "/register";
      case "home":
        return "/home";
      case "crear-partido":
        return "/crear-partido";
      case "editar-partido":
        return options.eventoId
          ? `/partidos/${encodeURIComponent(options.eventoId)}/editar`
          : "/partidos";
      case "detalle-partido":
        return options.eventoId
          ? `/partidos/${encodeURIComponent(options.eventoId)}`
          : "/partidos";
      case "partidos": {
        const tab =
          options.tab && options.tab !== "mios" ? `?tab=${options.tab}` : "";
        return `/partidos${tab}`;
      }
      case "amigos":
        return "/amigos";
      case "equipos":
        return "/equipos";
      case "crear-equipo":
        return "/crear-equipo";
      default:
        return "/home";
    }
  }

  // 3. MIDDLEWARE / GUARDIÁN DE AUTENTICACIÓN
  function evaluarMiddleware(vistaSolicitada, opcionesSolicitadas = {}) {
    const logueado = tieneSesionActiva();
    const esPublica = VISTAS_PUBLICAS.includes(vistaSolicitada);

    // A) Si NO está logueado e intenta entrar a una página privada:
    // Guardamos a dónde quería ir originalmente y lo mandamos a /login
    if (!logueado && !esPublica) {
      sessionStorage.setItem(
        "playtime_redirect",
        JSON.stringify({
          view: vistaSolicitada,
          options: opcionesSolicitadas,
        }),
      );
      return { view: "login", options: {}, redirigido: true };
    }

    // B) Si YA está logueado:
    if (logueado) {
      // Si había una ruta pendiente guardada antes del login, lo llevamos ahí
      const pendienteRaw = sessionStorage.getItem("playtime_redirect");
      if (pendienteRaw) {
        sessionStorage.removeItem("playtime_redirect");
        try {
          const destino = JSON.parse(pendienteRaw);
          if (destino?.view && !VISTAS_PUBLICAS.includes(destino.view)) {
            return {
              view: destino.view,
              options: destino.options || {},
              redirigido: true,
            };
          }
        } catch {
          // Si falla el parseo, sigue normalmente
        }
      }

      // Si ya está logueado e intenta ir a /welcome, /login o /register -> va a /home
      if (esPublica) {
        return { view: "home", options: {}, redirigido: true };
      }
    }

    return {
      view: vistaSolicitada,
      options: opcionesSolicitadas,
      redirigido: false,
    };
  }

  // 4. Función central de navegación
  function navigate(view, options = {}, reemplazarHistorial = false) {
    const decision = evaluarMiddleware(view, options);
    currentView = decision.view;
    navOptions = decision.options;

    const nuevaUrl = construirUrl(decision.view, decision.options);
    const urlActual = window.location.pathname + window.location.search;

    if (urlActual !== nuevaUrl) {
      if (reemplazarHistorial || decision.redirigido) {
        window.history.replaceState(
          { view: decision.view, options: decision.options },
          "",
          nuevaUrl,
        );
      } else {
        window.history.pushState(
          { view: decision.view, options: decision.options },
          "",
          nuevaUrl,
        );
      }
    }
  }

  // 5. Inicializar al cargar la página y escuchar botones Atrás/Adelante (R-27 cleanup)
  $effect(() => {
    function sincronizarDesdeUrl() {
      const { view, options } = parsearUrlActual();
      navigate(view, options, true);
    }

    sincronizarDesdeUrl();
    window.addEventListener("popstate", sincronizarDesdeUrl);

    return () => {
      window.removeEventListener("popstate", sincronizarDesdeUrl);
    };
  });
</script>

<!-- H-51: Skip link accesible para usuarios de teclado -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-[2000] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md shadow-lg"
>
  Saltar al contenido principal
</a>

<div id="main-content">
  {#if currentView === "welcome"}
    <Welcome onNavigate={navigate} />
  {:else if currentView === "login"}
    <Login onNavigate={navigate} />
  {:else if currentView === "register"}
    <Register onNavigate={navigate} />
  {:else if currentView === "home"}
    <Home onNavigate={navigate} />
  {:else if currentView === "partidos"}
    <Partidos onNavigate={navigate} initialTab={navOptions.tab || "mios"} />
  {:else if currentView === "crear-partido"}
    <CrearPartido onNavigate={navigate} />
  {:else if currentView === "editar-partido"}
    <EditarPartido onNavigate={navigate} eventoId={navOptions.eventoId || ""} />
  {:else if currentView === "detalle-partido"}
    <DetallePartido
      onNavigate={navigate}
      eventoId={navOptions.eventoId || ""}
    />
  {:else if currentView === "amigos"}
    <Amigos onNavigate={navigate} />
  {:else if currentView === "equipos"}
    <Equipos onNavigate={navigate} initialTab={navOptions.tab || "mios"} />
  {:else if currentView === "crear-equipo"}
    <CrearEquipo onNavigate={navigate} />
  {/if}
</div>
