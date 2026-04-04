"use client";

import { FormField, FieldOption } from "@/lib/form-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}

export function FieldEditor({ field, onUpdate, onDelete }: FieldEditorProps) {
  const [options, setOptions] = useState<FieldOption[]>(field.options || []);

  console.log(field);

  useEffect(() => {
    setOptions(field.options || []);
  }, [field.options]);

  const handleAddOption = () => {
    const newOption: FieldOption = {
      id: `option-${Date.now()}`,
      label: "",
      value: "",
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  const handleUpdateOption = (index: number, updated: FieldOption) => {
    const newOptions = [...options];
    newOptions[index] = updated;
    setOptions(newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  const handleDeleteOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ ...field, options: newOptions });
  };

  const requiresOptions = ["select", "checkbox", "radio"].includes(field.type);

  return (
    <Card className="sticky top-6 h-fit">
      <CardHeader>
        <CardTitle className="text-base">Field Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div>
          <Label htmlFor="field-label" className="text-sm mb-2 block">
            Label
          </Label>
          <Input
            id="field-label"
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder="Field label"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="field-description" className="text-sm mb-2 block">
            Description
          </Label>
          <Textarea
            id="field-description"
            value={field.description || ""}
            onChange={(e) =>
              onUpdate({ ...field, description: e.target.value })
            }
            placeholder="Helper text (optional)"
            rows={2}
          />
        </div>

        {/* Placeholder */}
        {["text", "email", "number", "phone", "textarea"].includes(
          field.type,
        ) && (
          <div>
            <Label htmlFor="field-placeholder" className="text-sm mb-2 block">
              Placeholder
            </Label>
            <Input
              id="field-placeholder"
              value={field.placeholder || ""}
              onChange={(e) =>
                onUpdate({ ...field, placeholder: e.target.value })
              }
              placeholder="Placeholder text"
            />
          </div>
        )}

        {/* Required Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="field-required"
            checked={field.required}
            onCheckedChange={(checked) =>
              onUpdate({ ...field, required: checked as boolean })
            }
          />
          <Label htmlFor="field-required" className="text-sm cursor-pointer">
            Required field
          </Label>
        </div>

        {/* Options for select, checkbox, radio */}
        {requiresOptions && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Options</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) =>
                      handleUpdateOption(index, {
                        ...option,
                        label: e.target.value,
                        value: e.target.value,
                      })
                    }
                    placeholder="Option label"
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteOption(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No options added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Delete Button */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onDelete}
            size="sm"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete Field
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
