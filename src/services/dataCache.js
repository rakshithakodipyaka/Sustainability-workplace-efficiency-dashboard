import { api } from './api';

const EMPTY = {
  users: [],
  organization: {},
  officeAttendance: [],
  meetings: [],
  engagement: [],
  learning: { courses: [], enrollments: [], weeklyLearningTarget: 3 },
  hybridWork: [],
  kpiWeights: {},
  recommendationStatuses: {}
};

let cache = null;

export const isHydrated = () => cache !== null;

export const getData = () => cache;

export const hydrate = async () => {
  const payload = await api.get('/datasets');
  cache = { ...EMPTY, ...payload };
  return cache;
};

export const clear = () => {
  cache = null;
};

export const setRecommendationStatus = (recId, status) => {
  if (!cache) return;
  cache.recommendationStatuses = { ...cache.recommendationStatuses, [recId]: status };
};
