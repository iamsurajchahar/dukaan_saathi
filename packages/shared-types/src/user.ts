export type UserRole = 'owner' | 'manager' | 'staff';

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  activeStoreId?: string;
  stores: { storeId: string; role: UserRole }[];
  subscriptionId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}
