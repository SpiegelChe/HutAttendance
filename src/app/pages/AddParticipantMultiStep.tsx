import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { UserPlus, Check, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { 
  SA_COUNCIL_REGIONS, 
  ADELAIDE_HILLS_TOWNSHIPS, 
  DAYS, 
  MONTHS, 
  YEARS,
  COUNTRIES 
} from '../utils/constants';
import { 
  GeneralInfoStep,
  ProgramSelectionStep,
  ProgramSpecificStep
} from '../components/registration/RegistrationSteps';

export default function AddParticipantMultiStep() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Personal Information
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    homeTel: '',
    gender: '',
    genderOther: '',
    dobMonth: '',
    dobDay: '',
    dobYear: '',
    
    // Home Address
    addressLine1: '',
    addressLine2: '',
    township: '',
    townshipOther: '',
    postCode: '',
    councilRegion: '',
    
    // Postal Address
    postalAddressLine1: '',
    postalAddressLine2: '',
    postalPostcode: '',
    
    // Preferences
    receiveNewsletter: false,
    receiveCourseNotifications: false,
    
    // Emergency Contact
    emergencyContactFirstName: '',
    emergencyContactLastName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Cultural Background
    identifyAboriginalTSI: '',
    speakOtherLanguage: '',
    otherLanguageDetails: '',
    countryOfBirth: '',
    culturalIdentity: '',
    culturalIdentityDetails: '',
    
    // Referral Sources (checkboxes)
    referralBrochure: false,
    referralReferral: false,
    referralEmailFromHut: false,
    referralFamilyFriend: false,
    referralSocialMedia: false,
    referralLocalNewspaper: false,
    referralLocalNoticeboard: false,
    referralWeb: false,
    referralOther: '',
    
    // Photo Consent
    photoConsentWebsite: false,
    photoConsentSocialMedia: false,
    photoConsentAnnualReport: false,
    photoConsentBrochures: false,
    photoConsentLocalMedia: false,
    
    // Program Selection
    selectedPrograms: [] as string[],
    
    // Program-specific data (dynamically filled based on selected programs)
    programSpecificData: {} as Record<string, any>
  });

  const totalSteps = 3;

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProgramToggle = (programName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.includes(programName)
        ? prev.selectedPrograms.filter(p => p !== programName)
        : [...prev.selectedPrograms, programName]
    }));
  };

  const handleProgramDataChange = (categoryKey: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      programSpecificData: {
        ...prev.programSpecificData,
        [categoryKey]: {
          ...(prev.programSpecificData[categoryKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const validateStep = async (step: number): Promise<boolean> => {
    setError('');

    if (step === 1) {
      // Validate general information
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      if (!formData.email || !formData.phone) {
        setError('Email and phone number are required');
        return false;
      }
      if (!formData.gender) {
        setError('Gender is required');
        return false;
      }
      if (formData.gender === 'I use a different term' && !formData.genderOther) {
        setError('Please specify your gender identity');
        return false;
      }
      if (!formData.dobMonth || !formData.dobDay || !formData.dobYear) {
        setError('Complete date of birth is required');
        return false;
      }
      if (!formData.addressLine1 || !formData.postCode || !formData.councilRegion) {
        setError('Address, post code, and council region are required');
        return false;
      }
      if (!formData.township) {
        setError('Township is required');
        return false;
      }
      if (formData.township === 'Other' && !formData.townshipOther) {
        setError('Please specify your township');
        return false;
      }
      if (!formData.emergencyContactFirstName || !formData.emergencyContactLastName || !formData.emergencyContactPhone) {
        setError('Emergency contact information is required');
        return false;
      }
    }

    if (step === 2) {
      // Validate program selection
      if (formData.selectedPrograms.length === 0) {
        setError('Please select at least one program');
        return false;
      }
    }

    if (step === 3) {
      // Fetch program names to validate properly
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', formData.selectedPrograms);

      if (programsError) {
        console.error('Error fetching programs for validation:', programsError);
        setError('Unable to validate program data. Please try again.');
        return false;
      }

      // Define which programs require children-specific data
      const childrenProgramNames = [
        'Outdoor Playgroup',
        'Homework Club',
        'Dungeons & Dragons',
        'Intergenerational Mentoring'
      ];

      // Define which programs require fitness/health data
      const fitnessProgramNames = [
        'Community Fun Fitness',
        'Strength & Balance (Stirling)',
        'Chi Kung',
        'Walking Group',
        "Men's Moves"
      ];

      // Check if any selected programs are children's programs
      const hasChildrenPrograms = (programsData || []).some(prog =>
        childrenProgramNames.includes(prog.name)
      );

      // Check if any selected programs are fitness programs
      const hasFitnessPrograms = (programsData || []).some(prog =>
        fitnessProgramNames.includes(prog.name)
      );

      // Validate children's category data if needed
      if (hasChildrenPrograms) {
        const data = formData.programSpecificData['children'];

        if (!data) {
          setError('Please fill in the required information for children\'s programs');
          return false;
        }

        if (!data.childGivenName || !data.childFamilyName) {
          setError('Please enter the child\'s given name and family name');
          return false;
        }
        if (!data.childGender) {
          setError('Please select the child\'s gender');
          return false;
        }
        if (!data.childDOB) {
          setError('Please enter the child\'s date of birth');
          return false;
        }
        if (!data.childAboriginalTSI) {
          setError('Please answer the Aboriginal or Torres Strait Islander question');
          return false;
        }
        // Check if at least one photo consent option is selected or none
        const hasPhotoConsent = data.childPhotoConsentWebsite || data.childPhotoConsentSocialMedia ||
                                data.childPhotoConsentAnnualReport || data.childPhotoConsentBrochures ||
                                data.childPhotoConsentLocalMedia;
        // Allow submission even if no consent is given (they can choose none)

        if (!data.authorisedPerson1Name || !data.authorisedPerson1Phone) {
          setError('Please provide at least one authorised person to collect the child');
          return false;
        }
        if (!data.custodyIssues) {
          setError('Please answer whether there are any custody issues');
          return false;
        }
        if (!data.ownWayHomePermission) {
          setError('Please indicate permission for child to make own way home');
          return false;
        }
        if (!data.schoolAttending) {
          setError('Please enter the school the child is attending');
          return false;
        }
        if (!data.yearLevel) {
          setError('Please select the child\'s year level');
          return false;
        }
      }

      // Validate fitness category data if needed
      if (hasFitnessPrograms) {
        const data = formData.programSpecificData['fitness'];

        if (!data) {
          setError('Please fill in the required health information for fitness programs');
          return false;
        }

        if (!data.healthConditions || data.healthConditions.length === 0) {
          setError('Please select health conditions (or check none apply)');
          return false;
        }
        if (!data.regularExercise) {
          setError('Please indicate your regular exercise level');
          return false;
        }
        if (!data.medicalProcedures) {
          setError('Please provide information about medical procedures');
          return false;
        }
        if (!data.medicalTreatmentAcknowledged) {
          setError('Please acknowledge the medical treatment policy');
          return false;
        }
        if (!data.healthDeclarationSigned) {
          setError('Please check the Health Declaration signed checkbox');
          return false;
        }
      }
    }

    return true;
  };

  const nextStep = async () => {
    if (await validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate Step 3 before submitting
    if (!(await validateStep(3))) {
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      // Construct date of birth
      const dateOfBirth = `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay.padStart(2, '0')}`;

      // Calculate age and age range
      const calculateAge = (dobDay: string, dobMonth: string, dobYear: string): number => {
        const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      const getAgeRange = (age: number): string => {
        if (age < 5) return '0-4';
        if (age < 12) return '5-11';
        if (age < 18) return '12-17';
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        if (age < 65) return '55-64';
        if (age < 75) return '65-74';
        return '75+';
      };

      const participantAge = calculateAge(formData.dobDay, formData.dobMonth, formData.dobYear);
      const participantAgeRange = getAgeRange(participantAge);

      // Build referral sources array
      const referralSources = [];
      if (formData.referralBrochure) referralSources.push('Brochure');
      if (formData.referralReferral) referralSources.push('Referral');
      if (formData.referralEmailFromHut) referralSources.push('Email from The Hut');
      if (formData.referralFamilyFriend) referralSources.push('Family/Friend');
      if (formData.referralSocialMedia) referralSources.push('Social Media (Facebook)');
      if (formData.referralLocalNewspaper) referralSources.push('Local Newspaper');
      if (formData.referralLocalNoticeboard) referralSources.push('Local Noticeboard');
      if (formData.referralWeb) referralSources.push('Web');
      if (formData.referralOther) referralSources.push(`Other: ${formData.referralOther}`);
      
      // Build photo consent object
      const photoConsent = {
        website: formData.photoConsentWebsite,
        socialMedia: formData.photoConsentSocialMedia,
        annualReport: formData.photoConsentAnnualReport,
        brochures: formData.photoConsentBrochures,
        localMedia: formData.photoConsentLocalMedia
      };

      // Determine final gender value
      const finalGender = formData.gender === 'I use a different term' 
        ? formData.genderOther 
        : formData.gender;

      // Insert participant - only include fields that exist in the database
      const participantInsert: any = {
        title: formData.title || null,
        first_name: formData.firstName,
        last_name: formData.lastName,
        gender: finalGender,
        email: formData.email,
        phone: formData.phone,
        home_tel: formData.homeTel || null,
        date_of_birth: dateOfBirth,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        post_code: formData.postCode,
        council_region: formData.councilRegion,
        emergency_contact_name: `${formData.emergencyContactFirstName} ${formData.emergencyContactLastName}`,
        emergency_contact_phone: formData.emergencyContactPhone,
      };

      // Note: Age and age_range are calculated but not stored in the database
      // They can be calculated on-demand from date_of_birth
      // If needed in the future, add these columns to the database schema first
      console.log('Calculated age:', participantAge, 'Age range:', participantAgeRange);

      // Add optional fields that may not exist in older schemas
      const optionalFields = {
        township: formData.township,
        township_other: formData.township === 'Other' ? formData.townshipOther : null,
        postal_address_line1: formData.postalAddressLine1 || null,
        postal_address_line2: formData.postalAddressLine2 || null,
        postal_postcode: formData.postalPostcode || null,
        receive_newsletter: formData.receiveNewsletter,
        receive_course_notifications: formData.receiveCourseNotifications,
        emergency_contact_address: formData.emergencyContactAddress || null,
        emergency_contact_relationship: formData.emergencyContactRelationship || null,
        identify_aboriginal_tsi: formData.identifyAboriginalTSI || null,
        speak_other_language: formData.speakOtherLanguage || null,
        other_language_details: formData.otherLanguageDetails || null,
        country_of_birth: formData.countryOfBirth || null,
        cultural_identity: formData.culturalIdentity || null,
        cultural_identity_details: formData.culturalIdentityDetails || null,
        lgbti_community: formData.lgbtiCommunity || null,
        referral_sources: JSON.stringify(referralSources),
        photo_consent: JSON.stringify(photoConsent),
        program_specific_data: JSON.stringify(formData.programSpecificData)
      };

      // Age and age_range are calculated for display purposes but NOT stored in database
      // To store them, you would need to add these columns to your participants table first:
      // ALTER TABLE participants ADD COLUMN age INTEGER;
      // ALTER TABLE participants ADD COLUMN age_range TEXT;

      // Try to add optional fields, but don't fail if they don't exist
      Object.assign(participantInsert, optionalFields);

      // Insert participant
      const { data: participantData, error: supabaseError } = await supabase
        .from('participants')
        .insert([participantInsert])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      // Enroll participant in selected programs
      if (formData.selectedPrograms.length > 0) {
        // Create enrollment records using the program IDs directly
        const programEnrollments = formData.selectedPrograms.map(programId => ({
          participant_id: participantData.id,
          program_id: programId
        }));

        // Insert enrollments into database
        const { error: enrollmentError } = await supabase
          .from('program_enrollments')
          .insert(programEnrollments);

        if (enrollmentError) {
          console.error('Error enrolling participant in programs:', enrollmentError);
          throw enrollmentError;
        }

        console.log('Participant enrolled in', formData.selectedPrograms.length, 'programs');
      }
      
      console.log('New participant added:', participantData);
      console.log('Selected programs:', formData.selectedPrograms);
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding participant:', err);
      setError(err.message || 'Failed to add participant. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <Layout title="Add New Participant">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-4 border-green-400 rounded-2xl p-12 md:p-16 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Success!
            </h3>
            <p className="text-xl text-green-700 font-semibold">
              Participant has been registered
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Participant Registration">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 border-4 border-green-200">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 bg-green-50 p-5 rounded-xl">
            <div className="p-3 bg-green-600 rounded-lg">
              <UserPlus size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Registration Form
              </h3>
              <p className="text-gray-600 text-lg mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-3 text-base md:text-lg font-bold px-2">
              <span className={currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}>
                1. General Info
              </span>
              <span className={currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}>
                2. Select Programs
              </span>
              <span className={currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}>
                3. Program Details
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-700 h-4 rounded-full transition-all duration-500 shadow-md"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-4 border-red-400 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-bold text-red-900 mb-1">Error</h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step Content */}
            {currentStep === 1 && (
              <GeneralInfoStep 
                formData={formData} 
                handleChange={handleChange} 
              />
            )}

            {currentStep === 2 && (
              <ProgramSelectionStep
                selectedPrograms={formData.selectedPrograms}
                onToggleProgram={handleProgramToggle}
              />
            )}

            {currentStep === 3 && (
              <ProgramSpecificStep
                selectedPrograms={formData.selectedPrograms}
                programData={formData.programSpecificData}
                onDataChange={handleProgramDataChange}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-8 border-t-2 border-gray-200">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-2 px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={24} />
                  Back
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 px-6 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Next
                  <ArrowRight size={24} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 px-6 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Registration'}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="sm:w-auto px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
