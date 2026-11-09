<script>
    /**
     * Componente reutilizable para mostrar la tarjeta resumen de un partido.
     */
    let {
        evento,
        textoBoton = "Ver Partido y Equipos",
        onVerDetalle = () => {},
    } = $props();

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

<article class="pt-card hoverable p-5 flex flex-col justify-between gap-4">
    <div class="space-y-2">
        <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
                <span class="sport-tag">{evento.deporte}</span>
                {#if evento.soyOrganizador}
                    <span class="status-badge status-info">
                        <i class="bi bi-star-fill" aria-hidden="true"></i>
                        <span>Anfitrión</span>
                    </span>
                {/if}
            </div>
            <span class="status-badge status-accepted">
                <i class="bi bi-people-fill" aria-hidden="true"></i>
                <span>{evento.cantConfirmados}/{evento.cupoMaximo} jug.</span>
            </span>
        </div>

        <h3 class="font-bold text-slate-900 text-lg leading-snug pt-1">
            {evento.titulo}
        </h3>

        <div class="text-xs text-slate-600 space-y-1">
            <div class="flex items-center gap-2">
                <i
                    class="bi bi-calendar-event-fill text-blue-600"
                    aria-hidden="true"
                ></i>
                <span>{formatearFecha(evento.fechaHora)}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="bi bi-geo-alt-fill text-red-500" aria-hidden="true"
                ></i>
                <span>{evento.ubicacionTexto || "Lugar a definir"}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="bi bi-person-fill text-slate-500" aria-hidden="true"
                ></i>
                <span>Organiza: {evento.organizadorNombre}</span>
            </div>
        </div>
    </div>

    <button
        type="button"
        onclick={() => onVerDetalle(evento.id)}
        class="btn-pt btn-pt-soft w-full"
    >
        <i class="bi bi-people-fill" aria-hidden="true"></i>
        <span>{textoBoton}</span>
    </button>
</article>
