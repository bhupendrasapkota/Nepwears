const extractPublicId = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const withoutBase = url.split("/upload/")[1];
    const withoutExtension = withoutBase.split(".")[0];
    const parts = withoutExtension.split("/");

    if (/^v\d+$/.test(parts[0])) {
      parts.shift();
    }

    const publicId = parts.join("/");

    return publicId;
  } catch (err) {
    console.error("Failed to extract publicId from URL:", url, err);

    return null;
  }
};

export default extractPublicId;
