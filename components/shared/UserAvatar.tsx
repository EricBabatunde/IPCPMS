import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: {
    name?: string | null
    image?: string | null
  }
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U"

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
