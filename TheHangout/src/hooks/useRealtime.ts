import React, { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { usePartyStore, usePhotoStore, useMessageStore } from '../stores';

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
 */
export function usePhotoSubscription(partyId: string | null) {
  const subscribe = usePhotoStore((state) => state.subscribe);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!partyId) return;

    channelRef.current = subscribe(partyId, (payload) => {
      // Updates handled by store
      console.log('Photo update:', payload);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [partyId, subscribe]);
}

/**
 * Hook to subscribe to real-time messages for a party
 */
export function useMessageSubscription(partyId: string | null) {
  const subscribe = useMessageStore((state) => state.subscribe);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!partyId) return;

    channelRef.current = subscribe(partyId, (payload) => {
      // Updates handled by store
      console.log('Message update:', payload);
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [partyId, subscribe]);
}

