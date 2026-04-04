import { prisma } from "@/lib/prisma";
import { FormDisplay } from "@/components/form-renderer/form-display";
import { redirect } from "next/navigation";

interface FormPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: FormPageProps) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
  });

  return {
    title: form?.title || "Form",
    description: form?.description || "Fill out this form",
  };
}

export default async function FormPage({ params }: FormPageProps) {
  const { slug } = await params;

  const form = await prisma.form.findUnique({
    where: { slug },
  });

  if (!form) {
    redirect("/");
  }

  if (!form.isPublished) {
    redirect("/");
  }

  return <FormDisplay form={form as any} />;
}
