export async function parseJsonResponse(response, invalidResponseMessage) {
  const responseText = await response.text();

  try {
    const data = JSON.parse(responseText);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(invalidResponseMessage);
    }
    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(invalidResponseMessage);
    }
    throw error;
  }
}