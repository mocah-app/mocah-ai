



// Helper to convert string dates to Date objects
export const convertDates = (data: any): any => {
  if (!data) return data;
  if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}T/.test(data)) {
    return new Date(data);
  }
  if (Array.isArray(data)) {
    return data.map(convertDates);
  }
  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      result[key] = convertDates(data[key]);
    }
    return result;
  }
  return data;
};
