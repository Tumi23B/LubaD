
## 🔒 Problem:
> The **Google Maps API key** was previously **hardcoded in the source code**, which meant:
>
> - Anyone on GitHub could see it  
> - The key could be stolen or abused (resulting in billing charges or usage bans)  
> - It violated proper security practices  

---

### ✅ Solution Implemented:

| ✅ Change | 📄 Description |
|----------|----------------|
| `GOOGLE_MAPS_API_KEY` moved to `.env` | The API key is now kept in a local-only file, hidden from Git |
| Added `react-native-dotenv` | Lets the app securely access `.env` variables |
| Updated `.gitignore` | Prevents `.env` from ever being committed |
| Added `.env.example` | A sample file to guide you in setting up your own key |
| Updated `babel.config.js` | Configured the app to recognize `@env` imports from `.env` |