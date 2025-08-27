import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { Chat } from "./pages/Chat";

function App() {
  return (
    <>
       <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/send" element={<SendMoney />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:userId" element={<Chat />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
