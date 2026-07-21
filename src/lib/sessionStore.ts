// ============================================================================
// Global Session Store with 24-Hour LocalStorage & Supabase Persistence
// Retains user stories for 24 hours even across logouts, page reloads, and logins.
// ============================================================================

import { Story } from '../types/database';

const STORAGE_KEY = 'snap_24h_stories';

class SessionStore {
  private userStories: Story[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Story[] = JSON.parse(raw);
          const now = Date.now();
          // Keep stories created within the last 24 hours (86,400,000 ms)
          this.userStories = parsed.filter((s) => {
            const expiresAt = s.expires_at ? new Date(s.expires_at).getTime() : new Date(s.created_at).getTime() + 86400000;
            return expiresAt > now;
          });
          this.saveToStorage();
        }
      }
    } catch (e) {
      console.warn('[SessionStore] Could not load stories from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userStories));
      }
    } catch (e) {
      console.warn('[SessionStore] Could not save stories to storage:', e);
    }
  }

  public getStories(): Story[] {
    const now = Date.now();
    this.userStories = this.userStories.filter((s) => {
      const expiresAt = s.expires_at ? new Date(s.expires_at).getTime() : new Date(s.created_at).getTime() + 86400000;
      return expiresAt > now;
    });
    return this.userStories;
  }

  public addStory(story: Story) {
    this.userStories.unshift(story);
    this.saveToStorage();
    console.log(`[SessionStore] Added 24h story: ${story.id}. Total cached stories: ${this.userStories.length}`);
  }

  public clearStories() {
    this.userStories = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const sessionStore = new SessionStore();
export default sessionStore;
