import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    classCode: string,
    password: string,
  ) => Promise<{ error: any } | { user: User }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in session storage
    const checkUser = async () => {
      try {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser as User);
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (classCode: string, password: string) => {
    try {
      // Find users with the given class code
      const { data: usersData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("class_code", classCode);

      if (userError) {
        console.error("Error finding user:", userError);
        return { error: "Invalid credentials" };
      }

      // Find the user with matching password
      const userData = usersData?.find((user) => user.password === password);

      if (userData) {
        // Transform to our User type
        const user: User = {
          id: userData.id,
          displayName: userData.display_name,
          role: userData.role as UserRole,
          classCode: userData.class_code,
          password: userData.password,
        };

        setUser(user);
        sessionStorage.setItem("user", JSON.stringify(user));
        return { user };
      } else {
        return { error: "Incorrect password" };
      }
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear user from session storage
      sessionStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]) => {
    if (!user) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }

    // Admin has access to everything
    if (user.role === "Admin") return true;

    // Leader has access to Leader and Student permissions
    if (
      user.role === "Leader" &&
      (requiredRole === "Leader" || requiredRole === "Student")
    ) {
      return true;
    }

    // Co-Leader has access to Co-Leader and Student permissions
    if (
      user.role === "Co-Leader" &&
      (requiredRole === "Co-Leader" || requiredRole === "Student")
    ) {
      return true;
    }

    // Direct role match
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
