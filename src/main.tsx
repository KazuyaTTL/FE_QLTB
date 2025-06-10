import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { App as AntApp } from 'antd'
import 'antd/dist/reset.css'
import { checkAuth } from './utils/checkAuth'
import { Provider } from 'react-redux'
import { store } from './store'

// Khởi tạo ứng dụng trước
const root = ReactDOM.createRoot(document.getElementById('root')!);

// Render ứng dụng
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AntApp>
    <App />
      </AntApp>
    </Provider>
  </React.StrictMode>,
);

// Kiểm tra auth sau khi render
checkAuth();
