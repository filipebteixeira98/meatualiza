import { helpRequestTopics } from "./help-request.ts";
import { monitoria } from "./monitoria.ts";
import type { SessionView } from "./schedule.ts";

export function summarizeMonitorSessions(sessions: SessionView[], now: number) {
  const upcoming = sessions.filter(
    (session) =>
      session.status === "scheduled" && Date.parse(session.startsAt) > now,
  );
  const recent = sessions.filter(
    (session) =>
      session.status !== "cancelled" && Date.parse(session.startsAt) <= now,
  );
  const registrations = recent.flatMap(
    (session) => session.registrations ?? [],
  );
  const expected = upcoming.reduce(
    (sum, session) => sum + session.enrolledCount,
    0,
  );
  return {
    upcoming,
    expected,
    occupancy: upcoming.length
      ? Math.round((expected / (upcoming.length * monitoria.capacidade)) * 100)
      : 0,
    completed: recent.filter((session) => session.status === "completed")
      .length,
    present: registrations.filter(
      (registration) => registration.attendance === "present",
    ).length,
    absent: registrations.filter(
      (registration) => registration.attendance === "absent",
    ).length,
    unrecorded: registrations.filter(
      (registration) => registration.attendance === "unrecorded",
    ).length,
    topics: helpRequestTopics
      .map((topic) => ({
        ...topic,
        count: upcoming.reduce(
          (sum, session) =>
            sum +
            (session.registrations ?? []).filter(
              (registration) => registration.helpRequest.topicId === topic.id,
            ).length,
          0,
        ),
      }))
      .filter((topic) => topic.count > 0)
      .sort((a, b) => b.count - a.count),
  };
}
