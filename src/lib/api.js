const API_BASE = "http://localhost:5254/api";

export function obtenerToken() {
    return (
        localStorage.getItem("playtime_token") ||
        sessionStorage.getItem("playtime_token") ||
        ""
    );
}

export function tieneSesionActiva() {
    const token = obtenerToken();
    if (!token) return false;

    try {
        // Un JWT tiene 3 partes separadas por punto: header.payload.signature
        const payloadBase64 = token.split(".")[1];
        if (!payloadBase64) return true;

        const payload = JSON.parse(atob(payloadBase64));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            // Si el token expiró, limpiamos el almacenamiento
            localStorage.removeItem("playtime_token");
            localStorage.removeItem("playtime_user");
            sessionStorage.removeItem("playtime_token");
            sessionStorage.removeItem("playtime_user");
            return false;
        }
        return true;
    } catch {
        return Boolean(token);
    }
}

export function obtenerUsuarioActual() {
    const raw =
        localStorage.getItem("playtime_user") ||
        sessionStorage.getItem("playtime_user");
    if (!raw) return { nombre: "Jugador", apellido: "", inicial: "J" };
    try {
        const u = JSON.parse(raw);
        const nombre = u.nombre || u.email?.split("@")[0] || "Jugador";
        return {
            ...u,
            nombre,
            inicial: nombre.charAt(0).toUpperCase(),
        };
    } catch {
        return { nombre: "Jugador", apellido: "", inicial: "J" };
    }
}

async function peticion(ruta, opciones = {}) {
    const token = obtenerToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opciones.headers || {}),
    };

    const res = await fetch(`${API_BASE}${ruta}`, {
        ...opciones,
        headers,
    });

    const json = await res.json().catch((err) => {
        if (err?.name === "AbortError" || opciones.signal?.aborted) {
            throw err;
        }
        return null;
    });

    if (opciones.signal?.aborted) {
        throw new DOMException("Petición cancelada", "AbortError");
    }

    if (!res.ok || (json && json.success === false)) {
        const msg =
            json?.message ||
            (Array.isArray(json?.errors) ? json.errors.join(", ") : null) ||
            `Error HTTP ${res.status}`;
        throw new Error(msg);
    }

    return json ?? { success: true, data: null };
}

// ==================== API DE EVENTOS SOCIALES ====================
export const eventosApi = {
    listarPublicos: (deporte = "", signal) => {
        const q = deporte ? `?deporte=${encodeURIComponent(deporte)}` : "";
        return peticion(`/eventos/publicos${q}`, { signal });
    },
    listarMios: (signal) => peticion("/eventos/mios", { signal }),
    listarInvitaciones: (signal) => peticion("/eventos/invitaciones", { signal }),
    obtenerDetalle: (id, signal) => peticion(`/eventos/${id}`, { signal }),
    crear: (dto) =>
        peticion("/eventos", {
            method: "POST",
            body: JSON.stringify(dto),
        }),
    actualizar: (id, dto) =>
        peticion(`/eventos/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        }),
    cancelar: (id) =>
        peticion(`/eventos/${id}`, {
            method: "DELETE",
        }),
    unirsePublico: (id) =>
        peticion(`/eventos/${id}/unirse`, {
            method: "POST",
        }),
    responderInvitacion: (id, aceptar) =>
        peticion(`/eventos/${id}/respuesta`, {
            method: "POST",
            body: JSON.stringify({ aceptar }),
        }),
    invitarJugador: (id, payload) =>
        peticion(`/eventos/${id}/invitaciones`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    resolverSolicitud: (id, solicitanteUid, aceptar) =>
        peticion(`/eventos/${id}/solicitudes/${solicitanteUid}`, {
            method: "POST",
            body: JSON.stringify({ aceptar }),
        }),
    cambiarCamiseta: (id, jugadorUid, camiseta) =>
        peticion(`/eventos/${id}/participantes/${jugadorUid}/camiseta`, {
            method: "PUT",
            body: JSON.stringify({ camiseta }),
        }),
    expulsarJugador: (id, jugadorUid) =>
        peticion(`/eventos/${id}/participantes/${jugadorUid}`, {
            method: "DELETE",
        }),
    abandonar: (id) =>
        peticion(`/eventos/${id}/participantes/yo`, {
            method: "DELETE",
        }),
    // Bolsa de Jugadores Disponibles
    obtenerMiDisponibilidad: (signal) =>
        peticion("/eventos/mi-disponibilidad", { signal }),
    actualizarMiDisponibilidad: (dto) =>
        peticion("/eventos/mi-disponibilidad", {
            method: "PUT",
            body: JSON.stringify(dto),
        }),
    listarJugadoresDisponibles: (deporte = "", signal) => {
        const q = deporte ? `?deporte=${encodeURIComponent(deporte)}` : "";
        return peticion(`/eventos/jugadores-disponibles${q}`, { signal });
    },
};

// ==================== API DE AMISTADES ====================
export const amistadesApi = {
    listarAmigos: (signal) => peticion("/amistades", { signal }),
    listarPendientes: (signal) => peticion("/amistades/pendientes", { signal }),
    buscarUsuarios: (q) =>
        peticion(`/amistades/buscar?q=${encodeURIComponent(q)}`),
    enviarSolicitud: (payload) =>
        peticion("/amistades/solicitar", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    responderSolicitud: (amistadId, aceptar) =>
        peticion(`/amistades/${amistadId}/responder`, {
            method: "POST",
            body: JSON.stringify({ aceptar }),
        }),
    eliminar: (otroUid) =>
        peticion(`/amistades/${otroUid}`, {
            method: "DELETE",
        }),
};
// ==================== API DE EQUIPOS Y DESAFÍOS ====================
export const equiposApi = {
    crear: (dto) =>
        peticion("/equipos", {
            method: "POST",
            body: JSON.stringify(dto),
        }),
    listarMios: (signal) => peticion("/equipos/mios", { signal }),
    listarRivales: (deporte = "", signal) => {
        const q = deporte ? `?deporte=${encodeURIComponent(deporte)}` : "";
        return peticion(`/equipos/rivales${q}`, { signal });
    },
    actualizarDisponibilidad: (equipoId, dto) =>
        peticion(`/equipos/${equipoId}/disponibilidad`, {
            method: "PUT",
            body: JSON.stringify(dto),
        }),
    agregarMiembro: (equipoId, payload) =>
        peticion(`/equipos/${equipoId}/miembros`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    quitarMiembro: (equipoId, jugadorUid) =>
        peticion(`/equipos/${equipoId}/miembros/${jugadorUid}`, {
            method: "DELETE",
        }),
    enviarDesafio: (dto) =>
        peticion("/equipos/desafios", {
            method: "POST",
            body: JSON.stringify(dto),
        }),
    listarDesafios: (signal) => peticion("/equipos/desafios", { signal }),
    responderDesafio: (desafioId, aceptar) =>
        peticion(`/equipos/desafios/${desafioId}/responder`, {
            method: "POST",
            body: JSON.stringify({ aceptar }),
        }),
};