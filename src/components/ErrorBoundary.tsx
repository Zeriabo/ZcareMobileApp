/**
 * Error Boundary Component - Catches React errors and displays fallback UI
 */

import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.errorBox}>
            <Text style={styles.title}>⚠️ Oops! Something went wrong</Text>
            
            <Text style={styles.message}>
              The app encountered an error. Our team has been notified.
            </Text>

            {__DEV__ && this.state.error && (
              <>
                <Text style={styles.devTitle}>Dev Info:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={styles.stackText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  devTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeBlock: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Courier New',
    fontSize: 11,
    lineHeight: 16,
  },
  stackText: {
    color: '#9CA3AF',
    fontFamily: 'Courier New',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ErrorBoundary;
