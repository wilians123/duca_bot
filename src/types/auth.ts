export type UserRole = "admin" | "user";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
