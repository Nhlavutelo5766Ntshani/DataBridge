"use client";

import { ScheduleCard } from "./schedule-card";
import { useRouter } from "next/navigation";

type Schedule = {
  id: string;
  name: string;
  cronExpression: string;
  timezone: string | null;
  enabled: boolean | null;
  lastRun?: Date | null;
  nextRun?: Date | null;
  description?: string | null;
  projectId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  metadata?: unknown;
};

type ScheduleCardWrapperProps = {
  schedule: Schedule | null;
  projectId: string;
};

export function ScheduleCardWrapper({ schedule, projectId }: ScheduleCardWrapperProps) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return <ScheduleCard schedule={schedule} projectId={projectId} onUpdate={handleUpdate} />;
}

