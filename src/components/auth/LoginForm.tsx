import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [classCode, setClassCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch demo accounts from Supabase for display
    const fetchDemoAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("display_name, class_code, password, role")
          .limit(5);

        if (error) throw error;
        setDemoAccounts(data || []);
      } catch (err) {
        console.error("Error fetching demo accounts:", err);
      }
    };

    fetchDemoAccounts();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First, check if the class code exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("class_code", classCode);

      if (userError) {
        console.error("Error finding user:", userError);
        setError("Invalid class code or password");
        setLoading(false);
        return;
      }

      // Find the user with matching password
      const matchingUser = userData?.find((user) => user.password === password);

      if (matchingUser) {
        // Call the signIn function from AuthContext
        const result = await signIn(classCode, password);
        if ("error" in result) {
          setError("Invalid class code or password");
        } else {
          // Store user in session storage
          sessionStorage.setItem("user", JSON.stringify(result.user));
          navigate("/calendar");
        }
      } else {
        setError("Invalid class code or password");
      }
    } catch (err) {
      setError("An error occurred during sign in");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Class Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Enter your class code and password to sign in
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                placeholder="e.g. JD42"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              <p>For demo: Class Code "JD42", Password "7Hj&9Kl2"</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
