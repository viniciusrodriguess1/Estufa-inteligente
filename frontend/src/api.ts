// Configuração centralizada da API da Estufa Inteligente
// Suporta resolução de host dinâmica para testes em rede local (ex: acesso via dispositivos móveis)

const hostname = window.location.hostname;

export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${hostname}:8000`;
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || `ws://${hostname}:8000`;
