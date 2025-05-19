import React, { useState, useEffect } from 'react';
import { uploadToCloudinary, getCloudinaryUrl } from '../utils/cloudinary';
import { toast } from 'react-toastify';

const CloudinaryUploader = ({ 
  onUploadComplete,
  className = '',
  folder = 'uploads',
  maxSizeMB = 5,
  cropMode = true,
  initialImage = null,
  userId = null
}) => {  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(initialImage || '');
  
  // Initialize with initial image if provided
  useEffect(() => {
    if (initialImage) {
      setUploadedUrl(initialImage);
      setPreview(initialImage);
    }
  }, [initialImage]);

  const validateFile = (file) => {
    // Check file size (convert maxSizeMB to bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setError('File type not supported. Please upload a JPEG, PNG, GIF or WEBP image');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(''); // Clear previous errors
    
    if (selectedFile) {
      // Validate file before proceeding
      if (!validateFile(selectedFile)) return;
      
      setFile(selectedFile);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      
      // Auto-upload if set to auto
      // if (autoUpload) {
      //   handleUpload(selectedFile);
      // }
    }
  };  const handleUpload = async (fileToUpload = null) => {
    const fileToProcess = fileToUpload || file;
    
    if (!fileToProcess) {
      setError('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setUploadProgress(0);
      
      // Build the folder path, include userId if provided
      const uploadFolder = userId ? `${folder}/${userId}` : folder;
      
      // Use our enhanced Cloudinary utility with progress tracking
      const imageUrl = await uploadToCloudinary(fileToProcess, {
        folder: uploadFolder,
        resourceType: 'image',
        eager: cropMode, // Apply eager transformations if crop mode is enabled
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      
      // Store the uploaded URL
      setUploadedUrl(imageUrl);
      
      // Call the callback with the uploaded URL
      if (onUploadComplete) {
        onUploadComplete(imageUrl);
      }
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message || 'Unknown error'}`);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to remove/clear the uploaded image
  const handleRemove = () => {
    setFile(null);
    setPreview('');
    setUploadedUrl('');
    if (onUploadComplete) {
      onUploadComplete(''); // Clear the URL in parent component
    }
  };
  return (
    <div className={`cloudinary-uploader ${className}`}>
      <div className="flex flex-col space-y-4">
        {/* Image Preview Area */}
        {(preview || uploadedUrl) && (
          <div className="image-preview mb-3 flex justify-center">
            <div className="relative">
              <img 
                src={preview || uploadedUrl} 
                alt="Preview" 
                className="h-40 w-40 object-cover rounded-lg border-2 border-blue-300 shadow-md" 
              />
              {/* Remove button */}
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  title="Remove image"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* File Input and Upload Controls */}
        <div className="flex flex-col space-y-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max file size: {maxSizeMB}MB. Formats: JPEG, PNG, GIF, WEBP
            </p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-right mt-1 text-gray-600">{uploadProgress}%</p>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleUpload()}
              disabled={!file || isUploading || uploadedUrl === preview}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : 'Upload Image'}
            </button>
          </div>
          
          {/* Success Message */}
          {uploadedUrl && !isUploading && !error && (
            <p className="text-green-600 text-sm">
              Image uploaded successfully! ✓
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloudinaryUploader;
