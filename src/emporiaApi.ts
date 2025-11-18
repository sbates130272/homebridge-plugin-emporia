import axios, { AxiosInstance } from 'axios';
import type { Logging } from 'homebridge';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

// Polyfill for Node.js environment (Cognito expects browser globals)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = async (...args: any[]) => {
    const nodeFetch = (await import('node-fetch')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return nodeFetch(...args as any);
  };
}

export interface EmporiaTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface EmporiaDevice {
  deviceGid: number;
  manufacturerDeviceId: string;
  model: string;
  firmware: string;
  devices?: EmporiaDevice[];
  channels?: EmporiaChannel[];
  outlet?: EmporiaOutlet;
  evCharger?: EmporiaCharger;
  locationProperties?: {
    deviceName?: string;
    zipCode?: string;
    timeZone?: string;
  };
}

export interface EmporiaChannel {
  deviceGid: number;
  name: string;
  channelNum: string;
  channelMultiplier: number;
  channelTypeGid: number;
}

export interface EmporiaOutlet {
  deviceGid: number;
  outletOn: boolean;
  parentDeviceGid?: number;
  icon?: string;
  locationProperties?: {
    deviceName?: string;
  };
}

export interface EmporiaCharger {
  deviceGid: number;
  chargerOn: boolean;
  chargingRate: number;
  maxChargingRate: number;
  parentDeviceGid?: number;
}

export interface EmporiaUsageData {
  deviceGid: number;
  channelUsages: Array<{
    deviceGid: number;
    channelNum: string;
    usage: number;
    timestamp: string;
  }>;
}

/**
 * Emporia Energy API Client
 * Based on PyEmVue implementation
 * Uses AWS Cognito for authentication
 */
export class EmporiaApi {
  private readonly baseUrl = 'https://api.emporiaenergy.com';
  private readonly client: AxiosInstance;
  private tokens: EmporiaTokens | null = null;
  
  // AWS Cognito configuration from PyEmVue
  private readonly cognitoClientId = '4qte47jbstod8apnfic0bunmrq';
  private readonly cognitoUserPoolId = 'us-east-2_ghlOXVLi1';
  private cognitoUser: CognitoUser | null = null;
  private username: string | null = null;

