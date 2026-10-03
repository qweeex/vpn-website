// Read contracts from webapibackend/src and prisma/schema.prisma.
// Swagger describes input DTOs but does not provide full response schemas.
export interface Tariff {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  profileLimit: number;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export interface Subscription {
  id: string;
  userId: string;
  tariffId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startedAt: string;
  expiresAt: string;
  tariffName: string;
  price: number;
  currency: string;
  durationDays: number;
  profileLimit: number;
}
export type ProfileStatus = 'CREATING' | 'ACTIVE' | 'REVOKING' | 'REVOKED' | 'FAILED';
// Public projection of backend VpnProfile: no clientName or internal errors.
export interface Profile {
  id: string;
  nodeId: string;
  deviceName: string;
  status: ProfileStatus;
  needsReconcile: boolean;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}
export interface Location {
  id: string;
  countryCode: string;
  countryName: string;
  city: string;
}
export interface Session {
  authenticated: boolean;
  email?: string;
}
export interface CreateProfile {
  nodeId: string;
  deviceName: string;
}
