import { redirect, notFound } from "next/navigation"
import { getUser } from "@/actions"
import { getUserProfile } from "@/actions/social/profile-actions"
import { EditProfileForm } from "@/components/social/EditProfileForm"

interface EditProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { username } = await params
  const [user, profileData] = await Promise.all([getUser(), getUserProfile(username)])

  if (!profileData) notFound()
  if (!user || !profileData.isOwnProfile) redirect(`/profile/${username}`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <EditProfileForm user={profileData.user} />
    </div>
  )
}
