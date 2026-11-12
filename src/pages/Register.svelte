<script>
    import AuthLayout from "../components/auth/AuthLayout.svelte";
    import CampoPassword from "../components/auth/CampoPassword.svelte";
    import { authApi } from "../lib/api.js";

    let { onNavigate = () => {} } = $props();

    let form = $state({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        direccion: "",
        localidad: "",
        provincia: "",
    });
    let password = $state("");
    let confirmPassword = $state("");
    let aceptaDatos = $state(false);

    let intentoEnviar = $state(false);
    let cargando = $state(false);
    let errorMsg = $state("");
    let registrado = $state(false);

    // R-08: todo esto se DERIVA de password; no hay estado duplicado
    const NIVELES = [
        { texto: "Escribí una contraseña", color: "bg-slate-200" },
        { texto: "Muy corta", color: "bg-red-500" },
        { texto: "Aceptable", color: "bg-amber-500" },
        { texto: "Buena", color: "bg-blue-500" },
        { texto: "Muy segura", color: "bg-emerald-500" },
    ];

    let fuerza = $derived.by(() => {
        if (!password) return 0;
        if (password.length < 6) return 1;
        let puntos = 2;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++;
        if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) puntos++;
        return puntos;
    });
    let nivel = $derived(NIVELES[fuerza]);
    let coinciden = $derived(
        confirmPassword.length > 0 && password === confirmPassword,
    );
    let errorConfirmacion = $derived(confirmPassword.length > 0 && !coinciden);

    async function handleRegister(e) {
        e.preventDefault();
        errorMsg = "";
        intentoEnviar = true;

        if (
            !form.nombre.trim() ||
            !form.apellido.trim() ||
            !form.email.trim()
        ) {
            errorMsg = "Completá tu nombre, apellido y correo electrónico.";
            return;
        }
        if (password.length < 6) {
            errorMsg = "La contraseña debe tener al menos 6 caracteres.";
            return;
        }
        if (!coinciden) {
            errorMsg = "Las contraseñas no coinciden.";
            return;
        }
        if (!aceptaDatos) {
            errorMsg =
                "Necesitamos tu consentimiento para usar tus datos en la app.";
            return;
        }

        cargando = true;
        try {
            await authApi.registrar({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                email: form.email.trim(),
                password,
                telefono: form.telefono.trim() || null,
                direccion: form.direccion.trim() || null,
                localidad: form.localidad.trim() || null,
                provincia: form.provincia.trim() || null,
            });
            registrado = true;
        } catch (err) {
            errorMsg =
                err instanceof TypeError
                    ? "No se pudo conectar con el servidor. Verificá que PlayTimeAPI (.NET) esté encendida."
                    : err.message;
        } finally {
            cargando = false;
        }
    }

    function irALogin(e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        onNavigate("login");
    }
</script>

