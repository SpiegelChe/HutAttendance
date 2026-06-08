// Root entry point of the application.
// RouterProvider wires up the entire app to the react-router browser router,
// which is defined in routes.tsx. All navigation, route guards, and layout
// wrappers are configured there.
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}