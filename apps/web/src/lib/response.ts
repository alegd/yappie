export const parseResponse = async (response: Response) => {
  const data = await response.text();

  if (data.length > 0) {
    const jsonObj = JSON.parse(data);
    return jsonObj;
  } else {
    return null;
  }
};
