import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CloudinaryUploader from '../Components/CloudinaryUploader';

const CloudinaryUploadExample = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [userId] = useState('example-user-123'); // Normally you'd get this from authentication
  
  const handleUploadComplete = (url) => {
    console.log('Upload completed with URL:', url);
    setImageUrl(url);
    if (url) {
      toast.success('Image upload successful!');
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <ToastContainer position="top-right" />
      
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Cloudinary Upload Example</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
        
        <CloudinaryUploader 
          onUploadComplete={handleUploadComplete}
          folder="examples"
          userId={userId}
          maxSizeMB={2}
          cropMode={true}
        />
        
        {imageUrl && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Uploaded Image</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={imageUrl} 
                alt="Uploaded" 
                className="max-w-full rounded-md mb-4"
              />
              <div className="mt-2">
                <p className="text-sm text-gray-600">Image URL:</p>
                <input
                  type="text"
                  value={imageUrl}
                  readOnly
                  className="w-full p-2 bg-gray-100 border text-gray-800 rounded text-sm"
                  onClick={(e) => e.target.select()}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
{`// Import the component
import CloudinaryUploader from '../Components/CloudinaryUploader';

// In your component
const [imageUrl, setImageUrl] = useState('');

const handleUploadComplete = (url) => {
  setImageUrl(url);
};

// In your JSX
<CloudinaryUploader 
  onUploadComplete={handleUploadComplete}
  folder="your-folder-name"
  userId={currentUserId} // Optional
  maxSizeMB={2}
  cropMode={true}
  initialImage={existingImageUrl} // Optional
/>
`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryUploadExample;
