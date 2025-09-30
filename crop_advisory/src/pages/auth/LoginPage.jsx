import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, ArrowLeft, Mail } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

const AuthContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[50]}, ${props => props.theme.colors.secondary[50]});
`;

const AuthSidebar = styled.div`
  flex: 1;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary[500]}, ${props => props.theme.colors.secondary[500]});
  padding: 3rem;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/api/placeholder/600/800') center/cover;
    opacity: 0.1;
  }
`;

const SidebarContent = styled.div`
  position: relative;
  z-index: 2;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 3rem;
`;

const SidebarTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.1;
`;

const SidebarSubtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.6;
`;

const AuthMain = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const AuthCard = styled(motion.div)`
  width: 100%;
  max-width: 450px;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.text.secondary};
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const AuthTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text.primary};
`;

const AuthSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0.5rem;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 36px;
  z-index: 2;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ForgotPassword = styled.button`
  color: ${props => props.theme.colors.primary[500]};
  text-decoration: none;
  font-size: 0.9rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: right;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    text-decoration: underline;
    background: ${props => props.theme.colors.primary[50]};
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: ${props => props.theme.shadows.lg};
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

const ModalMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  
  &.success {
    background: ${props => props.theme.colors.success}15;
    color: ${props => props.theme.colors.success};
  }
  
  &.error {
    background: ${props => props.theme.colors.error}15;
    color: ${props => props.theme.colors.error};
  }
`;

const AuthFooter = styled.div`
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text.secondary};
`;

const AuthLink = styled(Link)`
  color: ${props => props.theme.colors.primary[500]};
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.error}15;
  color: ${props => props.theme.colors.error};
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => props.theme.colors.error};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { login, resetPassword, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear auth error on change
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData);
    
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }
    
    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetMessage(result.message);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
        setResetEmail('');
      }, 3000);
    } else {
      setResetMessage(result.error);
    }
  };

  return (
    <AuthContainer>
      <AuthSidebar>
        <SidebarContent>
          <Logo>
            <Leaf size={32} />
            Crop Advisory
          </Logo>
          <SidebarTitle>Welcome Back!</SidebarTitle>
          <SidebarSubtitle>
            Sign in to access your personalized farming dashboard and continue 
            making data-driven decisions for your crops.
          </SidebarSubtitle>
        </SidebarContent>
      </AuthSidebar>

      <AuthMain>
        <AuthCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <Card.Body style={{ padding: '2.5rem' }}>
              <BackButton to="/">
                <ArrowLeft size={16} />
                Back to Home
              </BackButton>

              <AuthTitle>Sign In</AuthTitle>
              <AuthSubtitle>
                Enter your credentials to access your account
              </AuthSubtitle>

              {error && (
                <ErrorMessage>
                  {error}
                </ErrorMessage>
              )}

              <Form onSubmit={handleSubmit}>
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />

                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                  />
                  <PasswordToggle
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </PasswordToggle>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ForgotPassword 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </ForgotPassword>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  style={{ width: '100%' }}
                >
                  Sign In
                </Button>
              </Form>

              <AuthFooter>
                Don't have an account?{' '}
                <AuthLink to="/auth/register">
                  Sign up here
                </AuthLink>
              </AuthFooter>
            </Card.Body>
          </Card>
        </AuthCard>
      </AuthMain>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <Modal onClick={() => setShowForgotPassword(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Reset Password</ModalTitle>
            <form onSubmit={handleForgotPassword}>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                icon={<Mail size={18} />}
                required
              />
              {resetMessage && (
                <ModalMessage className={resetMessage.includes('sent') ? 'success' : 'error'}>
                  {resetMessage}
                </ModalMessage>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <Button type="submit" style={{ flex: 1 }}>
                  Send Reset Email
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetMessage('');
                    setResetEmail('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}
    </AuthContainer>
  );
};

export default LoginPage;