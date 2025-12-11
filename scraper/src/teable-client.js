/**
 * Teable API Client
 * Handles all interactions with Teable database
 */

export class TeableClient {
  constructor(baseUrl, baseId, apiToken) {
    this.baseUrl = baseUrl;
    this.baseId = baseId;
    this.apiToken = apiToken;
  }

  async request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Teable API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Teable API request timeout (>10s)');
      }
      throw error;
    }
  }

  async getRecords(tableId, filter = null) {
    let endpoint = `/table/${tableId}/record`;
    if (filter) {
      endpoint += `?filter=${encodeURIComponent(filter)}`;
    }
    return this.request('GET', endpoint);
  }

  async getRecord(tableId, recordId) {
    return this.request('GET', `/table/${tableId}/record/${recordId}`);
  }

  async createRecord(tableId, fields) {
    return this.request('POST', `/table/${tableId}/record`, {
      records: [{ fields }],
    });
  }

  async updateRecord(tableId, recordId, fields) {
    return this.request('PATCH', `/table/${tableId}/record/${recordId}`, {
      fields,
    });
  }

  async deleteRecord(tableId, recordId) {
    return this.request('DELETE', `/table/${tableId}/record/${recordId}`);
  }

  async findStateByCode(statesTableId, code) {
    const response = await this.getRecords(statesTableId, `code="${code}"`);
    if (response.records && response.records.length > 0) {
      return response.records[0];
    }
    return null;
  }

  async getStateDetails(detailsTableId, stateCode) {
    const response = await this.getRecords(detailsTableId, `stateCode="${stateCode}"`);
    return response.records || [];
  }

  async getStateResources(resourcesTableId, stateCode) {
    const response = await this.getRecords(resourcesTableId, `stateCode="${stateCode}"`);
    return response.records || [];
  }

  async logUpdate(updateLogTableId, stateCode, changeType, oldValue, newValue, source) {
    return this.createRecord(updateLogTableId, {
      timestamp: new Date().toISOString(),
      stateCode,
      changeType,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(newValue),
      source,
    });
  }
}

export default TeableClient;
