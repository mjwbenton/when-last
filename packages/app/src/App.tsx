import { AppStateProvider } from './state';
import { NavProvider, useNav } from './nav/context';
import { ToastProvider } from './ui';
import { Home } from './screens/Home';
import { ActionDetail } from './screens/ActionDetail';
import { SheetRoot } from './sheets/SheetRoot';
import './styles/global.css';

function Screens() {
  const { screen } = useNav();
  if (screen.name === 'action') return <ActionDetail actionId={screen.actionId} />;
  return <Home />;
}

export default function App() {
  return (
    <AppStateProvider>
      <ToastProvider>
        <NavProvider>
          <div className="stage">
            <div className="app">
              <Screens />
            </div>
          </div>
          <SheetRoot />
        </NavProvider>
      </ToastProvider>
    </AppStateProvider>
  );
}
