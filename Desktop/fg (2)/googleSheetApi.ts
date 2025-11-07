// This URL should point to your deployed Google Apps Script Web App.
// The Apps Script should be configured to handle both POST requests for adding users
// and GET requests for checking status.
const GOOGLE_SHEET_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDBmE6C4FzPp5pceHZbH5Euh1-rLFXgXB8aGWdSnEIU_hgosp4oHfe97b0DtjMTFvw_Q/exec';

export type UserStatus = 'active' | 'banned' | 'not_found';

/**
 * Posts a wallet address to a Google Apps Script endpoint which then saves it to a Google Sheet.
 * This acts as a secure proxy, so no API keys are exposed on the frontend.
 * @param address The wallet address to save.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export const saveWalletAddressToSheet = async (address: string): Promise<{ success: boolean, message?: string }> => {
  if (!address) {
    return { success: false, message: 'Address is empty.' };
  }

  if (GOOGLE_SHEET_APP_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
    console.warn('Google Sheets API URL is a placeholder. Skipping wallet address submission.');
    return { success: true, message: 'Skipped submission due to placeholder URL.' };
  }

  try {
    const response = await fetch(GOOGLE_SHEET_APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      // Adding an 'action' property to help the backend script differentiate requests
      body: JSON.stringify({ action: 'addAddress', address }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
        console.log('Wallet address successfully saved to Google Sheet.');
        return { success: true };
      } else {
        console.error('Google Sheet API returned an error:', result.message);
        return { success: false, message: result.message || 'API returned an error.' };
      }
    } else {
      console.error('Failed to post to Google Sheet API. Status:', response.status);
      return { success: false, message: `Server responded with status ${response.status}` };
    }
  } catch (error) {
    console.error('Error sending wallet address to Google Sheet:', error);
    if (error instanceof Error) {
        return { success: false, message: error.message };
    }
    return { success: false, message: 'An unknown network error occurred.' };
  }
};

/**
 * Checks the status of a user (wallet address) from the Google Sheet backend.
 * @param address The wallet address to check.
 * @returns A promise that resolves to an object with the user's status.
 */
export const checkUserStatus = async (address: string): Promise<{ status: UserStatus }> => {
    if (!address) {
      return { status: 'not_found' };
    }

    // Quick cache to avoid hammering the endpoint in preview or slow networks
    const cacheKey = `user_status_cache_${address}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // use cached if within 60 seconds
        if (Date.now() - parsed.ts < 60_000) {
          return { status: parsed.status as UserStatus };
        }
      }
    } catch {}

    if (GOOGLE_SHEET_APP_SCRIPT_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.debug('Google Sheets API URL is a placeholder. Skipping user status check.');
      return { status: 'active' }; // Assume active for placeholder
    }

    const makeRequest = async (attempt: number): Promise<{ status: UserStatus }> => {
      const url = new URL(GOOGLE_SHEET_APP_SCRIPT_URL);
      url.searchParams.append('action', 'checkStatus');
      url.searchParams.append('address', address);

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          mode: 'cors',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status && ['active', 'banned', 'not_found'].includes(result.status)) {
            // cache and return
            try { localStorage.setItem(cacheKey, JSON.stringify({ status: result.status, ts: Date.now() })); } catch {}
            return { status: result.status as UserStatus };
          }
          console.debug('User status check returned unexpected response:', result);
          return { status: 'not_found' };
        }

        // For server errors (5xx) retry a couple times, for client errors (4xx) do not retry
        if (response.status >= 500 && attempt < 3) {
          const backoff = 300 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoff));
          return makeRequest(attempt + 1);
        }

        // Log at debug level to avoid console spam in preview
        console.debug('Failed to get user status from Google Sheet API. Status:', response.status);
        // Fail open: return active
        return { status: 'active' };
      } catch (err) {
        // Network or CORS error: retry a couple times
        if (attempt < 3) {
          const backoff = 300 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, backoff));
          return makeRequest(attempt + 1);
        }
        console.debug('Error checking user status from Google Sheet (non-fatal):', err);
        return { status: 'active' };
      }
    };

    return makeRequest(0);
  };
