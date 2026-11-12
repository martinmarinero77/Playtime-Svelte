// Estado reactivo global del tema claro/oscuro (Apunte Svelte §6.4 y §12.2)
const CLAVE_STORAGE = "playtime_theme";

function detectarTemaInicial() {
    if (typeof window === "undefined") return false;
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado === "dark") return true;
    if (guardado === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

let oscuro = $state(detectarTemaInicial());

function aplicarAtributoDom(esOscuro) {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = esOscuro ? "dark" : "light";
}

// Aplicamos el tema apenas se importa el módulo
aplicarAtributoDom(oscuro);

export function toggleTema() {
    oscuro = !oscuro;
    localStorage.setItem(CLAVE_STORAGE, oscuro ? "dark" : "light");
    aplicarAtributoDom(oscuro);
}

export const tema = {
    get oscuro() {
        return oscuro;
    },
};