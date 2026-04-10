"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useFamilyContext } from "@/components/family-provider"


const taskSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().optional(),
  due_date: z.date({ required_error: "Due date is required" }),
  due_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time (HH:MM)" }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  status: z.enum(["todo", "in_progress", "done", "pending"], {
    required_error: "Status is required",
  }),
  assigned_to: z.string().optional().nullable(),
  is_family_task: z.boolean(),
})

type TaskFormValues = z.infer<typeof taskSchema>

type FamilyMember = {
  user_id: string
  name: string
  email: string
  role: string
}

export function TaskForm({ id }: { id?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { currentFamily, familyMembers } = useFamilyContext()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!!id)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      due_date: new Date(),
      due_time: format(new Date(), "HH:mm"),
      priority: "medium",
      status: "todo",
      assigned_to: null,
      is_family_task: false,
    },
  })

  useEffect(() => {
    if (id) {
      const fetchTask = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/tasks/${id}`)
          if (!response.ok) {
            throw new Error("Failed to fetch task")
          }

          const task = await response.json()
          const dueDateTime = new Date(task.due_date)

          form.reset({
            title: task.title,
            description: task.description || "",
            due_date: dueDateTime,
            due_time: format(dueDateTime, "HH:mm"),
            priority: task.priority,
            status: task.status,
            assigned_to: task.assigned_to,
            is_family_task: task.is_family_task,
          })
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to load task. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchTask()
    }
  }, [id, form, toast])

  const onSubmit = async (data: TaskFormValues) => {
    setIsLoading(true)
    try {
      // Combine date and time
      const [hours, minutes] = data.due_time.split(":").map(Number)
      const dueDateTime = new Date(data.due_date)
      dueDateTime.setHours(hours, minutes, 0, 0)

      const response = await fetch(isEditing ? `/api/tasks/${id}` : "/api/tasks", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          due_date: dueDateTime.toISOString(),
          family_id: data.is_family_task ? currentFamily?.id : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditing ? "update" : "create"} task`)
      }

      toast({
        title: isEditing ? "Task updated" : "Task created",
        description: isEditing ? "Your task has been updated successfully." : "Your task has been created successfully.",
      })

      router.push("/dashboard/tasks")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} task. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Task title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="w-full pl-3 text-left font-normal">
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="due_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Time</FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Task description" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {currentFamily && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="is_family_task"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Family Task</FormLabel>
                    <FormDescription>Make this task visible to all family members</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("is_family_task") && familyMembers.length > 0 && (
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select family member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {familyMembers.map((member: FamilyMember) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.name} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditing ? "Updating..." : "Creating...") : isEditing ? "Update Task" : "Create Task"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
