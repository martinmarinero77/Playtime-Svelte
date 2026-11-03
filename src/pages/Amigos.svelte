<script>
    import Navbar from "../components/Navbar.svelte";
    import { amistadesApi } from "../lib/api.js";

    let { onNavigate = () => {} } = $props();

    let amigos = $state([]);
    let solicitudesPendientes = $state([]);
    let busquedaQuery = $state("");
    let resultadosBusqueda = $state([]);
    let buscandoUsuarios = $state(false);
    let contactoAmigoDirecto = $state("");

    let cargando = $state(true);
    let procesandoAccion = $state(false);
    let errorMsg = $state("");
    let exitoMsg = $state("");

    let solicitudesRecibidas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "RECIBIDA"),
    );
    let solicitudesEnviadas = $derived(
        solicitudesPendientes.filter((s) => s.direccion === "ENVIADA"),
    );

    $effect(() => {
        const controller = new AbortController();
        cargarAmigos(controller.signal);
        return () => controller.abort();
    });

    function mostrarExito(msg) {
        exitoMsg = msg;
        errorMsg = "";
        setTimeout(() => {
            if (exitoMsg === msg) exitoMsg = "";
        }, 4000);
    }

    async function cargarAmigos(signal) {
        cargando = true;
        errorMsg = "";
        try {
            const [resAmigos, resPend] = await Promise.all([
                amistadesApi.listarAmigos(signal),
                amistadesApi.listarPendientes(signal),
            ]);
            amigos = resAmigos.data || [];
            solicitudesPendientes = resPend.data || [];
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleBuscarUsuarios(e) {
        e.preventDefault();
        if (busquedaQuery.trim().length < 2) return;
        buscandoUsuarios = true;
        errorMsg = "";
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
        errorMsg = "";
        procesandoAccion = true;
        try {
            const res = await amistadesApi.enviarSolicitud(payload);
            mostrarExito(res.message || "Solicitud enviada");
            contactoAmigoDirecto = "";
            await cargarAmigos();
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleResponderAmistad(amistadId, aceptar) {
        errorMsg = "";
        procesandoAccion = true;
        try {
            const res = await amistadesApi.responderSolicitud(
                amistadId,
                aceptar,
            );
            mostrarExito(res.message || "Solicitud procesada");
            await cargarAmigos();
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    async function handleEliminarAmigo(otroUid, nombre) {
        if (!confirm(`¿Eliminar vínculo con ${nombre}?`)) return;
        errorMsg = "";
        procesandoAccion = true;
        try {
            await amistadesApi.eliminar(otroUid);
            mostrarExito("Vínculo eliminado");
            await cargarAmigos();
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesandoAccion = false;
        }
    }

    function inicialNombre(nombre) {
        return (nombre || "J").trim().charAt(0).toUpperCase();
    }
</script>

<Navbar activePage="amigos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <header class="pt-page-header flex-wrap">
            <div>
                <p
                    class="text-xs uppercase tracking-wider text-blue-100 font-bold mb-1"
                >
                    Comunidad PlayTime
                </p>
                <h1 class="text-2xl sm:text-3xl font-extrabold">Mis Amigos</h1>
                <p class="text-sm text-blue-100/90 mt-1">
                    Agregá amigos para invitarlos rápido cuando organices un
                    partido.
                </p>
            </div>
        </header>

        {#if errorMsg}
            <div class="pt-alert pt-alert-danger" role="alert">
                <div class="flex items-center gap-2">
                    <i
                        class="bi bi-exclamation-triangle-fill"
                        aria-hidden="true"
                    ></i>
                    <span>{errorMsg}</span>
                </div>
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
                            <i class="bi bi-send-fill" aria-hidden="true"></i>
                            <span>Enviar</span>
                        </button>
                    </form>
                </article>

                <article class="pt-card p-5 space-y-3">
                    <h2
                        class="text-base font-bold text-slate-900 flex items-center gap-2"
                    >
                        <i class="bi bi-search text-blue-600" aria-hidden="true"
                        ></i>
                        <span>Buscar Jugadores en PlayTime</span>
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
                                <div class="flex items-center gap-3 min-w-0">
                                    <div
                                        class="player-avatar"
                                        style="background: var(--pt-amber)"
                                    >
                                        {inicialNombre(s.otroUsuario.nombre)}
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
                                        <i class="bi bi-x-lg" aria-hidden="true"
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

                {#if cargando}
                    <div class="empty-state py-6">
                        <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                        <p class="font-bold text-slate-700">
                            Cargando tus amigos...
                        </p>
                    </div>
                {:else if amigos.length === 0}
                    <div class="empty-state py-6">
                        <i class="bi bi-people" aria-hidden="true"></i>
                        <p class="font-bold text-slate-700">
                            Todavía no agregaste amigos
                        </p>
                        <p class="text-xs text-slate-500 mt-1">
                            Buscalos arriba por nombre, email o teléfono para
                            invitarlos rápido a tus partidos.
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each amigos as a (a.uid)}
                            <div class="player-card">
                                <div class="flex items-center gap-3 min-w-0">
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
    </main>
</div>
