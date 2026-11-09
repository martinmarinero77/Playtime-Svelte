<script>
    let {
        equipo,
        esMio = false,
        onToggleBuscandoRival = () => {},
        onGestionar = () => {},
        onDesafiar = () => {},
    } = $props();
</script>

{#if esMio}
    <article class="pt-card overflow-hidden flex flex-col justify-between">
        <div>
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
                        {equipo.buscandoRival
                            ? "🟢 Buscando Rival"
                            : "⚪ Oculto"}
                    </button>
                {/if}
            </div>

            <div class="p-4 space-y-3">
                {#if equipo.diasDisponibles || equipo.horaDesde}
                    <div class="text-xs text-slate-600 flex items-center gap-2">
                        <i
                            class="bi bi-clock-fill text-blue-600"
                            aria-hidden="true"
                        ></i>
                        <span>
                            Disponible: {equipo.diasDisponibles ||
                                "Cualquier día"}
                            {#if equipo.horaDesde || equipo.horaHasta}
                                ({equipo.horaDesde || "00:00"} a {equipo.horaHasta ||
                                    "23:59"} hs)
                            {/if}
                        </span>
                    </div>
                {/if}

                <div
                    class="flex items-center justify-between text-xs text-slate-600"
                >
                    <span>
                        <strong>Capitán:</strong>
                        {equipo.capitanNombre}
                    </span>
                    <span class="status-badge status-info">
                        {equipo.miembros.length} jugadores
                    </span>
                </div>
            </div>
        </div>

        <div class="px-4 pb-4">
            <button
                type="button"
                onclick={() => onGestionar(equipo.id)}
                class="btn-pt btn-pt-primary w-full"
            >
                <i class="bi bi-gear-fill" aria-hidden="true"></i>
                <span>
                    {equipo.soyCapitan
                        ? "Gestionar Equipo y Plantel"
                        : "Ver Plantel del Equipo"}
                </span>
            </button>
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
