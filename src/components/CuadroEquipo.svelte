<script>
    let {
        tipo = "CLARO",
        jugadores = [],
        puedoEditar = false,
        soyOrganizador = false,
        organizadorUid = "",
        onCambiarCamiseta = () => {},
        onExpulsar = () => {},
    } = $props();

    const CONFIG_POR_TIPO = {
        CLARO: {
            titulo: "Equipo Claro",
            icono: "bi-shield-fill",
            headerClass: "pt-card-header-blue",
            badgeTextClass: "text-blue-700",
            avatarBg: "var(--pt-blue-light)",
            emptyText: "Sin jugadores en el Equipo Claro",
            gridBody: false,
        },
        OSCURO: {
            titulo: "Equipo Oscuro",
            icono: "bi-shield-fill",
            headerClass: "pt-card-header-dark",
            badgeTextClass: "text-slate-900",
            avatarBg: "var(--pt-gray-800)",
            emptyText: "Sin jugadores en el Equipo Oscuro",
            gridBody: false,
        },
        SIN_ASIGNAR: {
            titulo: "Jugadores sin equipo asignado",
            icono: "bi-people-fill",
            headerClass: "pt-card-header-orange",
            badgeTextClass: "text-orange-700",
            avatarBg: "var(--pt-orange)",
            emptyText:
                "Todos los jugadores confirmados ya tienen camiseta asignada.",
            gridBody: true,
        },
    };

    let config = $derived(CONFIG_POR_TIPO[tipo] || CONFIG_POR_TIPO.CLARO);

    function inicialNombre(nombre) {
        return (nombre || "J").trim().charAt(0).toUpperCase();
    }
</script>

<article class="pt-card">
    <div class="{config.headerClass} flex items-center justify-between">
        <h2 class="text-base font-bold flex items-center gap-2">
            <i class="bi {config.icono}" aria-hidden="true"></i>
            <span>{config.titulo}</span>
        </h2>
        <span
            class="bg-white {config.badgeTextClass} font-extrabold text-xs px-2.5 py-0.5 rounded-full"
        >
            {jugadores.length}
        </span>
    </div>

    <div class="p-4 {config.gridBody ? '' : 'space-y-2.5'}">
        {#if jugadores.length === 0}
            <p class="text-xs text-slate-400 italic text-center py-4">
                {config.emptyText}
            </p>
        {:else}
            <div
                class={config.gridBody
                    ? "grid grid-cols-1 md:grid-cols-2 gap-3"
                    : "space-y-2.5"}
            >
                {#each jugadores as p (p.uid)}
                    <div class="player-card">
                        <div class="flex items-center gap-3 min-w-0">
                            <div
                                class="player-avatar"
                                style="background: {config.avatarBg}"
                            >
                                {inicialNombre(p.nombre)}
                            </div>
                            <div class="min-w-0">
                                <div
                                    class="font-semibold text-sm text-slate-800 truncate"
                                >
                                    {p.nombre}
                                    {#if p.apodo}
                                        <span class="text-slate-500 font-normal"
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

                        {#if puedoEditar}
                            <div class="flex items-center gap-1.5 shrink-0">
                                {#if tipo === "CLARO"}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            onCambiarCamiseta(p.uid, "OSCURO")}
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
                                            onCambiarCamiseta(
                                                p.uid,
                                                "SIN_ASIGNAR",
                                            )}
                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                        title="Quitar camiseta"
                                        aria-label={`Dejar sin equipo a ${p.nombre}`}
                                    >
                                        <i class="bi bi-x-lg" aria-hidden="true"
                                        ></i>
                                    </button>
                                {:else if tipo === "OSCURO"}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            onCambiarCamiseta(p.uid, "CLARO")}
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
                                            onCambiarCamiseta(
                                                p.uid,
                                                "SIN_ASIGNAR",
                                            )}
                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                        title="Quitar camiseta"
                                        aria-label={`Dejar sin equipo a ${p.nombre}`}
                                    >
                                        <i class="bi bi-x-lg" aria-hidden="true"
                                        ></i>
                                    </button>
                                {:else}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            onCambiarCamiseta(p.uid, "CLARO")}
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
                                            onCambiarCamiseta(p.uid, "OSCURO")}
                                        class="btn-pt btn-pt-outline btn-pt-sm"
                                    >
                                        <i
                                            class="bi bi-shield-fill"
                                            aria-hidden="true"
                                        ></i>
                                        <span>Oscuro</span>
                                    </button>
                                {/if}

                                {#if soyOrganizador && p.uid !== organizadorUid}
                                    <button
                                        type="button"
                                        onclick={() =>
                                            onExpulsar(p.uid, p.nombre)}
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
            </div>
        {/if}
    </div>
</article>
