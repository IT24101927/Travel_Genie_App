const plannerParams = { plannerMode: true };

const getTabNavigation = (navigation) => navigation.getParent?.() || navigation;

export const navigateToPlannerDistrictPicker = (navigation) => {
  getTabNavigation(navigation).navigate('Places', {
    screen: 'DistrictList',
    params: {
      ...plannerParams,
      nextScreen: 'PlaceList',
    },
  });
};

export const navigateToPlannerPlacePicker = (navigation, district = null) => {
  getTabNavigation(navigation).navigate('Places', {
    screen: 'PlaceList',
    params: {
      ...plannerParams,
      districtId: district?.district_id,
      districtName: district?.name,
    },
  });
};

export const navigateToPlannerPreferences = (navigation) => {
  getTabNavigation(navigation).navigate('Trips', {
    screen: 'PlannerPreferences',
    params: plannerParams,
  });
};

export const navigateToPlannerHotelPicker = (navigation) => {
  getTabNavigation(navigation).navigate('Hotels', {
    screen: 'HotelList',
    params: plannerParams,
  });
};

export const navigateToPlannerBudget = (navigation) => {
  getTabNavigation(navigation).navigate('Trips', {
    screen: 'PlannerBudget',
    params: plannerParams,
  });
};

export const navigateToPlannerSummary = (navigation) => {
  getTabNavigation(navigation).navigate('Trips', {
    screen: 'TripPlanner',
    params: plannerParams,
  });
};

export const navigateToTripList = (navigation) => {
  getTabNavigation(navigation).navigate('Trips', {
    screen: 'TripList',
  });
};
