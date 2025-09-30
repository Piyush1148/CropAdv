"""
Enhanced User Profile Models - Comprehensive Personal AI Assistant Integration
Created for Crop Advisory System - Personal AI Assistant Feature

This module defines all user-related data structures with complete validation,
type safety, and field constraints for personalized agricultural recommendations.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from enum import Enum
import re


# ==================== ENUMS FOR CONTROLLED VALUES ====================

class FarmSizeCategory(str, Enum):
    """Farm size classification based on Indian agricultural standards"""
    MARGINAL = "marginal"           # 0-2.5 acres
    SMALL = "small"                 # 2.5-5 acres  
    SEMI_MEDIUM = "semi_medium"     # 5-10 acres
    MEDIUM = "medium"               # 10-25 acres
    LARGE = "large"                 # 25+ acres

class SoilType(str, Enum):
    """Primary soil types in Indian agriculture"""
    ALLUVIAL = "alluvial"
    BLACK_COTTON = "black_cotton"
    RED = "red"
    LATERITE = "laterite"
    SANDY = "sandy"
    CLAYEY = "clayey"
    CLAY = "clay"
    LOAMY = "loamy"
    SILTY = "silty"
    CHALKY = "chalky"
    SALINE = "saline"
    PEATY = "peaty"

class IrrigationType(str, Enum):
    """Irrigation methods commonly used in Indian farming"""
    FLOOD = "flood"
    FURROW = "furrow"
    SPRINKLER = "sprinkler"
    DRIP = "drip"
    BASIN = "basin"
    BORDER = "border"
    RAINFED = "rainfed"
    MICRO_SPRINKLER = "micro_sprinkler"
    CENTER_PIVOT = "center_pivot"

class ExperienceLevel(str, Enum):
    """Farming experience categorization"""
    BEGINNER = "beginner"           # 0-2 years
    INTERMEDIATE = "intermediate"   # 2-10 years
    EXPERIENCED = "experienced"     # 10-20 years
    EXPERT = "expert"              # 20+ years

class CommunicationStyle(str, Enum):
    """AI communication preferences"""
    FORMAL = "formal"
    FRIENDLY = "friendly"
    TECHNICAL = "technical"
    SIMPLE = "simple"

class DetailPreference(str, Enum):
    """Response detail level preferences"""
    BRIEF = "brief"
    DETAILED = "detailed"
    COMPREHENSIVE = "comprehensive"


# ==================== COORDINATE AND LOCATION MODELS ====================

class Coordinates(BaseModel):
    """Geographical coordinates with precision validation"""
    latitude: float = Field(
        ..., 
        ge=-90, 
        le=90,
        description="Latitude in decimal degrees"
    )
    longitude: float = Field(
        ..., 
        ge=-180, 
        le=180,
        description="Longitude in decimal degrees"
    )
    accuracy: Optional[float] = Field(
        None,
        ge=0,
        description="Location accuracy in meters"
    )
    
    @validator('latitude', 'longitude')
    def validate_precision(cls, v):
        """Ensure reasonable precision for agricultural purposes"""
        if abs(v) < 0.0001:
            raise ValueError("Coordinates too imprecise for agricultural mapping")
        return round(v, 6)  # ~1 meter precision

class LocationInfo(BaseModel):
    """Comprehensive location information with Indian context"""
    address: str = Field(
        ..., 
        min_length=5,
        max_length=200,
        description="Full address as entered by user"
    )
    district: Optional[str] = Field(
        None,
        min_length=2,
        max_length=50,
        description="Administrative district"
    )
    state: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Indian state name"
    )
    country: str = Field(
        default="India",
        description="Country (default: India)"
    )
    coordinates: Optional[Coordinates] = Field(
        None,
        description="GPS coordinates of the farm"
    )
    postal_code: Optional[str] = Field(
        None,
        pattern=r'^\d{6}$',
        description="6-digit Indian postal code"
    )
    region_type: Optional[str] = Field(
        None,
        description="Agro-climatic classification"
    )
    tehsil: Optional[str] = Field(
        None,
        description="Tehsil/Taluka administrative division"
    )
    
    @validator('state')
    def validate_indian_state(cls, v):
        """Validate against list of Indian states"""
        indian_states = {
            'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
            'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
            'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
            'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
            'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal'
        }
        if v.lower() not in indian_states:
            raise ValueError(f"'{v}' is not a recognized Indian state")
        return v.title()


# ==================== PERSONAL INFORMATION MODELS ====================

class PersonalInfo(BaseModel):
    """Personal information with privacy controls"""
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="User's full name"
    )
    phone_number: str = Field(
        default="+91xxxxxxxxxx",
        description="Mobile number with country code"
    )
    preferred_language: str = Field(
        default="en",
        description="ISO 639-1 language code"
    )
    date_of_birth: Optional[date] = Field(
        None,
        description="Date of birth for age-appropriate recommendations"
    )
    gender: Optional[str] = Field(
        None,
        pattern=r'^(male|female|other|prefer_not_to_say)$',
        description="Gender identity"
    )
    education_level: Optional[str] = Field(
        None,
        description="Educational background"
    )
    
    @validator('phone_number')
    def validate_indian_mobile(cls, v):
        """Validate Indian mobile number format - now more forgiving for incomplete profiles"""
        # Handle empty or None values gracefully
        if not v or v.strip() == "":
            return "+91xxxxxxxxxx"  # Default placeholder
            
        # Remove spaces and special characters
        clean_number = re.sub(r'[^\d+]', '', v)
        
        # If it's clearly malformed but not empty, try to fix it
        if len(clean_number) < 5:  # Too short to be valid
            return "+91xxxxxxxxxx"  # Return placeholder
        
        # Check Indian mobile patterns
        indian_patterns = [
            r'^\+91[6-9]\d{9}$',  # +91 followed by valid mobile
            r'^[6-9]\d{9}$',      # 10-digit starting with 6-9
        ]
        
        # Check if it matches valid patterns
        for pattern in indian_patterns:
            if re.match(pattern, clean_number):
                return clean_number
        
        # If it doesn't match but has some digits, try to salvage it
        if len(clean_number) >= 5:
            # Extract digits only and see if we can make a valid number
            digits_only = re.sub(r'[^\d]', '', v)
            if len(digits_only) >= 10:
                # Take the last 10 digits and format as mobile number
                last_10_digits = digits_only[-10:]
                if last_10_digits[0] in '6789':  # Valid mobile start
                    return f"+91{last_10_digits}"
        
        # If all else fails, return a placeholder instead of raising error
        return "+91xxxxxxxxxx"

    @validator('date_of_birth')
    def validate_reasonable_age(cls, v):
        """Ensure reasonable age for farmers"""
        if v:
            age = (date.today() - v).days // 365
            if age < 16 or age > 100:
                raise ValueError("Age must be between 16 and 100 years")
        return v


# ==================== FARM INFRASTRUCTURE MODELS ====================

class FarmDetails(BaseModel):
    """Comprehensive farm operational information"""
    total_area: float = Field(
        ...,
        gt=0,
        le=10000,  # Maximum reasonable farm size in acres
        description="Total farm area"
    )
    area_unit: str = Field(
        default="acres",
        pattern=r'^(acres|hectares|bigha|katha)$',
        description="Unit of area measurement"
    )
    farm_type: Optional[str] = Field(
        None,
        pattern=r'^(mixed|organic|commercial|subsistence|plantation)$',
        description="Type of farming operation"
    )
    ownership: Optional[str] = Field(
        None,
        pattern=r'^(owned|leased|sharecropping|family_land)$',
        description="Land ownership status"
    )
    operational_since: Optional[date] = Field(
        None,
        description="When farming operations started"
    )
    number_of_plots: Optional[int] = Field(
        None,
        ge=1,
        le=100,
        description="Number of separate land plots"
    )
    
    @property
    def size_category(self) -> FarmSizeCategory:
        """Automatically classify farm size"""
        if self.total_area <= 2.5:
            return FarmSizeCategory.MARGINAL
        elif self.total_area <= 5:
            return FarmSizeCategory.SMALL
        elif self.total_area <= 10:
            return FarmSizeCategory.SEMI_MEDIUM
        elif self.total_area <= 25:
            return FarmSizeCategory.MEDIUM
        else:
            return FarmSizeCategory.LARGE
    
    @validator('total_area')
    def validate_reasonable_size(cls, v):
        """Ensure farm size is reasonable"""
        if v < 0.1:
            raise ValueError("Farm size too small (minimum 0.1 acres)")
        if v > 5000:
            raise ValueError("Farm size too large for individual management")
        return round(v, 2)

class SoilInformation(BaseModel):
    """Detailed soil characteristics and management"""
    primary_soil_type: SoilType = Field(
        ...,
        description="Primary soil type classification"
    )
    soil_ph: Optional[float] = Field(
        None,
        ge=3.0,
        le=10.0,
        description="Soil pH level (3.0-10.0)"
    )
    organic_content: Optional[str] = Field(
        None,
        pattern=r'^(low|medium|high)$',
        description="Organic matter content level"
    )
    drainage: Optional[str] = Field(
        None,
        pattern=r'^(poor|moderate|good|excessive)$',
        description="Natural drainage characteristics"
    )
    fertility_status: Optional[str] = Field(
        None,
        pattern=r'^(low|medium|high)$',
        description="Overall soil fertility assessment"
    )
    erosion_level: Optional[str] = Field(
        None,
        pattern=r'^(none|mild|moderate|severe)$',
        description="Soil erosion severity"
    )
    last_soil_test: Optional[date] = Field(
        None,
        description="Date of last comprehensive soil test"
    )
    
    @validator('soil_ph')
    def validate_ph_precision(cls, v):
        """Ensure reasonable pH precision"""
        if v:
            return round(v, 1)
        return v

class IrrigationSystem(BaseModel):
    """Comprehensive irrigation infrastructure details"""
    primary_method: IrrigationType = Field(
        ...,
        description="Primary irrigation method used"
    )
    water_source: List[str] = Field(
        default_factory=list,
        description="Available water sources"
    )
    coverage_percentage: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Percentage of farm with irrigation access"
    )
    automation_level: Optional[str] = Field(
        None,
        pattern=r'^(manual|semi_automated|fully_automated)$',
        description="Level of irrigation automation"
    )
    water_availability: Optional[str] = Field(
        None,
        pattern=r'^(scarce|moderate|abundant)$',
        description="Overall water availability assessment"
    )
    storage_capacity: Optional[float] = Field(
        None,
        ge=0,
        description="Water storage capacity in liters"
    )
    efficiency_rating: Optional[str] = Field(
        None,
        pattern=r'^(low|medium|high)$',
        description="Irrigation system efficiency"
    )
    
    @validator('water_source')
    def validate_water_sources(cls, v):
        """Validate water source options"""
        valid_sources = {
            'borewell', 'tube_well', 'open_well', 'canal', 'river', 'pond',
            'rainwater_harvesting', 'government_scheme', 'shared_source'
        }
        invalid_sources = [source for source in v if source not in valid_sources]
        if invalid_sources:
            raise ValueError(f"Invalid water sources: {invalid_sources}")
        return v

class Infrastructure(BaseModel):
    """Farm infrastructure and equipment inventory"""
    storage_facilities: bool = Field(
        default=False,
        description="Availability of crop storage facilities"
    )
    processing_units: bool = Field(
        default=False,
        description="On-farm processing capabilities"
    )
    machinery_owned: List[str] = Field(
        default_factory=list,
        description="List of owned agricultural machinery"
    )
    connectivity: Optional[str] = Field(
        None,
        pattern=r'^(poor|moderate|good|excellent)$',
        description="Transportation and communication connectivity"
    )
    electricity_availability: Optional[str] = Field(
        None,
        pattern=r'^(none|limited|regular|constant)$',
        description="Electrical power availability"
    )
    market_distance: Optional[float] = Field(
        None,
        ge=0,
        le=500,
        description="Distance to nearest market in kilometers"
    )


# ==================== FARMING PROFILE MODELS ====================

class FarmingProfile(BaseModel):
    """Comprehensive farming experience and practices"""
    experience_level: ExperienceLevel = Field(
        ...,
        description="Overall farming experience level"
    )
    years_of_experience: Optional[int] = Field(
        None,
        ge=0,
        le=70,
        description="Total years of farming experience"
    )
    farming_generation: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        description="Generation in family farming (1st, 2nd, etc.)"
    )
    primary_crops: List[str] = Field(
        default_factory=list,
        description="Main crops grown regularly"
    )
    secondary_crops: List[str] = Field(
        default_factory=list,
        description="Secondary or rotational crops"
    )
    livestock: bool = Field(
        default=False,
        description="Involvement in livestock farming"
    )
    farming_approach: Optional[str] = Field(
        None,
        pattern=r'^(traditional|modern|mixed|organic|integrated)$',
        description="Overall farming methodology"
    )
    certifications: List[str] = Field(
        default_factory=list,
        description="Agricultural certifications held"
    )
    market_channels: List[str] = Field(
        default_factory=list,
        description="Primary market channels used"
    )
    
    @validator('primary_crops', 'secondary_crops')
    def validate_crop_names(cls, v):
        """Validate crop names against known Indian crops"""
        # This could be expanded with a comprehensive crop database
        if len(v) > 20:  # Reasonable limit
            raise ValueError("Too many crops listed (maximum 20)")
        return [crop.lower().strip() for crop in v if crop.strip()]

    @validator('years_of_experience')
    def validate_experience_consistency(cls, v, values):
        """Ensure experience years match experience level"""
        if v and 'experience_level' in values:
            level = values['experience_level']
            if level == ExperienceLevel.BEGINNER and v > 2:
                raise ValueError("Beginner level inconsistent with years of experience")
            elif level == ExperienceLevel.INTERMEDIATE and (v < 2 or v > 10):
                raise ValueError("Intermediate level inconsistent with years of experience")
            elif level == ExperienceLevel.EXPERIENCED and (v < 10 or v > 20):
                raise ValueError("Experienced level inconsistent with years of experience")
            elif level == ExperienceLevel.EXPERT and v < 20:
                raise ValueError("Expert level inconsistent with years of experience")
        return v


# ==================== AI PERSONALIZATION MODELS ====================

class InteractionHistory(BaseModel):
    """AI interaction tracking and learning"""
    total_conversations: int = Field(
        default=0,
        ge=0,
        description="Total number of chat conversations"
    )
    favorite_topics: List[str] = Field(
        default_factory=list,
        description="Most frequently discussed topics"
    )
    successful_recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations that user acted upon successfully"
    )
    ignored_recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations that user didn't follow"
    )
    seasonal_patterns: Dict[str, Any] = Field(
        default_factory=dict,
        description="Seasonal interaction and preference patterns"
    )
    response_ratings: List[float] = Field(
        default_factory=list,
        description="User satisfaction ratings for AI responses"
    )
    
    @property
    def average_satisfaction(self) -> Optional[float]:
        """Calculate average user satisfaction rating"""
        if self.response_ratings:
            return round(sum(self.response_ratings) / len(self.response_ratings), 2)
        return None

class ContextPreferences(BaseModel):
    """User preferences for AI context inclusion"""
    include_weather: bool = Field(
        default=True,
        description="Include weather information in responses"
    )
    include_market_prices: bool = Field(
        default=True,
        description="Include market price information"
    )
    include_seasonal_advice: bool = Field(
        default=True,
        description="Include seasonal farming advice"
    )
    include_government_schemes: bool = Field(
        default=True,
        description="Include information about government schemes"
    )
    personalization_level: str = Field(
        default="moderate",
        pattern=r'^(minimal|basic|moderate|full|maximum)$',
        description="Level of AI personalization desired"
    )
    privacy_level: str = Field(
        default="moderate",
        pattern=r'^(public|moderate|private|strict)$',
        description="Privacy preference level"
    )

class AIPersonalization(BaseModel):
    """Comprehensive AI personalization settings"""
    communication_style: CommunicationStyle = Field(
        default=CommunicationStyle.FRIENDLY,
        description="Preferred AI communication style"
    )
    detail_preference: DetailPreference = Field(
        default=DetailPreference.DETAILED,
        description="Preferred level of detail in responses"
    )
    learning_pace: str = Field(
        default="moderate",
        pattern=r'^(slow|moderate|fast|adaptive)$',
        description="Preferred pace for learning new concepts"
    )
    risk_tolerance: str = Field(
        default="moderate",
        pattern=r'^(conservative|moderate|aggressive|calculated)$',
        description="Risk tolerance for farming recommendations"
    )
    innovation_openness: str = Field(
        default="selective",
        pattern=r'^(traditional|cautious|selective|early_adopter|pioneer)$',
        description="Openness to new farming technologies"
    )
    interaction_history: InteractionHistory = Field(
        default_factory=InteractionHistory,
        description="Historical interaction data for learning"
    )
    context_preferences: ContextPreferences = Field(
        default_factory=ContextPreferences,
        description="Preferences for context inclusion"
    )
    last_interaction: Optional[datetime] = Field(
        None,
        description="Timestamp of last AI interaction"
    )


# ==================== METADATA AND VERIFICATION MODELS ====================

class VerificationStatus(BaseModel):
    """Account and profile verification tracking"""
    phone_verified: bool = Field(
        default=False,
        description="Phone number verification status"
    )
    email_verified: bool = Field(
        default=False,
        description="Email address verification status"
    )
    location_verified: bool = Field(
        default=False,
        description="Farm location verification status"
    )
    farm_verified: bool = Field(
        default=False,
        description="Farm details verification status"
    )
    government_id_verified: bool = Field(
        default=False,
        description="Government ID verification status"
    )
    verification_date: Optional[datetime] = Field(
        None,
        description="Date of last verification update"
    )

class ProfileMetadata(BaseModel):
    """Profile completion and management metadata"""
    profile_completion_percentage: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Overall profile completion percentage"
    )
    last_profile_update: Optional[datetime] = Field(
        None,
        description="Timestamp of last profile modification"
    )
    verification_status: VerificationStatus = Field(
        default_factory=VerificationStatus,
        description="Verification status for various profile elements"
    )
    data_sources: List[str] = Field(
        default_factory=list,
        description="Sources of profile data (manual, government DB, etc.)"
    )
    profile_quality_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=10.0,
        description="Calculated profile quality score (0-10)"
    )
    privacy_settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="User privacy preferences and settings"
    )


# ==================== COMPLETE FARM PROFILE MODEL ====================

class CompleteFarmProfile(BaseModel):
    """Complete farm profile combining all aspects"""
    location: LocationInfo = Field(
        ...,
        description="Farm location information"
    )
    farm_details: FarmDetails = Field(
        ...,
        description="Basic farm operational details"
    )
    soil_information: SoilInformation = Field(
        ...,
        description="Soil characteristics and management"
    )
    irrigation_system: IrrigationSystem = Field(
        ...,
        description="Irrigation infrastructure details"
    )
    infrastructure: Infrastructure = Field(
        default_factory=Infrastructure,
        description="Farm infrastructure and equipment"
    )
    
    @property
    def is_complete(self) -> bool:
        """Check if farm profile has all essential information"""
        essential_fields = [
            self.location.coordinates is not None,
            self.farm_details.total_area > 0,
            self.soil_information.primary_soil_type is not None,
            self.irrigation_system.primary_method is not None
        ]
        return all(essential_fields)


# ==================== ENHANCED USER PROFILE MODEL ====================

class EnhancedUserProfile(BaseModel):
    """Complete enhanced user profile for personalized AI assistant"""
    
    # Core identification (existing fields)
    uid: str = Field(..., description="Firebase user ID")
    email: str = Field(..., description="User email address", pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    display_name: str = Field(..., description="User display name")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Enhanced profile sections
    personal_info: PersonalInfo = Field(
        ...,
        description="Personal information and preferences"
    )
    farm_profile: CompleteFarmProfile = Field(
        ...,
        description="Complete farm profile information"
    )
    farming_profile: FarmingProfile = Field(
        ...,
        description="Farming experience and practices"
    )
    ai_personalization: AIPersonalization = Field(
        default_factory=AIPersonalization,
        description="AI personalization settings and history"
    )
    metadata: ProfileMetadata = Field(
        default_factory=ProfileMetadata,
        description="Profile metadata and verification status"
    )
    
    @validator('created_at', 'updated_at', pre=True)
    def parse_datetime_fields(cls, v):
        """Parse datetime fields that may come as strings from Firebase"""
        if isinstance(v, str):
            try:
                # Remove problematic timezone info like "UTC+5:30"
                clean_date = re.sub(r'\s+UTC[+-]\d+:\d+$', '', v)
                clean_date = re.sub(r'\s+at\s+', ' ', clean_date)
                
                # Try common datetime formats
                datetime_formats = [
                    '%d %B %Y %H:%M:%S',  # "26 September 2025 00:12:22"
                    '%Y-%m-%d %H:%M:%S',  # ISO format
                    '%Y-%m-%dT%H:%M:%S',  # ISO with T
                    '%Y-%m-%dT%H:%M:%S.%f',  # ISO with microseconds
                    '%d/%m/%Y %H:%M:%S',  # DD/MM/YYYY format
                    '%m/%d/%Y %H:%M:%S',  # MM/DD/YYYY format
                ]
                
                for fmt in datetime_formats:
                    try:
                        return datetime.strptime(clean_date, fmt)
                    except ValueError:
                        continue
                        
                # If no format matches, return current time
                return datetime.utcnow()
            except:
                # If any parsing fails, return current time as fallback
                return datetime.utcnow()
        elif v is None:
            return datetime.utcnow()
        return v
    
    @property
    def full_name(self) -> str:
        """Get user's full name for personalized responses"""
        return self.personal_info.full_name
    
    @property
    def farm_location_text(self) -> str:
        """Get formatted farm location for AI context"""
        loc = self.farm_profile.location
        return f"{loc.district}, {loc.state}" if loc.district else loc.address
    
    @property
    def farm_size_description(self) -> str:
        """Get human-readable farm size description"""
        details = self.farm_profile.farm_details
        return f"{details.total_area} {details.area_unit} ({details.size_category.value} farm)"
    
    @property
    def ai_context_summary(self) -> Dict[str, Any]:
        """Generate AI context summary for personalized responses"""
        return {
            "name": self.personal_info.full_name,
            "location": self.farm_location_text,
            "farm_size": self.farm_size_description,
            "soil_type": self.farm_profile.soil_information.primary_soil_type.value,
            "irrigation": self.farm_profile.irrigation_system.primary_method.value,
            "experience": self.farming_profile.experience_level.value,
            "communication_style": self.ai_personalization.communication_style.value,
            "detail_preference": self.ai_personalization.detail_preference.value,
            "primary_crops": self.farming_profile.primary_crops[:3],  # Top 3 crops
        }
    
    def calculate_profile_completion(self) -> float:
        """Calculate profile completion percentage"""
        total_fields = 0
        completed_fields = 0
        
        # Essential fields scoring
        essential_checks = [
            (self.personal_info.full_name, 10),
            (self.personal_info.phone_number, 10),
            (self.farm_profile.location.address, 15),
            (self.farm_profile.farm_details.total_area > 0, 15),
            (self.farm_profile.soil_information.primary_soil_type, 15),
            (self.farm_profile.irrigation_system.primary_method, 15),
            (self.farming_profile.experience_level, 10),
            (len(self.farming_profile.primary_crops) > 0, 10),
        ]
        
        for check, weight in essential_checks:
            total_fields += weight
            if check:
                completed_fields += weight
        
        return round((completed_fields / total_fields) * 100, 1)
    
    def update_metadata(self):
        """Update metadata with current information"""
        self.updated_at = datetime.utcnow()
        self.metadata.last_profile_update = datetime.utcnow()
        self.metadata.profile_completion_percentage = self.calculate_profile_completion()
        
        # Update AI interaction timestamp
        self.ai_personalization.last_interaction = datetime.utcnow()


# ==================== PROFILE UPDATE MODELS ====================

class ProfileUpdateRequest(BaseModel):
    """Request model for profile updates"""
    personal_info: Optional[PersonalInfo] = None
    farm_profile: Optional[CompleteFarmProfile] = None
    farming_profile: Optional[FarmingProfile] = None
    ai_personalization: Optional[AIPersonalization] = None
    
class ProfileCreationRequest(BaseModel):
    """Request model for creating new enhanced profile"""
    personal_info: PersonalInfo
    farm_profile: CompleteFarmProfile
    farming_profile: Optional[FarmingProfile] = None
    ai_personalization: Optional[AIPersonalization] = None


# ==================== RESPONSE MODELS ====================

class ProfileResponse(BaseModel):
    """Response model for profile operations"""
    success: bool
    message: str
    profile: Optional[EnhancedUserProfile] = None
    completion_percentage: Optional[float] = None
    missing_fields: Optional[List[str]] = None

class AIContextResponse(BaseModel):
    """Response model for AI context requests"""
    user_context: Dict[str, Any]
    personalization_active: bool
    context_quality_score: Optional[float] = None
    last_updated: datetime