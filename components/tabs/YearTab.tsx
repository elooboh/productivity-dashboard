import EmptyTab from "@/components/EmptyTab";

export default function YearTab() {
  return (
    <EmptyTab
      title="Your Year"
      blurb="Set the foundation for the year — your vision, focus, and the areas you're investing in."
      planned={[
        "Life vision",
        "Non-negotiables",
        "Focus",
        "Change",
        "Focus buckets",
      ]}
    />
  );
}
