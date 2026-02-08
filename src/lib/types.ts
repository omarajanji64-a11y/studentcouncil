export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'member' | 'supervisor' | 'admin';
  avatar?: string;
  notificationsEnabled?: boolean;
  canEditSchedule?: boolean;
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
  studentId?: string;
  reason: string;
  issuedBy: string;
  issuedById?: string;
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  status: 'active' | 'expired' | 'revoked';
  passType?: 'active_break' | 'time_specified' | 'community' | 'override';
  durationMinutes?: number;
  override?: boolean;
};

export type Log = {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
};

export type Duty = {
  id: string;
  title: string;
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  memberIds: string[];
  memberNames?: string[];
  breakId?: string;
  location?: string;
};

export type Complaint = {
  id: string;
  studentId: string;
  studentName?: string;
  dutyId?: string | null;
  dutyLocation?: string | null;
  title: string;
  description: string;
  timestamp: number; // Unix timestamp
  status: "Open" | "In Progress" | "Resolved";
  handledBy?: string;
  handledById?: string;
  notes?: string;
  attachments?: {
    url: string;
    path: string;
    uploadedBy: string;
    createdAt: number;
    contentType?: string;
    size?: number;
  }[];
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: number; // Unix timestamp
  senderId?: string;
  senderName?: string;
  senderRole?: string;
};
