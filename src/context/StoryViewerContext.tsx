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
  setActiveCreatorId?: (creatorId: string) => void;
  onSelectCreator?: (creatorId: string) => void;
  setOnSelectCreatorHandler?: (handler: (creatorId: string) => void) => void;
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
  const [creatorHandler, setCreatorHandler] = useState<((creatorId: string) => void) | undefined>();

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

  const setOnSelectCreatorHandler = useCallback((handler: (creatorId: string) => void) => {
    setCreatorHandler(() => handler);
  }, []);

  return (
    <StoryViewerContext.Provider value={{ openStoryViewer, closeStoryViewer, setOnSelectCreatorHandler }}>
      {children}
      <StoryViewerModal
        visible={visible}
        stories={stories}
        initialIndex={initialIndex}
        onClose={closeStoryViewer}
        onSelectCreator={(cid) => {
          closeStoryViewer();
          if (creatorHandler) creatorHandler(cid);
        }}
      />
    </StoryViewerContext.Provider>
  );
};

export default StoryViewerProvider;
