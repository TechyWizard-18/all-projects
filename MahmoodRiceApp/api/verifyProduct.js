const API_URL = 'https://attstaging.att-fr.com/MahmoodRice';
const SECRET = '50a3e13a-c19c-49f0-9af2-104aea9d436a';

/**
 * Verify product by sending the captured image as multipart/form-data.
 * The API reads both QR and SEALVector (SV) from the full product label image.
 *
 * Step 1 (first attempt):  Send only Image  — API extracts QR + SV itself.
 * Step 2 (retry on Code 4): Send Image + Qr (value returned by API in step 1).
 *
 * @param {string} imageUri - Local file URI of the captured photo
 * @param {string|null} qrValue - QR string returned by API on a previous TryAgainSv (Code 4)
 * @returns {Promise<{Message: string, Code: number, Qr?: string}>}
 */
export async function verifyProduct(imageUri, qrValue = null) {
  const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Build multipart/form-data
  const formData = new FormData();

  // Append the image file
  formData.append('Image', {
    uri: imageUri,
    name: 'product.jpg',
    type: 'image/jpeg',
  });

  // Only include Qr on retry (when Code 4 was returned before)
  if (qrValue) {
    formData.append('Qr', qrValue);
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      // Let fetch set Content-Type with boundary automatically for multipart
      'Secret': SECRET,
      'X-Correlation-ID': correlationId,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Server error ${response.status}: ${text || 'Unknown error'}`);
  }

  const data = await response.json();
  return data;
}
