import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../components/Layout";
import { ChevronDown } from "lucide-react";
import {
  supabase,
  Program,
  Participant,
  AttendanceRecord,
} from "../../lib/supabase";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ADELAIDE_HILLS_TOWNSHIPS } from "../utils/constants";
import logo from "figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png";
import * as XLSX from "xlsx";

type TimePeriod =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually"
  | "custom";

const PROGRAM_CATEGORIES = [
  "Healthy Living",
  "Interest & Social",
  "Low Income Support",
  "Young People",
  "Sustainability",
] as const;

const getProgramCategory = (programName: string): string => {
  const name = programName.toLowerCase();
  if (
    name.includes("fitness") ||
    name.includes("strength") ||
    name.includes("chi kung") ||
    name.includes("walking") ||
    name.includes("men's moves")
  ) {
    return "Healthy Living";
  }
  if (
    name.includes("art") ||
    name.includes("lunch") ||
    name.includes("digital") ||
    name.includes("mentoring")
  ) {
    return "Interest & Social";
  }
  if (
    name.includes("homework") ||
    name.includes("playgroup") ||
    name.includes("dungeons")
  ) {
    return "Young People";
  }
  if (name.includes("garden")) {
    return "Sustainability";
  }
  return "Interest & Social";
};

const AGE_GROUPS = [
  "under 18",
  "18-24",
  "25-44",
  "45-64",
  "65+",
] as const;

const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;

const ATSI_STATUS = ["Yes", "No"] as const;
const CALD_BACKGROUND = ["Yes", "No"] as const;

const COUNCILS = [
  "Adelaide Hills Council",
  "Other Council",
] as const;

interface FilterValues {
  startDate: string;
  endDate: string;
  programCategory: string;
  program: string;
  ageGroup: string;
  gender: string;
  atsiStatus: string;
  caldBackground: string;
  council: string;
  township: string;
}

interface ParticipantStatus {
  id: string;
  isActive: boolean;
}

interface ReportData {
  uniqueParticipants: number;
  totalAttendances: number;
  totalRecords: number;
  attendanceRate: number;
  atsiCount: number;
  caldCount: number;
  ageDistribution: { name: string; value: number }[];
  genderDistribution: { name: string; value: number }[];
  councilDistribution: { name: string; value: number }[];
  townshipDistribution: { name: string; value: number }[];
  referralDistribution: { name: string; value: number }[];
  disabilityDistribution: { name: string; value: number }[];
  programData: {
    program: string;
    category: string;
    uniqueParticipants: number;
    attendances: number;
    attendanceRate: number;
    sessionsHeld: number;
  }[];
  activeParticipants: { name: string; status: string }[];
  inactiveParticipants: { name: string; status: string }[];
}

