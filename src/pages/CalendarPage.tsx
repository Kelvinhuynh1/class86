import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CalendarPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDay, setCurrentDay] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Determine current period based on time
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeValue = hours + minutes / 60;

      if (timeValue >= 7.5 && timeValue < 8.25) setCurrentPeriod(0);
      else if (timeValue >= 8.25 && timeValue < 9) setCurrentPeriod(1);
      else if (timeValue >= 9 && timeValue < 9.75) setCurrentPeriod(2);
      else if (timeValue >= 9.75 && timeValue < 10)
        setCurrentPeriod(3); // Break
      else if (timeValue >= 10 && timeValue < 10.75) setCurrentPeriod(4);
      else if (timeValue >= 10.75 && timeValue < 11.5) setCurrentPeriod(5);
      else if (timeValue >= 11.5 && timeValue < 13)
        setCurrentPeriod(6); // Lunch
      else if (timeValue >= 13 && timeValue < 13.75) setCurrentPeriod(7);
      else if (timeValue >= 13.75 && timeValue < 14.5) setCurrentPeriod(8);
      else if (timeValue >= 14.5 && timeValue < 15)
        setCurrentPeriod(9); // Break
      else if (timeValue >= 15 && timeValue < 15.75) setCurrentPeriod(10);
      else if (timeValue >= 15.75 && timeValue < 16.5) setCurrentPeriod(11);
      else setCurrentPeriod(null);

      // Set current day
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      setCurrentDay(days[now.getDay()]);
    }, 60000);

    // Initial call
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    setCurrentDay(days[now.getDay()]);

    // Determine initial period
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeValue = hours + minutes / 60;

    if (timeValue >= 7.5 && timeValue < 8.25) setCurrentPeriod(0);
    else if (timeValue >= 8.25 && timeValue < 9) setCurrentPeriod(1);
    else if (timeValue >= 9 && timeValue < 9.75) setCurrentPeriod(2);
    else if (timeValue >= 9.75 && timeValue < 10)
      setCurrentPeriod(3); // Break
    else if (timeValue >= 10 && timeValue < 10.75) setCurrentPeriod(4);
    else if (timeValue >= 10.75 && timeValue < 11.5) setCurrentPeriod(5);
    else if (timeValue >= 11.5 && timeValue < 13)
      setCurrentPeriod(6); // Lunch
    else if (timeValue >= 13 && timeValue < 13.75) setCurrentPeriod(7);
    else if (timeValue >= 13.75 && timeValue < 14.5) setCurrentPeriod(8);
    else if (timeValue >= 14.5 && timeValue < 15)
      setCurrentPeriod(9); // Break
    else if (timeValue >= 15 && timeValue < 15.75) setCurrentPeriod(10);
    else if (timeValue >= 15.75 && timeValue < 16.5) setCurrentPeriod(11);
    else setCurrentPeriod(null);

    return () => clearInterval(timer);
  }, []);

  // Hardcoded timetable data
  const timetableData = {
    times: [
      "07:30 - 08:15",
      "08:15 - 09:00",
      "09:00 - 09:45",
      "09:45 - 10:00", // Break
      "10:00 - 10:45",
      "10:45 - 11:30",
      "11:30 - 13:00", // Lunch
      "13:00 - 13:45",
      "13:45 - 14:30",
      "14:30 - 15:00", // Break
      "15:00 - 15:45",
      "15:45 - 16:30",
    ],
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    subjects: [
      // Monday
      [
        {
          name: "French",
          room: "Room 101",
          color: "bg-red-100 border-red-200",
        },
        { name: "PE", room: "Gym", color: "bg-orange-100 border-orange-200" },
        { name: "PE", room: "Gym", color: "bg-orange-100 border-orange-200" },
        {
          name: "Morning Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "English",
          room: "Room 203",
          color: "bg-yellow-100 border-yellow-200",
        },
        {
          name: "English",
          room: "Room 203",
          color: "bg-yellow-100 border-yellow-200",
        },
        {
          name: "Lunch Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Computing",
          room: "Lab 1",
          color: "bg-cyan-100 border-cyan-200",
        },
        {
          name: "Computing",
          room: "Lab 1",
          color: "bg-cyan-100 border-cyan-200",
        },
        {
          name: "Afternoon Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Technology",
          room: "Tech House",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "Well-being",
          room: "Room 105",
          color: "bg-rose-100 border-rose-200",
        },
      ],
      // Tuesday
      [
        {
          name: "Music",
          room: "Music Room",
          color: "bg-fuchsia-100 border-fuchsia-200",
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Morning Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        { name: "PE", room: "Gym", color: "bg-orange-100 border-orange-200" },
        { name: "PE", room: "Gym", color: "bg-orange-100 border-orange-200" },
        {
          name: "Lunch Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Maths",
          room: "Room 301",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "NDGDDP",
          room: "Room 102",
          color: "bg-violet-100 border-violet-200",
        },
        {
          name: "Afternoon Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "English",
          room: "Room 203",
          color: "bg-yellow-100 border-yellow-200",
        },
        {
          name: "English",
          room: "Room 203",
          color: "bg-yellow-100 border-yellow-200",
        },
      ],
      // Wednesday
      [
        {
          name: "Global Perspectives",
          room: "Room 104",
          color: "bg-indigo-100 border-indigo-200",
        },
        {
          name: "Global Perspectives",
          room: "Room 101",
          color: "bg-indigo-100 border-indigo-200",
        },
        {
          name: "French",
          room: "Room 101",
          color: "bg-red-100 border-red-200",
        },
        {
          name: "Morning Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Maths",
          room: "Room 301",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "Maths",
          room: "Room 301",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "Lunch Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Art",
          room: "Art Studio",
          color: "bg-pink-100 border-pink-200",
        },
        {
          name: "GDCD",
          room: "Room 104",
          color: "bg-violet-100 border-violet-200",
        },
        {
          name: "Afternoon Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Geography",
          room: "Room 202",
          color: "bg-emerald-100 border-emerald-200",
        },
        {
          name: "History",
          room: "Room 204",
          color: "bg-purple-100 border-purple-200",
        },
      ],
      // Thursday
      [
        {
          name: "English",
          room: "Room 203",
          color: "bg-yellow-100 border-yellow-200",
        },
        {
          name: "English",
          room: "Room 204",
          color: "bg-yellow-100 border-yellow-200",
        },
        {
          name: "GEO / HIS",
          room: "Room 202",
          color: "bg-emerald-100 border-emerald-200",
        },
        {
          name: "Morning Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Literature",
          room: "Room 206",
          color: "bg-amber-100 border-amber-200",
        },
        {
          name: "Literature",
          room: "Room 206",
          color: "bg-amber-100 border-amber-200",
        },
        {
          name: "Lunch Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Afternoon Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "MOET Maths",
          room: "Room 302",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "HDTNHN",
          room: "Room 103",
          color: "bg-teal-100 border-teal-200",
        },
      ],
      // Friday
      [
        {
          name: "MOET Science",
          room: "Lab 1",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Literature",
          room: "Room 206",
          color: "bg-amber-100 border-amber-200",
        },
        {
          name: "Literature",
          room: "Room 206",
          color: "bg-amber-100 border-amber-200",
        },
        {
          name: "Morning Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "HDTNHN",
          room: "Room 103",
          color: "bg-teal-100 border-teal-200",
        },
        {
          name: "Homeroom",
          room: "Room 101",
          color: "bg-slate-100 border-slate-200",
        },
        {
          name: "Lunch Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Science",
          room: "Lab 2",
          color: "bg-green-100 border-green-200",
        },
        {
          name: "Afternoon Break",
          room: "",
          color: "bg-gray-100 border-gray-200",
          isBreak: true,
        },
        {
          name: "Maths",
          room: "Room 301",
          color: "bg-blue-100 border-blue-200",
        },
        {
          name: "Maths",
          room: "Room 301",
          color: "bg-blue-100 border-blue-200",
        },
      ],
    ],
  };

  // Get next class
  const getNextClass = () => {
    if (currentPeriod === null) return null;

    // Get day index (0 = Monday, 4 = Friday)
    const dayIndex =
      currentDay === "Monday"
        ? 0
        : currentDay === "Tuesday"
          ? 1
          : currentDay === "Wednesday"
            ? 2
            : currentDay === "Thursday"
              ? 3
              : currentDay === "Friday"
                ? 4
                : -1;

    if (dayIndex === -1 || currentPeriod >= timetableData.times.length - 1)
      return null;

    // Get next non-break period
    let nextPeriod = currentPeriod + 1;
    while (nextPeriod < timetableData.times.length) {
      const nextClass = timetableData.subjects[dayIndex][nextPeriod];
      if (!nextClass.isBreak) return nextClass;
      nextPeriod++;
    }

    return null;
  };

  const nextClass = getNextClass();

  return (
    <DashboardLayout activeTab="calendar">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View your class timetable and track current subjects in real-time.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 bg-muted/50 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Class Timetable</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {format(currentTime, "EEEE, MMMM d, yyyy")} •{" "}
                    {format(currentTime, "h:mm a")}
                  </span>
                  <div className="flex">
                    <Button
                      variant={viewMode === "week" ? "default" : "outline"}
                      size="sm"
                      className="rounded-r-none"
                      onClick={() => setViewMode("week")}
                    >
                      Week View
                    </Button>
                    <Button
                      variant={viewMode === "day" ? "default" : "outline"}
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => setViewMode("day")}
                    >
                      Day View
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Period Card */}
              {currentPeriod !== null && currentDay && (
                <div className="p-4 border-b bg-green-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Current Period
                      </h3>
                      <div className="flex items-center space-x-2">
                        {(() => {
                          // Get day index (0 = Monday, 4 = Friday)
                          const dayIndex =
                            currentDay === "Monday"
                              ? 0
                              : currentDay === "Tuesday"
                                ? 1
                                : currentDay === "Wednesday"
                                  ? 2
                                  : currentDay === "Thursday"
                                    ? 3
                                    : currentDay === "Friday"
                                      ? 4
                                      : -1;

                          if (dayIndex === -1)
                            return (
                              <div className="text-lg font-bold">No Class</div>
                            );

                          const currentClass =
                            timetableData.subjects[dayIndex][currentPeriod];
                          return (
                            <>
                              <div
                                className={`text-lg font-bold ${currentClass.color.replace("bg-", "text-").replace("-100", "-700")}`}
                              >
                                {currentClass.name}
                              </div>
                              {currentClass.room && (
                                <div className="text-sm text-muted-foreground">
                                  @ {currentClass.room}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {timetableData.times[currentPeriod]}
                    </div>
                  </div>
                </div>
              )}

              {/* Next Class Card */}
              {nextClass && (
                <div className="p-4 border-b bg-blue-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Next Class
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`text-lg font-bold ${nextClass.color.replace("bg-", "text-").replace("-100", "-700")}`}
                        >
                          {nextClass.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @ {nextClass.room}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {timetableData.times[currentPeriod! + 1]}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "week" ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="p-3 text-left font-medium text-sm w-24 border-r">
                          Time
                        </th>
                        {timetableData.days.map((day) => (
                          <th
                            key={day}
                            className={`p-3 text-center font-medium text-sm border-r ${day === currentDay ? "bg-blue-50" : ""}`}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timetableData.times.map((time, timeIndex) => {
                        const isCurrentTimeSlot = timeIndex === currentPeriod;
                        return (
                          <tr
                            key={time}
                            className={`${isCurrentTimeSlot ? "bg-blue-50" : ""} ${timeIndex % 2 === 0 ? "bg-muted/10" : ""}`}
                          >
                            <td className="p-3 text-sm border-r border-b">
                              {time}
                            </td>
                            {timetableData.days.map((day, dayIndex) => {
                              const subject =
                                timetableData.subjects[dayIndex][timeIndex];
                              const isCurrentCell =
                                isCurrentTimeSlot && day === currentDay;
                              return (
                                <td
                                  key={`${day}-${time}`}
                                  className={`p-2 border-r border-b ${subject.color} ${isCurrentCell ? "ring-2 ring-blue-500" : ""}`}
                                >
                                  <div className="font-medium">
                                    {subject.name}
                                  </div>
                                  {subject.room && (
                                    <div className="text-xs text-muted-foreground">
                                      @ {subject.room}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {currentDay}'s Schedule
                  </h3>
                  <div className="space-y-2">
                    {timetableData.times.map((time, timeIndex) => {
                      // Get day index (0 = Monday, 4 = Friday)
                      const dayIndex =
                        currentDay === "Monday"
                          ? 0
                          : currentDay === "Tuesday"
                            ? 1
                            : currentDay === "Wednesday"
                              ? 2
                              : currentDay === "Thursday"
                                ? 3
                                : currentDay === "Friday"
                                  ? 4
                                  : -1;

                      if (dayIndex === -1) return null;

                      const subject =
                        timetableData.subjects[dayIndex][timeIndex];
                      const isCurrentTimeSlot = timeIndex === currentPeriod;

                      return (
                        <div
                          key={time}
                          className={`p-3 rounded-md border ${subject.color} ${isCurrentTimeSlot ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{subject.name}</div>
                              {subject.room && (
                                <div className="text-xs text-muted-foreground">
                                  @ {subject.room}
                                </div>
                              )}
                            </div>
                            <div className="text-sm">{time}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
