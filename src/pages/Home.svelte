<script>
    import Navbar from "../components/Navbar.svelte";

    export let onNavigate = () => {};
    export let usuario = { nombre: "Martín", inicial: "M" };

    let searchTerm = "";

    // Datos de ejemplo para renderizar los complejos (luego conectaremos a GET /api/Complejo)
    let complejos = [
        {
            id: 1,
            nombre: "Complejo El Monumental",
            direccion: "Av. Libertador 450, San Juan",
            deportes: ["Fútbol 5", "Fútbol 7", "Pádel"],
            color: "from-emerald-500 to-teal-600",
        },
        {
            id: 2,
            nombre: "Canchas La Redonda",
            direccion: "Calle Mendoza 1250 Sur",
            deportes: ["Fútbol 5"],
            color: "from-blue-500 to-indigo-600",
        },
        {
            id: 3,
            nombre: "Pádel & Fútbol Center",
            direccion: "Ruta 40 km 8",
            deportes: ["Pádel", "Fútbol 8"],
            color: "from-amber-500 to-orange-600",
        },
    ];
</script>

<div class="min-h-screen bg-slate-100 pb-24 text-slate-800">
    <!-- CABECERA PRINCIPAL (Con saludo y buscador) -->
    <header
        class="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white pt-6 pb-8 px-4 rounded-b-3xl shadow-lg"
    >
        <div class="max-w-md mx-auto">
            <!-- Fila superior: Logo/Título y Avatar -->
            <div class="flex items-center justify-between mb-4">
                <div>
                    <span
                        class="text-xs uppercase tracking-wider text-blue-200 font-bold"
                        >PlayTime</span
                    >
                    <h1
                        class="text-xl sm:text-2xl font-extrabold flex items-center gap-1.5"
                    >
                        <span>¡Hola, {usuario.nombre}!</span>
                        <span>⚽</span>
                    </h1>
                </div>

                <!-- Avatar circular -->
                <div
                    class="w-11 h-11 rounded-full bg-blue-500/50 border border-white/20 flex items-center justify-center font-bold text-lg shadow"
                >
                    {usuario.inicial}
                </div>
            </div>

            <!-- Barra de Búsqueda -->
            <div class="relative flex items-center mb-2">
                <span
                    class="absolute left-3.5 text-blue-500 pointer-events-none"
                    aria-hidden="true"
                >
                    <i class="bi bi-search"></i>
                </span>
                <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Buscar canchas, deportes o complejos..."
                    class="w-full pl-10 pr-10 py-3 bg-white text-slate-800 placeholder-slate-400 rounded-2xl shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span
                    class="absolute right-3.5 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                >
                    <i class="bi bi-sliders"></i>
                </span>
            </div>

            <!-- Ubicación actual -->
            <div
                class="flex items-center gap-1.5 text-xs text-blue-200/90 pl-1"
            >
                <i class="bi bi-geo-alt-fill"></i>
                <span>San Juan, Argentina</span>
            </div>
        </div>
    </header>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="max-w-md mx-auto px-4 py-6 space-y-6">
        <!-- SECCIÓN: ACCIONES RÁPIDAS -->
        <section aria-label="Acciones rápidas">
            <h2 class="text-base font-bold text-slate-900 mb-3">
                Acciones Rápidas
            </h2>

            <div class="grid grid-cols-2 gap-3">
                <!-- Reservar Cancha -->
                <button
                    type="button"
                    onclick={() => onNavigate("reservas")}
                    class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col items-center text-center cursor-pointer"
                >
                    <div
                        class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-2"
                    >
                        <i class="bi bi-calendar-check-fill"></i>
                    </div>
                    <span class="text-xs font-semibold text-slate-700"
                        >Reservar Cancha</span
                    >
                </button>

                <!-- Buscar Jugadores -->
                <button
                    type="button"
                    onclick={() => onNavigate("comunidad")}
                    class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col items-center text-center cursor-pointer"
                >
                    <div
                        class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-2"
                    >
                        <i class="bi bi-people-fill"></i>
                    </div>
                    <span class="text-xs font-semibold text-slate-700"
                        >Buscar Jugadores</span
                    >
                </button>

                <!-- Mis Torneos -->
                <button
                    type="button"
                    onclick={() => onNavigate("torneos")}
                    class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col items-center text-center cursor-pointer"
                >
                    <div
                        class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-2"
                    >
                        <i class="bi bi-trophy-fill"></i>
                    </div>
                    <span class="text-xs font-semibold text-slate-700"
                        >Mis Torneos</span
                    >
                </button>

                <!-- Canchas Cercanas -->
                <button
                    type="button"
                    onclick={() => onNavigate("reservas")}
                    class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col items-center text-center cursor-pointer"
                >
                    <div
                        class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-2"
                    >
                        <i class="bi bi-geo-alt-fill"></i>
                    </div>
                    <span class="text-xs font-semibold text-slate-700"
                        >Canchas Cercanas</span
                    >
                </button>
            </div>
        </section>

        <!-- SECCIÓN: PRÓXIMOS PARTIDOS -->
        <section aria-label="Próximos partidos">
            <h2 class="text-base font-bold text-slate-900 mb-3">
                Próximos Partidos
            </h2>

            <!-- Aviso de sin reservas activas (como en home.jsp) -->
            <div
                class="bg-white rounded-2xl border border-dashed border-slate-300 p-5 text-center"
            >
                <p class="text-sm text-slate-500 mb-2">
                    No tenés próximos partidos programados.
                </p>
                <button
                    type="button"
                    onclick={() => onNavigate("reservas")}
                    class="text-blue-600 hover:text-blue-800 text-sm font-bold hover:underline cursor-pointer"
                >
                    ¡Reservá tu cancha ahora! ➔
                </button>
            </div>
        </section>

        <!-- SECCIÓN: COMPLEJOS DESTACADOS -->
        <section aria-label="Complejos destacados">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-base font-bold text-slate-900">
                    Complejos Destacados
                </h2>
                <button
                    type="button"
                    class="text-xs font-semibold text-blue-600 hover:underline"
                    >Ver todos</button
                >
            </div>

            <div class="space-y-3">
                {#each complejos as comp}
                    <article
                        class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition"
                    >
                        <div
                            class="bg-gradient-to-r {comp.color} p-3.5 text-white flex items-center gap-3"
                        >
                            <div
                                class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg"
                            >
                                <i class="bi bi-building"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-sm leading-snug">
                                    {comp.nombre}
                                </h3>
                                <p class="text-white/80 text-xs">
                                    {comp.direccion}
                                </p>
                            </div>
                        </div>

                        <div class="p-3.5 flex items-center justify-between">
                            <div class="flex gap-1.5 flex-wrap">
                                {#each comp.deportes as dep}
                                    <span
                                        class="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                                    >
                                        {dep}
                                    </span>
                                {/each}
                            </div>
                            <i class="bi bi-chevron-right text-slate-400"></i>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    </main>

    <!-- Barra de navegación inferior activa en 'home' -->
    <Navbar activePage="home" {onNavigate} />
</div>
