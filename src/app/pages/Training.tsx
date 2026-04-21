import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  ClipboardCheck, UserPlus, UserCheck, Search, BarChart3, GraduationCap,
  CheckCircle, FolderOpen, Home, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: typeof ClipboardCheck;
  color: string;
  route: string;
  steps: TrainingStep[];
}

interface TrainingStep {
  stepNumber: number;
  title: string;
  description: string;
  highlightTarget: 'logo' | 'logout' | 'sidebar' | 'dashboard-cards' | 'page-content' | 'filters' | 'form' | 'button';
  highlightPosition?: { top?: string; left?: string; right?: string; bottom?: string; width?: string; height?: string };
}

export default function Training() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const trainingModules: TrainingModule[] = [
    {
      id: 'basics',
      title: 'Staff Portal Basics',
      description: 'Learn the fundamental navigation and layout of the staff portal, including the header, sidebar, and dashboard.',
      icon: Home,
      color: 'gray',
      route: '/dashboard',
      steps: [
        {
          stepNumber: 1,
          title: 'Click the logo to return home',
          description: 'When a staff member is logged in, clicking the The Hut logo returns to the Dashboard. When no one is logged in, the same logo returns to the The Hut Community Staff Portal home page.',
          highlightTarget: 'logo',
        },
        {
          stepNumber: 2,
          title: 'Use Logout to end the session',
          description: 'Click Logout to sign out of the staff portal and return to the The Hut Community Staff Portal home page.',
          highlightTarget: 'logout',
        },
        {
          stepNumber: 3,
          title: 'Use the left sidebar to move around',
          description: 'Use the left sidebar to move between the main staff functions. The highlighted item shows that you are currently on the training page.',
          highlightTarget: 'sidebar',
        },
        {
          stepNumber: 4,
          title: 'Each dashboard card opens a staff function',
          description: 'The eight cards on the Dashboard take staff to Mark Attendance, Add New Participant, Add to Program, Find Participant, View Reports, Manage Programs, Staff Training, User Approvals pages.',
          highlightTarget: 'dashboard-cards',
        },
      ],
    },
    {
      id: 'attendance',
      title: 'Mark Attendance',
      description: 'Record participant attendance for programs and activities.',
      icon: ClipboardCheck,
      color: 'blue',
      route: '/attendance',
      steps: [
        {
          stepNumber: 1,
          title: 'Select the program',
          description: 'Use the program dropdown to choose which program session you want to mark attendance for.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 2,
          title: 'Select the date',
          description: 'Choose the date of the program session. The system will load participants enrolled in that program.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 3,
          title: 'Mark each participant',
          description: 'For each participant, click Present or Absent to record their attendance status.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 4,
          title: 'Save attendance records',
          description: 'Click the Save Attendance button to submit all attendance records for this session.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'add-participant',
      title: 'Add New Participant',
      description: 'Register a new participant to the system.',
      icon: UserPlus,
      color: 'green',
      route: '/add-participant-multistep',
      steps: [
        {
          stepNumber: 1,
          title: 'Fill in personal details',
          description: 'Enter the participant\'s basic information including name, date of birth, and contact details. All required fields are marked with an asterisk (*).',
          highlightTarget: 'form',
        },
        {
          stepNumber: 2,
          title: 'Add address information',
          description: 'Complete the address section with the participant\'s residential address, township, and council region.',
          highlightTarget: 'form',
        },
        {
          stepNumber: 3,
          title: 'Enter emergency contact',
          description: 'Provide emergency contact information including name and phone number for safety purposes.',
          highlightTarget: 'form',
        },
        {
          stepNumber: 4,
          title: 'Submit the form',
          description: 'Review all information and click Submit to create the new participant record in the system.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'add-to-program',
      title: 'Add to Program',
      description: 'Enroll existing participants in programs.',
      icon: UserCheck,
      color: 'purple',
      route: '/add-to-program',
      steps: [
        {
          stepNumber: 1,
          title: 'Search for the participant',
          description: 'Use the search bar to find the participant you want to enroll. You can search by name, email, or phone number.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 2,
          title: 'Select the participant',
          description: 'Click on the participant from the search results to select them for program enrollment.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 3,
          title: 'Choose the program',
          description: 'Select which program you want to enroll the participant in from the available programs list.',
          highlightTarget: 'form',
        },
        {
          stepNumber: 4,
          title: 'Confirm enrollment',
          description: 'Review the enrollment details and click Enroll to add the participant to the selected program.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'search',
      title: 'Find Participant',
      description: 'Search and view participant information.',
      icon: Search,
      color: 'orange',
      route: '/search',
      steps: [
        {
          stepNumber: 1,
          title: 'Enter search criteria',
          description: 'Type the participant\'s name, email, or phone number in the search field to find their record.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 2,
          title: 'View search results',
          description: 'Browse through the list of matching participants. Results show name, contact info, and enrollment status.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 3,
          title: 'Open participant profile',
          description: 'Click on a participant to view their full profile including personal details, program enrollments, and attendance history.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 4,
          title: 'Edit participant information',
          description: 'From the profile page, you can click Edit to update participant information if needed.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'reports',
      title: 'View Reports',
      description: 'Generate analytics and export data.',
      icon: BarChart3,
      color: 'teal',
      route: '/reports',
      steps: [
        {
          stepNumber: 1,
          title: 'Select time period',
          description: 'Choose the reporting period: Weekly, Monthly, Quarterly, Annually, or Custom Range to analyze data.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 2,
          title: 'Apply filters',
          description: 'Use filters to narrow down data by program, age group, gender, ATSI status, CALD background, council, or township.',
          highlightTarget: 'filters',
        },
        {
          stepNumber: 3,
          title: 'Preview the report',
          description: 'Click Preview Report to see the report with charts, statistics, and program details based on your selected filters.',
          highlightTarget: 'button',
        },
        {
          stepNumber: 4,
          title: 'Export data',
          description: 'Use the Export Report button to download the report as PDF or CSV format for sharing or record-keeping.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'programs',
      title: 'Manage Programs',
      description: 'View, edit, and assign staff to programs.',
      icon: FolderOpen,
      color: 'amber',
      route: '/programs',
      steps: [
        {
          stepNumber: 1,
          title: 'View all programs',
          description: 'See the complete list of programs including their schedule, capacity, and enrollment numbers.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 2,
          title: 'Edit program details',
          description: 'Click on a program to edit its name, description, schedule, capacity, or other settings.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 3,
          title: 'Assign staff to programs',
          description: 'Manage which staff members are assigned to facilitate each program.',
          highlightTarget: 'form',
        },
        {
          stepNumber: 4,
          title: 'Create new programs',
          description: 'Use the Add New Program button to create additional programs for participants to join.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'training',
      title: 'Staff Training',
      description: 'Learn how to use the portal effectively.',
      icon: GraduationCap,
      color: 'indigo',
      route: '/training',
      steps: [
        {
          stepNumber: 1,
          title: 'Choose a training module',
          description: 'Browse the available training modules and select one that matches what you need to learn.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 2,
          title: 'Start the walkthrough',
          description: 'Click "Open walkthrough" to launch the interactive guided tour for that module.',
          highlightTarget: 'button',
        },
        {
          stepNumber: 3,
          title: 'Follow the steps',
          description: 'Use the Next and Previous buttons to navigate through each step of the training at your own pace.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 4,
          title: 'Visit the actual page',
          description: 'Click "Open page" to go to the real version of the page and practice what you learned.',
          highlightTarget: 'button',
        },
      ],
    },
    {
      id: 'approvals',
      title: 'User Approvals',
      description: 'Review and approve new user registrations.',
      icon: CheckCircle,
      color: 'pink',
      route: '/approvals',
      steps: [
        {
          stepNumber: 1,
          title: 'View pending approvals',
          description: 'See the list of new staff members who have registered and are waiting for approval to access the portal.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 2,
          title: 'Review user details',
          description: 'Check each user\'s name, email, and requested role to verify they should have access.',
          highlightTarget: 'page-content',
        },
        {
          stepNumber: 3,
          title: 'Approve or deny access',
          description: 'Click Approve to grant access or Deny to reject the registration request.',
          highlightTarget: 'button',
        },
        {
          stepNumber: 4,
          title: 'Manage user roles',
          description: 'Approved users can be assigned different roles (staff, manager, admin) based on their responsibilities.',
          highlightTarget: 'form',
        },
      ],
    },
  ];

  const handleStartWalkthrough = (module: TrainingModule) => {
    setActiveModule(module);
    setCurrentStep(0);
  };

  const handleOpenPage = (route: string) => {
    navigate(route);
  };

  const handleNext = () => {
    if (activeModule && currentStep < activeModule.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setActiveModule(null);
    setCurrentStep(0);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; hover: string; icon: string }> = {
      gray: { bg: 'from-gray-500 to-gray-600', text: 'text-white', hover: 'hover:shadow-gray-300', icon: 'bg-white/20' },
      blue: { bg: 'from-blue-500 to-blue-600', text: 'text-white', hover: 'hover:shadow-blue-300', icon: 'bg-white/20' },
      green: { bg: 'from-green-500 to-green-600', text: 'text-white', hover: 'hover:shadow-green-300', icon: 'bg-white/20' },
      purple: { bg: 'from-purple-500 to-purple-600', text: 'text-white', hover: 'hover:shadow-purple-300', icon: 'bg-white/20' },
      orange: { bg: 'from-orange-500 to-orange-600', text: 'text-white', hover: 'hover:shadow-orange-300', icon: 'bg-white/20' },
      teal: { bg: 'from-teal-500 to-teal-600', text: 'text-white', hover: 'hover:shadow-teal-300', icon: 'bg-white/20' },
      amber: { bg: 'from-amber-500 to-amber-600', text: 'text-white', hover: 'hover:shadow-amber-300', icon: 'bg-white/20' },
      indigo: { bg: 'from-indigo-500 to-indigo-600', text: 'text-white', hover: 'hover:shadow-indigo-300', icon: 'bg-white/20' },
      pink: { bg: 'from-pink-500 to-pink-600', text: 'text-white', hover: 'hover:shadow-pink-300', icon: 'bg-white/20' },
    };
    return colorMap[color] || colorMap.gray;
  };

  const renderHighlight = (target: string) => {
    const highlights: Record<string, React.CSSProperties> = {
      logo: {
        position: 'absolute',
        top: '1.25rem',
        left: '1rem',
        width: '240px',
        height: '64px',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      logout: {
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        width: '140px',
        height: '48px',
        border: '4px solid #3B82F6',
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      sidebar: {
        position: 'absolute',
        top: '96px',
        left: '0',
        width: '288px',
        height: 'calc(100vh - 96px)',
        border: '4px solid #3B82F6',
        borderRadius: '8px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      'dashboard-cards': {
        position: 'absolute',
        top: '200px',
        left: '320px',
        right: '2rem',
        height: '600px',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      'page-content': {
        position: 'absolute',
        top: '180px',
        left: '320px',
        right: '2rem',
        bottom: '2rem',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      filters: {
        position: 'absolute',
        top: '180px',
        left: '320px',
        right: '2rem',
        height: '280px',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      form: {
        position: 'absolute',
        top: '220px',
        left: '360px',
        right: '4rem',
        height: '400px',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
      button: {
        position: 'absolute',
        bottom: '4rem',
        right: '4rem',
        width: '200px',
        height: '60px',
        border: '4px solid #3B82F6',
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      },
    };

    return <div style={highlights[target] || {}} />;
  };

  const getTextboxPosition = (target: string): React.CSSProperties => {
    const positions: Record<string, React.CSSProperties> = {
      logo: { position: 'fixed', top: '120px', left: '2rem', maxWidth: '400px' },
      logout: { position: 'fixed', top: '120px', right: '2rem', maxWidth: '400px' },
      sidebar: { position: 'fixed', top: '200px', left: '320px', maxWidth: '450px' },
      'dashboard-cards': { position: 'fixed', top: '220px', right: '2rem', maxWidth: '420px' },
      'page-content': { position: 'fixed', top: '200px', right: '2rem', maxWidth: '400px' },
      filters: { position: 'fixed', top: '480px', left: '360px', maxWidth: '450px' },
      form: { position: 'fixed', top: '240px', right: '3rem', maxWidth: '400px' },
      button: { position: 'fixed', bottom: '140px', right: '250px', maxWidth: '380px' },
    };

    return positions[target] || { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxWidth: '500px' };
  };

  if (activeModule) {
    const currentStepData = activeModule.steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === activeModule.steps.length - 1;

    return (
      <div className="fixed inset-0 z-50">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />

        {/* Highlighted area */}
        {renderHighlight(currentStepData.highlightTarget)}

        {/* Instruction textbox */}
        <div
          style={getTextboxPosition(currentStepData.highlightTarget)}
          className="bg-white rounded-xl shadow-2xl p-6 z-[1001]"
        >
          {/* Step number */}
          <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
            Step {currentStepData.stepNumber} of {activeModule.steps.length}
          </div>

          {/* Step title */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">{currentStepData.title}</h3>

          {/* Description */}
          <p className="text-base text-gray-700 mb-6">{currentStepData.description}</p>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isFirstStep
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {isLastStep ? (
              <button
                onClick={handleFinish}
                className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}

            <button
              onClick={handleFinish}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Exit walkthrough"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Mock page content (simplified representation) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Mock header */}
          <div className="h-20 bg-blue-600" />

          {/* Mock sidebar */}
          <div className="absolute top-20 left-0 w-72 h-full bg-white" />

          {/* Mock main content */}
          <div className="absolute top-20 left-72 right-0 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-6xl mx-auto">
              <div className="h-12 bg-gray-300 rounded-lg w-64 mb-6" />
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-white rounded-2xl shadow-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Staff Training">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Intro Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the training hub</h2>
          <p className="text-lg text-gray-700">
            Choose one training module below to open a guided walkthrough. Each module shows a mock version of the related page and explains the main actions staff should take there.
          </p>
        </div>

        {/* Module Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Training Modules</h2>
          <p className="text-base text-gray-600 mb-6">Select a module card to start the guided tour.</p>

          {/* Staff Portal Basics - Full Width */}
          <div className="mb-6">
            {(() => {
              const module = trainingModules[0];
              const Icon = module.icon;
              const colors = getColorClasses(module.color);

              return (
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-8 md:p-10 rounded-3xl shadow-2xl hover:shadow-indigo-300 hover:scale-[1.02] transition-all duration-300">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="bg-white/20 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center">
                      <Icon size={48} className="md:w-14 md:h-14" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl md:text-4xl font-bold mb-2">{module.title}</h3>
                      <p className="text-lg md:text-xl text-white/90">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleStartWalkthrough(module)}
                      className="flex-1 bg-white text-indigo-600 px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
                    >
                      Open walkthrough
                    </button>
                    <button
                      onClick={() => handleOpenPage(module.route)}
                      className="px-6 py-4 bg-indigo-700 text-white rounded-xl font-bold text-lg hover:bg-indigo-800 transition-colors border-2 border-white/20"
                    >
                      Open page
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Other Training Modules - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {trainingModules.slice(1).map((module) => {
              const Icon = module.icon;
              const colors = getColorClasses(module.color);

              return (
                <div
                  key={module.id}
                  className={`bg-gradient-to-br ${colors.bg} ${colors.text} p-8 md:p-10 rounded-3xl shadow-2xl ${colors.hover} hover:scale-105 transition-all duration-300`}
                >
                  <div className={`${colors.icon} w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon size={48} className="md:w-14 md:h-14" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">{module.title}</h3>
                  <p className="text-base md:text-lg mb-6 opacity-90">{module.description}</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleStartWalkthrough(module)}
                      className="w-full bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30"
                    >
                      Open walkthrough
                    </button>
                    <button
                      onClick={() => handleOpenPage(module.route)}
                      className="w-full bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors border border-white/20"
                    >
                      Open page
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
