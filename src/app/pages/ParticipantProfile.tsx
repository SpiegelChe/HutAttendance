import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, FileText, BookOpen, Clock, ChevronDown, ChevronUp, Users, Edit, Trash2, UserMinus, LogOut, ClipboardCheck, Check, X, UserCheck, CheckCircle, XCircle, History } from 'lucide-react';
import { supabase, Participant, Program, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  created_at?: string;
}

interface EnrolledProgram extends Program {
  enrolled_at?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  withdrawal_reason?: string;
  attendance_count?: number;
  attendance_records?: AttendanceRecord[];
  total_sessions?: number;
  enrollment_notes?: string;
  enrollment_data?: any; // Program-specific enrollment data
}

export default function ParticipantProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState<EnrolledProgram[]>([]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [showUnenrollAllConfirm, setShowUnenrollAllConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showReenrollConfirm, setShowReenrollConfirm] = useState(false);
  const [programToUnenroll, setProgramToUnenroll] = useState<EnrolledProgram | null>(null);
  const [programToReenroll, setProgramToReenroll] = useState<EnrolledProgram | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);
  const [reenrolling, setReenrolling] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [deactivationDate, setDeactivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reactivationDate, setReactivationDate] = useState(new Date().toISOString().split('T')[0]);
  const [reenrollmentDate, setReenrollmentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      fetchParticipant();
    }
  }, [id]);

  const fetchParticipant = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    try {
      // Fetch participant data
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (participantError) throw participantError;
      setParticipant(participantData);

      // Fetch enrolled programs (including inactive ones for historical view)
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('program_enrollments')
        .select(`
          enrolled_at,
          start_date,
          end_date,
          is_active,
          withdrawal_reason,
          programs (
            id,
            name,
            description,
            days,
            start_time,
            end_time,
            capacity
          )
        `)
        .eq('participant_id', id)
        .order('start_date', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Get program-specific data from participant's program_specific_data JSON field
      // Parse the JSON string from database
      let programSpecificData = {};
      try {
        programSpecificData = typeof participantData.program_specific_data === 'string'
          ? JSON.parse(participantData.program_specific_data)
          : (participantData.program_specific_data || {});
      } catch (e) {
        console.error('Error parsing program_specific_data:', e);
        programSpecificData = {};
      }

      // Map program names to their slug/ID used in the registration form
      // Note: These must match EXACTLY the program names in the database
      const programNameToSlug: Record<string, string> = {
        'Outdoor Playgroup': 'outdoor-playgroup',
        'Out & About': 'out-and-about',
        'Dungeons & Dragons': 'dungeons-dragons',
        'Workshop (Companion Animal)': 'workshop-companion-animal',
        'Strength & Balance (Stirling)': 'strength-balance-stirling',
        'Music Makers': 'music-makers',
        'Chi Kung': 'chi-kung',
        'Homework Club': 'homework-club',
        'Community Fun Fitness': 'community-fun-fitness',
        "Men's Moves": 'mens-moves',  // Note the apostrophe in Men's
        'Community Shed': 'community-shed',
        'Walking Group': 'walking-group'
      };

      // Transform the data to flatten the programs object and get attendance stats
      const programs = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          const programId = enrollment.programs?.id;
          const programName = enrollment.programs?.name;

          // Fetch attendance records for this program
          let attendance_count = 0;
          let attendance_records: AttendanceRecord[] = [];
          if (programId) {
            const { data: attendanceData } = await supabase
              .from('attendance_records')
              .select('id, date, status, created_at')
              .eq('program_id', programId)
              .eq('participant_id', id)
              .order('date', { ascending: false });

            attendance_records = attendanceData || [];
            attendance_count = attendanceData?.filter(a => a.status === 'present').length || 0;
          }

          // Get program-specific enrollment data if it exists
          // The data is stored with program slug as key, not the UUID
          const programSlug = programNameToSlug[programName] || '';
          const enrollmentData = programSpecificData[programSlug] || {};

          return {
            ...enrollment.programs,
            enrolled_at: enrollment.enrolled_at,
            start_date: enrollment.start_date,
            end_date: enrollment.end_date,
            is_active: enrollment.is_active,
            withdrawal_reason: enrollment.withdrawal_reason,
            attendance_count,
            attendance_records,
            enrollment_data: enrollmentData
          };
        })
      );

      setEnrolledPrograms(programs);
    } catch (err) {
      console.error('Error fetching participant:', err);
      setError('Failed to load participant profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleProgramExpansion = (programId: string | undefined) => {
    if (!programId) return;

    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!id || !isSupabaseConfigured) return;

    setDeleting(true);
    try {
      // First delete all program enrollments
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .delete()
        .eq('participant_id', id);

      if (enrollmentError) throw enrollmentError;

      // Delete attendance records
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('participant_id', id);

      if (attendanceError) throw attendanceError;

      // Finally delete the participant
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (participantError) throw participantError;

      // Navigate back to search page after successful deletion
      navigate('/search', { replace: true });
    } catch (err) {
      console.error('Error deleting participant:', err);
      setError('Failed to delete participant. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/participant/${id}/edit`);
  };

  const handleUnenrollFromProgram = async () => {
    if (!id || !programToUnenroll?.id || !isSupabaseConfigured) return;

    if (!withdrawalDate) {
      setError('Please select a withdrawal date');
      return;
    }

    setUnenrolling(true);
    try {
      // Update the enrollment record to mark it as inactive (historical tracking)
      const withdrawalDateTime = new Date(withdrawalDate).toISOString();
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          is_active: false,
          end_date: withdrawalDateTime,
          withdrawal_reason: 'Withdrawn by staff'
        })
        .eq('participant_id', id)
        .eq('program_id', programToUnenroll.id);

      if (enrollmentError) throw enrollmentError;

      // Refresh the participant data
      await fetchParticipant();

      setShowUnenrollConfirm(false);
      setProgramToUnenroll(null);
      setWithdrawalDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error unenrolling from program:', err);
      setError('Failed to unenroll from program. Please try again.');
      setShowUnenrollConfirm(false);
    } finally {
      setUnenrolling(false);
    }
  };

  const handleUnenrollFromAllPrograms = async () => {
    if (!id || !isSupabaseConfigured) return;

    if (!deactivationDate) {
      setError('Please select a deactivation date');
      return;
    }

    setUnenrolling(true);
    try {
      const deactivationDateTime = new Date(deactivationDate).toISOString();

      // Update all active enrollment records to mark them as inactive
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          is_active: false,
          end_date: deactivationDateTime,
          withdrawal_reason: 'Profile deactivated'
        })
        .eq('participant_id', id)
        .eq('is_active', true);

      if (enrollmentError) throw enrollmentError;

      // Update participant to mark as inactive
      const { error: participantError } = await supabase
        .from('participants')
        .update({
          is_active: false,
          deactivated_at: deactivationDateTime
        })
        .eq('id', id);

      if (participantError) throw participantError;

      // Refresh the participant data
      await fetchParticipant();

      setShowUnenrollAllConfirm(false);
      setDeactivationDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error making profile inactive:', err);
      setError('Failed to make profile inactive. Please try again.');
      setShowUnenrollAllConfirm(false);
    } finally {
      setUnenrolling(false);
    }
  };

  const handleReactivateProfile = async () => {
    if (!id || !isSupabaseConfigured) return;

    if (!reactivationDate) {
      setError('Please select a reactivation date');
      return;
    }

    setUnenrolling(true);
    try {
      // Convert date to ISO string at noon UTC to avoid timezone issues
      const [year, month, day] = reactivationDate.split('-');
      const reactivationDateTime = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)).toISOString();

      console.log('Selected reactivation date:', reactivationDate);
      console.log('Converted to ISO:', reactivationDateTime);

      // Update participant to mark as active
      const { error: participantError } = await supabase
        .from('participants')
        .update({
          is_active: true,
          reactivated_at: reactivationDateTime
        })
        .eq('id', id);

      if (participantError) throw participantError;

      // Re-activate all enrollments that were deactivated when profile became inactive
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          is_active: true,
          start_date: reactivationDateTime,
          end_date: null,
          withdrawal_reason: null
        })
        .eq('participant_id', id)
        .eq('is_active', false)
        .eq('withdrawal_reason', 'Profile deactivated');

      if (enrollmentError) throw enrollmentError;

      // Refresh the participant data
      await fetchParticipant();

      setShowReactivateConfirm(false);
      setReactivationDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error reactivating profile:', err);
      setError('Failed to reactivate profile. Please try again.');
    } finally {
      setUnenrolling(false);
    }
  };

  const handleReenrollInProgram = async () => {
    if (!id || !programToReenroll?.id || !isSupabaseConfigured) return;

    if (!reenrollmentDate) {
      setError('Please select a re-enrollment date');
      return;
    }

    setReenrolling(true);
    try {
      // Convert date to ISO string at noon UTC to avoid timezone issues
      const [year, month, day] = reenrollmentDate.split('-');
      const reenrollmentDateTime = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)).toISOString();

      console.log('Selected re-enrollment date:', reenrollmentDate);
      console.log('Converted to ISO:', reenrollmentDateTime);

      // Update the enrollment record to mark it as active again
      const { error: enrollmentError } = await supabase
        .from('program_enrollments')
        .update({
          is_active: true,
          start_date: reenrollmentDateTime,
          end_date: null,
          withdrawal_reason: null
        })
        .eq('participant_id', id)
        .eq('program_id', programToReenroll.id);

      if (enrollmentError) throw enrollmentError;

      // Refresh the participant data
      await fetchParticipant();

      setShowReenrollConfirm(false);
      setProgramToReenroll(null);
      setReenrollmentDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error re-enrolling in program:', err);
      setError('Failed to re-enroll in program. Please try again.');
      setShowReenrollConfirm(false);
    } finally {
      setReenrolling(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-orange-600 mx-auto mb-6"></div>
            <p className="text-2xl text-gray-600 font-semibold">Loading participant profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !participant) {
    return (
      <Layout title="Error">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border-4 border-red-400 text-red-800 px-8 py-6 rounded-xl mb-8">
            <p className="text-xl font-bold">{error || 'Participant not found'}</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-3 px-8 py-5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-xl font-bold transition-all"
          >
            <ArrowLeft size={24} />
            Back to Search
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Participant Profile">
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-2xl p-10 mb-8 text-white">
          <div className="flex items-center gap-6 mb-4">
            <div className="bg-white p-5 rounded-full">
              <User size={64} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold mb-2">
                  {participant.first_name} {participant.last_name}
                </h2>
                {enrolledPrograms.filter(p => p.is_active !== false).length === 0 ? (
                  <span className="px-4 py-2 bg-red-500 text-white rounded-full text-lg font-bold">
                    INACTIVE
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-green-500 text-white rounded-full text-lg font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xl opacity-90">Participant Profile</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Mail className="text-orange-600" size={32} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Email</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.email || 'Not provided'}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Phone</p>
              </div>
              <p className="text-xl text-gray-900 ml-9 font-semibold">{participant.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <User className="text-orange-600" size={32} />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Gender</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.gender || 'Not provided'}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Date of Birth</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">
                {participant.date_of_birth
                  ? new Date(participant.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not provided'}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl md:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Address</p>
              </div>
              <div className="text-xl text-gray-900 ml-9">
                <p>{participant.address_line1 || 'Not provided'}</p>
                {participant.address_line2 && <p>{participant.address_line2}</p>}
                <p>
                  {participant.township || ''}{participant.township_other ? ` (${participant.township_other})` : ''}
                  {participant.post_code ? `, ${participant.post_code}` : ''}
                </p>
                {participant.council_region && <p>{participant.council_region}</p>}
              </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Registration Date</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">
                {participant.created_at
                  ? new Date(participant.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not available'}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Participant ID</p>
              </div>
              <p className="text-base text-gray-700 ml-9 font-mono break-all">{participant.id}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Phone className="text-orange-600" size={32} />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Contact Name</p>
              </div>
              <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_name || 'Not provided'}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="text-orange-600" size={24} />
                <p className="text-lg font-bold text-gray-700">Contact Phone</p>
              </div>
              <p className="text-xl text-gray-900 ml-9 font-semibold">{participant.emergency_contact_phone || 'Not provided'}</p>
            </div>
            {participant.emergency_contact_relationship && (
              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-orange-600" size={24} />
                  <p className="text-lg font-bold text-gray-700">Relationship</p>
                </div>
                <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_relationship}</p>
              </div>
            )}
            {participant.emergency_contact_address && (
              <div className="bg-orange-50 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-orange-600" size={24} />
                  <p className="text-lg font-bold text-gray-700">Contact Address</p>
                </div>
                <p className="text-xl text-gray-900 ml-9">{participant.emergency_contact_address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cultural Background */}
        {(participant.identify_aboriginal_tsi || participant.country_of_birth || participant.speak_other_language || participant.cultural_identity || participant.lgbti_community) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-yellow-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Users className="text-yellow-600" size={32} />
              Cultural Background
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {participant.identify_aboriginal_tsi && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Aboriginal or Torres Strait Islander</p>
                  <p className="text-xl text-gray-900">{participant.identify_aboriginal_tsi}</p>
                </div>
              )}
              {participant.country_of_birth && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Country of Birth</p>
                  <p className="text-xl text-gray-900">{participant.country_of_birth}</p>
                </div>
              )}
              {participant.speak_other_language && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Speaks Other Language</p>
                  <p className="text-xl text-gray-900">{participant.speak_other_language}</p>
                  {participant.other_language_details && (
                    <p className="text-base text-gray-700 mt-2">Language(s): {participant.other_language_details}</p>
                  )}
                </div>
              )}
              {participant.cultural_identity && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">Cultural Identity</p>
                  <p className="text-xl text-gray-900">{participant.cultural_identity}</p>
                  {participant.cultural_identity_details && (
                    <p className="text-base text-gray-700 mt-2">{participant.cultural_identity_details}</p>
                  )}
                </div>
              )}
              {participant.lgbti_community && (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <p className="text-lg font-bold text-gray-700 mb-2">LGBTI+ Community Member</p>
                  <p className="text-xl text-gray-900">{participant.lgbti_community}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Communication Preferences */}
        {(participant.receive_newsletter !== null || participant.receive_course_notifications !== null) && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-indigo-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Mail className="text-indigo-600" size={32} />
              Communication Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-50 p-6 rounded-xl">
                <p className="text-lg font-bold text-gray-700 mb-2">Newsletter</p>
                <p className="text-xl text-gray-900">
                  {participant.receive_newsletter ? '✓ Subscribed' : '✗ Not subscribed'}
                </p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-xl">
                <p className="text-lg font-bold text-gray-700 mb-2">Program Notifications</p>
                <p className="text-xl text-gray-900">
                  {participant.receive_course_notifications ? '✓ Subscribed' : '✗ Not subscribed'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Referral Sources */}
        {(() => {
          let referralSources: string[] = [];
          try {
            referralSources = typeof participant.referral_sources === 'string'
              ? JSON.parse(participant.referral_sources)
              : (participant.referral_sources || []);
          } catch (e) {
            referralSources = [];
          }

          if (referralSources.length > 0) {
            return (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FileText className="text-purple-600" size={32} />
                  How They Found Us
                </h3>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="flex flex-wrap gap-3">
                    {referralSources.map((source, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-purple-200 text-purple-900 rounded-full text-base font-semibold"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Photo Consent */}
        {(() => {
          let photoConsent: any = {};
          try {
            photoConsent = typeof participant.photo_consent === 'string'
              ? JSON.parse(participant.photo_consent)
              : (participant.photo_consent || {});
          } catch (e) {
            photoConsent = {};
          }

          const hasAnyConsent = Object.values(photoConsent).some(v => v === true);

          if (hasAnyConsent) {
            return (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-pink-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FileText className="text-pink-600" size={32} />
                  Photo Consent
                </h3>
                <div className="bg-pink-50 p-6 rounded-xl">
                  <p className="text-base text-gray-700 mb-4">Permission granted for use in:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {photoConsent.website && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Website</span>
                      </div>
                    )}
                    {photoConsent.socialMedia && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Social Media</span>
                      </div>
                    )}
                    {photoConsent.annualReport && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Annual Report</span>
                      </div>
                    )}
                    {photoConsent.brochures && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Brochures & Flyers</span>
                      </div>
                    )}
                    {photoConsent.localMedia && (
                      <div className="flex items-center gap-2 text-lg text-gray-900">
                        <span className="text-green-600">✓</span>
                        <span>Local Media</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Additional Notes */}
        {participant.additional_requirements && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="text-orange-600" size={32} />
              Additional Requirements
            </h3>
            <div className="bg-orange-50 p-6 rounded-xl">
              <p className="text-lg text-gray-800 whitespace-pre-wrap">{participant.additional_requirements}</p>
            </div>
          </div>
        )}

        {/* Program-Specific Registration Responses */}
        {(() => {
          let programSpecificData: any = {};
          try {
            programSpecificData = typeof participant.program_specific_data === 'string'
              ? JSON.parse(participant.program_specific_data)
              : (participant.program_specific_data || {});
          } catch (e) {
            console.error('Error parsing program_specific_data:', e);
            programSpecificData = {};
          }

          const fitnessData = programSpecificData.fitness || {};

          // Handle both old format (single child object) and new format (multiple children array)
          let childrenArray = [];
          if (programSpecificData.allChildren && programSpecificData.allChildren.length > 0) {
            // New format with multiple children
            childrenArray = programSpecificData.allChildren;
          } else {
            // Old format (single child)
            const childrenDataRaw = programSpecificData.children || {};
            childrenArray = Object.keys(childrenDataRaw).length > 0 ? [childrenDataRaw] : [];
          }

          const hasChildrenData = childrenArray.length > 0;
          const hasFitnessData = Object.keys(fitnessData).length > 0;

          if (!hasChildrenData && !hasFitnessData) return null;

          return (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="text-purple-600" size={32} />
                Program-Specific Registration Information
              </h3>

              <div className="space-y-6">
                {/* Children's Programs Data */}
                {hasChildrenData && (
                  <div className="space-y-4">
                    {childrenArray.map((childrenData, childIndex) => (
                      <div key={childIndex} className="bg-purple-50 p-6 rounded-xl border-2 border-purple-300">
                        <h4 className="text-xl font-bold text-purple-900 mb-4">
                          Children's Programs Information {childrenArray.length > 1 ? `- Child ${childIndex + 1}` : ''}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {childrenData.childGivenName && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Given Name</p>
                          <p className="text-base text-gray-900">{childrenData.childGivenName}</p>
                        </div>
                      )}
                      {childrenData.childFamilyName && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Family Name</p>
                          <p className="text-base text-gray-900">{childrenData.childFamilyName}</p>
                        </div>
                      )}
                      {childrenData.childGender && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Gender</p>
                          <p className="text-base text-gray-900">{childrenData.childGender}</p>
                        </div>
                      )}
                      {childrenData.childDOB && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Date of Birth</p>
                          <p className="text-base text-gray-900">
                            {new Date(childrenData.childDOB).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {childrenData.childAboriginalTSI && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Aboriginal or Torres Strait Islander</p>
                          <p className="text-base text-gray-900">{childrenData.childAboriginalTSI}</p>
                        </div>
                      )}
                      {childrenData.schoolAttending && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">School Attending</p>
                          <p className="text-base text-gray-900">{childrenData.schoolAttending}</p>
                        </div>
                      )}
                      {childrenData.yearLevel && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Year Level</p>
                          <p className="text-base text-gray-900">{childrenData.yearLevel}</p>
                        </div>
                      )}
                      {childrenData.childPhotoConsent && (
                        <div className="bg-white p-4 rounded-lg md:col-span-2">
                          <p className="text-sm font-bold text-purple-700 mb-1">Child Photo Consent</p>
                          <p className="text-base text-gray-900 whitespace-pre-wrap">{childrenData.childPhotoConsent}</p>
                        </div>
                      )}
                    </div>

                    {/* Authorized Persons */}
                    {(childrenData.authorisedPerson1Name || childrenData.authorisedPerson2Name) && (
                      <div className="mt-4 bg-yellow-100 p-4 rounded-lg">
                        <p className="text-sm font-bold text-yellow-900 mb-3">Authorized to Collect Child</p>
                        <div className="space-y-3">
                          {childrenData.authorisedPerson1Name && (
                            <div className="bg-white p-3 rounded">
                              <p className="text-base font-semibold text-gray-900">{childrenData.authorisedPerson1Name}</p>
                              {childrenData.authorisedPerson1Phone && (
                                <p className="text-sm text-gray-700">Phone: {childrenData.authorisedPerson1Phone}</p>
                              )}
                            </div>
                          )}
                          {childrenData.authorisedPerson2Name && (
                            <div className="bg-white p-3 rounded">
                              <p className="text-base font-semibold text-gray-900">{childrenData.authorisedPerson2Name}</p>
                              {childrenData.authorisedPerson2Phone && (
                                <p className="text-sm text-gray-700">Phone: {childrenData.authorisedPerson2Phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {childrenData.custodyIssues && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Custody Issues</p>
                          <p className="text-base text-gray-900">{childrenData.custodyIssues}</p>
                          {childrenData.custodyIssuesDetails && (
                            <p className="text-sm text-gray-700 mt-2">{childrenData.custodyIssuesDetails}</p>
                          )}
                        </div>
                      )}
                      {childrenData.ownWayHomePermission && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-purple-700 mb-1">Permission to Make Own Way Home</p>
                          <p className="text-base text-gray-900">{childrenData.ownWayHomePermission}</p>
                          {childrenData.ownWayHomeDetails && (
                            <p className="text-sm text-gray-700 mt-2">{childrenData.ownWayHomeDetails}</p>
                          )}
                        </div>
                      )}
                    </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fitness Programs Data */}
                {hasFitnessData && (
                  <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-300">
                    <h4 className="text-xl font-bold text-orange-900 mb-4">Fitness & Wellbeing Programs - Health Information</h4>
                    <div className="space-y-4">
                      {fitnessData.healthConditions && fitnessData.healthConditions.length > 0 && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-2">Health Conditions</p>
                          <div className="flex flex-wrap gap-2">
                            {fitnessData.healthConditions.map((condition: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-orange-200 text-orange-900 rounded-full text-sm font-semibold"
                              >
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {fitnessData.regularExercise && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Regular Exercise Level</p>
                          <p className="text-base text-gray-900">{fitnessData.regularExercise}</p>
                        </div>
                      )}
                      {fitnessData.medicalProcedures && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Medical Procedures (Last 12 Months)</p>
                          <p className="text-base text-gray-900 whitespace-pre-wrap">{fitnessData.medicalProcedures}</p>
                        </div>
                      )}
                      {fitnessData.medicalTreatmentAcknowledged && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Medical Treatment Acknowledgement</p>
                          <p className="text-base text-gray-900">
                            ✓ Acknowledged - {fitnessData.medicalTreatmentAcknowledgedDate
                              ? new Date(fitnessData.medicalTreatmentAcknowledgedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Date not recorded'}
                          </p>
                        </div>
                      )}
                      {fitnessData.healthDeclarationSigned && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Health Declaration</p>
                          <p className="text-base text-gray-900">
                            ✓ Signed - {fitnessData.healthDeclarationDate
                              ? new Date(fitnessData.healthDeclarationDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Date not recorded'}
                          </p>
                        </div>
                      )}
                      {fitnessData.medicalFormReceived && (
                        <div className="bg-white p-4 rounded-lg">
                          <p className="text-sm font-bold text-orange-700 mb-1">Medical Form Received</p>
                          <p className="text-base text-gray-900">{fitnessData.medicalFormReceived}</p>
                          {fitnessData.medicalFormReceivedNotes && (
                            <p className="text-sm text-gray-700 mt-2">Notes: {fitnessData.medicalFormReceivedNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Enrolled Programs */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <BookOpen className="text-orange-600" size={32} />
            Enrolled Programs
          </h3>

          {enrolledPrograms.length === 0 ? (
            <div className="bg-orange-50 p-8 rounded-xl text-center">
              <BookOpen className="mx-auto mb-4 text-orange-400" size={48} />
              <p className="text-xl text-gray-700 font-semibold">Not enrolled in any programs yet</p>
              <p className="text-lg text-gray-600 mt-2">Click "Add to Program" below to enroll this participant</p>
            </div>
          ) : (
            <>
              {enrolledPrograms.filter(p => p.is_active !== false).length === 0 && (
                <div className="bg-yellow-50 p-6 rounded-xl text-center border-2 border-yellow-300 mb-4">
                  <p className="text-lg text-yellow-900 font-semibold">⚠️ All enrollments have been withdrawn</p>
                  <p className="text-base text-yellow-800 mt-1">Showing historical program enrollments below</p>
                </div>
              )}
              <div className="space-y-4">
              {enrolledPrograms.map((program) => {
                const isExpanded = expandedPrograms.has(program.id || '');
                return (
                  <div
                    key={program.id}
                    className="bg-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-all overflow-hidden"
                  >
                    {/* Program Header - Always Visible */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleProgramExpansion(program.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-xl font-bold text-gray-900">{program.name}</h4>
                            {program.is_active === false ? (
                              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                                WITHDRAWN
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
                                ACTIVE
                              </span>
                            )}
                            <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-semibold">
                              {program.attendance_count || 0} attended
                            </span>
                          </div>

                          {/* Enrollment Date - Prominently Displayed */}
                          {program.start_date && (
                            <div className="bg-green-100 border-2 border-green-300 px-4 py-3 rounded-lg mb-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="text-green-700" size={22} />
                                <div>
                                  <span className="text-xs font-bold text-green-700 block">Enrolled On</span>
                                  <span className="text-lg font-bold text-green-900">
                                    {new Date(program.start_date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Withdrawal Date - Show for inactive enrollments */}
                          {program.is_active === false && program.end_date && (
                            <div className="bg-red-100 border-2 border-red-300 px-4 py-3 rounded-lg mb-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="text-red-700" size={22} />
                                <div>
                                  <span className="text-xs font-bold text-red-700 block">Withdrawn On</span>
                                  <span className="text-lg font-bold text-red-900">
                                    {new Date(program.end_date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  {program.withdrawal_reason && (
                                    <span className="text-sm text-red-700 block mt-1">
                                      Reason: {program.withdrawal_reason}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {program.description && (
                            <p className="text-base text-gray-600 mb-3">{program.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-base text-gray-700">
                            <div className="flex items-center gap-2">
                              <Clock className="text-orange-600" size={18} />
                              <span className="font-semibold">{program.start_time} - {program.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="text-orange-600" size={18} />
                              <span>{program.days && program.days.length > 0 ? program.days.join(', ') : 'No days'}</span>
                            </div>
                            {program.capacity && (
                              <div className="flex items-center gap-2">
                                <Users className="text-orange-600" size={18} />
                                <span>Capacity: {program.capacity}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          className="ml-4 p-2 hover:bg-orange-200 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProgramExpansion(program.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="text-orange-600" size={24} />
                          ) : (
                            <ChevronDown className="text-orange-600" size={24} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t-2 border-orange-200 pt-4 space-y-4">
                        {/* Unenroll Button - Only show for active enrollments */}
                        {program.is_active !== false && (
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProgramToUnenroll(program);
                                setShowUnenrollConfirm(true);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                            >
                              <UserMinus size={20} />
                              Unenroll from this Program
                            </button>
                          </div>
                        )}

                        {/* Re-enroll Button - Only show for inactive enrollments */}
                        {program.is_active === false && (
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProgramToReenroll(program);
                                setShowReenrollConfirm(true);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                            >
                              <UserCheck size={20} />
                              Re-enroll in this Program
                            </button>
                          </div>
                        )}

                        {/* Program Details */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-300">
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="text-blue-600" size={22} />
                            <h5 className="font-bold text-blue-900 text-lg">Program Details</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {program.description && (
                              <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                                <span className="text-sm font-bold text-blue-700 mb-1 block">Description</span>
                                <span className="text-base text-gray-900">{program.description}</span>
                              </div>
                            )}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Schedule</span>
                              <span className="text-base text-gray-900">
                                {program.days && program.days.length > 0 ? program.days.join(', ') : 'Not specified'}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Time</span>
                              <span className="text-base text-gray-900">
                                {program.start_time} - {program.end_time}
                              </span>
                            </div>
                            {program.capacity && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-blue-700 mb-1 block">Capacity</span>
                                <span className="text-base text-gray-900">{program.capacity} participants</span>
                              </div>
                            )}
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-sm font-bold text-blue-700 mb-1 block">Attendance</span>
                              <span className="text-base text-gray-900">{program.attendance_count || 0} sessions attended</span>
                            </div>
                            {program.start_date && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-green-700 mb-1 block">Start Date</span>
                                <span className="text-base text-gray-900">
                                  {new Date(program.start_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            {program.end_date && (
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <span className="text-sm font-bold text-red-700 mb-1 block">Withdrawal Date</span>
                                <span className="text-base text-gray-900">
                                  {new Date(program.end_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Attendance Records */}
                        {program.attendance_records && program.attendance_records.length > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-300">
                            <div className="flex items-center gap-2 mb-4">
                              <History className="text-green-600" size={22} />
                              <h5 className="font-bold text-green-900 text-lg">
                                Attendance History ({program.attendance_records.length} records)
                              </h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                              {program.attendance_records.map((record) => (
                                <div
                                  key={record.id}
                                  className={`p-4 rounded-lg shadow-sm border-2 ${
                                    record.status === 'present'
                                      ? 'bg-white border-green-300'
                                      : 'bg-gray-50 border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {record.status === 'present' ? (
                                      <CheckCircle className="text-green-600" size={20} />
                                    ) : (
                                      <XCircle className="text-gray-400" size={20} />
                                    )}
                                    <span
                                      className={`text-sm font-bold ${
                                        record.status === 'present' ? 'text-green-700' : 'text-gray-600'
                                      }`}
                                    >
                                      {record.status === 'present' ? 'Present' : 'Absent'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar size={16} />
                                    <span className="text-sm font-semibold">
                                      {new Date(record.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Program-Specific Registration Information */}
                        {program.enrollment_data && Object.keys(program.enrollment_data).length > 0 ? (
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-lg border-2 border-purple-300">
                            <div className="flex items-center gap-2 mb-4">
                              <FileText className="text-purple-600" size={22} />
                              <h5 className="font-bold text-purple-900 text-lg">Program-Specific Registration Data</h5>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(program.enrollment_data).map(([key, value]: [string, any]) => {
                                // Format the key from camelCase/snake_case to readable text
                                const formattedKey = key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/_/g, ' ')
                                  .replace(/^./, (str) => str.toUpperCase())
                                  .trim();

                                // Handle different value types
                                let displayValue = value;
                                if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                } else if (Array.isArray(value)) {
                                  displayValue = value.join(', ');
                                } else if (typeof value === 'object' && value !== null) {
                                  displayValue = JSON.stringify(value, null, 2);
                                } else if (value === null || value === undefined || value === '') {
                                  displayValue = 'Not provided';
                                }

                                return (
                                  <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-purple-700 mb-1">{formattedKey}</span>
                                      <span className="text-base text-gray-900 whitespace-pre-wrap break-words">
                                        {displayValue}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft size={24} />
            Back to Search
          </button>

          {user?.role === 'admin' && (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
              >
                <Edit size={24} />
                Edit Details
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
              >
                <Trash2 size={24} />
                Delete
              </button>
            </>
          )}

          {/* Show Reactivate button only if there are inactive programs from deactivation */}
          {enrolledPrograms.filter(p => p.is_active === false && p.withdrawal_reason === 'Profile deactivated').length > 0 ? (
            <button
              onClick={() => setShowReactivateConfirm(true)}
              className="flex-1 px-8 py-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Reactivate Profile & Re-enroll Programs
            </button>
          ) : (
            <button
              onClick={() => navigate('/add-to-program')}
              className="flex-1 px-8 py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Add to Program
            </button>
          )}

          {enrolledPrograms.filter(p => p.is_active !== false).length > 0 && (
            <button
              onClick={() => setShowUnenrollAllConfirm(true)}
              className="flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              <LogOut size={24} />
              Inactive Profile
            </button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-red-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Confirm Delete</h3>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-bold">{participant?.first_name} {participant?.last_name}</span>?
              </p>

              <p className="text-base text-red-600 font-semibold mb-6">
                This action cannot be undone. All enrollment and attendance records will be permanently deleted.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unenroll from Single Program Confirmation Modal */}
        {showUnenrollConfirm && programToUnenroll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-red-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <UserMinus size={32} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Confirm Unenroll</h3>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                Are you sure you want to unenroll <span className="font-bold">{participant?.first_name} {participant?.last_name}</span> from <span className="font-bold">{programToUnenroll.name}</span>?
              </p>

              <p className="text-base text-orange-600 font-semibold mb-4">
                The participant will be removed from this program. Attendance records will be kept for historical purposes.
              </p>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-900 mb-2">
                  Withdrawal Date
                </label>
                <input
                  type="date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Select the date when the participant left this program
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUnenrollConfirm(false);
                    setProgramToUnenroll(null);
                  }}
                  disabled={unenrolling}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollFromProgram}
                  disabled={unenrolling}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unenrolling ? 'Unenrolling...' : 'Unenroll'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Re-enroll in Program Confirmation Modal */}
        {showReenrollConfirm && programToReenroll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-green-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck size={32} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Re-enroll in Program</h3>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                Re-enroll <span className="font-bold">{participant?.first_name} {participant?.last_name}</span> in <span className="font-bold">{programToReenroll.name}</span>?
              </p>

              <p className="text-base text-green-600 font-semibold mb-4">
                The participant will be enrolled in this program again. Previous attendance records will be preserved.
              </p>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-900 mb-2">
                  Re-enrollment Date
                </label>
                <input
                  type="date"
                  value={reenrollmentDate}
                  onChange={(e) => setReenrollmentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Select the date when the participant rejoined this program
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowReenrollConfirm(false);
                    setProgramToReenroll(null);
                  }}
                  disabled={reenrolling}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReenrollInProgram}
                  disabled={reenrolling}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reenrolling ? 'Re-enrolling...' : 'Re-enroll'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reactivate Profile Confirmation Modal */}
        {showReactivateConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-green-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck size={32} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Reactivate Profile</h3>
              </div>

              <p className="text-lg text-gray-700 mb-4">
                Reactivate <span className="font-bold">{participant?.first_name} {participant?.last_name}</span>'s profile?
              </p>

              {enrolledPrograms.filter(p => p.is_active === false && p.withdrawal_reason === 'Profile deactivated').length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border-2 border-blue-300">
                  <p className="text-base font-semibold text-blue-900 mb-2">Programs that will be re-enrolled:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {enrolledPrograms
                      .filter(p => p.is_active === false && p.withdrawal_reason === 'Profile deactivated')
                      .map(program => (
                        <li key={program.id} className="text-base text-blue-800">{program.name}</li>
                      ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg mb-4 border-2 border-yellow-300">
                <p className="text-base text-yellow-900 font-semibold mb-2">⚠️ Important - Please Review Before Confirming:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li>Review the list of programs above that will be re-enrolled</li>
                  <li>Select the correct reactivation date below</li>
                  <li>Once confirmed, this action will immediately reactivate the profile and all listed programs</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg mb-4 border-2 border-green-200">
                <p className="text-base text-green-900 font-semibold mb-2">✓ What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  <li>Profile will be marked as active</li>
                  <li>All {enrolledPrograms.filter(p => p.is_active === false && p.withdrawal_reason === 'Profile deactivated').length} program(s) above will be automatically re-enrolled</li>
                  <li>All historical data and attendance records remain preserved</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-900 mb-2">
                  <span className="text-red-600">*</span> Reactivation Date (Required)
                </label>
                <input
                  type="date"
                  value={reactivationDate}
                  onChange={(e) => setReactivationDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
                <p className="text-sm text-gray-600 mt-2">
                  Select the date when the participant returned and profile became active again
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowReactivateConfirm(false);
                    setReactivationDate(new Date().toISOString().split('T')[0]);
                  }}
                  disabled={unenrolling}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReactivateProfile}
                  disabled={unenrolling || !reactivationDate}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!reactivationDate ? 'Please select a reactivation date' : ''}
                >
                  {unenrolling ? 'Reactivating...' : 'Confirm & Reactivate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inactive Profile Confirmation Modal */}
        {showUnenrollAllConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-orange-400">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-100 rounded-full">
                  <LogOut size={32} className="text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Make Profile Inactive</h3>
              </div>

              <p className="text-lg text-gray-700 mb-6">
                Are you sure you want to make <span className="font-bold">{participant?.first_name} {participant?.last_name}</span>'s profile inactive? This will unenroll them from <span className="font-bold">all {enrolledPrograms.filter(p => p.is_active !== false).length} program{enrolledPrograms.filter(p => p.is_active !== false).length !== 1 ? 's' : ''}</span>.
              </p>

              <div className="bg-orange-50 p-4 rounded-lg mb-6">
                <p className="text-base font-semibold text-orange-800 mb-2">Active programs to be unenrolled from:</p>
                <ul className="list-disc list-inside space-y-1">
                  {enrolledPrograms.filter(p => p.is_active !== false).map(program => (
                    <li key={program.id} className="text-base text-gray-700">{program.name}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
                <p className="text-base text-blue-900 font-semibold mb-2">ℹ️ Important Information:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Participant profile and data will be kept</li>
                  <li>Attendance records will be preserved</li>
                  <li>Profile will be listed in "Inactive" section</li>
                  <li>Can be reactivated anytime by adding to programs</li>
                </ul>
              </div>

              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-900 mb-2">
                  Deactivation Date
                </label>
                <input
                  type="date"
                  value={deactivationDate}
                  onChange={(e) => setDeactivationDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Select the date when the profile became inactive
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowUnenrollAllConfirm(false)}
                  disabled={unenrolling}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollFromAllPrograms}
                  disabled={unenrolling}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unenrolling ? 'Processing...' : 'Make Inactive'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
