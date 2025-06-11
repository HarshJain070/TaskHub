"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, UserPlus, Users, Edit, Trash2, UserCog, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useFamilyContext } from "@/components/family-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

const familySchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
})

const memberSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["admin", "parent", "child"], {
    required_error: "Role is required",
  }),
})

type FamilyFormValues = z.infer<typeof familySchema>
type MemberFormValues = z.infer<typeof memberSchema>

export function FamilyManagement() {
  const { toast } = useToast()
  const { families, currentFamily, setCurrentFamily, familyMembers, refetchFamilies, refetchFamilyMembers, isLoading } =
    useFamilyContext()

  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const [isEditingFamily, setIsEditingFamily] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const familyForm = useForm<FamilyFormValues>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: "",
      role: "child",
    },
  })

  const onCreateFamily = async (data: FamilyFormValues) => {
    try {
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user")
      }

      const response = await fetch("/api/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create family")
      }

      await refetchFamilies()
      setIsCreatingFamily(false)
      familyForm.reset()

      toast({
        title: "Family created",
        description: "Your family has been created successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to create family. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to create family. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onUpdateFamily = async (data: FamilyFormValues) => {
    if (!currentFamily) return

    try {
      setError(null)
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/families/${currentFamily.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update family")
      }

      await refetchFamilies()
      setIsEditingFamily(false)

      toast({
        title: "Family updated",
        description: "Family details have been updated successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to update family. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to update family. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onDeleteFamily = async () => {
    if (!currentFamily) return

    if (!confirm("Are you sure you want to delete this family? This action cannot be undone.")) {
      return
    }

    try {
      setError(null)
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/families/${currentFamily.id}`, {
        method: "DELETE",
        headers: {
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete family")
      }

      await refetchFamilies()
      setCurrentFamily(null)

      toast({
        title: "Family deleted",
        description: "Family has been deleted successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to delete family. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to delete family. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onAddMember = async (data: MemberFormValues) => {
    if (!currentFamily) return

    try {
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("No authenticated user")
      }

      const response = await fetch(`/api/families/${currentFamily.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add member")
      }

      await refetchFamilyMembers()
      setIsAddingMember(false)
      memberForm.reset()

      toast({
        title: "Member added",
        description: "Family member has been added successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to add member. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to add member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onChangeRole = async () => {
    if (!currentFamily || !selectedMember) return

    try {
      setError(null)

      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/families/${currentFamily.id}/members/${selectedMember.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update member role")
      }

      await refetchFamilyMembers()
      setIsChangingRole(false)
      setSelectedMember(null)
      setNewRole("")

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to update member role. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to update member role. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onRemoveMember = async (memberId: string) => {
    if (!currentFamily) return

    if (!confirm("Are you sure you want to remove this member from the family?")) {
      return
    }

    try {
      setError(null)
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/families/${currentFamily.id}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove member")
      }

      await refetchFamilyMembers()

      toast({
        title: "Member removed",
        description: "Family member has been removed successfully.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to remove member. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditFamily = () => {
    if (!currentFamily) return

    familyForm.reset({
      name: currentFamily.name,
      description: currentFamily.description || "",
    })
    setIsEditingFamily(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-destructive-foreground"
      case "parent":
        return "bg-amber-500 text-white"
      case "child":
        return "bg-green-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="families" className="space-y-4">
        <TabsList>
          <TabsTrigger value="families">Families</TabsTrigger>
          {currentFamily && <TabsTrigger value="members">Members</TabsTrigger>}
        </TabsList>
        <TabsContent value="families" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreatingFamily} onOpenChange={setIsCreatingFamily}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Family
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Family</DialogTitle>
                  <DialogDescription>Create a new family group to manage tasks together.</DialogDescription>
                </DialogHeader>
                <form onSubmit={familyForm.handleSubmit(onCreateFamily)}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" {...familyForm.register("name")} />
                      {familyForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{familyForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...familyForm.register("description")} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Family</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {families.length > 0 ? (
              families.map((family) => (
                <Card key={family.id} className={currentFamily?.id === family.id ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle>{family.name}</CardTitle>
                    <CardDescription>{family.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(family.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant={currentFamily?.id === family.id ? "default" : "outline"}
                      onClick={() => setCurrentFamily(family)}
                    >
                      {currentFamily?.id === family.id ? "Selected" : "Select"}
                    </Button>
                    {currentFamily?.id === family.id && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleEditFamily}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={onDeleteFamily}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No families found</p>
                <p className="text-sm text-muted-foreground mb-4">Create a family to start managing tasks together</p>
                <Button onClick={() => setIsCreatingFamily(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Family
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {currentFamily && (
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{currentFamily.name} - Members</h2>
              <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                    <DialogDescription>
                      Add a new member to your family group. The user must already have an account.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={memberForm.handleSubmit(onAddMember)}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="member@example.com"
                          {...memberForm.register("email")}
                        />
                        {memberForm.formState.errors.email && (
                          <p className="text-sm text-destructive">{memberForm.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          onValueChange={(value) => memberForm.setValue("role", value as any)}
                          defaultValue={memberForm.getValues("role")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Member</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familyMembers.length > 0 ? (
                    familyMembers.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMember(member)
                                setNewRole(member.role)
                                setIsChangingRole(true)
                              }}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onRemoveMember(member.user_id)}>
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Family Dialog */}
      <Dialog open={isEditingFamily} onOpenChange={setIsEditingFamily}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family</DialogTitle>
            <DialogDescription>Update your family details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={familyForm.handleSubmit(onUpdateFamily)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" {...familyForm.register("name")} />
                {familyForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{familyForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" {...familyForm.register("description")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Family</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={isChangingRole} onOpenChange={setIsChangingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>Update the role for {selectedMember?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onChangeRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
