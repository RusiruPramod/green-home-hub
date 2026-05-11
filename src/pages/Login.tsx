import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, realtimeDb } from "@/services/firebase";
import { ref, get } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Cpu, Lock, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { bypassLogin } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth) throw new Error("Auth not initialized");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine role from RTDB
      const userRef = ref(realtimeDb!, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.role === "superadmin") {
          navigate("/superadmin", { replace: true });
        } else {
          // If they were trying to access a specific page before login, send them there
          navigate(from === "/login" ? "/" : from, { replace: true });
        }
      } else {
        // Default hotel admin route
        navigate(from === "/login" ? "/" : from, { replace: true });
      }
      
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = (role: "hotelAdmin" | "superadmin") => {
    bypassLogin(role);
    if (role === "superadmin") {
      navigate("/superadmin", { replace: true });
    } else {
      navigate(from === "/login" ? "/" : from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, hsl(150 25% 96%), hsl(160 22% 93%), hsl(140 18% 95%))' }}>
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 20%, hsl(152 60% 80% / 0.4), transparent 50%), radial-gradient(circle at 70% 80%, hsl(170 55% 80% / 0.3), transparent 50%)' }} />
      
      <Card className="w-full max-w-md relative z-10 shadow-lg border-border">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Cpu className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold tracking-tight">Green Home Hub</CardTitle>
          <CardDescription className="text-center">
            Sign in to your energy management console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Sign In
                </div>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col border-t border-border/50 pt-6 pb-6 space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Authorized personnel only. Contact the system administrator if you cannot access your account.
          </p>
          
          {import.meta.env.DEV && (
            <div className="w-full flex flex-col gap-2 pt-4 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground text-center mb-2 uppercase tracking-widest">Dev Bypass</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={() => handleBypass('hotelAdmin')}
                  type="button"
                >
                  <Key className="w-3 h-3 mr-2" /> Hotel Admin
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={() => handleBypass('superadmin')}
                  type="button"
                >
                  <Key className="w-3 h-3 mr-2" /> Super Admin
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
