<script>
    import Navbar from "../../components/Navbar.svelte";
    import CuadroEquipo from "../../components/partidos/CuadroEquipo.svelte";
    import PanelInvitaciones from "../../components/PanelInvitaciones.svelte";
    import { eventosApi, amistadesApi } from "../../lib/api.js";

    let { eventoId = "", onNavigate = () => {} } = $props();

    // Pestaña interna del partido: 'equipos' | 'invitaciones'
    let seccionActiva = $state("equipos");

    let eventoDetalle = $state(null);
    let amigos = $state([]);
    let jugadoresDisponibles = $state([]);
    let cargando = $state(true);
    let procesandoAccion = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

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
            const [resDet, resAmigos, resDisp] = await Promise.all([
                eventosApi.obtenerDetalle(id, signal),
                amistadesApi.listarAmigos(signal).catch(() => ({ data: [] })),
                eventosApi
                    .listarJugadoresDisponibles("", signal)
                    .catch(() => ({ data: [] })),
            ]);
            eventoDetalle = resDet.data;
            amigos = resAmigos.data || [];
            jugadoresDisponibles = resDisp.data || [];
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
                onNavigate("partidos", { tab: "mios" });
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

    async function handleInvitarPorContacto(valor) {
        if (!eventoDetalle || !valor) return false;
        limpiarMensajes();
        procesandoAccion = true;

        const payload = valor.includes("@")
            ? { email: valor }
            : { telefono: valor };

        try {
            const res = await eventosApi.invitarJugador(
                eventoDetalle.id,
                payload,
            );
            mostrarExito(res.message || "Invitación enviada");
            await cargarPartido(eventoDetalle.id);
            return true;
        } catch (err) {
            errorMsg = err.message;
            return false;
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
            onNavigate("partidos", { tab: "mios" });
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
</script>

<Navbar activePage="partidos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <div class="flex items-center justify-between gap-2 flex-wrap">
            <button
                type="button"
                onclick={() => onNavigate("partidos")}
                class="btn-pt btn-pt-outline btn-pt-sm"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver a Mis Partidos</span>
            </button>

            {#if eventoDetalle?.soyOrganizador && eventoDetalle.estado !== "CANCELADO"}
                <button
                    type="button"
                    onclick={() =>
                        onNavigate("editar-partido", {
                            eventoId: eventoDetalle.id,
                        })}
                    class="btn-pt btn-pt-soft btn-pt-sm"
                >
                    <i class="bi bi-pencil-square" aria-hidden="true"></i>
                    <span>Editar Datos del Partido</span>
                </button>
            {/if}
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

            <!-- PESTAÑAS INTERNAS DEL PARTIDO -->
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

            <!-- SECCIÓN 1: EQUIPOS USANDO EL COMPONENTE REUTILIZABLE CuadroEquipo -->
            {#if seccionActiva === "equipos"}
                <section aria-label="Pizarra de equipos" class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CuadroEquipo
                            tipo="CLARO"
                            jugadores={equipoClaro}
                            puedoEditar={eventoDetalle.miEstado ===
                                "CONFIRMADO"}
                            soyOrganizador={eventoDetalle.soyOrganizador}
                            organizadorUid={eventoDetalle.organizadorUid}
                            onCambiarCamiseta={handleCambiarCamiseta}
                            onExpulsar={handleExpulsarJugador}
                        />

                        <CuadroEquipo
                            tipo="OSCURO"
                            jugadores={equipoOscuro}
                            puedoEditar={eventoDetalle.miEstado ===
                                "CONFIRMADO"}
                            soyOrganizador={eventoDetalle.soyOrganizador}
                            organizadorUid={eventoDetalle.organizadorUid}
                            onCambiarCamiseta={handleCambiarCamiseta}
                            onExpulsar={handleExpulsarJugador}
                        />
                    </div>

                    <CuadroEquipo
                        tipo="SIN_ASIGNAR"
                        jugadores={sinAsignar}
                        puedoEditar={eventoDetalle.miEstado === "CONFIRMADO"}
                        soyOrganizador={eventoDetalle.soyOrganizador}
                        organizadorUid={eventoDetalle.organizadorUid}
                        onCambiarCamiseta={handleCambiarCamiseta}
                        onExpulsar={handleExpulsarJugador}
                    />
                </section>
            {:else if seccionActiva === "invitaciones"}
                <!-- SECCIÓN 2: COMPONENTE COMPARTIDO PanelInvitaciones -->
                <PanelInvitaciones
                    titulo="Enviar Invitación a este Partido"
                    textoBotonInvitar="Invitar"
                    textoYaMiembro="Ya invitado / En partido"
                    placeholderContacto="Ingresá el email o teléfono del jugador..."
                    puedoInvitar={eventoDetalle.miEstado === "CONFIRMADO" &&
                        eventoDetalle.estado !== "CANCELADO"}
                    mostrarSolicitudes={eventoDetalle.soyOrganizador}
                    miembrosActuales={eventoDetalle.participantes}
                    {amigos}
                    {jugadoresDisponibles}
                    {solicitudesIngreso}
                    {invitadosPendientes}
                    {procesandoAccion}
                    onInvitarAmigo={handleInvitarAmigoPorUid}
                    onInvitarContacto={handleInvitarPorContacto}
                    onResolverSolicitud={handleResolverSolicitudEvento}
                />
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
