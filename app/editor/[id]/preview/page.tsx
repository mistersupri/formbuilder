import { prisma } from "@/lib/prisma";
import { FormDisplay } from "@/components/form-renderer/form-display";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const { data: session } = useSession();

  if (!session?.user?.id && !session?.user?.email) {
    redirect("/login");
  }

  const form = await prisma.form.findUnique({
    where: { id },
  });

  if (!form) {
    redirect("/dashboard");
  }

  if (form.userId !== session.user.id) {
    redirect("/dashboard");
  }

  return <FormDisplay form={form as any} isPreview={true} />;
}
