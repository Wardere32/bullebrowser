// EEO Dashboard API tools for the BulleBrowser agent.
//
// Turns the EEO Dashboard's Secure API (OpenAPI 3.0.3) into agent tools, so the
// assistant operates the CRM through its API instead of driving the page —
// faster and sturdier. Passed to runAgent as `extraTools`.
//
// Auth is two account-level headers: X-Public-ID and X-Secret-Key. Because the
// key is account-wide (not per-user), writes are marked `destructive` so the
// user confirms before anything is created or changed, and you should gate
// which endpoints are exposed to which users at the backend.
//
//   eeoTools({ baseUrl, publicId, secretKey })  ->  ApiTool[]

const LIST_PARAMS = {
  page: { type: 'integer', description: 'Page number (results are paginated).' },
  createdMin: { type: 'string', description: 'ISO date — only records created on/after this.' },
  createdMax: { type: 'string', description: 'ISO date — only records created on/before this.' },
  orderBy: { type: 'string', description: 'Field to sort by.' },
  meta: { type: 'string', description: 'Set to include meta/custom-field attributes.' },
};

export function eeoTools({ baseUrl, publicId, secretKey }) {
  const base = String(baseUrl || '').replace(/\/$/, '');

  async function request(method, path, { query, body } = {}) {
    const url = new URL(base + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url, {
      method,
      headers: {
        'X-Public-ID': publicId,
        'X-Secret-Key': secretKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Request failed (${res.status}).`;
      // Surface the API's own message so the model can react (e.g. a 404 means
      // "not found", a 429 means "slow down"), but never echo the credentials.
      throw new Error(`EEO API ${method} ${path}: ${msg}`);
    }
    return data;
  }

  const listParamsSchema = { type: 'object', properties: LIST_PARAMS };

  /** @type {(t: object) => object} */
  const tool = (t) => t;

  return [
    // ---- Contacts ----
    tool({
      name: 'eeo_list_contacts',
      description: 'List CRM contacts (people). Paginated. Use to browse or find recent contacts.',
      inputSchema: listParamsSchema,
      execute: (i) => request('GET', '/contacts', { query: i }),
    }),
    tool({
      name: 'eeo_find_contact',
      description: 'Get one contact by its identifier (id or email). Set meta to include custom fields.',
      inputSchema: {
        type: 'object',
        required: ['identifier'],
        properties: {
          identifier: { type: 'string', description: 'Contact id or email.' },
          meta: { type: 'string', description: 'Include meta/custom fields.' },
        },
      },
      execute: (i) => request('GET', `/contact/${encodeURIComponent(i.identifier)}`, { query: { meta: i.meta } }),
    }),
    tool({
      name: 'eeo_contact_fields',
      description: 'List the available fields for a contact (standard + custom/meta). Call this before creating or updating so you use valid field names.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => request('GET', '/contact/meta'),
    }),
    tool({
      name: 'eeo_create_contact',
      description:
        'Create a contact. Pass fields in `data` (e.g. role, first_name, last_name, email, send_welcome_email, plus any custom fields from eeo_contact_fields).',
      inputSchema: {
        type: 'object',
        required: ['data'],
        properties: { data: { type: 'object', description: 'The contact fields to set.' } },
      },
      destructive: true,
      execute: (i) => request('POST', '/contact', { body: i.data }),
    }),
    tool({
      name: 'eeo_update_contact',
      description: 'Update an existing contact by identifier. Pass changed fields in `data`.',
      inputSchema: {
        type: 'object',
        required: ['identifier', 'data'],
        properties: {
          identifier: { type: 'string', description: 'Contact id or email.' },
          data: { type: 'object', description: 'The fields to change.' },
        },
      },
      destructive: true,
      execute: (i) => request('PUT', `/contact/${encodeURIComponent(i.identifier)}`, { body: i.data }),
    }),

    // ---- Companies ----
    tool({
      name: 'eeo_list_companies',
      description: 'List CRM companies. Paginated.',
      inputSchema: listParamsSchema,
      execute: (i) => request('GET', '/companies', { query: i }),
    }),
    tool({
      name: 'eeo_find_company',
      description: 'Get one company by identifier. Set meta to include custom fields.',
      inputSchema: {
        type: 'object',
        required: ['identifier'],
        properties: {
          identifier: { type: 'string', description: 'Company id.' },
          meta: { type: 'string', description: 'Include meta/custom fields.' },
        },
      },
      execute: (i) => request('GET', `/company/${encodeURIComponent(i.identifier)}`, { query: { meta: i.meta } }),
    }),
    tool({
      name: 'eeo_company_fields',
      description: 'List the available fields for a company (standard + custom/meta).',
      inputSchema: { type: 'object', properties: {} },
      execute: () => request('GET', '/company/meta'),
    }),
    tool({
      name: 'eeo_create_company',
      description: 'Create a company. Pass fields in `data` (see eeo_company_fields for valid names).',
      inputSchema: {
        type: 'object',
        required: ['data'],
        properties: { data: { type: 'object', description: 'The company fields to set.' } },
      },
      destructive: true,
      execute: (i) => request('POST', '/company', { body: i.data }),
    }),
    tool({
      name: 'eeo_update_company',
      description: 'Update an existing company by identifier. Pass changed fields in `data`.',
      inputSchema: {
        type: 'object',
        required: ['identifier', 'data'],
        properties: {
          identifier: { type: 'string', description: 'Company id.' },
          data: { type: 'object', description: 'The fields to change.' },
        },
      },
      destructive: true,
      execute: (i) => request('PUT', `/company/${encodeURIComponent(i.identifier)}`, { body: i.data }),
    }),

    // ---- Projects ----
    tool({
      name: 'eeo_list_projects',
      description: 'List projects. Paginated. Useful for district project-management dashboards.',
      inputSchema: listParamsSchema,
      execute: (i) => request('GET', '/projects', { query: i }),
    }),
    tool({
      name: 'eeo_find_project',
      description: 'Get one project by its type and identifier. Set meta to include custom fields.',
      inputSchema: {
        type: 'object',
        required: ['type', 'identifier'],
        properties: {
          type: { type: 'string', description: 'Project type.' },
          identifier: { type: 'string', description: 'Project id.' },
          meta: { type: 'string', description: 'Include meta/custom fields.' },
        },
      },
      execute: (i) =>
        request('GET', `/project/${encodeURIComponent(i.type)}/${encodeURIComponent(i.identifier)}`, {
          query: { meta: i.meta },
        }),
    }),
    tool({
      name: 'eeo_project_fields',
      description: 'List the available fields for a project (standard + custom/meta).',
      inputSchema: { type: 'object', properties: {} },
      execute: () => request('GET', '/project/meta'),
    }),
    tool({
      name: 'eeo_update_project',
      description: 'Update a project by type and identifier. Pass changed fields in `data`.',
      inputSchema: {
        type: 'object',
        required: ['type', 'identifier', 'data'],
        properties: {
          type: { type: 'string', description: 'Project type.' },
          identifier: { type: 'string', description: 'Project id.' },
          data: { type: 'object', description: 'The fields to change.' },
        },
      },
      destructive: true,
      execute: (i) =>
        request('PUT', `/project/${encodeURIComponent(i.type)}/${encodeURIComponent(i.identifier)}`, {
          body: i.data,
        }),
    }),

    // ---- Marketing ----
    tool({
      name: 'eeo_subscribe_to_marketing',
      description: 'Subscribe contacts to marketing audiences/communities. Pass the payload in `data`.',
      inputSchema: {
        type: 'object',
        required: ['data'],
        properties: { data: { type: 'object', description: 'The subscribe payload.' } },
      },
      destructive: true,
      execute: (i) => request('POST', '/marketing/subscribe', { body: i.data }),
    }),

    // ---- Worlds ----
    tool({
      name: 'eeo_list_worlds',
      description: 'List Worlds (top-level workspaces/portals). Paginated.',
      inputSchema: {
        type: 'object',
        properties: {
          page: LIST_PARAMS.page,
          orderBy: LIST_PARAMS.orderBy,
        },
      },
      execute: (i) => request('GET', '/worlds', { query: i }),
    }),
  ];
}
