import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(
        formData.email,
        formData.password
      );

      login(data);

      navigate("/companies");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* ======================================
            LEFT BRAND SECTION
        ====================================== */}

        <div className="login-brand-section">

          <div className="login-brand-content">

            <div className="login-brand-logo">
              <i className="bi bi-grid-1x2-fill"></i>
            </div>

            <h1>
              Follow-up CRM
            </h1>

            <p className="login-brand-subtitle">
              Centralized Lead & Follow-up
              Management System
            </p>

            <div className="login-divider"></div>

            <div className="login-features">

              <div className="login-feature">
                <div className="login-feature-icon">
                  <i className="bi bi-people-fill"></i>
                </div>

                <div>
                  <strong>
                    Lead Management
                  </strong>

                  <span>
                    Manage and track leads efficiently
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <i className="bi bi-calendar-check"></i>
                </div>

                <div>
                  <strong>
                    Follow-up Tracking
                  </strong>

                  <span>
                    Never miss an important follow-up
                  </span>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-feature-icon">
                  <i className="bi bi-bar-chart-fill"></i>
                </div>

                <div>
                  <strong>
                    Reports & Analytics
                  </strong>

                  <span>
                    Get meaningful business insights
                  </span>
                </div>
              </div>

            </div>

          </div>

          <div className="login-brand-footer">
            <span>
              Secure Business Management
            </span>

            <span>
              <i className="bi bi-shield-check me-1"></i>
              Protected Access
            </span>
          </div>

        </div>

        {/* ======================================
            RIGHT LOGIN SECTION
        ====================================== */}

        <div className="login-form-section">

          <div className="login-form-wrapper">

            {/* MOBILE LOGO */}

            <div className="login-mobile-logo">
              <div className="login-logo-icon">
                <i className="bi bi-grid-1x2-fill"></i>
              </div>

              <div>
                <h4>Follow-up CRM</h4>
                <span>Management System</span>
              </div>
            </div>

            {/* HEADER */}

            <div className="login-form-header">

              <span className="login-welcome">
                Welcome back
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Enter your credentials to access
                the management dashboard.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error">

                <div className="login-error-icon">
                  <i className="bi bi-exclamation-circle-fill"></i>
                </div>

                <div>
                  <strong>
                    Login unsuccessful
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>

              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {/* EMAIL */}

              <div className="login-field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="login-input-wrapper">

                  <i className="bi bi-envelope login-input-icon"></i>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="login-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="login-field">

                <div className="login-password-label">

                  <label htmlFor="password">
                    Password
                  </label>

                </div>

                <div className="login-input-wrapper">

                  <i className="bi bi-lock login-input-icon"></i>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    className="login-input login-password-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    tabIndex="-1"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <i
                      className={`bi ${
                        showPassword
                          ? "bi-eye-slash"
                          : "bi-eye"
                      }`}
                    ></i>
                  </button>

                </div>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    <span>
                      Signing in...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Sign In
                    </span>

                    <i className="bi bi-arrow-right"></i>
                  </>
                )}

              </button>

            </form>

            {/* SECURITY INFO */}

            <div className="login-security">

              <i className="bi bi-shield-lock-fill"></i>

              <span>
                Your connection and account
                information are securely protected.
              </span>

            </div>

            <div className="login-copyright">
              © {new Date().getFullYear()} Follow-up CRM
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;