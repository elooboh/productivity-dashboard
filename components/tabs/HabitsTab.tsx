"use client";

import { TabProps } from "@/lib/tabs";
import HabitsWidget from "@/components/widgets/HabitsWidget";

export default function HabitsTab({ data, update }: TabProps) {
  return (
    <HabitsWidget
      habits={data.habits}
      onChange={(habits) => update("habits", habits)}
    />
  );
}
