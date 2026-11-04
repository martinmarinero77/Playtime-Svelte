<script>
    import { obtenerUsuarioActual } from "../lib/api.js";

    export let activePage = "home";
    export let onNavigate = () => {};

    const usuario = obtenerUsuarioActual();

    let sidebarAbierta = false;
    let showLogoutModal = false;

    function irA(pagina, opciones = {}) {
        sidebarAbierta = false;
        onNavigate(pagina, opciones);
    }

    function handleLogout() {
        localStorage.removeItem("playtime_token");
        localStorage.removeItem("playtime_user");
        sessionStorage.removeItem("playtime_token");
        sessionStorage.removeItem("playtime_user");
        sessionStorage.removeItem("playtime_redirect");
        showLogoutModal = false;
        onNavigate("login");
    }
</script>

<!-- Topbar móvil (< 992px) -->
<div class="pt-topbar-mobile">
    <div class="flex items-center gap-3">
        <button
            type="button"
            class="pt-topbar-btn"
            onclick={() => (sidebarAbierta = !sidebarAbierta)}
            aria-label={sidebarAbierta
                ? "Cerrar menú de navegación"
                : "Abrir menú de navegación"}
            aria-expanded={sidebarAbierta}
        >
            <i
                class="bi {sidebarAbierta ? 'bi-x-lg' : 'bi-list'} text-xl"
                aria-hidden="true"
            ></i>
        </button>
        <div class="flex items-center gap-2 font-extrabold tracking-wide">
            <span aria-hidden="true">⚽</span>
            <span>PlayTime</span>
        </div>
    </div>

    <div class="pt-user-avatar text-sm" title={usuario.nombre}>
        {usuario.inicial}
    </div>
</div>

<!-- Backdrop oscuro en móvil cuando la sidebar está abierta -->
{#if sidebarAbierta}
    <button
        type="button"
        aria-label="Cerrar menú lateral"
        onclick={() => (sidebarAbierta = false)}
        class="fixed inset-0 bg-black/40 z-[1035] lg:hidden border-0"
    ></button>
{/if}

<!-- SIDEBAR FIJA DE 260PX (App Shell Web) -->
<aside
    class="pt-sidebar {sidebarAbierta ? 'open' : ''}"
    aria-label="Menú lateral principal"
>
    <button
        type="button"
        onclick={() => irA("home")}
        class="pt-brand bg-transparent border-0 text-left cursor-pointer"
    >
        <div class="pt-brand-logo" aria-hidden="true">⚽</div>
        <div>
            <div class="pt-brand-name">PlayTime</div>
            <div class="pt-brand-sub">Reservas y Comunidad</div>
        </div>
    </button>

    <div class="pt-nav-label">Menú Principal</div>
    <nav class="pt-nav" aria-label="Secciones de PlayTime">
        <button
            type="button"
            onclick={() => irA("home")}
            class="pt-nav-item {activePage === 'home' ? 'active' : ''}"
        >
            <i class="bi bi-house-door-fill" aria-hidden="true"></i>
            <span>Inicio</span>
        </button>

        <button
            type="button"
            onclick={() => irA("partidos")}
            class="pt-nav-item {activePage === 'partidos' ? 'active' : ''}"
        >
            <i class="bi bi-dribbble" aria-hidden="true"></i>
            <span>Jugar Partido</span>
        </button>

        <button
            type="button"
            onclick={() => irA("equipos")}
            class="pt-nav-item {activePage === 'equipos' ? 'active' : ''}"
        >
            <i class="bi bi-shield-shaded" aria-hidden="true"></i>
            <span>Equipos y Desafíos</span>
        </button>

        <button
            type="button"
            onclick={() => irA("reservas")}
            class="pt-nav-item {activePage === 'reservas' ? 'active' : ''}"
        >
            <i class="bi bi-calendar-check-fill" aria-hidden="true"></i>
            <span>Mis Reservas</span>
        </button>

        <button
            type="button"
            onclick={() => irA("torneos")}
            class="pt-nav-item {activePage === 'torneos' ? 'active' : ''}"
        >
            <i class="bi bi-trophy-fill" aria-hidden="true"></i>
            <span>Torneos</span>
        </button>
    </nav>

    <div class="pt-nav-label">Social</div>
    <nav class="pt-nav" aria-label="Accesos rápidos sociales">
        <button
            type="button"
            onclick={() => irA("crear-partido")}
            class="pt-nav-item {activePage === 'crear-partido' ? 'active' : ''}"
        >
            <i class="bi bi-plus-circle-fill" aria-hidden="true"></i>
            <span>Crear Partido</span>
        </button>

        <button
            type="button"
            onclick={() => irA("amigos")}
            class="pt-nav-item {activePage === 'amigos' ? 'active' : ''}"
        >
            <i class="bi bi-person-hearts" aria-hidden="true"></i>
            <span>Mis Amigos</span>
        </button>
    </nav>

    <!-- Footer con datos reales del usuario logueado -->
    <div class="pt-sidebar-footer">
        <div class="pt-user mb-2">
            <div class="pt-user-avatar">{usuario.inicial}</div>
            <div class="overflow-hidden">
                <div class="pt-user-name truncate">
                    {usuario.nombre}
                    {usuario.apellido || ""}
                </div>
                {#if usuario.email}
                    <div class="pt-user-mail truncate">{usuario.email}</div>
                {/if}
            </div>
        </div>

        <button
            type="button"
            onclick={() => (showLogoutModal = true)}
            class="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-white/20"
        >
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
        </button>
    </div>
</aside>

<!-- Modal de Confirmación de Logout (según sección #modales del Design System) -->
{#if showLogoutModal}
    <div
        class="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
    >
        <div
            class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-800"
        >
            <div class="flex items-center gap-2.5 mb-3">
                <i
                    class="bi bi-exclamation-triangle-fill text-amber-500 text-xl"
                    aria-hidden="true"
                ></i>
                <h2
                    id="logout-modal-title"
                    class="text-lg font-bold text-slate-900"
                >
                    Cerrar Sesión
                </h2>
            </div>

            <p class="text-sm text-slate-600 mb-6">
                ¿Estás seguro de que querés cerrar tu sesión en <strong
                    >PlayTime</strong
                >?
            </p>

            <div class="flex gap-2.5 justify-end">
                <button
                    type="button"
                    onclick={() => (showLogoutModal = false)}
                    class="btn-pt btn-pt-outline btn-pt-sm"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onclick={handleLogout}
                    class="btn-pt btn-pt-danger-soft btn-pt-sm"
                >
                    <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
                    <span>Sí, salir</span>
                </button>
            </div>
        </div>
    </div>
{/if}
