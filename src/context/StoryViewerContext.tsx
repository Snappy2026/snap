// ============================================================================
// StoryViewerContext
// Global context that renders the full-screen story viewer at the APP ROOT,
// completely outside all navigation containers, tab bars, scroll views, etc.
// Any screen can call openStoryViewer() to trigger the overlay.
// ============================================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import StoryViewerModal, {
  StoryViewerItem,
} from "../components/StoryViewerModal";

interface StoryViewerContextType {
  openStoryViewer: (stories: StoryViewerItem[], initialIndex?: number) => void;
  closeStoryViewer: () => void;
}

const StoryViewerContext = createContext<StoryViewerContextType>({
  openStoryViewer: () => {},
  closeStoryViewer: () => {},
});

export const useStoryViewer = () => useContext(StoryViewerContext);

export const StoryViewerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [stories, setStories] = useState<StoryViewerItem[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const openStoryViewer = useCallback(
    (newStories: StoryViewerItem[], idx = 0) => {
      setStories(newStories);
      setInitialIndex(idx);
      setVisible(true);
    },
    [],
  );

  const closeStoryViewer = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <StoryViewerContext.Provider value={{ openStoryViewer, closeStoryViewer }}>
      {children}
      <StoryViewerModal
        visible={visible}
        stories={stories}
        initialIndex={initialIndex}
        onClose={closeStoryViewer}
      />
    </StoryViewerContext.Provider>
  );
};

export default StoryViewerProvider;
