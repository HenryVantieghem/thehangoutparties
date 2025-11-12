import React, { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { usePartyStore } from '../stores';

/**
 * Hook to subscribe to real-time party updates
 */
export function usePartySubscription(partyId: string | null) {
  const subscribe = usePartyStore((state) => state.subscribe);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!partyId) return;

    channelRef.current = subscribe(partyId, (payload) => {
      // Updates handled by store
      console.log('Party update:', payload);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [partyId, subscribe]);
}

/**
 * Hook to subscribe to real-time photo updates for a party
 * TODO: Implement when photo store is created
 */
export function usePhotoSubscription(partyId: string | null) {
  // Placeholder - will be implemented when photo store is available
  useEffect(() => {
    if (!partyId) return;
    console.log('Photo subscription for party:', partyId);
  }, [partyId]);
}

/**
 * Hook to subscribe to real-time messages for a party
 * TODO: Implement when message store is created
 */
export function useMessageSubscription(partyId: string | null) {
  // Placeholder - will be implemented when message store is available
  useEffect(() => {
    if (!partyId) return;
    console.log('Message subscription for party:', partyId);
  }, [partyId]);
}

