import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TripPlannerContext = createContext(null);

const initialPreferences = {
  tripType: 'couple',
  hotelType: 'any',
  nights: 3,
  travelers: 2,
  startDate: null,
};

const getPlaceKey = (p) => String(p?._id || p?.place_id || p?.id || '');

export const TripPlannerProvider = ({ children }) => {
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotels, setSelectedHotels] = useState([]);

  const getHotelKey = (h) => String(h?._id || h?.id || '');

  const addOrUpdateSelectedHotel = useCallback((hotel, nightsInfo) => {
    const key = getHotelKey(hotel);
    if (!key) return;
    setSelectedHotels((prev) => {
      const exists = prev.find((h) => getHotelKey(h) === key);
      const nights = Math.max(1, Number(nightsInfo?.nights) || 1);
      const checkIn = nightsInfo?.checkIn || null;
      const checkOut = nightsInfo?.checkOut || null;
      const next = exists
        ? prev.map((h) => (getHotelKey(h) === key ? { ...h, ...hotel, nights, checkIn, checkOut } : h))
        : [...prev, { ...hotel, nights, checkIn, checkOut }];
      setSelectedHotel(next[0] || null);
      return next;
    });
  }, []);

  const removeSelectedHotel = useCallback((hotelId) => {
    const key = String(hotelId || '');
    setSelectedHotels((prev) => {
      const next = prev.filter((h) => getHotelKey(h) !== key);
      setSelectedHotel(next[0] || null);
      return next;
    });
  }, []);

  const clearSelectedHotels = useCallback(() => {
    setSelectedHotels([]);
    setSelectedHotel(null);
  }, []);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [hotelBudget, setHotelBudget] = useState('');
  const [notes, setNotes] = useState('');

  const togglePlace = useCallback((place) => {
    const key = getPlaceKey(place);
    setSelectedPlaces((prev) => {
      const exists = prev.some((p) => getPlaceKey(p) === key);
      if (exists) return prev.filter((p) => getPlaceKey(p) !== key);
      return [...prev, place];
    });
  }, []);

  const isPlaceSelected = useCallback(
    (place) => {
      const key = getPlaceKey(place);
      return selectedPlaces.some((p) => getPlaceKey(p) === key);
    },
    [selectedPlaces]
  );

  const updatePreferences = useCallback((patch) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const startNewTrip = useCallback(() => {
    setIsPlanning(true);
    setEditingTrip(null);
    setSelectedDistrict(null);
    setSelectedPlaces([]);
    setPreferences(initialPreferences);
    setSelectedHotel(null);
    setSelectedHotels([]);
    setTripName('');
    setTotalBudget('');
    setHotelBudget('');
    setNotes('');
  }, []);

  const startEditTrip = useCallback((trip) => {
    if (!trip) return;
    setIsPlanning(true);
    setEditingTrip(trip);
    setSelectedDistrict({
      district_id: trip.districtId,
      name: trip.districtName || trip.destination,
      province: trip.province,
    });
    setSelectedPlaces(Array.isArray(trip.selectedPlaces) ? trip.selectedPlaces : []);
    setPreferences({
      tripType: trip.tripType || 'couple',
      hotelType: trip.hotelType || 'any',
      nights: Number(trip.nights || 3),
      travelers: Number(trip.travelers || 2),
      startDate: trip.startDate ? String(trip.startDate).slice(0, 10) : null,
    });
    setSelectedHotel(trip.selectedHotel || null);
    setSelectedHotels(Array.isArray(trip.selectedHotels) ? trip.selectedHotels : (trip.selectedHotel ? [trip.selectedHotel] : []));
    setTripName(trip.title || '');
    setTotalBudget(trip.budget ? String(trip.budget) : '');
    setHotelBudget(trip.budgetBreakdown?.hotel ? String(trip.budgetBreakdown.hotel) : '');
    setNotes(trip.notes || '');
  }, []);

  const finishPlanning = useCallback(() => {
    setIsPlanning(false);
  }, []);

  const cancelPlanning = useCallback(() => {
    setIsPlanning(false);
    setEditingTrip(null);
  }, []);

  const value = useMemo(
    () => ({
      isPlanning,
      editingTrip,
      selectedDistrict,
      setSelectedDistrict,
      selectedPlaces,
      setSelectedPlaces,
      togglePlace,
      isPlaceSelected,
      preferences,
      setPreferences,
      updatePreferences,
      selectedHotel,
      setSelectedHotel,
      selectedHotels,
      setSelectedHotels,
      addOrUpdateSelectedHotel,
      removeSelectedHotel,
      clearSelectedHotels,
      tripName,
      setTripName,
      totalBudget,
      setTotalBudget,
      hotelBudget,
      setHotelBudget,
      notes,
      setNotes,
      startNewTrip,
      startEditTrip,
      finishPlanning,
      cancelPlanning,
    }),
    [
      isPlanning,
      editingTrip,
      selectedDistrict,
      selectedPlaces,
      togglePlace,
      isPlaceSelected,
      preferences,
      updatePreferences,
      selectedHotel,
      selectedHotels,
      addOrUpdateSelectedHotel,
      removeSelectedHotel,
      clearSelectedHotels,
      tripName,
      totalBudget,
      hotelBudget,
      notes,
      startNewTrip,
      startEditTrip,
      finishPlanning,
      cancelPlanning,
    ]
  );

  return <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>;
};

export const useTripPlanner = () => useContext(TripPlannerContext);
