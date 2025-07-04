export const uploadToCloudinary = async (imageUri, folder = "driverPhotos") => {
  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: `upload_${Date.now()}.jpg`,
  });
  data.append("upload_preset", "Driver-Application");
  data.append("folder", folder);

  const cloudName = "dvxycdr6l"; // Replace with your Cloudinary cloud name

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });

    const json = await response.json();
    return json.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};
