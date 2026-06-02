const { onCall } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;

admin.initializeApp();

setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.deleteCloudinaryFile = onCall(async (request) => {
  const auth = request.auth;

  if (!auth) {
    throw new Error("Authentication required");
  }

  const { publicId } = request.data;

  if (!publicId) {
    throw new Error("Missing publicId");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    return {
      success: true,
      result,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      error: err.message,
    };
  }
});
