import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import supabase from "../utils/supabase/client";

interface SettingsContextType {
  isServiceOpen: boolean;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isServiceOpen, setIsServiceOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("is_open")
          .single();

        if (error) {
          console.error("Error fetching service status:", error);
          // Default to open if there's an error
          setIsServiceOpen(true);
        } else {
          setIsServiceOpen(data.is_open);
        }
      } catch (error) {
        console.error("Error fetching service status:", error);
        setIsServiceOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to changes in the settings table
    const settingsSubscription = supabase
      .channel("settings_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => {
          if (payload.new && typeof payload.new.is_open === "boolean") {
            setIsServiceOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      settingsSubscription.unsubscribe();
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ isServiceOpen, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
