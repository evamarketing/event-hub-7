import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Stall = Tables<"stalls">;

interface StallAuthContextType {
  stall: Stall | null;
  login: (participantName: string, mobile: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const StallAuthContext = createContext<StallAuthContextType | undefined>(undefined);

export function StallAuthProvider({ children }: { children: ReactNode }) {
  const [stall, setStall] = useState<Stall | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedStallId = sessionStorage.getItem("stall_id");
    if (savedStallId) {
      supabase
        .from("stalls")
        .select("*")
        .eq("id", savedStallId)
        .single()
        .then(({ data }) => {
          if (data) setStall(data);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (participantName: string, mobile: string) => {
    const { data, error } = await supabase
      .from("stalls")
      .select("*")
      .eq("participant_name", participantName)
      .eq("mobile", mobile)
      .single();

    if (error || !data) {
      return { success: false, error: "Invalid credentials. Please check your name and mobile number." };
    }

    sessionStorage.setItem("stall_id", data.id);
    setStall(data);
    return { success: true };
  };

  const logout = () => {
    sessionStorage.removeItem("stall_id");
    setStall(null);
  };

  return (
    <StallAuthContext.Provider value={{ stall, login, logout, isLoading }}>
      {children}
    </StallAuthContext.Provider>
  );
}

export function useStallAuth() {
  const context = useContext(StallAuthContext);
  if (!context) {
    throw new Error("useStallAuth must be used within a StallAuthProvider");
  }
  return context;
}
