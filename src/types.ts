export type UserRole = 'user' | 'admin';
export type UserStatus = 'online' | 'offline' | 'suspended';
export type Gender = 'man' | 'woman' | 'lesbian' | 'gay' | 'bisexual' | 'trans' | 'nonbinary' | 'other';
export type LookingFor = 'man' | 'woman' | 'lesbian' | 'gay' | 'bisexual' | 'trans' | 'nonbinary' | 'everyone';

export interface UserPhoto {
  id: string;
  userId: string;
  url: string;
  position: number;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  age: number;
  bio: string;
  location: string;
  gender: Gender;
  lookingFor: LookingFor;
  avatar: string;
  photos: string[];
  interests: string[];
  occupation?: string;
  role: UserRole;
  status: UserStatus;
  lastSeen: string;
  createdAt: string;
  distanceKm?: number;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'like' | 'pass' | 'superlike';
  createdAt: string;
}

export interface Match {
  id: string;
  userA: string;
  userB: string;
  createdAt: string;
  otherUser?: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Conversation {
  id: string;
  createdAt: string;
  participantIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'system';
  title: string;
  content: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  createdAt: string;
  reporterName?: string;
  reportedName?: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  target: string;
  details?: string;
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalMatches: number;
  totalMessages: number;
  totalReports: number;
  pendingReports: number;
}

export interface RedTeamTestResult {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'passed' | 'vulnerable' | 'fixed';
  payloadTested: string;
  remediation: string;
  details?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
