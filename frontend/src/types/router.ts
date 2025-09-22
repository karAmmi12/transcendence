export interface Route {
  path: string;
  component: () => any;
  title: string;
  requiresAuth: boolean;
}