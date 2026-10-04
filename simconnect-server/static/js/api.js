const NO_CONTENT = 204;

const errorMessage = async (response) => {
  const body = await response.json().catch(() => ({}));

  if (body.detail) {
    return String(body.detail);
  }

  return `${response.status} ${response.statusText}`;
};

export const request = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }

  if (response.status === NO_CONTENT) {
    return null;
  }

  return response.json();
};

export const postJson = (url, body) =>
  request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
