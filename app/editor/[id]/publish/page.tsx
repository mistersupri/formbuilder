"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  CheckCircle2,
  Globe,
  Code,
  QrCode,
  Link as LinkIcon,
} from "lucide-react";

interface PublishPageProps {
  params: Promise<{ id: string }>;
}

export default function PublishPage({
  params: paramsPromise,
}: PublishPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;
    fetchForm();
  }, [params]);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!form) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: true }),
      });

      if (response.ok) {
        const updated = await response.json();
        setForm(updated);
      }
    } catch (error) {
      console.error("Error publishing form:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!form) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      });

      if (response.ok) {
        const updated = await response.json();
        setForm(updated);
      }
    } catch (error) {
      console.error("Error unpublishing form:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Form not found</p>
      </div>
    );
  }

  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/form/${form.slug}`;
  const embedCode = `<iframe src="${formUrl}" style="width: 100%; height: 600px; border: none; border-radius: 8px;" title="${form.title}"></iframe>`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Publish Form</h1>
          <p className="text-muted-foreground text-sm mt-1">{form.title}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Publication Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {form.isPublished && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              Publication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.isPublished ? (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Your form is published and accepting responses
                  </AlertDescription>
                </Alert>
                <Button
                  variant="destructive"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                >
                  Unpublish Form
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    Your form is not published yet. Publish it to start
                    collecting responses.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? "Publishing..." : "Publish Form"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {form.isPublished && (
          <>
            {/* Sharing Tabs */}
            <Tabs defaultValue="link" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="embed" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Embed
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR Code
                </TabsTrigger>
              </TabsList>

              {/* Link Tab */}
              <TabsContent value="link">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Share Form Link</CardTitle>
                    <CardDescription>Direct link to your form</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Form URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formUrl)}
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Preview:
                      </p>
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm font-mono"
                      >
                        {formUrl}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Embed Tab */}
              <TabsContent value="embed">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Embed Form on Your Website
                    </CardTitle>
                    <CardDescription>
                      Copy the embed code and paste it on your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Embed Code</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={embedCode}
                          readOnly
                          className="font-mono text-sm"
                          rows={5}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(embedCode)}
                          className="self-start"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Domain Whitelist Info */}
                    <Alert>
                      <AlertDescription>
                        Add domains to your whitelist in form settings to
                        control where this form can be embedded.
                      </AlertDescription>
                    </Alert>

                    {/* Embed Preview */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Preview:</p>
                      <div className="bg-gray-100 rounded-lg p-4 h-96 flex flex-col gap-2 items-center justify-center">
                        <iframe
                          src={`http://localhost:3000/form/${form.slug}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            borderRadius: "8px",
                          }}
                          title="Survei"
                        ></iframe>
                        <p className="text-muted-foreground text-sm">
                          iframe preview would appear here
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* QR Code Tab */}
              <TabsContent value="qr">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">QR Code</CardTitle>
                    <CardDescription>
                      Generate a QR code to share your form
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center h-80">
                      <p className="text-muted-foreground text-sm">
                        QR code will be generated here pointing to: {formUrl}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
