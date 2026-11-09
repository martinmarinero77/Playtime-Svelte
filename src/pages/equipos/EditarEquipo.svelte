<script>
    import Navbar from "../../components/Navbar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import FiltroDeportes from "../../components/FiltroDeportes.svelte";
    import { equiposApi } from "../../lib/api.js";

    let { equipoId = "", onNavigate = () => {} } = $props();

    let cargando = $state(true);
    let guardando = $state(false);
    let errorMsg = $state("");

    // Variables de la colección "equipos" en Firestore
    let nombre = $state("");
    let sigla = $state("");
    let deporte = $state("Futbol");
    let nivel = $state("Intermedio");
    let localidad = $state("");
    let buscandoRival = $state(true);
    let diasSeleccionados = $state([]);
    let horaDesde = $state("20:00");
    let horaHasta = $state("23:00");

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

    $effect(() => {
        const id = equipoId;
        if (!id) return;
        const controller = new AbortController();
        cargarDatosEquipo(id, controller.signal);
        return () => controller.abort();
    });

    async function cargarDatosEquipo(id, signal) {
        cargando = true;
        errorMsg = "";
        try {
            const res = await equiposApi.listarMios(signal);
            const eq = (res?.data || []).find((e) => e.id === id);
            if (!eq) {
                errorMsg = "No se encontró el equipo.";
                return;
            }
            if (!eq.soyCapitan) {
                errorMsg = "Solo el capitán puede editar los datos del equipo.";
                return;
            }

            nombre = eq.nombre || "";
            sigla = eq.sigla || "";
            deporte = eq.deporte || "Futbol";
            nivel = eq.nivel || "Intermedio";
            localidad = eq.localidad || "";
            buscandoRival = Boolean(eq.buscandoRival);
            diasSeleccionados = eq.diasDisponibles
                ? eq.diasDisponibles
                      .split(",")
                      .map((d) => d.trim())
                      .filter(Boolean)
                : [];
            horaDesde = eq.horaDesde || "20:00";
            horaHasta = eq.horaHasta || "23:00";
        } catch (err) {
            if (err.name !== "AbortError") {
                errorMsg = err.message;
            }
        } finally {
            cargando = false;
        }
    }

    function toggleDia(dia) {
        if (diasSeleccionados.includes(dia)) {
            diasSeleccionados = diasSeleccionados.filter((d) => d !== dia);
        } else {
            diasSeleccionados = [...diasSeleccionados, dia];
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        errorMsg = "";
        guardando = true;
        try {
            await equiposApi.actualizarDisponibilidad(equipoId, {
                nombre: nombre.trim(),
                sigla: sigla.trim().toUpperCase(),
                deporte,
                localidad: localidad.trim() || null,
                buscandoRival,
                nivel,
                diasDisponibles: diasSeleccionados.join(", "),
                horaDesde,
                horaHasta,
            });
            onNavigate("detalle-equipo", { equipoId });
        } catch (err) {
            errorMsg = err.message;
        } finally {
            guardando = false;
        }
    }
</script>

<Navbar activePage="equipos" {onNavigate} />

<div class="pt-main">
    <main class="pt-content space-y-6">
        <div>
            <button
                type="button"
                onclick={() => onNavigate("detalle-equipo", { equipoId })}
                class="btn-pt btn-pt-outline btn-pt-sm"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver al Detalle del Equipo</span>
            </button>
        </div>

        <PageHeader
            etiqueta="Configuración del Club"
            titulo="Editar Equipo"
            descripcion="Modificá el nombre, deporte, nivel competitivo, días de juego y horarios disponibles de tu equipo."
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

        {#if cargando}
            <div class="pt-card empty-state">
                <i class="bi bi-hourglass-split" aria-hidden="true"></i>
                <p class="font-bold text-slate-700">
                    Cargando datos del equipo...
                </p>
            </div>
        {:else}
            <section class="pt-card p-6">
                <form onsubmit={handleSubmit} class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="md:col-span-2">
                            <label
                                for="eq-nombre"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Nombre del Equipo *
                            </label>
                            <input
                                id="eq-nombre"
                                type="text"
                                required
                                minlength="2"
                                maxlength="60"
                                bind:value={nombre}
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
                                required
                                minlength="2"
                                maxlength="4"
                                bind:value={sigla}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm uppercase"
                            />
                        </div>
                    </div>

                    <div>
                        <FiltroDeportes
                            titulo="Deporte Principal *"
                            mostrarTodos={false}
                            enTarjeta={false}
                            seleccionado={deporte}
                            onSeleccionar={(dep) => (deporte = dep)}
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                for="eq-nivel"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Nivel Competitivo
                            </label>
                            <select
                                id="eq-nivel"
                                bind:value={nivel}
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
                                bind:value={localidad}
                                placeholder="Ej: San Luis Capital"
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <fieldset class="space-y-2 border-0 p-0 m-0">
                        <legend
                            class="block text-sm font-semibold text-slate-700 mb-1"
                        >
                            Días en los que suelen jugar
                        </legend>
                        <div class="flex flex-wrap gap-2">
                            {#each diasSemana as d (d)}
                                <button
                                    type="button"
                                    onclick={() => toggleDia(d)}
                                    aria-pressed={diasSeleccionados.includes(d)}
                                    class="filter-chip {diasSeleccionados.includes(
                                        d,
                                    )
                                        ? 'active'
                                        : ''}"
                                >
                                    {d}
                                </button>
                            {/each}
                        </div>
                    </fieldset>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label
                                for="eq-desde"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Disponible Desde
                            </label>
                            <input
                                id="eq-desde"
                                type="time"
                                bind:value={horaDesde}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                            />
                        </div>

                        <div>
                            <label
                                for="eq-hasta"
                                class="block text-sm font-semibold text-slate-700 mb-1"
                            >
                                Disponible Hasta
                            </label>
                            <input
                                id="eq-hasta"
                                type="time"
                                bind:value={horaHasta}
                                class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                            />
                        </div>

                        <div class="flex items-end">
                            <label
                                class="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 w-full"
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={buscandoRival}
                                    class="w-4 h-4 accent-blue-600"
                                />
                                <span
                                    class="text-sm font-semibold text-slate-800"
                                >
                                    Visible buscando rival
                                </span>
                            </label>
                        </div>
                    </div>

                    <div
                        class="flex justify-end gap-3 pt-4 border-t border-slate-200"
                    >
                        <button
                            type="button"
                            onclick={() =>
                                onNavigate("detalle-equipo", { equipoId })}
                            class="btn-pt btn-pt-outline"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            class="btn-pt btn-pt-primary"
                        >
                            <i class="bi bi-check2-circle" aria-hidden="true"
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
