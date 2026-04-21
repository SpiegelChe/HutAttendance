import { Layout } from '../components/Layout';
import { useState } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  spotsAvailable: number;
  description: string;
  registered: boolean;
}

export default function ParticipantEvents() {
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Yoga for Beginners',
      date: '2026-03-20',
      time: '9:00 AM - 10:00 AM',
      location: 'Main Hall',
      spots: 20,
      spotsAvailable: 12,
      description: 'A gentle yoga class suitable for all fitness levels',
      registered: false,
    },
    {
      id: '2',
      name: 'Art Workshop',
      date: '2026-03-22',
      time: '2:00 PM - 4:00 PM',
      location: 'Art Studio',
      spots: 15,
      spotsAvailable: 8,
      description: 'Learn watercolor painting techniques',
      registered: true,
    },
    {
      id: '3',
      name: 'Cooking Class',
      date: '2026-03-25',
      time: '5:00 PM - 7:00 PM',
      location: 'Community Kitchen',
      spots: 12,
      spotsAvailable: 5,
      description: 'Healthy meal preparation and cooking tips',
      registered: false,
    },
    {
      id: '4',
      name: 'Dance Fitness',
      date: '2026-03-27',
      time: '6:00 PM - 7:00 PM',
      location: 'Dance Studio',
      spots: 25,
      spotsAvailable: 18,
      description: 'Fun cardio workout with dance moves',
      registered: false,
    },
    {
      id: '5',
      name: 'Book Club Meeting',
      date: '2026-03-28',
      time: '3:00 PM - 4:30 PM',
      location: 'Library Room',
      spots: 15,
      spotsAvailable: 10,
      description: 'Monthly book discussion and social gathering',
      registered: true,
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'available' | 'registered'>('all');

  const handleRegister = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, registered: !event.registered, spotsAvailable: event.registered ? event.spotsAvailable + 1 : event.spotsAvailable - 1 }
        : event
    ));
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'registered') return event.registered;
    if (filter === 'available') return !event.registered && event.spotsAvailable > 0;
    return true;
  });

  return (
    <Layout title="Register for Events">
      <div className="max-w-6xl mx-auto">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all ${
              filter === 'available'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Available to Register
          </button>
          <button
            onClick={() => setFilter('registered')}
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all ${
              filter === 'registered'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            My Registrations
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all"
            >
              {/* Event Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{event.name}</h3>
                {event.registered && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span className="text-sm font-semibold">Registered</span>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={20} className="text-blue-600" />
                  <span className="text-lg">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={20} className="text-green-600" />
                  <span className="text-lg">{event.time}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={20} className="text-orange-600" />
                  <span className="text-lg">{event.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users size={20} className="text-purple-600" />
                  <span className="text-lg">
                    {event.spotsAvailable} of {event.spots} spots available
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-base mb-6">{event.description}</p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      event.spotsAvailable < 5 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${((event.spots - event.spotsAvailable) / event.spots) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRegister(event.id)}
                disabled={event.spotsAvailable === 0 && !event.registered}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                  event.registered
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : event.spotsAvailable === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {event.registered
                  ? 'Cancel Registration'
                  : event.spotsAvailable === 0
                  ? 'Event Full'
                  : 'Register Now'}
              </button>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-500">No events found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
