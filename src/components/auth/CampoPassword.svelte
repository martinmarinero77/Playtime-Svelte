<script>
    // Campo de contraseña reutilizable con botón para mostrar/ocultar.
    // value usa $bindable() para que el padre pueda hacer bind:value (Apunte Svelte §5.2)
    let {
        id,
        label,
        value = $bindable(""),
        autocomplete = "current-password",
        invalido = false,
        descripcionId = undefined,
    } = $props();

    let visible = $state(false);
</script>

<div>
    <label for={id} class="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
    </label>
    <div class="relative">
        <i
            class="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
        ></i>
        <input
            {id}
            type={visible ? "text" : "password"}
            bind:value
            {autocomplete}
            required
            minlength="6"
            placeholder="••••••••"
            aria-invalid={invalido}
            aria-describedby={descripcionId}
            class="pt-input pl-10 pr-12"
        />
        <!-- C-19: sin outline-none, así se ve el foco global de app.css -->
        <button
            type="button"
            onclick={() => (visible = !visible)}
            aria-label="Mostrar contraseña"
            aria-pressed={visible}
            aria-controls={id}
            class="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
            <i class="bi {visible ? 'bi-eye-slash' : 'bi-eye'}" aria-hidden="true"></i>
        </button>
    </div>
</div>