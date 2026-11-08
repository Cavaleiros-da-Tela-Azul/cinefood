export const catalogRoutes = {
  prefix: '/catalog',
  endpoints: ['GET /movies', 'GET /screenings', 'GET /screenings/:id/seats'],
} as const;
