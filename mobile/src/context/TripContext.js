import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { createTripApi, deleteTripApi, getTripsApi, updateTripApi } from '../api/tripApi';

const TripContext = createContext(null);

export const TripProvider = ({ children }) => {
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const response = await getTripsApi();
      setTrips(response?.data?.trips || []);
      return response?.data?.trips || [];
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  const createTrip = useCallback(async (payload) => {
    const response = await createTripApi(payload);
    await fetchTrips();
    return response?.data?.trip;
  }, [fetchTrips]);

  const updateTrip = useCallback(async (id, payload) => {
    const response = await updateTripApi(id, payload);
    await fetchTrips();
    return response?.data?.trip;
  }, [fetchTrips]);

  const deleteTrip = useCallback(async (id) => {
    await deleteTripApi(id);
    await fetchTrips();
  }, [fetchTrips]);

  const value = useMemo(() => ({
    trips,
    loadingTrips,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip
  }), [trips, loadingTrips, fetchTrips, createTrip, updateTrip, deleteTrip]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) {
    throw new Error('useTrip must be used inside TripProvider');
  }
  return ctx;
};
