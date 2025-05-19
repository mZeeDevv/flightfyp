// Cloudinary configuration using environment variables
const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDNAME || 'dfnuhhkcc',
  uploadPreset: 'flight_app', // You may want to create a specific upload preset in your Cloudinary dashboard
  apiKey: import.meta.env.VITE_API_KEY_C || '116359777297378',
};

/**
 * Upload a file to Cloudinary
 * @param {File} file - The file to upload
 * @param {Object} options - Optional configuration parameters
 * @param {string} options.folder - Folder to upload to in Cloudinary
 * @param {string} options.resourceType - Resource type (image, video, raw, auto)
 * @param {Function} options.onProgress - Progress callback function
 * @param {boolean} options.eager - Whether to use eager transformations
 * @returns {Promise<string>} - The URL of the uploaded file
 */
export const uploadToCloudinary = async (file, options = {}) => {
  if (!file) return null;
  
  const {
    folder = 'profile_pictures',
    resourceType = 'image',
    onProgress = null,
    eager = false,
  } = options;
  
  try {
    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('cloud_name', cloudinaryConfig.cloudName);
    
    if (folder) {
      formData.append('folder', folder);
    }
    
    if (eager) {
      formData.append('eager', 'w_400,h_400,c_fill|w_100,h_100,c_thumb');
    }
    
    // Create URL for the upload
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`;
    
    if (onProgress) {
      // If progress tracking is needed, use XHR instead of fetch
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', url);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentCompleted = Math.round((e.loaded * 100) / e.total);
            onProgress(percentCompleted);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error('Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.send(formData);
      });
    } else {
      // Without progress tracking, use simple fetch
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.secure_url;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Create a Cloudinary URL with transformations
 * @param {string} publicId - The public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} - The transformed image URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;
  
  let transformations = '';
  
  if (width) transformations += `w_${width},`;
  if (height) transformations += `h_${height},`;
  if (crop) transformations += `c_${crop},`;
  if (quality) transformations += `q_${quality},`;
  if (format) transformations += `f_${format},`;
  
  // Remove trailing comma
  if (transformations.endsWith(',')) {
    transformations = transformations.slice(0, -1);
  }
  
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations}/${publicId}`;
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<Object>} - The response from Cloudinary
 */
export const deleteFromCloudinary = async (publicId) => {
  // Note: This would typically be handled through your backend for security reasons
  // This is just for demonstration purposes
  console.warn('WARNING: Deleting from Cloudinary directly from frontend is not secure!');
  console.warn('In production, implement deletion through a backend endpoint');
  
  try {
    // For security purposes, this endpoint requires authentication
    // A properly signed request should be done from a backend
    // This is a placeholder implementation that would work with a backend proxy
    const url = `/api/cloudinary/delete/${publicId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    
    // Since this will likely fail without a backend, we'll return a mock success
    // to avoid breaking the UI in the example
    return { 
      success: false, 
      message: 'Delete failed. For security reasons, deletion should be handled through a backend.',
      error: error.message
    };
  }
};

/**
 * Get information about an uploaded image from Cloudinary
 * @param {string} publicId - The public ID of the image
 * @returns {Promise<Object>} - The image information
 */
export const getImageInfo = async (publicId) => {
  try {
    // Note: This would typically be handled through a backend proxy for security
    const url = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/info/${publicId}.json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to get image info with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting image info from Cloudinary:', error);
    throw error;
  }
};
