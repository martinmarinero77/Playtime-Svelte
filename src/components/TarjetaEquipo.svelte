<script>
    let {
        equipo,
        esMio = false,
        amigos = [],
        procesando = false,
        onToggleBuscandoRival = () => {},
        onAgregarMiembro = () => {},
        onQuitarMiembro = () => {},
        onDesafiar = () => {},
    } = $props();

    let emailInput = $state("");

    async function handleSubmitEmail(e) {
        e.preventDefault();
        const valor = emailInput.trim();
        if (!valor) return;
        await onAgregarMiembro(equipo.id, { email: valor });
        emailInput = "";
    }
</script>

{#if esMio}
    <article class="pt-card overflow-hidden">
        <div
            class="pt-card-header-blue flex items-center justify-between flex-wrap gap-2"
        >
            <div class="flex items-center gap-3">
                <div
                    class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-sm"
                >
                    {equipo.sigla}
                </div>
                <div>
                    <h2 class="font-bold text-base">{equipo.nombre}</h2>
                    <div class="text-xs text-blue-100">
                        {equipo.deporte} · Nivel {equipo.nivel}
                        {equipo.localidad ? ` · ${equipo.localidad}` : ""}
                    </div>
                </div>
            </div>

            {#if equipo.soyCapitan}
                <button
                    type="button"
                    onclick={() => onToggleBuscandoRival(equipo)}
                    class="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1 rounded-full cursor-pointer border-0"
                >
                    {equipo.buscandoRival ? "🟢 Buscando Rival" : "⚪ Oculto"}
                </button>
            {/if}
        </div>

        <div class="p-4 space-y-4">
            {#if equipo.diasDisponibles || equipo.horaDesde}
                <div class="text-xs text-slate-600 flex items-center gap-2">
                    <i class="bi bi-clock-fill text-blue-600" aria-hidden="true"
                    ></i>
                    <span>
                        Disponible: {equipo.diasDisponibles || "Cualquier día"}
                        {#if equipo.horaDesde || equipo.horaHasta}
                            ({equipo.horaDesde || "00:00"} a {equipo.horaHasta ||
                                "23:59"} hs)
                        {/if}
                    </span>
                </div>
            {/if}

            <div class="space-y-2">
                <div
                    class="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                    Plantel ({equipo.miembros.length} jugadores)
                </div>
                <div class="space-y-1.5">
                    {#each equipo.miembros as m (m.uid)}
                        <div class="player-card py-2">
                            <div class="flex items-center gap-2">
                                <span
                                    class="font-semibold text-sm text-slate-800"
                                >
                                    {m.nombre}
                                </span>
                                {#if m.rol === "CAPITAN"}
                                    <span class="status-badge status-info">
                                        Capitán
                                    </span>
                                {/if}
                            </div>

                            {#if equipo.soyCapitan && m.rol !== "CAPITAN"}
                                <button
                                    type="button"
                                    onclick={() =>
                                        onQuitarMiembro(
                                            equipo.id,
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
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            {#if equipo.soyCapitan}
                <div class="pt-3 border-t border-slate-200 space-y-2">
                    <label
                        for={`add-miembro-${equipo.id}`}
                        class="block text-xs font-bold uppercase text-slate-500"
                    >
                        Sumar jugador al plantel
                    </label>

                    {#if amigos.length > 0}
                        <div class="flex flex-wrap gap-1.5 pb-1">
                            {#each amigos as am (am.uid)}
                                {#if !equipo.miembros.some((m) => m.uid === am.uid)}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            onAgregarMiembro(equipo.id, {
                                                uid: am.uid,
                                            })}
                                        class="btn-pt btn-pt-soft btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-person-plus-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>{am.nombre}</span>
                                    </button>
                                {/if}
                            {/each}
                        </div>
                    {/if}

                    <form onsubmit={handleSubmitEmail} class="flex gap-2">
                        <input
                            id={`add-miembro-${equipo.id}`}
                            type="email"
                            bind:value={emailInput}
                            placeholder="O ingresá su email..."
                            class="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                        />
                        <button
                            type="submit"
                            disabled={procesando}
                            class="btn-pt btn-pt-primary btn-pt-sm"
                        >
                            Agregar
                        </button>
                    </form>
                </div>
            {/if}
        </div>
    </article>
{:else}
    <article class="pt-card hoverable p-5 flex flex-col justify-between gap-4">
        <div class="space-y-2.5">
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                    <div
                        class="player-avatar"
                        style="background: var(--pt-blue)"
                    >
                        {equipo.sigla}
                    </div>
                    <div>
                        <h3
                            class="font-bold text-slate-900 text-lg leading-tight"
                        >
                            {equipo.nombre}
                        </h3>
                        <span class="text-xs text-slate-500">
                            Capitán: {equipo.capitanNombre} · {equipo.miembros
                                .length} jug.
                        </span>
                    </div>
                </div>
                <span class="sport-tag">{equipo.deporte}</span>
            </div>

            <div class="text-xs text-slate-600 space-y-1 pt-1">
                <div>
                    <strong>Nivel:</strong>
                    {equipo.nivel}
                    {equipo.localidad ? ` · Zona: ${equipo.localidad}` : ""}
                </div>
                <div>
                    <strong>Días:</strong>
                    {equipo.diasDisponibles || "A convenir"}
                    {#if equipo.horaDesde || equipo.horaHasta}
                        ({equipo.horaDesde || "00:00"} a {equipo.horaHasta ||
                            "23:59"} hs)
                    {/if}
                </div>
            </div>
        </div>

        <button
            type="button"
            onclick={() => onDesafiar(equipo)}
            class="btn-pt btn-pt-primary w-full"
        >
            <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
            <span>Desafiar a {equipo.nombre}</span>
        </button>
    </article>
{/if}
