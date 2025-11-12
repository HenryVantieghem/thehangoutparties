import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { securityManager, SecurityError, SecurityErrorType, DEFAULT_SECURITY_CONFIG, SecurityConfig } from '../security/SecurityManager';
import { useSecurityStatus, useAuthSecurity, useSessionMonitoring } from '../hooks/useSecurity';

// Security context interface
interface SecurityContextType {
  // Security status
  isSecurityReady: boolean;
  securityStatus: {
    hasActiveSession: boolean;
    isAccountLocked: boolean;
    sessionTimeRemaining: number;
    lastActivity: Date | null;
    deviceId: string | null;
  };
  
  // Authentication security
  authSecurity: {
    failedAttempts: number;
    isLocked: boolean;
    lockTimeRemaining: number;
    recordFailedAttempt: () => Promise<boolean>;
    clearFailedAttempts: () => Promise<void>;
  };
  
  // Session monitoring
  session: {
    isSessionExpired: boolean;
    timeRemaining: number;
    updateActivity: () => Promise<void>;
  };
  
  // Security configuration
  config: SecurityConfig;
  updateConfig: (config: Partial<SecurityConfig>) => void;
  
  // Security actions
  checkSecurityCompliance: () => Promise<SecurityComplianceReport>;
  handleSecurityError: (error: SecurityError) => void;
  
  // Emergency actions
  emergencyLockdown: () => Promise<void>;
  securityAuditLog: SecurityAuditEntry[];
}

// Security audit entry
export interface SecurityAuditEntry {
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;
  userId?: string;
}

// Security compliance report
export interface SecurityComplianceReport {
  overall: 'secure' | 'warning' | 'critical';
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation?: string;
  }>;
  score: number; // 0-100
  lastCheck: Date;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Security provider props
