import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // allow HttpOnly cookies to be sent
});

export async function fetchCurrentUser() {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch (err) {
    return null;
  }
}