  constructor(private readonly log: Logging) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            originalRequest.headers.authtoken = this.tokens?.idToken;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.log.error('Token refresh failed:', refreshError);
            throw refreshError;
          }
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Authenticate with username and password using AWS Cognito
   */
  async login(username: string, password: string): Promise<EmporiaTokens> {
    try {
      this.log.debug('Authenticating with Emporia API via Cognito...');
      this.username = username.toLowerCase();

      const userPool = new CognitoUserPool({
        UserPoolId: this.cognitoUserPoolId,
        ClientId: this.cognitoClientId,
      });

      this.cognitoUser = new CognitoUser({
        Username: this.username,
        Pool: userPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: this.username,
        Password: password,
      });

      return new Promise((resolve, reject) => {
        this.cognitoUser!.authenticateUser(authDetails, {
          onSuccess: (session: CognitoUserSession) => {
            this.tokens = {
              idToken: session.getIdToken().getJwtToken(),
              accessToken: session.getAccessToken().getJwtToken(),
              refreshToken: session.getRefreshToken().getToken(),
              expiresAt: Date.now() + (3600 * 1000), // 1 hour
            };

            this.client.defaults.headers.common.authtoken = this.tokens.idToken;
            this.log.info('Successfully authenticated with Emporia API');
            resolve(this.tokens);
          },
          onFailure: (err) => {
            this.log.error('Cognito authentication failed:', err.message);
            reject(new Error(`Authentication failed: ${err.message}`));
          },
        });
      });
    } catch (error) {
      this.log.error('Failed to authenticate:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Refresh access token using Cognito
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.cognitoUser || !this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    return new Promise((resolve, reject) => {
      // Cognito requires CognitoRefreshToken but we only have the token string
      this.cognitoUser!.refreshSession(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { getToken: () => this.tokens!.refreshToken } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err: any, session: CognitoUserSession) => {
          if (err) {
            this.log.error('Failed to refresh token:', err.message);
            reject(err);
            return;
          }

          this.tokens = {
            idToken: session.getIdToken().getJwtToken(),
            accessToken: session.getAccessToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
            expiresAt: Date.now() + (3600 * 1000),
          };

          this.client.defaults.headers.common.authtoken = this.tokens.idToken;
          this.log.debug('Access token refreshed successfully');
          resolve();
        },
      );
    });
  }

  /**
   * Get all devices
   */
  async getDevices(): Promise<EmporiaDevice[]> {
    try {
      this.log.debug('Fetching devices from Emporia API...');
      const response = await this.client.get('/customers/devices', {
        headers: { authtoken: this.tokens?.idToken },
      });
      return response.data.customerDevices || [];
    } catch (error) {
      this.log.error('Failed to fetch devices:', error);
      throw error;
    }
  }

  /**
   * Get device properties
   */
  async getDeviceProperties(deviceGid: number): Promise<EmporiaDevice> {
    try {
      const response = await this.client.get(
        `/devices/${deviceGid}/locationProperties`,
        {
          headers: { authtoken: this.tokens?.idToken },
        },
      );
      return response.data;
    } catch (error) {
      this.log.error(
        `Failed to fetch properties for device ${deviceGid}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get outlets
   */
  async getOutlets(): Promise<EmporiaOutlet[]> {
    try {
      this.log.debug('Fetching outlets from Emporia API...');
      const response = await this.client.get('/customers/devices/status', {
        headers: { authtoken: this.tokens?.idToken },
      });
      return response.data.outlets || [];
    } catch (error) {
      this.log.error('Failed to fetch outlets:', error);
      throw error;
    }
  }

  /**
   * Update outlet state
   */
  async updateOutlet(
    deviceGid: number,
    outletOn: boolean,
  ): Promise<EmporiaOutlet> {
    try {
      this.log.debug(
        `Updating outlet ${deviceGid} to ${outletOn ? 'ON' : 'OFF'}`,
      );
      const response = await this.client.put(
        '/devices/outlet',
        {
          deviceGid,
          outletOn,
        },
        {
          headers: { authtoken: this.tokens?.idToken },
        },
      );
      return response.data;
    } catch (error) {
      this.log.error(`Failed to update outlet ${deviceGid}:`, error);
      throw error;
    }
  }

  /**
   * Get EV chargers
   */
  async getChargers(): Promise<EmporiaCharger[]> {
    try {
      this.log.debug('Fetching EV chargers from Emporia API...');
      const response = await this.client.get('/customers/devices/status', {
        headers: { authtoken: this.tokens?.idToken },
      });
      return response.data.evChargers || [];
    } catch (error) {
      this.log.error('Failed to fetch EV chargers:', error);
      throw error;
    }
  }

  /**
   * Update EV charger state
   */
  async updateCharger(
    deviceGid: number,
    chargerOn: boolean,
    chargingRate?: number,
    maxChargingRate?: number,
  ): Promise<EmporiaCharger> {
    try {
      this.log.debug(
        `Updating charger ${deviceGid} to ${chargerOn ? 'ON' : 'OFF'}`,
      );
      const data: Record<string, unknown> = {
        deviceGid,
        chargerOn,
      };

      if (chargingRate !== undefined) {
        data.chargingRate = chargingRate;
      }
      if (maxChargingRate !== undefined) {
        data.maxChargingRate = maxChargingRate;
      }

      const response = await this.client.put('/devices/evcharger', data, {
        headers: { authtoken: this.tokens?.idToken },
      });
      return response.data;
    } catch (error) {
      this.log.error(`Failed to update charger ${deviceGid}:`, error);
      throw error;
    }
  }

  /**
   * Get device usage data
   */
  async getDeviceUsage(
    deviceGid: number,
    instant: Date = new Date(),
    scale: string = 'MINUTE',
    unit: string = 'KWH',
  ): Promise<EmporiaUsageData> {
    try {
      const response = await this.client.post(
        '/devices/usage',
        {
          deviceGids: [deviceGid],
          instant: instant.toISOString(),
          scale,
          unit,
        },
        {
          headers: { authtoken: this.tokens?.idToken },
        },
      );
      return response.data;
    } catch (error) {
      this.log.error(
        `Failed to fetch usage for device ${deviceGid}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return (
      this.tokens !== null &&
      this.tokens.expiresAt > Date.now()
    );
  }

  /**
   * Set tokens (for restoring from storage)
   */
  setTokens(tokens: EmporiaTokens, username?: string): void {
    this.tokens = tokens;
    this.client.defaults.headers.common.authtoken = tokens.idToken;
    
    // Recreate Cognito user if username provided
    if (username) {
      this.username = username.toLowerCase();
      const userPool = new CognitoUserPool({
        UserPoolId: this.cognitoUserPoolId,
        ClientId: this.cognitoClientId,
      });
      this.cognitoUser = new CognitoUser({
        Username: this.username,
        Pool: userPool,
      });
    }
  }

  /**
   * Get current tokens
   */
  getTokens(): EmporiaTokens | null {
    return this.tokens;
  }
}

