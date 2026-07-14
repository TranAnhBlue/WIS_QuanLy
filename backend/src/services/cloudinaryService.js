import crypto from 'crypto';

function configuration() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary chưa được cấu hình đầy đủ trong backend/.env');
  return { cloudName, apiKey, apiSecret };
}

function signature(params, secret) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return crypto.createHash('sha1').update(`${serialized}${secret}`).digest('hex');
}

export async function uploadToCloudinary(file, { folder, resourceType = 'auto' }) {
  if (!file?.buffer) throw new Error('Không tìm thấy dữ liệu file để tải lên');
  const { cloudName, apiKey, apiSecret } = configuration();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { folder, timestamp };
  const body = new FormData();
  body.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  body.append('api_key', apiKey);
  body.append('timestamp', String(timestamp));
  body.append('folder', folder);
  body.append('signature', signature(signedParams, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: 'POST', body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Không thể tải file lên Cloudinary');
  return result;
}

export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId) return;
  const { cloudName, apiKey, apiSecret } = configuration();
  const timestamp = Math.floor(Date.now() / 1000);
  const signedParams = { public_id: publicId, timestamp };
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature: signature(signedParams, apiSecret),
  });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Không thể xóa file trên Cloudinary');
  return result;
}
