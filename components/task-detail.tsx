"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, Clock, Edit, Trash2, ArrowLeft, Calendar, Flag, User, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"


type Task = {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "done" | "pending"
  priority: "low" | "medium" | "high"
  due_date: string
  assigned_to: string | null
  assigned_to_name: string | null
  is_family_task: boolean
  family_id: string | null
  family_name: string | null
  created_at: string
  updated_at: string | null
}

export function TaskDetail({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/tasks/${id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch task")
        }

        const data = await response.json()
        setTask(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load task. Please try again.",
          variant: "destructive",
        })
        router.push("/dashboard/tasks")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTask()
  }, [id, router, toast])

  const handleUpdateStatus = async (newStatus: string) => {
    if (!task) return

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...task,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task")
      }

      setTask({
        ...task,
        status: newStatus as any,
      })

      toast({
        title: "Status updated",
        description: `Task status updated to ${newStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      })

      router.push("/dashboard/tasks")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-amber-500" />
      case "pending":
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      case "todo":
        return <Circle className="h-5 w-5 text-muted-foreground" />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-amber-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return ""
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "done":
        return "Done"
      case "in_progress":
        return "In Progress"
      case "pending":
        return "Pending"
      case "todo":
        return "To Do"
      default:
        return status
    }
  }

  const getStatusButtonVariant = (status: string) => {
    switch (status) {
      case "done":
        return "outline"
      case "in_progress":
        return "outline"
      case "pending":
        return "destructive"
      case "todo":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatDateTime = (dateTimeStr: string) => {
    const dateTime = new Date(dateTimeStr)
    return `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading task details...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p>Task not found</p>
        <Button asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/tasks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/tasks/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteTask}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card className={task.status === "pending" ? "border-destructive" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${task.status === "pending" ? "text-destructive" : ""}`}>
                {task.title}
              </CardTitle>
              <CardDescription>
                {task.is_family_task && task.family_name && (
                  <Badge variant="outline" className="mt-2">
                    Family: {task.family_name}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={getStatusButtonVariant(task.status)} size="sm" className="flex gap-2">
                  {getStatusIcon(task.status)}
                  {getStatusText(task.status)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleUpdateStatus("todo")}>
                  <Circle className="mr-2 h-4 w-4" /> To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("in_progress")}>
                  <Clock className="mr-2 h-4 w-4" /> In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("pending")}>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus("done")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Due Date & Time</p>
                <p
                  className={`text-sm ${task.status === "pending" ? "text-destructive font-medium" : "text-muted-foreground"}`}
                >
                  {formatDateTime(task.due_date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Priority</p>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm text-muted-foreground">{task.assigned_to_name || "Unassigned"}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <div className="prose max-w-none">
              {task.description ? (
                <p className="text-muted-foreground">{task.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex flex-col w-full">
            <p>Created: {new Date(task.created_at).toLocaleString()}</p>
            {task.updated_at && <p>Last updated: {new Date(task.updated_at).toLocaleString()}</p>}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
