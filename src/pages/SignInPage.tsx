import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const SignInPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
    <div className="w-full max-w-sm text-center">
      <Link to="/" className="inline-flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Star className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">ReviewFlow</span>
      </Link>
      <Card className="shadow-lg">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your reviews</p>
          <Button className="w-full" size="lg" asChild>
            <Link to="/dashboard">Sign In (Demo)</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Don't have an account? <Link to="/sign-up" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default SignInPage;
