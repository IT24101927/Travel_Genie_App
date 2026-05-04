import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const TripPlannerContext = createContext(null);

const initialPreferences = {
  tripType: 'couple',
  hotelType: 'any',
  nights: 3,
  travelers: 2,
  startDate: null,
};

const getPlaceKey = (p) => String(p?._id || p?.place_id || p?.id || '');
const getHotelKey = (h) => String(h?._id || h?.id || '');

const STORAGE_KEY_PREFIX = 'TRIP_PLANNER_DRAFT_';

const getInitialPlannerState = () => ({
  isPlanning: false,
  editingTrip: null,
  selectedDistrict: null,
  selectedPlaces: [],
  preferences: initialPreferences,
  selectedHotel: null,
  selectedHotels: [],
  tripName: '',
  totalBudget: '',
  hotelBudget: '',
  tripDays: '',
  notes: '',
});

export const TripPlannerProvider = ({ children }) => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  const [isPlanning, setIsPlanning] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [hotelBudget, setHotelBudget] = useState('');
  const [tripDays, setTripDays] = useState('');
  const [notes, setNotes] = useState('');

  const userKey = user?._id || user?.id || 'guest';
  const storageKey = `${STORAGE_KEY_PREFIX}${userKey}`;

  // 1. Persistence - Restore
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const json = await AsyncStorage.getItem(storageKey);
        if (json) {
          const draft = JSON.parse(json);
          if (!draft?.isPlanning) {
            await AsyncStorage.removeItem(storageKey);
            return;
          }
          setIsPlanning(false);
          setEditingTrip(draft.editingTrip || null);
          setSelectedDistrict(draft.selectedDistrict || null);
          setSelectedPlaces(draft.selectedPlaces || []);
          setPreferences(draft.preferences || initialPreferences);
          setSelectedHotel(draft.selectedHotel || null);
          setSelectedHotels(draft.selectedHotels || []);
          setTripName(draft.tripName || '');
          setTotalBudget(draft.totalBudget || '');
          setHotelBudget(draft.hotelBudget || '');
          setTripDays(draft.tripDays || '');
          setNotes(draft.notes || '');
        }
      } catch (e) {
        console.error('Failed to restore trip draft', e);
      } finally {
        setIsReady(true);
      }
    };
    restoreDraft();
  }, [storageKey]);

  // 2. Persistence - Save
  useEffect(() => {
    if (!isReady) return;
    const saveDraft = async () => {
      try {
        if (!isPlanning) {
          await AsyncStorage.removeItem(storageKey);
          return;
        }

        const draft = {
          isPlanning,
          editingTrip,
          selectedDistrict,
          selectedPlaces,
          preferences,
          selectedHotel,
          selectedHotels,
          tripName,
          totalBudget,
          hotelBudget,
          tripDays,
          notes,
        };
        await AsyncStorage.setItem(storageKey, JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to save trip draft', e);
      }
    };
    saveDraft();
  }, [
    isReady, storageKey, isPlanning, editingTrip, selectedDistrict, selectedPlaces, 
    preferences, selectedHotel, selectedHotels, tripName, totalBudget, hotelBudget, tripDays, notes
  ]);

  const applyPlannerState = useCallback((next) => {
    setIsPlanning(next.isPlanning);
    setEditingTrip(next.editingTrip);
    setSelectedDistrict(next.selectedDistrict);
    setSelectedPlaces(next.selectedPlaces);
    setPreferences(next.preferences);
    setSelectedHotel(next.selectedHotel);
    setSelectedHotels(next.selectedHotels);
    setTripName(next.tripName);
    setTotalBudget(next.totalBudget);
    setHotelBudget(next.hotelBudget);
    setTripDays(next.tripDays);
    setNotes(next.notes);
  }, []);

  const resetPlannerState = useCallback((planning = false) => {
    applyPlannerState({
      ...getInitialPlannerState(),
      isPlanning: planning,
    });
  }, [applyPlannerState]);

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
    resetPlannerState(true);
  }, [resetPlannerState]);

  const resumePlanning = useCallback(() => {
    setIsPlanning(true);
  }, []);

  const startEditTrip = useCallback((trip) => {
    if (!trip) return;
    applyPlannerState({
      isPlanning: true,
      editingTrip: trip,
      selectedDistrict: {
        district_id: trip.districtId,
        name: trip.districtName || trip.destination,
        province: trip.province,
      },
      selectedPlaces: Array.isArray(trip.selectedPlaces) ? trip.selectedPlaces : [],
      preferences: {
        tripType: trip.tripType || 'couple',
        hotelType: trip.hotelType || 'any',
        nights: Number(trip.nights || 3),
        travelers: Number(trip.travelers || 2),
        startDate: trip.startDate ? String(trip.startDate).slice(0, 10) : null,
      },
      selectedHotel: trip.selectedHotel || null,
      selectedHotels: Array.isArray(trip.selectedHotels) ? trip.selectedHotels : (trip.selectedHotel ? [trip.selectedHotel] : []),
      tripName: trip.title || '',
      totalBudget: trip.budget ? String(trip.budget) : '',
      hotelBudget: trip.budgetBreakdown?.hotel ? String(trip.budgetBreakdown.hotel) : '',
      notes: trip.notes || '',
    });
  }, [applyPlannerState]);

  const finishPlanning = useCallback(async () => {
    resetPlannerState(false);
  }, [resetPlannerState]);

  const cancelPlanning = useCallback(() => {
    resetPlannerState(false);
  }, [resetPlannerState]);

  const value = useMemo(
    () => ({
      isReady,
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
      tripDays,
      setTripDays,
      startNewTrip,
      startEditTrip,
      resumePlanning,
      hasDraft: !!selectedDistrict || selectedPlaces.length > 0,
      finishPlanning,
      cancelPlanning,
    }),
    [
      isReady,
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
      tripDays,
      startNewTrip,
      startEditTrip,
      resumePlanning,
      finishPlanning,
      cancelPlanning,
    ]
  );

  return <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>;
};

export const useTripPlanner = () => useContext(TripPlannerContext);
