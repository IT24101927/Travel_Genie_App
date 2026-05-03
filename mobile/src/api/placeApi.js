import client from './client';

export const getPlacesApi = async (params = {}) => {
  const res = await client.get('/places', { params });
  return res.data;
};

export const getPlaceApi = async (id) => {
  const res = await client.get(`/places/${id}`);
  return res.data;
};

export const createPlaceApi = async (payload) => {
  const res = await client.post('/places', payload);
  return res.data;
};

export const updatePlaceApi = async (id, payload) => {
  const res = await client.put(`/places/${id}`, payload);
  return res.data;
};

export const deletePlaceApi = async (id) => {
  const res = await client.delete(`/places/${id}`);
  return res.data;
};

export const uploadPlaceImageApi = async (localUri) => {
  const filename = localUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('image', { uri: localUri, name: filename, type });

  const res = await client.post('/places/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
