import { Route, Routes } from "react-router"
import { RequireAuth } from "./auth/RequireAuth"
import { Layout } from "./components/Layout"
import { LinksPage } from "./pages/LinksPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/criar-conta" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<LinksPage />} />
      </Route>
    </Routes>
  )
}
