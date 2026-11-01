import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FBF7F8',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          padding: '24px',
          color: '#29243A'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(41, 36, 58, 0.08)',
            border: '1px solid #E9E2E7',
            padding: '36px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#F8E5E8',
              color: '#AD4656',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: '0 0 10px 0',
              color: '#29243A'
            }}>
              Something went wrong loading this page
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#6B6875',
              lineHeight: 1.6,
              margin: '0 0 24px 0'
            }}>
              {this.state.error?.message || 'An unexpected rendering error occurred. The application remains running.'}
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #405F75 0%, #29243A 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={16} /> Reload Page
              </button>

              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#F0F5F8',
                  color: '#405F75',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Home size={16} /> Back to Dashboard
              </a>
            </div>

            {this.state.error?.stack && (
              <details style={{ marginTop: '24px', textAlign: 'left', fontSize: '11px', color: '#946323' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical Details</summary>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: '#F8EEDB',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  maxHeight: '160px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

