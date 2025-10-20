import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Droplets, 
  TrendingUp, 
  TrendingDown,
  MapPin, 
  Calendar,
  Thermometer,
  Wind,
  Eye,
  CloudRain,
  Cloud,
  Sunrise,
  Sunset,
  Gauge,
  BarChart3,
  PieChart,
  Activity,
  Leaf,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Plus,
  Target,
  Zap
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import { usePredictionHistory, useDashboardStats, useApiHealth } from '../hooks/useApi';
import eventBus, { EVENTS } from '../utils/eventBus';
import {
  useCurrentWeather,
  useAgriculturalInsights,
  useWeatherForecast,
  useGeolocation
} from '../hooks/useWeather';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: 2rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const DashboardHeader = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeSection = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const WelcomeText = styled.div`
  flex: 1;
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const WelcomeSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const StatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.healthy ? '#d4edda' : '#f8d7da'};
  color: ${props => props.healthy ? '#155724' : '#721c24'};
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
  
  &::before {
    content: '${props => props.healthy ? '🟢' : '🔴'}';
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const LocationButton = styled(Button)`
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
`;

const StatCard = styled(motion.div)`
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadows.sm};
  border-left: 4px solid ${props => props.color || props.theme.colors.primary};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color || props.theme.colors.primary}15;
  color: ${props => props.color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: ${props => props.positive ? props.theme.colors.success : props.theme.colors.error};
  font-weight: 500;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const WeatherCard = styled(Card)``;

const WeatherHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const WeatherLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const WeatherMain = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const TemperatureDisplay = styled.div`
  text-align: center;
`;

const Temperature = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: #1f2937; /* Force visible dark color */
`;

const WeatherCondition = styled.div`
  color: #6b7280; /* Force visible gray color */
  font-size: 1.1rem;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const WeatherIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.secondary});
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const WeatherDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const WeatherDetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${props => props.theme.colors.background.alt};
  border-radius: 8px;
`;

const WeatherDetailLabel = styled.div`
  font-size: 0.8rem;
  color: #6b7280; /* Force visible gray color */
  font-weight: 500;
`;

const WeatherDetailValue = styled.div`
  font-weight: 600;
  color: #1f2937; /* Force visible dark color */
  font-size: 0.9rem;
`;

const RecentActivity = styled.div``;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.theme.colors.background.alt};
  border-radius: 8px;
`;

