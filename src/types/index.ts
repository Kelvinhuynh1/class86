export type UserRole = "Student" | "Leader" | "Co-Leader" | "Admin";

export interface User {
  id: string;
  displayName: string;
  role: UserRole;
  classCode: string;
  password?: string;
}

export interface Subject {
  name: string;
  color?: string;
  notes?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  subject: Subject | null;
  isBreak?: boolean;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface Note {
  id: string;
  content: string;
  date: string;
  createdBy: string;
}

export interface StudyLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  addedBy: string;
  addedAt: string;
}

export interface StudyFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  subject?: string;
  assignedTo?: string[];
  completed: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
  notes?: string;
  subjects?: string[];
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  attachments?: {
    type: "image" | "file";
    url: string;
    name: string;
    size?: number;
  }[];
}

export interface Question {
  id: string;
  question: string;
  type: "multiple-choice" | "open-ended";
  options?: string[];
  correctAnswer?: string | number;
  createdBy: string;
  subject?: string;
}

export interface HappyTimeTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  startDate: string;
  expiryDate: string;
  completed: boolean;
}

export interface ImportantResource {
  id: string;
  title: string;
  type: "link" | "file" | "image";
  url?: string;
  fileUrl?: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
}
