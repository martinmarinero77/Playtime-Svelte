<script>
    import Navbar from "../components/Navbar.svelte";
    import { eventosApi, amistadesApi } from "../lib/api.js";

    let {
        onNavigate = () => {},
        initialTab = "explorar",
        initialOpenCreate = false,
    } = $props();
    // Pestaña principal: 'explorar' | 'mios' | 'amigos'
    let tabActiva = $state(initialTab);
    let filtroDeporte = $state("");

    // Estados de carga y feedback
    let cargando = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    // Datos de eventos
    let eventosPublicos = $state([]);
    let misEventos = $state([]);
    let misInvitaciones = $state([]);

    // Detalle de un partido abierto (Pizarra de equipos Claro vs Oscuro)
    let eventoDetalle = $state(null);
    let cargandoDetalle = $state(false);
    let procesandoAccion = $state(false);

    // Invitar jugador dentro del detalle
    let modoInvitacion = $state("amigo"); // 'amigo' | 'contacto'
    let contactoInvitar = $state(""); // email o teléfono

    // Modal Crear Evento
    let mostrarModalCrear = $state(initialOpenCreate);
    let nuevoTitulo = $state("");
    let nuevoDeporte = $state("Fútbol 5");
    let nuevaFechaHora = $state("");
    let nuevaUbicacion = $state("");
    let nuevoCupo = $state(10);
    let nuevaVisibilidad = $state("PUBLICO");
    let nuevoModoIngreso = $state("LIBRE");
    let nuevaDescripcion = $state("");

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

    // Estado derivado (Svelte 5 $derived - sin duplicar estado R-08)
    let confirmadosDetalle = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter(
                  (p) => p.estado === "CONFIRMADO",
              )
            : [],
    );
    let equipoClaro = $derived(
        confirmadosDetalle.filter((p) => p.camiseta === "CLARO"),
    );
    let equipoOscuro = $derived(
        confirmadosDetalle.filter((p) => p.camiseta === "OSCURO"),
    );
    let sinAsignar = $derived(
        confirmadosDetalle.filter((p) => p.camiseta === "SIN_ASIGNAR"),
    );
    let solicitudesIngresoEvento = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter(
                  (p) => p.estado === "SOLICITADO",
              )
            : [],
    );
    let invitadosPendientesEvento = $derived(
        eventoDetalle
            ? eventoDetalle.participantes.filter((p) => p.estado === "INVITADO")
            : [],
    );

    let solicitudesRecibidas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "RECIBIDA"),
    );
    let solicitudesEnviadas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "ENVIADA"),
    );

    // Efecto con AbortController (Regla D) al cambiar de pestaña o filtro
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

    async function abrirDetalleEvento(eventoId) {
        limpiarMensajes();
        cargandoDetalle = true;
        try {
            const [resDet, resAmigos] = await Promise.all([
                eventosApi.obtenerDetalle(eventoId),
                amistadesApi.listarAmigos().catch(() => ({ data: [] })),
            ]);
            eventoDetalle = resDet.data;
            amigos = resAmigos.data || [];
        } catch (err) {
            errorMsg = err.message;
        } finally {
            cargandoDetalle = false;
        }
    }

    async function handleCrearEvento(e) {
        e.preventDefault();
        limpiarMensajes();

        if (!nuevoTitulo.trim() || !nuevaFechaHora) {
            errorMsg = "Completá el título y la fecha/hora del partido.";
            return;
        }

        procesandoAccion = true;
        try {
            const res = await eventosApi.crear({
                titulo: nuevoTitulo.trim(),
                descripcion: nuevaDescripcion.trim() || null,
                deporte: nuevoDeporte,
                fechaHora: new Date(nuevaFechaHora).toISOString(),
                ubicacionTexto: nuevaUbicacion.trim() || "A confirmar",
                cupoMaximo: Number(nuevoCupo),
                visibilidad: nuevaVisibilidad,
                modoIngreso:
                    nuevaVisibilidad === "PUBLICO" ? nuevoModoIngreso : "LIBRE",
            });

            mostrarModalCrear = false;
            nuevoTitulo = "";
            nuevaDescripcion = "";
            nuevaUbicacion = "";
            mostrarExito(
                "¡Partido creado! Armá los equipos o invitá jugadores.",
            );
            eventoDetalle = res.data;
            tabActiva = "mios";
            cargarDatosTab("mios", filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleUnirsePublico(eventoId) {
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.unirsePublico(eventoId);
            mostrarExito(res.message || "Solicitud procesada");
            eventoDetalle = res.data;
            cargarDatosTab(tabActiva, filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleResponderInvitacion(eventoId, aceptar) {
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.responderInvitacion(eventoId, aceptar);
            mostrarExito(
                res.message ||
                    (aceptar
                        ? "¡Te uniste al partido!"
                        : "Invitación rechazada"),
            );
            if (aceptar && res.data) {
                eventoDetalle = res.data;
            }
            cargarDatosTab("mios", filtroDeporte);
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
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

    async function handleInvitarAmigoPorUid(uidAmigo) {
        if (!eventoDetalle) return;
        limpiarMensajes();
        procesandoAccion = true;
        try {
            const res = await eventosApi.invitarJugador(eventoDetalle.id, {
                uid: uidAmigo,
            });
            mostrarExito(res.message || "Jugador invitado");
            await abrirDetalleEvento(eventoDetalle.id);
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
            await abrirDetalleEvento(eventoDetalle.id);
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
            await abrirDetalleEvento(eventoDetalle.id);
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
                mostrarExito("El partido fue cancelado.");
            } else {
                if (!confirm("¿Seguro que querés bajarte de este partido?")) {
                    procesandoAccion = false;
                    return;
                }
                await eventosApi.abandonar(eventoDetalle.id);
                mostrarExito("Saliste del partido.");
            }
            eventoDetalle = null;
            cargarDatosTab(tabActiva, filtroDeporte);
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
        const d = new Date(iso);
        return d.toLocaleString("es-AR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="min-h-screen bg-slate-100 pb-24 text-slate-800">
    <!-- ENCABEZADO PRINCIPAL (H-12: único h1 de la vista) -->
    <header
        class="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white pt-6 pb-6 px-4 rounded-b-3xl shadow-lg"
    >
        <div class="max-w-md mx-auto">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <span
                        class="text-xs uppercase tracking-wider text-blue-200 font-bold"
                        >PlayTime Social</span
                    >
                    <h1 class="text-xl sm:text-2xl font-extrabold">
                        Comunidad y Partidos
                    </h1>
                </div>

                <button
                    type="button"
                    onclick={() => {
                        limpiarMensajes();
                        mostrarModalCrear = true;
                    }}
                    class="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                    <i class="bi bi-plus-circle-fill" aria-hidden="true"></i>
                    <span>Armar Partido</span>
                </button>
            </div>

            <!-- Selector de pestañas -->
            <div
                class="grid grid-cols-3 gap-1.5 bg-blue-950/50 p-1.5 rounded-2xl border border-white/10"
                role="tablist"
                aria-label="Secciones de comunidad"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === "explorar"}
                    onclick={() => {
                        eventoDetalle = null;
                        tabActiva = "explorar";
                    }}
                    class="py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer {tabActiva ===
                    'explorar'
                        ? 'bg-white text-blue-900 shadow'
                        : 'text-blue-100 hover:bg-white/10'}"
                >
                    ⚽ Públicos
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === "mios"}
                    onclick={() => {
                        eventoDetalle = null;
                        tabActiva = "mios";
                    }}
                    class="py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer {tabActiva ===
                    'mios'
                        ? 'bg-white text-blue-900 shadow'
                        : 'text-blue-100 hover:bg-white/10'}"
                >
                    📅 Mis Partidos
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tabActiva === "amigos"}
                    onclick={() => {
                        eventoDetalle = null;
                        tabActiva = "amigos";
                    }}
                    class="py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer {tabActiva ===
                    'amigos'
                        ? 'bg-white text-blue-900 shadow'
                        : 'text-blue-100 hover:bg-white/10'}"
                >
                    🤝 Amigos
                </button>
            </div>
        </div>
    </header>

    <main class="max-w-md mx-auto px-4 py-5 space-y-5">
        <!-- Mensajes de feedback -->
        {#if errorMsg}
            <div
                class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start justify-between gap-2"
                role="alert"
            >
                <div class="flex items-start gap-2">
                    <i
                        class="bi bi-exclamation-triangle-fill text-red-500 mt-0.5"
                        aria-hidden="true"
                    ></i>
                    <span>{errorMsg}</span>
                </div>
                <button
                    type="button"
                    onclick={() => (errorMsg = "")}
                    aria-label="Cerrar alerta de error"
                    class="text-red-500 hover:text-red-800"
                >
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        {/if}

        {#if exitoMsg}
            <div
                class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2"
                role="status"
            >
                <i
                    class="bi bi-check-circle-fill text-emerald-600"
                    aria-hidden="true"
                ></i>
                <span>{exitoMsg}</span>
            </div>
        {/if}

        <!-- ==================== VISTA DETALLE DE EVENTO Y PIZARRA DE EQUIPOS ==================== -->
        {#if eventoDetalle}
            <section
                aria-label="Detalle del partido y formación de equipos"
                class="space-y-4"
            >
                <button
                    type="button"
                    onclick={() => (eventoDetalle = null)}
                    class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                    <i class="bi bi-arrow-left" aria-hidden="true"></i>
                    <span>Volver al listado</span>
                </button>

                <!-- Encabezado de la tarjeta del partido -->
                <article
                    class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <div
                                class="flex items-center gap-1.5 flex-wrap mb-1"
                            >
                                <span
                                    class="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
                                >
                                    {eventoDetalle.deporte}
                                </span>
                                <span
                                    class="text-[11px] font-semibold px-2 py-0.5 rounded-lg {eventoDetalle.visibilidad ===
                                    'PUBLICO'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-700'}"
                                >
                                    {eventoDetalle.visibilidad === "PUBLICO"
                                        ? `Público (${eventoDetalle.modoIngreso === "LIBRE" ? "Ingreso libre" : "Con aprobación"})`
                                        : "Privado"}
                                </span>
                            </div>
                            <h2 class="text-lg font-extrabold text-slate-900">
                                {eventoDetalle.titulo}
                            </h2>
                            <p class="text-xs text-slate-500">
                                Organiza: <strong class="text-slate-700"
                                    >{eventoDetalle.organizadorNombre}</strong
                                >
                            </p>
                        </div>

                        <div class="text-right shrink-0">
                            <span
                                class="inline-block bg-slate-900 text-white text-xs font-extrabold px-2.5 py-1 rounded-xl"
                            >
                                {eventoDetalle.cantConfirmados}/{eventoDetalle.cupoMaximo}
                            </span>
                            <p class="text-[11px] text-slate-500 mt-0.5">
                                {eventoDetalle.lugaresLibres} libres
                            </p>
                        </div>
                    </div>

                    {#if eventoDetalle.descripcion}
                        <p
                            class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl"
                        >
                            {eventoDetalle.descripcion}
                        </p>
                    {/if}

                    <div
                        class="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100"
                    >
                        <div class="flex items-center gap-1.5">
                            <i class="bi bi-calendar-event text-blue-600"></i>
                            <span
                                >{formatearFecha(eventoDetalle.fechaHora)}</span
                            >
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i class="bi bi-geo-alt-fill text-red-500"></i>
                            <span class="truncate"
                                >{eventoDetalle.ubicacionTexto ||
                                    "A definir"}</span
                            >
                        </div>
                    </div>

                    <!-- Botón de acción según mi estado -->
                    {#if !eventoDetalle.miEstado && eventoDetalle.visibilidad === "PUBLICO" && eventoDetalle.estado === "ABIERTO"}
                        <button
                            type="button"
                            disabled={procesandoAccion}
                            onclick={() =>
                                handleUnirsePublico(eventoDetalle.id)}
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                        >
                            {eventoDetalle.modoIngreso === "LIBRE"
                                ? "⚡ Unirme al Partido"
                                : "✋ Solicitar Unirme"}
                        </button>
                    {:else if eventoDetalle.miEstado === "INVITADO"}
                        <div class="flex gap-2 pt-1">
                            <button
                                type="button"
                                disabled={procesandoAccion}
                                onclick={() =>
                                    handleResponderInvitacion(
                                        eventoDetalle.id,
                                        true,
                                    )}
                                class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
                            >
                                Aceptar invitación
                            </button>
                            <button
                                type="button"
                                disabled={procesandoAccion}
                                onclick={() =>
                                    handleResponderInvitacion(
                                        eventoDetalle.id,
                                        false,
                                    )}
                                class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer"
                            >
                                Rechazar
                            </button>
                        </div>
                    {/if}
                </article>

                <!-- PIZARRA DE EQUIPOS: CLARO vs OSCURO -->
                <article
                    class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4"
                >
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-sm font-extrabold text-slate-900 flex items-center gap-1.5"
                        >
                            <i class="bi bi-people-fill text-blue-600"></i>
                            <span>Pizarra de Equipos (Claro vs. Oscuro)</span>
                        </h3>
                        {#if eventoDetalle.miEstado === "CONFIRMADO"}
                            <span
                                class="text-[11px] text-emerald-700 font-semibold"
                            >
                                Podés mover jugadores
                            </span>
                        {/if}
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <!-- Columna Equipo CLARO -->
                        <div
                            class="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-3 space-y-2"
                        >
                            <div
                                class="flex items-center justify-between border-b border-sky-200 pb-1.5"
                            >
                                <span
                                    class="text-xs font-extrabold text-sky-900"
                                >
                                    👕 Equipo Claro
                                </span>
                                <span
                                    class="bg-sky-200 text-sky-900 text-[11px] font-bold px-2 py-0.5 rounded-full"
                                >
                                    {equipoClaro.length}
                                </span>
                            </div>

                            {#if equipoClaro.length === 0}
                                <p
                                    class="text-[11px] text-slate-400 italic py-2 text-center"
                                >
                                    Sin jugadores asignados
                                </p>
                            {:else}
                                <ul class="space-y-2">
                                    {#each equipoClaro as p (p.uid)}
                                        <li
                                            class="bg-white rounded-xl p-2 border border-sky-100 shadow-2xs text-xs space-y-1.5"
                                        >
                                            <div
                                                class="flex items-center justify-between gap-1"
                                            >
                                                <span
                                                    class="font-bold text-slate-800 truncate"
                                                >
                                                    {p.nombre}
                                                    {#if p.apodo}
                                                        <span
                                                            class="text-slate-500 font-normal"
                                                            >({p.apodo})</span
                                                        >
                                                    {/if}
                                                </span>
                                                {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleExpulsarJugador(
                                                                p.uid,
                                                                p.nombre,
                                                            )}
                                                        aria-label={`Quitar a ${p.nombre} del partido`}
                                                        class="text-red-500 hover:text-red-700 cursor-pointer"
                                                    >
                                                        <i class="bi bi-trash3"
                                                        ></i>
                                                    </button>
                                                {/if}
                                            </div>
                                            {#if eventoDetalle.miEstado === "CONFIRMADO"}
                                                <div class="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "OSCURO",
                                                            )}
                                                        class="flex-1 bg-slate-800 text-white text-[10px] font-semibold py-1 rounded-lg cursor-pointer"
                                                    >
                                                        Pasar a Oscuro
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "SIN_ASIGNAR",
                                                            )}
                                                        aria-label={`Dejar sin camiseta a ${p.nombre}`}
                                                        class="px-2 bg-slate-100 text-slate-600 text-[10px] rounded-lg cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>

                        <!-- Columna Equipo OSCURO -->
                        <div
                            class="rounded-2xl border-2 border-slate-700 bg-slate-900 text-white p-3 space-y-2"
                        >
                            <div
                                class="flex items-center justify-between border-b border-slate-700 pb-1.5"
                            >
                                <span class="text-xs font-extrabold text-white">
                                    🎽 Equipo Oscuro
                                </span>
                                <span
                                    class="bg-slate-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
                                >
                                    {equipoOscuro.length}
                                </span>
                            </div>

                            {#if equipoOscuro.length === 0}
                                <p
                                    class="text-[11px] text-slate-400 italic py-2 text-center"
                                >
                                    Sin jugadores asignados
                                </p>
                            {:else}
                                <ul class="space-y-2">
                                    {#each equipoOscuro as p (p.uid)}
                                        <li
                                            class="bg-slate-800 rounded-xl p-2 border border-slate-700 text-xs space-y-1.5"
                                        >
                                            <div
                                                class="flex items-center justify-between gap-1"
                                            >
                                                <span
                                                    class="font-bold text-white truncate"
                                                >
                                                    {p.nombre}
                                                    {#if p.apodo}
                                                        <span
                                                            class="text-slate-300 font-normal"
                                                            >({p.apodo})</span
                                                        >
                                                    {/if}
                                                </span>
                                                {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleExpulsarJugador(
                                                                p.uid,
                                                                p.nombre,
                                                            )}
                                                        aria-label={`Quitar a ${p.nombre} del partido`}
                                                        class="text-red-400 hover:text-red-300 cursor-pointer"
                                                    >
                                                        <i class="bi bi-trash3"
                                                        ></i>
                                                    </button>
                                                {/if}
                                            </div>
                                            {#if eventoDetalle.miEstado === "CONFIRMADO"}
                                                <div class="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "CLARO",
                                                            )}
                                                        class="flex-1 bg-sky-100 text-sky-950 text-[10px] font-semibold py-1 rounded-lg cursor-pointer"
                                                    >
                                                        Pasar a Claro
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleCambiarCamiseta(
                                                                p.uid,
                                                                "SIN_ASIGNAR",
                                                            )}
                                                        aria-label={`Dejar sin camiseta a ${p.nombre}`}
                                                        class="px-2 bg-slate-700 text-slate-200 text-[10px] rounded-lg cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        </div>
                    </div>

                    <!-- Jugadores Confirmados SIN ASIGNAR -->
                    <div class="pt-2 border-t border-slate-100">
                        <p class="text-xs font-bold text-slate-600 mb-2">
                            Jugadores sin camiseta asignada ({sinAsignar.length})
                        </p>
                        {#if sinAsignar.length === 0}
                            <p class="text-xs text-slate-400">
                                Todos los jugadores confirmados ya tienen
                                camiseta.
                            </p>
                        {:else}
                            <ul class="space-y-2">
                                {#each sinAsignar as p (p.uid)}
                                    <li
                                        class="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
                                    >
                                        <div class="truncate">
                                            <span
                                                class="font-bold text-slate-800"
                                                >{p.nombre}</span
                                            >
                                            {#if p.rol === "ORGANIZADOR"}
                                                <span
                                                    class="ml-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded"
                                                >
                                                    Admin
                                                </span>
                                            {/if}
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
                                                    class="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-[11px] cursor-pointer"
                                                >
                                                    👕 Claro
                                                </button>
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        handleCambiarCamiseta(
                                                            p.uid,
                                                            "OSCURO",
                                                        )}
                                                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] cursor-pointer"
                                                >
                                                    🎽 Oscuro
                                                </button>
                                                {#if eventoDetalle.soyOrganizador && p.uid !== eventoDetalle.organizadorUid}
                                                    <button
                                                        type="button"
                                                        onclick={() =>
                                                            handleExpulsarJugador(
                                                                p.uid,
                                                                p.nombre,
                                                            )}
                                                        aria-label={`Quitar a ${p.nombre}`}
                                                        class="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                                    >
                                                        <i class="bi bi-trash3"
                                                        ></i>
                                                    </button>
                                                {/if}
                                            </div>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                </article>

                <!-- INVITAR JUGADORES AL PARTIDO (Cualquier confirmado puede invitar) -->
                {#if eventoDetalle.miEstado === "CONFIRMADO" && eventoDetalle.estado !== "CANCELADO"}
                    <article
                        class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                        <h3 class="text-sm font-extrabold text-slate-900">
                            ➕ Invitar Jugadores al Partido
                        </h3>

                        <div class="flex gap-2 text-xs">
                            <button
                                type="button"
                                onclick={() => (modoInvitacion = "amigo")}
                                class="flex-1 py-1.5 rounded-xl font-bold cursor-pointer {modoInvitacion ===
                                'amigo'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600'}"
                            >
                                De mis Amigos
                            </button>
                            <button
                                type="button"
                                onclick={() => (modoInvitacion = "contacto")}
                                class="flex-1 py-1.5 rounded-xl font-bold cursor-pointer {modoInvitacion ===
                                'contacto'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600'}"
                            >
                                Por Email o Teléfono
                            </button>
                        </div>

                        {#if modoInvitacion === "amigo"}
                            {#if amigos.length === 0}
                                <p class="text-xs text-slate-500">
                                    Todavía no tenés amigos agregados. Podés
                                    invitar por email/teléfono o sumar amigos en
                                    la pestaña "Amigos".
                                </p>
                            {:else}
                                <ul class="space-y-2 max-h-48 overflow-y-auto">
                                    {#each amigos as a (a.uid)}
                                        {@const yaEsta =
                                            eventoDetalle.participantes.some(
                                                (p) => p.uid === a.uid,
                                            )}
                                        <li
                                            class="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs"
                                        >
                                            <div>
                                                <span
                                                    class="font-bold text-slate-800"
                                                    >{a.nombre}
                                                    {a.apellido}</span
                                                >
                                                <span
                                                    class="block text-[11px] text-slate-500"
                                                    >{a.email}</span
                                                >
                                            </div>
                                            {#if yaEsta}
                                                <span
                                                    class="text-[11px] text-slate-400 font-semibold"
                                                    >Ya en el partido</span
                                                >
                                            {:else}
                                                <button
                                                    type="button"
                                                    disabled={procesandoAccion}
                                                    onclick={() =>
                                                        handleInvitarAmigoPorUid(
                                                            a.uid,
                                                        )}
                                                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                                                >
                                                    Invitar
                                                </button>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            {/if}
                        {:else}
                            <form
                                onsubmit={handleInvitarPorContacto}
                                class="flex gap-2"
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
                                    placeholder="Ej: amigo@email.com o 2645123456"
                                    class="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={procesandoAccion}
                                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                                >
                                    Invitar
                                </button>
                            </form>
                        {/if}
                    </article>
                {/if}

                <!-- PANEL EXCLUSIVO DEL ORGANIZADOR: Solicitudes e Invitados -->
                {#if eventoDetalle.soyOrganizador}
                    {#if solicitudesIngresoEvento.length > 0}
                        <article
                            class="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2"
                        >
                            <h3
                                class="text-xs font-extrabold text-amber-900 uppercase"
                            >
                                Solicitudes para unirse ({solicitudesIngresoEvento.length})
                            </h3>
                            <ul class="space-y-2">
                                {#each solicitudesIngresoEvento as s (s.uid)}
                                    <li
                                        class="flex items-center justify-between bg-white p-2.5 rounded-xl text-xs"
                                    >
                                        <span class="font-bold text-slate-800"
                                            >{s.nombre}</span
                                        >
                                        <div class="flex gap-1.5">
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    handleResolverSolicitudEvento(
                                                        s.uid,
                                                        true,
                                                    )}
                                                class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                type="button"
                                                onclick={() =>
                                                    handleResolverSolicitudEvento(
                                                        s.uid,
                                                        false,
                                                    )}
                                                class="bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </article>
                    {/if}

                    {#if invitadosPendientesEvento.length > 0}
                        <article
                            class="bg-white rounded-2xl border border-slate-200 p-4 space-y-2"
                        >
                            <h3 class="text-xs font-bold text-slate-600">
                                Invitados pendientes de respuesta ({invitadosPendientesEvento.length})
                            </h3>
                            <div class="flex flex-wrap gap-1.5">
                                {#each invitadosPendientesEvento as inv (inv.uid)}
                                    <span
                                        class="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg"
                                    >
                                        ⏳ {inv.nombre}
                                    </span>
                                {/each}
                            </div>
                        </article>
                    {/if}
                {/if}

                <!-- Botón de Abandonar o Cancelar Evento -->
                {#if eventoDetalle.miEstado === "CONFIRMADO" && eventoDetalle.estado !== "CANCELADO"}
                    <div class="pt-2">
                        <button
                            type="button"
                            onclick={handleAbandonarOCancelar}
                            class="w-full py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                        >
                            {eventoDetalle.soyOrganizador
                                ? "🗑️ Cancelar este Partido (Admin)"
                                : "Salir del Partido"}
                        </button>
                    </div>
                {/if}
            </section>

            <!-- ==================== PESTAÑA 1: PARTIDOS PÚBLICOS ==================== -->
        {:else if tabActiva === "explorar"}
            <section aria-label="Explorar partidos públicos" class="space-y-4">
                <div class="flex items-center justify-between gap-2">
                    <h2 class="text-base font-bold text-slate-900">
                        Partidos Abiertos a la Comunidad
                    </h2>
                    <label for="filtro-deporte" class="sr-only">
                        Filtrar por deporte
                    </label>
                    <select
                        id="filtro-deporte"
                        bind:value={filtroDeporte}
                        class="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                        <option value="">Todos los deportes</option>
                        {#each deportesDisponibles as dep (dep)}
                            <option value={dep}>{dep}</option>
                        {/each}
                    </select>
                </div>

                {#if cargando}
                    <p class="text-sm text-slate-500 text-center py-8">
                        Buscando partidos públicos...
                    </p>
                {:else if eventosPublicos.length === 0}
                    <div
                        class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-2"
                    >
                        <p class="text-sm text-slate-600 font-medium">
                            No hay partidos públicos abiertos en este momento.
                        </p>
                        <button
                            type="button"
                            onclick={() => (mostrarModalCrear = true)}
                            class="text-blue-600 hover:underline text-xs font-bold cursor-pointer"
                        >
                            ¡Sé el primero en armar uno! ➔
                        </button>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each eventosPublicos as ev (ev.id)}
                            <article
                                class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-2.5"
                            >
                                <div
                                    class="flex items-start justify-between gap-2"
                                >
                                    <div>
                                        <span
                                            class="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg"
                                        >
                                            {ev.deporte}
                                        </span>
                                        <h3
                                            class="font-bold text-slate-900 text-base mt-1"
                                        >
                                            {ev.titulo}
                                        </h3>
                                        <p class="text-xs text-slate-500">
                                            Organiza: {ev.organizadorNombre}
                                        </p>
                                    </div>
                                    <span
                                        class="bg-emerald-50 text-emerald-800 text-xs font-extrabold px-2.5 py-1 rounded-xl shrink-0"
                                    >
                                        {ev.cantConfirmados}/{ev.cupoMaximo} jug.
                                    </span>
                                </div>

                                <div
                                    class="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100"
                                >
                                    <span
                                        >📅 {formatearFecha(ev.fechaHora)}</span
                                    >
                                    <button
                                        type="button"
                                        onclick={() =>
                                            abrirDetalleEvento(ev.id)}
                                        class="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                    >
                                        Ver equipos / Unirme ➔
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- ==================== PESTAÑA 2: MIS PARTIDOS E INVITACIONES ==================== -->
        {:else if tabActiva === "mios"}
            <section aria-label="Mis partidos e invitaciones" class="space-y-5">
                {#if misInvitaciones.length > 0}
                    <div class="space-y-2">
                        <h2
                            class="text-sm font-extrabold text-amber-800 uppercase"
                        >
                            🔔 Invitaciones Pendientes ({misInvitaciones.length})
                        </h2>
                        {#each misInvitaciones as inv (inv.id)}
                            <article
                                class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2"
                            >
                                <div class="flex justify-between items-start">
                                    <div>
                                        <span
                                            class="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded"
                                        >
                                            {inv.deporte}
                                        </span>
                                        <h3
                                            class="font-bold text-slate-900 text-sm mt-1"
                                        >
                                            {inv.titulo}
                                        </h3>
                                        <p class="text-xs text-slate-600">
                                            Te invitó {inv.organizadorNombre} · {formatearFecha(
                                                inv.fechaHora,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleResponderInvitacion(
                                                inv.id,
                                                true,
                                            )}
                                        class="flex-1 bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl cursor-pointer"
                                    >
                                        Aceptar
                                    </button>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleResponderInvitacion(
                                                inv.id,
                                                false,
                                            )}
                                        class="flex-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2 rounded-xl cursor-pointer"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}

                <div class="space-y-3">
                    <h2 class="text-base font-bold text-slate-900">
                        Mis Partidos Activos
                    </h2>

                    {#if cargando}
                        <p class="text-sm text-slate-500 text-center py-6">
                            Cargando tus partidos...
                        </p>
                    {:else if misEventos.length === 0}
                        <div
                            class="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center space-y-2"
                        >
                            <p class="text-sm text-slate-500">
                                Todavía no estás en ningún partido.
                            </p>
                            <button
                                type="button"
                                onclick={() => (mostrarModalCrear = true)}
                                class="text-blue-600 font-bold text-xs hover:underline cursor-pointer"
                            >
                                + Crear mi primer partido
                            </button>
                        </div>
                    {:else}
                        {#each misEventos as ev (ev.id)}
                            <article
                                class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2"
                            >
                                <div class="flex items-start justify-between">
                                    <div>
                                        <div class="flex items-center gap-1.5">
                                            <span
                                                class="bg-blue-50 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded"
                                            >
                                                {ev.deporte}
                                            </span>
                                            {#if ev.soyOrganizador}
                                                <span
                                                    class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded"
                                                >
                                                    Organizador
                                                </span>
                                            {/if}
                                        </div>
                                        <h3
                                            class="font-bold text-slate-900 text-base mt-1"
                                        >
                                            {ev.titulo}
                                        </h3>
                                    </div>
                                    <span
                                        class="text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl"
                                    >
                                        {ev.cantConfirmados}/{ev.cupoMaximo}
                                    </span>
                                </div>

                                <div
                                    class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100"
                                >
                                    <span
                                        >📅 {formatearFecha(ev.fechaHora)}</span
                                    >
                                    <button
                                        type="button"
                                        onclick={() =>
                                            abrirDetalleEvento(ev.id)}
                                        class="text-blue-600 font-bold hover:underline cursor-pointer"
                                    >
                                        Armar Equipos / Invitar ➔
                                    </button>
                                </div>
                            </article>
                        {/each}
                    {/if}
                </div>
            </section>

            <!-- ==================== PESTAÑA 3: AMIGOS ==================== -->
        {:else if tabActiva === "amigos"}
            <section aria-label="Gestión de amigos" class="space-y-5">
                <!-- Agregar por Email o Teléfono directo -->
                <article
                    class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                    <h2 class="text-sm font-bold text-slate-900">
                        ➕ Enviar solicitud por Email o Teléfono
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
                            placeholder="Email o teléfono..."
                            class="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={procesandoAccion}
                            class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                        >
                            Enviar
                        </button>
                    </form>
                </article>

                <!-- Buscador general de jugadores -->
                <article
                    class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                    <h2 class="text-sm font-bold text-slate-900">
                        🔍 Buscar jugadores en PlayTime
                    </h2>
                    <form onsubmit={handleBuscarUsuarios} class="flex gap-2">
                        <label for="input-buscar-jugador" class="sr-only">
                            Buscar por nombre, apodo o email
                        </label>
                        <input
                            id="input-buscar-jugador"
                            type="text"
                            bind:value={busquedaQuery}
                            placeholder="Nombre, apellido o apodo..."
                            class="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={buscandoUsuarios}
                            class="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                        >
                            Buscar
                        </button>
                    </form>

                    {#if resultadosBusqueda.length > 0}
                        <ul class="space-y-2 pt-2">
                            {#each resultadosBusqueda as u (u.uid)}
                                <li
                                    class="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs"
                                >
                                    <div>
                                        <span class="font-bold text-slate-800">
                                            {u.nombre}
                                            {u.apellido}
                                        </span>
                                        <span
                                            class="block text-[11px] text-slate-500"
                                        >
                                            {u.email}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleEnviarSolicitudAmistad({
                                                destinatarioUid: u.uid,
                                            })}
                                        class="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                                    >
                                        + Agregar
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </article>

                <!-- Solicitudes recibidas -->
                {#if solicitudesRecibidas.length > 0}
                    <article
                        class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2"
                    >
                        <h2
                            class="text-xs font-extrabold text-amber-900 uppercase"
                        >
                            Solicitudes de amistad recibidas ({solicitudesRecibidas.length})
                        </h2>
                        <ul class="space-y-2">
                            {#each solicitudesRecibidas as s (s.amistadId)}
                                <li
                                    class="flex items-center justify-between bg-white p-2.5 rounded-xl text-xs"
                                >
                                    <div>
                                        <span class="font-bold text-slate-800">
                                            {s.otroUsuario.nombre}
                                            {s.otroUsuario.apellido}
                                        </span>
                                        <span
                                            class="block text-[11px] text-slate-500"
                                        >
                                            {s.otroUsuario.email}
                                        </span>
                                    </div>
                                    <div class="flex gap-1.5">
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleResponderAmistad(
                                                    s.amistadId,
                                                    true,
                                                )}
                                            class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                        >
                                            Aceptar
                                        </button>
                                        <button
                                            type="button"
                                            onclick={() =>
                                                handleResponderAmistad(
                                                    s.amistadId,
                                                    false,
                                                )}
                                            class="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </article>
                {/if}

                <!-- Lista de Mis Amigos -->
                <article
                    class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                    <h2 class="text-sm font-bold text-slate-900">
                        Mis Amigos ({amigos.length})
                    </h2>

                    {#if amigos.length === 0}
                        <p class="text-xs text-slate-500">
                            Todavía no agregaste amigos. Buscalos arriba por
                            nombre, email o teléfono.
                        </p>
                    {:else}
                        <ul class="space-y-2">
                            {#each amigos as a (a.uid)}
                                <li
                                    class="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs"
                                >
                                    <div>
                                        <span class="font-bold text-slate-800">
                                            {a.nombre}
                                            {a.apellido}
                                        </span>
                                        <span
                                            class="block text-[11px] text-slate-500"
                                        >
                                            {a.email}
                                            {a.telefono
                                                ? `· ${a.telefono}`
                                                : ""}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleEliminarAmigo(
                                                a.uid,
                                                `${a.nombre} ${a.apellido}`,
                                            )}
                                        aria-label={`Eliminar a ${a.nombre} de mis amigos`}
                                        class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                    >
                                        <i class="bi bi-person-dash-fill"></i>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}

                    {#if solicitudesEnviadas.length > 0}
                        <div class="pt-3 border-t border-slate-100">
                            <p
                                class="text-xs font-semibold text-slate-500 mb-2"
                            >
                                Solicitudes enviadas pendientes ({solicitudesEnviadas.length})
                            </p>
                            {#each solicitudesEnviadas as env (env.amistadId)}
                                <div
                                    class="flex items-center justify-between text-xs text-slate-600 py-1"
                                >
                                    <span
                                        >⏳ {env.otroUsuario.nombre}
                                        {env.otroUsuario.apellido}</span
                                    >
                                    <button
                                        type="button"
                                        onclick={() =>
                                            handleEliminarAmigo(
                                                env.otroUsuario.uid,
                                                env.otroUsuario.nombre,
                                            )}
                                        class="text-red-500 hover:underline text-[11px] cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </article>
            </section>
        {/if}
    </main>

    <!-- MODAL PARA CREAR PARTIDO -->
    {#if mostrarModalCrear}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-crear"
        >
            <div
                class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto space-y-4"
            >
                <div class="flex items-center justify-between">
                    <h2
                        id="titulo-modal-crear"
                        class="text-lg font-extrabold text-slate-900"
                    >
                        ⚽ Armar Nuevo Partido
                    </h2>
                    <button
                        type="button"
                        onclick={() => (mostrarModalCrear = false)}
                        aria-label="Cerrar ventana"
                        class="text-slate-400 hover:text-slate-700"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>

                <form onsubmit={handleCrearEvento} class="space-y-3 text-xs">
                    <div>
                        <label
                            for="ev-titulo"
                            class="block font-bold text-slate-700 mb-1"
                        >
                            Título del Partido *
                        </label>
                        <input
                            id="ev-titulo"
                            type="text"
                            bind:value={nuevoTitulo}
                            required
                            placeholder="Ej: Picadito de los jueves"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label
                                for="ev-deporte"
                                class="block font-bold text-slate-700 mb-1"
                            >
                                Deporte *
                            </label>
                            <select
                                id="ev-deporte"
                                bind:value={nuevoDeporte}
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                            >
                                {#each deportesDisponibles as dep (dep)}
                                    <option value={dep}>{dep}</option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label
                                for="ev-cupo"
                                class="block font-bold text-slate-700 mb-1"
                            >
                                Cupo total *
                            </label>
                            <input
                                id="ev-cupo"
                                type="number"
                                min="2"
                                max="50"
                                bind:value={nuevoCupo}
                                required
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="ev-fecha"
                            class="block font-bold text-slate-700 mb-1"
                        >
                            Fecha y Hora *
                        </label>
                        <input
                            id="ev-fecha"
                            type="datetime-local"
                            bind:value={nuevaFechaHora}
                            required
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-ubicacion"
                            class="block font-bold text-slate-700 mb-1"
                        >
                            Lugar / Complejo (opcional)
                        </label>
                        <input
                            id="ev-ubicacion"
                            type="text"
                            bind:value={nuevaUbicacion}
                            placeholder="Ej: Complejo El Monumental (o a definir)"
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label
                                for="ev-visibilidad"
                                class="block font-bold text-slate-700 mb-1"
                            >
                                Visibilidad *
                            </label>
                            <select
                                id="ev-visibilidad"
                                bind:value={nuevaVisibilidad}
                                class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                            >
                                <option value="PUBLICO">Público</option>
                                <option value="PRIVADO"
                                    >Privado (solo invitados)</option
                                >
                            </select>
                        </div>

                        {#if nuevaVisibilidad === "PUBLICO"}
                            <div>
                                <label
                                    for="ev-ingreso"
                                    class="block font-bold text-slate-700 mb-1"
                                >
                                    Modo de Ingreso
                                </label>
                                <select
                                    id="ev-ingreso"
                                    bind:value={nuevoModoIngreso}
                                    class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                                >
                                    <option value="LIBRE">Ingreso libre</option>
                                    <option value="CON_APROBACION"
                                        >Con mi aprobación</option
                                    >
                                </select>
                            </div>
                        {/if}
                    </div>

                    <div>
                        <label
                            for="ev-desc"
                            class="block font-bold text-slate-700 mb-1"
                        >
                            Notas / Descripción
                        </label>
                        <textarea
                            id="ev-desc"
                            rows="2"
                            bind:value={nuevaDescripcion}
                            placeholder="Ej: Llevar camiseta clara y oscura..."
                            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onclick={() => (mostrarModalCrear = false)}
                            class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={procesandoAccion}
                            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                        >
                            {procesandoAccion ? "Creando..." : "Crear Partido"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    {/if}

    <Navbar activePage="comunidad" {onNavigate} />
</div>
