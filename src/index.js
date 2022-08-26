import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import App from './App.js';
import DashboardWrapper from './DashboardWrapper.js';
import GuildWrapper from './GuildWrapper.js';
import Offline from './Offline.js';
import reportWebVitals from './reportWebVitals.js';
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import './index.css';

TimeAgo.addDefaultLocale(en)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<BrowserRouter>
		<Routes>
		<Route path="/" element={<App />} />
		<Route path="/offline" element={<Offline />} />
		<Route path="/dashboard" element={<DashboardWrapper />} />
		<Route path="/guild/:id" element={<GuildWrapper />} />
		<Route path="*" element={<Navigate to="/"></Navigate>} />
		</Routes>
	</BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