// Reports page — admin-only analytics dashboard for The Hut Community Centre.
//
// Data pipeline:
//   fetchData() pulls all programs, participants, and attendance_records from
//   Supabase once on mount. All subsequent filtering is done client-side via
//   the `reportData` useMemo so there is no re-fetching on filter changes.
//
// Filters: date range, program category, specific program, age group, gender,
//   ATSI status, CALD background, council, and township.
//
// Export options:
//   PDF — triggers window.print() so the browser prints the preview section.
//   Excel (.xlsx) — uses the `xlsx` library to write a multi-sheet workbook.
export default function Reports() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [timePeriod, setTimePeriod] =
    useState<TimePeriod>("monthly");
  const [showPreview, setShowPreview] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const today = new Date();
  const defaultEndDate = today.toISOString().split("T")[0];
  const defaultStartDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  const [filters, setFilters] = useState<FilterValues>({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    programCategory: "all",
    program: "all",
    ageGroup: "all",
    gender: "all",
    atsiStatus: "all",
    caldBackground: "all",
    council: "all",
    township: "all",
  });

  const [programs, setPrograms] = useState<Program[]>([]);
  const [participants, setParticipants] = useState<
    Participant[]
  >([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [participantStatuses, setParticipantStatuses] =
    useState<ParticipantStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [availableValues, setAvailableValues] = useState({
    programCategories: new Set<string>(),
    programs: new Set<string>(),
    ageGroups: new Set<string>(),
    genders: new Set<string>(),
    atsiStatuses: new Set<string>(),
    caldBackgrounds: new Set<string>(),
    councils: new Set<string>(),
    townships: new Set<string>(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
    }
    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [showExportMenu]);

  useEffect(() => {
    if (timePeriod !== "custom") {
      const end = new Date(filters.endDate);
      let start = new Date(end);
      switch (timePeriod) {
        case "weekly":
          start.setDate(end.getDate() - 7);
          break;
        case "monthly":
          start.setMonth(end.getMonth() - 1);
          break;
        case "quarterly":
          start.setMonth(end.getMonth() - 3);
          break;
        case "annually":
          start.setFullYear(end.getFullYear() - 1);
          break;
      }
      setFilters((prev) => ({
        ...prev,
        startDate: start.toISOString().split("T")[0],
      }));
    }
  }, [timePeriod, filters.endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: programsData, error: programsError } =
        await supabase
          .from("programs")
          .select("*")
          .order("name", { ascending: true });
      if (programsError) throw programsError;
      setPrograms(programsData || []);

      const {
        data: participantsData,
        error: participantsError,
      } = await supabase.from("participants").select("*");
      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      const { data: attendanceData, error: attendanceError } =
        await supabase.from("attendance_records").select("*");
      if (attendanceError) {
        console.error(
          "Error fetching attendance records:",
          attendanceError,
        );
        setAttendanceRecords([]);
      } else {
        setAttendanceRecords(attendanceData || []);
      }

      // Fetch enrollment data to determine active/inactive status
      const { data: enrollmentData } = await supabase
        .from("program_enrollments")
        .select("participant_id, is_active, withdrawal_reason");

      if (enrollmentData && participantsData) {
        const statusMap = new Map<string, boolean>();
        (participantsData || []).forEach((p: any) => {
          const enrollments = enrollmentData.filter(
            (e: any) => e.participant_id === p.id,
          );
          if (enrollments.length === 0) {
            statusMap.set(p.id, false);
          } else {
            const hasActive = enrollments.some(
              (e: any) =>
                e.is_active !== false ||
                e.withdrawal_reason !== "Profile deactivated",
            );
            statusMap.set(p.id, hasActive);
          }
        });
        const statuses: ParticipantStatus[] = (
          participantsData || []
        ).map((p: any) => ({
          id: p.id,
          isActive: statusMap.get(p.id) ?? false,
        }));
        setParticipantStatuses(statuses);
      }

      const cats = new Set<string>();
      const progs = new Set<string>();
      const ages = new Set<string>();
      const gens = new Set<string>();
      const atsi = new Set<string>();
      const cald = new Set<string>();
      const couns = new Set<string>();
      const towns = new Set<string>();

      (programsData || []).forEach((prog) => {
        const cat = getProgramCategory(prog.name);
        cats.add(cat);
        progs.add(prog.name);
      });

      (participantsData || []).forEach((p: any) => {
        const age = calculateAge(p.date_of_birth);
        ages.add(getAgeGroup(age));
        if (p.gender) gens.add(p.gender);
        if (p.identify_aboriginal_tsi)
          atsi.add(p.identify_aboriginal_tsi);
        const isCald =
          (p.country_of_birth &&
            p.country_of_birth !== "Australia") ||
          p.speak_other_language === "Yes";
        cald.add(isCald ? "Yes" : "No");
        const council =
          p.council_region === "Adelaide Hills Council"
            ? "Adelaide Hills Council"
            : "Other Council";
        couns.add(council);
        if (p.township) towns.add(p.township);
      });

      setAvailableValues({
        programCategories: cats,
        programs: progs,
        ageGroups: ages,
        genders: gens,
        atsiStatuses: atsi,
        caldBackgrounds: cald,
        councils: couns,
        townships: towns,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string | null): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getAgeGroup = (age: number): string => {
    if (age < 18) return "under 18";
    if (age >= 18 && age <= 24) return "18-24";
    if (age >= 25 && age <= 44) return "25-44";
    if (age >= 45 && age <= 64) return "45-64";
    return "65+";
  };

  // All report calculations run inside useMemo so they only recompute when
  // the underlying data or filters change. Avoids redundant work on every render.
  const reportData = useMemo<ReportData>(() => {
    const filteredParticipants = (participants as any[]).filter(
      (p) => {
        const age = calculateAge(p.date_of_birth);
        const ageGroup = getAgeGroup(age);
        const isCald =
          (p.country_of_birth &&
            p.country_of_birth !== "Australia") ||
          p.speak_other_language === "Yes";
        const council =
          p.council_region === "Adelaide Hills Council"
            ? "Adelaide Hills Council"
            : "Other Council";

        if (
          filters.ageGroup !== "all" &&
          ageGroup !== filters.ageGroup
        )
          return false;
        if (
          filters.gender !== "all" &&
          p.gender !== filters.gender
        )
          return false;
        if (
          filters.atsiStatus !== "all" &&
          p.identify_aboriginal_tsi !== filters.atsiStatus
        )
          return false;
        if (
          filters.caldBackground !== "all" &&
          (isCald ? "Yes" : "No") !== filters.caldBackground
        )
          return false;
        if (
          filters.council !== "all" &&
          council !== filters.council
        )
          return false;
        if (
          filters.township !== "all" &&
          p.township !== filters.township
        )
          return false;

        return true;
      },
    );

    const participantIds = new Set(
      filteredParticipants.map((p) => p.id),
    );

    const filteredPrograms = programs.filter((prog) => {
      const cat = getProgramCategory(prog.name);
      if (
        filters.programCategory !== "all" &&
        cat !== filters.programCategory
      )
        return false;
      if (
        filters.program !== "all" &&
        prog.name !== filters.program
      )
        return false;
      return true;
    });

    const programIds = new Set(
      filteredPrograms.map((p) => p.id),
    );

    const filteredRecords = attendanceRecords.filter(
      (record) => {
        if (!participantIds.has(record.participant_id))
          return false;
        if (!programIds.has(record.program_id)) return false;
        const recordDate = new Date(record.date);
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        if (recordDate < startDate || recordDate > endDate)
          return false;
        return true;
      },
    );

    // Get participants who actually attended the filtered programs
    const participantsInFilteredPrograms = new Set(
      filteredRecords.map((r) => r.participant_id),
    );
    const participantsForCharts = filteredParticipants.filter(
      (p) => participantsInFilteredPrograms.has(p.id),
    );

    const uniqueParticipantIds = new Set(
      filteredRecords.map((r) => r.participant_id),
    );
    const presentRecords = filteredRecords.filter(
      (r) => r.status === "present",
    );

    const uniqueParticipants = uniqueParticipantIds.size;
    const totalAttendances = presentRecords.length;
    const totalRecords = filteredRecords.length;
    const attendanceRate =
      totalRecords > 0
        ? (totalAttendances / totalRecords) * 100
        : 0;

    // ATSI count - use participantsForCharts (filtered by program)
    const atsiCount = participantsForCharts.filter(
      (p) => p.identify_aboriginal_tsi === "Yes",
    ).length;

    // CALD count - use participantsForCharts (filtered by program)
    const caldCount = participantsForCharts.filter(
      (p) =>
        (p.country_of_birth &&
          p.country_of_birth !== "Australia") ||
        p.speak_other_language === "Yes",
    ).length;

    // Age distribution - use participantsForCharts (filtered by program)
    const ageDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      const age = calculateAge(p.date_of_birth);
      const group = getAgeGroup(age);
      ageDistMap.set(group, (ageDistMap.get(group) || 0) + 1);
    });
    const ageDistribution = Array.from(
      ageDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Gender distribution - use participantsForCharts (filtered by program)
    const genderDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      if (p.gender) {
        genderDistMap.set(
          p.gender,
          (genderDistMap.get(p.gender) || 0) + 1,
        );
      }
    });
    const genderDistribution = Array.from(
      genderDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Council distribution - use participantsForCharts (filtered by program)
    const councilDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      const council = p.council_region || "Unknown";
      councilDistMap.set(
        council,
        (councilDistMap.get(council) || 0) + 1,
      );
    });
    const councilDistribution = Array.from(
      councilDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Township distribution - use participantsForCharts (filtered by program)
    const townshipDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      const township = p.township || "Unknown";
      townshipDistMap.set(
        township,
        (townshipDistMap.get(township) || 0) + 1,
      );
    });
    const townshipDistribution = Array.from(
      townshipDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Referral / "How did you hear about us" distribution - use participantsForCharts (filtered by program)
    const referralDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      let sources: string[] = [];
      if (p.referral_sources) {
        try {
          const parsed =
            typeof p.referral_sources === "string"
              ? JSON.parse(p.referral_sources)
              : p.referral_sources;
          if (Array.isArray(parsed)) sources = parsed;
        } catch {
          // ignore parse errors
        }
      }
      if (sources.length === 0) {
        referralDistMap.set(
          "Not specified",
          (referralDistMap.get("Not specified") || 0) + 1,
        );
      } else {
        sources.forEach((src: string) => {
          // Trim "Other: ..." to just "Other"
          const label = src.startsWith("Other:")
            ? "Other"
            : src;
          referralDistMap.set(
            label,
            (referralDistMap.get(label) || 0) + 1,
          );
        });
      }
    });
    const referralDistribution = Array.from(
      referralDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Disability / additional requirements distribution - use participantsForCharts (filtered by program)
    const disabilityDistMap = new Map<string, number>();
    participantsForCharts.forEach((p) => {
      const hasReqs =
        p.additional_requirements &&
        p.additional_requirements.trim() !== "";
      const label = hasReqs
        ? "Has Additional Requirements"
        : "No Additional Requirements";
      disabilityDistMap.set(
        label,
        (disabilityDistMap.get(label) || 0) + 1,
      );
    });
    const disabilityDistribution = Array.from(
      disabilityDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Program data
    const programDataMap = new Map<
      string,
      {
        category: string;
        participantIds: Set<string>;
        attendances: number;
        totalRecords: number;
        sessionDates: Set<string>;
      }
    >();

    filteredRecords.forEach((record) => {
      const prog = programs.find(
        (p) => p.id === record.program_id,
      );
      if (!prog) return;
      const existing = programDataMap.get(prog.name) || {
        category: getProgramCategory(prog.name),
        participantIds: new Set(),
        attendances: 0,
        totalRecords: 0,
        sessionDates: new Set(),
      };
      existing.participantIds.add(record.participant_id);
      if (record.status === "present") existing.attendances++;
      existing.totalRecords++;
      existing.sessionDates.add(record.date);
      programDataMap.set(prog.name, existing);
    });

    const programData = Array.from(
      programDataMap.entries(),
    ).map(([program, data]) => ({
      program,
      category: data.category,
      uniqueParticipants: data.participantIds.size,
      attendances: data.attendances,
      attendanceRate:
        data.totalRecords > 0
          ? (data.attendances / data.totalRecords) * 100
          : 0,
      sessionsHeld: data.sessionDates.size,
    }));

    // Active / inactive participants list
    const statusById = new Map(
      participantStatuses.map((s) => [s.id, s.isActive]),
    );
    const activeParticipants: {
      name: string;
      status: string;
    }[] = [];
    const inactiveParticipants: {
      name: string;
      status: string;
    }[] = [];

    filteredParticipants.forEach((p) => {
      const isActive = statusById.get(p.id) ?? false;
      const name = `${p.first_name} ${p.last_name}`;
      if (isActive) {
        activeParticipants.push({ name, status: "Active" });
      } else {
        inactiveParticipants.push({ name, status: "Inactive" });
      }
    });

    activeParticipants.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    inactiveParticipants.sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return {
      uniqueParticipants,
      totalAttendances,
      totalRecords,
      attendanceRate,
      atsiCount,
      caldCount,
      ageDistribution,
      genderDistribution,
      councilDistribution,
      townshipDistribution,
      referralDistribution,
      disabilityDistribution,
      programData,
      activeParticipants,
      inactiveParticipants,
    };
  }, [
    participants,
    programs,
    attendanceRecords,
    filters,
    participantStatuses,
  ]);

  const handleFilterChange = (
    key: keyof FilterValues,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleExport = async (format: "pdf" | "csv") => {
    if (format === "pdf") {
      window.print();
    } else {
      // Export as Excel with two sheets
      const wb = XLSX.utils.book_new();

      // Sheet 1: Program Details
      const programSheetData = [
        [
          "Program",
          "Category",
          "Sessions Held",
          "Unique Participants",
          "Attendances",
          "Attendance Rate",
        ],
        ...reportData.programData.map((p) => [
          p.program,
          p.category,
          p.sessionsHeld,
          p.uniqueParticipants,
          p.attendances,
          `${p.attendanceRate.toFixed(1)}%`,
        ]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(programSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, "Program Details");

      // Sheet 2: Participants (Active & Inactive)
      const participantSheetData = [
        ["Name", "Status"],
        ...reportData.activeParticipants.map((p) => [
          p.name,
          p.status,
        ]),
        ...reportData.inactiveParticipants.map((p) => [
          p.name,
          p.status,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(participantSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, "Participants");

      // Sheet 3: Summary Stats
      const summarySheetData = [
        ["Metric", "Value"],
        ["Unique Participants", reportData.uniqueParticipants],
        ["Total Attendances", reportData.totalAttendances],
        ["Total Records", reportData.totalRecords],
        [
          "Attendance Rate",
          `${reportData.attendanceRate.toFixed(1)}%`,
        ],
        ["Identifying as ATSI", reportData.atsiCount],
        ["Identifying as CALD", reportData.caldCount],
        [],
        ["Council Area", "Count"],
        ...reportData.councilDistribution.map((d) => [
          d.name,
          d.value,
        ]),
        [],
        ["Township", "Count"],
        ...reportData.townshipDistribution.map((d) => [
          d.name,
          d.value,
        ]),
        [],
        ["How Did You Hear About Us", "Count"],
        ...reportData.referralDistribution.map((d) => [
          d.name,
          d.value,
        ]),
        [],
        ["Disability / Additional Requirements", "Count"],
        ...reportData.disabilityDistribution.map((d) => [
          d.name,
          d.value,
        ]),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(summarySheetData);
      XLSX.utils.book_append_sheet(wb, ws3, "Summary");

      XLSX.writeFile(
        wb,
        `report-${filters.startDate}-to-${filters.endDate}.xlsx`,
      );
    }
  };

  const getReportSubtitle = () => {
    const category =
      filters.programCategory === "all"
        ? "All program categories"
        : filters.programCategory;
    const program =
      filters.program === "all"
        ? "All programs"
        : filters.program;
    const periodLabel =
      timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
    return `${periodLabel} Report – ${category} – ${program}`;
  };

  const COLORS = [
    "#14B8A6",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#10B981",
    "#EC4899",
    "#F97316",
    "#06B6D4",
    "#84CC16",
    "#A855F7",
  ];

  const renderCenteredPieChart = (
    data: { name: string; value: number }[],
  ) => (
    <div className="flex h-[270px] w-full items-center justify-center overflow-visible">
      <PieChart width={410} height={275}>
        <Pie
          data={data}
          cx={205}
          cy={132}
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          outerRadius={92}
          fill="#8884d8"
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );

  return (
    <Layout title="View Reports">
      <div className="mx-auto max-w-[1800px]">
        {/* Report Filters Section */}
        <div className="mb-8 rounded-[28px] border border-[#d9d9d9] bg-white px-10 py-8 print:hidden">
          <h2 className="mb-7 text-[22px] font-bold leading-none tracking-tight text-[#152238]">
            Report Filters
          </h2>

          {/* Time Period Controls */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4">
              {(
                [
                  "weekly",
                  "monthly",
                  "quarterly",
                  "annually",
                  "custom",
                ] as TimePeriod[]
              ).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`rounded-full border px-7 py-2.5 text-[1rem] font-bold transition-all ${
                    timePeriod === period
                      ? "border-teal-500 bg-teal-500/10 text-teal-700"
                      : "border-[#d9d9d9] bg-white text-[#152238] hover:bg-slate-50"
                  }`}
                >
                  {period === "custom"
                    ? "Custom Range"
                    : period.charAt(0).toUpperCase() +
                      period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Fields */}
          <div className="space-y-6">
            {/* Line 1 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Start date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange(
                      "startDate",
                      e.target.value,
                    )
                  }
                  disabled={timePeriod !== "custom"}
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  End date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange(
                      "endDate",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Program category
                </label>
                <select
                  value={filters.programCategory}
                  onChange={(e) =>
                    handleFilterChange(
                      "programCategory",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">
                    All program categories
                  </option>
                  {PROGRAM_CATEGORIES.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className={
                        availableValues.programCategories.has(
                          cat,
                        )
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.programCategories.has(
                          cat,
                        )
                      }
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Program
                </label>
                <select
                  value={filters.program}
                  onChange={(e) =>
                    handleFilterChange(
                      "program",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All programs</option>
                  {programs.map((prog) => (
                    <option
                      key={prog.id}
                      value={prog.name}
                      className={
                        availableValues.programs.has(prog.name)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.programs.has(prog.name)
                      }
                    >
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line 2 */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Age group
                </label>
                <select
                  value={filters.ageGroup}
                  onChange={(e) =>
                    handleFilterChange(
                      "ageGroup",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All age groups</option>
                  {AGE_GROUPS.map((age) => (
                    <option
                      key={age}
                      value={age}
                      className={
                        availableValues.ageGroups.has(age)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.ageGroups.has(age)
                      }
                    >
                      {age}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) =>
                    handleFilterChange("gender", e.target.value)
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All genders</option>
                  {GENDERS.map((gen) => (
                    <option
                      key={gen}
                      value={gen}
                      className={
                        availableValues.genders.has(gen)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.genders.has(gen)
                      }
                    >
                      {gen}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  ATSI status
                </label>
                <select
                  value={filters.atsiStatus}
                  onChange={(e) =>
                    handleFilterChange(
                      "atsiStatus",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All ATSI statuses</option>
                  {ATSI_STATUS.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className={
                        availableValues.atsiStatuses.has(status)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.atsiStatuses.has(
                          status,
                        )
                      }
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  CALD background
                </label>
                <select
                  value={filters.caldBackground}
                  onChange={(e) =>
                    handleFilterChange(
                      "caldBackground",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">
                    All CALD backgrounds
                  </option>
                  {CALD_BACKGROUND.map((bg) => (
                    <option
                      key={bg}
                      value={bg}
                      className={
                        availableValues.caldBackgrounds.has(bg)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.caldBackgrounds.has(bg)
                      }
                    >
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line 3 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Council
                </label>
                <select
                  value={filters.council}
                  onChange={(e) =>
                    handleFilterChange(
                      "council",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All councils</option>
                  {COUNCILS.map((council) => (
                    <option
                      key={council}
                      value={council}
                      className={
                        availableValues.councils.has(council)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.councils.has(council)
                      }
                    >
                      {council}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-3 block text-[1.1rem] font-bold text-[#152238]">
                  Township
                </label>
                <select
                  value={filters.township}
                  onChange={(e) =>
                    handleFilterChange(
                      "township",
                      e.target.value,
                    )
                  }
                  className="h-[66px] w-full rounded-[20px] border border-[#d9d9d9] bg-white px-5 text-[0.98rem] text-[#152238] outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="all">All townships</option>
                  {ADELAIDE_HILLS_TOWNSHIPS.map((town) => (
                    <option
                      key={town}
                      value={town}
                      className={
                        availableValues.townships.has(town)
                          ? "text-black"
                          : "text-gray-400"
                      }
                      disabled={
                        !availableValues.townships.has(town)
                      }
                    >
                      {town}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={handlePreview}
              className="h-[60px] rounded-[18px] border border-[#d9d9d9] bg-white px-8 text-[1rem] font-bold text-[#152238] transition-colors hover:bg-slate-50"
            >
              Preview Report
            </button>

            <div
              ref={exportMenuRef}
              className="relative inline-flex"
            >
              <button
                onClick={() =>
                  setShowExportMenu(!showExportMenu)
                }
                className="h-[60px] rounded-l-[18px] bg-teal-500 px-8 text-[1rem] font-bold text-white transition-colors hover:bg-teal-600"
              >
                Export Report
              </button>
              <button
                onClick={() =>
                  setShowExportMenu(!showExportMenu)
                }
                className="flex h-[60px] w-[64px] items-center justify-center rounded-r-[18px] border-l border-white/30 bg-teal-500 text-white transition-colors hover:bg-teal-600"
                aria-label="Choose export format"
              >
                <ChevronDown size={18} />
              </button>

              {showExportMenu && (
                <div className="absolute left-0 top-full z-10 mt-2 min-w-[190px] overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  <button
                    onClick={() => {
                      handleExport("pdf");
                      setShowExportMenu(false);
                    }}
                    className="block w-full whitespace-nowrap px-4 py-3 text-left text-[0.95rem] text-[#152238] hover:bg-slate-50"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      handleExport("csv");
                      setShowExportMenu(false);
                    }}
                    className="block w-full whitespace-nowrap px-4 py-3 text-left text-[0.95rem] text-[#152238] hover:bg-slate-50"
                  >
                    Export as Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        {showPreview && (
          <div
            ref={reportRef}
            className="mb-8 rounded-2xl bg-white p-8 shadow-lg print:p-4 print:shadow-none"
          >
            {/* Report Header */}
            <div className="mb-6 border-b-2 border-gray-200 pb-4 print:mb-4 print:pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={logo}
                    alt="The Hut"
                    className="h-16 w-auto"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      The Hut Community Centre
                    </h1>
                    <p className="mt-1 text-lg text-gray-600">
                      {getReportSubtitle()}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>
                    From:{" "}
                    {new Date(
                      filters.startDate,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    To:{" "}
                    {new Date(
                      filters.endDate,
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    Generated: {new Date().toLocaleDateString()}{" "}
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics — 6 cards */}
            <div className="mb-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6 print:mb-4">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-5 text-white shadow-lg print:bg-teal-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Unique Participants
                </div>
                <div className="text-4xl font-bold">
                  {reportData.uniqueParticipants}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg print:bg-blue-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Total Attendances
                </div>
                <div className="text-4xl font-bold">
                  {reportData.totalAttendances}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 text-white shadow-lg print:bg-purple-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Total Records
                </div>
                <div className="text-4xl font-bold">
                  {reportData.totalRecords}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-lg print:bg-green-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Attendance Rate
                </div>
                <div className="text-4xl font-bold">
                  {reportData.attendanceRate.toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg print:bg-orange-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Identifying as ATSI
                </div>
                <div className="text-4xl font-bold">
                  {reportData.atsiCount}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-5 text-white shadow-lg print:bg-pink-600 print:shadow-none">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide">
                  Identifying as CALD
                </div>
                <div className="text-4xl font-bold">
                  {reportData.caldCount}
                </div>
              </div>
            </div>

            {/* Charts Row 1: Age & Gender */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 print:mb-4 print:gap-4">
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  Age Distribution
                </h3>
                {reportData.ageDistribution.length > 0 ? (
                  renderCenteredPieChart(
                    reportData.ageDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  Gender Distribution
                </h3>
                {reportData.genderDistribution.length > 0 ? (
                  renderCenteredPieChart(
                    reportData.genderDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row 2: Council & Township */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 print:mb-4 print:gap-4">
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  Council Areas
                </h3>
                {reportData.councilDistribution.length > 0 ? (
                  renderCenteredPieChart(
                    reportData.councilDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  Townships
                </h3>
                {reportData.townshipDistribution.length > 0 ? (
                  renderCenteredPieChart(
                    reportData.townshipDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row 3: How Did You Hear & Disability */}
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 print:mb-4 print:gap-4">
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  How Participants Found The Hut
                </h3>
                {reportData.referralDistribution.length > 0 ? (
                  renderCenteredPieChart(
                    reportData.referralDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-4 print:border-gray-300 print:p-3">
                <h3 className="mb-3 pl-2 text-left text-xl font-bold text-gray-900 print:mb-2 print:text-lg">
                  Disability / Additional Requirements
                </h3>
                {reportData.disabilityDistribution.length >
                0 ? (
                  renderCenteredPieChart(
                    reportData.disabilityDistribution,
                  )
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Program Data Table */}
            <div className="mb-6 rounded-xl border border-gray-200 p-6 print:break-before-page print:border-gray-300 print:p-4">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Program Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="py-3 px-4 text-left font-semibold text-gray-900">
                        Program
                      </th>
                      <th className="py-3 px-4 text-left font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-900">
                        Sessions Held
                      </th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-900">
                        Unique Participants
                      </th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-900">
                        Attendances
                      </th>
                      <th className="py-3 px-4 text-right font-semibold text-gray-900">
                        Attendance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.programData.length > 0 ? (
                      reportData.programData.map(
                        (prog, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              {prog.program}
                            </td>
                            <td className="py-3 px-4">
                              {prog.category}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {prog.sessionsHeld}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {prog.uniqueParticipants}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {prog.attendances}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {prog.attendanceRate.toFixed(1)}%
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No program data available for the
                          selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Participants List: Active & Inactive */}
            <div className="rounded-xl border border-gray-200 p-6 print:border-gray-300 print:p-4">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Participants
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Active */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
                    <h4 className="font-semibold text-gray-800">
                      Active (
                      {reportData.activeParticipants.length})
                    </h4>
                  </div>
                  {reportData.activeParticipants.length > 0 ? (
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                      {reportData.activeParticipants.map(
                        (p, idx) => (
                          <li
                            key={idx}
                            className="px-4 py-2 text-sm text-gray-800"
                          >
                            {p.name}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No active participants
                    </p>
                  )}
                </div>

                {/* Inactive */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full bg-gray-400"></span>
                    <h4 className="font-semibold text-gray-800">
                      Inactive (
                      {reportData.inactiveParticipants.length})
                    </h4>
                  </div>
                  {reportData.inactiveParticipants.length >
                  0 ? (
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                      {reportData.inactiveParticipants.map(
                        (p, idx) => (
                          <li
                            key={idx}
                            className="px-4 py-2 text-sm text-gray-500"
                          >
                            {p.name}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No inactive participants
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}