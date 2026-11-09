<script>
    import Navbar from "../../components/Navbar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import PanelInvitaciones from "../../components/PanelInvitaciones.svelte";
    import {
        equiposApi,
        amistadesApi,
        eventosApi,
        obtenerUsuarioActual,
    } from "../../lib/api.js";

    let { equipoId = "", onNavigate = () => {} } = $props();

    const usuarioActual = obtenerUsuarioActual();

    // Pestañas internas del equipo: 'plantel' | 'invitaciones'
    let seccionActiva = $state("plantel");

    let equipo = $state(null);
    let amigos = $state([]);
    let jugadoresDisponibles = $state([]);

    let cargando = $state(true);
    let procesandoAccion = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    $effect(() => {
        const id = equipoId;
        if (!id) return;
        const controller = new AbortController();
        cargarEquipo(id, controller.signal);
        return () => controller.abort();
    });

    function mostrarExito(msg) {
        exitoMsg = msg;
        errorMsg = "";
        setTimeout(() => {
            if (exitoMsg === msg) exitoMsg = "";
        }, 4000);
    }

    async function cargarEquipo(id, signal) {
        cargando = true;
        errorMsg = "";
        try {
            const [resMios, resAmigos] = await Promise.all([
                equiposApi.listarMios(signal),
                amistadesApi.listarAmigos(signal).catch(() => ({ data: [] })),
            ]);

            const encontrado = (resMios?.data || []).find((e) => e.id === id);
            if (!encontrado) {
                errorMsg = "No se encontró el equipo o no formás parte de él.";
                equipo = null;
                return;
            }

            equipo = encontrado;
            amigos = resAmigos?.data || [];

            const resBolsa = await eventosApi
                .listarJugadoresDisponibles(encontrado.deporte, signal)
                .catch(() => ({ data: [] }));
            jugadoresDisponibles = resBolsa?.data || [];
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleSumarPorUid(uid) {
        if (!equipo) return;
        errorMsg = "";
        procesandoAccion = true;
        try {
            const res = await equiposApi.agregarMiembro(equipo.id, { uid });
            mostrarExito(res.message || "Jugador sumado al plantel");
            await cargarEquipo(equipo.id);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleSumarPorContacto(email) {
        if (!equipo) return false;
        errorMsg = "";
        procesandoAccion = true;
        try {
            const res = await equiposApi.agregarMiembro(equipo.id, { email });
            mostrarExito(res.message || "Jugador sumado al plantel");
            await cargarEquipo(equipo.id);
            return true;
        } catch (err) {
            errorMsg = err.message;
            return false;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleQuitarJugador(jugadorUid, nombre) {
        if (!equipo) return;
        const esPropio = jugadorUid === usuarioActual.uid;
        const pregunta = esPropio
            ? `¿Seguro que querés abandonar el equipo "${equipo.nombre}"?`
            : `¿Quitar a ${nombre} del plantel de "${equipo.nombre}"?`;

        if (!confirm(pregunta)) return;

        errorMsg = "";
        procesandoAccion = true;
        try {
            await equiposApi.quitarMiembro(equipo.id, jugadorUid);
            if (esPropio) {
                onNavigate("equipos");
                return;
            }
            mostrarExito(`${nombre} fue removido del plantel`);
            await cargarEquipo(equipo.id);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }
</script>

<Navbar activePage="equipos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <button
                type="button"
                onclick={() => onNavigate("equipos")}
                class="btn-pt btn-pt-outline btn-pt-sm"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver a Mis Equipos</span>
            </button>

            {#if equipo?.soyCapitan}
                <button
                    type="button"
                    onclick={() =>
                        onNavigate("editar-equipo", { equipoId: equipo.id })}
                    class="btn-pt btn-pt-primary btn-pt-sm"
                >
                    <i class="bi bi-pencil-square" aria-hidden="true"></i>
                    <span>Editar Datos del Equipo</span>
                </button>
            {/if}
        </div>

        {#if cargando}
            <div class="pt-card empty-state">
                <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                <p class="font-bold text-slate-700">
                    Cargando detalle del equipo...
                </p>
            </div>
        {:else if !equipo}
            <div class="pt-card empty-state">
                <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
                <h1 class="font-bold text-slate-800 text-lg">
                    {errorMsg || "Equipo no encontrado"}
                </h1>
            </div>
        {:else}
            <PageHeader
                etiqueta={`${equipo.deporte} · Nivel ${equipo.nivel} · ${equipo.buscandoRival ? "🟢 Buscando Rival" : "⚪ Oculto"}`}
                titulo={`[${equipo.sigla}] ${equipo.nombre}`}
                descripcion={`Capitán: ${equipo.capitanNombre} · Días: ${equipo.diasDisponibles || "A convenir"}${equipo.horaDesde ? ` (${equipo.horaDesde} a ${equipo.horaHasta} hs)` : ""}${equipo.localidad ? ` · Zona: ${equipo.localidad}` : ""}`}
            />

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
                        <i class="bi bi-check-circle-fill" aria-hidden="true"
                        ></i>
                        <span>{exitoMsg}</span>
                    </div>
                </div>
            {/if}

            <!-- Pestañas igual que en DetallePartido -->
            <div
                class="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Secciones del equipo"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={seccionActiva === "plantel"}
                    onclick={() => (seccionActiva = "plantel")}
                    class="filter-chip {seccionActiva === 'plantel'
                        ? 'active'
                        : ''}"
                >
                    <i class="bi bi-people-fill" aria-hidden="true"></i>
                    <span>Plantel ({equipo.miembros.length})</span>
                </button>

                {#if equipo.soyCapitan}
                    <button
                        type="button"
                        role="tab"
                        aria-selected={seccionActiva === "invitaciones"}
                        onclick={() => (seccionActiva = "invitaciones")}
                        class="filter-chip {seccionActiva === 'invitaciones'
                            ? 'active'
                            : ''}"
                    >
                        <i class="bi bi-person-plus-fill" aria-hidden="true"
                        ></i>
                        <span>Sumar / Invitar Jugadores</span>
                    </button>
                {/if}
            </div>

            {#if seccionActiva === "plantel"}
                <section
                    aria-label="Jugadores del plantel"
                    class="pt-card p-6 space-y-4"
                >
                    <div
                        class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3"
                    >
                        <h2 class="text-lg font-bold text-slate-900">
                            Jugadores del Plantel ({equipo.miembros.length})
                        </h2>

                        {#if !equipo.soyCapitan}
                            <button
                                type="button"
                                disabled={procesandoAccion}
                                onclick={() =>
                                    handleQuitarJugador(
                                        usuarioActual.uid,
                                        usuarioActual.nombre,
                                    )}
                                class="btn-pt btn-pt-danger-soft btn-pt-sm"
                            >
                                <i
                                    class="bi bi-box-arrow-right"
                                    aria-hidden="true"
                                ></i>
                                <span>Abandonar Equipo</span>
                            </button>
                        {/if}
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each equipo.miembros as m (m.uid)}
                            <div class="player-card p-3">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="player-avatar"
                                        style="background: {m.rol === 'CAPITAN'
                                            ? 'var(--pt-blue)'
                                            : '#475569'}"
                                    >
                                        {m.nombre
                                            ? m.nombre.charAt(0).toUpperCase()
                                            : "J"}
                                    </div>
                                    <div>
                                        <div
                                            class="font-bold text-sm text-slate-900"
                                        >
                                            {m.nombre}
                                        </div>
                                        <div class="mt-0.5">
                                            {#if m.rol === "CAPITAN"}
                                                <span
                                                    class="status-badge status-info"
                                                >
                                                    ⭐ Capitán
                                                </span>
                                            {:else}
                                                <span
                                                    class="text-xs text-slate-500"
                                                >
                                                    Jugador
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>

                                {#if equipo.soyCapitan && m.rol !== "CAPITAN"}
                                    <button
                                        type="button"
                                        disabled={procesandoAccion}
                                        onclick={() =>
                                            handleQuitarJugador(
                                                m.uid,
                                                m.nombre,
                                            )}
                                        aria-label={`Quitar a ${m.nombre} del equipo`}
                                        class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-trash-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>Quitar</span>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </section>
            {:else if seccionActiva === "invitaciones"}
                <!-- REUTILIZACIÓN DEL COMPONENTE COMPARTIDO PanelInvitaciones -->
                <PanelInvitaciones
                    titulo={`Sumar Jugadores a ${equipo.nombre}`}
                    textoBotonInvitar="Sumar al Plantel"
                    textoYaMiembro="Ya en el plantel"
                    placeholderContacto="Ingresá el email del jugador para sumarlo..."
                    puedoInvitar={equipo.soyCapitan}
                    mostrarSolicitudes={false}
                    miembrosActuales={equipo.miembros}
                    {amigos}
                    {jugadoresDisponibles}
                    {procesandoAccion}
                    onInvitarAmigo={handleSumarPorUid}
                    onInvitarContacto={handleSumarPorContacto}
                />
            {/if}
        {/if}
    </main>
</div>
