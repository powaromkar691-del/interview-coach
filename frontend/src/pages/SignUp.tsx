import { useState } from "react";
import { Link } from "react-router-dom";
import AuthAside, { AuthCenter } from "@/components/auth/AuthAside";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/ClerkAuthProvider";

export default function SignUp() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try { await auth.signUp(name, email, password); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to create account."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthAside
        headline="Start your placement journey."
        sub="Create a free account, set up your profile in two minutes, and let the AI coach build your preparation plan."
        points={[
          "Personalized mock interviews for your target role",
          "AI resume analysis with job-description skill matching",
          "A weekly roadmap that adapts to your weak areas",
        ]}
      />
      <AuthCenter testId="sign-up-page">
        <Card className="w-full shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Create your Account</CardTitle>
            <CardDescription>Get started with personalized AI placement coaching</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account…" : "Create Account & Get Started"}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link to="/sign-in" className="text-indigo-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </AuthCenter>
    </div>
  );
}
