<script>
    import AuthLayout from "../components/auth/AuthLayout.svelte";
    import CampoPassword from "../components/auth/CampoPassword.svelte";
    import { authApi, guardarSesion } from "../lib/api.js";

    let { onNavigate = () => {} } = $props();

    let email = $state("");
    let password = $state("");
    let recordarme = $state(false);
    let cargando = $state(false);
    let errorMsg = $state("");

    async function handleSubmit(e) {
        e.preventDefault();
        errorMsg = "";

        if (!email.trim() || !password) {
            errorMsg = "Completá tu correo y tu contraseña.";
            return;
        }

        cargando = true;
        try {
            const res = await authApi.login({ email: email.trim(), password });
            guardarSesion(res.data, recordarme);
            // R-27: navegamos al instante, sin setTimeout que haya que limpiar
            onNavigate("home");
        } catch (err) {
            errorMsg =
                err instanceof TypeError
                    ? "No se pudo conectar con el servidor. Verificá que PlayTimeAPI (.NET) esté encendida."
                    : err.message || "Correo o contraseña incorrectos.";
        } finally {
            cargando = false;
        }
    }

    function irARegistro(e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        onNavigate("register");
    }
</script>

<AuthLayout
    titulo="Iniciar sesión"
    subtitulo="¡Qué bueno verte de nuevo! Ingresá para seguir jugando."
    mensajePanel="Volvé a la cancha"
    {onNavigate}
>
    {#if errorMsg}
        <div
            id="login-error"
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
        onsubmit={handleSubmit}
        novalidate
        aria-busy={cargando}
        aria-describedby={errorMsg ? "login-error" : undefined}
        class="space-y-5"
    >
        <div>
            <label
                for="login-email"
                class="block text-sm font-semibold text-slate-700 mb-1.5"
            >
                Correo electrónico
            </label>
            <div class="relative">
                <i
                    class="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                ></i>
                <input
                    id="login-email"
                    type="email"
                    bind:value={email}
                    required
                    autocomplete="email"
                    placeholder="tu@email.com"
                    aria-invalid={Boolean(errorMsg) && !email.trim()}
                    class="pt-input pl-10"
                />
            </div>
        </div>

        <CampoPassword
            id="login-password"
            label="Contraseña"
            bind:value={password}
            autocomplete="current-password"
            invalido={Boolean(errorMsg) && !password}
        />

        <label
            class="flex items-center gap-2 w-fit text-sm text-slate-700 cursor-pointer select-none"
        >
            <input
                type="checkbox"
                bind:checked={recordarme}
                class="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span>Mantener la sesión iniciada</span>
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
                <span>Ingresando...</span>
            {:else}
                <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
                <span>Iniciar sesión</span>
            {/if}
        </button>
    </form>

    <p
        class="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-600"
    >
        ¿No tenés cuenta?
        <a
            href="/register"
            onclick={irARegistro}
            class="font-semibold text-blue-700 hover:underline"
        >
            Creá una en un minuto
        </a>
    </p>
</AuthLayout>
