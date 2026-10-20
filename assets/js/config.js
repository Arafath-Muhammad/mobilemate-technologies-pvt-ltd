/**
 * Configuration Manager
 * Handles environment variables and sensitive keys.
 */
const CONFIG = {
    // In a production environment with a build tool (Vite/Webpack), 
    // these would be accessed via process.env or import.meta.env
    WOO_URL: "https://mobilemate.lk",
    WOO_USERNAME: "admin",
    WOO_APP_PASSWORD: "cJbf mkT9 iyoJ vD5U HUy3 xlaw",
    
    // Helper to get credentials safely
    async getWooCredentials() {
        // Priority 1: Check Database Settings (User-defined in ERP UI)
        const savedUrl = await db.settings.get('woo_url');
        const savedUser = await db.settings.get('woo_key');
        const savedPass = await db.settings.get('woo_secret');
        
        return {
            url: savedUrl ? savedUrl.value : this.WOO_URL,
            username: savedUser ? savedUser.value : this.WOO_USERNAME,
            password: savedPass ? savedPass.value : this.WOO_APP_PASSWORD
        };
    }
};
