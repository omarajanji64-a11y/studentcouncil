export type User = {
  uid: string;
  name: string;
  email: string;
  role: 'member' | 'supervisor' | 'admin';
  gender?: "male" | "female";
  avatar?: string;
  notificationsEnabled?: boolean;
  canEditSchedule?: boolean;
  lastNotificationReadAt?: number;
  mustChangePassword?: boolean;
};

export type Break = {
  id: string;
  name: string;
  startTime: number; // Daily schedule time stored as a timestamp
  endTime: number; // Daily schedule time stored as a timestamp
};

export type Pass = {
  id: string;
  studentName: string;
  studentGender?: "male" | "female" | "mixed";
  studentGrade?: string;
  permissionLocation?: string;
  reason: string;
  issuedBy: string;
  issuedById?: string;
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  status: 'active' | 'expired' | 'revoked';
  passType?: 'active_break' | 'time_specified' | 'override' | 'permanent';
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
  targetName?: string;
  targetNameLower?: string;
  targetType?: "student" | "group";
  groupName?: string;
  targetGender?: "male" | "female" | "mixed";
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
