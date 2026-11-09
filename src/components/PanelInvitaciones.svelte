<script>
    let {
        titulo = "Enviar Invitación",
        textoBotonInvitar = "Invitar",
        textoYaMiembro = "Ya participa",
        placeholderContacto = "Ingresá el email o teléfono del jugador...",
        puedoInvitar = false,
        mostrarSolicitudes = false,
        miembrosActuales = [],
        amigos = [],
        jugadoresDisponibles = [],
        solicitudesIngreso = [],
        invitadosPendientes = [],
        procesandoAccion = false,
        onInvitarAmigo = () => {},
        onInvitarContacto = async () => false,
        onResolverSolicitud = () => {},
    } = $props();

    let modoInvitacion = $state("amigo"); // 'amigo' | 'disponibles' | 'contacto'
    let contactoInvitar = $state("");

    function inicialNombre(nombre) {
        return (nombre || "J").trim().charAt(0).toUpperCase();
    }

    async function handleSubmitContacto(e) {
        e.preventDefault();
        const valor = contactoInvitar.trim();
        if (!valor) return;
        const exito = await onInvitarContacto(valor);
        if (exito) {
            contactoInvitar = "";
        }
    }
</script>

<section aria-label={titulo} class="space-y-5">
    {#if puedoInvitar}
        <article class="pt-card p-5 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2
                    class="text-base font-bold text-slate-900 flex items-center gap-2"
                >
                    <i
                        class="bi bi-send-fill text-emerald-600"
                        aria-hidden="true"
                    ></i>
                    <span>{titulo}</span>
                </h2>

                <div class="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onclick={() => (modoInvitacion = "amigo")}
                        class="filter-chip {modoInvitacion === 'amigo'
                            ? 'active'
                            : ''}"
                    >
                        <i class="bi bi-people-fill" aria-hidden="true"></i>
                        <span>De mis Amigos ({amigos.length})</span>
                    </button>
                    <button
                        type="button"
                        onclick={() => (modoInvitacion = "disponibles")}
                        class="filter-chip {modoInvitacion === 'disponibles'
                            ? 'active'
                            : ''}"
                    >
                        <i class="bi bi-broadcast" aria-hidden="true"></i>
                        <span
                            >Jugadores Disponibles ({jugadoresDisponibles.length})</span
                        >
                    </button>
                    <button
                        type="button"
                        onclick={() => (modoInvitacion = "contacto")}
                        class="filter-chip {modoInvitacion === 'contacto'
                            ? 'active'
                            : ''}"
                    >
                        <i class="bi bi-envelope-fill" aria-hidden="true"></i>
                        <span>Por Contacto</span>
                    </button>
                </div>
            </div>

            {#if modoInvitacion === "amigo"}
                {#if amigos.length === 0}
                    <p class="text-sm text-slate-500">
                        Todavía no tenés amigos en tu lista. Podés invitar por
                        contacto o agregar amigos en la sección "Mis Amigos".
                    </p>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each amigos as a (a.uid)}
                            {@const yaEsta = miembrosActuales.some(
                                (p) => p.uid === a.uid,
                            )}
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
                                            {a.apellido || ""}
                                        </div>
                                        <div
                                            class="text-xs text-slate-500 truncate"
                                        >
                                            {a.email}
                                        </div>
                                    </div>
                                </div>
                                {#if yaEsta}
                                    <span class="status-badge status-info">
                                        {textoYaMiembro}
                                    </span>
                                {:else}
                                    <button
                                        type="button"
                                        disabled={procesandoAccion}
                                        onclick={() => onInvitarAmigo(a.uid)}
                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-send-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>{textoBotonInvitar}</span>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else if modoInvitacion === "disponibles"}
                {#if jugadoresDisponibles.length === 0}
                    <p class="text-sm text-slate-500">
                        No hay jugadores en la lista pública de disponibles en
                        este momento.
                    </p>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each jugadoresDisponibles as j (j.uid)}
                            {@const yaEsta = miembrosActuales.some(
                                (p) => p.uid === j.uid,
                            )}
                            <div class="player-card">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div
                                        class="player-avatar"
                                        style="background: var(--pt-green)"
                                    >
                                        {inicialNombre(j.nombre)}
                                    </div>
                                    <div class="min-w-0">
                                        <div
                                            class="font-semibold text-sm text-slate-800 truncate"
                                        >
                                            {j.nombre}
                                            {j.apellido || ""}
                                        </div>
                                        <div
                                            class="text-xs text-slate-600 truncate"
                                        >
                                            {j.deportesDisponibles ||
                                                "Cualquier deporte"}
                                        </div>
                                        {#if j.diasDisponibles || j.horaDesde || j.horaHasta}
                                            <div
                                                class="text-[11px] text-blue-700 font-medium truncate"
                                            >
                                                <i
                                                    class="bi bi-clock"
                                                    aria-hidden="true"
                                                ></i>
                                                {j.diasDisponibles ||
                                                    "Todos los días"}
                                                {#if j.horaDesde || j.horaHasta}
                                                    · {j.horaDesde || "00:00"} a
                                                    {j.horaHasta || "23:59"} hs
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                                {#if yaEsta}
                                    <span class="status-badge status-info">
                                        {textoYaMiembro}
                                    </span>
                                {:else}
                                    <button
                                        type="button"
                                        disabled={procesandoAccion}
                                        onclick={() => onInvitarAmigo(j.uid)}
                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-send-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>{textoBotonInvitar}</span>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else}
                <form
                    onsubmit={handleSubmitContacto}
                    class="flex flex-col sm:flex-row gap-3"
                >
                    <label for="input-contacto-invitar" class="sr-only">
                        {placeholderContacto}
                    </label>
                    <input
                        id="input-contacto-invitar"
                        type="text"
                        bind:value={contactoInvitar}
                        required
                        placeholder={placeholderContacto}
                        class="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={procesandoAccion}
                        class="btn-pt btn-pt-primary"
                    >
                        <i class="bi bi-send-fill" aria-hidden="true"></i>
                        <span>{textoBotonInvitar}</span>
                    </button>
                </form>
            {/if}
        </article>
    {/if}

    {#if mostrarSolicitudes}
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
                    No hay solicitudes pendientes de aprobación en este momento.
                </p>
            {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {#each solicitudesIngreso as s (s.uid)}
                        <div class="player-card">
                            <span class="font-semibold text-sm text-slate-800">
                                {s.nombre}
                            </span>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() =>
                                        onResolverSolicitud(s.uid, true)}
                                    class="btn-pt btn-pt-success btn-pt-sm"
                                >
                                    <i class="bi bi-check-lg" aria-hidden="true"
                                    ></i>
                                    <span>Aprobar</span>
                                </button>
                                <button
                                    type="button"
                                    onclick={() =>
                                        onResolverSolicitud(s.uid, false)}
                                    class="btn-pt btn-pt-danger-soft btn-pt-sm"
                                >
                                    <i class="bi bi-x-lg" aria-hidden="true"
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
                <i class="bi bi-clock-history text-blue-600" aria-hidden="true"
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
                        <span class="status-badge status-pending">
                            <i class="bi bi-clock-history" aria-hidden="true"
                            ></i>
                            <span>{inv.nombre}</span>
                        </span>
                    {/each}
                </div>
            {/if}
        </article>
    {/if}
</section>
