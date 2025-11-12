import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { InteractionManager } from 'react-native';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ANIMATIONS } from '../constants';
import { EmptyState } from '../components/EmptyState';
import { OptimizedImage } from '../components/OptimizedImage';
import { ComponentErrorBoundary } from '../components/ErrorBoundary';
import { usePerformance } from '../hooks/usePerformance';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'image' | 'system';
  reactions?: { emoji: string; count: number; users: string[] }[];
  replyTo?: string;
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'party' | 'group';
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  members?: number;
  partyId?: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Rooftop Vibes 🌃',
    type: 'party',
    avatar: 'https://picsum.photos/50/50?random=1',
    lastMessage: 'Sarah: Can\'t wait for tonight! 🎉',
    lastMessageTime: '2 min',
    unreadCount: 3,
    members: 24,
    partyId: 'party-1',
  },
  {
    id: '2',
    name: 'Alex Thompson',
    type: 'direct',
    avatar: 'https://picsum.photos/50/50?random=2',
    lastMessage: 'Are you going to the beach party?',
    lastMessageTime: '15 min',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Weekend Squad',
    type: 'group',
    avatar: 'https://picsum.photos/50/50?random=3',
    lastMessage: 'Mike: Let\'s plan something epic!',
    lastMessageTime: '1h',
    unreadCount: 0,
    members: 8,
  },
  {
    id: '4',
    name: 'Maya Rodriguez',
    type: 'direct',
    avatar: 'https://picsum.photos/50/50?random=4',
    lastMessage: 'Thanks for the invite! 😊',
    lastMessageTime: '2h',
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '5',
    name: 'House Party Central 🏠',
    type: 'party',
    avatar: 'https://picsum.photos/50/50?random=5',
    lastMessage: 'DJ: Sound check complete!',
    lastMessageTime: '3h',
    unreadCount: 7,
    members: 156,
    partyId: 'party-5',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey everyone! Super excited for tonight\'s rooftop party! 🌃',
    senderId: 'user-1',
    senderName: 'Emma Wilson',
    senderAvatar: 'https://picsum.photos/40/40?random=11',
    timestamp: '2024-01-15T19:30:00Z',
    isOwn: false,
    type: 'text',
    reactions: [{ emoji: '🔥', count: 3, users: ['user-2', 'user-3', 'user-4'] }],
  },
  {
    id: '2',
    content: 'Same here! The view is going to be incredible',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: '2024-01-15T19:32:00Z',
    isOwn: true,
    type: 'text',
  },
  {
    id: '3',
    content: 'Just arrived and the setup looks amazing! 📸',
    senderId: 'user-2',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://picsum.photos/40/40?random=12',
    timestamp: '2024-01-15T19:45:00Z',
    isOwn: false,
    type: 'text',
    reactions: [
      { emoji: '😍', count: 5, users: ['user-1', 'user-3', 'user-4', 'user-5', 'current-user'] },
      { emoji: '🎉', count: 2, users: ['user-6', 'user-7'] },
    ],
  },
  {
    id: '4',
    content: 'On my way! ETA 15 minutes 🚗',
    senderId: 'user-3',
    senderName: 'Marcus Johnson',
    senderAvatar: 'https://picsum.photos/40/40?random=13',
    timestamp: '2024-01-15T19:50:00Z',
    isOwn: false,
    type: 'text',
  },
  {
    id: '5',
    content: 'Perfect timing! The DJ just started the pre-party mix 🎵',
    senderId: 'current-user',
    senderName: 'You',
    timestamp: '2024-01-15T19:52:00Z',
    isOwn: true,
    type: 'text',
    reactions: [{ emoji: '🎵', count: 4, users: ['user-1', 'user-2', 'user-3', 'user-4'] }],
  },
];

