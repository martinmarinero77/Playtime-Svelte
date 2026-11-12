<script>
    let { onNavigate = () => {} } = $props();

    const funciones = [
        {
            icono: "bi-dribbble",
            color: "text-emerald-300",
            titulo: "Partidos abiertos",
            texto: "Creá un partido, elegí la modalidad y completá el cupo con la bolsa de jugadores disponibles.",
        },
        {
            icono: "bi-shield-shaded",
            color: "text-amber-300",
            titulo: "Equipos y desafíos",
            texto: "Armá tu plantel estable, invitá a tus amigos y desafiá a otros equipos de tu zona.",
        },
        {
            icono: "bi-geo-alt-fill",
            color: "text-cyan-300",
            titulo: "Complejos y canchas",
            texto: "Consultá complejos, los deportes que ofrecen y el precio de cada cancha.",
        },
    ];

    // H-19: enlaces reales que navegan sin recargar la SPA
    function irA(vista) {
        return (e) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey) return;
            e.preventDefault();
            onNavigate(vista);
        };
    }
</script>

<main
    class="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white"
>
    <div
        class="max-w-6xl mx-auto min-h-screen px-4 sm:px-6 py-8 flex flex-col gap-12 lg:gap-16"
    >
        <header class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2.5">
                <span
                    class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl"
                    aria-hidden="true">⚽</span
                >
                <span class="text-xl font-extrabold tracking-wide"
                    >PlayTime</span
                >
            </div>
            <a
                href="/login"
                onclick={irA("login")}
                class="text-sm font-semibold px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition-colors"
            >
                Iniciar sesión
            </a>
        </header>

        <section
            class="grid lg:grid-cols-2 gap-10 items-center flex-1"
            aria-labelledby="titulo-hero"
        >
            <div>
                <p
                    class="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/15 text-sm text-blue-100"
                >
                    Fútbol · Pádel · Tenis · Básquet · Vóley
                </p>
                <h1
                    id="titulo-hero"
                    class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
                >
                    Tu próximo partido empieza acá
                </h1>
                <p class="mt-4 text-lg text-blue-100 max-w-xl">
                    Organizá partidos, sumá jugadores, armá tu equipo y encontrá
                    cancha, todo desde un mismo lugar.
                </p>

                <div class="mt-8 flex flex-col sm:flex-row gap-3">
                    <!-- H-54: emerald-700 + blanco = 5.5:1 (emerald-600 daba 3.8:1) -->
                    <a
                        href="/register"
                        onclick={irA("register")}
                        class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 font-bold shadow-lg transition-colors"
                    >
                        <i class="bi bi-person-plus-fill" aria-hidden="true"
                        ></i>
                        <span>Crear cuenta</span>
                    </a>
                    <a
                        href="/login"
                        onclick={irA("login")}
                        class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-white/80 hover:bg-white/10 font-bold transition-colors"
                    >
                        <i class="bi bi-box-arrow-in-right" aria-hidden="true"
                        ></i>
                        <span>Ya tengo cuenta</span>
                    </a>
                </div>
            </div>

            <!-- Vista previa decorativa de un partido (solo escritorio) -->
            <div class="hidden lg:block" aria-hidden="true">
                <div class="relative mx-auto max-w-sm">
                    <div
                        class="absolute -inset-4 rounded-[2rem] bg-emerald-400/20 blur-2xl"
                    ></div>
                    <div
                        class="relative rounded-3xl bg-white text-slate-800 p-6 shadow-2xl"
                    >
                        <div class="flex items-center justify-between">
                            <span
                                class="text-xs font-bold uppercase tracking-wider text-blue-700"
                                >Partido abierto</span
                            >
                            <span
                                class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800"
                                >Faltan 2</span
                            >
                        </div>
                        <p class="mt-3 text-xl font-extrabold">
                            Fútbol 5 · Jueves 21:00
                        </p>
                        <p
                            class="mt-1 text-sm text-slate-600 flex items-center gap-1.5"
                        >
                            <i class="bi bi-geo-alt-fill text-blue-600"></i> Complejo
                            de tu zona
                        </p>
                        <div class="mt-5">
                            <div
                                class="flex justify-between text-xs font-semibold text-slate-600 mb-1.5"
                            >
                                <span>Jugadores</span><span>8 / 10</span>
                            </div>
                            <div
                                class="h-2 rounded-full bg-slate-100 overflow-hidden"
                            >
                                <div
                                    class="h-full w-4/5 rounded-full bg-emerald-500"
                                ></div>
                            </div>
                        </div>
                        <div class="mt-5 flex -space-x-2">
                            {#each ["M", "L", "S", "J", "F"] as inicial (inicial)}
                                <span
                                    class="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center ring-2 ring-white"
                                    >{inicial}</span
                                >
                            {/each}
                            <span
                                class="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center ring-2 ring-white"
                                >+3</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section aria-labelledby="titulo-funciones">
            <h2 id="titulo-funciones" class="sr-only">
                Qué podés hacer en PlayTime
            </h2>
            <ul class="grid gap-4 sm:grid-cols-3">
                {#each funciones as f (f.titulo)}
                    <li
                        class="rounded-2xl bg-white/5 border border-white/10 p-5"
                    >
                        <i
                            class="bi {f.icono} {f.color} text-2xl"
                            aria-hidden="true"
                        ></i>
                        <h3 class="mt-3 text-lg font-bold">{f.titulo}</h3>
                        <p class="mt-1 text-sm text-blue-100">{f.texto}</p>
                    </li>
                {/each}
            </ul>
        </section>
    </div>
</main>
