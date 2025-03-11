import { useState, useEffect, useRef } from "react";
import { format, parseISO, isWithinInterval, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TimetableSlot, Break, Timetable } from "@/types/calendar";

export default function TimetableView() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("week");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSubject, setCurrentSubject] = useState<TimetableSlot | null>(
    null,
  );
  const [nextSubject, setNextSubject] = useState<TimetableSlot | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTimetable();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      updateCurrentSubject(now);
      updateProgressLine(now);
    }, 60000); // Update every minute

    // Initial update
    updateCurrentSubject(new Date());
    updateProgressLine(new Date());

    return () => clearInterval(timer);
  }, []);

  // Update current subject whenever timetable or time changes
  useEffect(() => {
    if (timetable) {
      updateCurrentSubject(currentTime);
      updateProgressLine(currentTime);
    }
  }, [timetable, currentTime]);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      // Fetch timetable slots from Supabase
      const { data: slotsData, error: slotsError } = await supabase
        .from("timetable_slots")
        .select("*");

      // Fetch breaks from Supabase
      const { data: breaksData, error: breaksError } = await supabase
        .from("breaks")
        .select("*");

      if (slotsError) throw slotsError;
      if (breaksError) throw breaksError;

      // If no data in Supabase yet, use demo data
      const slots = slotsData?.length ? slotsData : demoTimetableSlots;
      const breaks = breaksData?.length ? breaksData : demoBreaks;

      // Transform data to match our types
      const transformedSlots: TimetableSlot[] = slots.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        timeSlot: {
          start: slot.start_time,
          end: slot.end_time,
        },
        subject: slot.subject,
        teacher: slot.teacher || undefined,
        room: slot.room || undefined,
        color: slot.color || undefined,
      }));

      // Transform breaks data
      const transformedBreaks: Break[] = breaks.map((breakItem: any) => ({
        id: breakItem.id,
        name: breakItem.name,
        timeSlot: {
          start: breakItem.start_time,
          end: breakItem.end_time,
        },
      }));

      // Organize slots by day
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
        (day) => ({
          day: day as
            | "Monday"
            | "Tuesday"
            | "Wednesday"
            | "Thursday"
            | "Friday",
          slots: transformedSlots.filter((slot) => slot.day === day),
        }),
      );

      setTimetable({ days, breaks: transformedBreaks });
    } catch (error) {
      console.error("Error fetching timetable:", error);
      // Use demo data as fallback
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
        (day) => ({
          day: day as
            | "Monday"
            | "Tuesday"
            | "Wednesday"
            | "Thursday"
            | "Friday",
          slots: demoTimetableSlots.filter((slot) => slot.day === day),
        }),
      );
      setTimetable({ days, breaks: demoBreaks });
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentSubject = (now: Date) => {
    if (!timetable) return;

    const dayOfWeek = now.getDay();
    // If weekend, no current subject
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setCurrentSubject(null);
      setNextSubject(null);
      return;
    }

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDay = days[dayOfWeek] as
      | "Monday"
      | "Tuesday"
      | "Wednesday"
      | "Thursday"
      | "Friday";

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Get all slots for the current day
    const daySlots =
      timetable.days.find((d) => d.day === currentDay)?.slots || [];

    // Sort slots by start time
    const sortedSlots = [...daySlots].sort((a, b) => {
      const aStart = timeToMinutes(a.timeSlot.start);
      const bStart = timeToMinutes(b.timeSlot.start);
      return aStart - bStart;
    });

    // Find current and next subject
    let current = null;
    let next = null;

    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startMinutes = timeToMinutes(slot.timeSlot.start);
      const endMinutes = timeToMinutes(slot.timeSlot.end);

      if (
        currentTimeMinutes >= startMinutes &&
        currentTimeMinutes < endMinutes
      ) {
        current = slot;
        next = sortedSlots[i + 1] || null;
        break;
      } else if (currentTimeMinutes < startMinutes) {
        next = slot;
        break;
      }
    }

    // If no next subject in current day, look for first subject in next day
    if (!next && current) {
      const nextDayIndex = (dayOfWeek + 1) % 7;
      // Skip to Monday if it's Friday
      const nextDay =
        nextDayIndex === 0 || nextDayIndex === 6
          ? "Monday"
          : (days[nextDayIndex] as
              | "Monday"
              | "Tuesday"
              | "Wednesday"
              | "Thursday"
              | "Friday");

      const nextDaySlots =
        timetable.days.find((d) => d.day === nextDay)?.slots || [];
      const sortedNextDaySlots = [...nextDaySlots].sort((a, b) => {
        const aStart = timeToMinutes(a.timeSlot.start);
        const bStart = timeToMinutes(b.timeSlot.start);
        return aStart - bStart;
      });

      if (sortedNextDaySlots.length > 0) {
        next = sortedNextDaySlots[0];
      }
    }

    setCurrentSubject(current);
    setNextSubject(next);
  };

  const updateProgressLine = (now: Date) => {
    if (!currentSubject || !progressRef.current) return;

    const startMinutes = timeToMinutes(currentSubject.timeSlot.start);
    const endMinutes = timeToMinutes(currentSubject.timeSlot.end);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Calculate progress percentage
    const totalDuration = endMinutes - startMinutes;
    const elapsed = currentTimeMinutes - startMinutes;
    const progressPercentage = Math.min(
      Math.max((elapsed / totalDuration) * 100, 0),
      100,
    );

    // Update progress line width
    progressRef.current.style.width = `${progressPercentage}%`;
  };

  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCurrentDay = () => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[currentTime.getDay()];
  };

  const isCurrentTimeSlot = (slot: TimetableSlot) => {
    if (!currentSubject) return false;
    return slot.id === currentSubject.id;
  };

  const getSubjectColor = (subject: string) => {
    // Map subjects to colors
    const colorMap: Record<string, string> = {
      Toán: "bg-blue-50 border-blue-200",
      "CĐBS Toán": "bg-blue-50 border-blue-200",
      "Khoa học": "bg-green-50 border-green-200",
      "CDBS KHTN": "bg-green-50 border-green-200",
      "Tiếng Anh": "bg-yellow-50 border-yellow-200",
      "Ngữ văn": "bg-yellow-50 border-yellow-200",
      "Lịch sử": "bg-purple-50 border-purple-200",
      "Địa lý": "bg-indigo-50 border-indigo-200",
      "Lịch sử/Địa lý": "bg-purple-50 border-purple-200",
      "Mĩ thuật": "bg-pink-50 border-pink-200",
      "Thể dục": "bg-orange-50 border-orange-200",
      "Tiếng Pháp": "bg-red-50 border-red-200",
      "Khoa học máy tính": "bg-cyan-50 border-cyan-200",
      "Công nghệ": "bg-cyan-50 border-cyan-200",
      "Âm nhạc": "bg-fuchsia-50 border-fuchsia-200",
      "Viễn cảnh toàn cầu": "bg-violet-50 border-violet-200",
      GDCD: "bg-violet-50 border-violet-200",
      GDĐP: "bg-amber-50 border-amber-200",
      HĐTNHN: "bg-emerald-50 border-emerald-200",
      "Well-being": "bg-rose-50 border-rose-200",
      SHCN: "bg-slate-50 border-slate-200",
    };

    return colorMap[subject] || "bg-gray-50 border-gray-200";
  };

  const getBreakRow = (breakItem: Break) => {
    return (
      <tr key={breakItem.id}>
        <td className="border p-2 font-medium">
          {breakItem.timeSlot.start} - {breakItem.timeSlot.end}
        </td>
        <td
          className="border p-2 bg-gray-50 text-center text-muted-foreground"
          colSpan={5}
        >
          {breakItem.name}
        </td>
      </tr>
    );
  };

  const getTimeSlotRow = (timeStart: string, timeEnd: string) => {
    if (!timetable) return null;

    return (
      <tr key={`${timeStart}-${timeEnd}`}>
        <td className="border p-2 font-medium">
          {timeStart} - {timeEnd}
        </td>
        {timetable.days.map((day) => {
          const slot = day.slots.find(
            (s) => s.timeSlot.start === timeStart && s.timeSlot.end === timeEnd,
          );

          if (!slot) return <td key={day.day} className="border p-2"></td>;

          const isCurrentSlot = isCurrentTimeSlot(slot);
          const colorClass = getSubjectColor(slot.subject);

          return (
            <td key={day.day} className={`border p-2 ${colorClass} relative`}>
              <div className="font-medium">{slot.subject}</div>
              {slot.teacher && (
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <User className="h-3 w-3 mr-1" /> {slot.teacher}
                </div>
              )}
              {slot.room && (
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" /> {slot.room}
                </div>
              )}
              {isCurrentSlot && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-primary"
                  ref={progressRef}
                ></div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  const getAllTimeSlots = () => {
    if (!timetable) return [];

    // Get all unique time slots
    const allSlots = timetable.days.flatMap((day) => day.slots);
    const allBreaks = timetable.breaks;

    // Combine slots and breaks and sort by start time
    const allTimeRanges = [
      ...allSlots.map((slot) => ({
        start: slot.timeSlot.start,
        end: slot.timeSlot.end,
        isBreak: false,
        breakData: null as Break | null,
      })),
      ...allBreaks.map((breakItem) => ({
        start: breakItem.timeSlot.start,
        end: breakItem.timeSlot.end,
        isBreak: true,
        breakData: breakItem,
      })),
    ];

    // Remove duplicates and sort
    const uniqueTimeRanges = allTimeRanges
      .filter(
        (range, index, self) =>
          index ===
          self.findIndex((r) => r.start === range.start && r.end === range.end),
      )
      .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

    return uniqueTimeRanges;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Class Timetable</span>
          <span className="text-sm font-normal text-muted-foreground">
            {format(currentTime, "EEEE, MMMM d, yyyy • h:mm a")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{getCurrentDay()}</h2>
          </div>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        {currentSubject && (
          <div className="mb-4 p-3 rounded-md bg-primary/10 border border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Class
                </div>
                <div className="font-medium text-lg">
                  {currentSubject.subject}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {currentSubject.timeSlot.start} -{" "}
                  {currentSubject.timeSlot.end}
                </div>
                {currentSubject.room && (
                  <div className="text-sm flex items-center justify-end mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {currentSubject.room}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!currentSubject && nextSubject && (
          <div className="mb-4 p-3 rounded-md bg-muted border">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Next Class</div>
                <div className="font-medium">{nextSubject.subject}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {nextSubject.timeSlot.start} - {nextSubject.timeSlot.end}
                </div>
                {nextSubject.room && (
                  <div className="text-sm flex items-center justify-end mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {nextSubject.room}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentSubject && nextSubject && (
          <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Next Class</div>
                <div className="font-medium text-lg">{nextSubject.subject}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {nextSubject.timeSlot.start} - {nextSubject.timeSlot.end}
                </div>
                {nextSubject.room && (
                  <div className="text-sm flex items-center justify-end mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {nextSubject.room}
                  </div>
                )}
                {nextSubject.teacher && (
                  <div className="text-sm flex items-center justify-end mt-1">
                    <User className="h-3 w-3 mr-1" /> {nextSubject.teacher}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!currentSubject && !nextSubject && (
          <div className="mb-4 p-3 rounded-md bg-muted border">
            <div className="text-center text-muted-foreground">
              Ended class today
            </div>
          </div>
        )}

        <Tabs
          defaultValue="week"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="day">Day View</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted">Time</th>
                    <th className="border p-2 bg-muted">Monday</th>
                    <th className="border p-2 bg-muted">Tuesday</th>
                    <th className="border p-2 bg-muted">Wednesday</th>
                    <th className="border p-2 bg-muted">Thursday</th>
                    <th className="border p-2 bg-muted">Friday</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllTimeSlots().map((timeRange) => {
                    if (timeRange.isBreak && timeRange.breakData) {
                      return getBreakRow(timeRange.breakData);
                    } else {
                      return getTimeSlotRow(timeRange.start, timeRange.end);
                    }
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="day" className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{getCurrentDay()}</h3>
                {currentSubject && (
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Current: {currentSubject.subject}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {timetable &&
                getCurrentDay() !== "Saturday" &&
                getCurrentDay() !== "Sunday" ? (
                  getAllTimeSlots().map((timeRange) => {
                    if (timeRange.isBreak && timeRange.breakData) {
                      // Render break
                      return (
                        <div
                          key={timeRange.breakData.id}
                          className="p-2 rounded-md bg-gray-50 border border-gray-100 text-center text-sm text-muted-foreground"
                        >
                          {timeRange.breakData.name} ({timeRange.start} -{" "}
                          {timeRange.end})
                        </div>
                      );
                    } else {
                      // Find the slot for the current day
                      const dayOfWeek = getCurrentDay() as
                        | "Monday"
                        | "Tuesday"
                        | "Wednesday"
                        | "Thursday"
                        | "Friday";
                      const daySlots =
                        timetable.days.find((d) => d.day === dayOfWeek)
                          ?.slots || [];
                      const slot = daySlots.find(
                        (s) =>
                          s.timeSlot.start === timeRange.start &&
                          s.timeSlot.end === timeRange.end,
                      );

                      if (!slot) return null;

                      const isCurrentSlot = isCurrentTimeSlot(slot);
                      const colorClass = getSubjectColor(slot.subject);

                      return (
                        <div
                          key={slot.id}
                          className={`p-3 rounded-md ${colorClass} border relative`}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium">{slot.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              {slot.timeSlot.start} - {slot.timeSlot.end}
                            </div>
                          </div>
                          {slot.teacher && (
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <User className="h-3 w-3 mr-1" /> {slot.teacher}
                            </div>
                          )}
                          {slot.room && (
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" /> {slot.room}
                            </div>
                          )}
                          {isCurrentSlot && (
                            <div
                              className="absolute bottom-0 left-0 h-1 bg-primary"
                              ref={progressRef}
                            ></div>
                          )}
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No classes scheduled for {getCurrentDay()}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Demo data for fallback when Supabase connection fails
const demoTimetableSlots: TimetableSlot[] = [
  // Monday
  {
    id: "1",
    day: "Monday",
    timeSlot: { start: "07:30", end: "08:15" },
    subject: "Tiếng Pháp",
    room: "Room 101",
  },
  {
    id: "2",
    day: "Monday",
    timeSlot: { start: "08:15", end: "09:00" },
    subject: "Tiếng Pháp",
    room: "Room 101",
  },
  {
    id: "3",
    day: "Monday",
    timeSlot: { start: "09:00", end: "09:45" },
    subject: "Thể dục",
    room: "Gym",
  },
  {
    id: "4",
    day: "Monday",
    timeSlot: { start: "10:00", end: "10:45" },
    subject: "Tiếng Anh",
    room: "Room 203",
  },
  {
    id: "5",
    day: "Monday",
    timeSlot: { start: "10:45", end: "11:30" },
    subject: "Tiếng Anh",
    room: "Room 203",
  },
  {
    id: "6",
    day: "Monday",
    timeSlot: { start: "13:00", end: "13:45" },
    subject: "Khoa học máy tính",
    room: "Lab 1",
  },
  {
    id: "7",
    day: "Monday",
    timeSlot: { start: "13:45", end: "14:30" },
    subject: "Khoa học máy tính",
    room: "Lab 1",
  },
  {
    id: "8",
    day: "Monday",
    timeSlot: { start: "15:00", end: "15:45" },
    subject: "Công nghệ",
    room: "Tech Room",
  },
  {
    id: "9",
    day: "Monday",
    timeSlot: { start: "15:45", end: "16:30" },
    subject: "Well-being",
    room: "Room 105",
  },

  // Tuesday
  {
    id: "10",
    day: "Tuesday",
    timeSlot: { start: "07:30", end: "08:15" },
    subject: "Âm nhạc",
    room: "Music Room",
  },
  {
    id: "11",
    day: "Tuesday",
    timeSlot: { start: "08:15", end: "09:00" },
    subject: "Âm nhạc",
    room: "Music Room",
  },
  {
    id: "12",
    day: "Tuesday",
    timeSlot: { start: "09:00", end: "09:45" },
    subject: "Khoa học",
    room: "Lab 2",
  },
  {
    id: "13",
    day: "Tuesday",
    timeSlot: { start: "10:00", end: "10:45" },
    subject: "Thể dục",
    room: "Gym",
  },
  {
    id: "14",
    day: "Tuesday",
    timeSlot: { start: "10:45", end: "11:30" },
    subject: "Thể dục",
    room: "Gym",
  },
  {
    id: "15",
    day: "Tuesday",
    timeSlot: { start: "13:00", end: "13:45" },
    subject: "Toán",
    room: "Room 301",
  },
  {
    id: "16",
    day: "Tuesday",
    timeSlot: { start: "13:45", end: "14:30" },
    subject: "GDĐP",
    room: "Room 102",
  },
  {
    id: "17",
    day: "Tuesday",
    timeSlot: { start: "15:00", end: "15:45" },
    subject: "Tiếng Anh",
    room: "Room 203",
  },
  {
    id: "18",
    day: "Tuesday",
    timeSlot: { start: "15:45", end: "16:30" },
    subject: "Tiếng Anh",
    room: "Room 203",
  },

  // Wednesday
  {
    id: "19",
    day: "Wednesday",
    timeSlot: { start: "07:30", end: "08:15" },
    subject: "Viễn cảnh toàn cầu",
    room: "Room 205",
  },
  {
    id: "20",
    day: "Wednesday",
    timeSlot: { start: "08:15", end: "09:00" },
    subject: "Viễn cảnh toàn cầu",
    room: "Room 205",
  },
  {
    id: "21",
    day: "Wednesday",
    timeSlot: { start: "09:00", end: "09:45" },
    subject: "Tiếng Pháp",
    room: "Room 101",
  },
  {
    id: "22",
    day: "Wednesday",
    timeSlot: { start: "10:00", end: "10:45" },
    subject: "Toán",
    room: "Room 301",
  },
  {
    id: "23",
    day: "Wednesday",
    timeSlot: { start: "10:45", end: "11:30" },
    subject: "Toán",
    room: "Room 301",
  },
  {
    id: "24",
    day: "Wednesday",
    timeSlot: { start: "13:00", end: "13:45" },
    subject: "Mĩ thuật",
    room: "Art Studio",
  },
  {
    id: "25",
    day: "Wednesday",
    timeSlot: { start: "13:45", end: "14:30" },
    subject: "GDCD",
    room: "Room 104",
  },
  {
    id: "26",
    day: "Wednesday",
    timeSlot: { start: "15:00", end: "15:45" },
    subject: "Địa lý",
    room: "Room 202",
  },
  {
    id: "27",
    day: "Wednesday",
    timeSlot: { start: "15:45", end: "16:30" },
    subject: "Lịch sử",
    room: "Room 204",
  },

  // Thursday
  {
    id: "28",
    day: "Thursday",
    timeSlot: { start: "07:30", end: "08:15" },
    subject: "Tiếng Anh",
    room: "Room 203",
  },
  {
    id: "29",
    day: "Thursday",
    timeSlot: { start: "08:15", end: "09:00" },
    subject: "Lịch sử/Địa lý",
    room: "Room 204",
    teacher: "Chẵn/Lẻ",
  },
  {
    id: "30",
    day: "Thursday",
    timeSlot: { start: "09:00", end: "09:45" },
    subject: "Lịch sử/Địa lý",
    room: "Room 202",
    teacher: "Chẵn/Lẻ",
  },
  {
    id: "31",
    day: "Thursday",
    timeSlot: { start: "10:00", end: "10:45" },
    subject: "Ngữ văn",
    room: "Room 206",
  },
  {
    id: "32",
    day: "Thursday",
    timeSlot: { start: "10:45", end: "11:30" },
    subject: "Ngữ văn",
    room: "Room 206",
  },
  {
    id: "33",
    day: "Thursday",
    timeSlot: { start: "13:00", end: "13:45" },
    subject: "Khoa học",
    room: "Lab 2",
  },
  {
    id: "34",
    day: "Thursday",
    timeSlot: { start: "13:45", end: "14:30" },
    subject: "Khoa học",
    room: "Lab 2",
  },
  {
    id: "35",
    day: "Thursday",
    timeSlot: { start: "15:00", end: "15:45" },
    subject: "CĐBS Toán",
    room: "Room 302",
  },
  {
    id: "36",
    day: "Thursday",
    timeSlot: { start: "15:45", end: "16:30" },
    subject: "HĐTNHN",
    room: "Room 103",
  },

  // Friday
  {
    id: "37",
    day: "Friday",
    timeSlot: { start: "07:30", end: "08:15" },
    subject: "CDBS KHTN",
    room: "Lab 3",
  },
  {
    id: "38",
    day: "Friday",
    timeSlot: { start: "08:15", end: "09:00" },
    subject: "Ngữ văn",
    room: "Room 206",
  },
  {
    id: "39",
    day: "Friday",
    timeSlot: { start: "09:00", end: "09:45" },
    subject: "Ngữ văn",
    room: "Room 206",
  },
  {
    id: "40",
    day: "Friday",
    timeSlot: { start: "10:00", end: "10:45" },
    subject: "HĐTNHN",
    room: "Room 103",
  },
  {
    id: "41",
    day: "Friday",
    timeSlot: { start: "10:45", end: "11:30" },
    subject: "SHCN",
    room: "Room 100",
  },
  {
    id: "42",
    day: "Friday",
    timeSlot: { start: "13:00", end: "13:45" },
    subject: "Khoa học",
    room: "Lab 2",
  },
  {
    id: "43",
    day: "Friday",
    timeSlot: { start: "13:45", end: "14:30" },
    subject: "Khoa học",
    room: "Lab 2",
  },
  {
    id: "44",
    day: "Friday",
    timeSlot: { start: "15:00", end: "15:45" },
    subject: "Toán",
    room: "Room 301",
  },
  {
    id: "45",
    day: "Friday",
    timeSlot: { start: "15:45", end: "16:30" },
    subject: "Toán",
    room: "Room 301",
  },
];

const demoBreaks: Break[] = [
  {
    id: "break0",
    name: "Ăn sáng",
    timeSlot: { start: "07:15", end: "07:30" },
  },
  {
    id: "break1",
    name: "Giải lao buổi sáng",
    timeSlot: { start: "09:45", end: "10:00" },
  },
  {
    id: "break2",
    name: "Ăn trưa - Nghỉ trưa",
    timeSlot: { start: "11:30", end: "13:00" },
  },
  {
    id: "break3",
    name: "Ăn và buổi chiều",
    timeSlot: { start: "14:30", end: "15:00" },
  },
];
