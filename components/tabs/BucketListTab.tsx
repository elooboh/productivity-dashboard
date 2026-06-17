import EmptyTab from "@/components/EmptyTab";

export default function BucketListTab() {
  return (
    <EmptyTab
      title="Life Bucket List"
      blurb="Everything you want to do before you die — categorized, tracked, and celebrated as you go."
      planned={[
        "Travel",
        "Experience",
        "Career",
        "Personal",
        "Health",
        "Creative",
        "Financial",
        "Other",
      ]}
    />
  );
}
