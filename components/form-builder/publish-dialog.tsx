"use client";

import { useState, useEffect } from "react";
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
  Code,
  QrCode,
  Link as LinkIcon,
} from "lucide-react";

interface PublishDialogProps {
  form: any;
}

export default function PublishDialog({ form }: PublishDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <main>
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
                  Add domains to your whitelist in form settings to control
                  where this form can be embedded.
                </AlertDescription>
              </Alert>
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
    </main>
  );
}