interface SecurityProviderProps {
  children: ReactNode;
  config?: Partial<SecurityConfig>;
  onSecurityAlert?: (error: SecurityError) => void;
  onSessionExpired?: () => void;
  onAccountLocked?: () => void;
  enableAuditLogging?: boolean;
  enableSecurityAlerts?: boolean;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  children,
  config: customConfig = {},
  onSecurityAlert,
  onSessionExpired,
  onAccountLocked,
  enableAuditLogging = true,
  enableSecurityAlerts = true,
}) => {
  // Security state
  const [isSecurityReady, setIsSecurityReady] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ...DEFAULT_SECURITY_CONFIG,
    ...customConfig,
  });
  const [auditLog, setAuditLog] = useState<SecurityAuditEntry[]>([]);

  // Security hooks
  const securityStatus = useSecurityStatus();
  const authSecurity = useAuthSecurity();
  const session = useSessionMonitoring();

  // Initialize security
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        // Update security manager config
        securityManager.updateConfig(securityConfig);
        
        // Wait for security manager to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsSecurityReady(true);
        
        if (enableAuditLogging) {
          addAuditEntry('security_initialized', 'low', 'Security system initialized');
        }
      } catch (error) {
        console.error('Failed to initialize security:', error);
        if (enableSecurityAlerts) {
          Alert.alert(
            'Security Error',
            'Failed to initialize security system. Some features may not work properly.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    initializeSecurity();
  }, [securityConfig, enableAuditLogging, enableSecurityAlerts]);

  // Handle session expiry
  useEffect(() => {
    if (session.isSessionExpired && isSecurityReady) {
      if (enableAuditLogging) {
        addAuditEntry('session_expired', 'medium', 'User session expired');
      }
      
      if (enableSecurityAlerts) {
        Alert.alert(
          'Session Expired',
          'Your session has expired for security reasons. Please sign in again.',
          [
            {
              text: 'Sign In',
              onPress: () => onSessionExpired?.(),
            },
          ],
          { cancelable: false }
        );
      } else {
        onSessionExpired?.();
      }
    }
  }, [session.isSessionExpired, isSecurityReady, enableAuditLogging, enableSecurityAlerts, onSessionExpired]);

  // Handle account lockout
  useEffect(() => {
    if (authSecurity.isLocked && isSecurityReady) {
      if (enableAuditLogging) {
        addAuditEntry(
          'account_locked',
          'high',
          `Account locked after ${authSecurity.failedAttempts} failed attempts`
        );
      }

      if (enableSecurityAlerts) {
        Alert.alert(
          'Account Locked',
          `Your account has been locked due to multiple failed login attempts. Please try again in ${authSecurity.lockTimeRemaining} minutes.`,
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
      
      onAccountLocked?.();
    }
  }, [authSecurity.isLocked, authSecurity.failedAttempts, authSecurity.lockTimeRemaining, isSecurityReady, enableAuditLogging, enableSecurityAlerts, onAccountLocked]);

  // Monitor app state for security
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (enableAuditLogging && isSecurityReady) {
        addAuditEntry(
          'app_state_change',
          'low',
          `App state changed to ${nextAppState}`
        );
      }

      if (nextAppState === 'active') {
        // App became active, update activity
        session.updateActivity();
      } else if (nextAppState === 'background') {
        // App went to background, consider security measures
        // Could implement auto-lock after background time
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [session, isSecurityReady, enableAuditLogging]);

  // Audit logging function
  const addAuditEntry = (
    event: string,
    severity: SecurityAuditEntry['severity'],
    details?: any,
    userId?: string
  ) => {
    if (!enableAuditLogging) return;

    const entry: SecurityAuditEntry = {
      timestamp: new Date(),
      event,
      severity,
      details,
      userId,
    };

    setAuditLog(prev => {
      const newLog = [...prev, entry];
      // Keep only last 1000 entries to prevent memory issues
      return newLog.slice(-1000);
    });
  };

  // Update security configuration
  const updateConfig = (config: Partial<SecurityConfig>) => {
    setSecurityConfig(prev => ({ ...prev, ...config }));
    securityManager.updateConfig(config);
    
    if (enableAuditLogging) {
      addAuditEntry('config_updated', 'medium', config);
    }
  };

  // Security compliance check
  const checkSecurityCompliance = async (): Promise<SecurityComplianceReport> => {
    const issues: SecurityComplianceReport['issues'] = [];
    let score = 100;

    try {
      // Check session status
      if (session.isSessionExpired) {
        issues.push({
          type: 'session',
          severity: 'high',
          message: 'Session has expired',
          recommendation: 'Sign in again to maintain security',
        });
        score -= 30;
      }

      // Check account lock status
      if (authSecurity.isLocked) {
        issues.push({
          type: 'authentication',
          severity: 'critical',
          message: 'Account is locked due to failed attempts',
          recommendation: 'Wait for lockout period to expire',
        });
        score -= 50;
      }

      // Check token validity
      const hasValidToken = securityStatus.hasActiveSession;
      if (!hasValidToken) {
        issues.push({
          type: 'authentication',
          severity: 'high',
          message: 'No valid authentication token',
          recommendation: 'Sign in to access secure features',
        });
        score -= 25;
      }

      // Check configuration security
      if (!securityConfig.requireHttps) {
        issues.push({
          type: 'configuration',
          severity: 'medium',
          message: 'HTTPS not enforced',
          recommendation: 'Enable HTTPS requirement for better security',
        });
        score -= 10;
      }

      if (securityConfig.sessionTimeout > 60) {
        issues.push({
          type: 'configuration',
          severity: 'low',
          message: 'Session timeout is too long',
          recommendation: 'Consider shorter session timeout for better security',
        });
        score -= 5;
      }

      // Determine overall status
      let overall: SecurityComplianceReport['overall'] = 'secure';
      if (issues.some(i => i.severity === 'critical')) {
        overall = 'critical';
      } else if (issues.some(i => i.severity === 'high')) {
        overall = 'warning';
      }

      const report: SecurityComplianceReport = {
        overall,
        issues,
        score: Math.max(0, score),
        lastCheck: new Date(),
      };

      if (enableAuditLogging) {
        addAuditEntry('compliance_check', 'low', { report });
      }

      return report;
    } catch (error) {
      if (enableAuditLogging) {
        addAuditEntry('compliance_check_failed', 'medium', { error });
      }

      return {
        overall: 'critical',
        issues: [{
          type: 'system',
          severity: 'critical',
          message: 'Failed to perform security compliance check',
        }],
        score: 0,
        lastCheck: new Date(),
      };
    }
  };

  // Handle security errors
  const handleSecurityError = (error: SecurityError) => {
    if (enableAuditLogging) {
      addAuditEntry(
        'security_error',
        error.type === SecurityErrorType.ACCOUNT_LOCKED ? 'critical' : 'high',
        {
          type: error.type,
          message: error.message,
          code: error.code,
        }
      );
    }

    if (enableSecurityAlerts) {
      // Handle different error types
      switch (error.type) {
        case SecurityErrorType.ACCOUNT_LOCKED:
          Alert.alert(
            'Account Locked',
            error.message,
            [{ text: 'OK' }],
            { cancelable: false }
          );
          break;
          
        case SecurityErrorType.SESSION_EXPIRED:
          Alert.alert(
            'Session Expired',
            error.message,
            [
              {
                text: 'Sign In Again',
                onPress: () => onSessionExpired?.(),
              },
            ],
            { cancelable: false }
          );
          break;
          
        case SecurityErrorType.VALIDATION_ERROR:
          // Validation errors are usually handled by form components
          break;
          
        default:
          Alert.alert(
            'Security Alert',
            error.message || 'A security issue occurred',
            [{ text: 'OK' }]
          );
      }
    }

    // Call external handler
    onSecurityAlert?.(error);
  };

  // Emergency lockdown
  const emergencyLockdown = async () => {
    try {
      if (enableAuditLogging) {
        addAuditEntry('emergency_lockdown', 'critical', 'Emergency lockdown initiated');
      }

      // Clear all tokens and sensitive data
      await securityManager.clearTokens();
      
      // Reset session
      await session.updateActivity();
      
      if (enableSecurityAlerts) {
        Alert.alert(
          'Emergency Lockdown',
          'All secure sessions have been terminated for security reasons. Please sign in again.',
          [
            {
              text: 'OK',
              onPress: () => onSessionExpired?.(),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Emergency lockdown failed:', error);
      
      if (enableAuditLogging) {
        addAuditEntry('emergency_lockdown_failed', 'critical', { error });
      }
    }
  };

  // Context value
  const contextValue: SecurityContextType = {
    isSecurityReady,
    securityStatus: securityStatus,
    authSecurity,
    session,
    config: securityConfig,
    updateConfig,
    checkSecurityCompliance,
    handleSecurityError,
    emergencyLockdown,
    securityAuditLog: auditLog,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

// Hook to use security context
export const useSecurityContext = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

// Higher-order component for secured components
export interface SecureComponentProps {
  requireAuth?: boolean;
  requireUnlockedAccount?: boolean;
  allowExpiredSession?: boolean;
  onSecurityFailure?: (reason: string) => void;
}

export function withSecurity<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  securityOptions: SecureComponentProps = {}
) {
  const {
    requireAuth = true,
    requireUnlockedAccount = true,
    allowExpiredSession = false,
    onSecurityFailure,
  } = securityOptions;

  return React.forwardRef<any, P>((props, ref) => {
    const security = useSecurityContext();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const checkAuthorization = () => {
        let authorized = true;
        let failureReason = '';

        // Check authentication requirement
        if (requireAuth && !security.securityStatus.hasActiveSession) {
          authorized = false;
          failureReason = 'Authentication required';
        }

        // Check account lock status
        if (requireUnlockedAccount && security.authSecurity.isLocked) {
          authorized = false;
          failureReason = 'Account is locked';
        }

        // Check session expiry
        if (!allowExpiredSession && security.session.isSessionExpired) {
          authorized = false;
          failureReason = 'Session has expired';
        }

        setIsAuthorized(authorized);

        if (!authorized && onSecurityFailure) {
          onSecurityFailure(failureReason);
        }
      };

      if (security.isSecurityReady) {
        checkAuthorization();
      }
    }, [
      security.isSecurityReady,
      security.securityStatus.hasActiveSession,
      security.authSecurity.isLocked,
      security.session.isSessionExpired,
      onSecurityFailure,
    ]);

    // Don't render component if not authorized
    if (!security.isSecurityReady || !isAuthorized) {
      return null;
    }

    return <WrappedComponent {...(props as P)} ref={ref} />;
  });
}

// Security status indicator component
export const SecurityStatusIndicator: React.FC<{
  style?: any;
  showDetails?: boolean;
}> = ({ style, showDetails = false }) => {
  const security = useSecurityContext();
  const [complianceReport, setComplianceReport] = useState<SecurityComplianceReport | null>(null);

  useEffect(() => {
    if (showDetails) {
      security.checkSecurityCompliance().then(setComplianceReport);
    }
  }, [security, showDetails]);

  if (!security.isSecurityReady) {
    return null; // Or loading indicator
  }

  // This would return a visual indicator component
  // For now, just return null as we'd need proper UI components
  return null;
};