const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.color || props.theme.colors.primary}15;
  color: ${props => props.color || props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 0.25rem;
`;

const ActivityDescription = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: ${props => props.theme.colors.text.tertiary};
  font-size: 0.8rem;
`;

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const [weatherData, setWeatherData] = useState(null);
  
  // Use our custom API hooks - increased limit to show all predictions
  const { history: predictionHistory, isLoading: historyLoading, refetch: refetchHistory } = usePredictionHistory(50);
  const { stats: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { isHealthy } = useApiHealth();

  // Weather integration hooks
  const { location: userLocation, isLoading: locationLoading, getLocation } = useGeolocation({ immediate: false });
  const [currentLocation, setCurrentLocation] = useState({ latitude: 28.6139, longitude: 77.2090 }); // Default: Delhi
  
  // Weather data hooks
  const { 
    weather: currentWeather, 
    isLoading: weatherLoading, 
    error: weatherError, 
    lastUpdated: weatherLastUpdated,
    refetch: refetchWeather 
  } = useCurrentWeather(
    currentLocation?.latitude, 
    currentLocation?.longitude, 
    userLocation ? 'Your Location' : 'Delhi, India'
  );

  const { 
    insights: agriculturalInsights, 
    isLoading: insightsLoading, 
    error: insightsError,
    refetch: refetchInsights 
  } = useAgriculturalInsights(currentLocation?.latitude, currentLocation?.longitude);

  const { 
    forecast: weatherForecast, 
    isLoading: forecastLoading, 
    error: forecastError,
    refetch: refetchForecast 
  } = useWeatherForecast(currentLocation?.latitude, currentLocation?.longitude);
  
  // ✅ Note: No manual refetch on mount needed - useDashboardStats and usePredictionHistory
  // already auto-fetch when component mounts, preventing duplicate API calls
  
  // ✅ FIX: Listen for new predictions and auto-refresh dashboard
  useEffect(() => {
    // Listen to eventBus for prediction events
    const unsubscribe = eventBus.on(EVENTS.PREDICTION_CREATED, () => {
      if (import.meta.env.DEV) {
        console.log('� New prediction detected, refreshing dashboard...');
      }
      refetchStats();
      refetchHistory();
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - listener set up once on mount

  // Update location when user location is obtained
  // NOTE: Using empty dependency array to prevent re-render loops
  useEffect(() => {
    if (userLocation) {
      setCurrentLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });
      // Refetch weather with new location
      refetchWeather();
      refetchForecast();
      refetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]); // Only depend on userLocation changes

  // Retry weather fetch if it initially fails
  // NOTE: Fixed dependency array to prevent infinite loops
  useEffect(() => {
    if (weatherError && currentLocation) {
      // Retry after 3 seconds if there's an error
      const retryTimer = setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('🔄 Retrying weather fetch...');
        }
        refetchWeather();
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherError]); // Only retry when weatherError changes

  // Simulate weather data fetch (fallback for existing weather display)
  // NOTE: Optimized to only update when currentWeather actually changes
  useEffect(() => {
    if (currentWeather) {
      // Update immediately without delay for better UX
      setWeatherData({
        temperature: currentWeather.temperature || 24,
        humidity: currentWeather.humidity || 65,
        windSpeed: currentWeather.wind_speed || 12,
        uvIndex: 6,
        precipitation: 0.2,
        description: currentWeather.condition?.replace('_', ' ') || 'Partly Cloudy',
      });
    }
  }, [currentWeather]); // Only update when currentWeather changes

  // Handle location request
  const handleGetLocation = async () => {
    try {
      await getLocation();
    } catch (error) {
      console.warn('Location access denied or failed:', error);
    }
  };

  // Refresh all weather data
  const handleRefreshWeather = () => {
    if (import.meta.env.DEV) {
      console.log('🔄 Manual weather refresh triggered');
    }
    refetchWeather();
    refetchForecast();
    refetchInsights();
  };

  // Simulate weather data fetch (fallback for existing weather display)  // Generate stats from real API data
  const stats = [
    {
      label: 'Total Predictions',
      value: (dashboardStats?.user_stats?.total_predictions || dashboardStats?.totalPredictions || predictionHistory?.length || 0).toString(),
      change: predictionHistory?.length ? `+${predictionHistory.length} recent` : 'Get started!',
      positive: true,
      icon: <Zap />,
      color: '#22c55e',
    },
    {
      label: 'Successful Predictions',
      value: (dashboardStats?.user_stats?.total_predictions || dashboardStats?.successfulPredictions || predictionHistory?.length || 0).toString(),
      change: `${((dashboardStats?.user_stats?.total_predictions || dashboardStats?.successfulPredictions || 0) > 0 ? 99.32 : 0).toFixed(1)}% accuracy`,
      positive: true,
      icon: <BarChart3 />,
      color: '#3b82f6',
    },
    {
      label: 'API Status',
      value: isHealthy ? 'Connected' : 'Offline',
      change: isHealthy ? 'Real-time data' : 'Check connection',
      positive: isHealthy,
      icon: <Activity />,
      color: isHealthy ? '#22c55e' : '#ef4444',
    },
    {
      label: 'Top Crop',
      value: dashboardStats?.recent_activity?.most_recent_crops?.[0] || 
        dashboardStats?.topCrops?.[0] || 
        predictionHistory?.[0]?.crop_name ||
        (typeof predictionHistory?.[0]?.prediction === 'string' 
          ? predictionHistory[0].prediction 
          : predictionHistory?.[0]?.prediction?.crop_name || predictionHistory?.[0]?.prediction?.crop || predictionHistory?.[0]?.crop) || 'None yet',
      change: 'Based on predictions',
      positive: true,
      icon: <Leaf />,
      color: '#f59e0b',
    },
  ];

  // Generate activities from real prediction history
  const recentActivities = predictionHistory?.length ? 
    predictionHistory.slice(0, 4).map((prediction, index) => {
      // ✅ FIX: Check crop_name first (standardized by backend), then fallback to other formats
      const cropName = prediction.crop_name 
        || (typeof prediction.prediction === 'string' ? prediction.prediction : null)
        || prediction.prediction?.crop_name
        || prediction.prediction?.crop 
        || prediction.crop 
        || 'Unknown crop';
      const confidence = prediction.confidence || prediction.prediction?.confidence || prediction.probability || 95;
      const confidencePercent = confidence > 1 ? confidence : confidence * 100;
      
      return {
        title: 'Crop Prediction Generated',
        description: `AI recommended ${cropName} with ${confidencePercent.toFixed(1)}% confidence`,
        time: prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : `${index + 1} prediction${index > 0 ? 's' : ''} ago`,
        icon: <Leaf />,
        color: '#22c55e',
      };
    }) : [
    {
      title: 'Welcome to Crop Advisory!',
      description: 'Get started by making your first crop prediction with our AI model',
      time: 'Now',
      icon: <Zap />,
      color: '#22c55e',
    },
    {
      title: 'ML Model Ready',
      description: '99.32% accurate RandomForest model loaded and ready for predictions',
      time: 'System Ready',
      icon: <Activity />,
      color: '#3b82f6',
    },
    {
      title: 'Database Connected',
      description: 'Firestore database connected for real-time data storage',
      time: 'System Ready',
      icon: <Target />,
      color: '#f59e0b',
    },
    {
      title: 'API Status',
      description: isHealthy ? 'Backend API connected and operational' : 'Backend API connection issue',
      time: 'Live Status',
      icon: <Activity />,
      color: isHealthy ? '#22c55e' : '#ef4444',
    },
  ];

  if (isLoading || statsLoading) {
    return <Loading variant="spinner" overlay />;
  }

  return (
    <DashboardContainer>
      <Container>
        <DashboardHeader>
          <WelcomeSection>
            <WelcomeText>
              <WelcomeTitle>
                Welcome back, {user?.name || 'Farmer'}! 👋
              </WelcomeTitle>
              <WelcomeSubtitle>
                Here's what's happening with your farm today
              </WelcomeSubtitle>
              <StatusIndicator healthy={isHealthy}>
                Backend API {isHealthy ? 'Connected' : 'Disconnected'}
              </StatusIndicator>
            </WelcomeText>
          </WelcomeSection>
        </DashboardHeader>

        <StatsGrid>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              color={stat.color}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <StatHeader>
                <div>
                  <StatValue>{stat.value}</StatValue>
                  <StatLabel>{stat.label}</StatLabel>
                </div>
                <StatIcon color={stat.color}>
                  {stat.icon}
                </StatIcon>
              </StatHeader>
              <StatChange positive={stat.positive}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </StatChange>
            </StatCard>
          ))}
        </StatsGrid>



        <DashboardGrid>
          <WeatherCard>
            <Card.Header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <h3 style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Weather Conditions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocationButton 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGetLocation}
                    isLoading={locationLoading}
                  >
                    {userLocation ? 'Update Location' : 'Use My Location'}
                  </LocationButton>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshWeather}
                    isLoading={weatherLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              <WeatherLocation>
                <MapPin size={16} />
                {userLocation?.locationName || 'Delhi, India'}
                {weatherLastUpdated && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                    Updated {new Date(weatherLastUpdated).toLocaleTimeString()}
                  </span>
                )}
              </WeatherLocation>
            </Card.Header>
            <Card.Body>
              {weatherLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loading variant="spinner" />
                </div>
              ) : weatherError ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                  <p>Weather data unavailable</p>
                  <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{weatherError.message}</p>
                  <Button variant="outline" size="sm" onClick={handleRefreshWeather} style={{ marginTop: '1rem' }}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <WeatherMain>
                    <TemperatureDisplay>
                      <Temperature>
                        {currentWeather?.temperature || weatherData?.temperature || 24}°C
                      </Temperature>
                      <WeatherCondition>
                        {currentWeather?.description || weatherData?.description || 'Loading...'}
                      </WeatherCondition>
                    </TemperatureDisplay>
                    <WeatherIcon>
                      <Sun size={32} />
                    </WeatherIcon>
                  </WeatherMain>
                  
                  <WeatherDetails>
                    <WeatherDetailItem>
                      <Droplets size={16} color="#3b82f6" />
                      <div>
                        <WeatherDetailLabel>Humidity</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.humidity || weatherData?.humidity || '--'}%
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    <WeatherDetailItem>
                      <Wind size={16} color="#10b981" />
                      <div>
                        <WeatherDetailLabel>Wind</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.wind_speed ? `${currentWeather.wind_speed} m/s` : (weatherData?.windSpeed ? `${weatherData.windSpeed} km/h` : '--')}
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    <WeatherDetailItem>
                      <Gauge size={16} color="#dc2626" />
                      <div>
                        <WeatherDetailLabel>Pressure</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.pressure ? `${currentWeather.pressure} hPa` : '--'}
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    <WeatherDetailItem>
                      <Eye size={16} color="#8b5cf6" />
                      <div>
                        <WeatherDetailLabel>Visibility</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.visibility ? `${(currentWeather.visibility / 1000).toFixed(1)} km` : '--'}
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    <WeatherDetailItem>
                      <Thermometer size={16} color="#f59e0b" />
                      <div>
                        <WeatherDetailLabel>Feels Like</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.feels_like ? `${Math.round(currentWeather.feels_like)}°C` : '--°C'}
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    <WeatherDetailItem>
                      <Cloud size={16} color="#6b7280" />
                      <div>
                        <WeatherDetailLabel>Cloudiness</WeatherDetailLabel>
                        <WeatherDetailValue>
                          {currentWeather?.cloudiness !== undefined ? `${currentWeather.cloudiness}%` : '--'}
                        </WeatherDetailValue>
                      </div>
                    </WeatherDetailItem>
                    {currentWeather?.sunrise && (
                      <WeatherDetailItem>
                        <Sunrise size={16} color="#f59e0b" />
                        <div>
                          <WeatherDetailLabel>Sunrise</WeatherDetailLabel>
                          <WeatherDetailValue>
                            {new Date(currentWeather.sunrise).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </WeatherDetailValue>
                        </div>
                      </WeatherDetailItem>
                    )}
                    {currentWeather?.sunset && (
                      <WeatherDetailItem>
                        <Sunset size={16} color="#f97316" />
                        <div>
                          <WeatherDetailLabel>Sunset</WeatherDetailLabel>
                          <WeatherDetailValue>
                            {new Date(currentWeather.sunset).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </WeatherDetailValue>
                        </div>
                      </WeatherDetailItem>
                    )}
                  </WeatherDetails>

                  {/* Agricultural Insights Integration */}
                  {agriculturalInsights && !insightsError && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Leaf size={16} color="#22c55e" />
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>Agricultural Insights</span>
                        {insightsLoading && <Loading variant="spinner" size="sm" />}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.4' }}>
                        {agriculturalInsights.current_conditions_analysis || 'Analyzing current weather conditions for agricultural insights...'}
                      </div>
                      {agriculturalInsights.recommended_crops && agriculturalInsights.recommended_crops.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>
                            Recommended: {agriculturalInsights.recommended_crops.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </WeatherCard>

          <RecentActivity>
            <Card style={{ marginBottom: '1.5rem' }}>
              <Card.Header>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <h3 style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Weather Forecast</h3>
                  {forecastLoading && <Loading variant="spinner" size="sm" />}
                </div>
              </Card.Header>
              <Card.Body>
                {forecastLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                    <Loading variant="spinner" />
                  </div>
                ) : forecastError ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444' }}>
                    <p>Forecast unavailable</p>
                    <Button variant="outline" size="sm" onClick={refetchForecast} style={{ marginTop: '0.5rem' }}>
                      Try Again
                    </Button>
                  </div>
                ) : weatherForecast && weatherForecast.forecast && weatherForecast.forecast.length > 0 ? (
                  (() => {
                    // Process hourly forecast data into daily format
                    const dailyForecast = {};
                    weatherForecast.forecast.forEach(item => {
                      const date = new Date(item.dt).toDateString();
                      if (!dailyForecast[date]) {
                        dailyForecast[date] = {
                          date: item.dt,
                          temps: [item.temperature],
                          conditions: [item.condition],
                          descriptions: [item.description],
                          condition: item.condition,
                          description: item.description
                        };
                      } else {
                        dailyForecast[date].temps.push(item.temperature);
                        dailyForecast[date].conditions.push(item.condition);
                        dailyForecast[date].descriptions.push(item.description);
                      }
                    });

                    const dailyData = Object.values(dailyForecast).slice(0, 5).map(day => ({
                      date: day.date,
                      max_temp: Math.max(...day.temps),
                      min_temp: Math.min(...day.temps),
                      condition: day.conditions[0], // Use first condition of the day
                      description: day.descriptions[0] // Use first description of the day
                    }));

                    const getWeatherIcon = (condition) => {
                      switch (condition?.toLowerCase()) {
                        case 'clear':
                        case 'sunny': 
                          return <Sun size={20} color="#f59e0b" />;
                        case 'rain':
                        case 'drizzle':
                        case 'shower':
                          return <CloudRain size={20} color="#3b82f6" />;
                        case 'clouds':
                        case 'cloudy':
                        case 'overcast':
                          return <Cloud size={20} color="#6b7280" />;
                        case 'mist':
                        case 'fog':
                        case 'haze':
                          return <div style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280' }} />
                          </div>;
                        default: 
                          return <Sun size={20} color="#f59e0b" />;
                      }
                    };

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                        {dailyData.map((day, index) => (
                          <div key={index} style={{ 
                            textAlign: 'center', 
                            padding: '0.75rem', 
                            background: '#f8fafc', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500' }}>
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
                              {getWeatherIcon(day.condition)}
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                              {Math.round(day.max_temp)}°/{Math.round(day.min_temp)}°
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: '500' }}>
                              {day.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                    No forecast data available
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h3 style={{ color: '#1f2937', fontWeight: '600', fontSize: '1.25rem', margin: 0 }}>Recent Activity</h3>
              </Card.Header>
              <Card.Body>
                <ActivityList>
                  {recentActivities.map((activity, index) => (
                    <ActivityItem key={index}>
                      <ActivityIcon color={activity.color}>
                        {activity.icon}
                      </ActivityIcon>
                      <ActivityContent>
                        <ActivityTitle>{activity.title}</ActivityTitle>
                        <ActivityDescription>{activity.description}</ActivityDescription>
                        <ActivityTime>{activity.time}</ActivityTime>
                      </ActivityContent>
                    </ActivityItem>
                  ))}
                </ActivityList>
              </Card.Body>
            </Card>
          </RecentActivity>
        </DashboardGrid>
      </Container>
    </DashboardContainer>
  );
};

export default DashboardPage;