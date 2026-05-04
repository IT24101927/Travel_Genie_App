export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const errMessages = error.response.data.errors.map(e => e.msg).join(', ');
    if (errMessages) return `Validation error: ${errMessages}`;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};
