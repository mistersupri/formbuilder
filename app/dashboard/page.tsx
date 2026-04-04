"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { UserNav } from "@/components/dashboard/user-nav";
import { Plus, Edit, Eye, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";

interface FormItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  _count: {
    responses: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");

  if (status === "unauthenticated") {
    redirect("/login");
  }

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    console.log("masuk");
    try {
      const response = await fetch("/api/forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!formTitle.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
        }),
      });

      if (response.ok) {
        const newForm = await response.json();
        router.push(`/editor/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form:", error);
    } finally {
      setIsCreating(false);
      setFormTitle("");
      setFormDescription("");
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setForms(forms.filter((f) => f.id !== id));
      }
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Forms</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and create forms with ease
            </p>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Form Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="mb-8">
              <Plus className="w-4 h-4 mr-2" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Form Title
                </label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Customer Feedback"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateForm();
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe what this form is for..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormTitle("");
                    setFormDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateForm}
                  disabled={!formTitle.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Form"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Forms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading your forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first form to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-base">
                    {form.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {form.description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Responses</span>
                      <span className="font-semibold">
                        {form._count.responses}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          form.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {form.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/editor/${form.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link
                      href={`/form/${form.slug}`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/editor/${form.id}/responses`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Responses
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
