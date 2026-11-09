<script>
    import Navbar from "../../components/Navbar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import FiltroDeportes from "../../components/FiltroDeportes.svelte";
    import { equiposApi } from "../../lib/api.js";

    let { onNavigate = () => {} } = $props();

    let nombreEquipo = $state("");
    let siglaEquipo = $state("");
    let deporteEquipo = $state("Futbol");
    let nivelEquipo = $state("Intermedio");
    let localidadEquipo = $state("");
    let buscandoRival = $state(true);
    let diasSeleccionados = $state(["Martes", "Jueves"]);
    let horaDesde = $state("20:00");
    let horaHasta = $state("23:00");

    let procesando = $state(false);
    let errorMsg = $state("");

    const nivelesLista = ["Recreativo", "Intermedio", "Competitivo"];

    const diasSemana = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
    ];

    function toggleDia(dia) {
        diasSeleccionados = diasSeleccionados.includes(dia)
            ? diasSeleccionados.filter((d) => d !== dia)
            : [...diasSeleccionados, dia];
    }

    async function handleCrearEquipo(e) {
        e.preventDefault();
        errorMsg = "";
        procesando = true;
        try {
            await equiposApi.crear({
                nombre: nombreEquipo,
                sigla: siglaEquipo,
                deporte: deporteEquipo,
                nivel: nivelEquipo,
                localidad: localidadEquipo || null,
                buscandoRival,
                diasDisponibles: diasSeleccionados.join(", "),
                horaDesde,
                horaHasta,
            });
            onNavigate("equipos", { tab: "mios" });
        } catch (err) {
            errorMsg = err.message;
        } finally {
            procesando = false;
        }
    }
</script>

<Navbar activePage="equipos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <PageHeader
            etiqueta="Nuevo Club / Plantel"
            titulo="Crear Equipo"
            descripcion="Armá tu equipo estable para desafiar a otros equipos e inscribirte en torneos."
            textoBoton="Volver a Mis Equipos"
            iconoBoton="bi-arrow-left"
            claseBoton="btn-pt-outline btn-pt-sm"
            onAccion={() => onNavigate("equipos", { tab: "mios" })}
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
            </div>
        {/if}

        <section aria-label="Formulario para crear equipo" class="pt-card p-6">
            <form onsubmit={handleCrearEquipo} class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label
                            for="eq-nombre"
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Nombre del Equipo *
                        </label>
                        <input
                            id="eq-nombre"
                            type="text"
                            bind:value={nombreEquipo}
                            required
                            placeholder="Ej: Los Galácticos FC"
                            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                        />
                    </div>

                    <div>
                        <label
                            for="eq-sigla"
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Sigla (2 a 4 letras) *
                        </label>
                        <input
                            id="eq-sigla"
                            type="text"
                            maxlength="4"
                            bind:value={siglaEquipo}
                            required
                            placeholder="Ej: GAL"
                            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm uppercase"
                        />
                    </div>

                    <div class="md:col-span-3">
                        <FiltroDeportes
                            titulo="Deporte Principal *"
                            mostrarTodos={false}
                            enTarjeta={false}
                            seleccionado={deporteEquipo}
                            onSeleccionar={(dep) => (deporteEquipo = dep)}
                        />
                    </div>

                    <div>
                        <label
                            for="eq-nivel"
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Nivel de Juego
                        </label>
                        <select
                            id="eq-nivel"
                            bind:value={nivelEquipo}
                            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                        >
                            {#each nivelesLista as niv (niv)}
                                <option value={niv}>{niv}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label
                            for="eq-localidad"
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Zona / Localidad
                        </label>
                        <input
                            id="eq-localidad"
                            type="text"
                            bind:value={localidadEquipo}
                            placeholder="Ej: Nueva Córdoba"
                            class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                        />
                    </div>

                    <div class="flex items-end pb-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                bind:checked={buscandoRival}
                                class="w-4 h-4 accent-emerald-600"
                            />
                            <span class="text-sm font-semibold text-slate-800">
                                Aparecer buscando rivales para amistosos
                            </span>
                        </label>
                    </div>
                </div>

                {#if buscandoRival}
                    <div class="pt-2 space-y-3">
                        <div>
                            <div
                                class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                            >
                                Días que el equipo suele jugar
                            </div>
                            <div class="flex flex-wrap gap-2">
                                {#each diasSemana as dia (dia)}
                                    <button
                                        type="button"
                                        onclick={() => toggleDia(dia)}
                                        class="filter-chip {diasSeleccionados.includes(
                                            dia,
                                        )
                                            ? 'active'
                                            : ''}"
                                    >
                                        {dia}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label
                                    for="eq-hora-desde"
                                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                                >
                                    Horario preferido desde
                                </label>
                                <input
                                    id="eq-hora-desde"
                                    type="time"
                                    bind:value={horaDesde}
                                    class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    for="eq-hora-hasta"
                                    class="block text-xs font-bold uppercase text-slate-500 mb-1"
                                >
                                    Hasta las
                                </label>
                                <input
                                    id="eq-hora-hasta"
                                    type="time"
                                    bind:value={horaHasta}
                                    class="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                                />
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onclick={() => onNavigate("equipos", { tab: "mios" })}
                        class="btn-pt btn-pt-outline"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={procesando}
                        class="btn-pt btn-pt-primary"
                    >
                        <i class="bi bi-check-circle-fill" aria-hidden="true"
                        ></i>
                        <span
                            >{procesando
                                ? "Creando..."
                                : "Guardar Equipo"}</span
                        >
                    </button>
                </div>
            </form>
        </section>
    </main>
</div>
