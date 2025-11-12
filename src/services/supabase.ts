// Mock Supabase service for demonstration
// Replace with actual Supabase implementation

export const supabaseService = {
  // Check if username is available
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    // Mock implementation - always return true for now
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock some taken usernames for demo
    const takenUsernames = ['admin', 'test', 'user', 'party', 'hangout'];
    return !takenUsernames.includes(username.toLowerCase());
  },

  // Update user profile
  updateProfile: async (updates: {
    username?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful update
    return {
      id: '1',
      ...updates,
      updated_at: new Date(),
    };
  },

  // Get user by ID
  getUser: async (userId: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: userId,
      username: 'mock_user',
      email: 'mock@example.com',
      bio: 'Mock user bio',
      avatar_url: null,
      created_at: new Date(),
    };
  },
};