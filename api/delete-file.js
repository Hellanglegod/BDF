const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const publicId = body?.publicId;

    if (!publicId) {
      return res.status(400).json({
        error: "publicId missing",
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
  module.exports = async (req, res) => {
    console.log("METHOD:", req.method);
    console.log("HEADERS:", req.headers);
    console.log("BODY:", req.body);

    try {
      const { publicId } = req.body;

      console.log("PUBLIC ID:", publicId);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });

      console.log("RESULT:", result);

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  };
};
