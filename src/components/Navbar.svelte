<script>
    export let activePage = "home";
    export let onNavigate = () => {};

    let showLogoutModal = false;

    function handleLogout() {
        // Limpiamos tokens de almacenamiento
        localStorage.removeItem("playtime_token");
        sessionStorage.removeItem("playtime_token");
        showLogoutModal = false;
        onNavigate("welcome");
    }
</script>

<!-- Barra de Navegación Inferior Fija (Mobile-first) -->
<nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
    aria-label="Navegación principal"
>
    <div class="max-w-md mx-auto px-4 flex justify-between items-center h-16">
        <!-- Inicio -->
        <button
            type="button"
            onclick={() => onNavigate("home")}
            class="flex flex-col items-center justify-center flex-1 py-1 transition {activePage ===
            'home'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-700'}"
        >
            <i
                class="bi {activePage === 'home'
                    ? 'bi-house-door-fill'
                    : 'bi-house-door'} text-xl"
            ></i>
            <span class="text-[11px] mt-0.5">Inicio</span>
        </button>

        <!-- Torneos -->
        <button
            type="button"
            onclick={() => onNavigate("torneos")}
            class="flex flex-col items-center justify-center flex-1 py-1 transition {activePage ===
            'torneos'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-700'}"
        >
            <i
                class="bi {activePage === 'torneos'
                    ? 'bi-trophy-fill'
                    : 'bi-trophy'} text-xl"
            ></i>
            <span class="text-[11px] mt-0.5">Torneos</span>
        </button>

        <!-- Reservas -->
        <button
            type="button"
            onclick={() => onNavigate("reservas")}
            class="flex flex-col items-center justify-center flex-1 py-1 transition {activePage ===
            'reservas'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-700'}"
        >
            <i
                class="bi {activePage === 'reservas'
                    ? 'bi-calendar-check-fill'
                    : 'bi-calendar-check'} text-xl"
            ></i>
            <span class="text-[11px] mt-0.5">Reservas</span>
        </button>

        <!-- Comunidad -->
        <button
            type="button"
            onclick={() => onNavigate("comunidad")}
            class="flex flex-col items-center justify-center flex-1 py-1 transition {activePage ===
            'comunidad'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-700'}"
        >
            <i
                class="bi {activePage === 'comunidad'
                    ? 'bi-people-fill'
                    : 'bi-people'} text-xl"
            ></i>
            <span class="text-[11px] mt-0.5">Comunidad</span>
        </button>

        <!-- Salir (Abre Modal) -->
        <button
            type="button"
            onclick={() => (showLogoutModal = true)}
            class="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-red-600 transition"
            aria-label="Cerrar sesión"
        >
            <i class="bi bi-box-arrow-right text-xl"></i>
            <span class="text-[11px] mt-0.5">Salir</span>
        </button>
    </div>
</nav>

<!-- Modal de Confirmación de Logout -->
{#if showLogoutModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-800 animate-scale-up"
        >
            <div class="flex items-center gap-3 text-amber-500 mb-3">
                <i class="bi bi-exclamation-circle-fill text-2xl"></i>
                <h2 class="text-lg font-bold text-slate-900">Cerrar Sesión</h2>
            </div>

            <p class="text-sm text-slate-600 mb-6">
                ¿Estás seguro de que deseás cerrar tu sesión en PlayTime?
            </p>

            <div class="flex gap-3 justify-end">
                <button
                    type="button"
                    onclick={() => (showLogoutModal = false)}
                    class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onclick={handleLogout}
                    class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition cursor-pointer"
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    </div>
{/if}
