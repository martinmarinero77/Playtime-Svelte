<script>
    export let onNavigate = () => {};

    // Estados reactivos del formulario
    let email = "";
    let password = "";
    let showPassword = false;
    let rememberMe = false;
    let loading = false;
    let errorMessage = "";
    let successMessage = "";

    // Alternar visibilidad de contraseña
    function togglePassword() {
        showPassword = !showPassword;
    }

    // Manejador del envío del formulario
    async function handleSubmit(event) {
        event.preventDefault();
        errorMessage = "";
        successMessage = "";

        // Validación básica previa
        if (!email || !password) {
            errorMessage = "Por favor, completá todos los campos requeridos.";
            return;
        }

        loading = true;

        try {
            // Endpoint de tu PlayTimeAPI en .NET
            // Ajusta el puerto si tu API corre en otro (ej: 5000, 5001, 7000, etc.)
            const response = await fetch(
                "http://localhost:5254/api/Auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                        "Credenciales inválidas. Verificá tu correo y contraseña.",
                );
            }

            successMessage = "¡Inicio de sesión exitoso!";

            // Guardar sesión/token si el usuario eligió "Recordarme"
            if (rememberMe) {
                localStorage.setItem("playtime_token", data.data.token);
            } else {
                sessionStorage.setItem("playtime_token", data.data.token);
            }

            // Navegar al Home luego de un breve instante
            setTimeout(() => {
                onNavigate("home");
            }, 800);
        } catch (err) {
            // Si la API no está corriendo localmente todavía, lo atrapamos elegantemente
            if (err.name === "TypeError" && err.message.includes("fetch")) {
                errorMessage =
                    "No se pudo conectar con el servidor (.NET). Verificá que la API esté encendida.";
            } else {
                errorMessage = err.message;
            }
        } finally {
            loading = false;
        }
    }
</script>

<main
    class="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 flex items-center justify-center p-4 py-8"
>
    <div class="w-full max-w-md">
        <!-- Botón Volver a la Portada -->
        <button
            type="button"
            onclick={() => onNavigate("welcome")}
            class="mb-4 inline-flex items-center gap-2 text-blue-200 hover:text-white transition duration-200 text-sm font-medium cursor-pointer"
        >
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            <span>Volver al inicio</span>
        </button>

        <!-- Tarjeta Principal de Login -->
        <article
            class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-slate-800"
        >
            <!-- Cabecera con degradado azul (idéntica a login.jsp) -->
            <header
                class="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white relative"
            >
                <div
                    class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-900/40"
                    aria-hidden="true"
                >
                    <span class="text-4xl animate-pulse">⚽</span>
                </div>
                <h1
                    class="text-2xl sm:text-3xl font-extrabold tracking-wide mb-1"
                >
                    PlayTime
                </h1>
                <p class="text-blue-100/90 text-sm font-light">
                    Reservá tu cancha en segundos
                </p>
            </header>

            <!-- Cuerpo del Formulario -->
            <div class="p-6 sm:p-8">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-slate-800">
                        ¡Bienvenido!
                    </h2>
                    <p class="text-slate-500 text-sm mt-1">
                        Iniciá sesión para continuar
                    </p>
                </div>

                <!-- Alerta de Error -->
                {#if errorMessage}
                    <div
                        class="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
                        role="alert"
                    >
                        <i
                            class="bi bi-exclamation-triangle-fill text-red-500 text-base shrink-0 mt-0.5"
                            aria-hidden="true"
                        ></i>
                        <div>{errorMessage}</div>
                    </div>
                {/if}

                <!-- Alerta de Éxito -->
                {#if successMessage}
                    <div
                        class="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3"
                        role="alert"
                    >
                        <i
                            class="bi bi-check-circle-fill text-emerald-500 text-base shrink-0 mt-0.5"
                            aria-hidden="true"
                        ></i>
                        <div>{successMessage}</div>
                    </div>
                {/if}

                <form onsubmit={handleSubmit} novalidate class="space-y-4">
                    <!-- Campo Email -->
                    <div>
                        <label
                            for="email"
                            class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                            Correo Electrónico
                        </label>
                        <div class="relative flex items-center">
                            <span
                                class="absolute left-3.5 text-blue-600 pointer-events-none"
                                aria-hidden="true"
                            >
                                <i class="bi bi-envelope"></i>
                            </span>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                bind:value={email}
                                required
                                autocomplete="email"
                                placeholder="tu@email.com"
                                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                            />
                        </div>
                    </div>

                    <!-- Campo Contraseña -->
                    <div>
                        <label
                            for="password"
                            class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                        >
                            Contraseña
                        </label>
                        <div class="relative flex items-center">
                            <span
                                class="absolute left-3.5 text-blue-600 pointer-events-none"
                                aria-hidden="true"
                            >
                                <i class="bi bi-lock"></i>
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                bind:value={password}
                                required
                                minlength="6"
                                autocomplete="current-password"
                                placeholder="••••••••"
                                class="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                            />
                            <button
                                type="button"
                                onclick={togglePassword}
                                aria-label={showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"}
                                class="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md focus:outline-none cursor-pointer transition"
                            >
                                <i
                                    class="bi {showPassword
                                        ? 'bi-eye'
                                        : 'bi-eye-slash'} text-lg"
                                ></i>
                            </button>
                        </div>
                    </div>

                    <!-- Recordarme y Olvidé mi Contraseña -->
                    <div
                        class="flex items-center justify-between text-xs sm:text-sm pt-1"
                    >
                        <label
                            class="flex items-center gap-2 text-slate-600 cursor-pointer select-none"
                        >
                            <input
                                type="checkbox"
                                bind:checked={rememberMe}
                                class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Recordarme</span>
                        </label>

                        <a
                            href="#recuperar"
                            class="text-blue-600 hover:text-blue-800 font-medium hover:underline transition"
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <!-- Botón de Inicio de Sesión -->
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {#if loading}
                            <span
                                class="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"
                                aria-hidden="true"
                            ></span>
                            <span>Iniciando sesión...</span>
                        {:else}
                            <i
                                class="bi bi-box-arrow-in-right"
                                aria-hidden="true"
                            ></i>
                            <span>Iniciar Sesión</span>
                        {/if}
                    </button>
                </form>

                <!-- Separador -->
                <div class="relative my-6 text-center">
                    <div
                        class="absolute inset-0 flex items-center"
                        aria-hidden="true"
                    >
                        <div class="w-full border-t border-slate-200"></div>
                    </div>
                    <span
                        class="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-semibold"
                    >
                        ¿Nuevo en PlayTime?
                    </span>
                </div>

                <!-- Enlace a Registro -->
                <div class="text-center">
                    <button
                        type="button"
                        onclick={() => onNavigate("register")}
                        class="text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline cursor-pointer transition"
                    >
                        Crear una cuenta nueva
                    </button>
                </div>
            </div>
        </article>
    </div>
</main>
