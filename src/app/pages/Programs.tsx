import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Users, Clock, Calendar } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description: string;
  days: string[];
  start_time: string;
  end_time: string;
  capacity: number;
  recurrence_type: string;
  event_date?: string; // DEPRECATED: kept for backward compatibility
  start_date?: string;
  week_of_month?: number;
  day_of_week?: string;
  created_at: string;
}

interface ProgramStaff {
  id: string;
  program_id: string;
  user_id: string;
  assigned_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface ProgramWithEnrollment extends Program {
  enrollment_count?: number;
}

export default function Programs() {
  const [programs, setPrograms] = useState<ProgramWithEnrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [programStaff, setProgramStaff] = useState<Record<string, ProgramStaff[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: [] as string[],
    start_time: '',
    end_time: '',
    capacity: 20,
    recurrence_type: 'weekly',
    event_date_month: '',
    event_date_day: '',
    event_date_year: '',
    start_date_month: '',
    start_date_day: '',
    start_date_year: '',
    week_of_month: '',
    day_of_week: ''
  });

  useEffect(() => {
    fetchPrograms();
    fetchUsers();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Fetch enrollment counts for all programs
      const programsWithCounts = await Promise.all(
        (data || []).map(async (program) => {
          const { count } = await supabase
            .from('program_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);

          return {
            ...program,
            enrollment_count: count || 0
          };
        })
      );

      setPrograms(programsWithCounts);

      // Fetch staff for all programs
      if (data && data.length > 0) {
        const programIds = data.map(p => p.id);
        
        // First, get all program_staff records
        const { data: staffAssignments, error: staffError } = await supabase
          .from('program_staff')
          .select('*')
          .in('program_id', programIds);

        if (staffError) {
          console.error('Error fetching staff assignments:', staffError);
        } else if (staffAssignments && staffAssignments.length > 0) {
          // Get unique user IDs
          const userIds = [...new Set(staffAssignments.map((s: any) => s.user_id))];
          
          // Fetch profiles for these users
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else {
            // Create a map of user_id to profile
            const profilesMap = new Map();
            (profiles || []).forEach((profile: any) => {
              profilesMap.set(profile.id, profile);
            });

            // Combine staff assignments with profile data
            const staffByProgram: Record<string, ProgramStaff[]> = {};
            staffAssignments.forEach((staff: any) => {
              if (!staffByProgram[staff.program_id]) {
                staffByProgram[staff.program_id] = [];
              }
              const profile = profilesMap.get(staff.user_id);
              staffByProgram[staff.program_id].push({
                ...staff,
                profiles: profile || { full_name: 'Unknown', email: 'Unknown' }
              });
            });
            setProgramStaff(staffByProgram);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to fetch programs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('approved', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
    }
  };

  const handleAddProgram = async () => {
    // Validation
    if (!formData.name) {
      alert('Please enter a program name');
      return;
    }

    if (formData.recurrence_type === 'monthly') {
      if (!formData.week_of_month || !formData.day_of_week) {
        alert('Please select the week and day for the monthly event');
        return;
      }
    } else {
      if (formData.days.length === 0) {
        alert('Please select at least one day for the program');
        return;
      }
    }

    if (!formData.start_time || !formData.end_time) {
      alert('Please select start and end times');
      return;
    }

    if (!formData.start_date_month || !formData.start_date_day || !formData.start_date_year) {
      alert('Please select a start date for the program');
      return;
    }

    try {
      const programData: any = {
        name: formData.name,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        capacity: formData.capacity,
        recurrence_type: formData.recurrence_type,
        start_date: `${formData.start_date_year}-${formData.start_date_month.padStart(2, '0')}-${formData.start_date_day.padStart(2, '0')}`,
      };

      if (formData.recurrence_type === 'monthly') {
        programData.week_of_month = parseInt(formData.week_of_month);
        programData.day_of_week = formData.day_of_week;
        programData.days = [];
      } else {
        programData.days = formData.days;
      }

      const { error } = await supabase
        .from('programs')
        .insert([programData]);

      if (error) {
        throw error;
      }

      setShowAddModal(false);
      resetForm();
      fetchPrograms();
    } catch (err: any) {
      console.error('Error adding program:', err);
      alert('Failed to add program: ' + err.message);
    }
  };

  const handleEditProgram = async () => {
    if (!selectedProgram) return;

    // Validation
    if (!formData.name) {
      alert('Please enter a program name');
      return;
    }

    if (formData.recurrence_type === 'monthly') {
      if (!formData.week_of_month || !formData.day_of_week) {
        alert('Please select the week and day for the monthly event');
        return;
      }
    } else {
      if (formData.days.length === 0) {
        alert('Please select at least one day for the program');
        return;
      }
    }

    if (!formData.start_time || !formData.end_time) {
      alert('Please select start and end times');
      return;
    }

    if (!formData.start_date_month || !formData.start_date_day || !formData.start_date_year) {
      alert('Please select a start date for the program');
      return;
    }

    try {
      const programData: any = {
        name: formData.name,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        capacity: formData.capacity,
        recurrence_type: formData.recurrence_type,
        start_date: `${formData.start_date_year}-${formData.start_date_month.padStart(2, '0')}-${formData.start_date_day.padStart(2, '0')}`,
      };

      if (formData.recurrence_type === 'monthly') {
        programData.week_of_month = parseInt(formData.week_of_month);
        programData.day_of_week = formData.day_of_week;
        programData.days = [];
      } else {
        programData.days = formData.days;
      }

      const { error } = await supabase
        .from('programs')
        .update(programData)
        .eq('id', selectedProgram.id);

      if (error) {
        throw error;
      }

      setShowEditModal(false);
      setSelectedProgram(null);
      resetForm();
      fetchPrograms();
    } catch (err: any) {
      console.error('Error updating program:', err);
      alert('Failed to update program: ' + err.message);
    }
  };

  const handleDeleteProgram = async (programId: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete "${programName}"? This will also remove all enrollments and attendance records.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      fetchPrograms();
    } catch (err: any) {
      console.error('Error deleting program:', err);
      alert('Failed to delete program: ' + err.message);
    }
  };

  const handleAssignStaff = async (userId: string) => {
    if (!selectedProgram) return;

    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('program_staff')
        .select('id')
        .eq('program_id', selectedProgram.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        alert('This staff member is already assigned to this program.');
        return;
      }

      const { error } = await supabase
        .from('program_staff')
        .insert([{
          program_id: selectedProgram.id,
          user_id: userId
        }]);

      if (error) throw error;
      fetchPrograms();
    } catch (err: any) {
      console.error('Error assigning staff:', err);
      if (err.code === '23505') {
        alert('This staff member is already assigned to this program.');
      } else {
        alert('Failed to assign staff: ' + err.message);
      }
    }
  };

  const handleRemoveStaff = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this staff member from the program?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('program_staff')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      fetchPrograms();
    } catch (err: any) {
      console.error('Error removing staff:', err);
      alert('Failed to remove staff: ' + err.message);
    }
  };

  const openEditModal = (program: Program) => {
    setSelectedProgram(program);
    const formDataUpdate: any = {
      name: program.name,
      description: program.description || '',
      days: program.days || [],
      start_time: program.start_time,
      end_time: program.end_time,
      capacity: program.capacity,
      recurrence_type: program.recurrence_type || 'weekly',
      event_date_month: '',
      event_date_day: '',
      event_date_year: '',
      start_date_month: '',
      start_date_day: '',
      start_date_year: '',
      week_of_month: program.week_of_month?.toString() || '',
      day_of_week: program.day_of_week || ''
    };

    if (program.event_date) {
      const parts = program.event_date.split('-');
      formDataUpdate.event_date_year = parts[0];
      formDataUpdate.event_date_month = parts[1];
      formDataUpdate.event_date_day = parts[2];
    }

    if (program.start_date) {
      const parts = program.start_date.split('-');
      formDataUpdate.start_date_year = parts[0];
      formDataUpdate.start_date_month = parts[1];
      formDataUpdate.start_date_day = parts[2];
    }

    setFormData(formDataUpdate);
    setShowEditModal(true);
  };

  const openStaffModal = (program: Program) => {
    setSelectedProgram(program);
    setShowStaffModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      days: [],
      start_time: '',
      end_time: '',
      capacity: 20,
      recurrence_type: 'weekly',
      event_date_month: '',
      event_date_day: '',
      event_date_year: '',
      start_date_month: '',
      start_date_day: '',
      start_date_year: '',
      week_of_month: '',
      day_of_week: ''
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Generate month options
  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate day options (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Generate year options (current year + 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

  const assignedStaffIds = selectedProgram ? (programStaff[selectedProgram.id] || []).map(s => s.user_id) : [];
  const availableUsers = users.filter(u => !assignedStaffIds.includes(u.id));
  const assignedUsers = selectedProgram ? (programStaff[selectedProgram.id] || []) : [];

  return (
    <Layout title="View Programs">
      <div className="max-w-7xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 p-6 rounded-2xl border-4 border-red-200">
            <h3 className="text-2xl font-bold text-red-900 mb-2">⚠️ Error</h3>
            <p className="text-lg text-red-800">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">All Programs</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus size={24} />
            Add Program
          </button>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Loading programs...</p>
            </div>
          </div>
        ) : programs.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-8 rounded-2xl border-4 border-blue-200">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">📋 Database Setup Required</h3>
              <p className="text-lg text-blue-800 mb-4">
                It looks like you haven't set up the programs table yet. To get started with sample programs:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-lg text-blue-800 mb-4">
                <li>Open your Supabase Dashboard</li>
                <li>Go to the SQL Editor</li>
                <li>Copy and paste the contents of <code className="bg-blue-100 px-2 py-1 rounded">supabase-setup.sql</code></li>
                <li>Run the query to create sample programs</li>
                <li>Refresh this page</li>
              </ol>
              <p className="text-base text-blue-700">
                The SQL file includes 5 sample programs (Outdoor Playgroup, Homework Club, Community Lunch, Art Workshop, and Seniors Exercise).
              </p>
            </div>
            
            <div className="bg-yellow-50 p-8 rounded-2xl border-4 border-yellow-200 text-center">
              <p className="text-2xl font-bold text-yellow-900 mb-2">Or Create Your First Program</p>
              <p className="text-xl text-yellow-700 mb-4">Click "Add Program" above to manually create a program.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categorize programs */}
            {(() => {
              const childrenProgramNames = [
                'Outdoor Playgroup',
                'Homework Club',
                'Dungeons & Dragons',
                'Intergenerational Mentoring'
              ];

              const fitnessProgramNames = [
                'Community Fun Fitness',
                'Strength & Balance (Stirling)',
                'Chi Kung',
                'Walking Group',
                "Men's Moves"
              ];

              const childrenPrograms = programs.filter(p => childrenProgramNames.includes(p.name));
              const fitnessPrograms = programs.filter(p => fitnessProgramNames.includes(p.name));
              const categorizedNames = [...childrenProgramNames, ...fitnessProgramNames];
              const genericPrograms = programs.filter(p =>
                !categorizedNames.includes(p.name)
              );

              const renderProgramCard = (program: ProgramWithEnrollment) => {
                const remaining = program.capacity - (program.enrollment_count || 0);
                return (
                  <div key={program.id} className="bg-white p-6 rounded-2xl border-4 border-gray-200 shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{program.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(program)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          title="Edit program"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteProgram(program.id, program.name)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                          title="Delete program"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{program.description || 'No description'}</p>

                    <div className="space-y-3">
                      {program.recurrence_type === 'monthly' ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={18} className="text-purple-600" />
                          <span className="text-sm font-semibold">
                            {program.week_of_month && program.day_of_week
                              ? `Every ${['1st', '2nd', '3rd', '4th'][program.week_of_month - 1]} ${program.day_of_week} of the month`
                              : 'Monthly (schedule not set)'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={18} className="text-purple-600" />
                          <span className="text-sm font-semibold">
                            {program.recurrence_type === 'fortnightly' ? 'Fortnightly: ' : ''}
                            {program.days?.join(', ') || 'No days set'}
                          </span>
                        </div>
                      )}

                      {program.start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={18} className="text-green-600" />
                          <span className="text-sm font-semibold">
                            Starts: {new Date(program.start_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={18} className="text-blue-600" />
                        <span className="text-sm font-semibold">
                          {program.start_time} - {program.end_time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={18} className="text-green-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Capacity: {program.capacity}</span>
                          <span className="text-sm font-semibold text-blue-700">
                            Remaining: {remaining} {remaining === 0 && '(Full)'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t-2 border-gray-200">
                        <button
                          onClick={() => openStaffModal(program)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold transition-colors"
                        >
                          <Users size={18} />
                          Manage Staff ({(programStaff[program.id] || []).length})
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* Children's Programs Section */}
                  {childrenPrograms.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-purple-100 p-4 rounded-lg border-2 border-purple-300">
                        <h4 className="text-2xl font-bold text-purple-900">Children's Programs</h4>
                        <p className="text-sm text-purple-700 mt-1">Programs designed for children and families</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {childrenPrograms.map(program => renderProgramCard(program))}
                      </div>
                    </div>
                  )}

                  {/* Fitness Programs Section */}
                  {fitnessPrograms.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-orange-100 p-4 rounded-lg border-2 border-orange-300">
                        <h4 className="text-2xl font-bold text-orange-900">Fitness & Wellbeing Programs</h4>
                        <p className="text-sm text-orange-700 mt-1">Physical activity and health programs</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fitnessPrograms.map(program => renderProgramCard(program))}
                      </div>
                    </div>
                  )}

                  {/* Generic Programs Section */}
                  {genericPrograms.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
                        <h4 className="text-2xl font-bold text-green-900">General Programs</h4>
                        <p className="text-sm text-green-700 mt-1">Community activities and workshops</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {genericPrograms.map(program => renderProgramCard(program))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Add Program Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Add New Program</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Program Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter program name"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Enter program description"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Recurrence Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Month</label>
                      <select
                        value={formData.start_date_month}
                        onChange={(e) => setFormData({ ...formData, start_date_month: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {monthOptions.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Day</label>
                      <select
                        value={formData.start_date_day}
                        onChange={(e) => setFormData({ ...formData, start_date_day: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Year</label>
                      <select
                        value={formData.start_date_year}
                        onChange={(e) => setFormData({ ...formData, start_date_year: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {formData.recurrence_type === 'monthly' ? (
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Monthly Schedule <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Week of Month</label>
                        <select
                          value={formData.week_of_month}
                          onChange={(e) => setFormData({ ...formData, week_of_month: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1">1st</option>
                          <option value="2">2nd</option>
                          <option value="3">3rd</option>
                          <option value="4">4th</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Day of Week</label>
                        <select
                          value={formData.day_of_week}
                          onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Days <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.days.includes(day)}
                            onChange={() => toggleDay(day)}
                            className="w-5 h-5 rounded border-2 border-gray-300"
                          />
                          <span className="text-lg text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Start Time <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      End Time <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl text-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProgram}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl text-xl font-bold transition-all"
                >
                  Add Program
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Program Modal */}
        {showEditModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Edit Program</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Program Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter program name"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Enter program description"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Recurrence Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.recurrence_type}
                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Month</label>
                      <select
                        value={formData.start_date_month}
                        onChange={(e) => setFormData({ ...formData, start_date_month: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {monthOptions.map(month => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Day</label>
                      <select
                        value={formData.start_date_day}
                        onChange={(e) => setFormData({ ...formData, start_date_day: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {dayOptions.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Year</label>
                      <select
                        value={formData.start_date_year}
                        onChange={(e) => setFormData({ ...formData, start_date_year: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {yearOptions.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {formData.recurrence_type === 'monthly' ? (
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Monthly Schedule <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Week of Month</label>
                        <select
                          value={formData.week_of_month}
                          onChange={(e) => setFormData({ ...formData, week_of_month: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1">1st</option>
                          <option value="2">2nd</option>
                          <option value="3">3rd</option>
                          <option value="4">4th</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Day of Week</label>
                        <select
                          value={formData.day_of_week}
                          onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          {daysOfWeek.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Days <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.days.includes(day)}
                            onChange={() => toggleDay(day)}
                            className="w-5 h-5 rounded border-2 border-gray-300"
                          />
                          <span className="text-lg text-gray-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      Start Time <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">
                      End Time <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select time</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProgram(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl text-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProgram}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xl font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Staff Modal */}
        {showStaffModal && selectedProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Manage Program Staff</h3>
              <p className="text-xl text-gray-600 mb-6">{selectedProgram.name}</p>

              {/* Currently Assigned Staff */}
              <div className="mb-8">
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Assigned Staff</h4>
                {assignedUsers.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-lg text-gray-600">No staff assigned to this program yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedUsers.map(staff => (
                      <div key={staff.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{staff.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{staff.profiles?.email || 'No email'}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Staff to Assign */}
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Add Staff</h4>
                {availableUsers.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 text-center">
                    <p className="text-lg text-gray-600">All available staff are already assigned.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email} • {user.role}</p>
                        </div>
                        <button
                          onClick={() => handleAssignStaff(user.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    setShowStaffModal(false);
                    setSelectedProgram(null);
                  }}
                  className="w-full px-6 py-4 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl text-xl font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}