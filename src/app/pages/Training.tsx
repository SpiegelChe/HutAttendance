import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import { Layout } from "../components/Layout";
import {
  ClipboardCheck,
  UserPlus,
  UserCheck,
  Search,
  BarChart3,
  GraduationCap,
  FolderOpen,
  Home,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Calendar,
  Check,
  Plus,
  Eye,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Camera,
  BookOpen,
  ArrowLeft,
  Pencil,
  Trash2,
  UserX,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: typeof ClipboardCheck;
  color: string;
  route: string;
  steps: TrainingStep[];
}

type HighlightTarget =
  | "logo"
  | "logout"
  | "sidebar"
  | "dashboard-cards"
  | "page-content"
  | "filters"
  | "form"
  | "button"
  | "reports-period"
  | "reports-program"
  | "reports-participant"
  | "reports-preview"
  | "reports-export"
  | "attendance-today"
  | "attendance-selection"
  | "attendance-list"
  | "participant-personal"
  | "participant-address"
  | "participant-emergency"
  | "participant-cultural"
  | "participant-other"
  | "participant-children-programs"
  | "participant-fitness-programs"
  | "participant-general-programs"
  | "participant-program-details"
  | "add-program-search"
  | "add-program-list"
  | "add-program-details"
  | "search-search"
  | "search-active-list"
  | "search-inactive-list"
  | "search-profile-general"
  | "search-profile-program-specific"
  | "search-profile-enrolled-programs"
  | "search-profile-active-buttons"
  | "search-profile-inactive-buttons"
  | "programs-add-modal"
  | "programs-categories"
  | "programs-edit-delete"
  | "programs-manage-staff";

interface TrainingStep {
  stepNumber: number | string;
  title: string;
  description: string;
  highlightTarget: HighlightTarget;
  highlightPosition?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width?: string;
    height?: string;
  };
}

interface OverlayRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius?: number;
}

const dashboardCardMocks = [
  {
    title: "Mark\nAttendance",
    description:
      "Record participant attendance for programs and activities",
    gradient: "from-blue-500 to-blue-600",
    icon: ClipboardCheck,
  },
  {
    title: "Add New\nParticipant",
    description: "Register a new participant to the system",
    gradient: "from-green-500 to-green-600",
    icon: UserPlus,
  },
  {
    title: "Add to\nProgram",
    description: "Enroll existing participants in programs",
    gradient: "from-purple-500 to-fuchsia-500",
    icon: UserCheck,
  },
  {
    title: "Find\nParticipant",
    description: "Search and view participant information",
    gradient: "from-orange-500 to-orange-600",
    icon: Search,
  },
  {
    title: "View Reports",
    description: "Generate analytics and export data",
    gradient: "from-cyan-500 to-teal-600",
    icon: BarChart3,
  },
  {
    title: "Manage\nPrograms",
    description: "View, edit, and assign staff to programs",
    gradient: "from-amber-500 to-orange-500",
    icon: FolderOpen,
  },
  {
    title: "Staff Training",
    description: "Learn how to use the portal effectively",
    gradient: "from-indigo-500 to-violet-600",
    icon: GraduationCap,
  },
];

const statsMocks = [
  {
    title: "Total Participants",
    value: "5",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Active Programs",
    value: "5",
    gradient: "from-green-500 to-green-600",
  },
  {
    title: "Today's Sessions",
    value: "3",
    gradient: "from-purple-500 to-fuchsia-500",
  },
];

const sidebarItemMocks = [
  "Home",
  "Mark Attendance",
  "Add New Participant",
  "Add to Program",
  "Find Participant",
  "View Reports",
  "Manage Programs",
  "Staff Training",
];

