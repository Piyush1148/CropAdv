import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  TrendingUp, 
  Shield, 
  Globe, 
  ArrowRight, 
  Users,
  BarChart3,
  Sun,
  Droplets,
  Sprout,
  ChevronRight,
  Star
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

const HeroSection = styled.section`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.secondary} 100%);
  color: white;
  padding: 120px 0 80px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/api/placeholder/1920/1080') center/cover;
    opacity: 0.1;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
  text-align: center;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.1;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const HeroButtons = styled(motion.div)`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 3rem;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 1rem;
  background: rgba(93, 90, 90, 0.23);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const Section = styled.section`
  padding: 80px 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  color: ${props => props.theme.colors.text.primary};
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled(motion.div)`
  padding: 2rem;
  border-radius: 16px;
  background: white;
  box-shadow: ${props => props.theme.shadows.md};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: white;
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.primary};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const FeatureLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.primaryDark};
    transform: translateX(4px);
  }

  svg {
    margin-left: 0.5rem;
    width: 16px;
    height: 16px;
  }
`;

const TestimonialsSection = styled.section`
  background: ${props => props.theme.colors.background.alt};
  padding: 80px 0;
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const TestimonialCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const TestimonialText = styled.p`
  font-style: italic;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AuthorAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const AuthorRole = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const StarsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const CTASection = styled.section`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  color: white;
  padding: 80px 0;
  text-align: center;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const CTADescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Sprout />,
      title: 'AI Crop Advisory',
      description: 'Get personalized crop recommendations based on your soil conditions, weather patterns, and market trends.',
      link: '/crop-advisory',
    },
    {
      icon: <Sun />,
      title: 'Growing Guidance',
      description: 'Step-by-step guidance on how to grow specific crops with expert tips and best practices.',
      link: '/reverse-advisory',
    },
    {
      icon: <BarChart3 />,
      title: 'Smart Analytics',
      description: 'Track your farm performance, yield predictions, and profitability with detailed analytics.',
      link: '/dashboard',
    },
    {
      icon: <Droplets />,
      title: 'Weather Integration',
      description: 'Real-time weather data and forecasts tailored for agricultural decision making.',
      link: '/dashboard',
    },
    {
      icon: <TrendingUp />,
      title: 'Market Insights',
      description: 'Stay updated with market prices and demand trends for better crop planning.',
      link: '/dashboard',
    },
    {
      icon: <Globe />,
      title: 'Multi-language Support',
      description: 'Access the platform in your preferred language including Hindi, Marathi, and Tamil.',
      link: '/dashboard',
    },
  ];

  const testimonials = [
    {
      text: "This platform has transformed how I plan my crops. The AI recommendations helped me increase my yield by 30% last season.",
      author: "Rajesh Kumar",
      role: "Farmer, Maharashtra",
      rating: 5,
    },
    {
      text: "The weather integration and market insights are invaluable. I can make informed decisions about when to plant and harvest.",
      author: "Priya Sharma",
      role: "Agricultural Consultant",
      rating: 5,
    },
    {
      text: "Finally, a platform that understands Indian farming conditions. The multi-language support makes it accessible to all farmers.",
      author: "Murugan S",
      role: "Farmer, Tamil Nadu",
      rating: 5,
    },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth/login');
    }
  };

  return (
    <>
      <HeroSection>
        <HeroContent>
          <HeroTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
          >
            Smart Farming through Weather Driven Recommendations
          </HeroTitle>
          
          <HeroSubtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            A smart farming system that uses weather data to give farmers real-time advice for better crop management and resource use.
          </HeroSubtitle>

          <HeroButtons
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button size="lg" onClick={handleGetStarted}>
              Get Started <ArrowRight size={20} />
            </Button>
            
          </HeroButtons>

          <StatsContainer
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <StatCard>
              <StatNumber>0+</StatNumber>
              <StatLabel>Active Farmers</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>98%</StatNumber>
              <StatLabel>Accuracy Rate</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>20+</StatNumber>
              <StatLabel>Supported Crops</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>10+</StatNumber>
              <StatLabel>AI Languages Support</StatLabel>
            </StatCard>
          </StatsContainer>
        </HeroContent>
      </HeroSection>

      <Section>
        <Container>
          <SectionTitle>Everything You Need for Smart Farming</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <FeatureIcon>
                  {feature.icon}
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                <FeatureLink to={feature.link}>
                  Learn More <ChevronRight />
                </FeatureLink>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </Section>

      <TestimonialsSection>
        <Container>
          <SectionTitle>Trusted by Farmers Across India</SectionTitle>
          <TestimonialGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <StarsContainer>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" color="#fbbf24" />
                  ))}
                </StarsContainer>
                <TestimonialText>"{testimonial.text}"</TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar>
                    {testimonial.author.charAt(0)}
                  </AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>{testimonial.author}</AuthorName>
                    <AuthorRole>{testimonial.role}</AuthorRole>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
            ))}
          </TestimonialGrid>
        </Container>
      </TestimonialsSection>

      <CTASection>
        <Container>
          <CTATitle>Ready to Transform Your Farming?</CTATitle>
          <CTADescription>
            Join thousands of farmers who are already using AI to maximize their yields and profits.
          </CTADescription>
          <Button size="lg" variant="outline" onClick={handleGetStarted} style={{ color: 'white', borderColor: 'white' }}>
            Start Your Journey <ArrowRight size={20} />
          </Button>
        </Container>
      </CTASection>
    </>
  );
};

export default HomePage;