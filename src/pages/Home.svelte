<script>
    import Navbar from "../components/Navbar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import FiltroDeportes from "../components/FiltroDeportes.svelte";
    import {
        obtenerUsuarioActual,
        eventosApi,
        catalogoApi,
    } from "../lib/api.js";

    let { onNavigate = () => {} } = $props();

    const usuario = obtenerUsuarioActual();

    let searchTerm = $state("");
    let filtroDeporte = $state("");

    let misProximosPartidos = $state([]);
    let deportesCatalogo = $state([]);
    let complejos = $state([]);
    let complejoExpandidoId = $state(null);

    let cargandoPartidos = $state(true);
    let cargandoComplejos = $state(true);

    // R-08: Derivado que filtra por deporte seleccionado y por texto de búsqueda
    let complejosFiltrados = $derived(
        complejos.filter((c) => {
            const coincideDeporte =
                !filtroDeporte ||
                (c.deportes || []).some(
                    (d) => d.toLowerCase() === filtroDeporte.toLowerCase(),
                );

            const q = searchTerm.trim().toLowerCase();
            const coincideTexto =
                !q ||
                (c.nombre || "").toLowerCase().includes(q) ||
                (c.domicilio || "").toLowerCase().includes(q) ||
                (c.localidad || "").toLowerCase().includes(q) ||
                (c.deportes || []).some((d) => d.toLowerCase().includes(q)) ||
                (c.canchas || []).some((ca) =>
                    (ca.tipo || "").toLowerCase().includes(q),
                );

            return coincideDeporte && coincideTexto;
        }),
    );

    $effect(() => {
        const controller = new AbortController();
        cargandoPartidos = true;
        cargandoComplejos = true;

        eventosApi
            .listarMios(controller.signal)
            .then((res) => {
                misProximosPartidos = (res.data || []).slice(0, 2);
            })
            .catch(() => {
                misProximosPartidos = [];
            })
            .finally(() => {
                cargandoPartidos = false;
            });

        Promise.all([
            catalogoApi.listarDeportes(controller.signal),
            catalogoApi.listarComplejos("", controller.signal),
        ])
            .then(([resDep, resComp]) => {
                deportesCatalogo = resDep?.data || [];
                complejos = resComp?.data || [];
            })
            .catch(() => {
                complejos = [];
            })
            .finally(() => {
                cargandoComplejos = false;
            });

        return () => controller.abort();
    });

    function formatearFecha(iso) {
        if (!iso) return "";
        return new Date(iso).toLocaleString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // Traduce deporte + capacidad por equipo al formato legible (ej: Futbol 7 o Padel 2 vs 2)
    function formatearCapacidadCancha(deporte, capacidad) {
        if (!capacidad) return deporte;
        const dep = (deporte || "").toLowerCase();
        if (dep.includes("futbol") || dep.includes("fútbol")) {
            return `${deporte} ${capacidad}`;
        }
        if (
            dep.includes("tenis") ||
            dep.includes("padel") ||
            dep.includes("pádel")
        ) {
            return capacidad === 1
                ? `${deporte} Singles (1 vs 1)`
                : `${deporte} Dobles (${capacidad} vs ${capacidad})`;
        }
        return `${deporte} (${capacidad} vs ${capacidad})`;
    }

    function toggleCanchas(id) {
        complejoExpandidoId = complejoExpandidoId === id ? null : id;
    }
</script>

<Navbar activePage="home" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-8">
        <PageHeader
            etiqueta="Panel Principal"
            titulo={`¡Hola, ${usuario.nombre}! ⚽`}
            descripcion={usuario.localidad || "San Juan, Argentina"}
            iconoDescripcion="bi-geo-alt-fill"
            iconoDecorativo="bi-calendar-check-fill"
        />

        <!-- ACCIONES RÁPIDAS (Orden pedido: 1. Organizar, 2. Reservar, 3. Públicos, 4. Torneos) -->
        <section aria-label="Acciones rápidas">
            <h2
                class="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2"
            >
                <i
                    class="bi bi-lightning-charge-fill text-blue-600"
                    aria-hidden="true"
                ></i>
                <span>Acciones Rápidas</span>
            </h2>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 1. Crear Partido -->
                <button
                    type="button"
                    onclick={() => onNavigate("crear-partido")}
                    class="stat-card hoverable cursor-pointer text-center"
                >
                    <div
                        class="stat-icon"
                        style="background: rgba(16, 185, 129, 0.12); color: var(--pt-green);"
                    >
                        <i class="bi bi-plus-circle-fill" aria-hidden="true"
                        ></i>
                    </div>
                    <div class="font-bold text-slate-800 text-sm">
                        Crear Partido
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                        Creá un Partido y armá equipos
                    </p>
                </button>

                <!-- 2. Reservar Cancha -->
                <button
                    type="button"
                    onclick={() => onNavigate("reservas")}
                    class="stat-card hoverable cursor-pointer text-center"
                >
                    <div
                        class="stat-icon"
                        style="background: rgba(59, 130, 246, 0.12); color: var(--pt-blue);"
                    >
                        <i class="bi bi-calendar-check-fill" aria-hidden="true"
                        ></i>
                    </div>
                    <div class="font-bold text-slate-800 text-sm">
                        Reservar Cancha
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                        Buscá horarios disponibles
                    </p>
                </button>

                <!-- 3. Ver Partidos Públicos -->
                <button
                    type="button"
                    onclick={() => onNavigate("partidos", { tab: "publicos" })}
                    class="stat-card hoverable cursor-pointer text-center"
                >
                    <div
                        class="stat-icon"
                        style="background: rgba(139, 92, 246, 0.12); color: var(--pt-purple);"
                    >
                        <i class="bi bi-people-fill" aria-hidden="true"></i>
                    </div>
                    <div class="font-bold text-slate-800 text-sm">
                        Ver Partidos Públicos
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                        Sumate a partidos abiertos
                    </p>
                </button>

                <!-- 4. Ver Torneos -->
                <button
                    type="button"
                    onclick={() => onNavigate("torneos")}
                    class="stat-card hoverable cursor-pointer text-center"
                >
                    <div
                        class="stat-icon"
                        style="background: rgba(245, 158, 11, 0.12); color: var(--pt-amber);"
                    >
                        <i class="bi bi-trophy-fill" aria-hidden="true"></i>
                    </div>
                    <div class="font-bold text-slate-800 text-sm">
                        Ver Torneos
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                        Competencias y fixture
                    </p>
                </button>
            </div>
        </section>

        <!-- PRÓXIMOS PARTIDOS (Conectado a tus Eventos en Firestore) -->
        <section aria-label="Próximos partidos">
            <div class="flex items-center justify-between mb-3">
                <h2
                    class="text-lg font-bold text-slate-800 flex items-center gap-2"
                >
                    <i
                        class="bi bi-calendar-event-fill text-blue-600"
                        aria-hidden="true"
                    ></i>
                    <span>Mis Próximos Partidos</span>
                </h2>
                <button
                    type="button"
                    onclick={() => onNavigate("partidos", { tab: "mios" })}
                    class="btn-pt btn-pt-soft btn-pt-sm"
                >
                    <span>Ver todos</span>
                    <i class="bi bi-arrow-right" aria-hidden="true"></i>
                </button>
            </div>

            {#if cargandoPartidos}
                <div class="pt-card empty-state">
                    <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                    <p class="font-bold text-slate-700">
                        Cargando tus partidos...
                    </p>
                </div>
            {:else if misProximosPartidos.length === 0}
                <div class="pt-card empty-state">
                    <i class="bi bi-calendar-x" aria-hidden="true"></i>
                    <h3 class="font-bold text-slate-800 text-base">
                        No tenés próximos partidos programados
                    </h3>
                    <p class="text-sm text-slate-500 mt-1 mb-4">
                        Organizá un partido con tus amigos o sumate a uno
                        público de la comunidad.
                    </p>
                    <div class="flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onclick={() => onNavigate("crear-partido")}
                            class="btn-pt btn-pt-success btn-pt-sm"
                        >
                            <i class="bi bi-plus-circle-fill" aria-hidden="true"
                            ></i>
                            <span>Crear Partido</span>
                        </button>
                        <button
                            type="button"
                            onclick={() => onNavigate("crear-partido")}
                            class="btn-pt btn-pt-soft btn-pt-sm"
                        >
                            <i class="bi bi-people-fill" aria-hidden="true"></i>
                            <span>Explorar Partidos Públicos</span>
                        </button>
                    </div>
                </div>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each misProximosPartidos as ev (ev.id)}
                        <article class="pt-card">
                            <div
                                class="pt-card-header-green flex items-center justify-between gap-3"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center text-lg shrink-0"
                                        aria-hidden="true"
                                    >
                                        <i class="bi bi-trophy-fill"></i>
                                    </div>
                                    <div>
                                        <h3
                                            class="font-bold text-base leading-tight"
                                        >
                                            {ev.titulo}
                                        </h3>
                                        <p class="text-xs opacity-90">
                                            {ev.deporte} · {ev.ubicacionTexto ||
                                                "Lugar a definir"}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    class="text-xs font-bold px-2.5 py-1 rounded-full bg-white/25 shrink-0"
                                >
                                    {ev.cantConfirmados}/{ev.cupoMaximo} jug.
                                </span>
                            </div>

                            <div
                                class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div class="text-sm text-slate-700 space-y-1">
                                    <div class="flex items-center gap-2">
                                        <i
                                            class="bi bi-calendar-event-fill text-blue-600"
                                            aria-hidden="true"
                                        ></i>
                                        <strong class="capitalize"
                                            >{formatearFecha(
                                                ev.fechaHora,
                                            )}</strong
                                        >
                                    </div>
                                    <div class="text-xs text-slate-500">
                                        Organiza: {ev.organizadorNombre}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onclick={() =>
                                        onNavigate("detalle-partido", {
                                            tab: "mios",
                                            eventoId: ev.id,
                                        })}
                                    class="btn-pt btn-pt-soft btn-pt-sm shrink-0"
                                >
                                    <i
                                        class="bi bi-people-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Armar Equipo</span>
                                </button>
                            </div>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>

        <!-- COMPLEJOS DESTACADOS CONECTADOS A FIRESTORE -->
        <section aria-label="Complejos deportivos y canchas" class="space-y-4">
            <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
                <h2
                    class="text-lg font-bold text-slate-800 flex items-center gap-2"
                >
                    <i
                        class="bi bi-buildings-fill text-blue-600"
                        aria-hidden="true"
                    ></i>
                    <span
                        >Complejos Deportivos ({complejosFiltrados.length})</span
                    >
                </h2>

                <!-- Buscador de complejos o tipo de superficie -->
                <div class="relative w-full sm:w-80">
                    <label for="buscar-complejo" class="sr-only">
                        Buscar complejos, deportes o superficie
                    </label>
                    <i
                        class="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none"
                        aria-hidden="true"
                    ></i>
                    <input
                        id="buscar-complejo"
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Buscar complejo, zona o piso (ej: Hormigón)..."
                        class="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <!-- Filtro de Deportes desde la colección "deportes" de Firestore -->
            <FiltroDeportes
                titulo=""
                textoTodos="Todos los deportes"
                enTarjeta={false}
                seleccionado={filtroDeporte}
                onSeleccionar={(dep) => (filtroDeporte = dep)}
            />

            {#if cargandoComplejos}
                <div class="pt-card empty-state">
                    <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                    <p class="font-bold text-slate-700">
                        Cargando complejos y canchas desde Firestore...
                    </p>
                </div>
            {:else if complejosFiltrados.length === 0}
                <div class="pt-card empty-state">
                    <i class="bi bi-search" aria-hidden="true"></i>
                    <h3 class="font-bold text-slate-800">Sin resultados</h3>
                    <p class="text-sm text-slate-500 mt-1 mb-3">
                        No encontramos complejos que coincidan con tu filtro.
                    </p>
                    <button
                        type="button"
                        onclick={() => {
                            searchTerm = "";
                            filtroDeporte = "";
                        }}
                        class="btn-pt btn-pt-outline btn-pt-sm"
                    >
                        Limpiar filtros
                    </button>
                </div>
            {:else}
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {#each complejosFiltrados as comp (comp.id)}
                        <article
                            class="pt-card hoverable p-5 flex flex-col justify-between gap-4"
                        >
                            <div class="space-y-3">
                                <div class="flex items-start gap-3">
                                    <div
                                        class="w-12 h-12 rounded-xl text-white flex items-center justify-center text-xl shrink-0"
                                        style="background: linear-gradient(135deg, var(--pt-blue), var(--pt-blue-dark))"
                                        aria-hidden="true"
                                    >
                                        <i class="bi bi-buildings-fill"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h3
                                            class="font-bold text-slate-900 text-base leading-snug"
                                        >
                                            {comp.nombre}
                                        </h3>
                                        <p
                                            class="text-xs text-slate-500 mt-1 flex items-center gap-1.5"
                                        >
                                            <i
                                                class="bi bi-geo-alt-fill text-red-500"
                                                aria-hidden="true"
                                            ></i>
                                            <span class="truncate">
                                                {comp.domicilio} · {comp.localidad},
                                                {comp.provincia}
                                            </span>
                                        </p>
                                        {#if comp.telefono}
                                            <p
                                                class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"
                                            >
                                                <i
                                                    class="bi bi-telephone-fill text-emerald-600"
                                                    aria-hidden="true"
                                                ></i>
                                                <span>{comp.telefono}</span>
                                            </p>
                                        {/if}
                                    </div>
                                </div>

                                <div class="flex flex-wrap gap-1.5">
                                    {#each comp.deportes as dep (dep)}
                                        <span class="sport-tag">{dep}</span>
                                    {/each}
                                    <span class="status-badge status-info">
                                        {comp.canchas?.length || 0} canchas
                                    </span>
                                </div>

                                <!-- Subcolección de Canchas desplegable -->
                                {#if complejoExpandidoId === comp.id}
                                    <div
                                        class="pt-3 border-t border-slate-200 space-y-2"
                                    >
                                        <div
                                            class="text-xs font-bold uppercase tracking-wider text-slate-500"
                                        >
                                            Canchas del complejo
                                        </div>
                                        {#if !comp.canchas || comp.canchas.length === 0}
                                            <p class="text-xs text-slate-500">
                                                No hay canchas cargadas en este
                                                complejo.
                                            </p>
                                        {:else}
                                            <div class="space-y-2">
                                                {#each comp.canchas as ca (ca.id)}
                                                    <div
                                                        class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                                                    >
                                                        <div>
                                                            <div
                                                                class="font-bold text-xs text-slate-900"
                                                            >
                                                                Cancha #{ca.numero}
                                                                · {formatearCapacidadCancha(
                                                                    ca.deporte,
                                                                    ca.capacidad,
                                                                )}
                                                            </div>
                                                            <div
                                                                class="text-[11px] text-slate-600"
                                                            >
                                                                Superficie: <strong
                                                                    >{ca.tipo ||
                                                                        "Estándar"}</strong
                                                                >
                                                            </div>
                                                        </div>
                                                        <span
                                                            class="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0"
                                                        >
                                                            ${ca.precio?.toLocaleString(
                                                                "es-AR",
                                                            )}
                                                        </span>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <button
                                type="button"
                                onclick={() => toggleCanchas(comp.id)}
                                class="btn-pt btn-pt-soft w-full"
                            >
                                <i
                                    class="bi {complejoExpandidoId === comp.id
                                        ? 'bi-chevron-up'
                                        : 'bi-eye-fill'}"
                                    aria-hidden="true"
                                ></i>
                                <span>
                                    {complejoExpandidoId === comp.id
                                        ? "Ocultar canchas"
                                        : `Ver canchas disponibles (${comp.canchas?.length || 0})`}
                                </span>
                            </button>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
    </main>
</div>
