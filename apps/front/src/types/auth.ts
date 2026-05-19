export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
