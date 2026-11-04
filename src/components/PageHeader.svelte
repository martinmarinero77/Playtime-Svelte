<script>
    let {
        etiqueta = "",
        titulo = "",
        descripcion = "",
        iconoDescripcion = "",
        textoBoton = "",
        iconoBoton = "bi-plus-circle-fill",
        claseBoton = "btn-pt-success",
        iconoDecorativo = "",
        onAccion = () => {},
    } = $props();
</script>

<header class="pt-page-header flex-wrap">
    <div>
        {#if etiqueta}
            <p
                class="text-xs uppercase tracking-wider text-blue-100 font-bold mb-1"
            >
                {etiqueta}
            </p>
        {/if}

        <h1 class="text-2xl sm:text-3xl font-extrabold">
            {titulo}
        </h1>

        {#if descripcion}
            <p class="text-sm text-blue-100/90 mt-1 flex items-center gap-1.5">
                {#if iconoDescripcion}
                    <i class="bi {iconoDescripcion}" aria-hidden="true"></i>
                {/if}
                <span>{descripcion}</span>
            </p>
        {/if}
    </div>

    {#if textoBoton}
        <button type="button" onclick={onAccion} class="btn-pt {claseBoton}">
            {#if iconoBoton}
                <i class="bi {iconoBoton}" aria-hidden="true"></i>
            {/if}
            <span>{textoBoton}</span>
        </button>
    {:else if iconoDecorativo}
        <div class="icon-box" aria-hidden="true">
            <i class="bi {iconoDecorativo}"></i>
        </div>
    {/if}
</header>
