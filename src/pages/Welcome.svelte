<script>
    // Sintaxis estándar y compatible de props en Svelte
    export let onNavigate = (view) => {};
</script>

<main
    class="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-600 flex items-center justify-center p-4 py-8"
>
    <div class="w-full max-w-md">
        <!-- Tarjeta Glassmorphism -->
        <article
            class="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-white"
        >
            <!-- Logo esférico -->
            <div
                class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/20"
                aria-hidden="true"
            >
                <span class="text-4xl">⚽</span>
            </div>

            <!-- H-12: Único h1 semántico -->
            <h1
                class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2"
            >
                PlayTime
            </h1>

            <p class="text-blue-100/75 text-base sm:text-lg font-light mb-6">
                Reservá tu cancha en segundos
            </p>

            <!-- Lista de características -->
            <section
                class="space-y-3 text-left mb-8"
                aria-label="Características principales"
            >
                <div
                    class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                >
                    <i
                        class="bi bi-search text-amber-400 text-xl shrink-0"
                        aria-hidden="true"
                    ></i>
                    <span class="text-sm sm:text-base font-medium"
                        >Buscá canchas disponibles</span
                    >
                </div>

                <div
                    class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                >
                    <i
                        class="bi bi-calendar2-check text-emerald-400 text-xl shrink-0"
                        aria-hidden="true"
                    ></i>
                    <span class="text-sm sm:text-base font-medium"
                        >Reservá en tiempo real</span
                    >
                </div>

                <div
                    class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3"
                >
                    <i
                        class="bi bi-people text-cyan-400 text-xl shrink-0"
                        aria-hidden="true"
                    ></i>
                    <span class="text-sm sm:text-base font-medium"
                        >Conectá con otros jugadores</span
                    >
                </div>
            </section>

            <!-- Acciones de Navegación -->
            <div class="flex flex-col gap-3">
                <button
                    type="button"
                    class="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition duration-200 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    onclick={() => onNavigate("register")}
                >
                    <i class="bi bi-person-plus-fill" aria-hidden="true"></i>
                    <span>Crear Cuenta</span>
                </button>

                <button
                    type="button"
                    class="w-full border-2 border-white/80 hover:bg-white/10 active:scale-[0.98] transition duration-200 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    onclick={() => onNavigate("login")}
                >
                    <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                    <span>Iniciar Sesión</span>
                </button>
            </div>
        </article>
    </div>
</main>
