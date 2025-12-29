export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  branchId?: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  branchId?: string | null;
  branchName?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
