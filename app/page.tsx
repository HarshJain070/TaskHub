"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Providers } from "@/components/providers"
import { CheckCircle, Clock, Users, AlertTriangle, RefreshCw } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          router.push("/dashboard")
          return
        }
        setUser(null)
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <Providers>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Providers>
    )
  }

  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-black text-white">
        <header className="border-b border-gray-800">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <div className="font-bold text-xl">TaskHub</div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-gray-800">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 md:py-32">
            <div className="container px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Manage tasks together with your family
                  </h1>
                  <p className="text-xl text-gray-400 max-w-md">
                    TaskHub helps you organize tasks, collaborate with family members, and stay on top of your
                    responsibilities.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/signup">
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        Get Started
                      </Button>
                    </Link>
                    <Link href="#features">
                      <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="relative h-[350px] md:h-[400px] rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
                  <div className="relative z-10 flex flex-col items-center text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                      <CheckCircle className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Family Task Management</h3>
                    <p className="text-gray-400">
                      Simplify your family's daily organization with our collaborative task platform
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section id="features" className="py-20 bg-gray-950">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Everything you need to manage tasks efficiently with your family
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Family Collaboration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Create or join a family group to manage tasks together. Assign tasks to family members and track
                      progress.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Role-Based Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Set different permission levels for family members. Parents can manage all tasks while children
                      have limited access.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <CheckCircle className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Visual Task Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Color-coded task statuses and progress bars make it easy to see what's done, in progress, or
                      pending.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <AlertTriangle className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Priority Levels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Set task priorities to focus on what matters most. Filter and sort tasks based on urgency.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <Clock className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Deadline Reminders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      Never miss a deadline with automatic reminders for upcoming and overdue tasks.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800 text-white">
                  <CardHeader>
                    <RefreshCw className="h-6 w-6 text-primary mb-2" />
                    <CardTitle>Real-Time Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">
                      See changes to shared tasks in real-time as family members update their progress.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container px-4 md:px-6">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 md:p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to get organized?</h2>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Join thousands of families who use TaskHub to simplify their daily routines and responsibilities.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                      Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-gray-800 py-8">
          <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">© 2025 TaskHub. All rights reserved.</div>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-white">
                Terms
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Providers>
  )
}
