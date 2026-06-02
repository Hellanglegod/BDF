const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  try {
    const { publicId, secret } = req.body;

    if (secret !== process.env.DELETE_SECRET) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
