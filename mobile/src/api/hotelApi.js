import client from './client';

export const getHotelsApi = async (params = {}) => {
  const res = await client.get('/hotels', { params });
  return res.data;
};

export const getHotelApi = async (id) => {
  const res = await client.get(`/hotels/${id}`);
  return res.data;
};

export const createHotelApi = async (payload) => {
  const res = await client.post('/hotels', payload);
  return res.data;
};

export const updateHotelApi = async (id, payload) => {
  const res = await client.put(`/hotels/${id}`, payload);
  return res.data;
};

export const deleteHotelApi = async (id) => {
  const res = await client.delete(`/hotels/${id}`);
  return res.data;
};

export const uploadHotelImageApi = async (localUri) => {
  const filename = localUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('image', { uri: localUri, name: filename, type });

  const res = await client.post('/hotels/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
