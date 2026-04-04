import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

interface SuccessPageProps {
  params: Promise<{ slug: string }>
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { slug } = await params

  const form = await prisma.form.findUnique({
    where: { slug },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center py-8 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-12 text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your response has been successfully submitted.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
