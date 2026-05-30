// Source: Twenty CRM docs via RESEARCH.md Pattern 1
// server/lib/twenty-client.cjs
// API wrapper for Twenty CRM GraphQL and REST endpoints

const fetch = require('node-fetch');

const TWENTY_BASE_URL = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Twenty CRM API Client
 * Wraps GraphQL and REST APIs with authentication and error handling
 */
class TwentyClient {
  constructor(apiToken, baseUrl = TWENTY_BASE_URL, options = {}) {
    if (!apiToken) {
      throw new Error('TwentyClient requires apiToken');
    }
    this.apiToken = apiToken;
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.enableRetry = options.enableRetry !== false; // Retry enabled by default
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Execute GraphQL query/mutation
   * @param {string} query - GraphQL query string
   * @param {object} variables - GraphQL variables
   * @param {object} options - Additional options (retry, timeout)
   */
  async graphql(query, variables = {}, options = {}) {
    const enableRetry = options.enableRetry !== undefined ? options.enableRetry : this.enableRetry;
    const maxRetries = options.maxRetries || this.maxRetries;

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        const response = await fetch(`${this.baseUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`
          },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Twenty GraphQL HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(`Twenty GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        if (!result.data) {
          throw new Error('Twenty GraphQL: No data returned');
        }

        return result.data;

      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors or 4xx
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }

        // Retry on network errors or 5xx
        if (attempt < maxRetries && enableRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Execute REST API call
   * @param {string} endpoint - REST endpoint (e.g., 'people', 'companies/abc123')
   * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
   * @param {object} body - Request body for POST/PATCH
   * @param {object} options - Additional options
   */
  async rest(endpoint, method = 'GET', body = null, options = {}) {
    const enableRetry = options.enableRetry !== undefined ? options.enableRetry : this.enableRetry;
    const maxRetries = options.maxRetries || this.maxRetries;

    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        const url = `${this.baseUrl}/rest/${endpoint}`;
        const requestOptions = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`
          },
          signal: controller.signal
        };

        if (body && (method === 'POST' || method === 'PATCH')) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);

        clearTimeout(timeoutId);

        // Handle 204 No Content
        if (response.status === 204) {
          return null;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Twenty REST HTTP ${response.status}: ${errorText}`);
        }

        return await response.json();

      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors or 4xx
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }

        // Retry on network errors or 5xx
        if (attempt < maxRetries && enableRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Create a custom object in Twenty
   * @param {string} name - Object name (singular)
   * @param {string} description - Object description
   */
  async createObject(name, description) {
    const mutation = `
      mutation createOneObject($name: String!, $description: String) {
        createOneObject(name: $name, description: $description) {
          id
          name
          label
          labelPlural
        }
      }
    `;
    const result = await this.graphql(mutation, { name, description });
    return result.createOneObject;
  }

  /**
   * Create a custom field in Twenty object
   * @param {string} objectId - Object ID to add field to
   * @param {string} name - Field name
   * @param {string} type - Field type (TEXT, NUMBER, SELECT, etc.)
   * @param {object} metadata - Field metadata (options for SELECT, etc.)
   */
  async createField(objectId, name, type, metadata = null) {
    const mutation = `
      mutation createOneField($objectId: String!, $name: String!, $type: String!, $metadata: JSON) {
        createOneField(objectId: $objectId, name: $name, type: $type, metadata: $metadata) {
          id
          name
          type
        }
      }
    `;
    const result = await this.graphql(mutation, {
      objectId,
      name,
      type,
      metadata
    });
    return result.createOneField;
  }

  /**
   * Create a Person record (standard Twenty object)
   * @param {object} personData - Person data (firstName, lastName, email, phone)
   */
  async createPerson(personData) {
    const mutation = `
      mutation createOnePerson($data: PersonCreateInput!) {
        createOnePerson(data: $data) {
          id
          firstName
          lastName
          email
          phone
        }
      }
    `;
    const result = await this.graphql(mutation, { data: personData });
    return result.createOnePerson;
  }

  /**
   * Find Person by email
   * @param {string} email - Email to search for
   */
  async findPersonByEmail(email) {
    const query = `
      query people($email: String) {
        people(filter: { email: { eq: $email } }) {
          id
          firstName
          lastName
          email
          phone
        }
      }
    `;
    const result = await this.graphql(query, { email });
    return result.people?.[0] || null;
  }

  /**
   * Find Person by name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   */
  async findPersonByName(firstName, lastName) {
    const query = `
      query people($firstName: String, $lastName: String) {
        people(filter: { firstName: { eq: $firstName }, lastName: { eq: $lastName } }) {
          id
          firstName
          lastName
          email
          phone
        }
      }
    `;
    const result = await this.graphql(query, { firstName, lastName });
    return result.people?.[0] || null;
  }

  /**
   * Create an Opportunity in Twenty
   * @param {object} data - Opportunity data (name, amountAmountMicros, amountCurrencyCode, stage, pointOfContactId)
   */
  async createOpportunity(data) {
    const mutation = `
      mutation createOneOpportunity($data: OpportunityCreateInput!) {
        createOneOpportunity(data: $data) {
          id
          name
          amountAmountMicros
          amountCurrencyCode
          stage
        }
      }
    `;
    const result = await this.graphql(mutation, { data });
    return result.createOneOpportunity;
  }


  /**
   * Test connection to Twenty API
   */
  async testConnection() {
    try {
      // Simple query to test auth and connectivity
      const query = `
        query {
          workspaces {
            id
            name
          }
        }
      `;
      const result = await this.graphql(query);
      return { success: true, workspaces: result.workspaces };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = { TwentyClient };
