const API_BASE = "http://localhost:5254/api";

export function obtenerToken() {
    return (
        localStorage.getItem("playtime_token") ||
        sessionStorage.getItem("playtime_token") ||
        ""
    );
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

    const json = await res.json().catch(() => null);

    if (!res.ok || (json && json.success === false)) {
        const msg =
            json?.message ||
            (Array.isArray(json?.errors) ? json.errors.join(", ") : null) ||
            `Error HTTP ${res.status}`;
        throw new Error(msg);
    }

    return json;
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
    cancelar: (id) =>
        peticion(`/eventos/${id}/cancelar`, {
            method: "POST",
        }),
    unirsePublico: (id) =>
        peticion(`/eventos/${id}/unirse`, {
            method: "POST",
        }),
    responderInvitacion: (id, aceptar) =>
        peticion(`/eventos/${id}/invitaciones/responder`, {
            method: "POST",
            body: JSON.stringify({ aceptar }),
        }),
    invitarJugador: (id, payload) =>
        peticion(`/eventos/${id}/invitar`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    resolverSolicitud: (id, solicitanteUid, aceptar) =>
        peticion(`/eventos/${id}/solicitudes/${solicitanteUid}/resolver`, {
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
        peticion(`/eventos/${id}/mi-participacion`, {
            method: "DELETE",
        }),
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