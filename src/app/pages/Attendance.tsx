import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../components/Layout";
import {
  ClipboardCheck,
  Check,
  Calendar,
  User,
  X,
  Phone,
  Mail,
  MapPin,
  Users,
  Search,
} from "lucide-react";
import { supabase, Program } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

interface EnrolledParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  [key: string]: any;
}

// Attendance marking page — the most frequently used feature for all roles.
//
// Flow:
//   1. User picks a date.
//   2. Programs that run on that day-of-week are filtered and shown.
//   3. User selects a program to load its enrolled participants.
//   4. Each participant's checkbox defaults to "absent"; checking marks them present.
//   5. Submitting writes one attendance_record row per participant (present or absent).
//
// Staff only see programs they are assigned to; managers and admins see all programs.
export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState("");
  // Defaults to today's date in ISO format (YYYY-MM-DD) for the date input.
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  // Keyed by participant ID; true = present, absent if key is missing or false.
  const [attendance, setAttendance] = useState<
    Record<string, boolean>
  >({});
  // Snapshot of attendance as loaded from the DB — used to colour-code unchanged vs changed rows.
  const [savedAttendance, setSavedAttendance] = useState<
    Record<string, boolean>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  // Subset of programs whose scheduled day(s) match the selected date.
  const [programsForSelectedDate, setProgramsForSelectedDate] =
    useState<Program[]>([]);
  const [programParticipants, setProgramParticipants] =
    useState<EnrolledParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  // Holds the participant whose detail popup is open; null when closed.
  const [detailsParticipant, setDetailsParticipant] =
    useState<EnrolledParticipant | null>(null);
  // true when existing attendance records have been loaded for the selected program+date
  const [attendanceLoaded, setAttendanceLoaded] =
    useState(false);
  const [participantSearch, setParticipantSearch] =
    useState("");

  // Get day of week for a given date (0-6, where 0 is Sunday)
  const getDayOfWeek = (dateString: string) => {
    const selectedDate = new Date(dateString + "T00:00:00");
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[selectedDate.getDay()];
  };

  // Get today's day of week (0-6, where 0 is Sunday)
  const getTodayDayOfWeek = () => {
    const today = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[today.getDay()];
  };

  // Format today's date nicely
  const getFormattedDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-AU", options);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchProgramParticipants(selectedProgram, date);
    } else {
      setProgramParticipants([]);
      setAttendance({});
      setSavedAttendance({});
      setAttendanceLoaded(false);
      setParticipantSearch("");
    }
  }, [selectedProgram, date]);

  // Update programs list when date changes
  useEffect(() => {
    if (programs.length > 0) {
      filterProgramsByDate(date);
    }
  }, [date, programs]);

  // Filters the full program list to only those scheduled on the chosen date's
  // day of week, so staff aren't presented with irrelevant programs.
  const filterProgramsByDate = (selectedDate: string) => {
    const dayOfWeek = getDayOfWeek(selectedDate);
    const filteredPrograms = programs.filter(
      (program) =>
        program.days && program.days.includes(dayOfWeek),
    );
    setProgramsForSelectedDate(filteredPrograms);
  };

  const fetchPrograms = async () => {
    try {
      let programsData: Program[] = [];

      // For staff role, only fetch programs they are assigned to
      if (user?.role === "staff") {
        // Get the current user's ID from Supabase
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          // First, get the program IDs this staff member is assigned to
          const { data: assignments, error: assignError } =
            await supabase
              .from("program_staff")
              .select("program_id")
              .eq("user_id", authUser.id);

          if (assignError) throw assignError;

          const assignedProgramIds =
            assignments?.map((a) => a.program_id) || [];

          if (assignedProgramIds.length > 0) {
            // Fetch only the programs this staff is assigned to
            const { data, error } = await supabase
              .from("programs")
              .select("*")
              .in("id", assignedProgramIds)
              .order("name", { ascending: true });

            if (error) throw error;
            programsData = data || [];
          }
          // If no assignments, programsData remains empty
        }
      } else {
        // For manager and admin, fetch all programs
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        programsData = data || [];
      }

      setPrograms(programsData);
      // Filter programs based on the selected date
      const dayOfWeek = getDayOfWeek(date);
      const filteredPrograms = programsData.filter(
        (program) =>
          program.days && program.days.includes(dayOfWeek),
      );
      setProgramsForSelectedDate(filteredPrograms);
    } catch (err) {
      console.error("Error fetching programs:", err);
    }
  };

  const fetchProgramParticipants = async (
    programId: string,
    selectedDate: string,
  ) => {
    setLoading(true);
    setAttendanceLoaded(false);
    try {
      // Fetch only active participants enrolled in this program
      const { data, error } = await supabase
        .from("program_enrollments")
        .select(
          `
          participant_id,
          participants (
            id,
            first_name,
            last_name,
            email,
            phone,
            home_tel,
            date_of_birth,
            address_line1,
            address_line2,
            post_code,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            council_region,
            program_specific_data
          )
        `,
        )
        .eq("program_id", programId)
        .eq("is_active", true);

      if (error) throw error;

      // Transform the data to a flat structure, sorted alphabetically by first name then last name
      const participants = (
        data
          ?.map((enrollment: any) => enrollment.participants)
          .filter(Boolean) || []
      ).sort(
        (a: EnrolledParticipant, b: EnrolledParticipant) => {
          const first = a.first_name.localeCompare(
            b.first_name,
            undefined,
            { sensitivity: "base" },
          );
          return first !== 0
            ? first
            : a.last_name.localeCompare(
                b.last_name,
                undefined,
                { sensitivity: "base" },
              );
        },
      );

      setProgramParticipants(participants);

      // Fetch any existing attendance records for this program + date
      const { data: existing, error: existingError } =
        await supabase
          .from("attendance_records")
          .select("participant_id, status")
          .eq("program_id", programId)
          .eq("date", selectedDate);

      if (existingError) throw existingError;

      // Pre-populate attendance state from saved records
      const preloaded: Record<string, boolean> = {};
      for (const record of existing || []) {
        preloaded[record.participant_id] =
          record.status === "present";
      }
      setAttendance(preloaded);
      setSavedAttendance(preloaded);
      setAttendanceLoaded(true);
    } catch (err) {
      console.error(
        "Error fetching program participants:",
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  // Flips the present/absent status for a single participant without
  // resetting the rest of the attendance object.
  const handleToggleAttendance = (participantId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }));
  };

  const handleSubmit = async () => {
    try {
      // Every enrolled participant gets a record — either "present" or "absent".
      // This ensures the absence of a row cannot be confused with "not recorded".
      const attendanceRecords = programParticipants.map(
        (participant) => ({
          program_id: selectedProgram,
          participant_id: participant.id,
          date: date,
          status: attendance[participant.id]
            ? "present"
            : "absent",
        }),
      );

      if (attendanceRecords.length === 0) {
        alert("No participants to mark attendance for.");
        return;
      }

      // Upsert so re-submitting a previously saved session updates rather than errors
      const { error } = await supabase
        .from("attendance_records")
        .upsert(attendanceRecords, {
          onConflict: "program_id,participant_id,date",
        });

      if (error) throw error;

      console.log("Attendance submitted successfully");
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance. Please try again.");
    }
  };

  const selectedProgramName = programs.find(
    (p) => p.id === selectedProgram,
  )?.name;

  const programCategory =
    programs.find((p) => p.id === selectedProgram)?.category ||
    "general";

  if (showSuccess) {
    return (
      <Layout title="Mark Attendance">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-4 border-green-400 rounded-2xl p-12 md:p-16 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full mb-6">
              <Check
                size={48}
                className="text-white"
                strokeWidth={3}
              />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-green-900 mb-4">
              Success!
            </h3>
            <p className="text-xl text-green-700 font-semibold">
              Attendance has been recorded
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mark Attendance">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border-4 border-blue-200">
          <div className="flex items-center gap-4 mb-8 bg-blue-50 p-5 rounded-xl">
            <div className="p-3 bg-blue-600 rounded-lg">
              <ClipboardCheck
                size={32}
                className="text-white"
              />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Record Attendance
            </h3>
          </div>

          {/* Today's Date Display */}
          <div className="mb-8 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar size={32} className="text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold opacity-90">
                  Today's Date
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {getFormattedDate()}
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection - Moved up so it updates the programs list */}
          <div className="mb-8 bg-gray-50 p-6 rounded-xl">
            <div>
              <label
                htmlFor="date"
                className="block text-lg font-bold text-gray-700 mb-3"
              >
                Date *
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedProgram("");
                  setAttendance({});
                  setSavedAttendance({});
                  setAttendanceLoaded(false);
                }}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
              />
            </div>
          </div>

          {programsForSelectedDate.length === 0 && (
            <div className="mb-8 bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-6 text-center">
              <p className="text-xl font-bold text-yellow-900 mb-2">
                No Programs Scheduled for {getDayOfWeek(date)}
              </p>
              <p className="text-base text-yellow-700 font-semibold">
                There are no programs to mark attendance for
                this date
              </p>
            </div>
          )}

          {/* Program Selection - Programs for Selected Date */}
          {programsForSelectedDate.length > 0 && (
            <div className="mb-8 bg-gray-50 p-6 rounded-xl">
              <div>
                <label
                  htmlFor="program"
                  className="block text-lg font-bold text-gray-700 mb-3"
                >
                  Select Program *
                </label>
                <select
                  id="program"
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    // attendance state is reset inside fetchProgramParticipants
                  }}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
                >
                  <option value="">Choose a program...</option>
                  {programsForSelectedDate.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} • {program.start_time}-
                      {program.end_time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Attendance List */}
          {selectedProgram && (
            <>
              <div className="mb-6 bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedProgramName}
                </h4>
                <p className="text-lg text-gray-700 font-semibold">
                  {programParticipants.length} Participant
                  {programParticipants.length !== 1 ? "s" : ""}
                </p>
                {attendanceLoaded &&
                Object.keys(attendance).length > 0 ? (
                  <p className="text-base text-green-700 font-semibold mt-2">
                    ✓ Previously saved attendance loaded — tick
                    or untick to update
                  </p>
                ) : (
                  <p className="text-base text-gray-600 mt-2">
                    ✓ Check the box for each person who attended
                  </p>
                )}
              </div>

              {/* Search bar */}
              {programParticipants.length > 0 && (
                <div className="mb-5 relative">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) =>
                      setParticipantSearch(e.target.value)
                    }
                    placeholder="Search participants by their name..."
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {participantSearch && (
                    <button
                      onClick={() => setParticipantSearch("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {programParticipants.length === 0 ? (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-12 text-center">
                  <p className="text-xl text-gray-600 font-semibold">
                    No participants enrolled in this program
                  </p>
                </div>
              ) : (
                (() => {
                  const filteredParticipants =
                    participantSearch.trim()
                      ? programParticipants.filter((p) =>
                          `${p.first_name} ${p.last_name}`
                            .toLowerCase()
                            .includes(
                              participantSearch
                                .trim()
                                .toLowerCase(),
                            ),
                        )
                      : programParticipants;
                  return filteredParticipants.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-10 text-center mb-8">
                      <p className="text-xl text-gray-500 font-semibold">
                        No participants found matching "
                        {participantSearch}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-8">
                      {filteredParticipants.map(
                        (participant) => (
                          <div
                            key={participant.id}
                            className={`flex items-center gap-5 p-5 border-4 rounded-xl transition-all ${
                              attendance[participant.id]
                                ? savedAttendance[
                                    participant.id
                                  ]
                                  ? "border-green-700 bg-green-100" // previously saved present, still ticked
                                  : "border-green-400 bg-green-50" // newly ticked this session
                                : savedAttendance[
                                      participant.id
                                    ]
                                  ? "border-yellow-300 bg-yellow-50 hover:border-blue-400 hover:bg-blue-50" // was present, now unticked
                                  : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50" // no saved record, unticked
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                attendance[participant.id] ||
                                false
                              }
                              onChange={() =>
                                handleToggleAttendance(
                                  participant.id,
                                )
                              }
                              className="w-8 h-8 text-blue-600 rounded-lg focus:ring-4 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xl font-bold text-gray-900">
                                {participant.first_name}{" "}
                                {participant.last_name}
                              </div>
                              <div className="text-base text-gray-600 mt-1">
                                {participant.email} •{" "}
                                {participant.phone}
                              </div>
                            </div>
                            {attendance[participant.id] && (
                              <div
                                className={`px-5 py-2 text-white text-lg font-bold rounded-full shadow-lg flex-shrink-0 ${
                                  savedAttendance[
                                    participant.id
                                  ]
                                    ? "bg-green-800"
                                    : "bg-green-600"
                                }`}
                              >
                                Present ✓
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setDetailsParticipant(
                                  participant,
                                )
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-base font-semibold transition-colors flex-shrink-0"
                              title="View participant details"
                            >
                              <User size={18} />
                              Details
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  );
                })()
              )}

              {/* Summary */}
              {programParticipants.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-8 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      Attendance Summary:
                    </span>
                    <span className="text-3xl font-bold">
                      {
                        Object.values(attendance).filter(
                          Boolean,
                        ).length
                      }{" "}
                      / {programParticipants.length} Present
                    </span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={programParticipants.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 px-6 rounded-xl text-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Save Attendance
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="sm:w-auto px-8 py-5 border-4 border-gray-400 text-gray-700 rounded-xl text-xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {!selectedProgram && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-12 text-center">
              <ClipboardCheck
                size={64}
                className="text-gray-400 mx-auto mb-6"
              />
              <p className="text-xl text-gray-600 font-semibold">
                Please select a program above to begin
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Participant Details Popup */}
      {detailsParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border-4 border-blue-300 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center gap-4">
              <div className="bg-white p-3 rounded-full flex-shrink-0">
                <User size={32} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-white">
                  {detailsParticipant.first_name}{" "}
                  {detailsParticipant.last_name}
                </p>
                {detailsParticipant.date_of_birth && (
                  <p className="text-blue-200 text-sm mt-0.5">
                    DOB:{" "}
                    {new Date(
                      detailsParticipant.date_of_birth,
                    ).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDetailsParticipant(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Contact */}
              <div>
                <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
                  Contact
                </h4>
                <div className="space-y-2">
                  {detailsParticipant.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="text-base">
                        {detailsParticipant.email}
                      </span>
                    </div>
                  )}
                  {detailsParticipant.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="text-base">
                        {detailsParticipant.phone}
                      </span>
                    </div>
                  )}
                  {detailsParticipant.home_tel && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="text-base">
                        {detailsParticipant.home_tel} (home)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {detailsParticipant.address_line1 && (
                <div>
                  <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
                    Address
                  </h4>
                  <div className="flex items-start gap-3 text-gray-700">
                    <MapPin
                      size={16}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-base">
                      {detailsParticipant.address_line1}
                      {detailsParticipant.address_line2 &&
                        `, ${detailsParticipant.address_line2}`}
                      {detailsParticipant.post_code &&
                        `, ${detailsParticipant.post_code}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {detailsParticipant.emergency_contact_name && (
                <div>
                  <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-2">
                    Emergency Contact
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users
                        size={16}
                        className="text-blue-500 flex-shrink-0"
                      />
                      <span className="text-base">
                        {
                          detailsParticipant.emergency_contact_name
                        }
                        {detailsParticipant.emergency_contact_relationship && (
                          <span className="text-gray-500 text-sm ml-2">
                            (
                            {
                              detailsParticipant.emergency_contact_relationship
                            }
                            )
                          </span>
                        )}
                      </span>
                    </div>
                    {detailsParticipant.emergency_contact_phone && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone
                          size={16}
                          className="text-blue-500 flex-shrink-0"
                        />
                        <span className="text-base">
                          {
                            detailsParticipant.emergency_contact_phone
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Program-specific details */}
            {(() => {
              let specificData: any = {};
              try {
                const raw =
                  detailsParticipant.program_specific_data;
                specificData =
                  typeof raw === "string"
                    ? JSON.parse(raw)
                    : raw || {};
              } catch {
                specificData = {};
              }

              if (
                programCategory === "fitness" &&
                specificData.fitness
              ) {
                const f = specificData.fitness;
                const conditions: string[] =
                  f.healthConditions || [];
                const noneSelected =
                  conditions.includes("None");
                return (
                  <div className="px-6 pb-2">
                    <h4 className="text-sm font-bold text-orange-700 uppercase tracking-wide mb-3">
                      Fitness & Wellbeing — Health Info
                    </h4>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          Medical Conditions
                        </p>
                        {noneSelected ? (
                          <p className="text-base text-gray-800">
                            None
                          </p>
                        ) : conditions.length > 0 ? (
                          <ul className="list-disc list-inside space-y-0.5">
                            {conditions.map((c: string) => (
                              <li
                                key={c}
                                className="text-base text-gray-800"
                              >
                                {c}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-base text-gray-400 italic">
                            Not recorded
                          </p>
                        )}
                        {f.otherConditionDetails && (
                          <p className="text-sm text-gray-600 mt-1 ml-4">
                            Details: {f.otherConditionDetails}
                          </p>
                        )}
                      </div>
                      {!noneSelected && f.takingMedications && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Taking Medications
                          </p>
                          <p className="text-base text-gray-800">
                            {f.takingMedications}
                          </p>
                          {f.medicationEffects && (
                            <p className="text-sm text-gray-600 mt-1">
                              {f.medicationEffects}
                            </p>
                          )}
                        </div>
                      )}
                      {f.regularExercise && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Regular Exercise
                          </p>
                          <p className="text-base text-gray-800">
                            {f.regularExercise}
                          </p>
                        </div>
                      )}
                      {f.healthDeclarationSigned && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Health Declaration Signed
                          </p>
                          <p className="text-base text-gray-800">
                            Yes
                            {f.healthDeclarationDate
                              ? ` — ${new Date(f.healthDeclarationDate).toLocaleDateString("en-AU")}`
                              : ""}
                          </p>
                        </div>
                      )}
                      {f.medicalFormReceived && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Medical Form Received
                          </p>
                          <p className="text-base text-gray-800">
                            {f.medicalFormReceived}
                          </p>
                        </div>
                      )}
                      {f.freeFormNotes && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Notes
                          </p>
                          <p className="text-base text-gray-800">
                            {f.freeFormNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (
                programCategory === "children" &&
                specificData.children
              ) {
                const c = specificData.children;
                const children: any[] = Array.isArray(c)
                  ? c
                  : [c];
                return (
                  <div className="px-6 pb-2">
                    <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-3">
                      Children's Program — Child Info
                    </h4>
                    {children.map((child: any, i: number) => (
                      <div
                        key={i}
                        className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-3 space-y-2"
                      >
                        {children.length > 1 && (
                          <p className="text-sm font-bold text-purple-700">
                            Child {i + 1}
                          </p>
                        )}
                        {(child.childGivenName ||
                          child.childFamilyName) && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                              Child Name
                            </p>
                            <p className="text-base text-gray-800">
                              {child.childGivenName}{" "}
                              {child.childFamilyName}
                            </p>
                          </div>
                        )}
                        {child.childGender && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                              Gender
                            </p>
                            <p className="text-base text-gray-800">
                              {child.childGender}
                            </p>
                          </div>
                        )}
                        {child.childDOB && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                              Date of Birth
                            </p>
                            <p className="text-base text-gray-800">
                              {new Date(
                                child.childDOB,
                              ).toLocaleDateString("en-AU")}
                            </p>
                          </div>
                        )}
                        {child.schoolAttending && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                              School
                            </p>
                            <p className="text-base text-gray-800">
                              {child.schoolAttending}
                              {child.yearLevel
                                ? `, Year ${child.yearLevel}`
                                : ""}
                            </p>
                          </div>
                        )}
                        {child.authorisedPerson1Name && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600 mb-0.5">
                              Authorised to Collect
                            </p>
                            <p className="text-base text-gray-800">
                              {child.authorisedPerson1Name}
                              {child.authorisedPerson1Phone
                                ? ` — ${child.authorisedPerson1Phone}`
                                : ""}
                            </p>
                            {child.authorisedPerson2Name && (
                              <p className="text-base text-gray-800">
                                {child.authorisedPerson2Name}
                                {child.authorisedPerson2Phone
                                  ? ` — ${child.authorisedPerson2Phone}`
                                  : ""}
                              </p>
                            )}
                          </div>
                        )}
                        {child.custodyIssues &&
                          child.custodyIssues !== "No" && (
                            <div>
                              <p className="text-sm font-semibold text-red-600 mb-0.5">
                                ⚠ Custody Issues
                              </p>
                              <p className="text-base text-gray-800">
                                {child.custodyIssuesDetails ||
                                  child.custodyIssues}
                              </p>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                );
              }

              return null;
            })()}

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setDetailsParticipant(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-lg rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}