export function MessagesScreen() {
  const { measureAsyncOperation, measureSyncOperation, logInteraction } = usePerformance({
    componentName: 'MessagesScreen',
    trackRenders: true,
    trackInteractions: true,
  });

  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const messageListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const animationCleanup = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...ANIMATIONS.springConfig,
        useNativeDriver: true,
      }),
    ]);
    
    animationCleanup.start();

    return () => {
      animationCleanup.stop();
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    };
  }, [fadeAnim, slideAnim]);

  const handleConversationPress = useCallback((conversation: Conversation) => {
    logInteraction('conversation_press', { conversationId: conversation.id, type: conversation.type });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedConversation(conversation);
    
    // Mark as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  }, [logInteraction]);

  const handleSendMessage = useCallback(() => {
    if (messageText.trim() === '') return;
    
    logInteraction('send_message', { length: messageText.length });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageText.trim(),
      senderId: 'current-user',
      senderName: 'You',
      timestamp: new Date().toISOString(),
      isOwn: true,
      type: 'text',
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
    
    // Scroll to bottom with interaction manager to avoid blocking UI
    InteractionManager.runAfterInteractions(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });
  }, [messageText, logInteraction]);

  const handleBackPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedConversation(null);
  }, []);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const renderConversationItem = useCallback(({ item, index }: { item: Conversation; index: number }) => (
    <ComponentErrorBoundary componentName={`ConversationItem-${item.id}`}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 50 + index * 10],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.8}
        >
          <BlurView intensity={15} style={styles.conversationBlur}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
              style={styles.conversationGradient}
            >
              <View style={styles.conversationContent}>
                <View style={styles.avatarContainer}>
                  <OptimizedImage
                    uri={item.avatar || 'https://picsum.photos/50/50'}
                    width={50}
                    height={50}
                    style={styles.avatar}
                    borderRadius={25}
                    showLoadingIndicator={false}
                  />
                  {item.type === 'direct' && item.isOnline && (
                    <View style={styles.onlineIndicator} />
                  )}
                  {item.type === 'party' && (
                    <View style={styles.partyBadge}>
                      <Ionicons name="people" size={12} color={COLORS.white} />
                    </View>
                  )}
                </View>
                
                <View style={styles.conversationDetails}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.conversationTime}>
                      {item.lastMessageTime}
                    </Text>
                  </View>
                  
                  <View style={styles.conversationFooter}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {item.unreadCount > 99 ? '99+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {item.members && (
                    <View style={styles.membersInfo}>
                      <Ionicons name="people-outline" size={12} color={COLORS.gray400} />
                      <Text style={styles.membersText}>
                        {item.members} members
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </ComponentErrorBoundary>
  ), [fadeAnim, slideAnim, handleConversationPress]);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <ComponentErrorBoundary componentName={`Message-${item.id}`}>
      <View style={[styles.messageContainer, item.isOwn && styles.ownMessage]}>
        {!item.isOwn && (
          <OptimizedImage
            uri={item.senderAvatar || 'https://picsum.photos/32/32'}
            width={32}
            height={32}
            style={styles.messageAvatar}
            borderRadius={16}
            showLoadingIndicator={false}
          />
        )}
        
        <View style={[styles.messageBubble, item.isOwn && styles.ownMessageBubble]}>
          <BlurView intensity={item.isOwn ? 10 : 15} style={styles.messageBlur}>
            <LinearGradient
              colors={item.isOwn 
                ? [COLORS.cyan + '40', COLORS.cyan + '20']
                : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
              }
              style={styles.messageGradient}
            >
              {!item.isOwn && (
                <Text style={styles.senderName}>{item.senderName}</Text>
              )}
              
              <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
                {item.content}
              </Text>
              
              <Text style={[styles.messageTime, item.isOwn && styles.ownMessageTime]}>
                {formatTime(item.timestamp)}
              </Text>
              
              {item.reactions && item.reactions.length > 0 && (
                <View style={styles.reactionsContainer}>
                  {item.reactions.map((reaction, index) => (
                    <View key={index} style={styles.reaction}>
                      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                      <Text style={styles.reactionCount}>{reaction.count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </View>
      </View>
    </ComponentErrorBoundary>
  ), [formatTime]);

  const renderConversationsHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Messages</Text>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Ionicons name="search" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  ), []);

  const renderChatHeader = () => (
    <BlurView intensity={20} style={styles.chatHeader}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.chatHeaderGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.chatHeaderInfo}>
          <OptimizedImage
            uri={selectedConversation?.avatar || 'https://picsum.photos/40/40'}
            width={36}
            height={36}
            style={styles.chatAvatar}
            borderRadius={18}
            showLoadingIndicator={false}
          />
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {selectedConversation?.name}
            </Text>
            <Text style={styles.chatSubtitle}>
              {selectedConversation?.type === 'party' && selectedConversation?.members
                ? `${selectedConversation.members} members`
                : selectedConversation?.type === 'direct' && selectedConversation?.isOnline
                ? 'Online'
                : 'Active'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
    </BlurView>
  );

  const renderMessageInput = () => (
    <BlurView intensity={20} style={styles.messageInputContainer}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']}
        style={styles.messageInputGradient}
      >
        <View style={styles.messageInputContent}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="add" size={24} color={COLORS.gray400} />
          </TouchableOpacity>
          
          <TextInput
            ref={textInputRef}
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.gray400}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={300}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, messageText.trim() && styles.sendButtonActive]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={messageText.trim() ? COLORS.white : COLORS.gray400} 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </BlurView>
  );

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {renderChatHeader()}
          
          <FlatList
            ref={messageListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={useCallback((item: Message) => item.id, [])}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={8}
            initialNumToRender={5}
            updateCellsBatchingPeriod={100}
            getItemLayout={useCallback(
              (data: any, index: number) => ({
                length: 80, // Estimated height of message
                offset: 80 * index,
                index,
              }),
              []
            )}
          />
          
          {renderMessageInput()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={useCallback((item: Conversation) => item.id, [])}
        ListHeaderComponent={renderConversationsHeader}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations"
            message="Start chatting with friends or join a party!"
            actionText="Discover Parties"
            onAction={() => console.log('Navigate to discover')}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={8}
        initialNumToRender={3}
        updateCellsBatchingPeriod={100}
        getItemLayout={useCallback(
          (data: any, index: number) => ({
            length: 90, // Estimated height of conversation item
            offset: 90 * index,
            index,
          }),
          []
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.white,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  conversationItem: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  conversationBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  conversationGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.lg,
  },
  conversationContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  partyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  conversationDetails: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  conversationName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    flex: 1,
    marginRight: SPACING.sm,
  },
  conversationTime: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  lastMessage: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray300,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadBadge: {
    backgroundColor: COLORS.cyan,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  unreadCount: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.xs,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  chatHeaderText: {
    flex: 1,
  },
  chatTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    marginBottom: 2,
  },
  chatSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    alignItems: 'flex-end',
  },
  ownMessage: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: SPACING.sm,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    minWidth: 60,
  },
  ownMessageBubble: {
    marginHorizontal: SPACING.sm,
  },
  messageBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  messageGradient: {
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.lg,
  },
  senderName: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    marginBottom: SPACING.xs,
    fontWeight: '600' as const,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.white,
  },
  messageTime: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: COLORS.gray200,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: 12,
    marginRight: 2,
  },
  reactionCount: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray300,
    fontWeight: '600' as const,
  },
  messageInputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageInputGradient: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageInputContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  attachButton: {
    padding: SPACING.sm,
  },
  messageInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendButtonActive: {
    backgroundColor: COLORS.cyan,
  },
});