'use client'

import { FormField } from '@/lib/form-types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface SortableFieldItemProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SortableFieldItem({
  field,
  isSelected,
  onSelect,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getFieldTypeLabel = () => {
    const labels: Record<string, string> = {
      text: 'Text',
      email: 'Email',
      number: 'Number',
      textarea: 'Long Text',
      select: 'Dropdown',
      checkbox: 'Checkboxes',
      radio: 'Radio',
      date: 'Date',
      time: 'Time',
      file: 'File',
      rating: 'Rating',
      phone: 'Phone',
    }
    return labels[field.type] || field.type
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <Card
        className={`p-4 cursor-pointer ${
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing mt-1 flex-shrink-0"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Field Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{field.label}</h4>
              <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground whitespace-nowrap">
                {getFieldTypeLabel()}
              </span>
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {field.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {field.required && (
                <span className="flex items-center gap-1">
                  <span className="text-destructive">*</span> Required
                </span>
              )}
              {field.options && field.options.length > 0 && (
                <span>{field.options.length} options</span>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
