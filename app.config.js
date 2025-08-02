require('dotenv').config();

export default {
  expo: {
    name: "LubaD",
    slug: "luba-d", 
    version: "1.0.0", 
    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
    },
    android: {
      package: "com.anonymous.lubad",
    }

  },
};
