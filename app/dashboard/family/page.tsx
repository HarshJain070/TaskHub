import { FamilyManagement } from "@/components/family-management"

export default function FamilyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family Management</h1>
        <p className="text-muted-foreground">Manage your family group and members</p>
      </div>
      <FamilyManagement />
    </div>
  )
}
