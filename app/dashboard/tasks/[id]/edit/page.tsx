import { TaskForm } from "@/components/task-form"

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Task</h1>
        <p className="text-muted-foreground">Update task details</p>
      </div>
      <TaskForm id={id} />
    </div>
  )
}
