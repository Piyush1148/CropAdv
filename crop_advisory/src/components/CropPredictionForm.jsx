/**
 * Crop Recommendation Form Component
 * Professional form for soil data input and ML-powered crop predictions
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import styled from 'styled-components';
import { Leaf, Cloud, Thermometer, Droplets, Activity, BarChart3, Loader2, CheckCircle, AlertCircle, MapPin, Zap, RefreshCw } from 'lucide-react';
import { useCropPrediction } from '../hooks/useApi';
import { useWeatherEnhancedPrediction, useGeolocation, useCurrentWeather } from '../hooks/useWeather';
import { cropPredictionSchema } from '../utils/validationSchemas';
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
  border: 2px solid ${props => props.$hasError ? '#f44336' : '#d4e7d4'};
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#f44336' : '#4caf50'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)'};
  }

  &:invalid {
    border-color: #f44336;
  }
`;

const ErrorMessage = styled.span`
  color: #f44336;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;

  svg {
    width: 14px;
    height: 14px;
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
  // React Hook Form setup with Yup validation
  const { 
    register, 
    handleSubmit: handleFormSubmit, 
    formState: { errors, isValid }, 
    setValue,
    watch 
  } = useForm({
    resolver: yupResolver(cropPredictionSchema),
    mode: 'onChange', // Validate on change for real-time feedback
    defaultValues: {
      N: '',
      P: '',
      K: '',
      temperature: '',
      humidity: '',
      ph: '',
      rainfall: '',
      location: ''
    }
  });

  const formData = watch(); // Watch all form values
  const [useWeatherData, setUseWeatherData] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ latitude: 28.6139, longitude: 77.2090 });

  const { prediction, isLoading, error, predictCrop, clearPrediction } = useCropPrediction();
  const { getEnhancedPrediction, isLoading: weatherEnhancing, error: weatherError } = useWeatherEnhancedPrediction();
  const { location: userLocation, isLoading: locationLoading, getLocation } = useGeolocation({ immediate: false });
  
  // Add current weather data fetching
  const { 
    weather: currentWeather, 
    isLoading: weatherLoading, 
    error: currentWeatherError,
    refetch: refetchWeather
  } = useCurrentWeather(
    currentLocation.latitude,
    currentLocation.longitude,
    userLocation ? 'Your Location' : null
  );

  // Update current location when user location is obtained
  useEffect(() => {
    if (userLocation) {
      const newLocation = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      };
      setCurrentLocation(newLocation);
      
      if (import.meta.env.DEV) {
        console.log('📍 Location updated:', userLocation);
      }
      
      // Refetch weather data with new location
      if (refetchWeather) {
        setTimeout(() => refetchWeather(), 100);
      }
    }
  }, [userLocation, refetchWeather]);

  // ✅ FIX: Auto-populate form fields when weather data arrives and weather enhancement is enabled
  const weatherPopulatedRef = useRef(false);
  useEffect(() => {
    if (currentWeather && useWeatherData) {
      if (import.meta.env.DEV) {
        console.log('🌤️ Weather data available, populating fields...', {
          hasTemperature: !!currentWeather.temperature,
          hasHumidity: !!currentWeather.humidity,
          hasRain: !!(currentWeather.rain_1h || currentWeather.rain_3h),
          useWeatherData: useWeatherData,
          currentWeather: currentWeather
        });
      }
      
      // Update form fields with real-time weather data
      let fieldsUpdated = false;
      if (currentWeather.temperature !== undefined && currentWeather.temperature !== null) {
        const tempValue = Math.round(currentWeather.temperature).toString();
        setValue('temperature', tempValue);
        fieldsUpdated = true;
        if (import.meta.env.DEV) {
          console.log('✅ Temperature set to:', tempValue);
        }
      }
      if (currentWeather.humidity !== undefined && currentWeather.humidity !== null) {
        const humValue = Math.round(currentWeather.humidity).toString();
        setValue('humidity', humValue);
        fieldsUpdated = true;
        if (import.meta.env.DEV) {
          console.log('✅ Humidity set to:', humValue);
        }
      }
      // Rainfall: use rain_1h or rain_3h, default to 0 if no rain
      const rainfall = currentWeather.rain_1h || currentWeather.rain_3h || 0;
      const rainValue = Math.round(rainfall).toString();
      setValue('rainfall', rainValue);
      fieldsUpdated = true;
      if (import.meta.env.DEV) {
        console.log('✅ Rainfall set to:', rainValue);
      }
      
      // Show toast only once when fields are populated
      if (fieldsUpdated && !weatherPopulatedRef.current) {
        toast.success('Weather data loaded successfully!', { duration: 2000 });
        weatherPopulatedRef.current = true;
      }
    } else if (import.meta.env.DEV) {
      console.log('⚠️ Weather not populating because:', {
        hasWeather: !!currentWeather,
        weatherEnabled: useWeatherData,
        currentWeather: currentWeather,
        currentWeatherError: currentWeatherError
      });
    }
  }, [currentWeather, useWeatherData, setValue, currentWeatherError]);

  const handleSubmit = async (data) => {
    try {
      let predictionData = { ...data };
      
      // 🔍 DEBUG: Log input values
      console.log('📊 PREDICTION INPUT VALUES:');
      console.log('  N (Nitrogen):', data.N);
      console.log('  P (Phosphorus):', data.P);
      console.log('  K (Potassium):', data.K);
      console.log('  Temperature:', data.temperature);
      console.log('  Humidity:', data.humidity);
      console.log('  pH:', data.ph);
      console.log('  Rainfall:', data.rainfall);
      console.log('  Location:', data.location);
      console.log('  Weather Mode:', useWeatherData ? 'ENABLED' : 'DISABLED');
      
      if (useWeatherData) {
        // Enhance prediction with real-time weather data
        const toastId = toast.loading('Enhancing prediction with real-time weather data...');
        
        try {
          const enhancedData = await getEnhancedPrediction(
            data, 
            userLocation?.latitude || currentLocation.latitude, 
            userLocation?.longitude || currentLocation.longitude
          );
          predictionData = enhancedData;
          
          // 🔍 DEBUG: Log enhanced values
          console.log('🌤️ WEATHER-ENHANCED VALUES:');
          console.log('  Temperature:', enhancedData.temperature);
          console.log('  Humidity:', enhancedData.humidity);
          console.log('  Rainfall:', enhancedData.rainfall);
          
          toast.success('Weather data integrated successfully!', { id: toastId });
        } catch (weatherError) {
          toast.error('Weather enhancement failed, using manual inputs', { id: toastId });
          if (import.meta.env.DEV) {
            console.error('Weather enhancement error:', weatherError);
          }
          // Continue with manual inputs
        }
      }
      
      // 🔍 DEBUG: Log final prediction data being sent to API
      console.log('🚀 SENDING TO API:', predictionData);
      
      const result = await predictCrop(predictionData);
      
      // 🔍 DEBUG: Log prediction result
      console.log('✅ PREDICTION RESULT:', result);
      console.log('  Predicted Crop:', result?.prediction || result?.recommendations?.[0]?.crop_name);
      console.log('  Confidence:', result?.confidence || result?.recommendations?.[0]?.confidence_score);
      
      if (import.meta.env.DEV) {
        console.log('Prediction result:', result);
      }
      toast.success(useWeatherData ? 
        'Weather-enhanced prediction completed!' : 
        'Prediction completed successfully!');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to get prediction';
      toast.error(errorMessage);
      if (import.meta.env.DEV) {
        console.error('Prediction error:', err);
      }
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

      <Form onSubmit={handleFormSubmit(handleSubmit)}>
        <FormGroup>
          <Label>
            <Activity />
            Nitrogen (N) - kg/ha
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter nitrogen content (0-140)"
            $hasError={!!errors.N}
            {...register('N')}
          />
          {errors.N && (
            <ErrorMessage>
              <AlertCircle />
              {errors.N.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <Activity />
            Phosphorus (P) - kg/ha
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter phosphorus content (5-145)"
            $hasError={!!errors.P}
            {...register('P')}
          />
          {errors.P && (
            <ErrorMessage>
              <AlertCircle />
              {errors.P.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <Activity />
            Potassium (K) - kg/ha
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter potassium content (5-205)"
            $hasError={!!errors.K}
            {...register('K')}
          />
          {errors.K && (
            <ErrorMessage>
              <AlertCircle />
              {errors.K.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <MapPin />
            Village/City
          </Label>
          <Input
            type="text"
            placeholder="Enter your village or city name"
            $hasError={!!errors.location}
            {...register('location')}
          />
          {errors.location && (
            <ErrorMessage>
              <AlertCircle />
              {errors.location.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <Thermometer />
            Temperature - °C
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Enter average temperature (8-43°C)"
            $hasError={!!errors.temperature}
            {...register('temperature')}
          />
          {errors.temperature && (
            <ErrorMessage>
              <AlertCircle />
              {errors.temperature.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <Droplets />
            Humidity - %
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Relative humidity (14-99%)"
            $hasError={!!errors.humidity}
            {...register('humidity')}
          />
          {errors.humidity && (
            <ErrorMessage>
              <AlertCircle />
              {errors.humidity.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <BarChart3 />
            pH Level
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Soil pH (3.5-9.9)"
            $hasError={!!errors.ph}
            {...register('ph')}
          />
          {errors.ph && (
            <ErrorMessage>
              <AlertCircle />
              {errors.ph.message}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>
            <Cloud />
            Rainfall - mm
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Annual rainfall (20-298mm)"
            $hasError={!!errors.rainfall}
            {...register('rainfall')}
          />
          {errors.rainfall && (
            <ErrorMessage>
              <AlertCircle />
              {errors.rainfall.message}
            </ErrorMessage>
          )}
        </FormGroup>
      </Form>

      <ButtonContainer>
        <PredictButton 
          type="submit" 
          onClick={handleFormSubmit(handleSubmit)}
          disabled={!isValid || isLoading || weatherEnhancing}
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