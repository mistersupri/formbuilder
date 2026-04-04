'use client'

import { FieldType } from '@/lib/form-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Type,
  Mail,
  Hash,
  FileText,
  List,
  CheckSquare,
  Radio,
  Calendar,
  Clock,
  Upload,
  Star,
  Phone,
} from 'lucide-react'

const FIELD_TYPES: Array<{
  type: FieldType
  label: string
  icon: React.ReactNode
  description: string
}> = [
  {
    type: 'text',
    label: 'Text Input',
    icon: <Type className="w-4 h-4" />,
    description: 'Single line text',
  },
  {
    type: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    description: 'Email address',
  },
  {
    type: 'number',
    label: 'Number',
    icon: <Hash className="w-4 h-4" />,
    description: 'Numeric input',
  },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: <FileText className="w-4 h-4" />,
    description: 'Multi-line text',
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: <List className="w-4 h-4" />,
    description: 'Choose one option',
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: <CheckSquare className="w-4 h-4" />,
    description: 'Select multiple',
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: <Radio className="w-4 h-4" />,
    description: 'Choose one option',
  },
  {
    type: 'date',
    label: 'Date',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Pick a date',
  },
  {
    type: 'time',
    label: 'Time',
    icon: <Clock className="w-4 h-4" />,
    description: 'Pick a time',
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: <Upload className="w-4 h-4" />,
    description: 'Upload file',
  },
  {
    type: 'rating',
    label: 'Rating',
    icon: <Star className="w-4 h-4" />,
    description: '1-5 star rating',
  },
  {
    type: 'phone',
    label: 'Phone',
    icon: <Phone className="w-4 h-4" />,
    description: 'Phone number',
  },
]

interface FieldPaletteProps {
  onFieldDragStart: (type: FieldType) => void
  onFieldDragEnd: () => void
}

export function FieldPalette({ onFieldDragStart, onFieldDragEnd }: FieldPaletteProps) {
  return (
    <Card className="sticky top-6 h-fit">
      <CardHeader>
        <CardTitle className="text-base">Field Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {FIELD_TYPES.map((field) => (
          <Button
            key={field.type}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 flex-col items-start"
            draggable
            onDragStart={() => onFieldDragStart(field.type)}
            onDragEnd={onFieldDragEnd}
          >
            <div className="flex items-center gap-2 mb-1 w-full">
              {field.icon}
              <span className="font-medium text-sm">{field.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{field.description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