export default function Training() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeModule, setActiveModule] =
    useState<TrainingModule | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const walkthroughScrollRef = useRef<HTMLDivElement | null>(
    null,
  );
  const basicsCanvasRef = useRef<HTMLDivElement | null>(null);
  const basicsLogoRef = useRef<HTMLImageElement | null>(null);
  const basicsLogoutRef = useRef<HTMLButtonElement | null>(
    null,
  );
  const basicsSidebarRef = useRef<HTMLElement | null>(null);
  const basicsCardsRef = useRef<HTMLDivElement | null>(null);
  const [basicsHighlightStyle, setBasicsHighlightStyle] =
    useState<CSSProperties | null>(null);
  const reportsCanvasRef = useRef<HTMLDivElement | null>(null);
  const reportsPeriodRef = useRef<HTMLDivElement | null>(null);
  const reportsProgramRef = useRef<HTMLDivElement | null>(null);
  const reportsParticipantRef = useRef<HTMLDivElement | null>(
    null,
  );
  const reportsPreviewRef = useRef<HTMLDivElement | null>(null);
  const reportsExportRef = useRef<HTMLDivElement | null>(null);
  const [reportsHighlightStyle, setReportsHighlightStyle] =
    useState<CSSProperties | null>(null);
  const attendanceCanvasRef = useRef<HTMLDivElement | null>(
    null,
  );
  const attendanceTodayRef = useRef<HTMLDivElement | null>(
    null,
  );
  const attendanceSelectionRef = useRef<HTMLDivElement | null>(
    null,
  );
  const attendanceListRef = useRef<HTMLDivElement | null>(null);
  const [
    attendanceHighlightStyle,
    setAttendanceHighlightStyle,
  ] = useState<CSSProperties | null>(null);
  const addParticipantCanvasRef = useRef<HTMLDivElement | null>(
    null,
  );
  const addParticipantPersonalRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantAddressRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantEmergencyRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantCulturalRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantOtherRef = useRef<HTMLDivElement | null>(
    null,
  );
  const addParticipantChildrenProgramsRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantFitnessProgramsRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantGeneralProgramsRef =
    useRef<HTMLDivElement | null>(null);
  const addParticipantProgramDetailsRef =
    useRef<HTMLDivElement | null>(null);
  const [
    addParticipantHighlightStyle,
    setAddParticipantHighlightStyle,
  ] = useState<CSSProperties | null>(null);
  const addToProgramCanvasRef = useRef<HTMLDivElement | null>(
    null,
  );
  const addToProgramSearchRef = useRef<HTMLDivElement | null>(
    null,
  );
  const addToProgramListRef = useRef<HTMLDivElement | null>(
    null,
  );
  const addToProgramDetailsRef = useRef<HTMLDivElement | null>(
    null,
  );
  const [
    addToProgramHighlightStyle,
    setAddToProgramHighlightStyle,
  ] = useState<CSSProperties | null>(null);
  const searchTrainingCanvasRef = useRef<HTMLDivElement | null>(
    null,
  );
  const searchSearchRef = useRef<HTMLDivElement | null>(null);
  const searchActiveListRef = useRef<HTMLDivElement | null>(
    null,
  );
  const searchInactiveListRef = useRef<HTMLDivElement | null>(
    null,
  );
  const searchProfileGeneralRef = useRef<HTMLDivElement | null>(
    null,
  );
  const searchProfileProgramSpecificRef =
    useRef<HTMLDivElement | null>(null);
  const searchProfileEnrolledProgramsRef =
    useRef<HTMLDivElement | null>(null);
  const searchProfileActiveButtonsRef =
    useRef<HTMLDivElement | null>(null);
  const searchProfileInactiveButtonsRef =
    useRef<HTMLDivElement | null>(null);
  const [
    searchTrainingHighlightStyle,
    setSearchTrainingHighlightStyle,
  ] = useState<CSSProperties | null>(null);
  const programsCanvasRef = useRef<HTMLDivElement | null>(null);
  const programsAddModalRef = useRef<HTMLDivElement | null>(
    null,
  );
  const programsAddButtonRef = useRef<HTMLButtonElement | null>(
    null,
  );
  const programsChildrenTitleRef =
    useRef<HTMLDivElement | null>(null);
  const programsFitnessTitleRef = useRef<HTMLDivElement | null>(
    null,
  );
  const programsGeneralTitleRef = useRef<HTMLDivElement | null>(
    null,
  );
  const programsCategoriesRef = useRef<HTMLDivElement | null>(
    null,
  );
  const programsEditDeleteRef = useRef<HTMLDivElement | null>(
    null,
  );
  const programsManageStaffRef = useRef<HTMLDivElement | null>(
    null,
  );
  const [programsHighlightStyle, setProgramsHighlightStyle] =
    useState<CSSProperties | null>(null);
  const [programsOverlayRects, setProgramsOverlayRects] =
    useState<OverlayRect[]>([]);

  const trainingModules: TrainingModule[] = [
    {
      id: "basics",
      title: "Staff Portal Basics",
      description:
        "Learn the fundamental navigation and layout of the staff portal, including the header, sidebar, and dashboard.",
      icon: Home,
      color: "gray",
      route: "/dashboard",
      steps: [
        {
          stepNumber: 1,
          title: "Click the logo to return home",
          description:
            "When a staff member is logged in, clicking the The Hut logo returns to the Dashboard. When no one is logged in, the same logo returns to the The Hut Community Staff Portal home page.",
          highlightTarget: "logo",
        },
        {
          stepNumber: 2,
          title: "Use Logout to end the session",
          description:
            "Click Logout to sign out of the staff portal and return to the The Hut Community Staff Portal home page.",
          highlightTarget: "logout",
        },
        {
          stepNumber: 3,
          title: "Use the left sidebar to move around",
          description:
            "Use the left sidebar to move between the main staff functions. The highlighted item shows that you are currently on the training page.",
          highlightTarget: "sidebar",
        },
        {
          stepNumber: 4,
          title: "Each dashboard card opens a staff function",
          description:
            "The seven cards on the Dashboard take staff to Mark Attendance, Add New Participant, Add to Program, Find Participant, View Reports, Manage Programs, Staff Training pages.",
          highlightTarget: "dashboard-cards",
        },
      ],
    },
    {
      id: "attendance",
      title: "Mark Attendance",
      description:
        "Record participant attendance for programs.",
      icon: ClipboardCheck,
      color: "blue",
      route: "/attendance",
      steps: [
        {
          stepNumber: 1,
          title: "Today's Date",
          description:
            "At the top of the page, staff can quickly confirm today's date before recording attendance.",
          highlightTarget: "attendance-today",
        },
        {
          stepNumber: 2,
          title: "Select Program and Date",
          description:
            "Choose the program scheduled for today, then confirm or adjust the attendance date before continuing.",
          highlightTarget: "attendance-selection",
        },
        {
          stepNumber: 3,
          title: "Tick participants and save attendance",
          description:
            "Tick each participant who attended, review the attendance summary, then click Save Attendance to submit the record.",
          highlightTarget: "attendance-list",
        },
      ],
    },
    {
      id: "add-participant",
      title: "Add New Participant",
      description: "Register a new participant to the system.",
      icon: UserPlus,
      color: "green",
      route: "/add-participant-multistep",
      steps: [
        {
          stepNumber: "1.1",
          title: "General Info - Personal Information",
          description:
            "Start with the participant's personal details. Complete the name, email, phone, gender, and date of birth fields before moving on.",
          highlightTarget: "participant-personal",
        },
        {
          stepNumber: "1.2",
          title:
            "General Info - Home Address and Postal Address",
          description:
            "Complete the participant's home address first, including township, post code, and council region. If their postal address is different, add it in the postal address fields below.",
          highlightTarget: "participant-address",
        },
        {
          stepNumber: "1.3",
          title: "General Info - Emergency Details",
          description:
            "Record the emergency contact details so staff know who to contact if support is needed during activities.",
          highlightTarget: "participant-emergency",
        },
        {
          stepNumber: "1.4",
          title: "General Info - Cultural Background",
          description:
            "Use this section to capture cultural background information such as Aboriginal or Torres Strait Islander status, languages spoken, country of birth, and cultural identity.",
          highlightTarget: "participant-cultural",
        },
        {
          stepNumber: "1.5",
          title: "General Info - Other",
          description:
            "Finish the General Info step by reviewing communication preferences, how the participant heard about The Hut, and the photo consent options.",
          highlightTarget: "participant-other",
        },
        {
          stepNumber: "2.1",
          title: "Select Programs - Children's Programs",
          description:
            "In Step 2, begin by reviewing the Children's Programs area and select any youth or family programs the participant wants to join.",
          highlightTarget: "participant-children-programs",
        },
        {
          stepNumber: "2.2",
          title:
            "Select Programs - Fitness & Wellbeing Programs",
          description:
            "Next, review the Fitness & Wellbeing Programs section and choose any relevant health, exercise, or wellbeing activities.",
          highlightTarget: "participant-fitness-programs",
        },
        {
          stepNumber: "2.3",
          title: "Select Programs - General Programs",
          description:
            "Use the General Programs section for broader community activities and workshops that do not fall into the children or fitness categories.",
          highlightTarget: "participant-general-programs",
        },
        {
          stepNumber: "3",
          title: "Program Details",
          description:
            "After programs are selected, Step 3 collects any extra information required for those programs, such as child details or health information, before completing registration.",
          highlightTarget: "participant-program-details",
        },
      ],
    },
    {
      id: "add-to-program",
      title: "Add to Program",
      description: "Enroll existing participants in programs.",
      icon: UserCheck,
      color: "purple",
      route: "/add-to-program",
      steps: [
        {
          stepNumber: 1,
          title: "Search for a participant",
          description:
            "Use the search box to look up participants by name, email, or phone number before choosing who to add.",
          highlightTarget: "add-program-search",
        },
        {
          stepNumber: 2,
          title: "Review the participant list",
          description:
            "The participant list shows matching results. Click Select on the right side of a row to choose that participant and continue.",
          highlightTarget: "add-program-list",
        },
        {
          stepNumber: 3,
          title: "Select Program and add the participant",
          description:
            "After clicking Select, the chosen participant's basic information appears above. Then choose a program from Select Program and click Add to Program.",
          highlightTarget: "add-program-details",
        },
      ],
    },
    {
      id: "search",
      title: "Find Participant",
      description: "Search and view participant information.",
      icon: Search,
      color: "orange",
      route: "/search",
      steps: [
        {
          stepNumber: "1.1",
          title: "Search for participants",
          description:
            "Use the search box to find participants by name, email, or phone number.",
          highlightTarget: "search-search",
        },
        {
          stepNumber: "1.2",
          title: "Review Active Participants",
          description:
            "Active Participants appear first. Each row shows the participant's basic information and includes a View Profile button for more detail.",
          highlightTarget: "search-active-list",
        },
        {
          stepNumber: "1.3",
          title: "Expand Inactive Participants",
          description:
            "Use the Inactive Participants section to manually expand and review participants who are not currently enrolled. These rows also include a View Profile button.",
          highlightTarget: "search-inactive-list",
        },
        {
          stepNumber: "2.1",
          title: "Profile - General Info",
          description:
            "The participant profile shows key information collected in Add New Participant Step 1, including Contact Information, Personal Information, Emergency Contact, Cultural Background, Communication Preferences, and Photo Consent.",
          highlightTarget: "search-profile-general",
        },
        {
          stepNumber: "2.2",
          title:
            "Profile - Program-Specific Registration Information",
          description:
            "Below the general profile details, the page shows any program-specific registration information that was collected in Add New Participant Step 3.",
          highlightTarget: "search-profile-program-specific",
        },
        {
          stepNumber: "2.3",
          title: "Profile - Enrolled Programs",
          description:
            "The Enrolled Programs section lists the participant's current programs and basic enrolment details.",
          highlightTarget: "search-profile-enrolled-programs",
        },
        {
          stepNumber: "2.4",
          title: "Active profile actions",
          description:
            "For an active participant, staff can go Back to Search, Edit Details, Delete, Add to Program, or make the profile inactive.",
          highlightTarget: "search-profile-active-buttons",
        },
        {
          stepNumber: "2.5",
          title: "Inactive profile actions",
          description:
            "For an inactive participant, staff can go Back to Search, Edit Details, Delete, or reactivate the profile by adding the participant back to a program.",
          highlightTarget: "search-profile-inactive-buttons",
        },
      ],
    },
    {
      id: "reports",
      title: "View Reports",
      description: "Generate analytics and export data.",
      icon: BarChart3,
      color: "teal",
      route: "/reports",
      steps: [
        {
          stepNumber: 1,
          title: "Choose a reporting period",
          description:
            "Start by choosing a reporting period. Use Weekly, Monthly, Quarterly, Annually, or Custom Range, then confirm the Start date and End date that define the report scope.",
          highlightTarget: "reports-period",
        },
        {
          stepNumber: 2,
          title: "Choose the program filters",
          description:
            "Use Program category and Program to narrow the report to the relevant activities before reviewing the results.",
          highlightTarget: "reports-program",
        },
        {
          stepNumber: 3,
          title: "Choose participant filters",
          description:
            "Use Age group, Gender, ATSI status, CALD background, Council, and Township to focus the report on the participant group you need.",
          highlightTarget: "reports-participant",
        },
        {
          stepNumber: 4,
          title: "Preview the report",
          description:
            "Use Preview Report to generate the report on the page, then review the summary cards, charts, and report table shown below.",
          highlightTarget: "reports-preview",
        },
        {
          stepNumber: 5,
          title: "Export the report",
          description:
            "When the preview looks correct, use Export Report and choose either CSV or PDF depending on the format you need.",
          highlightTarget: "reports-export",
        },
      ],
    },
    {
      id: "programs",
      title: "Manage Programs",
      description: "View, edit, and assign staff to programs.",
      icon: FolderOpen,
      color: "amber",
      route: "/programs",
      steps: [
        {
          stepNumber: 1,
          title: "Add a new program",
          description:
            "Click Add Program to open the Add New Program form. Enter the required details such as program name, recurrence, days, start date, time, and capacity, then click Add Program to create it.",
          highlightTarget: "programs-add-modal",
        },
        {
          stepNumber: 2,
          title: "Programs are grouped by category",
          description:
            "Programs are displayed in three sections: Children's Programs, Fitness & Wellbeing Programs, and General Programs, making it easier to browse the program list.",
          highlightTarget: "programs-categories",
        },
        {
          stepNumber: 3,
          title: "Edit or delete a program",
          description:
            "Each program card includes Edit and Delete buttons so staff can update program details or remove a program when needed.",
          highlightTarget: "programs-edit-delete",
        },
        {
          stepNumber: 4,
          title: "Manage staff for each program",
          description:
            "Use Manage Staff on a program card to choose which staff members are assigned to that program and confirm the selection.",
          highlightTarget: "programs-manage-staff",
        },
      ],
    },
  ];

  useEffect(() => {
    if (!activeModule) {
      setBasicsHighlightStyle(null);
      setReportsHighlightStyle(null);
      setAttendanceHighlightStyle(null);
      setAddParticipantHighlightStyle(null);
      setAddToProgramHighlightStyle(null);
      setSearchTrainingHighlightStyle(null);
      setProgramsHighlightStyle(null);
      setProgramsOverlayRects([]);
      return;
    }

    const updateHighlight = () => {
      const target =
        activeModule.steps[currentStep]?.highlightTarget;

      if (activeModule.id === "programs") {
        const canvas = programsCanvasRef.current;
        if (!canvas || !target) return;

        const canvasRect = canvas.getBoundingClientRect();

        const buildRect = (
          element: HTMLElement | null,
          padding: number,
          borderRadius: number,
        ): OverlayRect | null => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top - canvasRect.top - padding,
            left: rect.left - canvasRect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            borderRadius,
          };
        };

        let rects: OverlayRect[] = [];

        if (target === "programs-add-modal") {
          rects = [
            buildRect(programsAddButtonRef.current, 8, 22),
            buildRect(programsAddModalRef.current, 10, 26),
          ].filter(Boolean) as OverlayRect[];
        } else if (target === "programs-categories") {
          rects = [
            buildRect(programsChildrenTitleRef.current, 8, 22),
            buildRect(programsFitnessTitleRef.current, 8, 22),
            buildRect(programsGeneralTitleRef.current, 8, 22),
          ].filter(Boolean) as OverlayRect[];
        } else if (target === "programs-edit-delete") {
          rects = [
            buildRect(programsEditDeleteRef.current, 8, 20),
          ].filter(Boolean) as OverlayRect[];
        } else if (target === "programs-manage-staff") {
          rects = [
            buildRect(programsManageStaffRef.current, 10, 26),
          ].filter(Boolean) as OverlayRect[];
        }

        setProgramsOverlayRects(rects);

        const primaryRect = rects[0];
        if (primaryRect) {
          setProgramsHighlightStyle({
            position: "absolute",
            top: `${primaryRect.top}px`,
            left: `${primaryRect.left}px`,
            width: `${primaryRect.width}px`,
            height: `${primaryRect.height}px`,
            border: "4px solid #3B82F6",
            borderRadius: `${primaryRect.borderRadius ?? 22}px`,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
            zIndex: 20,
            pointerEvents: "none",
          });
        } else {
          setProgramsHighlightStyle(null);
        }
        return;
      }

      if (activeModule.id === "basics") {
        const paddingByTarget: Partial<
          Record<HighlightTarget, number>
        > = {
          logo: 8,
          logout: 8,
          sidebar: 6,
          "dashboard-cards": 10,
        };

        const getTargetElement = () => {
          if (target === "logo") return basicsLogoRef.current;
          if (target === "logout")
            return basicsLogoutRef.current;
          if (target === "sidebar")
            return basicsSidebarRef.current;
          if (target === "dashboard-cards")
            return basicsCardsRef.current;
          return null;
        };

        const canvas = basicsCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = paddingByTarget[target] ?? 8;

        setBasicsHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius:
            target === "dashboard-cards" ? "24px" : "18px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      if (activeModule.id === "reports") {
        const getTargetElement = () => {
          if (target === "reports-period")
            return reportsPeriodRef.current;
          if (target === "reports-program")
            return reportsProgramRef.current;
          if (target === "reports-participant")
            return reportsParticipantRef.current;
          if (target === "reports-preview")
            return reportsPreviewRef.current;
          if (target === "reports-export")
            return reportsExportRef.current;
          return null;
        };

        const canvas = reportsCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = target === "reports-preview" ? 10 : 8;

        setReportsHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius: "22px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      if (activeModule.id === "attendance") {
        const paddingByTarget: Partial<
          Record<HighlightTarget, number>
        > = {
          "attendance-today": 8,
          "attendance-selection": 8,
          "attendance-list": 10,
        };

        const getTargetElement = () => {
          if (target === "attendance-today")
            return attendanceTodayRef.current;
          if (target === "attendance-selection")
            return attendanceSelectionRef.current;
          if (target === "attendance-list")
            return attendanceListRef.current;
          return null;
        };

        const canvas = attendanceCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = paddingByTarget[target] ?? 8;

        setAttendanceHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius:
            target === "attendance-list" ? "24px" : "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      if (activeModule.id === "add-participant") {
        const paddingByTarget: Partial<
          Record<HighlightTarget, number>
        > = {
          "participant-personal": 8,
          "participant-address": 8,
          "participant-emergency": 8,
          "participant-cultural": 8,
          "participant-other": 8,
          "participant-children-programs": 8,
          "participant-fitness-programs": 8,
          "participant-general-programs": 8,
          "participant-program-details": 10,
        };

        const getTargetElement = () => {
          if (target === "participant-personal")
            return addParticipantPersonalRef.current;
          if (target === "participant-address")
            return addParticipantAddressRef.current;
          if (target === "participant-emergency")
            return addParticipantEmergencyRef.current;
          if (target === "participant-cultural")
            return addParticipantCulturalRef.current;
          if (target === "participant-other")
            return addParticipantOtherRef.current;
          if (target === "participant-children-programs")
            return addParticipantChildrenProgramsRef.current;
          if (target === "participant-fitness-programs")
            return addParticipantFitnessProgramsRef.current;
          if (target === "participant-general-programs")
            return addParticipantGeneralProgramsRef.current;
          if (target === "participant-program-details")
            return addParticipantProgramDetailsRef.current;
          return null;
        };

        const canvas = addParticipantCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = paddingByTarget[target] ?? 8;

        setAddParticipantHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius:
            target === "participant-program-details"
              ? "24px"
              : "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      if (activeModule.id === "add-to-program") {
        const paddingByTarget: Partial<
          Record<HighlightTarget, number>
        > = {
          "add-program-search": 8,
          "add-program-list": 10,
          "add-program-details": 10,
        };

        const getTargetElement = () => {
          if (target === "add-program-search")
            return addToProgramSearchRef.current;
          if (target === "add-program-list")
            return addToProgramListRef.current;
          if (target === "add-program-details")
            return addToProgramDetailsRef.current;
          return null;
        };

        const canvas = addToProgramCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = paddingByTarget[target] ?? 8;

        setAddToProgramHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius:
            target === "add-program-list" ? "24px" : "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      if (activeModule.id === "search") {
        const paddingByTarget: Partial<
          Record<HighlightTarget, number>
        > = {
          "search-search": 8,
          "search-active-list": 10,
          "search-inactive-list": 10,
          "search-profile-general": 8,
          "search-profile-program-specific": 8,
          "search-profile-enrolled-programs": 8,
          "search-profile-active-buttons": 8,
          "search-profile-inactive-buttons": 8,
        };

        const getTargetElement = () => {
          if (target === "search-search")
            return searchSearchRef.current;
          if (target === "search-active-list")
            return searchActiveListRef.current;
          if (target === "search-inactive-list")
            return searchInactiveListRef.current;
          if (target === "search-profile-general")
            return searchProfileGeneralRef.current;
          if (target === "search-profile-program-specific")
            return searchProfileProgramSpecificRef.current;
          if (target === "search-profile-enrolled-programs")
            return searchProfileEnrolledProgramsRef.current;
          if (target === "search-profile-active-buttons")
            return searchProfileActiveButtonsRef.current;
          if (target === "search-profile-inactive-buttons")
            return searchProfileInactiveButtonsRef.current;
          return null;
        };

        const canvas = searchTrainingCanvasRef.current;
        const targetEl = getTargetElement();
        if (!canvas || !targetEl || !target) return;

        const canvasRect = canvas.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const padding = paddingByTarget[target] ?? 8;

        setSearchTrainingHighlightStyle({
          position: "absolute",
          top: `${targetRect.top - canvasRect.top - padding}px`,
          left: `${targetRect.left - canvasRect.left - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: "4px solid #3B82F6",
          borderRadius:
            target === "search-active-list" ||
            target === "search-inactive-list"
              ? "24px"
              : "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        });
        return;
      }

      setBasicsHighlightStyle(null);
      setReportsHighlightStyle(null);
      setAttendanceHighlightStyle(null);
      setAddParticipantHighlightStyle(null);
      setAddToProgramHighlightStyle(null);
      setSearchTrainingHighlightStyle(null);
      setProgramsHighlightStyle(null);
    };

    updateHighlight();

    const scroller = walkthroughScrollRef.current;
    window.addEventListener("resize", updateHighlight);
    scroller?.addEventListener("scroll", updateHighlight, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateHighlight);
      scroller?.removeEventListener("scroll", updateHighlight);
    };
  }, [activeModule, currentStep]);

  const handleStartWalkthrough = (module: TrainingModule) => {
    setActiveModule(module);
    setCurrentStep(0);
  };

  const handleOpenPage = (route: string) => {
    navigate(route);
  };

  const handleNext = () => {
    if (
      activeModule &&
      currentStep < activeModule.steps.length - 1
    ) {
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
    const colorMap: Record<
      string,
      { bg: string; text: string; hover: string; icon: string }
    > = {
      gray: {
        bg: "from-gray-500 to-gray-600",
        text: "text-white",
        hover: "hover:shadow-gray-300",
        icon: "bg-white/20",
      },
      blue: {
        bg: "from-blue-500 to-blue-600",
        text: "text-white",
        hover: "hover:shadow-blue-300",
        icon: "bg-white/20",
      },
      green: {
        bg: "from-green-500 to-green-600",
        text: "text-white",
        hover: "hover:shadow-green-300",
        icon: "bg-white/20",
      },
      purple: {
        bg: "from-purple-500 to-purple-600",
        text: "text-white",
        hover: "hover:shadow-purple-300",
        icon: "bg-white/20",
      },
      orange: {
        bg: "from-orange-500 to-orange-600",
        text: "text-white",
        hover: "hover:shadow-orange-300",
        icon: "bg-white/20",
      },
      teal: {
        bg: "from-teal-500 to-teal-600",
        text: "text-white",
        hover: "hover:shadow-teal-300",
        icon: "bg-white/20",
      },
      amber: {
        bg: "from-amber-500 to-amber-600",
        text: "text-white",
        hover: "hover:shadow-amber-300",
        icon: "bg-white/20",
      },
      indigo: {
        bg: "from-indigo-500 to-indigo-600",
        text: "text-white",
        hover: "hover:shadow-indigo-300",
        icon: "bg-white/20",
      },
      pink: {
        bg: "from-pink-500 to-pink-600",
        text: "text-white",
        hover: "hover:shadow-pink-300",
        icon: "bg-white/20",
      },
    };
    return colorMap[color] || colorMap.gray;
  };

  const getHighlightStyles = (
    target: HighlightTarget,
    moduleId?: string,
  ): CSSProperties => {
    if (moduleId === "add-to-program") {
      if (addToProgramHighlightStyle) {
        return addToProgramHighlightStyle;
      }

      return {
        position: "absolute",
        top: "260px",
        left: "90px",
        width: "860px",
        height: "120px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    if (moduleId === "search") {
      if (searchTrainingHighlightStyle) {
        return searchTrainingHighlightStyle;
      }

      const searchFallbacks: Partial<
        Record<HighlightTarget, CSSProperties>
      > = {
        "search-search": {
          position: "absolute",
          top: "500px",
          left: "110px",
          width: "1310px",
          height: "110px",
          border: "4px solid #3B82F6",
          borderRadius: "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-active-list": {
          position: "absolute",
          top: "660px",
          left: "110px",
          width: "1310px",
          height: "520px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-inactive-list": {
          position: "absolute",
          top: "1220px",
          left: "110px",
          width: "1310px",
          height: "260px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-profile-general": {
          position: "absolute",
          top: "300px",
          left: "80px",
          width: "1540px",
          height: "760px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-profile-program-specific": {
          position: "absolute",
          top: "1110px",
          left: "80px",
          width: "1540px",
          height: "280px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-profile-enrolled-programs": {
          position: "absolute",
          top: "1435px",
          left: "80px",
          width: "1540px",
          height: "380px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-profile-active-buttons": {
          position: "absolute",
          top: "1860px",
          left: "80px",
          width: "1540px",
          height: "110px",
          border: "4px solid #3B82F6",
          borderRadius: "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "search-profile-inactive-buttons": {
          position: "absolute",
          top: "1785px",
          left: "80px",
          width: "1540px",
          height: "110px",
          border: "4px solid #3B82F6",
          borderRadius: "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
      };

      return (
        searchFallbacks[target] || {
          position: "absolute",
          top: "300px",
          left: "80px",
          width: "900px",
          height: "180px",
          border: "4px solid #3B82F6",
          borderRadius: "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        }
      );
    }

    if (moduleId === "programs") {
      if (programsHighlightStyle) {
        return programsHighlightStyle;
      }

      const programsFallbacks: Partial<
        Record<HighlightTarget, CSSProperties>
      > = {
        "programs-add-modal": {
          position: "absolute",
          top: "220px",
          left: "430px",
          width: "840px",
          height: "980px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "programs-categories": {
          position: "absolute",
          top: "370px",
          left: "70px",
          width: "1460px",
          height: "1280px",
          border: "4px solid #3B82F6",
          borderRadius: "26px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "programs-edit-delete": {
          position: "absolute",
          top: "640px",
          left: "430px",
          width: "190px",
          height: "64px",
          border: "4px solid #3B82F6",
          borderRadius: "20px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
        "programs-manage-staff": {
          position: "absolute",
          top: "320px",
          left: "470px",
          width: "760px",
          height: "760px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        },
      };

      return (
        programsFallbacks[target] || {
          position: "absolute",
          top: "220px",
          left: "430px",
          width: "840px",
          height: "980px",
          border: "4px solid #3B82F6",
          borderRadius: "24px",
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
          zIndex: 20,
          pointerEvents: "none",
        }
      );
    }

    if (moduleId === "basics") {
      if (basicsHighlightStyle) {
        return basicsHighlightStyle;
      }

      return {
        position: "absolute",
        top: "24px",
        left: "24px",
        width: "200px",
        height: "80px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    if (moduleId === "reports") {
      if (reportsHighlightStyle) {
        return reportsHighlightStyle;
      }

      return {
        position: "absolute",
        top: "200px",
        left: "80px",
        width: "540px",
        height: "180px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    if (moduleId === "attendance") {
      if (attendanceHighlightStyle) {
        return attendanceHighlightStyle;
      }

      return {
        position: "absolute",
        top: "250px",
        left: "90px",
        width: "920px",
        height: "190px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    if (moduleId === "add-participant") {
      if (addParticipantHighlightStyle) {
        return addParticipantHighlightStyle;
      }

      return {
        position: "absolute",
        top: "260px",
        left: "90px",
        width: "860px",
        height: "260px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    if (moduleId === "add-to-program") {
      if (addToProgramHighlightStyle) {
        return addToProgramHighlightStyle;
      }

      return {
        position: "absolute",
        top: "260px",
        left: "90px",
        width: "860px",
        height: "120px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.58)",
        zIndex: 20,
        pointerEvents: "none",
      };
    }

    const highlights: Record<HighlightTarget, CSSProperties> = {
      logo: {
        position: "absolute",
        top: "1.25rem",
        left: "1rem",
        width: "240px",
        height: "64px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      logout: {
        position: "absolute",
        top: "1.5rem",
        right: "1.5rem",
        width: "140px",
        height: "48px",
        border: "4px solid #3B82F6",
        borderRadius: "8px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      sidebar: {
        position: "absolute",
        top: "96px",
        left: "0",
        width: "288px",
        height: "calc(100% - 96px)",
        border: "4px solid #3B82F6",
        borderRadius: "8px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "dashboard-cards": {
        position: "absolute",
        top: "200px",
        left: "320px",
        right: "2rem",
        height: "600px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "page-content": {
        position: "absolute",
        top: "180px",
        left: "320px",
        right: "2rem",
        bottom: "2rem",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      filters: {
        position: "absolute",
        top: "180px",
        left: "320px",
        right: "2rem",
        height: "280px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      form: {
        position: "absolute",
        top: "220px",
        left: "360px",
        right: "4rem",
        height: "400px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      button: {
        position: "absolute",
        bottom: "4rem",
        right: "4rem",
        width: "200px",
        height: "60px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "reports-period": {
        position: "absolute",
        top: "180px",
        left: "80px",
        width: "600px",
        height: "220px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "reports-program": {
        position: "absolute",
        top: "420px",
        left: "80px",
        width: "600px",
        height: "180px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "reports-participant": {
        position: "absolute",
        top: "620px",
        left: "80px",
        width: "940px",
        height: "270px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "reports-preview": {
        position: "absolute",
        top: "920px",
        left: "80px",
        width: "920px",
        height: "560px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "reports-export": {
        position: "absolute",
        top: "920px",
        left: "1020px",
        width: "360px",
        height: "180px",
        border: "4px solid #3B82F6",
        borderRadius: "12px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "attendance-today": {
        position: "absolute",
        top: "260px",
        left: "90px",
        width: "920px",
        height: "150px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "attendance-selection": {
        position: "absolute",
        top: "450px",
        left: "90px",
        width: "920px",
        height: "290px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "attendance-list": {
        position: "absolute",
        top: "780px",
        left: "90px",
        width: "920px",
        height: "700px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-personal": {
        position: "absolute",
        top: "240px",
        left: "80px",
        width: "880px",
        height: "300px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-address": {
        position: "absolute",
        top: "580px",
        left: "80px",
        width: "880px",
        height: "420px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-emergency": {
        position: "absolute",
        top: "1030px",
        left: "80px",
        width: "880px",
        height: "240px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-cultural": {
        position: "absolute",
        top: "1310px",
        left: "80px",
        width: "880px",
        height: "320px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-other": {
        position: "absolute",
        top: "1670px",
        left: "80px",
        width: "880px",
        height: "420px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-children-programs": {
        position: "absolute",
        top: "320px",
        left: "80px",
        width: "900px",
        height: "300px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-fitness-programs": {
        position: "absolute",
        top: "660px",
        left: "80px",
        width: "900px",
        height: "300px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-general-programs": {
        position: "absolute",
        top: "1000px",
        left: "80px",
        width: "900px",
        height: "300px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "participant-program-details": {
        position: "absolute",
        top: "320px",
        left: "80px",
        width: "940px",
        height: "980px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "add-program-search": {
        position: "absolute",
        top: "310px",
        left: "80px",
        width: "980px",
        height: "100px",
        border: "4px solid #3B82F6",
        borderRadius: "18px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "add-program-list": {
        position: "absolute",
        top: "760px",
        left: "80px",
        width: "1540px",
        height: "500px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
      "add-program-details": {
        position: "absolute",
        top: "450px",
        left: "80px",
        width: "1540px",
        height: "260px",
        border: "4px solid #3B82F6",
        borderRadius: "22px",
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        zIndex: 20,
      },
    };

    return highlights[target];
  };

  const clampValue = (
    value: number,
    min: number,
    max: number,
  ) => {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  };

  const getRectFromStyle = (style?: CSSProperties | null) => {
    const parsePx = (value?: string | number) => {
      if (typeof value === "number") return value;
      if (typeof value === "string")
        return Number.parseFloat(value.replace("px", "")) || 0;
      return 0;
    };

    const top = parsePx(style?.top);
    const left = parsePx(style?.left);
    const width = parsePx(style?.width);
    const height = parsePx(style?.height);

    return {
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  };

  const getSmartTextboxPosition = ({
    highlightStyle,
    canvas,
    boxWidth,
    boxHeight,
    preferredSides,
    gap = 24,
    padding = 24,
  }: {
    highlightStyle?: CSSProperties | null;
    canvas: HTMLDivElement | null;
    boxWidth: number;
    boxHeight: number;
    preferredSides: Array<"right" | "left" | "below" | "above">;
    gap?: number;
    padding?: number;
  }): CSSProperties | null => {
    if (!highlightStyle || !canvas) return null;

    const rect = getRectFromStyle(highlightStyle);
    const canvasWidth = Math.max(canvas.clientWidth, 1200);
    const canvasHeight = Math.max(
      canvas.scrollHeight,
      canvas.clientHeight,
      1200,
    );

    const makeCandidate = (
      side: "right" | "left" | "below" | "above",
    ) => {
      let x = padding;
      let y = padding;

      if (side === "right") {
        x = rect.right + gap;
        y =
          rect.top + Math.max(0, (rect.height - boxHeight) / 2);
      } else if (side === "left") {
        x = rect.left - boxWidth - gap;
        y =
          rect.top + Math.max(0, (rect.height - boxHeight) / 2);
      } else if (side === "below") {
        x =
          rect.left + Math.max(0, (rect.width - boxWidth) / 2);
        y = rect.bottom + gap;
      } else if (side === "above") {
        x =
          rect.left + Math.max(0, (rect.width - boxWidth) / 2);
        y = rect.top - boxHeight - gap;
      }

      x = clampValue(
        x,
        padding,
        canvasWidth - boxWidth - padding,
      );
      y = clampValue(
        y,
        padding,
        canvasHeight - boxHeight - padding,
      );

      const overlapWidth = Math.max(
        0,
        Math.min(x + boxWidth, rect.right) -
          Math.max(x, rect.left),
      );
      const overlapHeight = Math.max(
        0,
        Math.min(y + boxHeight, rect.bottom) -
          Math.max(y, rect.top),
      );
      const overlapArea = overlapWidth * overlapHeight;

      const centerX = x + boxWidth / 2;
      const centerY = y + boxHeight / 2;
      const highlightCenterX = rect.left + rect.width / 2;
      const highlightCenterY = rect.top + rect.height / 2;
      const distance = Math.hypot(
        centerX - highlightCenterX,
        centerY - highlightCenterY,
      );
      const preferencePenalty =
        preferredSides.indexOf(side) * 20;
      const score =
        overlapArea * 100000 + distance + preferencePenalty;

      return { side, x, y, score };
    };

    const candidates = preferredSides
      .map(makeCandidate)
      .sort((a, b) => a.score - b.score);
    const best = candidates[0];

    return {
      position: "absolute",
      top: `${best.y}px`,
      left: `${best.x}px`,
      width: `${boxWidth}px`,
      maxWidth: "calc(100vw - 80px)",
    };
  };

  const getTextboxPosition = (
    target: HighlightTarget,
    moduleId?: string,
  ): CSSProperties => {
    const parsePx = (value?: string | number) => {
      if (typeof value === "number") return value;
      if (typeof value === "string")
        return Number.parseFloat(value.replace("px", "")) || 0;
      return 0;
    };

    if (moduleId === "basics") {
      if (target === "logo" && basicsHighlightStyle) {
        const highlightTop = parsePx(basicsHighlightStyle.top);
        const highlightLeft = parsePx(
          basicsHighlightStyle.left,
        );
        const highlightHeight = parsePx(
          basicsHighlightStyle.height,
        );
        const gap = 16;
        const boxWidth = 460; // 原来 900，缩短约一半

        return {
          position: "absolute",
          top: `${highlightTop + highlightHeight + gap}px`,
          left: `${Math.max(24, highlightLeft)}px`,
          width: `${boxWidth}px`,
          maxWidth: "calc(100vw - 80px)",
          height: "auto",
        };
      }

      if (target === "logout" && basicsHighlightStyle) {
        const highlightTop = parsePx(basicsHighlightStyle.top);
        const highlightLeft = parsePx(
          basicsHighlightStyle.left,
        );
        const highlightWidth = parsePx(
          basicsHighlightStyle.width,
        );
        const highlightHeight = parsePx(
          basicsHighlightStyle.height,
        );
        const gap = 16;
        const boxWidth = 520; // 原来 1040，缩短约一半
        const left = Math.max(
          24,
          highlightLeft + highlightWidth - boxWidth,
        );

        return {
          position: "absolute",
          top: `${highlightTop + highlightHeight + gap}px`,
          left: `${left}px`,
          width: `${boxWidth}px`,
          maxWidth: "calc(100vw - 80px)",
          height: "auto",
        };
      }

      if (target === "sidebar" && basicsHighlightStyle) {
        const highlightTop = parsePx(basicsHighlightStyle.top);
        const highlightLeft = parsePx(
          basicsHighlightStyle.left,
        );
        const highlightWidth = parsePx(
          basicsHighlightStyle.width,
        );
        const gap = 20;
        const boxWidth = 420; // 原来 820，缩短约一半

        return {
          position: "absolute",
          top: `${Math.max(120, highlightTop)}px`,
          left: `${highlightLeft + highlightWidth + gap}px`,
          width: `${boxWidth}px`,
          maxWidth: "calc(100vw - 470px)",
          height: "auto",
        };
      }

      if (
        target === "dashboard-cards" &&
        basicsHighlightStyle
      ) {
        const highlightTop = parsePx(basicsHighlightStyle.top);
        const highlightLeft = parsePx(
          basicsHighlightStyle.left,
        );
        const boxWidth = 560;
        const gap = 24;
        const left = Math.max(
          24,
          highlightLeft - boxWidth - gap,
        );
        const top = Math.max(140, highlightTop + 24);

        return {
          position: "absolute",
          top: `${top}px`,
          left: `${left}px`,
          width: `${boxWidth}px`,
          maxWidth: "calc(100vw - 80px)",
          height: "auto",
        };
      }

      const positions: Record<HighlightTarget, CSSProperties> =
        {
          logo: {
            position: "absolute",
            top: "140px",
            left: "40px",
            width: "460px",
            maxWidth: "calc(100vw - 80px)",
            height: "auto",
          },
          logout: {
            position: "absolute",
            top: "140px",
            left: "980px",
            width: "520px",
            maxWidth: "calc(100vw - 80px)",
            height: "auto",
          },
          sidebar: {
            position: "absolute",
            top: "220px",
            left: "430px",
            width: "420px",
            maxWidth: "calc(100vw - 470px)",
            height: "auto",
          },
          "dashboard-cards": {
            position: "absolute",
            top: "980px",
            left: "520px",
            width: "980px",
            maxWidth: "calc(100vw - 620px)",
            height: "auto",
          },
          "page-content": {
            position: "absolute",
            top: "200px",
            right: "2rem",
            width: "400px",
          },
          filters: {
            position: "absolute",
            top: "430px",
            left: "360px",
            width: "420px",
          },
          form: {
            position: "absolute",
            top: "240px",
            right: "3rem",
            width: "400px",
          },
          button: {
            position: "absolute",
            bottom: "130px",
            right: "260px",
            width: "380px",
          },
          "reports-period": {
            position: "absolute",
            top: "430px",
            left: "80px",
            width: "700px",
          },
          "reports-program": {
            position: "absolute",
            top: "560px",
            left: "520px",
            width: "700px",
          },
          "reports-participant": {
            position: "absolute",
            top: "900px",
            left: "80px",
            width: "700px",
          },
          "reports-preview": {
            position: "absolute",
            top: "1120px",
            left: "920px",
            width: "620px",
          },
          "reports-export": {
            position: "absolute",
            top: "1280px",
            left: "520px",
            width: "620px",
          },
          "participant-personal": {
            position: "absolute",
            top: "220px",
            left: "1040px",
            width: "620px",
            height: "auto",
          },
          "participant-address": {
            position: "absolute",
            top: "620px",
            left: "1040px",
            width: "640px",
            height: "auto",
          },
          "participant-emergency": {
            position: "absolute",
            top: "1040px",
            left: "1040px",
            width: "620px",
            height: "auto",
          },
          "participant-cultural": {
            position: "absolute",
            top: "1360px",
            left: "1040px",
            width: "640px",
            height: "auto",
          },
          "participant-other": {
            position: "absolute",
            top: "1780px",
            left: "1040px",
            width: "660px",
            height: "auto",
          },
          "participant-children-programs": {
            position: "absolute",
            top: "300px",
            left: "1040px",
            width: "620px",
            height: "auto",
          },
          "participant-fitness-programs": {
            position: "absolute",
            top: "670px",
            left: "1040px",
            width: "620px",
            height: "auto",
          },
          "participant-general-programs": {
            position: "absolute",
            top: "1040px",
            left: "1040px",
            width: "620px",
            height: "auto",
          },
          "participant-program-details": {
            position: "absolute",
            top: "300px",
            left: "1040px",
            width: "660px",
            height: "auto",
          },
        };

      return positions[target];
    }

    if (moduleId === "reports") {
      const configs: Partial<
        Record<
          HighlightTarget,
          {
            width: number;
            height: number;
            preferredSides: Array<
              "right" | "left" | "below" | "above"
            >;
          }
        >
      > = {
        "reports-period": {
          width: 700,
          height: 300,
          preferredSides: ["below", "right", "left", "above"],
        },
        "reports-program": {
          width: 700,
          height: 250,
          preferredSides: ["below", "right", "left", "above"],
        },
        "reports-participant": {
          width: 700,
          height: 260,
          preferredSides: ["below", "right", "left", "above"],
        },
        "reports-preview": {
          width: 620,
          height: 290,
          preferredSides: ["right", "above", "left", "below"],
        },
        "reports-export": {
          width: 620,
          height: 250,
          preferredSides: ["left", "below", "above", "right"],
        },
      };

      const config = configs[target];
      if (config) {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: reportsHighlightStyle,
          canvas: reportsCanvasRef.current,
          boxWidth: config.width,
          boxHeight: config.height,
          preferredSides: config.preferredSides,
        });

        if (smartPosition) {
          return smartPosition;
        }
      }
    }

    if (moduleId === "attendance") {
      const configs: Partial<
        Record<
          HighlightTarget,
          {
            width: number;
            height: number;
            preferredSides: Array<
              "right" | "left" | "below" | "above"
            >;
          }
        >
      > = {
        "attendance-today": {
          width: 620,
          height: 220,
          preferredSides: ["right", "below", "left", "above"],
        },
        "attendance-selection": {
          width: 660,
          height: 220,
          preferredSides: ["right", "below", "left", "above"],
        },
        "attendance-list": {
          width: 660,
          height: 240,
          preferredSides: ["right", "above", "left", "below"],
        },
      };

      const config = configs[target];
      if (config) {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: attendanceHighlightStyle,
          canvas: attendanceCanvasRef.current,
          boxWidth: config.width,
          boxHeight: config.height,
          preferredSides: config.preferredSides,
        });

        if (smartPosition) {
          return smartPosition;
        }
      }
    }

    if (moduleId === "add-participant") {
      const configs: Partial<
        Record<
          HighlightTarget,
          {
            width: number;
            height: number;
            preferredSides: Array<
              "right" | "left" | "below" | "above"
            >;
          }
        >
      > = {
        "participant-personal": {
          width: 620,
          height: 240,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-address": {
          width: 640,
          height: 240,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-emergency": {
          width: 620,
          height: 220,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-cultural": {
          width: 640,
          height: 240,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-other": {
          width: 660,
          height: 240,
          preferredSides: ["right", "above", "left", "below"],
        },
        "participant-children-programs": {
          width: 620,
          height: 230,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-fitness-programs": {
          width: 620,
          height: 230,
          preferredSides: ["right", "below", "left", "above"],
        },
        "participant-general-programs": {
          width: 620,
          height: 230,
          preferredSides: ["right", "above", "left", "below"],
        },
        "participant-program-details": {
          width: 660,
          height: 240,
          preferredSides: ["right", "left", "above", "below"],
        },
      };

      const config = configs[target];
      if (config) {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: addParticipantHighlightStyle,
          canvas: addParticipantCanvasRef.current,
          boxWidth: config.width,
          boxHeight: config.height,
          preferredSides: config.preferredSides,
        });

        if (smartPosition) {
          return smartPosition;
        }
      }
    }

    if (moduleId === "add-to-program") {
      const configs: Partial<
        Record<
          HighlightTarget,
          {
            width: number;
            height: number;
            preferredSides: Array<
              "right" | "left" | "below" | "above"
            >;
          }
        >
      > = {
        "add-program-search": {
          width: 620,
          height: 220,
          preferredSides: ["right", "below", "left", "above"],
        },
        "add-program-list": {
          width: 640,
          height: 230,
          preferredSides: ["above", "right", "left", "below"],
        },
        "add-program-details": {
          width: 660,
          height: 240,
          preferredSides: ["right", "below", "left", "above"],
        },
      };

      const config = configs[target];
      if (config) {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: addToProgramHighlightStyle,
          canvas: addToProgramCanvasRef.current,
          boxWidth: config.width,
          boxHeight: config.height,
          preferredSides: config.preferredSides,
        });

        if (smartPosition) {
          return smartPosition;
        }
      }
    }

    if (moduleId === "search") {
      const configs: Partial<
        Record<
          HighlightTarget,
          {
            width: number;
            height: number;
            preferredSides: Array<
              "right" | "left" | "below" | "above"
            >;
          }
        >
      > = {
        "search-search": {
          width: 620,
          height: 210,
          preferredSides: ["right", "below", "left", "above"],
        },
        "search-active-list": {
          width: 660,
          height: 230,
          preferredSides: ["right", "above", "left", "below"],
        },
        "search-inactive-list": {
          width: 660,
          height: 230,
          preferredSides: ["right", "above", "left", "below"],
        },
        "search-profile-general": {
          width: 680,
          height: 250,
          preferredSides: ["right", "below", "left", "above"],
        },
        "search-profile-program-specific": {
          width: 650,
          height: 230,
          preferredSides: ["right", "left", "above", "below"],
        },
        "search-profile-enrolled-programs": {
          width: 650,
          height: 220,
          preferredSides: ["right", "left", "above", "below"],
        },
        "search-profile-active-buttons": {
          width: 660,
          height: 220,
          preferredSides: ["above", "right", "left", "below"],
        },
        "search-profile-inactive-buttons": {
          width: 660,
          height: 220,
          preferredSides: ["above", "right", "left", "below"],
        },
      };

      const config = configs[target];
      if (config) {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: searchTrainingHighlightStyle,
          canvas: searchTrainingCanvasRef.current,
          boxWidth: config.width,
          boxHeight: config.height,
          preferredSides: config.preferredSides,
        });

        if (smartPosition) {
          return smartPosition;
        }
      }
    }

    if (moduleId === "programs") {
      if (
        target === "programs-add-modal" ||
        target === "programs-categories" ||
        target === "programs-manage-staff"
      ) {
        return {
          position: "absolute",
          top: "150px",
          left: "28px",
          width: "560px",
          maxWidth: "calc(100vw - 80px)",
          height: "auto",
        };
      }

      if (target === "programs-edit-delete") {
        const smartPosition = getSmartTextboxPosition({
          highlightStyle: programsHighlightStyle,
          canvas: programsCanvasRef.current,
          boxWidth: 540,
          boxHeight: 240,
          preferredSides: ["right", "left", "below", "above"],
          gap: 24,
          padding: 24,
        });

        if (smartPosition) {
          return smartPosition;
        }

        return {
          position: "absolute",
          top: "620px",
          left: "640px",
          width: "540px",
          maxWidth: "calc(100vw - 80px)",
          height: "auto",
        };
      }
    }

    const positions: Record<HighlightTarget, CSSProperties> = {
      logo: {
        position: "fixed",
        top: "120px",
        left: "2rem",
        maxWidth: "400px",
      },
      logout: {
        position: "fixed",
        top: "120px",
        right: "2rem",
        maxWidth: "400px",
      },
      sidebar: {
        position: "fixed",
        top: "200px",
        left: "320px",
        maxWidth: "450px",
      },
      "dashboard-cards": {
        position: "fixed",
        top: "220px",
        right: "2rem",
        maxWidth: "420px",
      },
      "page-content": {
        position: "fixed",
        top: "200px",
        right: "2rem",
        maxWidth: "400px",
      },
      filters: {
        position: "fixed",
        top: "480px",
        left: "360px",
        maxWidth: "450px",
      },
      form: {
        position: "fixed",
        top: "240px",
        right: "3rem",
        maxWidth: "400px",
      },
      button: {
        position: "fixed",
        bottom: "140px",
        right: "250px",
        maxWidth: "380px",
      },
      "reports-period": {
        position: "absolute",
        top: "430px",
        left: "80px",
        width: "700px",
      },
      "reports-program": {
        position: "absolute",
        top: "560px",
        left: "520px",
        width: "700px",
      },
      "reports-participant": {
        position: "absolute",
        top: "900px",
        left: "80px",
        width: "700px",
      },
      "reports-preview": {
        position: "absolute",
        top: "1120px",
        left: "920px",
        width: "620px",
      },
      "reports-export": {
        position: "absolute",
        top: "1280px",
        left: "520px",
        width: "620px",
      },
      "attendance-today": {
        position: "absolute",
        top: "240px",
        left: "1040px",
        width: "620px",
      },
      "attendance-selection": {
        position: "absolute",
        top: "500px",
        left: "1040px",
        width: "660px",
      },
      "attendance-list": {
        position: "absolute",
        top: "880px",
        left: "1040px",
        width: "660px",
      },
      "participant-personal": {
        position: "absolute",
        top: "220px",
        left: "1040px",
        width: "620px",
      },
      "participant-address": {
        position: "absolute",
        top: "620px",
        left: "1040px",
        width: "640px",
      },
      "participant-emergency": {
        position: "absolute",
        top: "1040px",
        left: "1040px",
        width: "620px",
      },
      "participant-cultural": {
        position: "absolute",
        top: "1360px",
        left: "1040px",
        width: "640px",
      },
      "participant-other": {
        position: "absolute",
        top: "1780px",
        left: "1040px",
        width: "660px",
      },
      "participant-children-programs": {
        position: "absolute",
        top: "300px",
        left: "1040px",
        width: "620px",
      },
      "participant-fitness-programs": {
        position: "absolute",
        top: "670px",
        left: "1040px",
        width: "620px",
      },
      "participant-general-programs": {
        position: "absolute",
        top: "1040px",
        left: "1040px",
        width: "620px",
      },
      "participant-program-details": {
        position: "absolute",
        top: "300px",
        left: "1040px",
        width: "660px",
      },
      "programs-add-modal": {
        position: "absolute",
        top: "180px",
        left: "1270px",
        width: "620px",
      },
      "programs-categories": {
        position: "absolute",
        top: "380px",
        left: "1270px",
        width: "620px",
      },
      "programs-edit-delete": {
        position: "absolute",
        top: "760px",
        left: "1270px",
        width: "620px",
      },
      "programs-manage-staff": {
        position: "absolute",
        top: "300px",
        left: "1270px",
        width: "620px",
      },
    };

    return (
      positions[target] || {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "500px",
      }
    );
  };

  const renderPortalBasicsMock = () => {
    return (
      <div
        ref={basicsCanvasRef}
        className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-24 items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  ref={basicsLogoRef}
                  src={logo}
                  alt="The Hut Community Centre Logo"
                  className="h-16 w-auto"
                />
                <h1 className="hidden text-3xl font-bold text-white sm:block">
                  The Hut Participation Portal
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 text-base text-white/90">
                  <span className="font-semibold">
                    {user?.name || "Haoxin Che"}
                  </span>
                  <span className="text-white/60">|</span>
                  <span className="text-white/80">
                    {String(
                      user?.role || "admin",
                    ).toLowerCase()}
                  </span>
                </div>
                <button
                  ref={basicsLogoutRef}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-base font-semibold text-white shadow-md"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <aside
            ref={basicsSidebarRef}
            className="w-72 bg-white shadow-lg"
          >
            <div className="sticky top-0 h-screen overflow-y-auto">
              <nav className="p-4">
                <div className="space-y-2">
                  {sidebarItemMocks.map((item) => {
                    const isActive = item === "Staff Training";
                    return (
                      <div
                        key={item}
                        className={`w-full rounded-xl px-4 py-4 text-left text-base font-semibold transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span className="text-base">
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </nav>
            </div>
          </aside>

          <main className="w-full flex-1 px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10">
                <h2 className="mb-4 text-5xl font-bold text-gray-900">
                  Welcome to The Hut
                </h2>
                <p className="text-2xl text-gray-600">
                  Choose an option below to get started
                </p>
              </div>

              <div
                ref={basicsCardsRef}
                className="grid grid-cols-3 gap-8"
              >
                {dashboardCardMocks.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className={`rounded-3xl bg-gradient-to-br ${card.gradient} p-10 text-left text-white shadow-2xl`}
                    >
                      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20">
                        <Icon size={48} />
                      </div>
                      <h3 className="mb-3 whitespace-pre-line text-4xl font-bold">
                        {card.title}
                      </h3>
                      <p className="text-xl text-white/90">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 grid grid-cols-3 gap-8">
                {statsMocks.map((stat) => (
                  <div
                    key={stat.title}
                    className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-8 text-white shadow-lg`}
                  >
                    <div className="mb-2 text-lg font-semibold">
                      {stat.title}
                    </div>
                    <div className="text-5xl font-bold">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

  const renderAttendanceMockPage = () => {
    const fieldWrap = "space-y-3";
    const fieldClass =
      "flex h-[64px] items-center justify-between rounded-[18px] border border-gray-300 bg-white px-6 text-[17px] font-semibold text-slate-900";

    const participants = [
      {
        name: "Olivia Martin",
        details: "olivia.martin@example.com • 0400 111 222",
        present: true,
      },
      {
        name: "Noah Wilson",
        details: "noah.wilson@example.com • 0400 333 444",
        present: false,
      },
      {
        name: "Charlotte Lee",
        details: "charlotte.lee@example.com • 0400 555 666",
        present: true,
      },
    ];

    const todayLabel = new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div
        ref={attendanceCanvasRef}
        className="absolute inset-0 bg-[#edf4f8]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mx-auto max-w-[1080px] rounded-[32px] border border-blue-200 bg-white p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-5 rounded-2xl bg-blue-50 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <ClipboardCheck size={30} />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-slate-900">
                  Record Attendance
                </h2>
                <p className="mt-1 text-lg text-slate-600">
                  Mark attendance for participants enrolled in
                  today's programs
                </p>
              </div>
            </div>

            <div
              ref={attendanceTodayRef}
              className="mb-8 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                  <Calendar size={30} />
                </div>
                <div>
                  <div className="text-lg font-semibold opacity-90">
                    Today's Date
                  </div>
                  <div className="text-3xl font-bold">
                    {todayLabel}
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={attendanceSelectionRef}
              className="mb-8 space-y-6"
            >
              <div className="rounded-2xl bg-gray-50 p-6">
                <div className={fieldWrap}>
                  <div className="text-[18px] font-bold text-slate-900">
                    Select Program *
                  </div>
                  <div className={fieldClass}>
                    <span>Walking Group • 10:00-11:00</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6">
                <div className={fieldWrap}>
                  <div className="text-[18px] font-bold text-slate-900">
                    Date *
                  </div>
                  <div className={fieldClass}>
                    <span>2026-04-23</span>
                    <span className="text-xl">🗓️</span>
                  </div>
                </div>
              </div>
            </div>

            <div ref={attendanceListRef} className="space-y-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
                <h3 className="mb-2 text-2xl font-bold text-slate-900">
                  Walking Group
                </h3>
                <p className="text-lg font-semibold text-slate-700">
                  3 Participants
                </p>
                <p className="mt-2 text-base text-slate-600">
                  ✓ Check the box for each person who attended
                </p>
              </div>

              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.name}
                    className="flex items-center gap-5 rounded-2xl border-4 border-gray-300 bg-white p-5 shadow-sm"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
                        participant.present
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {participant.present ? (
                        <Check size={18} />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-slate-900">
                        {participant.name}
                      </div>
                      <div className="mt-1 text-base text-slate-600">
                        {participant.details}
                      </div>
                    </div>
                    {participant.present && (
                      <div className="rounded-full bg-green-600 px-5 py-2 text-lg font-bold text-white shadow-lg">
                        Present ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">
                    Attendance Summary:
                  </span>
                  <span className="text-3xl font-bold">
                    2 / 3 Present
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-xl font-bold text-white shadow-lg">
                  Save Attendance
                </button>
                <button className="rounded-2xl border-4 border-gray-400 px-8 py-5 text-xl font-bold text-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderAddToProgramMockPage = () => {
    const participants = [
      {
        name: "Emma Johnson",
        email: "emma.johnson@example.com",
        phone: "0400 111 222",
        selected: false,
      },
      {
        name: "Liam Brown",
        email: "liam.brown@example.com",
        phone: "0400 333 444",
        selected: true,
      },
      {
        name: "Sophie Taylor",
        email: "sophie.taylor@example.com",
        phone: "0400 555 666",
        selected: false,
      },
    ];

    return (
      <div
        ref={addToProgramCanvasRef}
        className="absolute inset-0 bg-[#eef2f7]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mx-auto max-w-[1540px]">
            <div className="mb-8 rounded-[30px] border border-purple-200 bg-white p-10 shadow-sm">
              <div className="mb-6 flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-white">
                  <UserCheck size={30} />
                </div>
                <div>
                  <h2 className="text-5xl font-bold text-slate-900">
                    Add Participant to Program
                  </h2>
                  <p className="mt-2 text-lg text-slate-600">
                    Search for a participant, select them, then
                    choose a program to enrol them in.
                  </p>
                </div>
              </div>

              <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-2 text-xl font-bold text-blue-900">
                  Instructions
                </h3>
                <ol className="list-decimal space-y-2 pl-6 text-base text-blue-800">
                  <li>
                    Search for a participant using the search
                    box below
                  </li>
                  <li>Click Select on a participant row</li>
                  <li>Choose a program from the dropdown</li>
                  <li>
                    Click Add to Program to confirm the
                    enrolment
                  </li>
                </ol>
              </div>

              <div ref={addToProgramSearchRef} className="mb-8">
                <div className="relative">
                  <Search
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
                    size={28}
                  />
                  <div className="flex h-[88px] items-center rounded-[22px] border-4 border-gray-300 bg-white pl-20 pr-6 text-[24px] font-semibold text-slate-500 shadow-sm">
                    Search by name, email, or phone...
                  </div>
                </div>
              </div>

              <div
                ref={addToProgramDetailsRef}
                className="mb-8 rounded-[28px] border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 p-8"
              >
                <h3 className="mb-4 text-3xl font-bold text-slate-900">
                  Selected Participant
                </h3>
                <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">
                    Liam Brown
                  </div>
                  <div className="mt-2 text-lg text-slate-600">
                    liam.brown@example.com
                  </div>
                  <div className="mt-1 text-lg text-slate-600">
                    0400 333 444
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-xl font-bold text-slate-900">
                    Select Program
                  </div>
                  <div className="flex h-[84px] items-center justify-between rounded-[20px] border-4 border-gray-300 bg-white px-6 text-[22px] font-semibold text-slate-900 shadow-sm">
                    <span>Walking Group - Monday at 10:00</span>
                    <span className="text-2xl">⌄</span>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <button className="flex-1 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-5 text-xl font-bold text-white shadow-lg">
                      <div className="flex items-center justify-center gap-3">
                        <Plus size={26} />
                        Add to Program
                      </div>
                    </button>
                    <button className="rounded-2xl border-4 border-gray-300 px-8 py-5 text-xl font-bold text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div
                ref={addToProgramListRef}
                className="overflow-hidden rounded-[28px] border-2 border-gray-200 bg-white shadow-sm"
              >
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-5 text-left text-lg font-bold">
                        Name
                      </th>
                      <th className="px-6 py-5 text-left text-lg font-bold">
                        Email
                      </th>
                      <th className="px-6 py-5 text-left text-lg font-bold">
                        Phone
                      </th>
                      <th className="px-6 py-5 text-left text-lg font-bold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participants.map((participant, index) => (
                      <tr
                        key={participant.email}
                        className={`${
                          participant.selected
                            ? "border-l-4 border-purple-600 bg-purple-100"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-5 text-lg font-semibold text-slate-900">
                          {participant.name}
                        </td>
                        <td className="px-6 py-5 text-base text-slate-600">
                          {participant.email}
                        </td>
                        <td className="px-6 py-5 text-base text-slate-600">
                          {participant.phone}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            className={`rounded-xl px-6 py-3 text-base font-bold ${
                              participant.selected
                                ? "bg-purple-600 text-white"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {participant.selected
                              ? "Selected"
                              : "Select"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderReportsMockPage = () => {
    const fieldWrap = "space-y-3";
    const fieldClass =
      "flex h-[64px] items-center justify-between rounded-[18px] border border-gray-300 bg-white px-6 text-[17px] text-slate-900";
    const pillClass =
      "rounded-full border border-gray-300 bg-white px-8 py-3 text-[18px] font-semibold text-slate-900";

    return (
      <div
        ref={reportsCanvasRef}
        className="absolute inset-0 bg-[#edf1f5]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <h2 className="mb-8 text-[64px] font-bold leading-none text-[#0f2244]">
            View Reports
          </h2>

          <div className="rounded-[28px] border border-gray-300 bg-white px-12 py-10 shadow-sm">
            <div className="mb-8 text-[40px] font-bold leading-none text-[#0f2244]">
              Report Filters
            </div>

            <div className="mb-8 space-y-6">
              <div ref={reportsPeriodRef} className="space-y-6">
                <div className="flex flex-wrap gap-5">
                  <div className={pillClass}>Weekly</div>
                  <div
                    className={`${pillClass} border-teal-500 bg-teal-50 text-teal-700`}
                  >
                    Monthly
                  </div>
                  <div className={pillClass}>Quarterly</div>
                  <div className={pillClass}>Annually</div>
                  <div className={`${pillClass} px-9`}>
                    Custom Range
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className={fieldWrap}>
                    <div className="text-[18px] font-semibold text-[#0f2244]">
                      Start date
                    </div>
                    <div className={fieldClass}>
                      <span>2026/03/24</span>
                      <span className="text-xl">🗓️</span>
                    </div>
                  </div>
                  <div className={fieldWrap}>
                    <div className="text-[18px] font-semibold text-[#0f2244]">
                      End date
                    </div>
                    <div className={fieldClass}>
                      <span>2026/04/22</span>
                      <span className="text-xl">🗓️</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={reportsProgramRef}
                className="grid grid-cols-2 gap-8"
              >
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Program category
                  </div>
                  <div className={fieldClass}>
                    <span>All program categories</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Program
                  </div>
                  <div className={fieldClass}>
                    <span>All programs</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={reportsParticipantRef}
              className="mb-8 space-y-6"
            >
              <div className="grid grid-cols-4 gap-8">
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Age group
                  </div>
                  <div className={fieldClass}>
                    <span>All age groups</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Gender
                  </div>
                  <div className={fieldClass}>
                    <span>All genders</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    ATSI status
                  </div>
                  <div className={fieldClass}>
                    <span>All ATSI statuses</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    CALD background
                  </div>
                  <div className={fieldClass}>
                    <span>All CALD backgrounds</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Council
                  </div>
                  <div className={fieldClass}>
                    <span>All councils</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
                <div className={fieldWrap}>
                  <div className="text-[18px] font-semibold text-[#0f2244]">
                    Township
                  </div>
                  <div className={fieldClass}>
                    <span>All townships</span>
                    <span className="text-xl">⌄</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div ref={reportsPreviewRef} className="flex-1">
                <button className="mb-6 rounded-[18px] border border-gray-300 bg-white px-8 py-4 text-[20px] font-semibold text-[#0f2244] shadow-sm">
                  Preview Report
                </button>
                <div className="rounded-[24px] border border-gray-200 bg-[#f8fafc] p-6 shadow-sm">
                  <div className="mb-5 text-[26px] font-bold text-[#0f2244]">
                    Monthly Report Preview
                  </div>
                  <div className="mb-5 grid grid-cols-3 gap-4">
                    {[
                      ["Registrations", "28"],
                      ["Attendance", "76"],
                      ["Programs", "5"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-white p-4 shadow-sm"
                      >
                        <div className="mb-2 text-sm font-semibold text-slate-500">
                          {label}
                        </div>
                        <div className="text-3xl font-bold text-[#0f2244]">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-5 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="mb-3 text-base font-semibold text-[#0f2244]">
                        Attendance by program
                      </div>
                      <div className="h-32 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100" />
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="mb-3 text-base font-semibold text-[#0f2244]">
                        Participant demographics
                      </div>
                      <div className="h-32 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-3 text-base font-semibold text-[#0f2244]">
                      Report table
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((row) => (
                        <div
                          key={row}
                          className="h-8 rounded-lg bg-gray-100"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={reportsExportRef}
                className="w-[320px] shrink-0"
              >
                <div className="mb-4 flex overflow-hidden rounded-[18px] bg-teal-500 text-white shadow-sm">
                  <button className="flex-1 px-6 py-4 text-[20px] font-bold">
                    Export Report
                  </button>
                  <button className="border-l border-white/30 px-5 py-4 text-xl">
                    ⌄
                  </button>
                </div>
                <div className="rounded-[18px] border border-gray-200 bg-white py-2 shadow-lg">
                  <div className="px-5 py-3 text-[17px] font-semibold text-[#0f2244]">
                    Export as PDF
                  </div>
                  <div className="px-5 py-3 text-[17px] font-semibold text-[#0f2244]">
                    Export as CSV
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderAddParticipantMockPage = (
    currentTarget: HighlightTarget,
  ) => {
    const sectionTitleClass = "mb-4 text-xl font-bold";
    const fieldLabelClass =
      "mb-2 block text-sm font-bold text-slate-700";
    const inputClass =
      "h-[52px] rounded-xl border-2 border-gray-300 bg-white px-4 text-[15px] text-slate-900";
    const checkboxRowClass =
      "flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3";
    const programCardClass =
      "rounded-2xl border-2 border-white/80 bg-white p-5 shadow-sm";
    const isProgramSelectionTarget =
      currentTarget === "participant-children-programs" ||
      currentTarget === "participant-fitness-programs" ||
      currentTarget === "participant-general-programs";
    const isProgramDetailsTarget =
      currentTarget === "participant-program-details";

    const currentStage = isProgramSelectionTarget
      ? 2
      : isProgramDetailsTarget
        ? 3
        : 1;

    const renderField = (
      label: string,
      placeholder: string,
      widthClass = "w-full",
    ) => (
      <div className={`flex flex-col ${widthClass}`}>
        <label className={fieldLabelClass}>{label}</label>
        <div className={`${inputClass} flex items-center`}>
          {placeholder}
        </div>
      </div>
    );

    return (
      <div
        ref={addParticipantCanvasRef}
        className="absolute inset-0 bg-[#edf4f8]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mx-auto max-w-[1280px] rounded-[32px] border border-green-200 bg-white p-10 shadow-sm">
            <div className="mb-8 flex items-center gap-5 rounded-2xl bg-green-50 p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-white">
                <UserPlus size={30} />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-slate-900">
                  Registration Form
                </h2>
                <p className="mt-1 text-lg text-slate-600">
                  Step {currentStage} of 3
                </p>
              </div>
            </div>

            <div className="mb-10">
              <div className="mb-3 flex justify-between px-1 text-lg font-bold">
                <span
                  className={
                    currentStage >= 1
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  1. General Info
                </span>
                <span
                  className={
                    currentStage >= 2
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  2. Select Programs
                </span>
                <span
                  className={
                    currentStage >= 3
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  3. Program Details
                </span>
              </div>
              <div className="h-4 rounded-full bg-gray-200">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-green-600 to-green-700"
                  style={{
                    width: `${
                      currentStage === 1
                        ? 33.33
                        : currentStage === 2
                          ? 66.66
                          : 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {currentStage === 1 && (
              <div className="space-y-8">
                <div
                  ref={addParticipantPersonalRef}
                  className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6"
                >
                  <h3
                    className={`${sectionTitleClass} text-blue-900`}
                  >
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {renderField("Title", "Select title")}
                    {renderField(
                      "Given Name *",
                      "Enter given name",
                    )}
                    {renderField(
                      "Last Name *",
                      "Enter last name",
                    )}
                  </div>
                  <div className="mt-4">
                    {renderField(
                      "Email *",
                      "participant@example.com",
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {renderField("Home Tel", "Home telephone")}
                    {renderField(
                      "Mobile Tel *",
                      "Mobile telephone",
                    )}
                  </div>
                  <div className="mt-4">
                    {renderField("Gender *", "Select gender")}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {renderField("Day", "Day")}
                    {renderField("Month", "Month")}
                    {renderField("Year", "Year")}
                  </div>
                </div>

                <div
                  ref={addParticipantAddressRef}
                  className="rounded-2xl border-2 border-green-200 bg-green-50 p-6"
                >
                  <h3
                    className={`${sectionTitleClass} text-green-900`}
                  >
                    Home Address
                  </h3>
                  <div className="space-y-4">
                    {renderField(
                      "Address Line 1 *",
                      "Street address",
                    )}
                    {renderField(
                      "Address Line 2",
                      "Apartment, suite, etc. (optional)",
                    )}
                    {renderField(
                      "Township *",
                      "Select township",
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {renderField("Post Code *", "Post code")}
                      {renderField(
                        "Council Region *",
                        "Select a region",
                      )}
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
                    <h4 className="mb-4 text-xl font-bold text-purple-900">
                      Postal Address (if different)
                    </h4>
                    <div className="space-y-4">
                      {renderField(
                        "Postal Address Line 1",
                        "Postal street address (optional)",
                      )}
                      {renderField(
                        "Postal Address Line 2",
                        "Postal apartment, suite, etc. (optional)",
                      )}
                      {renderField(
                        "Postal Post Code",
                        "Postal post code (optional)",
                      )}
                    </div>
                  </div>
                </div>

                <div
                  ref={addParticipantEmergencyRef}
                  className="rounded-2xl border-2 border-red-200 bg-red-50 p-6"
                >
                  <h3
                    className={`${sectionTitleClass} text-red-900`}
                  >
                    Emergency Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "Emergency Contact First Name *",
                      "First name",
                    )}
                    {renderField(
                      "Emergency Contact Last Name *",
                      "Last name",
                    )}
                    {renderField(
                      "Emergency Contact Phone *",
                      "Phone number",
                    )}
                    {renderField(
                      "Relationship",
                      "e.g. Spouse, Parent",
                    )}
                  </div>
                  <div className="mt-4">
                    {renderField(
                      "Emergency Contact Address",
                      "Emergency contact address",
                    )}
                  </div>
                </div>

                <div
                  ref={addParticipantCulturalRef}
                  className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6"
                >
                  <h3
                    className={`${sectionTitleClass} text-amber-900`}
                  >
                    Cultural Background
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "Aboriginal or Torres Strait Islander",
                      "Select an option",
                    )}
                    {renderField(
                      "Do you speak a language other than English?",
                      "Select an option",
                    )}
                    {renderField(
                      "Country of Birth",
                      "Select a country",
                    )}
                    {renderField(
                      "Cultural Identity",
                      "Select an option",
                    )}
                  </div>
                  <div className="mt-4">
                    {renderField(
                      "LGBTI+ community",
                      "Select an option",
                    )}
                  </div>
                </div>

                <div
                  ref={addParticipantOtherRef}
                  className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6"
                >
                  <h3
                    className={`${sectionTitleClass} text-indigo-900`}
                  >
                    Other
                  </h3>

                  <div className="rounded-2xl border border-indigo-200 bg-white/70 p-5">
                    <h4 className="mb-4 text-lg font-bold text-indigo-900">
                      Communication Preferences
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={checkboxRowClass}>
                        <div className="h-5 w-5 rounded border-2 border-gray-300" />
                        I would like to receive newsletters
                      </div>
                      <div className={checkboxRowClass}>
                        <div className="h-5 w-5 rounded border-2 border-gray-300" />
                        Receive course/program notifications
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                    <h4 className="mb-4 text-lg font-bold text-orange-900">
                      How did you hear about us?
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Brochure",
                        "Referral",
                        "Email from The Hut",
                        "Family/Friend",
                        "Social Media (Facebook)",
                        "Web",
                      ].map((item) => (
                        <div
                          key={item}
                          className={checkboxRowClass}
                        >
                          <div className="h-5 w-5 rounded border-2 border-gray-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-pink-200 bg-pink-50 p-5">
                    <h4 className="mb-4 text-lg font-bold text-pink-900">
                      Photo Consent
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        "Website",
                        "Social Media",
                        "Annual Report",
                        "Brochures and Flyers",
                        "Local Media",
                      ].map((item) => (
                        <div
                          key={item}
                          className={checkboxRowClass}
                        >
                          <div className="h-5 w-5 rounded border-2 border-gray-300" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStage === 2 && (
              <div className="space-y-8">
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
                  <p className="text-lg font-semibold text-blue-900">
                    Select one or more programs the participant
                    is interested in joining.
                  </p>
                </div>

                <div
                  ref={addParticipantChildrenProgramsRef}
                  className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6"
                >
                  <h3 className="mb-2 text-xl font-bold text-purple-900">
                    Children's Programs
                  </h3>
                  <p className="mb-4 text-sm text-purple-700">
                    Programs designed for children and families
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "Outdoor Playgroup",
                      "Homework Club",
                      "Dungeons & Dragons",
                      "Intergenerational Mentoring",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`${programCardClass} ${
                          index === 0
                            ? "border-purple-500 bg-purple-100"
                            : "border-purple-200"
                        }`}
                      >
                        <div className="mb-2 text-lg font-bold text-slate-900">
                          {item}
                        </div>
                        <div className="text-sm text-slate-600">
                          Program details
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={addParticipantFitnessProgramsRef}
                  className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6"
                >
                  <h3 className="mb-2 text-xl font-bold text-orange-900">
                    Fitness & Wellbeing Programs
                  </h3>
                  <p className="mb-4 text-sm text-orange-700">
                    Physical activity and health programs
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "Community Fun Fitness",
                      "Strength & Balance (Stirling)",
                      "Chi Kung",
                      "Walking Group",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`${programCardClass} ${
                          index === 1
                            ? "border-orange-500 bg-orange-100"
                            : "border-orange-200"
                        }`}
                      >
                        <div className="mb-2 text-lg font-bold text-slate-900">
                          {item}
                        </div>
                        <div className="text-sm text-slate-600">
                          Program details
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={addParticipantGeneralProgramsRef}
                  className="rounded-2xl border-2 border-green-200 bg-green-50 p-6"
                >
                  <h3 className="mb-2 text-xl font-bold text-green-900">
                    General Programs
                  </h3>
                  <p className="mb-4 text-sm text-green-700">
                    Community activities and workshops
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "Community Lunch",
                      "Art Workshop",
                      "Digital Support",
                      "Volunteer Meet-up",
                    ].map((item) => (
                      <div
                        key={item}
                        className={`${programCardClass} border-green-200`}
                      >
                        <div className="mb-2 text-lg font-bold text-slate-900">
                          {item}
                        </div>
                        <div className="text-sm text-slate-600">
                          Program details
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
                  <p className="text-lg font-semibold text-blue-900">
                    2 programs selected
                  </p>
                </div>
              </div>
            )}

            {currentStage === 3 && (
              <div
                ref={addParticipantProgramDetailsRef}
                className="space-y-8"
              >
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
                  <p className="text-lg font-semibold text-blue-900">
                    Additional information required for selected
                    programs before completing registration.
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
                  <h3 className="mb-2 text-xl font-bold text-purple-900">
                    Children's Programs - Child Information
                  </h3>
                  <p className="mb-5 text-sm text-purple-700">
                    This information will apply to all selected
                    children's programs.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "Child Given Name *",
                      "Child's given name",
                    )}
                    {renderField(
                      "Child Family Name *",
                      "Child's family name",
                    )}
                    {renderField(
                      "Child Gender *",
                      "Select gender",
                    )}
                    {renderField(
                      "Child Date of Birth *",
                      "Select date",
                    )}
                  </div>
                  <div className="mt-4">
                    {renderField(
                      "School Attending *",
                      "Enter school name",
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                  <h3 className="mb-2 text-xl font-bold text-orange-900">
                    Fitness & Wellbeing - Health Information
                  </h3>
                  <p className="mb-5 text-sm text-orange-700">
                    Health details are required for selected
                    wellbeing programs.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {renderField(
                      "Health Conditions *",
                      "Select one or more conditions",
                    )}
                    {renderField(
                      "Regular Exercise *",
                      "Select an option",
                    )}
                    {renderField(
                      "Medical Procedures *",
                      "Provide details",
                    )}
                    {renderField(
                      "Medication / Notes",
                      "Enter details",
                    )}
                  </div>
                  <div className="mt-4 rounded-xl border border-orange-200 bg-white px-4 py-4 text-sm text-slate-700">
                    I acknowledge that emergency treatment may
                    be sought if required.
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
                  <div className="mb-2 text-xl font-bold text-green-900">
                    All Set!
                  </div>
                  <div className="text-base text-green-700">
                    Once the required program-specific details
                    are complete, staff can finish the
                    registration.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex gap-4 border-t-2 border-gray-200 pt-8">
              {currentStage > 1 && (
                <button className="rounded-xl border-4 border-gray-400 px-8 py-4 text-xl font-bold text-gray-700">
                  Back
                </button>
              )}
              <button className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-xl font-bold text-white shadow-lg">
                {currentStage === 3
                  ? "Complete Registration"
                  : "Next"}
              </button>
              <button className="rounded-xl border-4 border-gray-400 px-8 py-4 text-xl font-bold text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderSearchParticipantMockPage = (
    currentTarget: HighlightTarget,
  ) => {
    const showInactiveList =
      currentTarget === "search-inactive-list";
    const showInactiveProfile =
      currentTarget === "search-profile-inactive-buttons";

    const activeParticipants = [
      {
        name: "Emma Johnson",
        email: "emma.johnson@example.com",
        phone: "0400 111 222",
        dob: "14/05/1988",
        registered: "02/04/2026",
      },
      {
        name: "Liam Brown",
        email: "liam.brown@example.com",
        phone: "0400 333 444",
        dob: "09/11/1979",
        registered: "18/03/2026",
      },
    ];

    const inactiveParticipants = [
      {
        name: "Noah Wilson",
        email: "noah.wilson@example.com",
        phone: "0400 777 888",
        dob: "22/08/1992",
        registered: "21/02/2026",
      },
    ];

    const renderProfileButtons = () => (
      <div
        ref={
          showInactiveProfile
            ? searchProfileInactiveButtonsRef
            : searchProfileActiveButtonsRef
        }
        className="mt-8 flex flex-wrap gap-4"
      >
        <button className="flex items-center gap-3 rounded-xl bg-gray-300 px-7 py-4 text-lg font-bold text-gray-800 shadow-lg">
          <ArrowLeft size={22} />
          Back to Search
        </button>
        <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 text-lg font-bold text-white shadow-lg">
          <Pencil size={22} />
          Edit Details
        </button>
        <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-7 py-4 text-lg font-bold text-white shadow-lg">
          <Trash2 size={22} />
          Delete
        </button>
        {showInactiveProfile ? (
          <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-4 text-lg font-bold text-white shadow-lg">
            <RotateCcw size={22} />
            Reactivate Profile
          </button>
        ) : (
          <>
            <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 px-7 py-4 text-lg font-bold text-white shadow-lg">
              <Plus size={22} />
              Add to Program
            </button>
            <button className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 px-7 py-4 text-lg font-bold text-white shadow-lg">
              <UserX size={22} />
              Inactive Profile
            </button>
          </>
        )}
      </div>
    );

    if (
      currentTarget === "search-search" ||
      currentTarget === "search-active-list" ||
      currentTarget === "search-inactive-list"
    ) {
      return (
        <div
          ref={searchTrainingCanvasRef}
          className="absolute inset-0 bg-[#eef2f7]"
        >
          <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <div className="flex items-center justify-between px-10 py-5">
              <div className="flex items-center gap-6">
                <img
                  src={logo}
                  alt="The Hut Community Centre Logo"
                  className="h-16 w-auto"
                />
                <h1 className="text-4xl font-bold text-white">
                  The Hut Participation Portal
                </h1>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
                <LogOut size={24} />
                Logout
              </button>
            </div>
          </header>

          <main className="px-10 py-10">
            <div className="mx-auto max-w-[1540px]">
              <div className="mb-8 rounded-[30px] border border-orange-200 bg-white p-10 shadow-sm">
                <div className="mb-6 flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white">
                    <Search size={30} />
                  </div>
                  <div>
                    <h2 className="text-5xl font-bold text-slate-900">
                      Find Participant
                    </h2>
                    <p className="mt-2 text-lg text-slate-600">
                      Search for a participant and open their
                      profile for more detail.
                    </p>
                  </div>
                </div>

                <div className="mb-8 rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                  <h3 className="mb-2 text-xl font-bold text-orange-900">
                    Search Instructions
                  </h3>
                  <p className="text-base text-orange-800">
                    Use the search box below to find
                    participants by name, email, or phone
                    number. Click View Profile to open the full
                    participant record.
                  </p>
                </div>

                <div ref={searchSearchRef} className="mb-8">
                  <div className="relative">
                    <Search
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
                      size={28}
                    />
                    <div className="flex h-[88px] items-center rounded-[22px] border-4 border-gray-300 bg-white pl-20 pr-6 text-[24px] font-semibold text-slate-500 shadow-sm">
                      Type a name, email, or phone number...
                    </div>
                  </div>
                </div>

                <div
                  ref={searchActiveListRef}
                  className="mb-8 overflow-hidden rounded-[28px] border-4 border-green-200 bg-white shadow-sm"
                >
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
                    <h3 className="text-2xl font-bold">
                      Active Participants (2)
                    </h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      <tr>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Name
                        </th>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Email
                        </th>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Phone
                        </th>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Date of Birth
                        </th>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Registered
                        </th>
                        <th className="px-6 py-5 text-left text-lg font-bold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeParticipants.map(
                        (participant, index) => (
                          <tr
                            key={participant.email}
                            className={
                              index % 2 === 0
                                ? "bg-white"
                                : "bg-gray-50"
                            }
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-bold text-slate-900">
                                  {participant.name}
                                </div>
                                <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
                                  ACTIVE
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-base text-slate-600">
                              {participant.email}
                            </td>
                            <td className="px-6 py-5 text-base text-slate-600">
                              {participant.phone}
                            </td>
                            <td className="px-6 py-5 text-base text-slate-600">
                              {participant.dob}
                            </td>
                            <td className="px-6 py-5 text-base text-slate-600">
                              {participant.registered}
                            </td>
                            <td className="px-6 py-5">
                              <button className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-base font-bold text-white shadow-md">
                                <Eye size={20} />
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  ref={searchInactiveListRef}
                  className="overflow-hidden rounded-[28px] border-4 border-gray-300 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-gray-500 to-gray-600 px-6 py-4 text-white">
                    <h3 className="text-2xl font-bold">
                      Inactive Participants (1)
                    </h3>
                    {showInactiveList ? (
                      <ChevronUp size={30} />
                    ) : (
                      <ChevronDown size={30} />
                    )}
                  </div>

                  {showInactiveList ? (
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                        <tr>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Name
                          </th>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Email
                          </th>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Phone
                          </th>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Date of Birth
                          </th>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Registered
                          </th>
                          <th className="px-6 py-5 text-left text-lg font-bold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {inactiveParticipants.map(
                          (participant) => (
                            <tr
                              key={participant.email}
                              className="bg-gray-50"
                            >
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="text-lg font-bold text-slate-700">
                                    {participant.name}
                                  </div>
                                  <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                    INACTIVE
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-base text-slate-600">
                                {participant.email}
                              </td>
                              <td className="px-6 py-5 text-base text-slate-600">
                                {participant.phone}
                              </td>
                              <td className="px-6 py-5 text-base text-slate-600">
                                {participant.dob}
                              </td>
                              <td className="px-6 py-5 text-base text-slate-600">
                                {participant.registered}
                              </td>
                              <td className="px-6 py-5">
                                <button className="flex items-center gap-2 rounded-xl bg-gray-600 px-5 py-3 text-base font-bold text-white shadow-md">
                                  <Eye size={20} />
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-6 py-6 text-lg text-slate-600">
                      Click to expand and review inactive
                      participant records.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div
        ref={searchTrainingCanvasRef}
        className="absolute inset-0 bg-[#eef2f7]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mx-auto max-w-[1540px]">
            <div className="mb-8 rounded-[30px] border border-orange-200 bg-white p-10 shadow-sm">
              <div className="mb-6 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                  <User size={64} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h2 className="text-5xl font-bold text-slate-900">
                      Liam Brown
                    </h2>
                    <span
                      className={`rounded-full px-4 py-2 text-lg font-bold text-white ${
                        showInactiveProfile
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {showInactiveProfile
                        ? "INACTIVE"
                        : "ACTIVE"}
                    </span>
                  </div>
                  <p className="mt-2 text-xl text-slate-600">
                    Participant Profile
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={searchProfileGeneralRef}
              className="mb-8 rounded-[28px] border-4 border-orange-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl font-bold text-slate-900">
                General Info from Registration
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <Mail
                      className="text-orange-600"
                      size={28}
                    />
                    Contact Information
                  </div>
                  <p className="text-lg text-slate-700">
                    Email: liam.brown@example.com
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    Phone: 0400 333 444
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <User
                      className="text-orange-600"
                      size={28}
                    />
                    Personal Information
                  </div>
                  <p className="text-lg text-slate-700">
                    Gender: Male
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    Date of Birth: 09/11/1979
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <Phone
                      className="text-orange-600"
                      size={28}
                    />
                    Emergency Contact
                  </div>
                  <p className="text-lg text-slate-700">
                    Sarah Brown
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    0400 999 111
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <Globe
                      className="text-orange-600"
                      size={28}
                    />
                    Cultural Background
                  </div>
                  <p className="text-lg text-slate-700">
                    ATSI: No
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    Country of Birth: Australia
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <MessageSquare
                      className="text-orange-600"
                      size={28}
                    />
                    Communication Preferences
                  </div>
                  <p className="text-lg text-slate-700">
                    Preferred contact: Phone
                  </p>
                  <p className="mt-2 text-lg text-slate-700">
                    Newsletter: Yes
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-6">
                  <div className="mb-3 flex items-center gap-3 text-xl font-bold text-slate-900">
                    <Camera
                      className="text-orange-600"
                      size={28}
                    />
                    Photo Consent
                  </div>
                  <p className="text-lg text-slate-700">
                    General photo consent granted
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={searchProfileProgramSpecificRef}
              className="mb-8 rounded-[28px] border-4 border-purple-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 text-3xl font-bold text-slate-900">
                Program-Specific Registration Information
              </div>
              <div className="rounded-2xl bg-purple-50 p-6">
                <div className="mb-4 text-xl font-bold text-purple-900">
                  Walking Group
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-sm font-bold text-purple-700">
                      Medical Notes
                    </div>
                    <div className="mt-2 text-base text-slate-800">
                      Brings own water bottle
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-sm font-bold text-purple-700">
                      Mobility Support
                    </div>
                    <div className="mt-2 text-base text-slate-800">
                      Not required
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={searchProfileEnrolledProgramsRef}
              className="mb-8 rounded-[28px] border-4 border-orange-200 bg-white p-8 shadow-sm"
            >
              <div className="mb-6 flex items-center gap-3 text-3xl font-bold text-slate-900">
                <BookOpen
                  className="text-orange-600"
                  size={32}
                />
                Enrolled Programs
              </div>
              {showInactiveProfile ? (
                <div className="rounded-2xl bg-orange-50 p-8 text-center">
                  <p className="text-xl font-semibold text-slate-700">
                    Not enrolled in any programs yet
                  </p>
                  <p className="mt-2 text-lg text-slate-600">
                    Use Reactivate Profile to add this
                    participant back to a program.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="text-xl font-bold text-slate-900">
                        Walking Group
                      </div>
                      <span className="rounded-full bg-orange-200 px-3 py-1 text-sm font-semibold text-orange-800">
                        12 sessions attended
                      </span>
                    </div>
                    <p className="text-base text-slate-600">
                      Monday and Wednesday, 10:00 - 11:00
                    </p>
                  </div>
                  <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="text-xl font-bold text-slate-900">
                        Community Shed
                      </div>
                      <span className="rounded-full bg-orange-200 px-3 py-1 text-sm font-semibold text-orange-800">
                        5 sessions attended
                      </span>
                    </div>
                    <p className="text-base text-slate-600">
                      Thursday, 13:00 - 15:00
                    </p>
                  </div>
                </div>
              )}
            </div>

            {renderProfileButtons()}
          </div>
        </main>
      </div>
    );
  };

  const renderProgramsMockPage = (
    currentTarget: HighlightTarget,
  ) => {
    const fieldLabelClass =
      "mb-2 block text-sm font-bold text-slate-700";
    const inputClass =
      "flex h-[52px] items-center rounded-xl border-2 border-gray-300 bg-white px-4 text-[15px] text-slate-900";
    const programCardClass =
      "rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md";
    const showAddModal = currentTarget === "programs-add-modal";
    const showStaffModal =
      currentTarget === "programs-manage-staff";

    const renderProgramCard = ({
      name,
      description,
      accent,
      editDeleteRef,
      staffRef,
    }: {
      name: string;
      description: string;
      accent: string;
      editDeleteRef?: any;
      staffRef?: any;
    }) => (
      <div className={programCardClass}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-2xl font-bold text-slate-900">
              {name}
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              {description}
            </p>
          </div>
          <div
            ref={editDeleteRef}
            className="flex items-center gap-2"
          >
            <button className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Pencil size={20} />
            </button>
            <button className="rounded-xl bg-red-100 p-3 text-red-700">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar size={16} className={accent} />
            <span>Mon, Wed · Weekly</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className={accent} />
            <span>Starts 01 May 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} className={accent} />
            <span>Capacity 20 · Remaining 8</span>
          </div>
        </div>

        <button
          ref={staffRef}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-100 px-4 py-3 font-bold text-purple-700"
        >
          <User size={18} />
          Manage Staff (2)
        </button>
      </div>
    );

    return (
      <div
        ref={programsCanvasRef}
        className="absolute inset-0 bg-[#eef3f7]"
      >
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <div className="flex items-center justify-between px-10 py-5">
            <div className="flex items-center gap-6">
              <img
                src={logo}
                alt="The Hut Community Centre Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-4xl font-bold text-white">
                The Hut Participation Portal
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-2xl font-bold text-white shadow-md">
              <LogOut size={24} />
              Logout
            </button>
          </div>
        </header>

        <main className="px-10 py-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-[60px] font-bold leading-none text-[#0f2244]">
                Manage Programs
              </h2>
              <p className="mt-3 text-[22px] text-slate-600">
                Create, organise, and manage The Hut programs.
              </p>
            </div>
            <button
              ref={programsAddButtonRef}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 px-7 py-4 text-[24px] font-bold text-white shadow-lg"
            >
              <Plus size={26} />
              Add Program
            </button>
          </div>

          <div
            ref={programsCategoriesRef}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div
                ref={programsChildrenTitleRef}
                className="rounded-2xl border-2 border-purple-300 bg-purple-100 px-6 py-4"
              >
                <h3 className="text-[30px] font-bold text-purple-900">
                  Children's Programs
                </h3>
                <p className="text-[18px] text-purple-700">
                  Programs designed for children and families.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {renderProgramCard({
                  name: "Outdoor Playgroup",
                  description:
                    "Weekly playgroup for children and carers.",
                  accent: "text-purple-600",
                  editDeleteRef:
                    currentTarget === "programs-edit-delete"
                      ? programsEditDeleteRef
                      : undefined,
                  staffRef:
                    currentTarget === "programs-manage-staff"
                      ? programsManageStaffRef
                      : undefined,
                })}
                {renderProgramCard({
                  name: "Homework Club",
                  description:
                    "After-school homework and study support.",
                  accent: "text-purple-600",
                })}
                {renderProgramCard({
                  name: "Dungeons & Dragons",
                  description:
                    "Creative role-play and social connection.",
                  accent: "text-purple-600",
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div
                ref={programsFitnessTitleRef}
                className="rounded-2xl border-2 border-orange-300 bg-orange-100 px-6 py-4"
              >
                <h3 className="text-[30px] font-bold text-orange-900">
                  Fitness & Wellbeing Programs
                </h3>
                <p className="text-[18px] text-orange-700">
                  Physical activity and health programs.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {renderProgramCard({
                  name: "Community Fun Fitness",
                  description:
                    "Inclusive movement sessions for all levels.",
                  accent: "text-orange-600",
                })}
                {renderProgramCard({
                  name: "Strength & Balance",
                  description:
                    "Falls prevention and balance training.",
                  accent: "text-orange-600",
                })}
                {renderProgramCard({
                  name: "Walking Group",
                  description:
                    "Guided group walks for wellbeing.",
                  accent: "text-orange-600",
                })}
              </div>
            </div>

            <div className="space-y-4 pb-10">
              <div
                ref={programsGeneralTitleRef}
                className="rounded-2xl border-2 border-green-300 bg-green-100 px-6 py-4"
              >
                <h3 className="text-[30px] font-bold text-green-900">
                  General Programs
                </h3>
                <p className="text-[18px] text-green-700">
                  Community activities and workshops.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {renderProgramCard({
                  name: "Community Lunch",
                  description:
                    "A shared lunch and social connection program.",
                  accent: "text-green-600",
                })}
                {renderProgramCard({
                  name: "Art Workshop",
                  description:
                    "Creative art activities and skill building.",
                  accent: "text-green-600",
                })}
                {renderProgramCard({
                  name: "Gardening Group",
                  description:
                    "Community gardening and sustainability.",
                  accent: "text-green-600",
                })}
              </div>
            </div>
          </div>
        </main>

        {showAddModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-6">
            <div
              ref={programsAddModalRef}
              className="w-full max-w-3xl rounded-[28px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[36px] font-bold text-slate-900">
                  Add New Program
                </h3>
                <button className="rounded-lg p-2 text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className={fieldLabelClass}>
                    Program Name *
                  </label>
                  <div className={inputClass}>
                    Enter program name
                  </div>
                </div>
                <div className="col-span-2">
                  <label className={fieldLabelClass}>
                    Description
                  </label>
                  <div className="h-[92px] rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-[15px] text-slate-900">
                    Enter program description
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Recurrence Type *
                  </label>
                  <div className={inputClass}>Weekly</div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Capacity *
                  </label>
                  <div className={inputClass}>20</div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Days *
                  </label>
                  <div className={inputClass}>
                    Monday, Wednesday
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Start Date *
                  </label>
                  <div className={inputClass}>
                    01 / 05 / 2026
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    Start Time *
                  </label>
                  <div className={inputClass}>09:30 AM</div>
                </div>
                <div>
                  <label className={fieldLabelClass}>
                    End Time *
                  </label>
                  <div className={inputClass}>11:00 AM</div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-4">
                <button className="rounded-xl border border-gray-300 px-6 py-3 text-lg font-semibold text-slate-700">
                  Cancel
                </button>
                <button className="rounded-xl bg-green-600 px-6 py-3 text-lg font-bold text-white">
                  Add Program
                </button>
              </div>
            </div>
          </div>
        )}

        {showStaffModal && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-6">
            <div
              ref={programsManageStaffRef}
              className="w-full max-w-2xl rounded-[28px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[34px] font-bold text-slate-900">
                  Manage Staff
                </h3>
                <button className="rounded-lg p-2 text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <div className="text-xl font-bold text-purple-900">
                  Outdoor Playgroup
                </div>
                <div className="mt-1 text-base text-purple-700">
                  Assign staff members to manage this program.
                </div>
              </div>

              <div className="space-y-4">
                {[
                  [
                    "Haoxin Che",
                    "Manager / Administrator",
                    true,
                  ],
                  ["Emma Johnson", "Program Coordinator", true],
                  ["Michael Brown", "Volunteer", false],
                ].map(([name, role, assigned]) => (
                  <div
                    key={String(name)}
                    className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4"
                  >
                    <div>
                      <div className="text-lg font-bold text-slate-900">
                        {name}
                      </div>
                      <div className="text-sm text-slate-600">
                        {role}
                      </div>
                    </div>
                    <button
                      className={`rounded-xl px-5 py-2 text-sm font-bold ${
                        assigned
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {assigned ? "Remove" : "Assign"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-end">
                <button className="rounded-xl border border-gray-300 px-6 py-3 text-lg font-semibold text-slate-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGenericMockPage = () => {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-20 bg-blue-600" />
        <div className="absolute top-20 left-0 h-full w-72 bg-white shadow-lg" />
        <div className="absolute top-20 left-72 right-0 bg-gradient-to-br from-gray-50 to-blue-50 p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 h-12 w-64 rounded-lg bg-gray-300" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-white shadow-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (activeModule) {
    const currentStepData = activeModule.steps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep =
      currentStep === activeModule.steps.length - 1;
    const textboxStyle = getTextboxPosition(
      currentStepData.highlightTarget,
      activeModule.id,
    );
    const walkthroughHeight =
      activeModule.id === "basics"
        ? "min-h-[2000px]"
        : activeModule.id === "reports"
          ? "min-h-[1750px]"
          : activeModule.id === "attendance"
            ? "min-h-[1700px]"
            : activeModule.id === "add-to-program"
              ? "min-h-[1650px]"
              : activeModule.id === "programs"
                ? currentStepData.highlightTarget ===
                  "programs-manage-staff"
                  ? "min-h-[1700px]"
                  : "min-h-[1850px]"
                : activeModule.id === "search"
                  ? currentStep < 3
                    ? "min-h-[1900px]"
                    : "min-h-[3000px]"
                  : activeModule.id === "add-participant"
                    ? currentStepData.highlightTarget ===
                      "participant-program-details"
                      ? "min-h-[1900px]"
                      : currentStepData.highlightTarget ===
                            "participant-children-programs" ||
                          currentStepData.highlightTarget ===
                            "participant-fitness-programs" ||
                          currentStepData.highlightTarget ===
                            "participant-general-programs"
                        ? "min-h-[1550px]"
                        : "min-h-[2450px]"
                    : "min-h-screen";

    return (
      <div
        ref={walkthroughScrollRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-100"
      >
        <div className={`relative w-full ${walkthroughHeight}`}>
          <div className="absolute inset-0">
            {activeModule.id === "basics"
              ? renderPortalBasicsMock()
              : activeModule.id === "reports"
                ? renderReportsMockPage()
                : activeModule.id === "attendance"
                  ? renderAttendanceMockPage()
                  : activeModule.id === "add-to-program"
                    ? renderAddToProgramMockPage()
                    : activeModule.id === "programs"
                      ? renderProgramsMockPage(
                          currentStepData.highlightTarget,
                        )
                      : activeModule.id === "search"
                        ? renderSearchParticipantMockPage(
                            currentStepData.highlightTarget,
                          )
                        : activeModule.id === "add-participant"
                          ? renderAddParticipantMockPage(
                              currentStepData.highlightTarget,
                            )
                          : renderGenericMockPage()}
          </div>

          {activeModule.id === "programs" &&
          programsOverlayRects.length > 0 ? (
            <svg className="absolute inset-0 z-20 h-full w-full pointer-events-none overflow-visible">
              <defs>
                <mask
                  id={`programs-highlight-mask-${currentStep}`}
                  maskUnits="userSpaceOnUse"
                >
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="white"
                  />
                  {programsOverlayRects.map((rect, index) => (
                    <rect
                      key={`mask-${index}`}
                      x={rect.left}
                      y={rect.top}
                      width={rect.width}
                      height={rect.height}
                      rx={rect.borderRadius ?? 22}
                      fill="black"
                    />
                  ))}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(15, 23, 42, 0.58)"
                mask={`url(#programs-highlight-mask-${currentStep})`}
              />
              {programsOverlayRects.map((rect, index) => (
                <rect
                  key={`outline-${index}`}
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx={rect.borderRadius ?? 22}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="4"
                />
              ))}
            </svg>
          ) : (
            <div
              style={getHighlightStyles(
                currentStepData.highlightTarget,
                activeModule.id,
              )}
            />
          )}

          <div
            style={{ ...textboxStyle, height: "auto" }}
            className="z-30 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-blue-600 px-4 py-1 text-sm font-bold text-white">
                  Step {currentStepData.stepNumber}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentStepData.title}
                </h3>
              </div>
              <button
                onClick={handleFinish}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Close walkthrough"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-6 text-base leading-7 text-gray-700">
              {currentStepData.description}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-colors ${
                  isFirstStep
                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Finish
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Staff Training">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Welcome to the training hub
          </h2>
          <p className="text-lg text-gray-700">
            Choose one training module below to open a guided
            walkthrough. Each module shows a mock version of the
            related page and explains the main actions staff
            should take there.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Training Modules
          </h2>
          <p className="mb-6 text-base text-gray-600">
            Select a module card to start the guided tour.
          </p>

          <div className="mb-6">
            {(() => {
              const module = trainingModules[0];
              const Icon = module.icon;

              return (
                <div className="rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 text-white shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-300 md:p-10">
                  <div className="flex h-full flex-col">
                    <div className="mb-8 flex items-center gap-6">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 md:h-24 md:w-24">
                        <Icon
                          size={48}
                          className="md:h-14 md:w-14"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-2 text-3xl font-bold md:text-4xl">
                          {module.title}
                        </h3>
                        <p className="text-lg text-white/90 md:text-xl">
                          {module.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-4 md:flex-row">
                      <button
                        onClick={() =>
                          handleStartWalkthrough(module)
                        }
                        className="flex-1 rounded-xl bg-white px-6 py-4 text-lg font-bold text-indigo-600 shadow-lg transition-colors hover:bg-indigo-50"
                      >
                        Open walkthrough
                      </button>
                      <button
                        onClick={() =>
                          handleOpenPage(module.route)
                        }
                        className="rounded-xl border-2 border-white/25 bg-indigo-700 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-indigo-800 md:min-w-[180px]"
                      >
                        Open page
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {trainingModules.slice(1).map((module) => {
              const Icon = module.icon;
              const colors = getColorClasses(module.color);

              return (
                <div
                  key={module.id}
                  className={`flex min-h-[460px] flex-col rounded-3xl bg-gradient-to-br ${colors.bg} ${colors.text} p-8 shadow-2xl transition-all duration-300 hover:scale-105 ${colors.hover} md:min-h-[480px] md:p-10`}
                >
                  <div
                    className={`${colors.icon} mb-6 flex h-20 w-20 items-center justify-center rounded-2xl md:h-24 md:w-24`}
                  >
                    <Icon
                      size={48}
                      className="md:h-14 md:w-14"
                    />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold md:text-3xl">
                    {module.title}
                  </h3>
                  <p className="mb-6 text-base opacity-90 md:text-lg">
                    {module.description}
                  </p>
                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() =>
                        handleStartWalkthrough(module)
                      }
                      className={`w-full rounded-xl bg-white px-5 py-3 font-bold shadow-lg transition-colors hover:bg-white/90 ${
                        module.color === "blue"
                          ? "text-blue-600"
                          : module.color === "green"
                            ? "text-green-600"
                            : module.color === "purple"
                              ? "text-purple-600"
                              : module.color === "orange"
                                ? "text-orange-600"
                                : module.color === "teal"
                                  ? "text-teal-600"
                                  : module.color === "amber"
                                    ? "text-amber-600"
                                    : module.color === "indigo"
                                      ? "text-indigo-600"
                                      : module.color === "pink"
                                        ? "text-pink-600"
                                        : "text-gray-700"
                      }`}
                    >
                      Open walkthrough
                    </button>
                    <button
                      onClick={() =>
                        handleOpenPage(module.route)
                      }
                      className="w-full rounded-xl border border-white/25 bg-white/12 px-5 py-3 font-semibold backdrop-blur-sm transition-colors hover:bg-white/20"
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