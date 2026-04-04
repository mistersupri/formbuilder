import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FormBuilderEditor } from "@/components/form-builder/form-builder-editor";
import { useSession } from "next-auth/react";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditorPageProps) {
  const { id } = await params;
  const form = await prisma.form.findUnique({
    where: { id },
  });

  return {
    title: `Edit ${form?.title || "Form"} | Form Builder`,
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

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

  const handleSave = async (updatedForm: any) => {
    "use server";

    try {
      await prisma.form.update({
        where: { id: form.id },
        data: updatedForm,
      });
    } catch (error) {
      console.error("Error saving form:", error);
      throw error;
    }
  };

  const handleDelete = async () => {
    "use server";

    try {
      await prisma.form.delete({
        where: { id: form.id },
      });
    } catch (error) {
      console.error("Error deleting form:", error);
      throw error;
    }
  };

  return (
    <FormBuilderEditor
      form={form as any}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
