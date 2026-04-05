"use client";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function Login() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const handleGoogleSignIn = async () => {
    await signIn("google", { redirect: true, callbackUrl, prompt: "consent" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 border-border shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Form Builder</h1>
            <p className="text-muted-foreground">
              Create and publish forms with Google integration
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                {error === "OAuthSignin" && "Failed to sign in with Google"}
                {error === "OAuthCallback" && "Error during authentication"}
                {error === "OAuthCreateAccount" && "Unable to create account"}
                {![
                  "OAuthSignin",
                  "OAuthCallback",
                  "OAuthCreateAccount",
                ].includes(error) && error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-12 text-base cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.256,12.545,1.256 c-6.215,0-11.25,5.035-11.25,11.25c0,6.215,5.035,11.25,11.25,11.25c6.214,0,11.25-5.035,11.25-11.25 C23.795,11.486,23.734,10.888,12.545,10.239z"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>By signing in, you agree to our terms of service</p>
          </div>
        </Card>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span className="text-foreground font-medium">
              Sign in with Google to create one
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
