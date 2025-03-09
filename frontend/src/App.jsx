import React from 'react'
import Login from './pages/login/Login'
import Register from './pages/register/register'
//import { createBrowserRouter,RouterProvider,Route } from 'react-router-dom' 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Info from './pages/info/info'
import ForgotPassword from './pages/forgotpassword/forgotPassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/info" element={<Info />} />
        <Route path="/" element={<Login />} /> {/* Default route */}
      </Routes>
    </Router>
  );
};




/*const App = () => {

  const router = createBrowserRouter([
    {
      path:"/login",
      element:<Login/>,
    },

    {
      path:"/register",
      element:<Register/>,
    },
  
  ]
  );
  <RouterProvider router={router}/>
  //inside return div
//<Info/>


  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

/*return (
  <div>
    <Info/>
  </div>
)
}*/

export default App;


