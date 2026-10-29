<script>
    export let onNavigate = () => {};

    // Estados del formulario
    let nombre = "";
    let apellido = "";
    let email = "";
    let telefono = "";
    let direccion = "";
    let localidad = "";
    let provincia = "";
    let password = "";
    let confirmPassword = "";
    let termsAccepted = false;

    let showPassword = false;
    let loading = false;
    let errorMessage = "";
    let successMessage = "";

    function togglePassword() {
        showPassword = !showPassword;
    }

    async function handleRegister(event) {
        event.preventDefault();
        errorMessage = "";
        successMessage = "";

        // Validaciones
        if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
            errorMessage = "Por favor, completá los campos obligatorios (*).";
            return;
        }

        if (password.length < 6) {
            errorMessage = "La contraseña debe tener al menos 6 caracteres.";
            return;
        }

        if (password !== confirmPassword) {
            errorMessage = "Las contraseñas no coinciden.";
            return;
        }

        if (!termsAccepted) {
            errorMessage =
                "Debés aceptar los términos y condiciones para continuar.";
            return;
        }

        loading = true;

        try {
            const response = await fetch(
                "http://localhost:5254/api/Auth/register",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombre,
                        apellido,
                        email,
                        password,
                        telefono: telefono || null,
                        direccion: direccion || null,
                        localidad: localidad || null,
                        provincia: provincia || null,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                let errorMsg = data.message || "Error al registrar la cuenta.";
                if (data.errors) {
                    if (Array.isArray(data.errors)) {
                        errorMsg = data.errors.join(", ");
                    } else if (typeof data.errors === "object") {
                        errorMsg = Object.values(data.errors).flat().join(", ");
                    }
                }
                throw new Error(errorMsg);
            }

            successMessage =
                "¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...";

            setTimeout(() => {
                onNavigate("login");
            }, 1500);
        } catch (err) {
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
    <div class="w-full max-w-2xl">
        <!-- Botón Volver -->
        <button
            type="button"
            onclick={() => onNavigate("welcome")}
            class="mb-4 inline-flex items-center gap-2 text-blue-200 hover:text-white transition duration-200 text-sm font-medium cursor-pointer"
        >
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            <span>Volver a la portada</span>
        </button>

        <!-- Tarjeta Principal de Registro -->
        <article
            class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-slate-800"
        >
            <!-- Cabecera -->
            <header
                class="bg-gradient-to-br from-blue-600 to-blue-800 p-6 sm:p-8 text-center text-white relative"
            >
                <div
                    class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md"
                    aria-hidden="true"
                >
                    <span class="text-3xl">⚽</span>
                </div>
                <h1
                    class="text-2xl sm:text-3xl font-extrabold tracking-wide mb-1"
                >
                    Crear Cuenta
                </h1>
                <p class="text-blue-100/90 text-sm font-light">
                    Unite a PlayTime y reservá tus canchas favoritas
                </p>
            </header>

            <!-- Cuerpo del Formulario -->
            <div class="p-6 sm:p-8">
                <!-- Alertas -->
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

                <form onsubmit={handleRegister} novalidate class="space-y-6">
                    <!-- SECCIÓN 1: DATOS PERSONALES -->
                    <div>
                        <h2
                            class="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"
                        >
                            <i class="bi bi-person-circle"></i>
                            <span>Información Personal</span>
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Nombre -->
                            <div>
                                <label
                                    for="nombre"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Nombre *</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-person"></i></span
                                    >
                                    <input
                                        type="text"
                                        id="nombre"
                                        bind:value={nombre}
                                        required
                                        placeholder="Juan"
                                        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <!-- Apellido -->
                            <div>
                                <label
                                    for="apellido"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Apellido *</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-person"></i></span
                                    >
                                    <input
                                        type="text"
                                        id="apellido"
                                        bind:value={apellido}
                                        required
                                        placeholder="Pérez"
                                        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <!-- Email -->
                            <div>
                                <label
                                    for="email"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Email *</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-envelope"></i></span
                                    >
                                    <input
                                        type="email"
                                        id="email"
                                        bind:value={email}
                                        required
                                        placeholder="juan@email.com"
                                        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <!-- Teléfono -->
                            <div>
                                <label
                                    for="telefono"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Teléfono</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-telephone"></i></span
                                    >
                                    <input
                                        type="tel"
                                        id="telefono"
                                        bind:value={telefono}
                                        placeholder="+54 9 11 1234-5678"
                                        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 2: UBICACIÓN (OPCIONAL) -->
                    <div>
                        <h2
                            class="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"
                        >
                            <i class="bi bi-geo-alt"></i>
                            <span>Ubicación (Opcional)</span>
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label
                                    for="direccion"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Dirección</label
                                >
                                <input
                                    type="text"
                                    id="direccion"
                                    bind:value={direccion}
                                    placeholder="Av. Siempre Viva 123"
                                    class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label
                                    for="localidad"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Localidad</label
                                >
                                <input
                                    type="text"
                                    id="localidad"
                                    bind:value={localidad}
                                    placeholder="Capital"
                                    class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label
                                    for="provincia"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Provincia</label
                                >
                                <input
                                    type="text"
                                    id="provincia"
                                    bind:value={provincia}
                                    placeholder="Mendoza"
                                    class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN 3: SEGURIDAD -->
                    <div>
                        <h2
                            class="text-sm font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2"
                        >
                            <i class="bi bi-shield-lock"></i>
                            <span>Seguridad</span>
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Contraseña -->
                            <div>
                                <label
                                    for="password"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Contraseña * (mín. 6)</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-lock"></i></span
                                    >
                                    <input
                                        type={showPassword
                                            ? "text"
                                            : "password"}
                                        id="password"
                                        bind:value={password}
                                        required
                                        minlength="6"
                                        placeholder="••••••••"
                                        class="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onclick={togglePassword}
                                        aria-label={showPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"}
                                        class="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <i
                                            class="bi {showPassword
                                                ? 'bi-eye'
                                                : 'bi-eye-slash'}"
                                        ></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Confirmar Contraseña -->
                            <div>
                                <label
                                    for="confirmPassword"
                                    class="block text-xs font-semibold text-slate-700 mb-1"
                                    >Confirmar Contraseña *</label
                                >
                                <div class="relative flex items-center">
                                    <span
                                        class="absolute left-3 text-blue-600 pointer-events-none"
                                        ><i class="bi bi-lock-fill"></i></span
                                    >
                                    <input
                                        type={showPassword
                                            ? "text"
                                            : "password"}
                                        id="confirmPassword"
                                        bind:value={confirmPassword}
                                        required
                                        placeholder="••••••••"
                                        class="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Términos y condiciones -->
                    <div class="pt-2">
                        <label
                            class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 cursor-pointer select-none"
                        >
                            <input
                                type="checkbox"
                                bind:checked={termsAccepted}
                                class="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span
                                >Acepto los <a
                                    href="#terminos"
                                    class="text-blue-600 font-semibold hover:underline"
                                    >Términos del Servicio</a
                                > y las políticas de privacidad.</span
                            >
                        </label>
                    </div>

                    <!-- Botón de Registro -->
                    <button
                        type="submit"
                        disabled={loading}
                        class="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {#if loading}
                            <span
                                class="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"
                                aria-hidden="true"
                            ></span>
                            <span>Registrando cuenta...</span>
                        {:else}
                            <i
                                class="bi bi-person-check-fill"
                                aria-hidden="true"
                            ></i>
                            <span>Crear Cuenta</span>
                        {/if}
                    </button>
                </form>

                <!-- Enlace a Login -->
                <div class="text-center mt-6 text-sm text-slate-600">
                    ¿Ya tenés una cuenta?
                    <button
                        type="button"
                        onclick={() => onNavigate("login")}
                        class="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer ml-1 transition"
                    >
                        Iniciá sesión aquí
                    </button>
                </div>
            </div>
        </article>
    </div>
</main>
