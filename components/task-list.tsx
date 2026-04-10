"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Circle,
  Clock,
  PlusCircle,
  Trash2,
  Edit,
  ArrowUpDown,
  AlertTriangle,
  Users,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFamilyContext } from "@/components/family-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


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
}

export function TaskList() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentFamily } = useFamilyContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)
  const [taskTypeFilter, setTaskTypeFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("due_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (statusFilter) queryParams.append("status", statusFilter)
        if (priorityFilter) queryParams.append("priority", priorityFilter)

        // Only add familyId if we're specifically filtering for family tasks
        if (currentFamily && taskTypeFilter === "family") {
          queryParams.append("familyId", currentFamily.id)
        }

        const response = await fetch(`/api/tasks?${queryParams.toString()}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch tasks")
        }

        const data = await response.json()

        // Filter by task type if selected
        let filteredTasks = data
        if (taskTypeFilter === "family") {
          filteredTasks = data.filter((task: Task) => task.is_family_task)
        } else if (taskTypeFilter === "personal") {
          filteredTasks = data.filter((task: Task) => !task.is_family_task)
        }

        setTasks(filteredTasks)
      } catch (error: any) {
        setError(error.message || "Failed to load tasks. Please try again.")
        toast({
          title: "Error",
          description: error.message || "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [statusFilter, priorityFilter, taskTypeFilter, currentFamily, toast])

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      setError(null)
      const taskToUpdate = tasks.find((task) => task.id === taskId)
      if (!taskToUpdate) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskToUpdate,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task")
      }

      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus as any } : task)))
      toast({
        title: "Status updated",
        description: `Task status updated to ${newStatus}.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete task")
      }

      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortField === "due_date") {
      const dateA = new Date(a.due_date).getTime()
      const dateB = new Date(b.due_date).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    } else if (sortField === "priority") {
      const priorityMap = { high: 3, medium: 2, low: 1 }
      const priorityA = priorityMap[a.priority as keyof typeof priorityMap]
      const priorityB = priorityMap[b.priority as keyof typeof priorityMap]
      return sortDirection === "asc" ? priorityA - priorityB : priorityB - priorityA
    } else if (sortField === "status") {
      const statusMap = { todo: 1, in_progress: 2, pending: 3, done: 4 }
      const statusA = statusMap[a.status as keyof typeof statusMap]
      const statusB = statusMap[b.status as keyof typeof statusMap]
      return sortDirection === "asc" ? statusA - statusB : statusB - statusA
    }
    return 0
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive"
      case "medium":
        return "text-amber-500"
      case "low":
        return "text-green-500"
      default:
        return ""
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

  const formatDateTime = (dateTimeStr: string) => {
    const dateTime = new Date(dateTimeStr)
    return `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter || ""} onValueChange={(value) => setPriorityFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={taskTypeFilter || ""} onValueChange={(value) => setTaskTypeFilter(value || null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tasks</SelectItem>
              <SelectItem value="personal">Personal tasks</SelectItem>
              <SelectItem value="family">Family tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => toggleSort("title")}>
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => toggleSort("priority")}>
                  Priority
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => toggleSort("due_date")}>
                  Due Date & Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading tasks...
                </TableCell>
              </TableRow>
            ) : sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id} className={task.status === "pending" ? "bg-red-50 dark:bg-red-950/20" : ""}>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {getStatusIcon(task.status)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "todo")}>
                          <Circle className="mr-2 h-4 w-4" /> To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "in_progress")}>
                          <Clock className="mr-2 h-4 w-4" /> In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "pending")}>
                          <AlertTriangle className="mr-2 h-4 w-4" /> Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, "done")}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className={`font-medium hover:underline ${task.status === "pending" ? "text-destructive" : ""}`}
                    >
                      {task.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={task.is_family_task ? "default" : "secondary"}
                      className="flex items-center gap-1 w-fit"
                    >
                      {task.is_family_task ? (
                        <>
                          <Users className="h-3 w-3" />
                          Family
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3" />
                          Personal
                        </>
                      )}
                    </Badge>
                    {task.is_family_task && task.family_name && (
                      <div className="text-xs text-muted-foreground mt-1">{task.family_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className={task.status === "pending" ? "text-destructive font-medium" : ""}>
                    {formatDateTime(task.due_date)}
                  </TableCell>
                  <TableCell>{task.assigned_to_name || "Unassigned"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/tasks/${task.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
