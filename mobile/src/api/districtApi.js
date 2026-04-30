import client from './client';

export const getDistrictsApi = async () => {
  const res = await client.get('/districts');
  return res.data;
};

export const getDistrictApi = async (id) => {
  const res = await client.get(`/districts/${id}`);
  return res.data;
};

export const createDistrictApi = async (payload) => {
  const res = await client.post('/districts', payload);
  return res.data;
};

export const updateDistrictApi = async (id, payload) => {
  const res = await client.put(`/districts/${id}`, payload);
  return res.data;
};

export const deleteDistrictApi = async (id) => {
  const res = await client.delete(`/districts/${id}`);
  return res.data;
};

export const uploadDistrictImageApi = async (localUri) => {
  const filename = localUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('image', { uri: localUri, name: filename, type });

  const res = await client.post('/districts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
