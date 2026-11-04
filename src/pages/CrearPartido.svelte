<script>
    import Navbar from "../components/Navbar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import { eventosApi } from "../lib/api.js";

    let { onNavigate = () => {} } = $props();

    let titulo = $state("");
    let deporte = $state("Fútbol 5");
    let fecha = $state("");
    let hora = $state("20:00");
    let ubicacionTexto = $state("");
    let cupoMaximo = $state(10);
    let visibilidad = $state("PUBLICO");
    let modoIngreso = $state("LIBRE");
    let descripcion = $state("");

    let procesando = $state(false);
    let errorMsg = $state("");

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

    async function handleCrearEvento(e) {
        e.preventDefault();
        errorMsg = "";

        if (!titulo.trim() || !fecha || !hora) {
            errorMsg = "Completá el título, la fecha y la hora del partido.";
            return;
        }

        procesando = true;
        try {
            const fechaHoraIso = new Date(`${fecha}T${hora}`).toISOString();
            const res = await eventosApi.crear({
                titulo: titulo.trim(),
                descripcion: descripcion.trim() || null,
                deporte,
                fechaHora: fechaHoraIso,
                ubicacionTexto: ubicacionTexto.trim() || "A confirmar",
                cupoMaximo: Number(cupoMaximo),
                visibilidad,
                modoIngreso: visibilidad === "PUBLICO" ? modoIngreso : "LIBRE",
            });

            // Al crear el partido, vamos directo a la vista de ese partido para armar equipos e invitar
            onNavigate("detalle-partido", { eventoId: res.data.id });
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
        }
    }
</script>

<Navbar activePage="crear-partido" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <PageHeader
            etiqueta="Nuevo Evento Deportivo"
            titulo="Crear Partido"
            descripcion="Configurá el deporte, horario y visibilidad. Luego podrás armar los equipos e invitar jugadores."
            textoBoton="Volver a Mis Partidos"
            iconoBoton="bi-arrow-left"
            claseBoton="btn-pt-outline btn-pt-sm"
            onAccion={() => onNavigate("partidos", { tab: "mios" })}
        />

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

        <section aria-label="Formulario para organizar partido">
            <form onsubmit={handleCrearEvento} class="pt-card p-6 space-y-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label
                            for="ev-titulo"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Título del Partido *
                        </label>
                        <input
                            id="ev-titulo"
                            type="text"
                            bind:value={titulo}
                            required
                            placeholder="Ej: Fútbol 5 de los jueves en El Monumental"
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-deporte"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Deporte *
                        </label>
                        <select
                            id="ev-deporte"
                            bind:value={deporte}
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {#each deportesDisponibles as dep (dep)}
                                <option value={dep}>{dep}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label
                            for="ev-cupo"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Cupo total de jugadores *
                        </label>
                        <input
                            id="ev-cupo"
                            type="number"
                            min="2"
                            max="50"
                            bind:value={cupoMaximo}
                            required
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-fecha"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Fecha del Partido *
                        </label>
                        <input
                            id="ev-fecha"
                            type="date"
                            bind:value={fecha}
                            required
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-hora"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Hora de Inicio *
                        </label>
                        <input
                            id="ev-hora"
                            type="time"
                            bind:value={hora}
                            required
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-ubicacion"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Lugar / Complejo (opcional)
                        </label>
                        <input
                            id="ev-ubicacion"
                            type="text"
                            bind:value={ubicacionTexto}
                            placeholder="Ej: Complejo El Monumental (o a definir)"
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            for="ev-visibilidad"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Visibilidad del Partido *
                        </label>
                        <select
                            id="ev-visibilidad"
                            bind:value={visibilidad}
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="PUBLICO"
                                >Público (visible para la comunidad)</option
                            >
                            <option value="PRIVADO"
                                >Privado (solo por invitación)</option
                            >
                        </select>
                    </div>

                    {#if visibilidad === "PUBLICO"}
                        <div>
                            <label
                                for="ev-ingreso"
                                class="block font-semibold text-sm text-slate-700 mb-1.5"
                            >
                                Modo de Ingreso
                            </label>
                            <select
                                id="ev-ingreso"
                                bind:value={modoIngreso}
                                class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="LIBRE"
                                    >Ingreso libre (se suman directo)</option
                                >
                                <option value="CON_APROBACION"
                                    >Con aprobación del organizador</option
                                >
                            </select>
                        </div>
                    {/if}

                    <div class="md:col-span-2">
                        <label
                            for="ev-desc"
                            class="block font-semibold text-sm text-slate-700 mb-1.5"
                        >
                            Notas / Descripción (opcional)
                        </label>
                        <textarea
                            id="ev-desc"
                            rows="3"
                            bind:value={descripcion}
                            placeholder="Ej: Llevar camiseta clara y oscura, llegar 10 minutos antes..."
                            class="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 pt-3 border-t border-slate-200"
                >
                    <button
                        type="button"
                        onclick={() => onNavigate("partidos", { tab: "mios" })}
                        class="btn-pt btn-pt-outline"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={procesando}
                        class="btn-pt btn-pt-success"
                    >
                        <i class="bi bi-check-circle-fill" aria-hidden="true"
                        ></i>
                        <span
                            >{procesando
                                ? "Creando partido..."
                                : "Crear Partido y Armar Equipos"}</span
                        >
                    </button>
                </div>
            </form>
        </section>
    </main>
</div>
