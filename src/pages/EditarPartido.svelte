<script>
    import Navbar from "../components/Navbar.svelte";
    import { eventosApi } from "../lib/api.js";

    let { eventoId = "", onNavigate = () => {} } = $props();

    let cargando = $state(true);
    let guardando = $state(false);
    let errorMsg = $state("");

    let form = $state({
        titulo: "",
        deporte: "Fútbol 5",
        fecha: "",
        hora: "",
        ubicacionTexto: "",
        cupoMaximo: 10,
        visibilidad: "PUBLICO",
        modoIngreso: "LIBRE",
        descripcion: "",
    });

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

    function aDatetimeLocal(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        const offsetMs = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
    }

    $effect(() => {
        const controller = new AbortController();
        const id = eventoId;
        if (id) {
            cargarDatosPartido(id, controller.signal);
        }
        return () => controller.abort();
    });

    async function cargarDatosPartido(id, signal) {
        cargando = true;
        errorMsg = "";
        try {
            const res = await eventosApi.obtenerDetalle(id, signal);
            const ev = res.data;
            const dtLocal = aDatetimeLocal(ev.fechaHora); // formato "YYYY-MM-DDTHH:mm"
            form = {
                titulo: ev.titulo || "",
                deporte: ev.deporte || "Fútbol 5",
                fecha: dtLocal ? dtLocal.slice(0, 10) : "",
                hora: dtLocal ? dtLocal.slice(11, 16) : "20:00",
                ubicacionTexto: ev.ubicacionTexto || "",
                cupoMaximo: ev.cupoMaximo || 10,
                visibilidad: ev.visibilidad || "PUBLICO",
                modoIngreso: ev.modoIngreso || "LIBRE",
                descripcion: ev.descripcion || "",
            };
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    async function handleGuardarCambios(e) {
        e.preventDefault();
        errorMsg = "";
        guardando = true;
        try {
            const payload = {
                ...form,
                fechaHora: new Date(`${form.fecha}T${form.hora}`).toISOString(),
                cupoMaximo: Number(form.cupoMaximo),
            };
            await eventosApi.actualizar(eventoId, payload);
            onNavigate("partido-detalle", { eventoId });
        } catch (err) {
            errorMsg = err.message;
        } finally {
            guardando = false;
        }
    }
</script>

<Navbar activePage="partidos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <div class="flex items-center justify-between gap-2">
            <button
                type="button"
                onclick={() => onNavigate("partido-detalle", { eventoId })}
                class="btn-pt btn-pt-outline btn-pt-sm"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver al Partido</span>
            </button>
        </div>

        <header class="pt-page-header flex-wrap">
            <div>
                <p
                    class="text-xs uppercase tracking-wider text-blue-100 font-bold mb-1"
                >
                    Configuración del Evento
                </p>
                <h1 class="text-2xl sm:text-3xl font-extrabold">
                    Editar Datos del Partido
                </h1>
                <p class="text-sm text-blue-100/90 mt-1">
                    Modificá el horario, lugar, cupo o privacidad de tu partido.
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

        {#if cargando}
            <div class="pt-card empty-state">
                <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                <p class="font-bold text-slate-700">
                    Cargando datos del partido...
                </p>
            </div>
        {:else}
            <section class="pt-card p-6 max-w-3xl">
                <form onsubmit={handleGuardarCambios} class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                for="edit-titulo"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Título del partido
                            </label>
                            <input
                                id="edit-titulo"
                                type="text"
                                bind:value={form.titulo}
                                required
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                for="edit-deporte"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Deporte
                            </label>
                            <select
                                id="edit-deporte"
                                bind:value={form.deporte}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {#each deportesDisponibles as dep (dep)}
                                    <option value={dep}>{dep}</option>
                                {/each}
                            </select>
                        </div>

                        <div>
                            <label
                                for="edit-fecha"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Fecha del Partido
                            </label>
                            <input
                                id="edit-fecha"
                                type="date"
                                bind:value={form.fecha}
                                required
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                for="edit-hora"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Hora de Inicio
                            </label>
                            <input
                                id="edit-hora"
                                type="time"
                                bind:value={form.hora}
                                required
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                for="edit-cupo"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Cupo máximo de jugadores
                            </label>
                            <input
                                id="edit-cupo"
                                type="number"
                                min="2"
                                max="40"
                                bind:value={form.cupoMaximo}
                                required
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                for="edit-ubicacion"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Complejo o Dirección
                            </label>
                            <input
                                id="edit-ubicacion"
                                type="text"
                                bind:value={form.ubicacionTexto}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                for="edit-visibilidad"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Privacidad del Partido
                            </label>
                            <select
                                id="edit-visibilidad"
                                bind:value={form.visibilidad}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PUBLICO"
                                    >Público (visible en Explorar)</option
                                >
                                <option value="PRIVADO"
                                    >Privado (solo con invitación)</option
                                >
                            </select>
                        </div>

                        {#if form.visibilidad === "PUBLICO"}
                            <div>
                                <label
                                    for="edit-modo-ingreso"
                                    class="block text-sm font-semibold text-slate-700 mb-1"
                                >
                                    Modo de Ingreso Público
                                </label>
                                <select
                                    id="edit-modo-ingreso"
                                    bind:value={form.modoIngreso}
                                    class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="LIBRE"
                                        >Ingreso Libre (se suman directo)</option
                                    >
                                    <option value="CON_APROBACION"
                                        >Con Aprobación del Organizador</option
                                    >
                                </select>
                            </div>
                        {/if}
                    </div>

                    <div>
                        <label
                            for="edit-desc"
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Notas o Descripción
                        </label>
                        <textarea
                            id="edit-desc"
                            rows="2"
                            bind:value={form.descripcion}
                            class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onclick={() =>
                                onNavigate("partido-detalle", { eventoId })}
                            class="btn-pt btn-pt-outline"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            class="btn-pt btn-pt-primary"
                        >
                            <i
                                class="bi bi-check-circle-fill"
                                aria-hidden="true"
                            ></i>
                            <span
                                >{guardando
                                    ? "Guardando..."
                                    : "Guardar Cambios"}</span
                            >
                        </button>
                    </div>
                </form>
            </section>
        {/if}
    </main>
</div>
