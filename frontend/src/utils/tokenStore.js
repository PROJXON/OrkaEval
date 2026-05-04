// Uses sessionStorage for XSS mitigation (clears on tab close)
// For maximum security this should use httpOnly cookies set by the server,
// but sessionStorage is a significant improvement over localStorage.
const KEY = 'orkaeval_token';

export const saveToken = (token) => sessionStorage.setItem(KEY, token);
export const getToken = () => sessionStorage.getItem(KEY);
export const clearToken = () => sessionStorage.removeItem(KEY);
