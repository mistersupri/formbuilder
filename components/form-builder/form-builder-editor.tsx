'use client'

import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField, FieldType, FormSchema } from '@/lib/form-types'
import { FieldPalette } from './field-palette'
import { FormCanvas } from './form-canvas'
import { FieldEditor } from './field-editor'
import { 
  Save, 
  Eye, 
  Settings, 
  Trash2,
  Copy,
  Share2,
  BarChart3,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FormBuilderEditorProps {
  form: FormSchema
  onSave: (form: Partial<FormSchema>) => Promise<void>
  onDelete: () => Promise<void>
}

export function FormBuilderEditor({
  form,
  onSave,
  onDelete,
}: FormBuilderEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(form.title)
  const [description, setDescription] = useState(form.description)
  const [fields, setFields] = useState<FormField[]>(form.fields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedField, setDraggedField] = useState<FieldType | null>(null)

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId),
    [fields, selectedFieldId]
  )

  const handleAddField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      order: fields.length,
    }
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }, [fields])

  const handleUpdateField = useCallback(
    (updatedField: FormField) => {
      setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)))
    },
    [fields]
  )

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [fields, selectedFieldId])

  const handleReorderFields = useCallback((newOrder: FormField[]) => {
    setFields(newOrder.map((f, idx) => ({ ...f, order: idx })))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        title,
        description,
        fields,
      })
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 max-w-7xl mx-auto">
        {/* Left Sidebar - Field Palette */}
        <div className="lg:col-span-1">
          <FieldPalette
            onFieldDragStart={setDraggedField}
            onFieldDragEnd={() => setDraggedField(null)}
          />
        </div>

        {/* Middle - Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Form Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter form title"
                  className="text-lg font-semibold"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional form description"
                  rows={2}
                />
              </div>
            </CardHeader>
            <CardContent>
              <FormCanvas
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onDeleteField={handleDeleteField}
                onReorderFields={handleReorderFields}
                onDropField={(type) => handleAddField(type)}
                draggedField={draggedField}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Form'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`/form/${form.slug}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`/editor/${form.id}/publish`)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push(`/editor/${form.id}/responses`)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Responses
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Field Editor */}
        <div className="lg:col-span-1">
          {selectedField ? (
            <FieldEditor
              field={selectedField}
              onUpdate={handleUpdateField}
              onDelete={() => handleDeleteField(selectedField.id)}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Select a field to edit its properties
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
