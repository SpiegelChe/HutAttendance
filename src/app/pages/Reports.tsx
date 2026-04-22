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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { ADELAIDE_HILLS_TOWNSHIPS } from "../utils/constants";
import logo from "figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png";

type TimePeriod =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually"
  | "custom";

// Program category mapping (based on program names and descriptions)
const PROGRAM_CATEGORIES = [
  "Healthy Living",
  "Interest & Social",
  "Low Income Support",
  "Young People",
  "Sustainability",
] as const;

// Map programs to categories
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
  return "Interest & Social"; // Default category
};

// Age groups
const AGE_GROUPS = [
  "under 18",
  "18-24",
  "25-44",
  "45-64",
  "65+",
] as const;

// Gender options
const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;

// ATSI status
const ATSI_STATUS = ["Yes", "No"] as const;

// CALD background
const CALD_BACKGROUND = ["Yes", "No"] as const;

// Councils
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

interface ReportData {
  uniqueParticipants: number;
  totalAttendances: number;
  totalRecords: number;
  attendanceRate: number;
  ageDistribution: { name: string; value: number }[];
  genderDistribution: { name: string; value: number }[];
  programData: {
    program: string;
    category: string;
    uniqueParticipants: number;
    attendances: number;
    attendanceRate: number;
  }[];
}

export default function Reports() {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  const [timePeriod, setTimePeriod] =
    useState<TimePeriod>("monthly");
  const [showPreview, setShowPreview] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Calculate default dates based on monthly period
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
  const [loading, setLoading] = useState(true);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Track which filter values actually exist in the database
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

  // Close export menu when clicking outside
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

  // Update start date when time period changes
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
      // Fetch programs
      const { data: programsData, error: programsError } =
        await supabase
          .from("programs")
          .select("*")
          .order("name", { ascending: true });

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Fetch participants
      const {
        data: participantsData,
        error: participantsError,
      } = await supabase.from("participants").select("*");

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Fetch attendance records
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

      // Determine available values
      const cats = new Set<string>();
      const progs = new Set<string>();
      const ages = new Set<string>();
      const gens = new Set<string>();
      const atsi = new Set<string>();
      const cald = new Set<string>();
      const couns = new Set<string>();
      const towns = new Set<string>();

      // Available program categories and programs
      (programsData || []).forEach((prog) => {
        const cat = getProgramCategory(prog.name);
        cats.add(cat);
        progs.add(prog.name);
      });

      // Available participant attributes
      (participantsData || []).forEach((p) => {
        // Age group
        const age = calculateAge(p.date_of_birth);
        ages.add(getAgeGroup(age));

        // Gender
        if (p.gender) gens.add(p.gender);

        // ATSI status
        if (p.identify_aboriginal_tsi)
          atsi.add(p.identify_aboriginal_tsi);

        // CALD background (based on country of birth or language)
        const isCald =
          (p.country_of_birth &&
            p.country_of_birth !== "Australia") ||
          p.speak_other_language === "Yes";
        cald.add(isCald ? "Yes" : "No");

        // Council
        const council =
          p.council_region === "Adelaide Hills Council"
            ? "Adelaide Hills Council"
            : "Other Council";
        couns.add(council);

        // Township
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

  // Generate report data
  const reportData = useMemo<ReportData>(() => {
    // Filter participants based on criteria
    const filteredParticipants = participants.filter((p) => {
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
    });

    const participantIds = new Set(
      filteredParticipants.map((p) => p.id),
    );

    // Filter programs
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

    // Filter attendance records
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

    // Calculate statistics
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

    // Age distribution
    const ageDistMap = new Map<string, number>();
    filteredParticipants.forEach((p) => {
      const age = calculateAge(p.date_of_birth);
      const group = getAgeGroup(age);
      ageDistMap.set(group, (ageDistMap.get(group) || 0) + 1);
    });
    const ageDistribution = Array.from(
      ageDistMap.entries(),
    ).map(([name, value]) => ({ name, value }));

    // Gender distribution
    const genderDistMap = new Map<string, number>();
    filteredParticipants.forEach((p) => {
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

    // Program data
    const programDataMap = new Map<
      string,
      {
        category: string;
        participantIds: Set<string>;
        attendances: number;
        totalRecords: number;
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
      };

      existing.participantIds.add(record.participant_id);
      if (record.status === "present") existing.attendances++;
      existing.totalRecords++;

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
    }));

    return {
      uniqueParticipants,
      totalAttendances,
      totalRecords,
      attendanceRate,
      ageDistribution,
      genderDistribution,
      programData,
    };
  }, [participants, programs, attendanceRecords, filters]);

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
      // Export CSV
      const csvData = [
        [
          "Program",
          "Category",
          "Unique Participants",
          "Attendances",
          "Attendance Rate",
        ],
        ...reportData.programData.map((p) => [
          p.program,
          p.category,
          p.uniqueParticipants.toString(),
          p.attendances.toString(),
          `${p.attendanceRate.toFixed(1)}%`,
        ]),
      ];

      const csvContent = csvData
        .map((row) => row.join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${filters.startDate}-to-${filters.endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
  ];

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
                    Export as CSV
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
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            {/* Report Header */}
            <div className="mb-8 border-b-2 border-gray-200 pb-6">
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
                    <p className="text-lg text-gray-600 mt-1">
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

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl p-6 shadow-lg">
                <div className="text-sm font-semibold mb-2">
                  Unique Participants
                </div>
                <div className="text-4xl font-bold">
                  {reportData.uniqueParticipants}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                <div className="text-sm font-semibold mb-2">
                  Total Attendances
                </div>
                <div className="text-4xl font-bold">
                  {reportData.totalAttendances}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                <div className="text-sm font-semibold mb-2">
                  Total Records
                </div>
                <div className="text-4xl font-bold">
                  {reportData.totalRecords}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                <div className="text-sm font-semibold mb-2">
                  Attendance Rate
                </div>
                <div className="text-4xl font-bold">
                  {reportData.attendanceRate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Age Distribution */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Age Distribution
                </h3>
                {reportData.ageDistribution.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <PieChart>
                      <Pie
                        data={reportData.ageDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.ageDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS[index % COLORS.length]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>

              {/* Gender Distribution */}
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Gender Distribution
                </h3>
                {reportData.genderDistribution.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                  >
                    <PieChart>
                      <Pie
                        data={reportData.genderDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.genderDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS[index % COLORS.length]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Program Data Table */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Program Details
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Program
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Category
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">
                        Unique Participants
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">
                        Attendances
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">
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
                            <td className="text-right py-3 px-4">
                              {prog.uniqueParticipants}
                            </td>
                            <td className="text-right py-3 px-4">
                              {prog.attendances}
                            </td>
                            <td className="text-right py-3 px-4">
                              {prog.attendanceRate.toFixed(1)}%
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
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
          </div>
        )}
      </div>
    </Layout>
  );
}