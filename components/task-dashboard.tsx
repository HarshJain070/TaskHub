"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, Clock, PlusCircle, ArrowUpRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
}

export function TaskDashboard() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      console.log("Dashboard: Starting to fetch tasks...")
      setIsLoading(true)

      try {
        console.log("Dashboard: Making API request...")

        const response = await fetch("/api/tasks")

        console.log("Dashboard: API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Dashboard: API error:", response.status, errorText)
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        console.log("Dashboard: Received data:", data)
        console.log("Dashboard: Number of tasks:", data.length)

        setTasks(data)
        console.log("Dashboard: Tasks set in state:", data.length)
      } catch (error) {
        console.error("Dashboard: Error:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        console.log("Dashboard: Loading finished")
      }
    }

    fetchTasks()
  }, [toast])


  // Calculate task statistics
  const todoTasks = tasks.filter((task) => task.status === "todo")
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress")
  const pendingTasks = tasks.filter((task) => task.status === "pending")
  const doneTasks = tasks.filter((task) => task.status === "done")

  const totalTasks = tasks.length
  const completedTasks = doneTasks.length
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  console.log("Dashboard: Rendering with stats:", {
    total: totalTasks,
    todo: todoTasks.length,
    inProgress: inProgressTasks.length,
    pending: pendingTasks.length,
    done: doneTasks.length,
  })

  const upcomingTasks = todoTasks
    .filter((task) => new Date(task.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const formatDateTime = (dateTimeStr: string) => {
    const dateTime = new Date(dateTimeStr)
    return `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your task management dashboard</p>
        <p className="text-xs text-gray-500">Debug: {tasks.length} tasks loaded</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">{completedTasks} completed</p>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks.length}</div>
            <p className="text-xs text-muted-foreground">{pendingTasks.length} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card className={pendingTasks.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                    <CardDescription>Due: {formatDateTime(task.due_date)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description || "No description"}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs">
                      {task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : "Unassigned"}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/tasks/${task.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No upcoming tasks</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/tasks/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create a task
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.length > 0 ? (
              pendingTasks.map((task) => (
                <Card key={task.id} className="border-destructive/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-destructive">{task.title}</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <CardDescription className="text-destructive">
                      Overdue: {formatDateTime(task.due_date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{task.description || "No description"}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs">
                      {task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : "Unassigned"}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/tasks/${task.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                <p className="text-muted-foreground">No pending tasks</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/tasks">View all tasks</Link>
        </Button>
      </div>
    </div>
  )
}
