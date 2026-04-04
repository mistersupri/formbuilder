"use client";

import { useState, useEffect } from "react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, RefreshCw } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const { data: session } = useSession();

  if (!session?.user?.id && !session?.user?.email) {
    redirect("/login");
  }

  const form = await prisma.form.findUnique({
    where: { id },
  });

  if (!form || form.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/editor/${form.id}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Editor
            </div>
          </Link>
          <h1 className="text-2xl font-bold">Form Settings</h1>
        </div>
      </header>

      {/* Settings Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Form Title</Label>
                <Input value={form.title} disabled className="mt-2" />
              </div>
              <div>
                <Label>Form Slug</Label>
                <Input value={form.slug} disabled className="mt-2" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox checked={form.isPublished} disabled />
                <Label className="cursor-pointer">Published</Label>
              </div>
            </CardContent>
          </Card>

          {/* Google Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Google Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Google Sheets</h4>
                {form.googleSheetId ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <p className="text-green-800">
                      Connected - Sheet ID: {form.googleSheetId}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">
                    Google Sheets not connected
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Google Drive</h4>
                {form.googleDriveFolderId ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="text-blue-800">
                      Connected - Folder ID: {form.googleDriveFolderId}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">
                    Google Drive not connected
                  </p>
                )}
              </div>

              <Button className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Setup Google Integration
              </Button>
            </CardContent>
          </Card>

          {/* Domain Whitelist */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Whitelist (for embedded forms)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the domains where this form can be embedded (one per line)
              </p>
              <textarea
                placeholder="example.com&#10;another-site.com"
                className="w-full p-3 border rounded-lg font-mono text-sm"
                rows={4}
                defaultValue={form.domainWhitelist?.join("\n") || ""}
              />
              <Button variant="outline" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Domain Whitelist
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
