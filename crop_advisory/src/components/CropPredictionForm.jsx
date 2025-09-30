/**
 * Crop Recommendation Form Component
 * Professional form for soil data input and ML-powered crop predictions
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Leaf, Cloud, Thermometer, Droplets, Activity, BarChart3, Loader2, CheckCircle, AlertCircle, MapPin, Zap, RefreshCw } from 'lucide-react';
import { useCropPrediction } from '../hooks/useApi';
import { useWeatherEnhancedPrediction, useGeolocation, useCurrentWeather } from '../hooks/useWeather';
import toast from 'react-hot-toast';

const FormContainer = styled.div`
  background: linear-gradient(135deg, #f8fdf9 0%, #e8f5e8 100%);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #2d5016;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    color: #4caf50;
  }
`;

const Subtitle = styled.p`
  color: #5d7c47;
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2d5016;
  font-weight: 600;
  font-size: 0.95rem;

  svg {
    color: #4caf50;
    width: 18px;
    height: 18px;
  }
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #d4e7d4;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }

  &:invalid {
    border-color: #f44336;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const PredictButton = styled.button`
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(76, 175, 80, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultContainer = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  border: 2px solid #4caf50;
  box-shadow: 0 10px 30px rgba(76, 175, 80, 0.1);
`;

const ResultTitle = styled.h3`
  color: #2d5016;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #4caf50;
  }
`;

const CropRecommendation = styled.div`
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
`;

const CropName = styled.h4`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-transform: capitalize;
`;

const Confidence = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;

  .percentage {
    font-size: 1.3rem;
    font-weight: 700;
  }
`;

const MetaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const MetaItem = styled.div`
  padding: 1rem;
  background: #f8fdf9;
  border-radius: 8px;
  
  .label {
    color: #5d7c47;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .value {
    color: #2d5016;
    font-weight: 600;
  }
`;

const ErrorContainer = styled.div`
  background: #ffebee;
  border: 2px solid #f44336;
  color: #c62828;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WeatherEnhancementSection = styled.div`
  background: ${props => props.enabled ? 
    'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 
    'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
  };
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 2px solid ${props => props.enabled ? '#22c55e' : '#e5e7eb'};
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const WeatherToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ToggleSwitch = styled.button`
  position: relative;
  width: 60px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: ${props => props.active ? '#22c55e' : '#d1d5db'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#16a34a' : '#9ca3af'};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.active ? '30px' : '2px'};
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  }
`;

const WeatherToggleLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${props => props.enabled ? '#15803d' : '#6b7280'};

  svg {
    color: ${props => props.enabled ? '#22c55e' : '#9ca3af'};
  }
`;

const LocationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
`;

const LocationInfo = styled.div`
  flex: 1;
  
  .location-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  .location-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
  }
`;

const LocationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const WeatherInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const WeatherInfoItem = styled.div`
  text-align: center;
  padding: 1rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
  
  .weather-icon {
    color: #3b82f6;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: center;
  }
  
  .weather-label {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }
  
  .weather-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.95rem;
  }
`;

const CropPredictionForm = () => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    location: ''
  });
  const [useWeatherData, setUseWeatherData] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 28.6139, longitude: 77.2090 });

  const { prediction, isLoading, error, predictCrop, clearPrediction } = useCropPrediction();
  const { getEnhancedPrediction, isLoading: weatherEnhancing, error: weatherError } = useWeatherEnhancedPrediction();
  const { location: userLocation, isLoading: locationLoading, getLocation } = useGeolocation({ immediate: false });
  
  // Add current weather data fetching
  const { 
    weather: currentWeather, 
    isLoading: weatherLoading, 
    error: currentWeatherError 
  } = useCurrentWeather(
    userLocation?.latitude || currentLocation.latitude,
    userLocation?.longitude || currentLocation.longitude
  );

  // Update current location when user location is obtained
  useEffect(() => {
    if (userLocation) {
      setCurrentLocation({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      });
    }
  }, [userLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let predictionData = { ...formData };
      
      if (useWeatherData) {
        // Enhance prediction with real-time weather data
        toast.loading('Enhancing prediction with real-time weather data...', { duration: 2000 });
        
        const enhancedData = await getEnhancedPrediction(
          formData, 
          userLocation?.latitude || currentLocation.latitude, 
          userLocation?.longitude || currentLocation.longitude
        );
        predictionData = enhancedData;
        toast.success('Weather data integrated successfully!');
      }
      
      const result = await predictCrop(predictionData);
      toast.success(useWeatherData ? 
        'Weather-enhanced prediction completed!' : 
        'Crop prediction completed!'
      );
      console.log('Prediction result:', result);
    } catch (error) {
      toast.error(error.message || 'Prediction failed');
    }
  };

  const handleGetLocation = async () => {
    try {
      await getLocation();
      toast.success('Location updated successfully!');
    } catch (error) {
      toast.error('Failed to get location: ' + error.message);
    }
  };

  const handleToggleWeatherEnhancement = () => {
    setUseWeatherData(!useWeatherData);
    if (!useWeatherData) {
      toast.success('Weather enhancement enabled! Your prediction will use real-time weather data.');
    } else {
      toast('Weather enhancement disabled. Using manual weather inputs.');
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

  return (
    <FormContainer>
      <Title>
        <Leaf />
        Crop Recommendation
      </Title>
      <Subtitle>
        Enter your soil and environmental data to get AI-powered crop recommendations with 99.32% accuracy
      </Subtitle>

      {/* Weather Enhancement Section */}
      <WeatherEnhancementSection enabled={useWeatherData}>
        <WeatherToggle>
          <WeatherToggleLabel enabled={useWeatherData}>
            <Cloud />
            Weather-Enhanced Prediction
          </WeatherToggleLabel>
          <ToggleSwitch 
            active={useWeatherData} 
            onClick={handleToggleWeatherEnhancement}
            type="button"
          />
        </WeatherToggle>
        
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#555' }}>
          {useWeatherData 
            ? '🌤️ Real-time weather data will automatically enhance your prediction accuracy'
            : '⭐ Enable weather enhancement to use real-time temperature, humidity, and rainfall data'
          }
        </p>

        {useWeatherData && (
          <LocationSection>
            <LocationInfo>
              <div className="location-label">Prediction Location</div>
              <div className="location-value">
                {userLocation?.locationName || 
                 `Delhi, India (${currentLocation.latitude.toFixed(2)}, ${currentLocation.longitude.toFixed(2)})`
                }
              </div>
            </LocationInfo>
            <LocationButton 
              onClick={handleGetLocation} 
              disabled={locationLoading}
              type="button"
            >
              {locationLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {userLocation ? 'Update Location' : 'Use My Location'}
            </LocationButton>
          </LocationSection>
        )}

        {useWeatherData && (
          <WeatherInfoGrid>
            <WeatherInfoItem>
              <div className="weather-icon">
                <Thermometer size={20} />
              </div>
              <div className="weather-label">Temperature</div>
              <div className="weather-value">
                {weatherLoading ? 'Loading...' : 
                 currentWeatherError ? '--°C' :
                 currentWeather?.temperature ? `${Math.round(currentWeather.temperature)}°C` : 'Real-time'
                }
              </div>
            </WeatherInfoItem>
            <WeatherInfoItem>
              <div className="weather-icon">
                <Droplets size={20} />
              </div>
              <div className="weather-label">Humidity</div>
              <div className="weather-value">
                {weatherLoading ? 'Loading...' : 
                 currentWeatherError ? '--%' :
                 currentWeather?.humidity ? `${currentWeather.humidity}%` : 'Live data'
                }
              </div>
            </WeatherInfoItem>
            <WeatherInfoItem>
              <div className="weather-icon">
                <Cloud size={20} />
              </div>
              <div className="weather-label">Rainfall</div>
              <div className="weather-value">
                {weatherLoading ? 'Loading...' : 
                 currentWeatherError ? '--mm' :
                 (currentWeather?.rain_1h || currentWeather?.rain_3h) ? 
                   `${currentWeather.rain_1h || currentWeather.rain_3h}mm` : 
                   '0mm'
                }
              </div>
            </WeatherInfoItem>
          </WeatherInfoGrid>
        )}
      </WeatherEnhancementSection>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>
            <Activity />
            Nitrogen (N) - kg/ha
          </Label>
          <Input
            type="number"
            name="N"
            value={formData.N}
            onChange={handleChange}
            placeholder="Enter nitrogen content (0-300)"
            min="0"
            max="300"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <Activity />
            Phosphorus (P) - kg/ha
          </Label>
          <Input
            type="number"
            name="P"
            value={formData.P}
            onChange={handleChange}
            placeholder="Enter phosphorus content (0-300)"
            min="0"
            max="300"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <Activity />
            Potassium (K) - kg/ha
          </Label>
          <Input
            type="number"
            name="K"
            value={formData.K}
            onChange={handleChange}
            placeholder="Enter potassium content (0-300)"
            min="0"
            max="300"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <MapPin />
            Village/City
          </Label>
          <Input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Enter your village or city name"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <Thermometer />
            Temperature - °C
          </Label>
          <Input
            type="number"
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            placeholder="Average temperature (-10 to 60°C)"
            min="-10"
            max="60"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <Droplets />
            Humidity - %
          </Label>
          <Input
            type="number"
            name="humidity"
            value={formData.humidity}
            onChange={handleChange}
            placeholder="Relative humidity (0-100%)"
            min="0"
            max="100"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <BarChart3 />
            pH Level
          </Label>
          <Input
            type="number"
            name="ph"
            value={formData.ph}
            onChange={handleChange}
            placeholder="Soil pH (0-14)"
            min="0"
            max="14"
            step="0.1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>
            <Cloud />
            Rainfall - mm
          </Label>
          <Input
            type="number"
            name="rainfall"
            value={formData.rainfall}
            onChange={handleChange}
            placeholder="Annual rainfall (0-3000mm)"
            min="0"
            max="3000"
            step="0.1"
            required
          />
        </FormGroup>
      </Form>

      <ButtonContainer>
        <PredictButton 
          type="submit" 
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading || weatherEnhancing}
        >
          {isLoading || weatherEnhancing ? (
            <>
              <Loader2 className="animate-spin" />
              {weatherEnhancing ? 'Enhancing with Weather...' : 'Analyzing...'}
            </>
          ) : (
            <>
              {useWeatherData ? <Cloud /> : <Leaf />}
              {useWeatherData ? 'Get Weather-Enhanced Recommendation' : 'Get Recommendation'}
            </>
          )}
        </PredictButton>
      </ButtonContainer>

      {error && (
        <ErrorContainer>
          <AlertCircle />
          {error}
        </ErrorContainer>
      )}

      {prediction && (
        <ResultContainer>
          <ResultTitle>
            <CheckCircle />
            Recommendation Result
          </ResultTitle>
          
          <CropRecommendation>
            <CropName>
              {typeof prediction.prediction === 'string' 
                ? prediction.prediction 
                : prediction.prediction?.crop || prediction.crop || 'Unknown'}
            </CropName>
            <Confidence>
              Model Confidence: <span className="percentage">
                {(prediction.confidence * 100 || 
                  prediction.prediction?.confidence * 100 || 
                  prediction.probability || 95).toFixed(1)}%
              </span>
            </Confidence>
          </CropRecommendation>

          <MetaInfo>
            <MetaItem>
              <div className="label">Location</div>
              <div className="value">{formData.location || 'Not specified'}</div>
            </MetaItem>
            <MetaItem>
              <div className="label">Model Version</div>
              <div className="value">{prediction.model_version || '1.0.0'}</div>
            </MetaItem>
            <MetaItem>
              <div className="label">Processing Time</div>
              <div className="value">{prediction.processing_time || '< 1s'}</div>
            </MetaItem>
            <MetaItem>
              <div className="label">Prediction ID</div>
              <div className="value">{prediction.id || 'Generated'}</div>
            </MetaItem>
            <MetaItem>
              <div className="label">Timestamp</div>
              <div className="value">{new Date().toLocaleString()}</div>
            </MetaItem>
          </MetaInfo>
        </ResultContainer>
      )}
    </FormContainer>
  );
};

export default CropPredictionForm;