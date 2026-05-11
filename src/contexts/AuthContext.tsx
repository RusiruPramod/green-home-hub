import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, realtimeDb } from "@/services/firebase";
import { ref, get } from "firebase/database";
import { useToast } from "@/components/ui/use-toast";

type UserRole = "superadmin" | "hotelAdmin" | null;

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole;
  propertyId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  bypassLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  propertyId: null,
  loading: true,
  logout: async () => {},
  bypassLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for dev bypass
    const bypassRole = localStorage.getItem("dev_bypass_role") as UserRole;
    if (bypassRole) {
      setCurrentUser({ uid: "dev-bypass-uid", email: `dev@${bypassRole}.com` } as User);
      setUserRole(bypassRole);
      setPropertyId("property_001");
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          // In a real production app, you would use Firebase Custom Claims for role.
          // For the capstone, we will store user roles in realtimeDb at /users/{uid}
          const userRef = ref(realtimeDb!, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserRole(data.role || "hotelAdmin");
            setPropertyId(data.propertyId || "property_001");
          } else {
            // Default to hotel admin for property_001 if not found in DB
            setUserRole("hotelAdmin");
            setPropertyId("property_001");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Fallbacks for testing
          setUserRole("hotelAdmin");
          setPropertyId("property_001");
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setPropertyId(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const bypassLogin = (role: UserRole) => {
    localStorage.setItem("dev_bypass_role", role || "");
    setCurrentUser({ uid: "dev-bypass-uid", email: `dev@${role}.com` } as User);
    setUserRole(role);
    setPropertyId("property_001");
  };

  const logout = async () => {
    try {
      localStorage.removeItem("dev_bypass_role");
      if (auth && currentUser?.uid !== "dev-bypass-uid") {
        await signOut(auth);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setPropertyId(null);
      }
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const value = {
    currentUser,
    userRole,
    propertyId,
    loading,
    logout,
    bypassLogin,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
