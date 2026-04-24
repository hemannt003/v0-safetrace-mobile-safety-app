"use client"

import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Phone, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

const fetcher = async () => {
  const supabase = createClient()
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false })
  return data
}

export default function UsersPage() {
  const { data: users, isLoading } = useSWR<User[]>("users", fetcher)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "responder":
        return "default"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Users
            {users && users.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {users.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No users registered yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profile_image_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{user.full_name}</span>
                        <Badge variant={getRoleColor(user.role)}>
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {user.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
