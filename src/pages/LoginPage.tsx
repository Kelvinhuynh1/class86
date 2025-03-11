import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is already logged in, redirect to calendar page or the requested page
    if (user) {
      // Check if there's a redirect parameter in the URL
      const params = new URLSearchParams(location.search);
      const redirectPath = params.get("redirect");

      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate("/calendar");
      }
    }
    setLoading(false);
  }, [user, navigate, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <LoginForm />;
}
