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
  const [showPassword, setShowPassword] = useState(false);

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

        {/* =====================================================
            LEFT BRAND SECTION
        ===================================================== */}

        <section className="login-brand-section">

          {/* Decorative circles */}

          <div className="brand-decoration-top"></div>

          {/* =================================================
              BUILDING IMAGE
          ================================================= */}

          <div className="login-building-image">

            <img
              src="/midbrains-building.png"
              alt="Midbrains Technologies"
            />

          </div>


          {/* =================================================
              GOLD / NAVY BOTTOM CURVE
          ================================================= */}

          <div className="brand-gold-curve"></div>


          {/* =================================================
              BRAND CONTENT
          ================================================= */}

          <div className="login-brand-content">

            {/* LOGO */}

            <div className="login-brand-logo">

              <img
                src="/midbrains-logo.png"
                alt="Midbrains Technologies"
              />

            </div>


            {/* CRM BADGE */}

            <div className="crm-badge">

              <i className="bi bi-briefcase-fill"></i>

              <span>
                Follow-up CRM
              </span>

            </div>


            {/* MAIN HEADING */}

            <h1>
              Manage Leads,
              <span>
                Build Relationships
              </span>
            </h1>


            {/* DESCRIPTION */}

            <p className="login-brand-subtitle">
              A centralized platform to manage leads,
              follow-ups, admissions and business
              activities across your organization.
            </p>


            {/* =================================================
                FEATURES
            ================================================= */}

            <div className="login-features">

              {/* FEATURE 1 */}

              <div className="login-feature">

                <div className="login-feature-icon">
                  <i className="bi bi-people-fill"></i>
                </div>

                <div className="login-feature-content">

                  <strong>
                    Lead Management
                  </strong>

                  <span>
                    Capture and track leads efficiently
                  </span>

                </div>

              </div>


              {/* FEATURE 2 */}

              <div className="login-feature">

                <div className="login-feature-icon">
                  <i className="bi bi-calendar-check-fill"></i>
                </div>

                <div className="login-feature-content">

                  <strong>
                    Follow-up Tracking
                  </strong>

                  <span>
                    Never miss an important follow-up
                  </span>

                </div>

              </div>


              {/* FEATURE 3 */}

              <div className="login-feature">

                <div className="login-feature-icon">
                  <i className="bi bi-bar-chart-fill"></i>
                </div>

                <div className="login-feature-content">

                  <strong>
                    Reports & Analytics
                  </strong>

                  <span>
                    Get meaningful business insights
                  </span>

                </div>

              </div>


              {/* FEATURE 4 */}

              <div className="login-feature">

                <div className="login-feature-icon">
                  <i className="bi bi-buildings-fill"></i>
                </div>

                <div className="login-feature-content">

                  <strong>
                    Centralized Management
                  </strong>

                  <span>
                    Manage your business operations in one place
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              BRAND FOOTER
          ================================================= */}

          <div className="login-brand-footer">

            <span>
              <i className="bi bi-shield-check"></i>

              Secure Business Management
            </span>

            <span>
              <i className="bi bi-shield-lock"></i>

              Protected Access
            </span>

          </div>

        </section>


        {/* =====================================================
            RIGHT LOGIN SECTION
        ===================================================== */}

        <section className="login-form-section">

          {/* Decorative circles */}

          <div className="form-decoration form-decoration-top"></div>

          <div className="form-decoration form-decoration-bottom"></div>


          <div className="login-form-wrapper">

            {/* =================================================
                MOBILE LOGO
            ================================================= */}

            <div className="login-mobile-logo">

              <img
                src="/midbrains-logo.png"
                alt="Midbrains Technologies"
              />

            </div>


            {/* =================================================
                LOGIN HEADER
            ================================================= */}

            <div className="login-form-header">

              <span className="login-welcome">
                Welcome back
              </span>

              <h2>
                Sign in to your account
              </h2>

              <p>
                Enter your credentials to access the
                Follow-up CRM dashboard.
              </p>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

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


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              className="login-form"
              onSubmit={handleSubmit}
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

                <label htmlFor="password">
                  Password
                </label>

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


                  {/* SHOW / HIDE PASSWORD */}

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
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


              {/* =================================================
                  SIGN IN BUTTON
              ================================================= */}

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


            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="login-security">

              <i className="bi bi-shield-fill-check"></i>

              <span>
                Your connection and account information
                are securely protected.
              </span>

            </div>


            {/* COPYRIGHT */}

            <div className="login-copyright">
              © {new Date().getFullYear()} Midbrains Technologies
            </div>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Login;