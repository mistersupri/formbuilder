"use client";

import { FormSchema } from "@/lib/form-types";
import { FormFieldRenderer } from "./form-field-renderer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

interface FormDisplayProps {
  form: FormSchema;
  isPreview?: boolean;
  onSuccess?: () => void;
}

export function FormDisplay({
  form,
  isPreview = false,
  onSuccess,
}: FormDisplayProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    form.fields.forEach((field) => {
      const value = formData[field.id];

      if (
        field.required &&
        (!value || (Array.isArray(value) && value.length === 0))
      ) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (value && field.validation) {
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.id] = "Invalid email address";
          }
        }

        if (field.type === "phone") {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(value)) {
            newErrors[field.id] = "Invalid phone number";
          }
        }

        if (
          field.validation.minLength &&
          value.length < field.validation.minLength
        ) {
          newErrors[field.id] =
            `Minimum length is ${field.validation.minLength}`;
        }

        if (
          field.validation.maxLength &&
          value.length > field.validation.maxLength
        ) {
          newErrors[field.id] =
            `Maximum length is ${field.validation.maxLength}`;
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({});
        setErrors({});
        onSuccess?.();

        // Redirect after 2 seconds
        if (!isPreview) {
          setTimeout(() => {
            router.push(`/form/${form.slug}/success`);
          }, 2000);
        }
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {submitStatus === "success" ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-xl font-semibold mb-2">Thank you!</h3>
                <p className="text-muted-foreground">
                  Your response has been submitted successfully
                </p>
              </div>
            ) : submitStatus === "error" ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✕</div>
                <h3 className="text-xl font-semibold mb-2 text-destructive">
                  Error submitting form
                </h3>
                <p className="text-muted-foreground">Please try again later</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {form.fields.map((field) => (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={errors[field.id]}
                  />
                ))}

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>

                {isPreview && (
                  <p className="text-sm text-muted-foreground text-center">
                    This is a preview. Submissions will not be saved.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
