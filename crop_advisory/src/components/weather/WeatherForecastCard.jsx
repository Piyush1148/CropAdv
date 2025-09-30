import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain,
  Sun,
  Cloud,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Loading from '../common/Loading';

const ForecastCard = styled(Card)`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  position: relative;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
  }
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

const ForecastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ForecastItem = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  text-align: center;
  transition: transform 0.2s ease, background 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ForecastDate = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const WeatherIcon = styled.div`
  font-size: 2rem;
  margin: 0.5rem 0;
`;

const Temperature = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const TemperatureRange = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const WeatherDetail = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.5rem;
`;

const ForecastSummary = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  margin-top: 1rem;
`;

const SummaryTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const SummaryLabel = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
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

// Format date for forecast
const formatForecastDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Calculate forecast summary
const calculateForecastSummary = (forecast) => {
  if (!forecast || !forecast.items || forecast.items.length === 0) {
    return null;
  }

  const items = forecast.items.slice(0, 5); // Next 5 days
  
  const temps = items.map(item => item.temperature).filter(Boolean);
  const humidities = items.map(item => item.humidity).filter(Boolean);
  const windSpeeds = items.map(item => item.wind_speed).filter(Boolean);
  
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
  const minTemp = temps.length > 0 ? Math.min(...temps) : null;
  const avgHumidity = humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : null;
  const avgWindSpeed = windSpeeds.length > 0 ? windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length : null;
  
  const rainyDays = items.filter(item => 
    item.condition && (item.condition.includes('rain') || item.condition.includes('drizzle'))
  ).length;

  return {
    avgTemp: avgTemp ? Math.round(avgTemp) : null,
    maxTemp: maxTemp ? Math.round(maxTemp) : null,
    minTemp: minTemp ? Math.round(minTemp) : null,
    avgHumidity: avgHumidity ? Math.round(avgHumidity) : null,
    avgWindSpeed: avgWindSpeed ? Math.round(avgWindSpeed * 10) / 10 : null,
    rainyDays,
    totalDays: items.length
  };
};

const WeatherForecastCard = ({ 
  forecast, 
  isLoading, 
  error, 
  onRefresh,
  compact = false 
}) => {
  if (isLoading) {
    return (
      <ForecastCard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Loading color="white" />
        </div>
      </ForecastCard>
    );
  }

  if (error) {
    return (
      <ForecastCard>
        <ErrorState>
          <AlertCircle size={48} />
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>Forecast Unavailable</h3>
          <p style={{ margin: '0 0 1rem 0', opacity: 0.8 }}>{error}</p>
          <Button onClick={onRefresh} variant="secondary" size="sm">
            Try Again
          </Button>
        </ErrorState>
      </ForecastCard>
    );
  }

  if (!forecast || !forecast.items || forecast.items.length === 0) {
    return (
      <ForecastCard>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <p>No forecast data available</p>
        </div>
      </ForecastCard>
    );
  }

  const displayItems = compact ? forecast.items.slice(0, 4) : forecast.items.slice(0, 7);
  const summary = calculateForecastSummary(forecast);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <ForecastCard>
        <CardHeader>
          <HeaderTitle>
            <Calendar size={24} />
            <h3>Weather Forecast</h3>
          </HeaderTitle>
          {onRefresh && (
            <RefreshButton onClick={onRefresh} size="sm">
              <RefreshCw size={16} />
            </RefreshButton>
          )}
        </CardHeader>

        <ForecastGrid>
          {displayItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ForecastItem>
                <ForecastDate>
                  {formatForecastDate(item.dt)}
                </ForecastDate>
                
                <WeatherIcon>
                  {getWeatherEmoji(item.condition)}
                </WeatherIcon>
                
                <Temperature>
                  {Math.round(item.temperature)}°C
                </Temperature>
                
                {item.temp_max && item.temp_min && (
                  <TemperatureRange>
                    <TrendingUp size={12} />
                    {Math.round(item.temp_max)}° 
                    <TrendingDown size={12} />
                    {Math.round(item.temp_min)}°
                  </TemperatureRange>
                )}

                <WeatherDetail>
                  <Droplets size={12} />
                  <span>{item.humidity}%</span>
                </WeatherDetail>
                
                {item.wind_speed && (
                  <WeatherDetail>
                    <Wind size={12} />
                    <span>{item.wind_speed} m/s</span>
                  </WeatherDetail>
                )}
              </ForecastItem>
            </motion.div>
          ))}
        </ForecastGrid>

        {summary && !compact && (
          <ForecastSummary>
            <SummaryTitle>
              <TrendingUp size={16} />
              5-Day Summary
            </SummaryTitle>
            <SummaryGrid>
              <SummaryItem>
                <SummaryValue>{summary.avgTemp}°C</SummaryValue>
                <SummaryLabel>Avg Temp</SummaryLabel>
              </SummaryItem>
              
              <SummaryItem>
                <SummaryValue>{summary.maxTemp}°/{summary.minTemp}°</SummaryValue>
                <SummaryLabel>High/Low</SummaryLabel>
              </SummaryItem>
              
              <SummaryItem>
                <SummaryValue>{summary.avgHumidity}%</SummaryValue>
                <SummaryLabel>Avg Humidity</SummaryLabel>
              </SummaryItem>
              
              <SummaryItem>
                <SummaryValue>{summary.rainyDays}/{summary.totalDays}</SummaryValue>
                <SummaryLabel>Rainy Days</SummaryLabel>
              </SummaryItem>
            </SummaryGrid>
          </ForecastSummary>
        )}
      </ForecastCard>
    </motion.div>
  );
};

export default WeatherForecastCard;