<script module>
    // Caché en memoria a nivel de módulo para no repetir el fetch al cambiar de pestaña
    let cacheDeportes = null;
</script>

<script>
    import { catalogoApi } from "../lib/api.js";

    let {
        titulo = "Filtrar por deporte",
        textoTodos = "Todos",
        mostrarTodos = true,
        seleccionado = "",
        multiple = false,
        seleccionados = [],
        enTarjeta = true,
        mostrarCapacidades = false,
        cupoActual = 0,
        onSeleccionar = () => {},
        onToggle = () => {},
        onSeleccionarCupo = () => {},
    } = $props();

    let deportes = $state(cacheDeportes || []);

    // Normaliza tildes para que documentos viejos ("Fútbol 5") coincidan con "Futbol" de Firebase
    function normalizar(texto) {
        return (texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // R-08: Estado derivado que obtiene el documento del deporte seleccionado y sus capacidades
    let deporteSeleccionadoObj = $derived(
        !multiple && seleccionado
            ? deportes.find(
                  (d) =>
                      d.nombre === seleccionado ||
                      normalizar(seleccionado).startsWith(normalizar(d.nombre)),
              ) || null
            : null,
    );

    // R-27: Efecto con AbortController para cargar la colección "deportes" de Firestore
    $effect(() => {
        if (cacheDeportes && cacheDeportes.length > 0) {
            deportes = cacheDeportes;
            return;
        }

        const controller = new AbortController();
        catalogoApi
            .listarDeportes(controller.signal)
            .then((res) => {
                const lista = res?.data || [];
                cacheDeportes = lista;
                deportes = lista;
            })
            .catch(() => {
                if (deportes.length === 0) {
                    deportes = [
                        {
                            id: "futbol",
                            nombre: "Futbol",
                            capacidades: [5, 7, 9, 11],
                        },
                        { id: "padel", nombre: "Padel", capacidades: [1, 2] },
                        { id: "tenis", nombre: "Tenis", capacidades: [1, 2] },
                        {
                            id: "basquet",
                            nombre: "Basquet",
                            capacidades: [3, 5],
                        },
                        { id: "voley", nombre: "Voley", capacidades: [6] },
                    ];
                }
            });

        return () => controller.abort();
    });

    function estaActivo(nombre) {
        if (multiple) {
            return seleccionados.some(
                (s) =>
                    s === nombre ||
                    normalizar(s).startsWith(normalizar(nombre)),
            );
        }
        if (!seleccionado) return false;
        return (
            seleccionado === nombre ||
            normalizar(seleccionado).startsWith(normalizar(nombre))
        );
    }

    function handleClickDeporte(dep) {
        if (multiple) {
            onToggle(dep.nombre);
        } else {
            onSeleccionar(dep.nombre);
            if (mostrarCapacidades && dep.capacidades?.length > 0) {
                onSeleccionarCupo(dep.capacidades[0] * 2);
            }
        }
    }
</script>

<div class={enTarjeta ? "pt-card p-4" : ""}>
    {#if titulo}
        <div
            class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
        >
            {titulo}
        </div>
    {/if}

    <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label={titulo || "Seleccionar deporte"}
    >
        {#if !multiple && mostrarTodos}
            <button
                type="button"
                aria-pressed={seleccionado === ""}
                onclick={() => onSeleccionar("")}
                class="filter-chip {seleccionado === '' ? 'active' : ''}"
            >
                {textoTodos}
            </button>
        {/if}

        {#each deportes as dep (dep.id || dep.nombre)}
            <button
                type="button"
                aria-pressed={estaActivo(dep.nombre)}
                onclick={() => handleClickDeporte(dep)}
                class="filter-chip {estaActivo(dep.nombre) ? 'active' : ''}"
            >
                {dep.nombre}
            </button>
        {/each}
    </div>

    {#if mostrarCapacidades && deporteSeleccionadoObj?.capacidades?.length > 0}
        <div class="mt-3 pt-2.5 border-t border-slate-100">
            <div
                class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
            >
                Modalidad ({deporteSeleccionadoObj.nombre})
            </div>
            <div
                class="flex flex-wrap gap-2"
                role="group"
                aria-label="Modalidad por cantidad de jugadores"
            >
                {#each deporteSeleccionadoObj.capacidades as cap (cap)}
                    {@const cupoTotal = cap * 2}
                    <button
                        type="button"
                        aria-pressed={Number(cupoActual) === cupoTotal}
                        onclick={() => onSeleccionarCupo(cupoTotal)}
                        class="filter-chip {Number(cupoActual) === cupoTotal
                            ? 'active'
                            : ''}"
                    >
                        {cap} vs {cap} ({cupoTotal} jug.)
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>
