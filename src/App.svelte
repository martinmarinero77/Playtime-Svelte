<script>
  import Welcome from "./pages/Welcome.svelte";
  import Login from "./pages/Login.svelte";
  import Register from "./pages/Register.svelte";

  // Estado simple para controlar la vista actual: 'welcome', 'login', 'register'
  let currentView = "welcome";

  function navigate(view) {
    currentView = view;
  }
</script>

<!-- H-51: Skip link accesible para usuarios de teclado -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md shadow-lg"
>
  Saltar al contenido principal
</a>

<div id="main-content">
  {#if currentView === "welcome"}
    <Welcome onNavigate={navigate} />
  {:else if currentView === "login"}
    <Login onNavigate={navigate} />
  {:else if currentView === "register"}
    <Register onNavigate={navigate} />
  {/if}
</div>
