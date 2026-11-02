<script>
    import Navbar from "../components/Navbar.svelte";
    import { eventosApi, amistadesApi } from "../lib/api.js";

    let { eventoId = "", onNavigate = () => {} } = $props();

    // Pestaña interna del partido: 'equipos' | 'invitaciones'
    let seccionActiva = $state("equipos");

    let eventoDetalle = $state(null);
    let amigos = $state([]);
    let cargando = $state(true);
    let procesandoAccion = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    // Formulario de invitación
    let modoInvitacion = $state("amigo"); // 'amigo' | 'contacto'
    let contactoInvitar = $state("");

    // Estados derivados de participantes (R-08)
    let confirmados = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter(
                  (p) => p.estado === "CONFIRMADO",
              )
            : [],
    );
    let equipoClaro = $derived(
        confirmados.filter((p) => p.camiseta === "CLARO"),
    );
    let equipoOscuro = $derived(
        confirmados.filter((p) => p.camiseta === "OSCURO"),
    );
    let sinAsignar = $derived(
        confirmados.filter((p) => p.camiseta === "SIN_ASIGNAR"),
    );
    let solicitudesIngreso = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter(
                  (p) => p.estado === "SOLICITADO",
              )
            : [],
    );
    let invitadosPendientes = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter((p) => p.estado === "INVITADO")
            : [],
    );

    $effect(() => {
        const controller = new AbortController();
        const idActual = eventoId;
        if (idActual) {
            cargarPartido(idActual, controller.signal);
        }
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

    async function cargarPartido(id, signal) {
        cargando = true;
        errorMsg = "";
        try {
            const [resDet, resAmigos] = await Promise.all([
                eventosApi.obtenerDetalle(id, signal),
                amistadesApi.listarAmigos(signal).catch(() => ({ data: [] })),
            ]);
            eventoDetalle = resDet.data;
            amigos = resAmigos.data || [];
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleCambiarCamiseta(jugadorUid, nuevaCamiseta) {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.cambiarCamiseta(
                eventoDetalle.id,
                jugadorUid,
                nuevaCamiseta,
            );
            eventoDetalle = res.data;
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleUnirsePublico() {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.unirsePublico(eventoDetalle.id);
            eventoDetalle = res.data;
            mostrarExito(res.message || "Solicitud procesada");
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleResponderInvitacion(aceptar) {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.responderInvitacion(
                eventoDetalle.id,
                aceptar,
            );
            if (aceptar && res.data) {
                eventoDetalle = res.data;
                mostrarExito(
                    "¡Aceptaste la invitación! Ya podés elegir camiseta.",
                );
            } else {
                onNavigate("comunidad", { tab: "mios" });
            }
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleInvitarAmigoPorUid(uidAmigo) {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.invitarJugador(eventoDetalle.id, {
                uid: uidAmigo,
            });
            mostrarExito(res.message || "Jugador invitado al partido");
            await cargarPartido(eventoDetalle.id);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleInvitarPorContacto(e) {
        e.preventDefault();
        if (!eventoDetalle || !contactoInvitar.trim()) return;
        limpiarMensajes();
        procesandoAccion = true;

        const valor = contactoInvitar.trim();
        const payload = valor.includes("@")
            ? { email: valor }
            : { telefono: valor };

        try {
            const res = await eventosApi.invitarJugador(
                eventoDetalle.id,
                payload,
            );
            contactoInvitar = "";
            mostrarExito(res.message || "Invitación enviada");
            await cargarPartido(eventoDetalle.id);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleResolverSolicitudEvento(solicitanteUid, aceptar) {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.resolverSolicitud(
                eventoDetalle.id,
                solicitanteUid,
                aceptar,
            );
            eventoDetalle = res.data;
            mostrarExito(res.message || "Solicitud actualizada");
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleExpulsarJugador(jugadorUid, nombre) {
        if (!eventoDetalle) return;
        if (!confirm(`¿Seguro que querés quitar a ${nombre} del partido?`))
            return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            await eventosApi.expulsarJugador(eventoDetalle.id, jugadorUid);
            mostrarExito(`${nombre} fue eliminado del partido.`);
            await cargarPartido(eventoDetalle.id);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleAbandonarOCancelar() {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            if (eventoDetalle.soyOrganizador) {
                if (
                    !confirm(
                        "¿Seguro que querés cancelar este partido para todos?",
                    )
                ) {
                    procesandoAccion = false;
                    return;
                }
                await eventosApi.cancelar(eventoDetalle.id);
            } else {
                if (!confirm("¿Seguro que querés salir de este partido?")) {
                    procesandoAccion = false;
                    return;
                }
                await eventosApi.abandonar(eventoDetalle.id);
            }
            onNavigate("comunidad", { tab: "mios" });
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    function formatearFecha(iso) {
        if (!iso) return "";
        return new Date(iso).toLocaleString("es-AR", {
            weekday: "long",
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

<Navbar activePage="comunidad" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <div class="flex items-center justify-between gap-2">
            <button
                type="button"
                onclick={() => onNavigate("comunidad", { tab: "mios" })}
                class="btn-pt btn-pt-outline btn-pt-sm"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver a Mis Partidos</span>
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

        {#if cargando}
            <div class="pt-card empty-state">
                <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                <h1 class="font-bold text-slate-800 text-lg">
                    Cargando información del partido...
                </h1>
            </div>
        {:else if !eventoDetalle}
            <div class="pt-card empty-state">
                <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
                <h1 class="font-bold text-slate-800 text-lg">
                    No se pudo encontrar el partido
                </h1>
            </div>
        {:else}
            <!-- CABECERA DEL PARTIDO (H-12: único h1 de la vista) -->
            <header class="pt-page-header flex-wrap">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span
                            class="badge rounded-full px-2.5 py-0.5 text-xs font-bold bg-white/20"
                        >
                            {eventoDetalle.deporte}
                        </span>
                        <span
                            class="badge rounded-full px-2.5 py-0.5 text-xs font-bold bg-white/20"
                        >
                            {eventoDetalle.visibilidad === "PUBLICO"
                                ? `Público (${eventoDetalle.modoIngreso === "LIBRE" ? "Libre" : "Con aprobación"})`
                                : "Privado"}
                        </span>
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-extrabold">
                        {eventoDetalle.titulo}
                    </h1>
                    <p class="text-sm text-blue-100/90 mt-1">
                        Organiza: <strong
                            >{eventoDetalle.organizadorNombre}</strong
                        >
                        · {formatearFecha(eventoDetalle.fechaHora)}
                        · {eventoDetalle.ubicacionTexto || "Lugar a definir"}
                    </p>
                </div>

                <div class="text-right">
                    <div class="text-2xl font-extrabold">
                        {eventoDetalle.cantConfirmados}/{eventoDetalle.cupoMaximo}
                    </div>
                    <div class="text-xs text-blue-100">
                        {eventoDetalle.lugaresLibres} lugares libres
                    </div>
                </div>
            </header>

            {#if eventoDetalle.descripcion}
                <div class="pt-card p-4 text-sm text-slate-700">
                    <strong class="text-slate-900">Notas del partido:</strong>
                    {eventoDetalle.descripcion}
                </div>
            {/if}

            <!-- Acciones rápidas si aún no estoy confirmado -->
            {#if !eventoDetalle.miEstado && eventoDetalle.visibilidad === "PUBLICO" && eventoDetalle.estado === "ABIERTO"}
                <div
                    class="pt-card p-4 flex items-center justify-between flex-wrap gap-3"
                >
                    <p class="text-sm text-slate-700">
                        Este partido está abierto. ¿Querés sumarte?
                    </p>
                    <button
                        type="button"
                        disabled={procesandoAccion}
                        onclick={handleUnirsePublico}
                        class="btn-pt btn-pt-primary"
                    >
                        <i class="bi bi-person-plus-fill" aria-hidden="true"
                        ></i>
                        <span>
                            {eventoDetalle.modoIngreso === "LIBRE"
                                ? "Unirme al Partido"
                                : "Solicitar Unirme"}
                        </span>
                    </button>
                </div>
            {:else if eventoDetalle.miEstado === "INVITADO"}
                <div
                    class="pt-card p-4 flex items-center justify-between flex-wrap gap-3 border-l-4 border-l-amber-500"
                >
                    <p class="text-sm font-semibold text-slate-800">
                        Tenés una invitación pendiente para jugar este partido.
                    </p>
                    <div class="flex gap-2">
                        <button
                            type="button"
                            disabled={procesandoAccion}
                            onclick={() => handleResponderInvitacion(true)}
                            class="btn-pt btn-pt-success btn-pt-sm"
                        >
                            <i class="bi bi-check-lg" aria-hidden="true"></i>
                            <span>Aceptar Invitación</span>
                        </button>
                        <button
                            type="button"
                            disabled={procesandoAccion}
                            onclick={() => handleResponderInvitacion(false)}
                            class="btn-pt btn-pt-danger-soft btn-pt-sm"
                        >
                            <i class="bi bi-x-lg" aria-hidden="true"></i>
                            <span>Rechazar</span>
                        </button>
                    </div>
                </div>
            {/if}

            <!-- PESTAÑAS INTERNAS DEL PARTIDO: 1. Equipos | 2. Invitaciones y Solicitudes -->
            <div
                class="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Gestión del partido"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={seccionActiva === "equipos"}
                    onclick={() => (seccionActiva = "equipos")}
                    class="filter-chip {seccionActiva === 'equipos'
                        ? 'active'
                        : ''}"
                >
                    <i class="bi bi-shield-fill" aria-hidden="true"></i>
                    <span>Equipos (Claro vs. Oscuro)</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={seccionActiva === "invitaciones"}
                    onclick={() => (seccionActiva = "invitaciones")}
                    class="filter-chip {seccionActiva === 'invitaciones'
                        ? 'active'
                        : ''}"
                >
                    <i class="bi bi-send-fill" aria-hidden="true"></i>
                    <span>Invitaciones y Solicitudes</span>
                    {#if solicitudesIngreso.length + invitadosPendientes.length > 0}
                        <span
                            class="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                        >
                            {solicitudesIngreso.length +
                                invitadosPendientes.length}
                        </span>
                    {/if}
                </button>
            </div>

            <!-- ==================== SECCIÓN 1: EQUIPOS CLARO VS OSCURO ==================== -->
            {#if seccionActiva === "equipos"}
                <section aria-label="Pizarra de equipos" class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- EQUIPO CLARO -->
                        <article class="pt-card">
                            <div
                                class="pt-card-header-blue flex items-center justify-between"
                            >
                                <h2
                                    class="text-base font-bold flex items-center gap-2"
                                >
                                    <i
                                        class="bi bi-shield-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Equipo Claro</span>
                                </h2>
                                <span
                                    class="bg-white text-blue-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full"
                                >
                                    {equipoClaro.length}
                                </span>
                            </div>

                            <div class="p-4 space-y-2.5">
                                {#if equipoClaro.length === 0}
                                    <p
                                        class="text-xs text-slate-400 italic text-center py-4"
                                    >
                                        Sin jugadores en el Equipo Claro
                                    </p>
                                {:else}
                                    {#each equipoClaro as p (p.uid)}
                                        <div class="player-card">
                                            <div
                                                class="flex items-center gap-3 min-w-0"
                                            >
                                                <div
                                                    class="player-avatar"
                                                    style="background: var(--pt-blue-light)"
                                                >
                                                    {inicialNombre(p.nombre)}
                                                </div>
                                                <div class="min-w-0">
                                                    <div
                                                        class="font-semibold text-sm text-slate-800 truncate"
                                                    >
                                                        {p.nombre}
                                                        {#if p.apodo}
                                                            <span
                                                                class="text-slate-500 font-normal"
                                                                >({p.apodo})</span
                                                            >
                                                        {/if}
                                                    </div>
                                                    {#if p.rol === "ORGANIZADOR"}
                                                        <span
                                                            class="text-[11px] text-blue-700 font-semibold"
                                                        >
                                                            <i
                                                                class="bi bi-star-fill"
                                                                aria-hidden="true"
                                                            ></i> Anfitrión
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>

                                            {#if eventoDetalle.miEstado === "CONFIRMADO"}
                                                <div
                                                    class="flex items-center gap-1.5 shrink-0"
                                                >
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "OSCURO",
                                                            )}
                                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                                        title="Pasar al Equipo Oscuro"
                                                        aria-label={`Pasar a ${p.nombre} al Equipo Oscuro`}
                                                    >
                                                        <i
                                                            class="bi bi-arrow-right"
                                                            aria-hidden="true"
                                                        ></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "SIN_ASIGNAR",
                                                            )}
                                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                                        title="Quitar camiseta"
                                                        aria-label={`Dejar sin equipo a ${p.nombre}`}
                                                    >
                                                        <i
                                                            class="bi bi-x-lg"
                                                            aria-hidden="true"
                                                        ></i>
                                                    </button>
                                                    {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                        <button
                                                            type="button"
                                                            onclick={() =>
                                                                handleExpulsarJugador(
                                                                    p.uid,
                                                                    p.nombre,
                                                                )}
                                                            class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                                            aria-label={`Eliminar a ${p.nombre} del partido`}
                                                        >
                                                            <i
                                                                class="bi bi-trash-fill"
                                                                aria-hidden="true"
                                                            ></i>
                                                        </button>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </article>

                        <!-- EQUIPO OSCURO -->
                        <article class="pt-card">
                            <div
                                class="pt-card-header-dark flex items-center justify-between"
                            >
                                <h2
                                    class="text-base font-bold flex items-center gap-2"
                                >
                                    <i
                                        class="bi bi-shield-fill"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Equipo Oscuro</span>
                                </h2>
                                <span
                                    class="bg-white text-slate-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full"
                                >
                                    {equipoOscuro.length}
                                </span>
                            </div>

                            <div class="p-4 space-y-2.5">
                                {#if equipoOscuro.length === 0}
                                    <p
                                        class="text-xs text-slate-400 italic text-center py-4"
                                    >
                                        Sin jugadores en el Equipo Oscuro
                                    </p>
                                {:else}
                                    {#each equipoOscuro as p (p.uid)}
                                        <div class="player-card">
                                            <div
                                                class="flex items-center gap-3 min-w-0"
                                            >
                                                <div
                                                    class="player-avatar"
                                                    style="background: var(--pt-gray-800)"
                                                >
                                                    {inicialNombre(p.nombre)}
                                                </div>
                                                <div class="min-w-0">
                                                    <div
                                                        class="font-semibold text-sm text-slate-800 truncate"
                                                    >
                                                        {p.nombre}
                                                        {#if p.apodo}
                                                            <span
                                                                class="text-slate-500 font-normal"
                                                                >({p.apodo})</span
                                                            >
                                                        {/if}
                                                    </div>
                                                    {#if p.rol === "ORGANIZADOR"}
                                                        <span
                                                            class="text-[11px] text-blue-700 font-semibold"
                                                        >
                                                            <i
                                                                class="bi bi-star-fill"
                                                                aria-hidden="true"
                                                            ></i> Anfitrión
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>

                                            {#if eventoDetalle.miEstado === "CONFIRMADO"}
                                                <div
                                                    class="flex items-center gap-1.5 shrink-0"
                                                >
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "CLARO",
                                                            )}
                                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                                        title="Pasar al Equipo Claro"
                                                        aria-label={`Pasar a ${p.nombre} al Equipo Claro`}
                                                    >
                                                        <i
                                                            class="bi bi-arrow-left"
                                                            aria-hidden="true"
                                                        ></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "SIN_ASIGNAR",
                                                            )}
                                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                                        title="Quitar camiseta"
                                                        aria-label={`Dejar sin equipo a ${p.nombre}`}
                                                    >
                                                        <i
                                                            class="bi bi-x-lg"
                                                            aria-hidden="true"
                                                        ></i>
                                                    </button>
                                                    {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                        <button
                                                            type="button"
                                                            onclick={() =>
                                                                handleExpulsarJugador(
                                                                    p.uid,
                                                                    p.nombre,
                                                                )}
                                                            class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                                            aria-label={`Eliminar a ${p.nombre} del partido`}
                                                        >
                                                            <i
                                                                class="bi bi-trash-fill"
                                                                aria-hidden="true"
                                                            ></i>
                                                        </button>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </article>
                    </div>

                    <!-- JUGADORES SIN EQUIPO ASIGNADO -->
                    <article class="pt-card">
                        <div
                            class="pt-card-header-orange flex items-center justify-between"
                        >
                            <h2
                                class="text-base font-bold flex items-center gap-2"
                            >
                                <i class="bi bi-people-fill" aria-hidden="true"
                                ></i>
                                <span>Jugadores sin equipo asignado</span>
                            </h2>
                            <span
                                class="bg-white text-orange-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full"
                            >
                                {sinAsignar.length}
                            </span>
                        </div>

                        <div class="p-4">
                            {#if sinAsignar.length === 0}
                                <p
                                    class="text-xs text-slate-500 text-center py-2"
                                >
                                    Todos los jugadores confirmados ya tienen
                                    camiseta asignada.
                                </p>
                            {:else}
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-3"
                                >
                                    {#each sinAsignar as p (p.uid)}
                                        <div class="player-card">
                                            <div
                                                class="flex items-center gap-3 min-w-0"
                                            >
                                                <div
                                                    class="player-avatar"
                                                    style="background: var(--pt-orange)"
                                                >
                                                    {inicialNombre(p.nombre)}
                                                </div>
                                                <div class="min-w-0">
                                                    <div
                                                        class="font-semibold text-sm text-slate-800 truncate"
                                                    >
                                                        {p.nombre}
                                                    </div>
                                                    {#if p.rol === "ORGANIZADOR"}
                                                        <span
                                                            class="text-[11px] text-blue-700 font-semibold"
                                                        >
                                                            <i
                                                                class="bi bi-star-fill"
                                                                aria-hidden="true"
                                                            ></i> Anfitrión
                                                        </span>
                                                    {/if}
                                                </div>
                                            </div>

                                            {#if eventoDetalle.miEstado === "CONFIRMADO"}
                                                <div
                                                    class="flex items-center gap-1.5 shrink-0"
                                                >
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "CLARO",
                                                            )}
                                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                                    >
                                                        <i
                                                            class="bi bi-shield-fill"
                                                            aria-hidden="true"
                                                        ></i>
                                                        <span>Claro</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "OSCURO",
                                                            )}
                                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                                    >
                                                        <i
                                                            class="bi bi-shield-fill"
                                                            aria-hidden="true"
                                                        ></i>
                                                        <span>Oscuro</span>
                                                    </button>
                                                    {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                        <button
                                                            type="button"
                                                            onclick={() =>
                                                                handleExpulsarJugador(
                                                                    p.uid,
                                                                    p.nombre,
                                                                )}
                                                            class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                                            aria-label={`Eliminar a ${p.nombre}`}
                                                        >
                                                            <i
                                                                class="bi bi-trash-fill"
                                                                aria-hidden="true"
                                                            ></i>
                                                        </button>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </article>
                </section>

                <!-- ==================== SECCIÓN 2: INVITACIONES Y SOLICITUDES DE ESTE PARTIDO ==================== -->
            {:else if seccionActiva === "invitaciones"}
                <section
                    aria-label="Invitaciones y solicitudes del partido"
                    class="space-y-5"
                >
                    {#if eventoDetalle.miEstado === "CONFIRMADO" && eventoDetalle.estado !== "CANCELADO"}
                        <article class="pt-card p-5 space-y-4">
                            <div
                                class="flex flex-wrap items-center justify-between gap-2"
                            >
                                <h2
                                    class="text-base font-bold text-slate-900 flex items-center gap-2"
                                >
                                    <i
                                        class="bi bi-send-fill text-emerald-600"
                                        aria-hidden="true"
                                    ></i>
                                    <span>Enviar Invitación a este Partido</span
                                    >
                                </h2>

                                <div class="flex gap-2">
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (modoInvitacion = "amigo")}
                                        class="filter-chip {modoInvitacion ===
                                        'amigo'
                                            ? 'active'
                                            : ''}"
                                    >
                                        <i
                                            class="bi bi-people-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>De mis Amigos</span>
                                    </button>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (modoInvitacion = "contacto")}
                                        class="filter-chip {modoInvitacion ===
                                        'contacto'
                                            ? 'active'
                                            : ''}"
                                    >
                                        <i
                                            class="bi bi-envelope-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>Por Email o Teléfono</span>
                                    </button>
                                </div>
                            </div>

                            {#if modoInvitacion === "amigo"}
                                {#if amigos.length === 0}
                                    <p class="text-sm text-slate-500">
                                        Todavía no tenés amigos en tu lista.
                                        Podés invitar por email/teléfono o
                                        agregar amigos en la sección "Mis
                                        Amigos".
                                    </p>
                                {:else}
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-2 gap-3"
                                    >
                                        {#each amigos as a (a.uid)}
                                            {@const yaEsta =
                                                eventoDetalle.participantes.some(
                                                    (p) => p.uid === a.uid,
                                                )}
                                            <div class="player-card">
                                                <div
                                                    class="flex items-center gap-3 min-w-0"
                                                >
                                                    <div
                                                        class="player-avatar"
                                                        style="background: var(--pt-blue)"
                                                    >
                                                        {inicialNombre(
                                                            a.nombre,
                                                        )}
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
                                                            {a.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                {#if yaEsta}
                                                    <span
                                                        class="status-badge status-info"
                                                    >
                                                        Ya invitado / En partido
                                                    </span>
                                                {:else}
                                                    <button
                                                        type="button"
                                                        disabled={procesandoAccion}
                                                        onclick={() =>
                                                            handleInvitarAmigoPorUid(
                                                                a.uid,
                                                            )}
                                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                                    >
                                                        <i
                                                            class="bi bi-send-fill"
                                                            aria-hidden="true"
                                                        ></i>
                                                        <span>Invitar</span>
                                                    </button>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            {:else}
                                <form
                                    onsubmit={handleInvitarPorContacto}
                                    class="flex flex-col sm:flex-row gap-3"
                                >
                                    <label
                                        for="input-contacto-invitar"
                                        class="sr-only"
                                    >
                                        Email o teléfono del jugador a invitar
                                    </label>
                                    <input
                                        id="input-contacto-invitar"
                                        type="text"
                                        bind:value={contactoInvitar}
                                        required
                                        placeholder="Ingresá el email o teléfono del jugador..."
                                        class="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={procesandoAccion}
                                        class="btn-pt btn-pt-primary"
                                    >
                                        <i
                                            class="bi bi-send-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>Enviar Invitación</span>
                                    </button>
                                </form>
                            {/if}
                        </article>
                    {/if}

                    {#if eventoDetalle.soyOrganizador}
                        <!-- Solicitudes para unirse -->
                        <article class="pt-card p-5 space-y-3">
                            <h2
                                class="text-base font-bold text-slate-900 flex items-center gap-2"
                            >
                                <i
                                    class="bi bi-person-check-fill text-amber-500"
                                    aria-hidden="true"
                                ></i>
                                <span
                                    >Solicitudes para unirse ({solicitudesIngreso.length})</span
                                >
                            </h2>

                            {#if solicitudesIngreso.length === 0}
                                <p class="text-sm text-slate-500">
                                    No hay solicitudes pendientes de aprobación
                                    en este momento.
                                </p>
                            {:else}
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-3"
                                >
                                    {#each solicitudesIngreso as s (s.uid)}
                                        <div class="player-card">
                                            <span
                                                class="font-semibold text-sm text-slate-800"
                                            >
                                                {s.nombre}
                                            </span>
                                            <div class="flex gap-2">
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        handleResolverSolicitudEvento(
                                                            s.uid,
                                                            true,
                                                        )}
                                                    class="btn-pt btn-pt-success btn-pt-sm"
                                                >
                                                    <i
                                                        class="bi bi-check-lg"
                                                        aria-hidden="true"
                                                    ></i>
                                                    <span>Aprobar</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        handleResolverSolicitudEvento(
                                                            s.uid,
                                                            false,
                                                        )}
                                                    class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                                >
                                                    <i
                                                        class="bi bi-x-lg"
                                                        aria-hidden="true"
                                                    ></i>
                                                    <span>Rechazar</span>
                                                </button>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </article>

                        <!-- Invitados pendientes de aceptar -->
                        <article class="pt-card p-5 space-y-3">
                            <h2
                                class="text-base font-bold text-slate-900 flex items-center gap-2"
                            >
                                <i
                                    class="bi bi-clock-history text-blue-600"
                                    aria-hidden="true"
                                ></i>
                                <span
                                    >Invitados pendientes de respuesta ({invitadosPendientes.length})</span
                                >
                            </h2>

                            {#if invitadosPendientes.length === 0}
                                <p class="text-sm text-slate-500">
                                    No hay invitaciones pendientes de respuesta.
                                </p>
                            {:else}
                                <div class="flex flex-wrap gap-2">
                                    {#each invitadosPendientes as inv (inv.uid)}
                                        <span
                                            class="status-badge status-pending"
                                        >
                                            <i
                                                class="bi bi-clock-history"
                                                aria-hidden="true"
                                            ></i>
                                            <span>{inv.nombre}</span>
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </article>
                    {/if}
                </section>
            {/if}

            <!-- Botón de Abandonar o Cancelar Evento -->
            {#if eventoDetalle.miEstado === "CONFIRMADO" && eventoDetalle.estado !== "CANCELADO"}
                <div class="flex justify-end pt-2">
                    <button
                        type="button"
                        onclick={handleAbandonarOCancelar}
                        class="btn-pt btn-pt-danger-soft"
                    >
                        <i class="bi bi-x-circle-fill" aria-hidden="true"></i>
                        <span>
                            {eventoDetalle.soyOrganizador
                                ? "Cancelar este Partido"
                                : "Salir del Partido"}
                        </span>
                    </button>
                </div>
            {/if}
        {/if}
    </main>
</div>
