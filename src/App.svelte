<script>
  import Welcome from "./pages/Welcome.svelte";
  import Login from "./pages/Login.svelte";
  import Register from "./pages/Register.svelte";
  import Home from "./pages/Home.svelte";
  import Partidos from "./pages/partidos/Partidos.svelte";
  import CrearPartido from "./pages/partidos/CrearPartido.svelte";
  import DetallePartido from "./pages/partidos/DetallePartido.svelte";
  import EditarPartido from "./pages/partidos/EditarPartido.svelte";
  import Amigos from "./pages/Amigos.svelte";
  import Equipos from "./pages/equipos/Equipos.svelte";
  import CrearEquipo from "./pages/equipos/CrearEquipo.svelte";
  import DetalleEquipo from "./pages/equipos/DetalleEquipo.svelte";
  import EditarEquipo from "./pages/equipos/EditarEquipo.svelte";
  import { router, navigate, inicializarRouter } from "./lib/router.svelte.js";

  // Inicializa el router al montar y limpia el listener popstate al desmontar
  $effect(() => {
    return inicializarRouter();
  });
</script>

<!-- Skip link accesible para usuarios de teclado -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-[2000] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md shadow-lg"
>
  Saltar al contenido principal
</a>

<div id="main-content">
  {#if router.view === "welcome"}
    <Welcome onNavigate={navigate} />
  {:else if router.view === "login"}
    <Login onNavigate={navigate} />
  {:else if router.view === "register"}
    <Register onNavigate={navigate} />
  {:else if router.view === "home"}
    <Home onNavigate={navigate} />
  {:else if router.view === "partidos"}
    <Partidos onNavigate={navigate} initialTab={router.options.tab || "mios"} />
  {:else if router.view === "crear-partido"}
    <CrearPartido onNavigate={navigate} />
  {:else if router.view === "detalle-partido"}
    <DetallePartido
      onNavigate={navigate}
      eventoId={router.options.eventoId || ""}
    />
  {:else if router.view === "editar-partido"}
    <EditarPartido
      onNavigate={navigate}
      eventoId={router.options.eventoId || ""}
    />
  {:else if router.view === "amigos"}
    <Amigos onNavigate={navigate} />
  {:else if router.view === "equipos"}
    <Equipos onNavigate={navigate} initialTab={router.options.tab || "mios"} />
  {:else if router.view === "crear-equipo"}
    <CrearEquipo onNavigate={navigate} />
  {:else if router.view === "detalle-equipo"}
    <DetalleEquipo
      onNavigate={navigate}
      equipoId={router.options.equipoId || ""}
    />
  {:else if router.view === "editar-equipo"}
    <EditarEquipo
      onNavigate={navigate}
      equipoId={router.options.equipoId || ""}
    />
  {/if}
</div>
