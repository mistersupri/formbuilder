'use client'

import { FormField, FieldType } from '@/lib/form-types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { useDragAndDrop } from '@dnd-kit/sortable'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { SortableFieldItem } from './sortable-field-item'

interface FormCanvasProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  onDeleteField: (fieldId: string) => void
  onReorderFields: (fields: FormField[]) => void
  onDropField: (type: FieldType) => void
  draggedField: FieldType | null
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onReorderFields,
  onDropField,
  draggedField,
}: FormCanvasProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedField) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedField) {
      onDropField(draggedField)
      setDragOverIndex(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFields = [...fields]
        const [movedField] = newFields.splice(oldIndex, 1)
        newFields.splice(newIndex, 0, movedField)
        onReorderFields(newFields)
      }
    }
  }

  if (fields.length === 0) {
    return (
      <div
        className="border-2 border-dashed border-muted rounded-lg p-12 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <p className="text-muted-foreground mb-2">
          Drag fields from the left palette to add them to your form
        </p>
        <p className="text-sm text-muted-foreground">
          Start by dragging a Text Input or other field type
        </p>
      </div>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={rectSortingStrategy}
      >
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              className={`transition-colors ${
                dragOverIndex === index ? 'bg-accent/50 rounded-lg' : ''
              }`}
            >
              <SortableFieldItem
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onSelectField(field.id)}
                onDelete={() => onDeleteField(field.id)}
              />
            </div>
          ))}
          <div
            onDragOver={(e) => handleDragOver(e, fields.length)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground transition-colors ${
              dragOverIndex === fields.length ? 'bg-accent/50 border-primary' : ''
            }`}
          >
            Drop here to add field
          </div>
        </div>
      </SortableContext>
    </DndContext>
  )
}
