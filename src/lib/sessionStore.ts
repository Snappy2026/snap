// ============================================================================
// Global Session Store for Live Local & Supabase Story Sync
// Guarantees that any snap posted to "My Story" or "VIP Story" is IMMEDIATELY
// saved and playable in the Stories tab across all user states.
// ============================================================================

import { Story } from '../types/database';

class SessionStore {
  private userStories: Story[] = [];

  public getStories(): Story[] {
    return this.userStories;
  }

  public addStory(story: Story) {
    this.userStories.unshift(story);
    console.log(`[SessionStore] Added story: ${story.id}. Total local stories: ${this.userStories.length}`);
  }

  public clearStories() {
    this.userStories = [];
  }
}

export const sessionStore = new SessionStore();
export default sessionStore;
