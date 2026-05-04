import toast from 'react-hot-toast';

export const handleApiError = (error, fallbackMessage = 'Something went wrong') => {
  const message = error?.response?.data?.message
    || error?.response?.data?.title
    || error?.message
    || fallbackMessage;
  if (error?.message === 'Network Error' || !error?.response) {
    toast.error('Network Error: Cannot reach backend at http://127.0.0.1:5000. Please ensure the backend is running.');
  } else {
    toast.error(message);
  }
  // Keep console output for debugging context in dev mode.
  console.error('[API Error]', error);
};
