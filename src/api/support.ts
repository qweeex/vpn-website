import { request } from './client';
export interface TicketAccess {
  id: string;
  accessKey: string;
}
export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'answered';
  createdAt: string;
  messages: { role: 'customer' | 'support'; body: string; createdAt: string }[];
}
export const supportApi = {
  create: (data: { email: string; subject: string; message: string; privacyAccepted: boolean }) =>
    request<TicketAccess>('/support/create', { method: 'POST', body: JSON.stringify(data) }),
  read: (access: TicketAccess) =>
    request<SupportTicket>('/support/read', { method: 'POST', body: JSON.stringify(access) }),
  message: (data: TicketAccess & { message: string }) =>
    request<SupportTicket>('/support/message', { method: 'POST', body: JSON.stringify(data) }),
};
