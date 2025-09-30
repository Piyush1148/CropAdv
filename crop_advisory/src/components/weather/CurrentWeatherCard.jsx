import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';

const WeatherCard = styled(Card)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
  min-height: 280px;
`;

const WeatherHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const LocationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
`;

const RefreshButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const TemperatureSection = styled.div`
  text-align: center;
  margin: 1.5rem 0;
`;

const Temperature = styled.div`
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
`;

const Condition = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  opacity: 0.9;
  text-transform: capitalize;
`;

const WeatherDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
`;

const DetailIcon = styled.div`
  margin-bottom: 0.5rem;
  opacity: 0.8;
`;

const DetailLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  color: #ff6b6b;
`;

const LastUpdated = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 1rem;
  justify-content: center;
`;

const StatusIcon = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: ${props => props.isOnline ? '#4ade80' : '#f87171'};
`;

// Weather condition to emoji mapping
const getWeatherEmoji = (condition) => {
  const conditionMap = {
    clear: '☀️',
    clouds: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    snow: '❄️',
    mist: '🌫️',
    fog: '🌫️',
    haze: '🌫️'
  };
  return conditionMap[condition?.toLowerCase()] || '🌤️';
};

const formatTime = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const CurrentWeatherCard = ({ 
  weather, 
  isLoading, 
  error, 
  lastUpdated, 
  onRefresh,
  location 
}) => {
  if (isLoading) {
    return (
      <WeatherCard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Loading color="white" />
        </div>
      </WeatherCard>
    );
  }

  if (error) {
    return (
      <WeatherCard>
        <ErrorState>
          <AlertCircle size={48} />
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>Weather Data Unavailable</h3>
          <p style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>{error}</p>
          <Button onClick={onRefresh} variant="secondary" size="sm">
            Try Again
          </Button>
        </ErrorState>
      </WeatherCard>
    );
  }

  if (!weather) {
    return (
      <WeatherCard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <p>No weather data available</p>
        </div>
      </WeatherCard>
    );
  }

  const isRealTimeData = weather.source !== 'mock_data';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <WeatherCard>
        <StatusIcon isOnline={isRealTimeData}>
          {isRealTimeData ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
        </StatusIcon>
        
        <WeatherHeader>
          <LocationInfo>
            <MapPin size={16} />
            <span>{weather.location || location || 'Unknown Location'}</span>
          </LocationInfo>
          <RefreshButton onClick={onRefresh} size="sm">
            <RefreshCw size={16} />
          </RefreshButton>
        </WeatherHeader>

        <TemperatureSection>
          <Temperature>
            {Math.round(weather.temperature)}°C
            <span style={{ fontSize: '2rem', marginLeft: '0.5rem' }}>
              {getWeatherEmoji(weather.condition)}
            </span>
          </Temperature>
          <Condition>
            {weather.condition ? weather.condition.replace('_', ' ') : 'Unknown'}
          </Condition>
        </TemperatureSection>

        <WeatherDetails>
          <DetailItem>
            <DetailIcon>
              <Droplets size={20} />
            </DetailIcon>
            <DetailLabel>Humidity</DetailLabel>
            <DetailValue>{weather.humidity}%</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailIcon>
              <Wind size={20} />
            </DetailIcon>
            <DetailLabel>Wind Speed</DetailLabel>
            <DetailValue>{weather.wind_speed} m/s</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailIcon>
              <Eye size={20} />
            </DetailIcon>
            <DetailLabel>Visibility</DetailLabel>
            <DetailValue>{weather.visibility ? `${weather.visibility / 1000} km` : 'N/A'}</DetailValue>
          </DetailItem>

          {weather.pressure && (
            <DetailItem>
              <DetailIcon>
                <Thermometer size={20} />
              </DetailIcon>
              <DetailLabel>Pressure</DetailLabel>
              <DetailValue>{weather.pressure} hPa</DetailValue>
            </DetailItem>
          )}
        </WeatherDetails>

        {lastUpdated && (
          <LastUpdated>
            <Calendar size={14} />
            <span>Updated {formatTime(lastUpdated)}</span>
          </LastUpdated>
        )}
      </WeatherCard>
    </motion.div>
  );
};

export default CurrentWeatherCard;