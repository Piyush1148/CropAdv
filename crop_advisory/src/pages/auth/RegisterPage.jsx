import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, ArrowLeft, MapPin, User, Mail, Phone } from 'lucide-react';
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
  max-width: 500px;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  color: ${props => props.theme.colors.text.primary};
  transition: all 0.2s ease;
  min-height: 48px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[200]};
  }

  &.error {
    border-color: ${props => props.theme.colors.error};
  }

  option {
    padding: 0.5rem;
  }
`;

const SelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.5;
  cursor: pointer;
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

const FieldError = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    farmSize: '',
    soilType: '',
    irrigationType: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const soilTypes = [
    { value: '', label: 'Select soil type' },
    { value: 'clayey', label: 'Clayey' },
    { value: 'sandy', label: 'Sandy' },
    { value: 'loamy', label: 'Loamy' },
    { value: 'silty', label: 'Silty' },
    { value: 'peaty', label: 'Peaty' },
    { value: 'chalky', label: 'Chalky' },
  ];

  const irrigationTypes = [
    { value: '', label: 'Select irrigation type' },
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler' },
    { value: 'flood', label: 'Flood Irrigation' },
    { value: 'furrow', label: 'Furrow Irrigation' },
    { value: 'subsurface', label: 'Subsurface' },
    { value: 'rainfed', label: 'Rain-fed' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await register(formData);
    
    if (result.success) {
      navigate('/dashboard');
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
          <SidebarTitle>Join Our Community!</SidebarTitle>
          <SidebarSubtitle>
            Create your account and start your journey towards smarter, 
            more profitable farming with AI-powered insights.
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

              <AuthTitle>Create Account</AuthTitle>
              <AuthSubtitle>
                Fill in your details to get started
              </AuthSubtitle>

              {error && (
                <ErrorMessage>
                  {error}
                </ErrorMessage>
              )}

              <Form onSubmit={handleSubmit}>
                <FormRow>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={<User size={18} />}
                    required
                  />
                  
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    label="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    icon={<Mail size={18} />}
                    required
                  />
                </FormRow>

                <Input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  icon={<Phone size={18} />}
                  required
                />

                <FormRow>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Create password"
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

                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm password"
                      label="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                      required
                    />
                    <PasswordToggle
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </PasswordToggle>
                  </div>
                </FormRow>

                <Input
                  type="text"
                  name="location"
                  placeholder="e.g., Mumbai, Maharashtra"
                  label="Location"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  icon={<MapPin size={18} />}
                  required
                />

                <FormRow>
                  <Input
                    type="number"
                    name="farmSize"
                    placeholder="in acres"
                    label="Farm Size (Optional)"
                    value={formData.farmSize}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                  />

                  <SelectGroup>
                    <Label>Soil Type (Optional)</Label>
                    <Select
                      name="soilType"
                      value={formData.soilType}
                      onChange={handleChange}
                    >
                      {soilTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Select>
                  </SelectGroup>
                </FormRow>

                <SelectGroup>
                  <Label>Irrigation Type (Optional)</Label>
                  <Select
                    name="irrigationType"
                    value={formData.irrigationType}
                    onChange={handleChange}
                  >
                    {irrigationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </SelectGroup>

                <div>
                  <CheckboxLabel>
                    <Checkbox
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                    />
                    I agree to the{' '}
                    <Link to="/terms" style={{ color: '#22c55e' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" style={{ color: '#22c55e' }}>
                      Privacy Policy
                    </Link>
                  </CheckboxLabel>
                  {errors.agreeToTerms && (
                    <FieldError>{errors.agreeToTerms}</FieldError>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  style={{ width: '100%' }}
                >
                  Create Account
                </Button>
              </Form>

              <AuthFooter>
                Already have an account?{' '}
                <AuthLink to="/auth/login">
                  Sign in here
                </AuthLink>
              </AuthFooter>
            </Card.Body>
          </Card>
        </AuthCard>
      </AuthMain>
    </AuthContainer>
  );
};

export default RegisterPage;