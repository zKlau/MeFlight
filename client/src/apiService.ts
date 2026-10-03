export const buildEndpoint = (endpoint: string) => {
    return `${import.meta.env.VITE_ENDPOINT_URL}/${endpoint}` ;
}