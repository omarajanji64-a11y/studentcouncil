export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'member' | 'supervisor';
  avatar?: string;
  notificationsEnabled?: boolean;
};

export type Break = {
  id: string;
  name: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
};

export type Pass = {
  id: string;
  studentName: string;
  reason: string;
  issuedBy: string;
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  status: 'active' | 'expired' | 'revoked';
};

export type Log = Pass;

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: number; // Unix timestamp
  senderId?: string;
  senderName?: string;
  senderRole?: string;
};
