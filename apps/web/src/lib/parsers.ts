export const parseSearchParams = (params: Record<string, string>[]): string => {
  const searchParams = new URLSearchParams();

  params.forEach((paramObj) => {
    Object.entries(paramObj).forEach(([key, value]) => {
      if (value != undefined && value != null && value != "") {
        searchParams.append(key, value);
      }
    });
  });

  return searchParams.toString();
};
