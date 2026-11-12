<script>
    // Layout compartido por Login y Register (Apunte Svelte §5.3: snippet children)
    let {
        titulo,
        subtitulo = "",
        mensajePanel = "Tu próximo partido empieza acá",
        ancho = "max-w-md",
        onNavigate = () => {},
        children,
    } = $props();

    const beneficios = [
        {
            icono: "bi-dribbble",
            texto: "Creá partidos y completá el cupo con la bolsa de jugadores",
        },
        {
            icono: "bi-shield-shaded",
            texto: "Armá tu equipo estable y desafiá a otros clubes",
        },
        {
            icono: "bi-geo-alt-fill",
            texto: "Encontrá complejos y canchas para cada deporte",
        },
    ];

    // H-19: enlace real a /welcome; Ctrl/Cmd + clic lo abre en otra pestaña
    function volver(e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        onNavigate("welcome");
    }
</script>

<main class="min-h-screen grid lg:grid-cols-2 bg-slate-50">
    <!-- Panel de marca (solo escritorio). Usa <p> y no encabezados para no romper H-12 -->
    <aside
        class="hidden lg:flex flex-col justify-between gap-10 p-12 xl:p-16 text-white bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700"
        aria-label="Qué ofrece PlayTime"
    >
        <div class="flex items-center gap-3">
            <span
                class="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-2xl"
                aria-hidden="true">⚽</span
            >
            <span class="text-2xl font-extrabold tracking-wide">PlayTime</span>
        </div>

        <div>
            <p class="text-4xl xl:text-5xl font-extrabold leading-tight">
                {mensajePanel}
            </p>
            <ul class="mt-8 space-y-4">
                {#each beneficios as b (b.icono)}
                    <li class="flex items-start gap-3 text-blue-100">
                        <i
                            class="bi {b.icono} text-xl text-emerald-300 shrink-0"
                            aria-hidden="true"
                        ></i>
                        <span>{b.texto}</span>
                    </li>
                {/each}
            </ul>
        </div>

        <p class="text-sm text-blue-200">
            Fútbol · Pádel · Tenis · Básquet · Vóley
        </p>
    </aside>

    <div class="flex flex-col justify-center px-4 py-8 sm:px-8">
        <div class="w-full {ancho} mx-auto">
            <a
                href="/welcome"
                onclick={volver}
                class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700 rounded-md"
            >
                <i class="bi bi-arrow-left" aria-hidden="true"></i>
                <span>Volver a la portada</span>
            </a>

            <header class="mt-6 mb-6">
                <!-- Logo solo en mobile (en escritorio ya está en el panel) -->
                <span
                    class="lg:hidden inline-flex w-12 h-12 mb-4 rounded-full bg-blue-600 text-white items-center justify-center text-2xl"
                    aria-hidden="true">⚽</span
                >
                <h1
                    class="text-3xl font-extrabold tracking-tight text-slate-900"
                >
                    {titulo}
                </h1>
                {#if subtitulo}
                    <p class="mt-1 text-slate-600">{subtitulo}</p>
                {/if}
            </header>

            <div
                class="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 sm:p-8"
            >
                {@render children()}
            </div>
        </div>
    </div>
</main>
