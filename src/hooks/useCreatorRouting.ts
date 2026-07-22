// ============================================================================
// useCreatorRouting Hook
// Parses WhatsApp/SMS invite link query parameters (?creator=username or ?invite=id)
// and persists the target creator for seamless landing upon login/signup.
// ============================================================================

import { useEffect, useState } from "react";
import { Platform } from "react-native";

export const useCreatorRouting = () => {
  const [invitedCreator, setInvitedCreator] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const creatorParam = params.get("creator") || params.get("invite") || params.get("ref");
      if (creatorParam) {
        setInvitedCreator(creatorParam);
      }
    }
  }, []);

  return { invitedCreator };
};

export default useCreatorRouting;
