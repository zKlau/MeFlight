export const buildEndpoint = (endpoint: string) => {
    return `${import.meta.env.VITE_ENDPOINT_URL}/${endpoint}` ;
}

export const fetchJson = async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(buildEndpoint(endpoint));

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
