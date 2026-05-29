import { getUser } from "@/actions";
import { MainContent } from "./main-content";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUser();

  // Authenticated users go to the social feed
  if (user) {
    redirect("/feed");
  }

  // For anonymous users, show the main content without a project
  return <MainContent user={user} />;
}
