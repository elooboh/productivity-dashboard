import EmptyTab from "@/components/EmptyTab";

export default function QuarterTab() {
  return (
    <EmptyTab
      title="Your Quarter"
      blurb="A 90-day view for goals, finances, and the wins worth celebrating."
      planned={[
        "Quarterly goals",
        "Gym consistency",
        "Finances",
        "Quarterly wins",
        "Books read",
        "Idea parking lot",
      ]}
    />
  );
}
