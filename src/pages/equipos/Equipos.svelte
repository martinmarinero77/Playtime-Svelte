<script>
    import Navbar from "../../components/Navbar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import TarjetaEquipo from "../../components/equipos/TarjetaEquipo.svelte";
    import { equiposApi, amistadesApi } from "../../lib/api.js";

    let { onNavigate = () => {}, initialTab = "mios" } = $props();

    // Pestañas: 'mios' | 'rivales' | 'desafios'
    let tabActiva = $state("mios");
    let filtroDeporte = $state("");

    let cargando = $state(false);
    let procesando = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    let misEquipos = $state([]);
    let rivales = $state([]);
    let desafios = $state([]);
    let amigos = $state([]);

    // Panel de Desafío a otro equipo
    let rivalADesafiar = $state(null);
    let equipoRetadorId = $state("");
    let fechaDesafio = $state("");
    let horaDesafio = $state("21:00");
    let ubicacionDesafio = $state("");
    let mensajeDesafio = $state("");

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

    let misEquiposComoCapitan = $derived(
        misEquipos.filter((e) => e.soyCapitan),
    );
    let desafiosPendientesRecibidos = $derived(
        desafios.filter((d) => d.estado === "PENDIENTE" && d.soyCapitanRival),
    );

    $effect(() => {
        tabActiva = initialTab || "mios";
    });

    $effect(() => {
        const controller = new AbortController();
        const tab = tabActiva;
        const dep = filtroDeporte;
        cargarDatos(tab, dep, controller.signal);
        return () => controller.abort();
    });

    function mostrarExito(msg) {
        exitoMsg = msg;
        errorMsg = "";
        setTimeout(() => {
            if (exitoMsg === msg) exitoMsg = "";
        }, 4000);
    }

    async function cargarDatos(tab, deporte, signal) {
        cargando = true;
        errorMsg = "";
        try {
            const [resMios, resDesafios, resAmigos] = await Promise.all([
                equiposApi.listarMios(signal),
                equiposApi.listarDesafios(signal).catch(() => ({ data: [] })),
                amistadesApi.listarAmigos(signal).catch(() => ({ data: [] })),
            ]);
            misEquipos = resMios?.data || [];
            desafios = resDesafios?.data || [];
            amigos = resAmigos?.data || [];

            if (tab === "rivales") {
                const resRiv = await equiposApi.listarRivales(deporte, signal);
                rivales = resRiv?.data || [];
            }
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleToggleBuscandoRival(eq) {
        errorMsg = "";
        const estadoAnterior = eq.buscandoRival;
        const nuevoEstado = !estadoAnterior;

        // 1. Actualización optimista instantánea en memoria (inmutable con .map - Regla D)
        misEquipos = misEquipos.map((item) =>
            item.id === eq.id ? { ...item, buscandoRival: nuevoEstado } : item,
        );

        try {
            // 2. Guardamos en el backend en segundo plano sin recargar la vista
            await equiposApi.actualizarDisponibilidad(eq.id, {
                buscandoRival: nuevoEstado,
                nivel: eq.nivel,
                diasDisponibles: eq.diasDisponibles,
                horaDesde: eq.horaDesde,
                horaHasta: eq.horaHasta,
            });
        } catch (err) {
            // 3. Si falla la red, revertimos al estado anterior
            misEquipos = misEquipos.map((item) =>
                item.id === eq.id
                    ? { ...item, buscandoRival: estadoAnterior }
                    : item,
            );
            errorMsg = err.message;
        }
    }

    async function handleAgregarMiembro(equipoId, payload) {
        errorMsg = "";
        procesando = true;
        try {
            const res = await equiposApi.agregarMiembro(equipoId, payload);
            mostrarExito(res.message || "Jugador agregado al plantel");
            await cargarDatos(tabActiva, filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
        }
    }

    async function handleQuitarMiembro(equipoId, jugadorUid, nombre) {
        if (!confirm(`¿Quitar a ${nombre} del equipo?`)) return;
        errorMsg = "";
        procesando = true;
        try {
            await equiposApi.quitarMiembro(equipoId, jugadorUid);
            mostrarExito("Plantel actualizado");
            await cargarDatos(tabActiva, filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
        }
    }

    function abrirModalDesafio(rival) {
        if (misEquiposComoCapitan.length === 0) {
            onNavigate("crear-equipo");
            return;
        }
        rivalADesafiar = rival;
        equipoRetadorId = misEquiposComoCapitan[0].id;
        fechaDesafio = "";
        horaDesafio = "21:00";
        ubicacionDesafio = "";
        mensajeDesafio = "";
    }

    async function handleEnviarDesafio(e) {
        e.preventDefault();
        if (
            !rivalADesafiar ||
            !equipoRetadorId ||
            !fechaDesafio ||
            !horaDesafio
        )
            return;
        errorMsg = "";
        procesando = true;
        try {
            const fechaHoraIso = new Date(
                `${fechaDesafio}T${horaDesafio}`,
            ).toISOString();
            const res = await equiposApi.enviarDesafio({
                equipoRetadorId,
                equipoRivalId: rivalADesafiar.id,
                fechaHoraPropuesta: fechaHoraIso,
                ubicacionPropuesta: ubicacionDesafio || "A convenir",
                mensaje: mensajeDesafio || null,
            });
            mostrarExito(res.message || "¡Desafío enviado!");
            rivalADesafiar = null;
            tabActiva = "desafios";
            await cargarDatos("desafios", filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
        }
    }

    async function handleResponderDesafio(desafioId, aceptar) {
        errorMsg = "";
        procesando = true;
        try {
            const res = await equiposApi.responderDesafio(desafioId, aceptar);
            mostrarExito(res.message || "Desafío actualizado");
            await cargarDatos("desafios", filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
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
</script>

<Navbar activePage="equipos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <PageHeader
            etiqueta="Clubes y Retos"
            titulo="Equipos y Desafíos"
            descripcion="Armá tu equipo estable, desafiá a otros equipos de la comunidad y preparate para competir en torneos."
            textoBoton="Crear Equipo"
            iconoBoton="bi-shield-plus"
            onAccion={() => onNavigate("crear-equipo")}
        />

        <!-- Pestañas -->
        <div
            class="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Secciones de Equipos y Desafíos"
        >
            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "mios"}
                onclick={() => (tabActiva = "mios")}
                class="filter-chip {tabActiva === 'mios' ? 'active' : ''}"
            >
                <i class="bi bi-shield-fill" aria-hidden="true"></i>
                <span>Mis Equipos ({misEquipos.length})</span>
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "rivales"}
                onclick={() => (tabActiva = "rivales")}
                class="filter-chip {tabActiva === 'rivales' ? 'active' : ''}"
            >
                <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                <span>Desafiar a otro Equipo</span>
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={tabActiva === "desafios"}
                onclick={() => (tabActiva = "desafios")}
                class="filter-chip {tabActiva === 'desafios' ? 'active' : ''}"
            >
                <i class="bi bi-trophy-fill" aria-hidden="true"></i>
                <span>Mis Desafíos</span>
                {#if desafiosPendientesRecibidos.length > 0}
                    <span
                        class="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                    >
                        {desafiosPendientesRecibidos.length}
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

        <!-- ==================== 1. PESTAÑA MIS EQUIPOS ==================== -->
        {#if tabActiva === "mios"}
            <section aria-label="Mis equipos" class="space-y-4">
                {#if cargando}
                    <div class="pt-card empty-state">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <p class="font-bold text-slate-700">
                            Cargando tus equipos...
                        </p>
                    </div>
                {:else if misEquipos.length === 0}
                    <div class="pt-card empty-state">
                        <i class="bi bi-shield-plus" aria-hidden="true"></i>
                        <h2 class="font-bold text-slate-800 text-base">
                            Todavía no formás parte de ningún equipo
                        </h2>
                        <p class="text-sm text-slate-500 mt-1 mb-4">
                            Creá tu propio equipo para desafiar rivales o
                            anotarte en próximos torneos.
                        </p>
                        <button
                            type="button"
                            onclick={() => onNavigate("crear-equipo")}
                            class="btn-pt btn-pt-success btn-pt-sm"
                        >
                            <i class="bi bi-shield-plus" aria-hidden="true"></i>
                            <span>Crear mi primer equipo</span>
                        </button>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {#each misEquipos as eq (eq.id)}
                            <TarjetaEquipo
                                equipo={eq}
                                esMio={true}
                                onToggleBuscandoRival={handleToggleBuscandoRival}
                                onGestionar={(id) =>
                                    onNavigate("detalle-equipo", {
                                        equipoId: id,
                                    })}
                            />
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- ==================== 2. PESTAÑA DESAFIAR A OTRO EQUIPO ==================== -->
        {:else if tabActiva === "rivales"}
            <section
                aria-label="Equipos buscando rival para desafiar"
                class="space-y-4"
            >
                <div class="pt-card p-4">
                    <div
                        class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                    >
                        Filtrar rivales por deporte
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

                {#if rivalADesafiar}
                    <article
                        class="pt-card p-6 border-l-4 border-l-amber-500 space-y-4"
                    >
                        <div class="flex items-center justify-between">
                            <h2 class="text-lg font-bold text-slate-900">
                                ⚔️ Desafiar a {rivalADesafiar.nombre} ({rivalADesafiar.deporte})
                            </h2>
                            <button
                                type="button"
                                onclick={() => (rivalADesafiar = null)}
                                class="btn-pt btn-pt-outline btn-pt-sm"
                            >
                                Cancelar
                            </button>
                        </div>

                        <form onsubmit={handleEnviarDesafio} class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label
                                        for="des-equipo"
                                        class="block text-sm font-semibold text-slate-700 mb-1"
                                    >
                                        Tu Equipo Retador *
                                    </label>
                                    <select
                                        id="des-equipo"
                                        bind:value={equipoRetadorId}
                                        class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                                    >
                                        {#each misEquiposComoCapitan as me (me.id)}
                                            <option value={me.id}
                                                >{me.nombre} ({me.deporte})</option
                                            >
                                        {/each}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        for="des-fecha"
                                        class="block text-sm font-semibold text-slate-700 mb-1"
                                    >
                                        Fecha Propuesta *
                                    </label>
                                    <input
                                        id="des-fecha"
                                        type="date"
                                        bind:value={fechaDesafio}
                                        required
                                        class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="des-hora"
                                        class="block text-sm font-semibold text-slate-700 mb-1"
                                    >
                                        Hora Propuesta *
                                    </label>
                                    <input
                                        id="des-hora"
                                        type="time"
                                        bind:value={horaDesafio}
                                        required
                                        class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        for="des-lugar"
                                        class="block text-sm font-semibold text-slate-700 mb-1"
                                    >
                                        Complejo / Cancha Propuesta
                                    </label>
                                    <input
                                        id="des-lugar"
                                        type="text"
                                        bind:value={ubicacionDesafio}
                                        placeholder="Ej: Complejo El Monumental"
                                        class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="des-msg"
                                        class="block text-sm font-semibold text-slate-700 mb-1"
                                    >
                                        Mensaje para el Capitán Rival
                                    </label>
                                    <input
                                        id="des-msg"
                                        type="text"
                                        bind:value={mensajeDesafio}
                                        placeholder="Ej: ¿Sale amistoso este jueves?"
                                        class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                                    />
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={procesando}
                                    class="btn-pt btn-pt-primary"
                                >
                                    <i
                                        class="bi bi-lightning-charge-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Enviar Desafío</span>
                                </button>
                            </div>
                        </form>
                    </article>
                {/if}

                {#if cargando}
                    <div class="pt-card empty-state">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <p class="font-bold text-slate-700">
                            Buscando equipos rivales disponibles...
                        </p>
                    </div>
                {:else if rivales.length === 0}
                    <div class="pt-card empty-state">
                        <i class="bi bi-shield-slash" aria-hidden="true"></i>
                        <h2 class="font-bold text-slate-800 text-base">
                            No hay otros equipos buscando rival en este momento
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">
                            Asegurate de que tu equipo tenga activado "Buscando
                            Rival" para que otros puedan desafiarte.
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each rivales as r (r.id)}
                            <TarjetaEquipo
                                equipo={r}
                                esMio={false}
                                onDesafiar={abrirModalDesafio}
                            />
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- ==================== 3. PESTAÑA MIS DESAFÍOS ==================== -->
        {:else if tabActiva === "desafios"}
            <section aria-label="Mis desafíos entre equipos" class="space-y-4">
                {#if desafios.length === 0}
                    <div class="pt-card empty-state">
                        <i class="bi bi-trophy" aria-hidden="true"></i>
                        <h2 class="font-bold text-slate-800 text-base">
                            Todavía no tenés desafíos registrados
                        </h2>
                        <p class="text-sm text-slate-500 mt-1 mb-4">
                            Explorá la pestaña "Desafiar a otro Equipo" para
                            enviar tu primer reto.
                        </p>
                        <button
                            type="button"
                            onclick={() => (tabActiva = "rivales")}
                            class="btn-pt btn-pt-primary btn-pt-sm"
                        >
                            <span>Buscar Equipos Rivales</span>
                        </button>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#each desafios as d (d.id)}
                            <article class="pt-card p-5 space-y-3">
                                <div
                                    class="flex items-center justify-between gap-2"
                                >
                                    <span class="sport-tag">{d.deporte}</span>
                                    <span
                                        class="status-badge {d.estado ===
                                        'ACEPTADO'
                                            ? 'status-accepted'
                                            : d.estado === 'PENDIENTE'
                                              ? 'status-pending'
                                              : 'status-info'}"
                                    >
                                        {d.estado}
                                    </span>
                                </div>

                                <div
                                    class="flex items-center justify-between bg-slate-50 p-3 rounded-xl"
                                >
                                    <div class="text-center flex-1">
                                        <div
                                            class="font-extrabold text-blue-700 text-sm"
                                        >
                                            [{d.equipoRetadorSigla}]
                                        </div>
                                        <div
                                            class="font-bold text-slate-900 text-sm truncate"
                                        >
                                            {d.equipoRetadorNombre}
                                        </div>
                                    </div>
                                    <div
                                        class="px-3 font-extrabold text-slate-400 text-xs"
                                    >
                                        VS
                                    </div>
                                    <div class="text-center flex-1">
                                        <div
                                            class="font-extrabold text-emerald-700 text-sm"
                                        >
                                            [{d.equipoRivalSigla}]
                                        </div>
                                        <div
                                            class="font-bold text-slate-900 text-sm truncate"
                                        >
                                            {d.equipoRivalNombre}
                                        </div>
                                    </div>
                                </div>

                                <div class="text-xs text-slate-600 space-y-1">
                                    <div>
                                        <i
                                            class="bi bi-calendar-event-fill text-blue-600 mr-1"
                                            aria-hidden="true"
                                        ></i>
                                        {formatearFecha(d.fechaHoraPropuesta)}
                                    </div>
                                    <div>
                                        <i
                                            class="bi bi-geo-alt-fill text-red-500 mr-1"
                                            aria-hidden="true"
                                        ></i>
                                        {d.ubicacionPropuesta || "A convenir"}
                                    </div>
                                    {#if d.mensaje}
                                        <p class="italic text-slate-500 pt-1">
                                            "{d.mensaje}"
                                        </p>
                                    {/if}
                                </div>

                                {#if d.estado === "PENDIENTE" && d.soyCapitanRival}
                                    <div class="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            disabled={procesando}
                                            onclick={() =>
                                                handleResponderDesafio(
                                                    d.id,
                                                    true,
                                                )}
                                            class="btn-pt btn-pt-success btn-pt-sm flex-1"
                                        >
                                            <i
                                                class="bi bi-check-lg"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Aceptar Desafío</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={procesando}
                                            onclick={() =>
                                                handleResponderDesafio(
                                                    d.id,
                                                    false,
                                                )}
                                            class="btn-pt btn-pt-danger-soft btn-pt-sm flex-1"
                                        >
                                            <i
                                                class="bi bi-x-lg"
                                                aria-hidden="true"
                                            ></i>
                                            <span>Rechazar</span>
                                        </button>
                                    </div>
                                {/if}
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>
        {/if}
    </main>
</div>
