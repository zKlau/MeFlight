export const buildEndpoint = (endpoint: string) => {
    return `${import.meta.env.VITE_ENDPOINT_URL}/${endpoint}` ;
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
