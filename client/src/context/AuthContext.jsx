import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // IMPORTANT:
  // true while we are checking localStorage.
  // Protected routes should wait for this to become false.
  const [loading, setLoading] = useState(true);

  // ============================================================
  // RESTORE AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const restoreAuthentication = () => {
      try {
        const storedToken =
          localStorage.getItem("token");

        const storedUser =
          localStorage.getItem("user");

        // No stored authentication
        if (
          !storedToken ||
          !storedUser ||
          storedUser === "undefined" ||
          storedUser === "null"
        ) {
          setToken(null);
          setUser(null);
          return;
        }

        // Parse stored user
        const parsedUser =
          JSON.parse(storedUser);

        // Validate stored user object
        if (
          !parsedUser ||
          typeof parsedUser !== "object"
        ) {
          throw new Error(
            "Invalid stored user data"
          );
        }

        // Restore authentication
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Failed to restore authentication:",
          error
        );

        // Clear corrupted authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
      } finally {
        // Authentication restoration is complete
        setLoading(false);
      }
    };

    restoreAuthentication();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = (data) => {
    if (!data?.token || !data?.user) {
      console.error(
        "Invalid login response:",
        data
      );

      return false;
    }

    try {
      const userData = data.user;
      const authToken = data.token;

      // Store authentication
      localStorage.setItem(
        "token",
        authToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      // Update React state
      setToken(authToken);
      setUser(userData);

      return true;
    } catch (error) {
      console.error(
        "Failed to save authentication:",
        error
      );

      return false;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    // Remove stored authentication
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear React authentication state
    setToken(null);
    setUser(null);
  };

  // ============================================================
  // AUTHENTICATED STATUS
  // ============================================================

  const isAuthenticated =
    Boolean(token && user);

  // ============================================================
  // CONTEXT
  // ============================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH
// ============================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};