import { tieneSesionActiva } from "./api.js";

const VISTAS_PUBLICAS = ["welcome", "login", "register"];

let currentView = $state("welcome");
let navOptions = $state({});

// 1. Convierte la URL actual en { view, options }
export function parsearUrlActual() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(window.location.search);

    if (path === "/" || path === "/welcome") {
        return { view: "welcome", options: {} };
    }
    if (path === "/login") {
        return { view: "login", options: {} };
    }
    if (path === "/register") {
        return { view: "register", options: {} };
    }
    if (path === "/home") {
        return { view: "home", options: {} };
    }
    if (path === "/crear-partido") {
        return { view: "crear-partido", options: {} };
    }
    if (path.startsWith("/partidos/") && path.endsWith("/editar")) {
        const eventoId = decodeURIComponent(
            path.slice("/partidos/".length, -"/editar".length),
        );
        return { view: "editar-partido", options: { eventoId } };
    }
    if (path.startsWith("/partidos/")) {
        const eventoId = decodeURIComponent(path.slice("/partidos/".length));
        return { view: "detalle-partido", options: { eventoId } };
    }
    if (path === "/partidos") {
        return {
            view: "partidos",
            options: { tab: params.get("tab") || "mios" },
        };
    }
    if (path === "/amigos") {
        return { view: "amigos", options: {} };
    }
    if (path === "/equipos") {
        return {
            view: "equipos",
            options: { tab: params.get("tab") || "mios" },
        };
    }
    if (path === "/crear-equipo") {
        return { view: "crear-equipo", options: {} };
    }
    if (path.startsWith("/equipos/") && path.endsWith("/editar")) {
        const equipoId = decodeURIComponent(
            path.slice("/equipos/".length, -"/editar".length),
        );
        return { view: "editar-equipo", options: { equipoId } };
    }
    if (path.startsWith("/equipos/")) {
        const equipoId = decodeURIComponent(path.slice("/equipos/".length));
        return { view: "detalle-equipo", options: { equipoId } };
    }
    return { view: "home", options: {} };
}

// 2. Construye la URL del navegador
export function construirUrl(view, options = {}) {
    switch (view) {
        case "welcome":
            return "/welcome";
        case "login":
            return "/login";
        case "register":
            return "/register";
        case "home":
            return "/home";
        case "crear-partido":
            return "/crear-partido";
        case "editar-partido":
            return options.eventoId
                ? `/partidos/${encodeURIComponent(options.eventoId)}/editar`
                : "/partidos";
        case "detalle-partido":
            return options.eventoId
                ? `/partidos/${encodeURIComponent(options.eventoId)}`
                : "/partidos";
        case "partidos": {
            const tab =
                options.tab && options.tab !== "mios" ? `?tab=${options.tab}` : "";
            return `/partidos${tab}`;
        }
        case "amigos":
            return "/amigos";
        case "equipos": {
            const tab =
                options.tab && options.tab !== "mios" ? `?tab=${options.tab}` : "";
            return `/equipos${tab}`;
        }
        case "crear-equipo":
            return "/crear-equipo";
        case "detalle-equipo":
            return options.equipoId
                ? `/equipos/${encodeURIComponent(options.equipoId)}`
                : "/equipos";
        case "editar-equipo":
            return options.equipoId
                ? `/equipos/${encodeURIComponent(options.equipoId)}/editar`
                : "/equipos";
        default:
            return "/home";
    }
}

// 3. Middleware de rutas en el cliente
function evaluarMiddleware(vistaSolicitada, opcionesSolicitadas = {}) {
    const logueado = tieneSesionActiva();
    const esPublica = VISTAS_PUBLICAS.includes(vistaSolicitada);

    // A) Si NO está logueado y es privada
    if (!logueado && !esPublica) {
        sessionStorage.setItem(
            "playtime_redirect",
            JSON.stringify({
                view: vistaSolicitada,
                options: opcionesSolicitadas,
            }),
        );
        return { view: "login", options: {}, redirigido: true };
    }

    // B) Si YA está logueado:
    if (logueado) {
        // Si había una ruta pendiente guardada antes del login, lo llevamos ahí
        const pendienteRaw = sessionStorage.getItem("playtime_redirect");
        if (pendienteRaw) {
            sessionStorage.removeItem("playtime_redirect");
            try {
                const destino = JSON.parse(pendienteRaw);
                if (destino?.view && !VISTAS_PUBLICAS.includes(destino.view)) {
                    return {
                        view: destino.view,
                        options: destino.options || {},
                        redirigido: true,
                    };
                }
            } catch {
            }
        }

        // Si YA está logueado e intenta ir una vista publica
        if (esPublica) {
            return { view: "home", options: {}, redirigido: true };
        }
    }

    return {
        view: vistaSolicitada,
        options: opcionesSolicitadas,
        redirigido: false,
    };
}

// 4. Función central de navegación
export function navigate(view, options = {}, reemplazarHistorial = false) {
    const decision = evaluarMiddleware(view, options);
    currentView = decision.view;
    navOptions = decision.options;

    const nuevaUrl = construirUrl(decision.view, decision.options);
    const urlActual = window.location.pathname + window.location.search;

    if (urlActual !== nuevaUrl) {
        if (reemplazarHistorial || decision.redirigido) {
            window.history.replaceState(
                { view: decision.view, options: decision.options },
                "",
                nuevaUrl,
            );
        } else {
            window.history.pushState(
                { view: decision.view, options: decision.options },
                "",
                nuevaUrl,
            );
        }
    }
}

// 5. Inicializador del listener del historial
export function inicializarRouter() {
    function sincronizarDesdeUrl() {
        const { view, options } = parsearUrlActual();
        navigate(view, options, true);
    }

    sincronizarDesdeUrl();
    window.addEventListener("popstate", sincronizarDesdeUrl);

    // R-27: Función de cleanup para remover el listener
    return () => {
        window.removeEventListener("popstate", sincronizarDesdeUrl);
    };
}

// 6. Objeto reactivo de solo lectura
export const router = {
    get view() {
        return currentView;
    },
    get options() {
        return navOptions;
    },
};