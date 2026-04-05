"use client";

import { FormField } from "@/lib/form-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface FormFieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: FormFieldRendererProps) {
  const [isUploading, setIsUploading] = useState(false);

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={field.type === "phone" ? "tel" : field.type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) =>
              onChange(e.target.value ? parseFloat(e.target.value) : "")
            }
            placeholder={field.placeholder}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );

      case "time":
        return (
          <Input
            type="time"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger required={field.required}>
              <SelectValue
                placeholder={field.placeholder || "Select an option"}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked =
                Array.isArray(value) && value.includes(option.value);
              return (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.id}-${option.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValue = Array.isArray(value) ? value : [];
                      if (checked) {
                        onChange([...newValue, option.value]);
                      } else {
                        onChange(
                          newValue.filter((v: string) => v !== option.value),
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${field.id}-${option.id}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        );

      case "radio":
        return (
          <RadioGroup value={value || ""} onValueChange={onChange}>
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${field.id}-${option.id}`}
                />
                <Label
                  htmlFor={`${field.id}-${option.id}`}
                  className="cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-2xl transition-colors ${
                  value >= star
                    ? "text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300"
                }`}
                onClick={() => onChange(star)}
              >
                ★
              </button>
            ))}
          </div>
        );

      case "file":
        return (
          <Input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                onChange("");
                return;
              }

              try {
                setIsUploading(true);

                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/uploads", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error("Failed to upload file");
                }

                const data = await response.json();
                onChange(data.url);
              } catch (uploadError) {
                console.error("File upload failed:", uploadError);
                onChange("");
              } finally {
                setIsUploading(false);
              }
            }}
            required={field.required}
            disabled={isUploading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-base">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
