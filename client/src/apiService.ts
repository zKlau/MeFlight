declare global {
    interface Window {
        MEFLIGHT_CONFIG?: { apiUrl?: string };
    }
}

const apiBaseUrl = () => {
    const runtimeConfig = window.MEFLIGHT_CONFIG;

    if (runtimeConfig && runtimeConfig.apiUrl) {
        return runtimeConfig.apiUrl;
    }

    return import.meta.env.VITE_ENDPOINT_URL;
}

export const buildEndpoint = (endpoint: string) => {
    return `${apiBaseUrl()}/${endpoint}` ;
}

const NOT_FOUND = 404;

export const fetchJson = async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildEndpoint(endpoint));

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const fetchOptionalJson = async <T>(endpoint: string): Promise<T | null> => {
    const response = await fetch(buildEndpoint(endpoint));

    if (response.status === NOT_FOUND) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
