import EmptyTab from "@/components/EmptyTab";

export default function MonthTab() {
  return (
    <EmptyTab
      title="Your Month"
      blurb="A monthly view to track consistency and reflect on how the month is going."
      planned={["Gym calendar", "Currently reading", "Monthly reflection"]}
    />
  );
}
