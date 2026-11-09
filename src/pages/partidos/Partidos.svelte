<script>
    import Navbar from "../../components/Navbar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import TarjetaPartido from "../../components/partidos/TarjetaPartido.svelte";
    import { eventosApi } from "../../lib/api.js";

    let { onNavigate = () => {}, initialTab = "mios" } = $props();

    // Pestañas: 'mios' | 'publicos' | 'disponibles'
    let tabActiva = $state("mios");
    let filtroDeporte = $state("");

    let cargando = $state(false);
    let procesandoAccion = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    // Listas
    let misEventos = $state([]);
    let misInvitaciones = $state([]);
    let eventosPublicos = $state([]);
    let jugadoresDisponibles = $state([]);

    // Formulario de Mi Disponibilidad (Días y Horarios)
    let mostrarFormDisponibilidad = $state(false);
    let disponibleParaJugar = $state(false);
    let deportesSeleccionados = $state(["Fútbol 5"]);
    let diasSeleccionados = $state(["Lunes", "Miércoles", "Viernes"]);
    let horaDesde = $state("19:00");
    let horaHasta = $state("23:00");
    let notaDisponibilidad = $state("");

    const deportesLista = [
        "Fútbol 5",
        "Fútbol 7",
        "Fútbol 8",
        "Fútbol 11",
        "Pádel",
        "Tenis",
        "Básquet",
        "Vóley",
    ];

    const diasSemana = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
    ];

    $effect(() => {
        tabActiva = initialTab || "mios";
    });

    $effect(() => {
        const controller = new AbortController();
        const tab = tabActiva;
        const dep = filtroDeporte;
        cargarTab(tab, dep, controller.signal);
        return () => controller.abort();
    });

    function mostrarExito(msg) {
        exitoMsg = msg;
        errorMsg = "";
        setTimeout(() => {
            if (exitoMsg === msg) exitoMsg = "";
        }, 4000);
    }

    function toggleItem(lista, item) {
        return lista.includes(item)
            ? lista.filter((x) => x !== item)
            : [...lista, item];
    }

    async function cargarTab(tab, deporte, signal) {
        cargando = true;
        errorMsg = "";
        try {
            if (tab === "mios") {
                const [resMios, resInv] = await Promise.all([
                    eventosApi.listarMios(signal),
                    eventosApi.listarInvitaciones(signal),
                ]);
                misEventos = resMios.data || [];
                misInvitaciones = resInv.data || [];
            } else if (tab === "publicos") {
                const res = await eventosApi.listarPublicos(deporte, signal);
                eventosPublicos = res.data || [];
            } else if (tab === "disponibles") {
                const [resDisp, resMiDisp] = await Promise.all([
                    eventosApi.listarJugadoresDisponibles(deporte, signal),
                    eventosApi
                        .obtenerMiDisponibilidad(signal)
                        .catch(() => ({ data: null })),
                ]);
                jugadoresDisponibles = resDisp.data || [];

                if (resMiDisp?.data) {
                    const d = resMiDisp.data;
                    disponibleParaJugar = Boolean(d.disponibleParaJugar);
                    if (d.deportesDisponibles) {
                        deportesSeleccionados = d.deportesDisponibles
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                    }
                    if (d.diasDisponibles) {
                        diasSeleccionados = d.diasDisponibles
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                    }
                    horaDesde = d.horaDesde || "19:00";
                    horaHasta = d.horaHasta || "23:00";
                    notaDisponibilidad = d.notaDisponibilidad || "";
                }
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
        errorMsg = "";
        procesandoAccion = true;
        try {
            await eventosApi.responderInvitacion(eventoId, aceptar);
            if (aceptar) {
                onNavigate("detalle-partido", { eventoId });
            } else {
                mostrarExito("Invitación rechazada");
                cargarTab("mios", filtroDeporte);
            }
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleToggleDisponibilidadRapida() {
        errorMsg = "";
        const estadoAnterior = disponibleParaJugar;
        const nuevoEstado = !estadoAnterior;

        // 1. Actualización optimista instantánea
        disponibleParaJugar = nuevoEstado;

        try {
            // 2. Guardamos en segundo plano en el backend
            await eventosApi.actualizarMiDisponibilidad({
                disponibleParaJugar: nuevoEstado,
                deportesDisponibles: deportesSeleccionados.join(", "),
                diasDisponibles: diasSeleccionados.join(", "),
                horaDesde,
                horaHasta,
                notaDisponibilidad,
            });

            // Actualizamos la lista de disponibles en segundo plano sin poner cargando = true
            const resDisp =
                await eventosApi.listarJugadoresDisponibles(filtroDeporte);
            jugadoresDisponibles = resDisp.data || [];
        } catch (err) {
            // 3. Si falla la red, revertimos el interruptor
            disponibleParaJugar = estadoAnterior;
            errorMsg = err.message;
        }
    }

    async function handleGuardarDisponibilidad(e) {
        e.preventDefault();
        errorMsg = "";
        procesandoAccion = true;
        try {
            const payload = {
                disponibleParaJugar,
                deportesDisponibles: deportesSeleccionados.join(", "),
                diasDisponibles: diasSeleccionados.join(", "),
                horaDesde,
                horaHasta,
                notaDisponibilidad,
            };
            const res = await eventosApi.actualizarMiDisponibilidad(payload);
            mostrarExito(res.message || "Disponibilidad actualizada");
            mostrarFormDisponibilidad = false;

            const resDisp =
                await eventosApi.listarJugadoresDisponibles(filtroDeporte);
            jugadoresDisponibles = resDisp.data || [];
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

<Navbar activePage="partidos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <PageHeader
            etiqueta="PlayTime Partidos"
            titulo="Mis Partidos y Comunidad"
            descripcion="Organizá tus partidos, sumate a partidos públicos o anotate en la bolsa de jugadores disponibles."
            textoBoton="Crear Partido"
            iconoBoton="bi-plus-circle-fill"
            onAccion={() => onNavigate("crear-partido")}
        />

        <!-- Navegación entre las 3 secciones de Partidos -->
        <div
            class="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Secciones de partidos"
        >
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
                aria-selected={tabActiva === "publicos"}
                onclick={() => (tabActiva = "publicos")}
                class="filter-chip {tabActiva === 'publicos' ? 'active' : ''}"
            >
                <i class="bi bi-globe2" aria-hidden="true"></i>
                <span>Partidos Públicos</span>
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "disponibles"}
                onclick={() => (tabActiva = "disponibles")}
                class="filter-chip {tabActiva === 'disponibles'
                    ? 'active'
                    : ''}"
            >
                <i class="bi bi-broadcast" aria-hidden="true"></i>
                <span>Jugadores Disponibles</span>
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

        <!-- ==================== 1. MIS PARTIDOS ==================== -->
        {#if tabActiva === "mios"}
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
                                Organizá tu propio partido o explorá los
                                Partidos Públicos abiertos.
                            </p>
                            <button
                                type="button"
                                onclick={() => onNavigate("crear-partido")}
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
                                <TarjetaPartido
                                    evento={ev}
                                    textoBoton="Ver Equipos, Invitaciones y Datos"
                                    onVerDetalle={(id) =>
                                        onNavigate("detalle-partido", {
                                            eventoId: id,
                                        })}
                                />
                            {/each}
                        </div>
                    {/if}
                </div>
            </section>

            <!-- ==================== 2. PARTIDOS PÚBLICOS ==================== -->
        {:else if tabActiva === "publicos"}
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
                        {#each deportesLista as dep (dep)}
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
                            onclick={() => onNavigate("crear-partido")}
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
                            <TarjetaPartido
                                evento={ev}
                                textoBoton="Ver Partido y Equipos"
                                onVerDetalle={(id) =>
                                    onNavigate("detalle-partido", {
                                        eventoId: id,
                                    })}
                            />
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- ==================== 3. JUGADORES DISPONIBLES (BOLSA PÚBLICA) ==================== -->
        {:else if tabActiva === "disponibles"}
            <section
                aria-label="Bolsa pública de jugadores disponibles"
                class="space-y-5"
            >
                <!-- Tarjeta de Mi Estado de Disponibilidad -->
                <article
                    class="pt-card p-5 border-l-4 transition-colors duration-200 motion-reduce:transition-none {disponibleParaJugar
                        ? 'border-l-emerald-500'
                        : 'border-l-slate-300'} space-y-4"
                >
                    <div
                        class="flex flex-wrap items-center justify-between gap-3"
                    >
                        <div>
                            <h2 class="text-base font-bold text-slate-900">
                                Mi Disponibilidad Pública para ser Invitado
                            </h2>
                            <p class="text-xs text-slate-600 mt-1">
                                Indicá qué deportes, días de la semana y entre
                                qué horarios estás libre para que otros
                                organizadores te inviten a sus partidos.
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-2.5">
                            <!-- Interruptor instantáneo (role="switch") -->
                            <button
                                type="button"
                                role="switch"
                                aria-checked={disponibleParaJugar}
                                aria-label="Activar u ocultar mi disponibilidad pública para jugar"
                                onclick={handleToggleDisponibilidadRapida}
                                class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full cursor-pointer border transition-colors duration-200 motion-reduce:transition-none {disponibleParaJugar
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : 'bg-slate-100 border-slate-300 text-slate-700'}"
                            >
                                <span class="text-xs font-bold select-none">
                                    {disponibleParaJugar
                                        ? "Disponible"
                                        : "Oculto"}
                                </span>
                                <span
                                    aria-hidden="true"
                                    class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 motion-reduce:transition-none {disponibleParaJugar
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-400'}"
                                >
                                    <span
                                        class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none {disponibleParaJugar
                                            ? 'translate-x-4'
                                            : 'translate-x-1'}"
                                    ></span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onclick={() =>
                                    (mostrarFormDisponibilidad =
                                        !mostrarFormDisponibilidad)}
                                class="btn-pt btn-pt-soft btn-pt-sm"
                            >
                                <i class="bi bi-sliders" aria-hidden="true"></i>
                                <span>
                                    {mostrarFormDisponibilidad
                                        ? "Cerrar Configuración"
                                        : "Configurar Días y Horarios"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {#if mostrarFormDisponibilidad}
                        <form
                            onsubmit={handleGuardarDisponibilidad}
                            class="pt-4 border-t border-slate-200 space-y-4"
                        >
                            <label
                                class="flex items-center gap-2.5 cursor-pointer select-none"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={disponibleParaJugar}
                                    class="w-4 h-4 accent-emerald-600 rounded"
                                />
                                <span
                                    class="text-sm font-semibold text-slate-800"
                                >
                                    Quiero aparecer en la lista pública de
                                    jugadores disponibles para ser invitado
                                </span>
                            </label>

                            <div>
                                <div
                                    class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                                >
                                    Deportes que juego
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    {#each deportesLista as dep (dep)}
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (deportesSeleccionados =
                                                    toggleItem(
                                                        deportesSeleccionados,
                                                        dep,
                                                    ))}
                                            class="filter-chip {deportesSeleccionados.includes(
                                                dep,
                                            )
                                                ? 'active'
                                                : ''}"
                                        >
                                            {dep}
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <div>
                                <div
                                    class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                                >
                                    Días disponibles
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    {#each diasSemana as dia (dia)}
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (diasSeleccionados = toggleItem(
                                                    diasSeleccionados,
                                                    dia,
                                                ))}
                                            class="filter-chip {diasSeleccionados.includes(
                                                dia,
                                            )
                                                ? 'active'
                                                : ''}"
                                        >
                                            {dia}
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                            >
                                <div>
                                    <label
                                        for="disp-hora-desde"
                                        class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
                                    >
                                        Disponible desde las
                                    </label>
                                    <input
                                        id="disp-hora-desde"
                                        type="time"
                                        bind:value={horaDesde}
                                        class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="disp-hora-hasta"
                                        class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
                                    >
                                        Disponible hasta las
                                    </label>
                                    <input
                                        id="disp-hora-hasta"
                                        type="time"
                                        bind:value={horaHasta}
                                        class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="disp-nota"
                                        class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1"
                                    >
                                        Puesto o Nota breve
                                    </label>
                                    <input
                                        id="disp-nota"
                                        type="text"
                                        bind:value={notaDisponibilidad}
                                        placeholder="Ej: Juego de arquero o defensor"
                                        class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div class="flex justify-end gap-2">
                                <button
                                    type="submit"
                                    disabled={procesandoAccion}
                                    class="btn-pt btn-pt-primary btn-pt-sm"
                                >
                                    <i
                                        class="bi bi-check-circle-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Guardar Mi Disponibilidad</span>
                                </button>
                            </div>
                        </form>
                    {/if}
                </article>

                <!-- Lista pública de jugadores disponibles -->
                {#if cargando}
                    <div class="pt-card empty-state">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <p class="font-bold text-slate-700">
                            Cargando jugadores disponibles...
                        </p>
                    </div>
                {:else if jugadoresDisponibles.length === 0}
                    <div class="pt-card empty-state">
                        <i class="bi bi-people" aria-hidden="true"></i>
                        <h3 class="font-bold text-slate-800">
                            Todavía no hay otros jugadores anotados en la lista
                            pública
                        </h3>
                        <p class="text-sm text-slate-500 mt-1">
                            Activá tu disponibilidad arriba para que otros
                            organizadores te puedan invitar.
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each jugadoresDisponibles as j (j.uid)}
                            <article class="pt-card p-5 space-y-3">
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="player-avatar"
                                            style="background: var(--pt-green)"
                                        >
                                            {inicialNombre(j.nombre)}
                                        </div>
                                        <div>
                                            <h3
                                                class="font-bold text-slate-900 text-base"
                                            >
                                                {j.nombre}
                                                {j.apellido}
                                                {#if j.apodo}
                                                    <span
                                                        class="text-slate-500 font-normal text-sm"
                                                        >({j.apodo})</span
                                                    >
                                                {/if}
                                            </h3>
                                            <p class="text-xs text-slate-500">
                                                {j.localidad || "PlayTime"}
                                            </p>
                                        </div>
                                    </div>
                                    <span class="status-badge status-accepted">
                                        Disponible
                                    </span>
                                </div>

                                <div class="text-xs text-slate-700 space-y-1.5">
                                    <div class="flex items-center gap-2">
                                        <i
                                            class="bi bi-trophy-fill text-blue-600"
                                            aria-hidden="true"
                                        ></i>
                                        <span
                                            ><strong>Deportes:</strong>
                                            {j.deportesDisponibles ||
                                                "Todos"}</span
                                        >
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i
                                            class="bi bi-calendar-week-fill text-emerald-600"
                                            aria-hidden="true"
                                        ></i>
                                        <span
                                            ><strong>Días:</strong>
                                            {j.diasDisponibles ||
                                                "Cualquier día"}</span
                                        >
                                    </div>
                                    {#if j.horaDesde || j.horaHasta}
                                        <div class="flex items-center gap-2">
                                            <i
                                                class="bi bi-clock-fill text-amber-500"
                                                aria-hidden="true"
                                            ></i>
                                            <span
                                                ><strong>Horario:</strong>
                                                {j.horaDesde || "00:00"} a {j.horaHasta ||
                                                    "23:59"} hs</span
                                            >
                                        </div>
                                    {/if}
                                    {#if j.notaDisponibilidad}
                                        <p
                                            class="text-slate-600 italic bg-slate-50 p-2 rounded-lg"
                                        >
                                            "{j.notaDisponibilidad}"
                                        </p>
                                    {/if}
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}
    </main>
</div>
