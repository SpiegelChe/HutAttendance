import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { Search, UserCheck, Plus, AlertCircle } from 'lucide-react';
import { supabase, Participant, Program, isSupabaseConfigured } from '../../lib/supabase';

interface HealthInfo {
  asthma: boolean;
  sightImpairment: boolean;
  highBloodPressure: boolean;
  arthritis: boolean;
  jointReplacement: boolean;
  stroke: boolean;
  epilepsy: boolean;
  lowBloodPressure: boolean;
  insomnia: boolean;
  heartIssues: boolean;
  menopause: boolean;
  repetitiveStrainInjury: boolean;
  recentSurgery: boolean;
  ms: boolean;
  diabetes: boolean;
  recentFracture: boolean;
  difficultyHearing: boolean;
  hernia: boolean;
  osteoporosis: boolean;
  detachedRetina: boolean;
  takingMedications: boolean;
  medicationEffects: string;
  exerciseLevel: 'none' | 'small' | 'regular' | '';
  healthDeclarationSigned: boolean;
  healthDeclarationDate: string;
  medicalFormReceived: 'yes' | 'no' | 'na' | '';
  notes: string;
}

export default function AddToProgram() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Health Information for Fitness & Wellbeing Programs
  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    asthma: false,
    sightImpairment: false,
    highBloodPressure: false,
    arthritis: false,
    jointReplacement: false,
    stroke: false,
    epilepsy: false,
    lowBloodPressure: false,
    insomnia: false,
    heartIssues: false,
    menopause: false,
    repetitiveStrainInjury: false,
    recentSurgery: false,
    ms: false,
    diabetes: false,
    recentFracture: false,
    difficultyHearing: false,
    hernia: false,
    osteoporosis: false,
    detachedRetina: false,
    takingMedications: false,
    medicationEffects: '',
    exerciseLevel: '',
    healthDeclarationSigned: false,
    healthDeclarationDate: '',
    medicalFormReceived: '',
    notes: ''
  });

  useEffect(() => {
    fetchParticipants();
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedParticipant) {
      fetchAvailablePrograms(selectedParticipant);
    } else {
      setAvailablePrograms(programs);
    }
  }, [selectedParticipant, programs]);

  const fetchParticipants = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchAvailablePrograms = async (participantId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // Fetch all enrollments for this participant
      const { data: enrollments, error } = await supabase
        .from('program_enrollments')
        .select('program_id')
        .eq('participant_id', participantId);

      if (error) throw error;

      // Get list of program IDs the participant is already enrolled in
      const enrolledProgramIds = (enrollments || []).map(e => e.program_id);

      // Filter programs to show only those NOT enrolled
      const filtered = programs.filter(p => !enrolledProgramIds.includes(p.id));
      setAvailablePrograms(filtered);
    } catch (err) {
      console.error('Error fetching available programs:', err);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;

    const term = searchTerm.toLowerCase();
    return participants.filter(p =>
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  }, [searchTerm, participants]);

  // Check if selected program is a Fitness & Wellbeing program
  const isFitnessProgram = useMemo(() => {
    const selectedProgramData = programs.find(p => p.id === selectedProgram);
    if (!selectedProgramData) return false;

    const fitnessPrograms = [
      'Community Fun Fitness',
      'Chi Kung',
      'Walking Group',
      "Men's Moves",
      'Strength & Balance'
    ];

    return fitnessPrograms.some(name =>
      selectedProgramData.name.toLowerCase().includes(name.toLowerCase())
    );
  }, [selectedProgram, programs]);

  const handleAddToProgram = async () => {
    if (!selectedParticipant || !selectedProgram) {
      alert('Please select both a participant and a program');
      return;
    }

    if (!enrollmentDate) {
      alert('Please select an enrollment date');
      return;
    }

    // Validate health information for fitness programs
    if (isFitnessProgram) {
      if (!healthInfo.healthDeclarationSigned) {
        alert('Please confirm that the Health Declaration has been signed');
        return;
      }
      if (!healthInfo.healthDeclarationDate) {
        alert('Please enter the Health Declaration date');
        return;
      }
      if (!healthInfo.exerciseLevel) {
        alert('Please select the type of regular exercise');
        return;
      }
      if (!healthInfo.medicalFormReceived) {
        alert('Please indicate if the Medical Form was received (Yes/No/N/A)');
        return;
      }
    }

    try {
      // Convert date to ISO string at noon UTC to avoid timezone issues
      const [year, month, day] = enrollmentDate.split('-');
      const enrollmentDateTime = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)).toISOString();

      console.log('Selected enrollment date:', enrollmentDate);
      console.log('Converted to ISO:', enrollmentDateTime);

      // Prepare enrollment data
      const enrollmentData: any = {
        participant_id: selectedParticipant,
        program_id: selectedProgram,
        start_date: enrollmentDateTime,
        enrolled_at: enrollmentDateTime,
        is_active: true
      };

      // Add health information for fitness programs
      if (isFitnessProgram) {
        enrollmentData.enrollment_data = healthInfo;
      }

      const { error } = await supabase
        .from('program_enrollments')
        .insert([enrollmentData]);

      if (error) {
        // Check if it's a duplicate enrollment error
        if (error.code === '23505') {
          alert('This participant is already enrolled in this program');
          return;
        }
        throw error;
      }

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        setSelectedParticipant(null);
        setSelectedProgram('');
        setEnrollmentDate(new Date().toISOString().split('T')[0]);
        // Reset health info
        setHealthInfo({
          asthma: false,
          sightImpairment: false,
          highBloodPressure: false,
          arthritis: false,
          jointReplacement: false,
          stroke: false,
          epilepsy: false,
          lowBloodPressure: false,
          insomnia: false,
          heartIssues: false,
          menopause: false,
          repetitiveStrainInjury: false,
          recentSurgery: false,
          ms: false,
          diabetes: false,
          recentFracture: false,
          difficultyHearing: false,
          hernia: false,
          osteoporosis: false,
          detachedRetina: false,
          takingMedications: false,
          medicationEffects: '',
          exerciseLevel: '',
          healthDeclarationSigned: false,
          healthDeclarationDate: '',
          medicalFormReceived: '',
          notes: ''
        });
      }, 2000);
    } catch (err: any) {
      console.error('Error adding participant to program:', err);
      alert('Failed to add participant to program: ' + err.message);
    }
  };

  const selectedParticipantData = participants.find(p => p.id === selectedParticipant);

  return (
    <Layout title="Add Participant to Program">
      <div className="max-w-6xl mx-auto">
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
                <UserCheck size={48} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Success!
              </h3>
              <p className="text-xl text-gray-600 font-semibold">Participant added to program</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl mb-6 text-lg">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-blue-900 mb-2">Instructions</h3>
          <ol className="text-base text-blue-800 space-y-2 list-decimal list-inside">
            <li>Search for a participant using the search box below</li>
            <li>Click on a participant to select them</li>
            <li>Choose a program from the dropdown</li>
            <li>Click "Add to Program" to enroll them</li>
          </ol>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={28} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-20 pr-6 py-6 text-xl border-4 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white font-semibold"
            />
          </div>
        </div>

        {/* Selected Participant & Program Selection */}
        {selectedParticipant && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 mb-8 border-2 border-purple-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Selected Participant</h3>
            <div className="bg-white rounded-xl p-6 mb-6">
              <p className="text-xl font-bold text-gray-900">
                {selectedParticipantData?.first_name} {selectedParticipantData?.last_name}
              </p>
              <p className="text-lg text-gray-600">{selectedParticipantData?.email}</p>
              <p className="text-lg text-gray-600">{selectedParticipantData?.phone}</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xl font-bold text-gray-900">
                Select Program
              </label>
              {availablePrograms.length === 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
                  <p className="text-lg font-semibold text-yellow-800">
                    This participant is already enrolled in all available programs.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-6 py-5 text-xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white font-semibold"
                  >
                    <option value="">Choose a program...</option>
                    {availablePrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.name} - {program.days?.join(', ')} at {program.start_time}
                      </option>
                    ))}
                  </select>

                  <div>
                    <label className="block text-xl font-bold text-gray-900 mb-2">
                      Enrollment Date
                    </label>
                    <input
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-5 text-xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white font-semibold"
                    />
                    <p className="text-sm text-gray-600 mt-2 ml-2">
                      Select the date when the participant joined this program
                    </p>
                  </div>

                  {/* Health Information Form for Fitness & Wellbeing Programs */}
                  {isFitnessProgram && (
                    <div className="mt-8 bg-orange-50 border-4 border-orange-300 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <AlertCircle className="text-orange-600" size={32} />
                        <h3 className="text-2xl font-bold text-gray-900">Fitness & Wellbeing Programs - Health Information</h3>
                      </div>

                      <p className="text-base text-gray-700 mb-6 leading-relaxed">
                        This information will apply to all selected fitness & wellbeing programs.
                      </p>

                      <div className="space-y-6">
                        {/* Medical Conditions Checkboxes */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.asthma}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, asthma: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Asthma, shortness of breath</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.sightImpairment}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, sightImpairment: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Sight impairment</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.highBloodPressure}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, highBloodPressure: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">High blood pressure</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.arthritis}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, arthritis: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Arthritis</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.jointReplacement}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, jointReplacement: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Joint replacement</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.stroke}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, stroke: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Stroke</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.epilepsy}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, epilepsy: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Epilepsy</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.lowBloodPressure}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, lowBloodPressure: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Low blood pressure</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.insomnia}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, insomnia: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Insomnia</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.heartIssues}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, heartIssues: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Heart issues</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.menopause}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, menopause: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Menopause</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.repetitiveStrainInjury}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, repetitiveStrainInjury: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Repetitive strain injury</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.recentSurgery}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, recentSurgery: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Recent surgery</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.ms}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, ms: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">MS</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.diabetes}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, diabetes: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Diabetes</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.recentFracture}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, recentFracture: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Recent fracture</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.difficultyHearing}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, difficultyHearing: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Difficulty hearing</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.hernia}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, hernia: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Hernia</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.osteoporosis}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, osteoporosis: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Osteoporosis</span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.detachedRetina}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, detachedRetina: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Detached Retina</span>
                            </label>
                          </div>
                        </div>

                        {/* Medications */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <label className="flex items-start gap-3 cursor-pointer mb-3">
                            <input
                              type="checkbox"
                              checked={healthInfo.takingMedications}
                              onChange={(e) => setHealthInfo(prev => ({ ...prev, takingMedications: e.target.checked }))}
                              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                            />
                            <span className="text-base text-gray-800">Are you taking any medications for any of these conditions?</span>
                          </label>
                          {healthInfo.takingMedications && (
                            <div className="ml-8">
                              <label className="block text-base text-gray-800 mb-2">
                                If yes, how does the medication effect you?
                              </label>
                              <textarea
                                value={healthInfo.medicationEffects}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, medicationEffects: e.target.value }))}
                                placeholder="Please describe how the medication affects you..."
                                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>

                        {/* Exercise Level */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <p className="text-base text-gray-800 mb-3">Please comment on the type of regular exercise you are doing:</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="exerciseLevel"
                                checked={healthInfo.exerciseLevel === 'none'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, exerciseLevel: 'none' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">No reg exercise</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="exerciseLevel"
                                checked={healthInfo.exerciseLevel === 'small'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, exerciseLevel: 'small' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">Small amount of exercise</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="exerciseLevel"
                                checked={healthInfo.exerciseLevel === 'regular'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, exerciseLevel: 'regular' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">Reg.exercise</span>
                            </label>
                          </div>
                        </div>

                        {/* Health Declaration */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={healthInfo.healthDeclarationSigned}
                                onChange={(e) => setHealthInfo(prev => ({ ...prev, healthDeclarationSigned: e.target.checked }))}
                                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5 flex-shrink-0"
                              />
                              <span className="text-base text-gray-800">Health Declaration Signed - Yes</span>
                            </label>
                            {healthInfo.healthDeclarationSigned && (
                              <div className="ml-8">
                                <label className="block text-base text-gray-800 mb-2">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={healthInfo.healthDeclarationDate}
                                  onChange={(e) => setHealthInfo(prev => ({ ...prev, healthDeclarationDate: e.target.value }))}
                                  max={new Date().toISOString().split('T')[0]}
                                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Medical Form */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <p className="text-base text-gray-800 mb-3">Medical Form Received? (to be completed by a Medical Practitioner)</p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="medicalForm"
                                checked={healthInfo.medicalFormReceived === 'yes'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, medicalFormReceived: 'yes' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">Yes</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="medicalForm"
                                checked={healthInfo.medicalFormReceived === 'no'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, medicalFormReceived: 'no' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">No</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="medicalForm"
                                checked={healthInfo.medicalFormReceived === 'na'}
                                onChange={() => setHealthInfo(prev => ({ ...prev, medicalFormReceived: 'na' }))}
                                className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-base text-gray-800">N/A</span>
                            </label>
                          </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="bg-white rounded-lg p-6 border-2 border-orange-200">
                          <label className="block text-base text-gray-800 mb-3">Free form note</label>
                          <textarea
                            value={healthInfo.notes}
                            onChange={(e) => setHealthInfo(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any additional notes..."
                            className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAddToProgram}
                  disabled={!selectedProgram || availablePrograms.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-5 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Plus size={28} />
                    Add to Program
                  </div>
                </button>
                <button
                  onClick={() => {
                    setSelectedParticipant(null);
                    setSelectedProgram('');
                  }}
                  className="px-8 py-5 border-4 border-gray-300 text-gray-700 font-bold text-xl rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Loading participants...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="bg-gray-100 rounded-2xl p-12 text-center">
            <Search className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No participants found</h3>
            <p className="text-lg text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No participants have been registered yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-5 text-left text-lg font-bold">Name</th>
                  <th className="px-6 py-5 text-left text-lg font-bold hidden md:table-cell">Email</th>
                  <th className="px-6 py-5 text-left text-lg font-bold hidden lg:table-cell">Phone</th>
                  <th className="px-6 py-5 text-left text-lg font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParticipants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className={`${
                      selectedParticipant === participant.id
                        ? 'bg-purple-100 border-l-4 border-purple-600'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <td className="px-6 py-5 text-lg font-semibold text-gray-900">
                      {participant.first_name} {participant.last_name}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-600 hidden md:table-cell">
                      {participant.email || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-base text-gray-600 hidden lg:table-cell">
                      {participant.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => setSelectedParticipant(participant.id || null)}
                        className={`px-6 py-3 rounded-xl font-bold text-base transition-all ${
                          selectedParticipant === participant.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {selectedParticipant === participant.id ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
