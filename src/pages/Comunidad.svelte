<script>
    import Navbar from "../components/Navbar.svelte";
    import { eventosApi, amistadesApi } from "../lib/api.js";

    let { onNavigate = () => {}, initialTab = "explorar" } = $props();

    // Pestaña principal: 'explorar' | 'mios' | 'amigos'
    let tabActiva = $state("explorar");
    let filtroDeporte = $state("");

    let cargando = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");
    let procesandoAccion = $state(false);

    // Datos de eventos
    let eventosPublicos = $state([]);
    let misEventos = $state([]);
    let misInvitaciones = $state([]);

    // Datos de amistades
    let amigos = $state([]);
    let solicitudesPendientes = $state([]);
    let busquedaQuery = $state("");
    let resultadosBusqueda = $state([]);
    let buscandoUsuarios = $state(false);
    let contactoAmigoDirecto = $state("");

    const deportesDisponibles = [
        "Fútbol 5",
        "Fútbol 7",
        "Fútbol 8",
        "Fútbol 11",
        "Pádel",
        "Tenis",
        "Básquet",
        "Vóley",
    ];

    let solicitudesRecibidas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "RECIBIDA"),
    );
    let solicitudesEnviadas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "ENVIADA"),
    );

    // Sincronizar prop inicial sin warning state_referenced_locally
    $effect(() => {
        tabActiva = initialTab || "explorar";
    });

    function manejarNavegacionInterna(vista, opciones = {}) {
        if (vista === "comunidad" && opciones.tab) {
            tabActiva = opciones.tab;
        } else {
            onNavigate(vista, opciones);
        }
    }

    // Efecto con AbortController (Regla D)
    $effect(() => {
        const controller = new AbortController();
        const tab = tabActiva;
        const dep = filtroDeporte;

        cargarDatosTab(tab, dep, controller.signal);

        return () => controller.abort();
    });

    function limpiarMensajes() {
        errorMsg = "";
        exitoMsg = "";
    }

    function mostrarExito(msg) {
        exitoMsg = msg;
        errorMsg = "";
        setTimeout(() => {
            if (exitoMsg === msg) exitoMsg = "";
        }, 4000);
    }

    async function cargarDatosTab(tab, deporte, signal) {
        cargando = true;
        errorMsg = "";
        try {
            if (tab === "explorar") {
                const res = await eventosApi.listarPublicos(deporte, signal);
                eventosPublicos = res.data || [];
            } else if (tab === "mios") {
                const [resMios, resInv] = await Promise.all([
                    eventosApi.listarMios(signal),
                    eventosApi.listarInvitaciones(signal),
                ]);
                misEventos = resMios.data || [];
                misInvitaciones = resInv.data || [];
            } else if (tab === "amigos") {
                const [resAmigos, resPend] = await Promise.all([
                    amistadesApi.listarAmigos(signal),
                    amistadesApi.listarPendientes(signal),
                ]);
                amigos = resAmigos.data || [];
                solicitudesPendientes = resPend.data || [];
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleResponderInvitacion(eventoId, aceptar) {
        limpiarMensajes();
        procesandoAccion = true;
        try {
            await eventosApi.responderInvitacion(eventoId, aceptar);
            if (aceptar) {
                onNavigate("partido-detalle", { eventoId });
            } else {
                mostrarExito("Invitación rechazada");
                cargarDatosTab("mios", filtroDeporte);
            }
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    // ==================== ACCIONES DE AMISTAD ====================
    async function handleBuscarUsuarios(e) {
        e.preventDefault();
        if (busquedaQuery.trim().length < 2) return;
        buscandoUsuarios = true;
        limpiarMensajes();
        try {
            const res = await amistadesApi.buscarUsuarios(busquedaQuery.trim());
            resultadosBusqueda = res.data || [];
        } catch (err) {
            errorMsg = err.message;
        } finally {
            buscandoUsuarios = false;
        }
    }

    async function handleEnviarSolicitudAmistad(payload) {
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await amistadesApi.enviarSolicitud(payload);
            mostrarExito(res.message || "Solicitud enviada");
            contactoAmigoDirecto = "";
            cargarDatosTab("amigos", "");
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleResponderAmistad(amistadId, aceptar) {
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await amistadesApi.responderSolicitud(
                amistadId,
                aceptar,
            );
            mostrarExito(res.message || "Solicitud procesada");
            cargarDatosTab("amigos", "");
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleEliminarAmigo(otroUid, nombre) {
        if (!confirm(`¿Eliminar vínculo con ${nombre}?`)) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            await amistadesApi.eliminar(otroUid);
            mostrarExito("Vínculo eliminado");
            cargarDatosTab("amigos", "");
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    function formatearFecha(iso) {
        if (!iso) return "";
        return new Date(iso).toLocaleString("es-AR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function inicialNombre(nombre) {
        return (nombre || "J").trim().charAt(0).toUpperCase();
    }
</script>

<Navbar activePage="comunidad" onNavigate={manejarNavegacionInterna} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <header class="pt-page-header flex-wrap">
            <div>
                <p
                    class="text-xs uppercase tracking-wider text-blue-100 font-bold mb-1"
                >
                    PlayTime Social
                </p>
                <h1 class="text-2xl sm:text-3xl font-extrabold">
                    Partidos y Comunidad
                </h1>
                <p class="text-sm text-blue-100/90 mt-1">
                    Explorá partidos abiertos, gestioná tus eventos y conectá
                    con tus amigos.
                </p>
            </div>

            <button
                type="button"
                onclick={() => onNavigate("organizar-partido")}
                class="btn-pt btn-pt-success"
            >
                <i class="bi bi-plus-circle-fill" aria-hidden="true"></i>
                <span>Organizar Partido</span>
            </button>
        </header>

        <!-- Barra de pestañas -->
        <div
            class="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Secciones de comunidad"
        >
            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "explorar"}
                onclick={() => (tabActiva = "explorar")}
                class="filter-chip {tabActiva === 'explorar' ? 'active' : ''}"
            >
                <i class="bi bi-globe2" aria-hidden="true"></i>
                <span>Partidos Públicos</span>
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "mios"}
                onclick={() => (tabActiva = "mios")}
                class="filter-chip {tabActiva === 'mios' ? 'active' : ''}"
            >
                <i class="bi bi-calendar-check-fill" aria-hidden="true"></i>
                <span>Mis Partidos</span>
                {#if misInvitaciones.length > 0}
                    <span
                        class="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                    >
                        {misInvitaciones.length}
                    </span>
                {/if}
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "amigos"}
                onclick={() => (tabActiva = "amigos")}
                class="filter-chip {tabActiva === 'amigos' ? 'active' : ''}"
            >
                <i class="bi bi-people-fill" aria-hidden="true"></i>
                <span>Mis Amigos</span>
                {#if solicitudesRecibidas.length > 0}
                    <span
                        class="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                    >
                        {solicitudesRecibidas.length}
                    </span>
                {/if}
            </button>
        </div>

        {#if errorMsg}
            <div class="pt-alert pt-alert-danger" role="alert">
                <div class="flex items-center gap-2">
                    <i
                        class="bi bi-exclamation-triangle-fill"
                        aria-hidden="true"
                    ></i>
                    <span>{errorMsg}</span>
                </div>
                <button
                    type="button"
                    onclick={() => (errorMsg = "")}
                    aria-label="Cerrar alerta de error"
                    class="bg-transparent border-0 text-red-800 cursor-pointer"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        {/if}

        {#if exitoMsg}
            <div class="pt-alert pt-alert-success" role="status">
                <div class="flex items-center gap-2">
                    <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                    <span>{exitoMsg}</span>
                </div>
            </div>
        {/if}

        <!-- ==================== PESTAÑA 1: PARTIDOS PÚBLICOS ==================== -->
        {#if tabActiva === "explorar"}
            <section aria-label="Explorar partidos públicos" class="space-y-4">
                <div class="pt-card p-4">
                    <div
                        class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5"
                    >
                        Filtrar por deporte
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onclick={() => (filtroDeporte = "")}
                            class="filter-chip {filtroDeporte === ''
                                ? 'active'
                                : ''}"
                        >
                            Todos
                        </button>
                        {#each deportesDisponibles as dep (dep)}
                            <button
                                type="button"
                                onclick={() => (filtroDeporte = dep)}
                                class="filter-chip {filtroDeporte === dep
                                    ? 'active'
                                    : ''}"
                            >
                                {dep}
                            </button>
                        {/each}
                    </div>
                </div>

                {#if cargando}
                    <div class="pt-card empty-state">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <h2 class="font-bold text-slate-800">
                            Buscando partidos públicos...
                        </h2>
                    </div>
                {:else if eventosPublicos.length === 0}
                    <div class="pt-card empty-state">
                        <i class="bi bi-calendar-x" aria-hidden="true"></i>
                        <h2 class="font-bold text-slate-800 text-base">
                            No hay partidos públicos abiertos
                        </h2>
                        <p class="text-sm text-slate-500 mt-1 mb-4">
                            ¡Sé el primero en organizar un partido abierto para
                            la comunidad!
                        </p>
                        <button
                            type="button"
                            onclick={() => onNavigate("organizar-partido")}
                            class="btn-pt btn-pt-success btn-pt-sm"
                        >
                            <i class="bi bi-plus-circle-fill" aria-hidden="true"
                            ></i>
                            <span>Organizar Partido</span>
                        </button>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each eventosPublicos as ev (ev.id)}
                            <article
                                class="pt-card hoverable p-5 flex flex-col justify-between gap-4"
                            >
                                <div class="space-y-2">
                                    <div
                                        class="flex items-start justify-between gap-2"
                                    >
                                        <span class="sport-tag"
                                            >{ev.deporte}</span
                                        >
                                        <span
                                            class="status-badge status-accepted"
                                        >
                                            <i
                                                class="bi bi-people-fill"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                >{ev.cantConfirmados}/{ev.cupoMaximo}
                                                jug.</span
                                            >
                                        </span>
                                    </div>

                                    <h3
                                        class="font-bold text-slate-900 text-lg leading-snug pt-1"
                                    >
                                        {ev.titulo}
                                    </h3>

                                    <div
                                        class="text-xs text-slate-600 space-y-1"
                                    >
                                        <div class="flex items-center gap-2">
                                            <i
                                                class="bi bi-calendar-event-fill text-blue-600"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                >{formatearFecha(
                                                    ev.fechaHora,
                                                )}</span
                                            >
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i
                                                class="bi bi-geo-alt-fill text-red-500"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                >{ev.ubicacionTexto ||
                                                    "Lugar a definir"}</span
                                            >
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i
                                                class="bi bi-person-fill text-slate-500"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                >Organiza: {ev.organizadorNombre}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onclick={() =>
                                        onNavigate("partido-detalle", {
                                            eventoId: ev.id,
                                        })}
                                    class="btn-pt btn-pt-soft w-full"
                                >
                                    <i
                                        class="bi bi-people-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Ver Partido y Equipos</span>
                                </button>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- ==================== PESTAÑA 2: MIS PARTIDOS E INVITACIONES ==================== -->
        {:else if tabActiva === "mios"}
            <section aria-label="Mis partidos e invitaciones" class="space-y-6">
                {#if misInvitaciones.length > 0}
                    <div class="space-y-3">
                        <h2
                            class="text-base font-bold text-slate-800 flex items-center gap-2"
                        >
                            <i
                                class="bi bi-bell-fill text-amber-500"
                                aria-hidden="true"
                            ></i>
                            <span
                                >Invitaciones Pendientes ({misInvitaciones.length})</span
                            >
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each misInvitaciones as inv (inv.id)}
                                <article
                                    class="pt-card p-4 border-l-4 border-l-amber-500 space-y-3"
                                >
                                    <div>
                                        <span class="sport-tag"
                                            >{inv.deporte}</span
                                        >
                                        <h3
                                            class="font-bold text-slate-900 text-base mt-1.5"
                                        >
                                            {inv.titulo}
                                        </h3>
                                        <p class="text-xs text-slate-600 mt-1">
                                            Te invitó <strong
                                                >{inv.organizadorNombre}</strong
                                            >
                                            · {formatearFecha(inv.fechaHora)}
                                        </p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={procesandoAccion}
                                            onclick={() =>
                                                handleResponderInvitacion(
                                                    inv.id,
                                                    true,
                                                )}
                                            class="btn-pt btn-pt-success btn-pt-sm flex-1"
                                        >
                                            <i
                                                class="bi bi-check-lg"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Aceptar</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={procesandoAccion}
                                            onclick={() =>
                                                handleResponderInvitacion(
                                                    inv.id,
                                                    false,
                                                )}
                                            class="btn-pt btn-pt-outline btn-pt-sm flex-1"
                                        >
                                            <i
                                                class="bi bi-x-lg"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Rechazar</span>
                                        </button>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="space-y-3">
                    <h2
                        class="text-lg font-bold text-slate-800 flex items-center gap-2"
                    >
                        <i
                            class="bi bi-calendar-check-fill text-blue-600"
                            aria-hidden="true"
                        ></i>
                        <span>Mis Partidos Activos</span>
                    </h2>

                    {#if cargando}
                        <div class="pt-card empty-state">
                            <i class="bi bi-hourglass-split" aria-hidden="true"
                            ></i>
                            <p class="font-bold text-slate-700">
                                Cargando tus partidos...
                            </p>
                        </div>
                    {:else if misEventos.length === 0}
                        <div class="pt-card empty-state">
                            <i class="bi bi-calendar-x" aria-hidden="true"></i>
                            <h3 class="font-bold text-slate-800">
                                Todavía no estás en ningún partido
                            </h3>
                            <p class="text-sm text-slate-500 mt-1 mb-4">
                                Creá tu propio partido o unite a uno desde la
                                pestaña de Partidos Públicos.
                            </p>
                            <button
                                type="button"
                                onclick={() => onNavigate("organizar-partido")}
                                class="btn-pt btn-pt-success btn-pt-sm"
                            >
                                <i
                                    class="bi bi-plus-circle-fill"
                                    aria-hidden="true"
                                ></i>
                                <span>Organizar mi primer partido</span>
                            </button>
                        </div>
                    {:else}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each misEventos as ev (ev.id)}
                                <article
                                    class="pt-card hoverable p-5 flex flex-col justify-between gap-4"
                                >
                                    <div class="space-y-2">
                                        <div
                                            class="flex items-center justify-between gap-2"
                                        >
                                            <div
                                                class="flex items-center gap-1.5"
                                            >
                                                <span class="sport-tag"
                                                    >{ev.deporte}</span
                                                >
                                                {#if ev.soyOrganizador}
                                                    <span
                                                        class="status-badge status-info"
                                                    >
                                                        <i
                                                            class="bi bi-star-fill"
                                                            aria-hidden="true"
                                                        ></i>
                                                        <span>Anfitrión</span>
                                                    </span>
                                                {/if}
                                            </div>
                                            <span
                                                class="status-badge status-accepted"
                                            >
                                                {ev.cantConfirmados}/{ev.cupoMaximo}
                                                jug.
                                            </span>
                                        </div>

                                        <h3
                                            class="font-bold text-slate-900 text-lg pt-1"
                                        >
                                            {ev.titulo}
                                        </h3>

                                        <p
                                            class="text-xs text-slate-600 flex items-center gap-2"
                                        >
                                            <i
                                                class="bi bi-calendar-event-fill text-blue-600"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                >{formatearFecha(
                                                    ev.fechaHora,
                                                )}</span
                                            >
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onclick={() =>
                                            onNavigate("partido-detalle", {
                                                eventoId: ev.id,
                                            })}
                                        class="btn-pt btn-pt-soft w-full"
                                    >
                                        <i
                                            class="bi bi-people-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>Ver Equipos e Invitaciones</span>
                                    </button>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </div>
            </section>

            <!-- ==================== PESTAÑA 3: AMIGOS ==================== -->
        {:else if tabActiva === "amigos"}
            <section aria-label="Gestión de amigos" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <article class="pt-card p-5 space-y-3">
                        <h2
                            class="text-base font-bold text-slate-900 flex items-center gap-2"
                        >
                            <i
                                class="bi bi-person-plus-fill text-emerald-600"
                                aria-hidden="true"
                            ></i>
                            <span>Agregar por Email o Teléfono</span>
                        </h2>
                        <form
                            onsubmit={(e) => {
                                e.preventDefault();
                                const v = contactoAmigoDirecto.trim();
                                if (!v) return;
                                handleEnviarSolicitudAmistad(
                                    v.includes("@")
                                        ? { email: v }
                                        : { telefono: v },
                                );
                            }}
                            class="flex gap-2"
                        >
                            <label for="input-amigo-directo" class="sr-only">
                                Email o teléfono de tu amigo
                            </label>
                            <input
                                id="input-amigo-directo"
                                type="text"
                                bind:value={contactoAmigoDirecto}
                                required
                                placeholder="tuamigo@email.com o teléfono..."
                                class="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={procesandoAccion}
                                class="btn-pt btn-pt-primary btn-pt-sm"
                            >
                                <i class="bi bi-send-fill" aria-hidden="true"
                                ></i>
                                <span>Enviar</span>
                            </button>
                        </form>
                    </article>

                    <article class="pt-card p-5 space-y-3">
                        <h2
                            class="text-base font-bold text-slate-900 flex items-center gap-2"
                        >
                            <i
                                class="bi bi-search text-blue-600"
                                aria-hidden="true"
                            ></i>
                            <span>Buscar Jugadores en PlayTime</span>
                        </h2>
                        <form
                            onsubmit={handleBuscarUsuarios}
                            class="flex gap-2"
                        >
                            <label for="input-buscar-jugador" class="sr-only">
                                Buscar por nombre, apodo o email
                            </label>
                            <input
                                id="input-buscar-jugador"
                                type="text"
                                bind:value={busquedaQuery}
                                placeholder="Nombre, apellido o apodo..."
                                class="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={buscandoUsuarios}
                                class="btn-pt btn-pt-soft btn-pt-sm"
                            >
                                <i class="bi bi-search" aria-hidden="true"></i>
                                <span>Buscar</span>
                            </button>
                        </form>

                        {#if resultadosBusqueda.length > 0}
                            <div class="space-y-2 pt-2">
                                {#each resultadosBusqueda as u (u.uid)}
                                    <div class="player-card">
                                        <div
                                            class="flex items-center gap-3 min-w-0"
                                        >
                                            <div
                                                class="player-avatar"
                                                style="background: var(--pt-blue)"
                                            >
                                                {inicialNombre(u.nombre)}
                                            </div>
                                            <div class="min-w-0">
                                                <div
                                                    class="font-semibold text-sm text-slate-800 truncate"
                                                >
                                                    {u.nombre}
                                                    {u.apellido}
                                                </div>
                                                <div
                                                    class="text-xs text-slate-500 truncate"
                                                >
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleEnviarSolicitudAmistad({
                                                    destinatarioUid: u.uid,
                                                })}
                                            class="btn-pt btn-pt-soft btn-pt-sm"
                                        >
                                            <i
                                                class="bi bi-person-plus-fill"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Agregar</span>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </article>
                </div>

                {#if solicitudesRecibidas.length > 0}
                    <article class="pt-card p-5 space-y-3">
                        <h2
                            class="text-base font-bold text-slate-900 flex items-center gap-2"
                        >
                            <i
                                class="bi bi-clock-history text-amber-500"
                                aria-hidden="true"
                            ></i>
                            <span
                                >Solicitudes de Amistad Recibidas ({solicitudesRecibidas.length})</span
                            >
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {#each solicitudesRecibidas as s (s.amistadId)}
                                <div class="player-card">
                                    <div
                                        class="flex items-center gap-3 min-w-0"
                                    >
                                        <div
                                            class="player-avatar"
                                            style="background: var(--pt-amber)"
                                        >
                                            {inicialNombre(
                                                s.otroUsuario.nombre,
                                            )}
                                        </div>
                                        <div class="min-w-0">
                                            <div
                                                class="font-semibold text-sm text-slate-800 truncate"
                                            >
                                                {s.otroUsuario.nombre}
                                                {s.otroUsuario.apellido}
                                            </div>
                                            <div
                                                class="text-xs text-slate-500 truncate"
                                            >
                                                {s.otroUsuario.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-1.5">
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleResponderAmistad(
                                                    s.amistadId,
                                                    true,
                                                )}
                                            class="btn-pt btn-pt-success btn-pt-sm"
                                        >
                                            <i
                                                class="bi bi-check-lg"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Aceptar</span>
                                        </button>
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleResponderAmistad(
                                                    s.amistadId,
                                                    false,
                                                )}
                                            aria-label={`Rechazar solicitud de ${s.otroUsuario.nombre}`}
                                            class="btn-pt btn-pt-outline btn-pt-sm"
                                        >
                                            <i
                                                class="bi bi-x-lg"
                                                aria-hidden="true"
                                            ></i>
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </article>
                {/if}

                <article class="pt-card p-5 space-y-4">
                    <h2
                        class="text-base font-bold text-slate-900 flex items-center gap-2"
                    >
                        <i
                            class="bi bi-people-fill text-blue-600"
                            aria-hidden="true"
                        ></i>
                        <span>Mis Amigos ({amigos.length})</span>
                    </h2>

                    {#if amigos.length === 0}
                        <div class="empty-state py-6">
                            <i class="bi bi-people" aria-hidden="true"></i>
                            <p class="font-bold text-slate-700">
                                Todavía no agregaste amigos
                            </p>
                            <p class="text-xs text-slate-500 mt-1">
                                Buscalos arriba por nombre, email o teléfono
                                para invitarlos rápido a tus partidos.
                            </p>
                        </div>
                    {:else}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {#each amigos as a (a.uid)}
                                <div class="player-card">
                                    <div
                                        class="flex items-center gap-3 min-w-0"
                                    >
                                        <div
                                            class="player-avatar"
                                            style="background: var(--pt-blue)"
                                        >
                                            {inicialNombre(a.nombre)}
                                        </div>
                                        <div class="min-w-0">
                                            <div
                                                class="font-semibold text-sm text-slate-800 truncate"
                                            >
                                                {a.nombre}
                                                {a.apellido}
                                            </div>
                                            <div
                                                class="text-xs text-slate-500 truncate"
                                            >
                                                <i
                                                    class="bi bi-envelope-fill mr-1"
                                                    aria-hidden="true"
                                                ></i>{a.email}
                                                {a.telefono
                                                    ? ` · ${a.telefono}`
                                                    : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleEliminarAmigo(
                                                a.uid,
                                                `${a.nombre} ${a.apellido}`,
                                            )}
                                        aria-label={`Eliminar a ${a.nombre} de mis amigos`}
                                        class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-trash-fill"
                                            aria-hidden="true"
                                        ></i>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if solicitudesEnviadas.length > 0}
                        <div class="pt-4 border-t border-slate-200 space-y-2">
                            <p
                                class="text-xs font-bold uppercase tracking-wider text-slate-500"
                            >
                                Solicitudes enviadas pendientes ({solicitudesEnviadas.length})
                            </p>
                            <div class="flex flex-wrap gap-2">
                                {#each solicitudesEnviadas as env (env.amistadId)}
                                    <div class="status-badge status-pending">
                                        <i
                                            class="bi bi-clock-history"
                                            aria-hidden="true"
                                        ></i>
                                        <span
                                            >{env.otroUsuario.nombre}
                                            {env.otroUsuario.apellido}</span
                                        >
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleEliminarAmigo(
                                                    env.otroUsuario.uid,
                                                    env.otroUsuario.nombre,
                                                )}
                                            aria-label={`Cancelar solicitud a ${env.otroUsuario.nombre}`}
                                            class="ml-1 text-red-700 hover:text-red-900 cursor-pointer"
                                        >
                                            <i class="bi bi-x-circle-fill"></i>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </article>
            </section>
        {/if}
    </main>
</div>