<!-- Snippet reutilizable para los campos de texto (Apunte Svelte §5.3) -->
{#snippet campo(
    clave,
    etiqueta,
    {
        tipo = "text",
        icono = "",
        autocomplete = "off",
        placeholder = "",
        obligatorio = false,
    } = {},
)}
    <div>
        <label
            for="reg-{clave}"
            class="block text-sm font-semibold text-slate-700 mb-1.5"
        >
            {etiqueta}{#if obligatorio}<span
                    class="text-red-700"
                    aria-hidden="true"
                >
                    *</span
                >{/if}
        </label>
        <div class="relative">
            {#if icono}
                <i
                    class="bi {icono} absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                ></i>
            {/if}
            <input
                id="reg-{clave}"
                type={tipo}
                bind:value={form[clave]}
                required={obligatorio}
                {autocomplete}
                {placeholder}
                aria-invalid={obligatorio &&
                    intentoEnviar &&
                    !form[clave].trim()}
                class="pt-input {icono ? 'pl-10' : ''}"
            />
        </div>
    </div>
{/snippet}

<AuthLayout
    titulo="Crear cuenta"
    subtitulo="Sumate a la comunidad y empezá a jugar."
    mensajePanel="Armá tu partido en minutos"
    ancho="max-w-xl"
    {onNavigate}
>
    {#if registrado}
        <div class="text-center py-4" role="status">
            <span
                class="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl"
                aria-hidden="true"
            >
                <i class="bi bi-check-lg"></i>
            </span>
            <h2 class="mt-4 text-xl font-bold text-slate-900">
                ¡Cuenta creada!
            </h2>
            <p class="mt-1 text-slate-600">
                Ya podés iniciar sesión con <strong>{form.email}</strong>.
            </p>
            <a
                href="/login"
                onclick={irALogin}
                class="btn-pt btn-pt-primary w-full mt-6"
            >
                <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                <span>Ir a iniciar sesión</span>
            </a>
        </div>
    {:else}
        {#if errorMsg}
            <div
                id="reg-error"
                class="pt-alert pt-alert-danger mb-5"
                role="alert"
            >
                <div class="flex items-start gap-2">
                    <i
                        class="bi bi-exclamation-triangle-fill mt-0.5"
                        aria-hidden="true"
                    ></i>
                    <span>{errorMsg}</span>
                </div>
            </div>
        {/if}

        <form
            onsubmit={handleRegister}
            novalidate
            aria-busy={cargando}
            aria-describedby={errorMsg ? "reg-error" : undefined}
            class="space-y-6"
        >
            <p class="text-xs text-slate-600">
                Los campos marcados con * son obligatorios.
            </p>

            <fieldset class="space-y-4">
                <legend
                    class="text-sm font-bold uppercase tracking-wider text-blue-700 mb-3"
                >
                    Datos personales
                </legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {@render campo("nombre", "Nombre", {
                        icono: "bi-person",
                        autocomplete: "given-name",
                        placeholder: "Juan",
                        obligatorio: true,
                    })}
                    {@render campo("apellido", "Apellido", {
                        icono: "bi-person",
                        autocomplete: "family-name",
                        placeholder: "Pérez",
                        obligatorio: true,
                    })}
                    {@render campo("email", "Correo electrónico", {
                        tipo: "email",
                        icono: "bi-envelope",
                        autocomplete: "email",
                        placeholder: "tu@email.com",
                        obligatorio: true,
                    })}
                    {@render campo("telefono", "Teléfono", {
                        tipo: "tel",
                        icono: "bi-telephone",
                        autocomplete: "tel",
                        placeholder: "+54 9 266 123-4567",
                    })}
                </div>
            </fieldset>

            <fieldset class="space-y-4">
                <legend
                    class="text-sm font-bold uppercase tracking-wider text-blue-700 mb-3"
                >
                    Seguridad
                </legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <CampoPassword
                            id="reg-password"
                            label="Contraseña *"
                            bind:value={password}
                            autocomplete="new-password"
                            invalido={intentoEnviar && password.length < 6}
                            descripcionId="reg-password-ayuda"
                        />
                        <div class="flex gap-1" aria-hidden="true">
                            {#each [1, 2, 3, 4] as n (n)}
                                <span
                                    class="h-1.5 flex-1 rounded-full transition-colors {n <=
                                    fuerza
                                        ? nivel.color
                                        : 'bg-slate-200'}"
                                ></span>
                            {/each}
                        </div>
                        <p
                            id="reg-password-ayuda"
                            class="text-xs text-slate-600"
                            aria-live="polite"
                        >
                            Seguridad: <strong>{nivel.texto}</strong> · mínimo 6
                            caracteres
                        </p>
                    </div>

                    <div class="space-y-2">
                        <CampoPassword
                            id="reg-confirm"
                            label="Repetir contraseña *"
                            bind:value={confirmPassword}
                            autocomplete="new-password"
                            invalido={errorConfirmacion}
                            descripcionId="reg-confirm-ayuda"
                        />
                        <p
                            id="reg-confirm-ayuda"
                            class="text-xs"
                            aria-live="polite"
                        >
                            {#if errorConfirmacion}
                                <span class="text-red-700">
                                    <i
                                        class="bi bi-x-circle-fill"
                                        aria-hidden="true"
                                    ></i> Las contraseñas no coinciden
                                </span>
                            {:else if coinciden}
                                <span class="text-emerald-700">
                                    <i
                                        class="bi bi-check-circle-fill"
                                        aria-hidden="true"
                                    ></i> Las contraseñas coinciden
                                </span>
                            {/if}
                        </p>
                    </div>
                </div>
            </fieldset>

            <!-- <details> nativo: plegable y accesible sin JavaScript -->
            <details class="group rounded-xl border border-slate-200">
                <summary
                    class="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer rounded-xl text-sm font-semibold text-slate-700 list-none"
                >
                    <span
                        ><i
                            class="bi bi-geo-alt text-blue-700"
                            aria-hidden="true"
                        ></i> Agregar ubicación (opcional)</span
                    >
                    <i
                        class="bi bi-chevron-down transition-transform group-open:rotate-180"
                        aria-hidden="true"
                    ></i>
                </summary>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 pb-4">
                    {@render campo("direccion", "Dirección", {
                        autocomplete: "street-address",
                        placeholder: "Av. Illia 123",
                    })}
                    {@render campo("localidad", "Localidad", {
                        autocomplete: "address-level2",
                        placeholder: "San Luis",
                    })}
                    {@render campo("provincia", "Provincia", {
                        autocomplete: "address-level1",
                        placeholder: "San Luis",
                    })}
                </div>
            </details>

            <label
                class="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer select-none"
            >
                <input
                    type="checkbox"
                    bind:checked={aceptaDatos}
                    required
                    class="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer"
                />
                <span>
                    Acepto que PlayTime use mis datos (nombre, correo y
                    teléfono) solo para organizar partidos y conectarme con
                    otros jugadores.
                </span>
            </label>

            <button
                type="submit"
                disabled={cargando}
                class="btn-pt btn-pt-primary w-full"
            >
                {#if cargando}
                    <span
                        class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                        aria-hidden="true"
                    ></span>
                    <span>Creando cuenta...</span>
                {:else}
                    <i class="bi bi-person-check-fill" aria-hidden="true"></i>
                    <span>Crear cuenta</span>
                {/if}
            </button>
        </form>

        <p
            class="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600"
        >
            ¿Ya tenés cuenta?
            <a
                href="/login"
                onclick={irALogin}
                class="font-semibold text-blue-700 hover:underline"
            >
                Iniciá sesión
            </a>
        </p>
    {/if}
</AuthLayout>
