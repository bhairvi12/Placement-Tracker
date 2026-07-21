import './env.js'
import { v2 as cloudinary } from 'cloudinary';



console.log('Cloudinary config:', cloudinary.config())

/**
 * Uploads a buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {Object} options - Cloudinary upload options (e.g. folder, public_id, resource_type)
 * @returns {Promise<Object>} - Promise resolving to Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary, uploadToCloudinary };
export default cloudinary;
