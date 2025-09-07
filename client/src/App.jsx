import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SatyaShaktiLanding from './pages/LandingPage';
import VoiceChanger from './pages/VoiceChanger';
import System from './pages/System';
import AnonymousEditor from './pages/AnonymousEditor';


function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <div > {/* Add padding for fixed navigation */}
          <Routes>
            <Route path="/" element={<SatyaShaktiLanding />} />
            <Route path="/fully-anonymous" element={<System />} />
            <Route path="/anonymous-editor" element={<AnonymousEditor />} />
            <Route path="/record-fake-voice" element={<VoiceChanger />} />
           
            
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
