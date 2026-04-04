"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, ChevronLeft, Link2, Sheet } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface ResponsesPageProps {
  params: Promise<{ id: string }>;
}

interface FormResponse {
  id: string;
  data: Record<string, any>;
  createdAt: string;
}

interface Form {
  id: string;
  title: string;
  fields: Array<{ id: string; label: string; type: string }>;
  googleSheetId?: string;
}

export default function ResponsesPage({
  params: paramsPromise,
}: ResponsesPageProps) {
  const { status } = useSession();
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleIntegrationLoading, setGoogleIntegrationLoading] =
    useState(false);

  useEffect(() => {
    paramsPromise.then(setParams);
  }, [paramsPromise]);

  useEffect(() => {
    if (!params) return;
    fetchData();
  }, [params]);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const fetchData = async () => {
    try {
      const [formRes, responsesRes] = await Promise.all([
        fetch(`/api/forms/${params?.id}`),
        fetch(`/api/forms/${params?.id}/responses`),
      ]);

      if (formRes.ok) {
        setForm(await formRes.json());
      }

      if (responsesRes.ok) {
        setResponses(await responsesRes.json());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!form || responses.length === 0) return;

    const headers = form.fields.map((f) => f.label);
    const rows = responses.map((response) =>
      form.fields.map((field) => {
        const value = response.data[field.id];
        if (Array.isArray(value)) {
          return value.join(", ");
        }
        return value || "";
      }),
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title}-responses.csv`;
    a.click();
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

  const handleSetupGoogleIntegration = async () => {
    if (!params?.id) return;

    try {
      setGoogleIntegrationLoading(true);
      const response = await fetch(
        `/api/forms/${params.id}/google-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            setupSheets: true,
            setupDrive: true,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to set up Google integration");
      }

      window.alert("Google integration set up successfully.");
      fetchData();
    } catch (error) {
      console.error("Error setting up Google integration:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to set up Google integration",
      );
    } finally {
      setGoogleIntegrationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/editor/${form.id}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Editor
            </div>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Form Responses</h1>
              <p className="text-muted-foreground text-sm mt-1">{form.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {form.googleSheetId ? (
                <Button variant="secondary" asChild>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${form.googleSheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Sheet className="w-3 h-3" />
                    View Sheets
                  </a>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleSetupGoogleIntegration}
                  disabled={responses.length === 0 || googleIntegrationLoading}
                >
                  <Sheet className="w-3 h-3" />
                  {googleIntegrationLoading
                    ? "Setting up..."
                    : "Setup Google Integration"}
                </Button>
              )}
              <Button
                onClick={handleExportCSV}
                disabled={responses.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{responses.length}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{form.fields.length}</p>
                <p className="text-sm text-muted-foreground">Fields</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {responses.length > 0
                    ? (responses.length / form.fields.length).toFixed(1)
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Responses</CardTitle>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No responses yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      {form.fields.map((field) => (
                        <TableHead key={field.id}>{field.label}</TableHead>
                      ))}
                      {/* {form.fields.length > 3 && (
                        <TableHead className="text-muted-foreground">
                          +{form.fields.length - 3} more fields
                        </TableHead>
                      )} */}
                      {/* <TableHead className="w-12">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(response.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        {form.fields.map((field) => {
                          const value = response.data[field.id];
                          console.log(value);
                          return (
                            <TableCell
                              key={field.id}
                              className="max-w-xs truncate"
                            >
                              {Array.isArray(value) ? (
                                value.join(", ")
                              ) : field.type === "file" && value ? (
                                <Image
                                  src={value}
                                  alt="Uploaded file"
                                  width={100}
                                  height={100}
                                  className="object-cover rounded hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => window.open(value, "_blank")}
                                />
                              ) : (
                                value
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
