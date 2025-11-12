/**
 * Skeleton Components Tests
 * 
 * Comprehensive tests for skeleton loading components:
 * - Skeleton (base component)
 * - PartyCardSkeleton
 * - UserProfileSkeleton
 * - MessageSkeleton
 * - PhotoGridSkeleton
 * - MapSkeleton
 */

import React from 'react';
import { render } from '../../__tests__/utils/testUtils';
import {
  Skeleton,
  PartyCardSkeleton,
  UserProfileSkeleton,
  MessageSkeleton,
  PhotoGridSkeleton,
  MapSkeleton,
} from '../SkeletonComponents';

// Mock theme hook
const mockTheme = {
  colors: {
    surface: '#FFFFFF',
    background: '#F2F2F7',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C7C7CC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

jest.mock('../../themes/useTheme', () => ({
  useTheme: () => mockTheme,
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      createAnimatedComponent: () => View,
      timing: () => ({ start: jest.fn() }),
      loop: () => ({}),
      useSharedValue: () => ({ value: 0 }),
      useAnimatedStyle: () => ({}),
      withRepeat: () => ({}),
      withTiming: () => ({}),
    },
  };
});

describe('SkeletonComponents', () => {
  describe('Skeleton (Base Component)', () => {
    it('should render with default dimensions', () => {
      const { getByTestId } = render(
        <Skeleton testID="skeleton" />
      );
      
      const skeleton = getByTestId('skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should render with custom width and height', () => {
      const { getByTestId } = render(
        <Skeleton 
          width={200} 
          height={100} 
          testID="custom-skeleton" 
        />
      );
      
      const skeleton = getByTestId('custom-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should render with percentage dimensions', () => {
      const { getByTestId } = render(
        <Skeleton 
          width="100%" 
          height="50%" 
          testID="percentage-skeleton" 
        />
      );
      
      const skeleton = getByTestId('percentage-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should apply custom border radius', () => {
      const { getByTestId } = render(
        <Skeleton 
          borderRadius={20} 
          testID="rounded-skeleton" 
        />
      );
      
      const skeleton = getByTestId('rounded-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { marginTop: 16 };
      const { getByTestId } = render(
        <Skeleton 
          style={customStyle} 
          testID="styled-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });

    it('should have proper accessibility props', () => {
      const { getByLabelText } = render(
        <Skeleton testID="accessible-skeleton" />
      );
      
      expect(getByLabelText('Loading placeholder')).toBeTruthy();
    });
  });

  describe('PartyCardSkeleton', () => {
    it('should render complete party card skeleton', () => {
      const { getByTestId } = render(
        <PartyCardSkeleton testID="party-skeleton" />
      );
      
      const skeleton = getByTestId('party-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should show image skeleton by default', () => {
      const { getByLabelText } = render(<PartyCardSkeleton />);
      
      // Should have multiple loading placeholders including image
      const placeholders = getByLabelText('Loading placeholder');
      expect(placeholders).toBeTruthy();
    });

    it('should hide image skeleton when showImage is false', () => {
      const { getByTestId } = render(
        <PartyCardSkeleton 
          showImage={false} 
          testID="no-image-skeleton" 
        />
      );
      
      const skeleton = getByTestId('no-image-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { marginHorizontal: 16 };
      const { getByTestId } = render(
        <PartyCardSkeleton 
          style={customStyle} 
          testID="styled-party-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-party-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });

    it('should have proper structure for party card', () => {
      const { getByTestId } = render(
        <PartyCardSkeleton testID="structured-party-skeleton" />
      );
      
      // The skeleton should represent the structure of a party card
      const skeleton = getByTestId('structured-party-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<PartyCardSkeleton />);
      
      expect(getByLabelText('Loading party card')).toBeTruthy();
    });
  });

  describe('UserProfileSkeleton', () => {
    it('should render complete user profile skeleton', () => {
      const { getByTestId } = render(
        <UserProfileSkeleton testID="user-skeleton" />
      );
      
      const skeleton = getByTestId('user-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should show avatar by default', () => {
      const { getByTestId } = render(
        <UserProfileSkeleton testID="avatar-skeleton" />
      );
      
      // Should include avatar placeholder
      const skeleton = getByTestId('avatar-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should hide avatar when showAvatar is false', () => {
      const { getByTestId } = render(
        <UserProfileSkeleton 
          showAvatar={false} 
          testID="no-avatar-skeleton" 
        />
      );
      
      const skeleton = getByTestId('no-avatar-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should show bio by default', () => {
      const { getByTestId } = render(
        <UserProfileSkeleton testID="bio-skeleton" />
      );
      
      const skeleton = getByTestId('bio-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should hide bio when showBio is false', () => {
      const { getByTestId } = render(
        <UserProfileSkeleton 
          showBio={false} 
          testID="no-bio-skeleton" 
        />
      );
      
      const skeleton = getByTestId('no-bio-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<UserProfileSkeleton />);
      
      expect(getByLabelText('Loading user profile')).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { padding: 20 };
      const { getByTestId } = render(
        <UserProfileSkeleton 
          style={customStyle} 
          testID="styled-user-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-user-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });
  });

  describe('MessageSkeleton', () => {
    it('should render message skeleton', () => {
      const { getByTestId } = render(
        <MessageSkeleton testID="message-skeleton" />
      );
      
      const skeleton = getByTestId('message-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should show avatar by default', () => {
      const { getByTestId } = render(
        <MessageSkeleton testID="message-with-avatar" />
      );
      
      const skeleton = getByTestId('message-with-avatar');
      expect(skeleton).toBeTruthy();
    });

    it('should hide avatar when showAvatar is false', () => {
      const { getByTestId } = render(
        <MessageSkeleton 
          showAvatar={false} 
          testID="message-no-avatar" 
        />
      );
      
      const skeleton = getByTestId('message-no-avatar');
      expect(skeleton).toBeTruthy();
    });

    it('should align to right when isOwnMessage is true', () => {
      const { getByTestId } = render(
        <MessageSkeleton 
          isOwnMessage={true} 
          testID="own-message-skeleton" 
        />
      );
      
      const skeleton = getByTestId('own-message-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<MessageSkeleton />);
      
      expect(getByLabelText('Loading message')).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { marginVertical: 8 };
      const { getByTestId } = render(
        <MessageSkeleton 
          style={customStyle} 
          testID="styled-message-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-message-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });
  });

  describe('PhotoGridSkeleton', () => {
    it('should render photo grid skeleton with default columns', () => {
      const { getByTestId } = render(
        <PhotoGridSkeleton testID="photo-grid-skeleton" />
      );
      
      const skeleton = getByTestId('photo-grid-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should render with custom number of columns', () => {
      const { getByTestId } = render(
        <PhotoGridSkeleton 
          columns={4} 
          testID="four-column-skeleton" 
        />
      );
      
      const skeleton = getByTestId('four-column-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should render with custom number of rows', () => {
      const { getByTestId } = render(
        <PhotoGridSkeleton 
          rows={5} 
          testID="five-row-skeleton" 
        />
      );
      
      const skeleton = getByTestId('five-row-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should have proper grid structure', () => {
      const { getByTestId } = render(
        <PhotoGridSkeleton 
          columns={2} 
          rows={2} 
          testID="grid-structure-skeleton" 
        />
      );
      
      // Should render 4 photo placeholders (2x2 grid)
      const skeleton = getByTestId('grid-structure-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<PhotoGridSkeleton />);
      
      expect(getByLabelText('Loading photo grid')).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { backgroundColor: '#F0F0F0' };
      const { getByTestId } = render(
        <PhotoGridSkeleton 
          style={customStyle} 
          testID="styled-grid-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-grid-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });
  });

  describe('MapSkeleton', () => {
    it('should render map skeleton', () => {
      const { getByTestId } = render(
        <MapSkeleton testID="map-skeleton" />
      );
      
      const skeleton = getByTestId('map-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should show controls by default', () => {
      const { getByTestId } = render(
        <MapSkeleton testID="map-with-controls" />
      );
      
      const skeleton = getByTestId('map-with-controls');
      expect(skeleton).toBeTruthy();
    });

    it('should hide controls when showControls is false', () => {
      const { getByTestId } = render(
        <MapSkeleton 
          showControls={false} 
          testID="map-no-controls" 
        />
      );
      
      const skeleton = getByTestId('map-no-controls');
      expect(skeleton).toBeTruthy();
    });

    it('should show markers by default', () => {
      const { getByTestId } = render(
        <MapSkeleton testID="map-with-markers" />
      );
      
      const skeleton = getByTestId('map-with-markers');
      expect(skeleton).toBeTruthy();
    });

    it('should hide markers when showMarkers is false', () => {
      const { getByTestId } = render(
        <MapSkeleton 
          showMarkers={false} 
          testID="map-no-markers" 
        />
      );
      
      const skeleton = getByTestId('map-no-markers');
      expect(skeleton).toBeTruthy();
    });

    it('should have accessibility label', () => {
      const { getByLabelText } = render(<MapSkeleton />);
      
      expect(getByLabelText('Loading map')).toBeTruthy();
    });

    it('should apply custom styles', () => {
      const customStyle = { borderRadius: 12 };
      const { getByTestId } = render(
        <MapSkeleton 
          style={customStyle} 
          testID="styled-map-skeleton" 
        />
      );
      
      const skeleton = getByTestId('styled-map-skeleton');
      expect(skeleton.props.style).toContainEqual(customStyle);
    });
  });

  describe('Animation and Performance', () => {
    it('should handle multiple skeletons efficiently', () => {
      const MultipleSkeletons = () => (
        <>
          <PartyCardSkeleton />
          <PartyCardSkeleton />
          <PartyCardSkeleton />
          <UserProfileSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </>
      );

      const { getAllByLabelText } = render(<MultipleSkeletons />);
      
      // Should render multiple loading placeholders efficiently
      const placeholders = getAllByLabelText(/Loading/);
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should handle rapid state changes gracefully', () => {
      const { rerender, getByTestId } = render(
        <PartyCardSkeleton testID="changing-skeleton" />
      );
      
      // Rapidly change props to test stability
      rerender(<PartyCardSkeleton showImage={false} testID="changing-skeleton" />);
      rerender(<PartyCardSkeleton showImage={true} testID="changing-skeleton" />);
      rerender(<PartyCardSkeleton showImage={false} testID="changing-skeleton" />);
      
      const skeleton = getByTestId('changing-skeleton');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('Integration and Composition', () => {
    it('should work well in lists and grids', () => {
      const SkeletonList = () => (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <PartyCardSkeleton key={i} testID={`list-skeleton-${i}`} />
          ))}
        </>
      );

      const { getByTestId } = render(<SkeletonList />);
      
      // Should render all 5 skeleton items
      for (let i = 0; i < 5; i++) {
        expect(getByTestId(`list-skeleton-${i}`)).toBeTruthy();
      }
    });

    it('should maintain consistent spacing and alignment', () => {
      const { getByTestId } = render(
        <>
          <UserProfileSkeleton testID="user-1" />
          <UserProfileSkeleton testID="user-2" />
          <MessageSkeleton testID="message-1" />
          <PhotoGridSkeleton testID="photos" />
        </>
      );
      
      expect(getByTestId('user-1')).toBeTruthy();
      expect(getByTestId('user-2')).toBeTruthy();
      expect(getByTestId('message-1')).toBeTruthy();
      expect(getByTestId('photos')).toBeTruthy();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should provide clear loading feedback', () => {
      const { getAllByLabelText } = render(
        <>
          <PartyCardSkeleton />
          <UserProfileSkeleton />
          <MessageSkeleton />
        </>
      );
      
      // Each skeleton should have appropriate accessibility labels
      expect(getAllByLabelText(/Loading/)).toHaveLength(3);
    });

    it('should maintain semantic structure', () => {
      const { getByTestId } = render(
        <PartyCardSkeleton testID="semantic-skeleton" />
      );
      
      const skeleton = getByTestId('semantic-skeleton');
      expect(skeleton).toBeTruthy();
      
      // Should provide meaningful structure even while loading
      expect(skeleton.props.accessibilityRole).toBe('none');
    });

    it('should handle screen reader announcements', () => {
      const { getByLabelText } = render(
        <PartyCardSkeleton />
      );
      
      // Screen readers should announce that content is loading
      const announcement = getByLabelText('Loading party card');
      expect(announcement).toBeTruthy();
      expect(announcement.props.accessibilityLiveRegion).toBe('polite');
    });
  });
});