// ============================================================================
// Navigation Param List Type Declarations
// ============================================================================

import { Snap, Story } from './database';

export type MainTabParamList = {
  Map: undefined;
  ChatFeed: undefined;
  Camera: undefined;
  Stories: undefined;
  VipMembers: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: { screen?: keyof MainTabParamList };
  SnapViewer: {
    snap: Snap;
  };
  SendToModal: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    duration: number;
  };
  DirectChat: {
    friendId: string;
    friendName: string;
    friendAvatar: string;
  };
  StoryViewer: {
    stories: Story[];
    initialIndex?: number;
  };
  VipCheckout: {
    tier: 'gold' | 'platinum';
    price: string;
  };
};
