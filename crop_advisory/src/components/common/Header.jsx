import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, User, Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
import { theme } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

const HeaderContainer = styled.header`
  background: ${theme.colors.background.primary};
  border-bottom: 1px solid ${theme.colors.border.light};
  box-shadow: ${theme.shadows.sm};
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.sticky};
  backdrop-filter: blur(10px);
`;

const HeaderContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 ${theme.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: between;
  height: 4rem;
  
  @media (min-width: ${theme.breakpoints.lg}) {
    padding: 0 ${theme.spacing[6]};
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  text-decoration: none;
  color: ${theme.colors.text.primary};
  font-family: ${theme.typography.fontFamily.secondary};
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.lg};
  
  &:hover {
    color: ${theme.colors.primary[600]};
  }
`;

const LogoIcon = styled.div`
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[700]} 100%);
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.sm};
`;

const Nav = styled.nav`
  display: none;
  align-items: center;
  gap: ${theme.spacing[8]};
  margin-left: auto;
  margin-right: ${theme.spacing[8]};
  
  @media (min-width: ${theme.breakpoints.md}) {
    display: flex;
  }
`;

const NavLink = styled(Link)`
  color: ${theme.colors.text.secondary};
  text-decoration: none;
  font-weight: ${theme.typography.fontWeight.medium};
  font-size: ${theme.typography.fontSize.sm};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.animations.transition.fast};
  position: relative;
  
  &:hover {
    color: ${theme.colors.primary[600]};
    background-color: ${theme.colors.primary[50]};
  }
  
  &.active {
    color: ${theme.colors.primary[600]};
    background-color: ${theme.colors.primary[100]};
  }
  
  &.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: ${theme.colors.primary[600]};
    border-radius: 50%;
  }
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: none;
  color: ${theme.colors.text.secondary};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${theme.animations.transition.fast};
  position: relative;
  
  &:hover {
    color: ${theme.colors.primary[600]};
    background-color: ${theme.colors.primary[50]};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 0.5rem;
  height: 0.5rem;
  background-color: ${theme.colors.error};
  border-radius: 50%;
  border: 2px solid ${theme.colors.background.primary};
`;

const MobileMenu = styled.div`
  display: block;
  
  @media (min-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: ${theme.zIndex.overlay};
  opacity: ${props => props.open ? 1 : 0};
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  transition: all ${theme.animations.transition.normal};
`;

const MobileMenuPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: ${theme.colors.background.primary};
  box-shadow: ${theme.shadows.xl};
  z-index: ${theme.zIndex.modal};
  transform: translateX(${props => props.open ? '0' : '100%'});
  transition: transform ${theme.animations.transition.normal};
  display: flex;
  flex-direction: column;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  padding: ${theme.spacing[4]};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

const MobileMenuNav = styled.nav`
  flex: 1;
  padding: ${theme.spacing[4]};
`;

const MobileNavLink = styled(Link)`
  display: block;
  color: ${theme.colors.text.primary};
  text-decoration: none;
  font-weight: ${theme.typography.fontWeight.medium};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing[2]};
  transition: all ${theme.animations.transition.fast};
  
  &:hover {
    background-color: ${theme.colors.primary[50]};
    color: ${theme.colors.primary[600]};
  }
  
  &.active {
    background-color: ${theme.colors.primary[100]};
    color: ${theme.colors.primary[700]};
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${theme.animations.transition.fast};
  
  &:hover {
    background-color: ${theme.colors.background.secondary};
  }
`;

const Avatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary[400]} 0%, ${theme.colors.primary[600]} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeight.semibold};
  font-size: ${theme.typography.fontSize.sm};
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
`;

const UserRole = styled.div`
  color: ${theme.colors.text.tertiary};
  font-size: ${theme.typography.fontSize.xs};
`;

const UserDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]};
  border: none;
  background: none;
  cursor: pointer;
  border-radius: ${theme.borderRadius.lg};
  transition: all ${theme.animations.transition.fast};
  
  &:hover {
    background-color: ${theme.colors.background.secondary};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${theme.spacing[2]};
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  min-width: 200px;
  z-index: ${theme.zIndex.dropdown};
  opacity: ${props => props.open ? 1 : 0};
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  transform: translateY(${props => props.open ? '0' : '-10px'});
  transition: all ${theme.animations.transition.fast};
`;

const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  width: 100%;
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  transition: all ${theme.animations.transition.fast};
  
  &:hover {
    background-color: ${theme.colors.background.secondary};
  }
  
  &:first-child {
    border-radius: ${theme.borderRadius.lg} ${theme.borderRadius.lg} 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 ${theme.borderRadius.lg} ${theme.borderRadius.lg};
  }
  
  &.danger {
    color: ${theme.colors.error};
    
    &:hover {
      background-color: ${theme.colors.error}10;
    }
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin: ${theme.spacing[2]} 0;
`;

const Header = ({ onLanguageChange, currentLanguage = 'en' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/crop-advisory', label: 'Crop Advisory' },
    { to: '/reverse-advisory', label: 'Growing Guide' },
    { to: '/ai-assistant', label: 'AI Assistant' },
    { to: '/analytics', label: 'Analytics' },
  ];

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <LogoIcon>🌱</LogoIcon>
          CropAdvisor Pro
        </Logo>

        <Nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </Nav>

        <UserActions>
          {isAuthenticated && user ? (
            <UserDropdown ref={dropdownRef}>
              <UserButton onClick={toggleUserDropdown}>
                <Avatar>
                  {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <ChevronDown size={14} />
              </UserButton>
              
              <DropdownMenu open={userDropdownOpen}>
                <DropdownItem onClick={() => setUserDropdownOpen(false)}>
                  <User size={16} />
                  Profile
                </DropdownItem>
                <DropdownItem onClick={() => setUserDropdownOpen(false)}>
                  <Settings size={16} />
                  Settings
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem onClick={handleLogout} className="danger">
                  <LogOut size={16} />
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </UserDropdown>
          ) : (
            <Button 
              size="sm" 
              variant="primary" 
              as={Link}
              to="/auth/login"
            >
              Sign In
            </Button>
          )}

          <MobileMenu>
            <IconButton onClick={toggleMobileMenu}>
              <Menu size={20} />
            </IconButton>
          </MobileMenu>
        </UserActions>
      </HeaderContent>

      {/* Mobile Menu */}
      <MobileMenuOverlay open={mobileMenuOpen} onClick={toggleMobileMenu} />
      <MobileMenuPanel open={mobileMenuOpen}>
        <MobileMenuHeader>
          <Logo to="/" onClick={toggleMobileMenu}>
            <LogoIcon>🌱</LogoIcon>
            CropAdvisor
          </Logo>
          <IconButton onClick={toggleMobileMenu}>
            <X size={20} />
          </IconButton>
        </MobileMenuHeader>

        <MobileMenuNav>
          {navItems.map((item) => (
            <MobileNavLink
              key={item.to}
              to={item.to}
              onClick={toggleMobileMenu}
            >
              {item.label}
            </MobileNavLink>
          ))}
        </MobileMenuNav>

        {isAuthenticated && user && (
          <div style={{ padding: '1rem', borderTop: `1px solid ${theme.colors.border.light}` }}>
            <UserProfile>
              <Avatar>
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <UserInfo>
                <UserName>{user.displayName || user.email || 'User'}</UserName>
                <UserRole>Farmer</UserRole>
              </UserInfo>
            </UserProfile>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              style={{ 
                width: '100%', 
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        )}
      </MobileMenuPanel>
    </HeaderContainer>
  );
};

export default Header;