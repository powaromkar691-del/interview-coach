import { useState } from "react";
import { Link } from "react-router-dom";
import AuthAside, { AuthCenter } from "@/components/auth/AuthAside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/ClerkAuthProvider";

export default function SignIn() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try { await auth.signIn(email, password); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthAside
        headline="Welcome back."
        sub="Pick up where you left off — your roadmap, scores and interview history are waiting."
        points={[
          "Run a mock interview in HR, technical, project, behavioral or role-specific mode",
          "Get per-answer scoring on relevance, correctness, clarity and completeness",
          "Turn measured weak areas into a weekly practice plan",
        ]}
      />
      <AuthCenter testId="sign-in-page">
        <Card className="w-full shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Sign In to Interview Coach</CardTitle>
            <CardDescription>Enter your account details to access your workspace</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Continue to Dashboard"}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <Link to="/sign-up" className="text-indigo-600 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </AuthCenter>
    </div>
  );
}
