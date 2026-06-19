const {v2: cloudinary} = require("cloudinary");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
    ),
  });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    await admin.auth().verifyIdToken(token);

    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        error: "Missing publicId",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
};
