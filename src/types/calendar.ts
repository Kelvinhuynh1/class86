export interface TimeSlot {
  start: string; // Format: "HH:MM"
  end: string; // Format: "HH:MM"
}

export interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  timeSlot: TimeSlot;
  subject: string;
  teacher?: string;
  room?: string;
  color?: string;
}

export interface Break {
  id: string;
  name: string;
  timeSlot: TimeSlot;
}

export interface TimetableDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  slots: TimetableSlot[];
}

export interface Timetable {
  days: TimetableDay[];
  breaks: Break[];
}
