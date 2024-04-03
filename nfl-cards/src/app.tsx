import * as React from 'react';
import {createRoot} from 'react-dom/client';

import '../src/assets/style.css';
import BreaksResultMindMapComponent from "./components/BreaksResultMindMapComponent";

const App: React.FC = () => {
  React.useEffect(() => {
  }, []);

  return (
    <div className="grid wrapper">
       <BreaksResultMindMapComponent/>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
